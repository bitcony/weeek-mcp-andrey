# WEEEK MCP for personal Hermes

This clone supports the personal Hermes `default` profile only.
Upstream: https://github.com/IlyaIvanchikov/weeek-mcp.

- Keep credentials out of this repository, logs, and chat.
- Profile secret: `/root/.hermes/weeek.env`, permission `0600`.
- Launch through the Hermes MCP config with a clean process environment.
- This is the maintained local fork `weeek-mcp-andrey`; keep upstream author attribution and MIT LICENSE. Remote `upstream` is the source project, not our publication destination.
- Follow `docs/MAINTENANCE.md` and `docs/TESTING.md` for API updates and acceptance tests. Keep `docs/api/openapi-baseline.json` and the complete API mapping in Git.
- Use the approved tool allowlist; broaden it only for an explicitly authorized role.
- Tool discovery is not evidence of WEEEK account authorization.
- Verify reads before writes. Live acceptance is read-only by default. Test writes require explicit approval, `--write`, `WEEEK_LIVE_WRITE=YES` and project/funnel IDs. Never test by mutating existing business cards.
- Keep live run journals under ignored `reports/`; promote reviewed historical evidence to `docs/evidence/` without secrets.
- Run `npm run verify`, `npm run api:matrix`, `npm audit --omit=dev`, and `git diff --check` for a release. Never automatically accept a changed API baseline or deploy untested new tools.
