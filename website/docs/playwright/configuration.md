---
title: Configuration
---

Global Cache can be enabled from the Playwright configuration file. To use it with the default options,
define your Playwright config as usual and pass it to `globalCache.wrap()`:

```ts title="playwright.config.ts"
import { defineConfig } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

const config = defineConfig({
  // ...your Playwright config
});

export default globalCache.wrap(config);
```

## Custom options

To customize Global Cache, call `globalCache.config()` with the options you want before wrapping the
Playwright config:

```ts title="playwright.config.ts"
import { defineConfig } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

const config = defineConfig({
  // ...your Playwright config
});

globalCache.config({
  basePath: '.cache/global-cache',
  ignoreTTL: Boolean(process.env.CI),
  disabled: process.env.DISABLE_GLOBAL_CACHE === '1',
});

export default globalCache.wrap(config);
```

## Options

| Option | Type | Default | Purpose |
| --- | --- | --- | --- |
| `basePath` | `string` | `.global-cache` | Directory for values persisted with a TTL. |
| `ignoreTTL` | `boolean` | `false` | Treat TTL values as run-scoped. Useful when persistence across CI runs is unnecessary. |
| `disabled` | `boolean` | `false` | Disable reads and writes so every computation runs locally. |
| `serverUrl` | `string` | — | Use an externally managed Core server instead of starting a local one. |

The `DISABLE_GLOBAL_CACHE` variable in the example is project-defined. There is no built-in
`GLOBAL_CACHE_DISABLE` variable.

## Shards and external servers

Set both `serverUrl` and `GLOBAL_CACHE_RUN_ID` when independently launched Playwright processes or
shards should reuse the same run-scoped values:

```bash
GLOBAL_CACHE_RUN_ID="$CI_PIPELINE_ID" pnpm playwright test --shard=1/2
```

All participating processes must use the same stable run ID and reachable server URL. The system
that assigns the run ID should also decide when the shared run has finished and can be cleaned up.

## Manual Playwright configuration

Use `wrap()` for normal configuration. If another wrapper requires manual composition, add both
Global Cache entries:

```ts title="playwright.config.ts"
export default defineConfig({
  globalSetup: globalCache.setup,
  reporter: [[globalCache.reporter], ['html']],
});
```

Both entries are required so values are available before tests start and cleanup completes after the
full execution. Do not add a Global Cache teardown.
