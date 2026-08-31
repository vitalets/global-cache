---
title: Configuration
---

Configure a client before its first cache call:

```ts
cache.config({
  basePath: '.global-cache',
  ignoreTTL: Boolean(process.env.CI),
});
```

## Client options

| Option | Type | Default | Purpose |
| --- | --- | --- | --- |
| `basePath` | `string` | `.global-cache` | Persistent storage directory for a locally managed server. |
| `ignoreTTL` | `boolean` | `false` | Treat every value as non-persistent. Useful when cross-run persistence has no value in CI. |
| `disabled` | `boolean` | `false` | Compute every value locally without reading or writing the cache. |
| `serverUrl` | `string` | — | Connect to an externally managed Core server. |

When `serverUrl` is set, the external server controls its own persistence path, so the client's
`basePath` is ignored.

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
