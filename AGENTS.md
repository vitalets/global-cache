# global-cache

Playwright E2E test optimization library. Caches shared data (auth sessions, DB seeds, computed values) across parallel workers via a central HTTP server.

## Monorepo Structure

- `packages/core` — HTTP server, REST API, key-value storage, cache client
- `packages/playwright` — Playwright config wrapper with setup/teardown/reporter
- `examples/` — Demo projects (not published)

Package manager: **pnpm 11** with workspaces. Build orchestration: **Turbo**.

## Lifecycle Architecture (`packages/playwright`)

Playwright's `globalSetup` and `globalTeardown` are **not called reliably** in VSCode
extension and UI mode — these modes keep the main process alive between runs and only
re-invoke `globalSetup` once at the very first run:
- https://github.com/microsoft/playwright/issues/33193
- https://github.com/microsoft/playwright/issues/37524

Reporters have `onEnd()` called on **every** test execution in all modes, making the
reporter the only reliable lifecycle hook. This shapes the design:

- **`globalSetup` (`setup.ts`)**: starts the HTTP server. Still used because it runs
  before any test, giving workers a valid server URL via env vars.
  The server is started with `server.unref()` so it does not prevent the Node.js
  process from exiting naturally in CLI mode. In VSCode / UI mode Playwright's own
  IPC channels keep the process alive, so the server stays up for subsequent runs.

- **`globalTeardown`**: intentionally **not used**. Server stop and cache reset must
  happen in reporter `onEnd()`. Playwright guarantees teardown runs *before* reporter
  `onEnd`, so stopping the server there would break `getStale()` calls in `onCleanup`.

- **reporter `onEnd()`** (`reporter.ts`): owns the full end-of-run sequence:
  1. Run user's `onCleanup` callback (`getStale()` values still available).
  2. Reset test-run state (clear non-persistent keys, generate new run ID).
  The server is NOT stopped here — `unref()` lets it die with the process in CLI
  mode, and keeps it alive automatically in VSCode / UI mode.
