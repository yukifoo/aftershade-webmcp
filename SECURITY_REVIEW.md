# Lightweight security review

## 2026-09-05 remediation

- Updated React/RSC to 19.2.8, vinext to 1.0.0-beta.9, Vite to 8.2.2, and the compatible Cloudflare/RSC tooling. The refreshed npm lockfile audit reports **0 vulnerabilities**, compared with 11 affected dependency nodes before the update. No forced peer-dependency resolution or audit overrides were used.
- Added a per-response nonce CSP in `proxy.ts`. Caller-supplied CSP/nonce headers are replaced before rendering; inline scripts require that nonce. Script `unsafe-inline` and production `unsafe-eval` are disallowed. Inline styles remain necessary for map/UI positioning.
- Restricted frames to the same origin and ChatGPT origins; disallowed objects and base URLs. Added `nosniff`, a restrictive referrer policy, and host-only one-year HSTS to Worker responses. Static-asset rules in `public/_headers` pass in local Wrangler, but the Sites asset service does not apply them (confirmed after publication). HSTS does not request preload or include sibling subdomains.
- Forced dynamic document rendering and `private, no-store` so cached HTML cannot reuse or mismatch a CSP nonce. Hashed static assets remain cacheable.
- Added `npm run check:security -- <origin>` to verify fresh nonces, hostile header replacement, all hydration script nonces, security headers, and JavaScript asset delivery without changing browser state. Run it against `npm start -- --port 4173` after building, and repeat against the deployed origin.

Production document checks pass with `npm run check:security -- https://aftershade-webmcp.yukifoo.chatgpt.site --document-only`. The explicit flag excludes static-asset security headers only; asset HTTP status and JavaScript content type are still verified. The full default check intentionally fails on Sites until the host supports `_headers` or equivalent asset response configuration. The document's CSP protects script execution independently. No available Sites configuration tool exposes static-response header controls, so this remaining host limitation is not reported as fixed.

The existing 11-tool WebMCP contract suite and focused lint pass with the upgraded dependency tree. Git history, GitHub security settings, and browser-host authorization remain outside this remediation. Dependency audit results are a point-in-time advisory check, not a guarantee against undisclosed issues.

## Original review

Reviewed on 2026-09-04 before the challenge release.

## Scope

The review covered all tracked source and documentation, current worktree changes, WebMCP input and mutation boundaries, browser-local persistence, React rendering, dependency provenance, secret exposure, and Sites configuration. Generated output and dependency source were excluded; their manifests, lockfile, and production build were reviewed instead.

## Findings and remediation

1. **Stale reset and revision reuse — low.** The reset tool previously accepted only `confirm: true`, bypassed the optimistic concurrency check used by other writes, returned the state to revision 1, and cleared undo history. It now requires `expectedRevision`, rejects stale resets, advances the revision monotonically, and preserves a recoverable pre-reset snapshot.
2. **Unbounded plan creation — low.** A repeated agent loop could grow full-state cloning, storage, rendering, and read-tool output without an aggregate bound. A scenario now accepts at most eight plan branches and rejects the next creation before mutation.

Both regression paths are executable in `npm run check:webmcp`.

## Negative results

No first-party XSS sink, credential or private-key material, runtime external request, server route, database binding, command execution, dynamic code evaluation, or cross-user data store was found. Tool handlers independently validate runtime input instead of relying only on host JSON Schema enforcement.

## Limitations

The review was offline. The lockfile uses HTTPS npm registry artifacts with integrity metadata and exact direct versions, but current package advisory status was not refreshed from an authoritative online database. Production response headers and browser-host authorization behavior are platform controls outside this repository and are checked separately during release validation.
