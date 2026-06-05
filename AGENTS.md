# global-cache

Playwright E2E test optimization library. Caches shared data (auth sessions, DB seeds, computed values) across parallel workers via a central HTTP server.

## Monorepo Structure

- `packages/core` — HTTP server, REST API, key-value storage, cache client
- `packages/playwright` — Playwright config wrapper with setup/teardown/reporter
- `examples/` — Demo projects (not published)

Package manager: **pnpm 11** with workspaces. Build orchestration: **Turbo**.
