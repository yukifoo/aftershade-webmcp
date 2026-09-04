# Deployment and reproduction

## Build inputs

- Node.js `>=22.13.0`
- npm lockfile committed
- no environment variables
- no database, object storage, authentication, or external API
- `.openai/hosting.json` contains the opaque Sites project binding but no credential

## Local production build

```bash
npm ci
npm run check:webmcp
npm run build
```

The Cloudflare-compatible vinext output is generated under `dist/` and intentionally ignored by Git.

## OpenAI Sites release gates

1. Run the focused lint, contract suite, and production build.
2. Commit the exact validated source state.
3. Push that exact commit to the Sites source repository using the short-lived credential only for the Git command. Never write the token to disk.
4. Package validated build output with the Sites `package-site.sh` helper.
5. Save a Site version using the full pushed commit SHA and unchanged archive.
6. Deploy the saved version.
7. Wait for the terminal deployment status and open the returned HTTPS URL.
8. Discover and invoke WebMCP from production; verify DOM-visible revision and metrics.

## Public judge access

The final Site must be public, require no account, and remain free and unchanged through the judging period. Public access and the final production publication are identity-bound external changes and should be approved deliberately.

## Rollback

Every deployment points to an immutable saved Site version. If the final version fails its production smoke, redeploy the previously verified version and do not change the submission links until all live checks pass.
