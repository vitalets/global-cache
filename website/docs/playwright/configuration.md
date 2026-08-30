---
title: Configuration
---

Call `globalCache.config()` before wrapping the Playwright config:

```ts title="playwright.config.ts"
import { defineConfig } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

globalCache.config({
  basePath: '.global-cache',
  ignoreTTL: Boolean(process.env.CI),
});

export default globalCache.wrap(
  defineConfig({
    testDir: './tests',
  }),
);
```

## Options

| Option | Type | Default | Purpose |
| --- | --- | --- | --- |
| `basePath` | `string` | `.global-cache` | Directory for values persisted with a TTL. |
| `ignoreTTL` | `boolean` | `false` | Treat TTL values as run-scoped. Useful when persistence across CI runs is unnecessary. |
| `disabled` | `boolean` | `false` | Disable reads and writes so every computation runs locally. |
| `serverUrl` | `string` | — | Use an externally managed Core server instead of starting a local one. |

For example, make cache bypass explicit through your own environment variable:

```ts
globalCache.config({
  disabled: process.env.DISABLE_GLOBAL_CACHE === '1',
});
```

There is no built-in `GLOBAL_CACHE_DISABLE` variable. Global Cache serializes configured options into
`GLOBAL_CACHE_CONFIG` for worker processes; call `config()` rather than constructing that internal
value yourself.

## Shards and external servers

Set both `serverUrl` and `GLOBAL_CACHE_RUN_ID` when independently launched Playwright processes should
share the same Core server and test-run state:

```bash
GLOBAL_CACHE_RUN_ID="$CI_PIPELINE_ID" pnpm playwright test --shard=1/2
```

All shards must use the same stable run ID and reachable server URL. With an external run ID, Global
Cache leaves run cleanup to the external coordinator.

## Manual Playwright configuration

`wrap()` is preferred because it composes existing hooks safely. If another wrapper makes manual setup
necessary, add the setup and reporter without adding a teardown:

```ts title="playwright.config.ts"
export default defineConfig({
  globalSetup: globalCache.setup,
  reporter: [[globalCache.reporter], ['html']],
});
```

The reporter is required: its `onEnd()` hook runs cleanup and resets run-scoped values after every test
execution. Playwright's `globalSetup` and `globalTeardown` are not re-run reliably for every execution
in UI mode and the VS Code extension.
