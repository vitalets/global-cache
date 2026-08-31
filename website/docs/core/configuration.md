---
title: Configuration
---

Core clients need the URL of a running server. Configure the client before its first cache call and,
when using child workers, before starting those workers:

```ts
import { GlobalCacheClient } from '@global-cache/core';

const globalCache = new GlobalCacheClient();

globalCache.config({
  serverUrl: 'http://localhost:3000',
  ignoreTTL: Boolean(process.env.CI),
});
```

## Client options

| Option | Type | Default | Purpose |
| --- | --- | --- | --- |
| `ignoreTTL` | `boolean` | `false` | Treat every value as non-persistent. Useful when cross-run persistence has no value in CI. |
| `disabled` | `boolean` | `false` | Compute every value locally without reading or writing the cache. |
| `serverUrl` | `string` | — | URL of the Core server that handles cache operations. Required unless caching is disabled. |
| `basePath` | `string` | `.global-cache` | Persistence path available to integrations that manage a local server, including the Playwright integration. |

For direct Core usage, pass the persistence path to the server when starting it. Setting the client's
`basePath` alone does not start or configure a Core server:

```ts
import { GlobalCacheClient } from '@global-cache/core';
import { globalCacheServer } from '@global-cache/core/server';

const globalCache = new GlobalCacheClient();

await globalCacheServer.start({ basePath: '.global-cache' });
globalCache.config({ serverUrl: globalCacheServer.localUrl });
```

See [Architecture](./architecture.md) for the complete startup sequence and how child workers learn
the selected server port.

## Shared run IDs

Set `GLOBAL_CACHE_RUN_ID` before launching workers when independently started processes or shards
should reuse the same run-scoped values:

```bash
GLOBAL_CACHE_RUN_ID="$CI_PIPELINE_ID" pnpm test
```

Do not reuse a run ID across unrelated concurrent executions. They would share non-persistent keys.

## Persistence directory

Add `.global-cache`—or your custom `basePath`—to `.gitignore`. Persistent entries are runtime data and
should not be committed.
