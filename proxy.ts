import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // A fresh nonce must reach both the renderer and the browser. Never accept
  // a nonce or CSP supplied by the caller.
  const nonce = btoa(crypto.randomUUID());
  const isDevelopment = process.env.NODE_ENV === 'development';
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ''}`,
    // The map and UI primitives use inline style attributes.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${isDevelopment ? ' ws: wss:' : ''}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    // Preserve ChatGPT embedding while blocking unrelated framing origins.
    "frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com",
  ].join('; ');
  const headers = new Headers(request.headers);
  headers.set('Content-Security-Policy', policy);
  headers.set('x-nonce', nonce);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', policy);
  // Worker-rendered responses need these too; public/_headers covers assets.
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000');
  // A cached document must never be paired with a different request's nonce.
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.svg).*)'],
};
