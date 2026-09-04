# Lightweight security review

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
