import assert from 'node:assert/strict';

// Run against the production build, locally or after deployment. Requests only
// read the page/assets; they never call the state-changing WebMCP tools.
const origin = new URL(process.argv[2] ?? 'http://localhost:4173');
// Sites currently serves assets outside the Worker and does not apply _headers.
// Keep the full asset check as the default for compatible Cloudflare hosts.
const documentOnly = process.argv.includes('--document-only');
const nonces = new Set();
for (let attempt = 0; attempt < 2; attempt += 1) {
  const response = await fetch(origin, {
    headers: { 'x-nonce': 'attacker-controlled', 'Content-Security-Policy': "script-src 'unsafe-inline'" },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.equal(response.headers.get('strict-transport-security'), 'max-age=31536000');
  assert.match(response.headers.get('cache-control') ?? '', /no-store/);
  const policy = response.headers.get('content-security-policy') ?? '';
  const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
  assert.ok(nonce && nonce !== 'attacker-controlled');
  assert.ok(!nonces.has(nonce), 'nonce must change on every request');
  nonces.add(nonce);
  const scriptPolicy = policy.split(';').find((part) => part.trim().startsWith('script-src '));
  assert.ok(scriptPolicy?.includes("'strict-dynamic'"));
  assert.ok(!scriptPolicy.includes('unsafe-inline') && !scriptPolicy.includes('unsafe-eval'));
  assert.ok(policy.includes("object-src 'none'") && policy.includes("base-uri 'none'"));
  assert.ok(policy.includes("frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com"));
  const html = await response.text();
  assert.ok(html.includes('Aftershade'));
  const scripts = [...html.matchAll(/<script\b([^>]*)>/gi)];
  assert.ok(scripts.length > 0, 'rendered document must contain hydration scripts');
  for (const [, attributes] of scripts) {
    assert.equal(attributes.match(/\bnonce="([^"]+)"/)?.[1], nonce, 'every hydration script must use the response nonce');
  }
  const modulePath = scripts.map(([, attributes]) => attributes.match(/\bsrc="([^"]+)"/)?.[1]).find(Boolean);
  assert.ok(modulePath);
  const asset = await fetch(new URL(modulePath, origin));
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get('content-type') ?? '', /javascript/);
  if (!documentOnly) assert.equal(asset.headers.get('x-content-type-options'), 'nosniff');
}
console.log('Security headers: fresh nonces, caller-header replacement, all hydration scripts, framing policy, no-store, and script asset delivery passed.');
if (documentOnly) console.log('Asset security headers excluded explicitly: the Sites asset service does not apply public/_headers.');
