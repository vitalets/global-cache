---
title: Server
---

The Core server is a small HTTP service that lets clients in different processes share in-memory and
persistent values. Run it wherever every participating client can reach it.

```ts
import { globalCacheServer } from '@global-cache/core/server';

await globalCacheServer.start({
  port: 3000,
  basePath: '.global-cache',
});

console.log(globalCacheServer.localUrl);
```

## Configuration

| Option | Type | Default | Purpose |
| --- | --- | --- | --- |
| `port` | `number` | `0` | Listening port. `0` selects an available local port. |
| `basePath` | `string` | `.global-cache` | Directory for persistent values. |

The server accepts JSON request bodies up to 10 MB. Cache values must be serializable across the HTTP
boundary.

## Starting and stopping

Call `start()` before clients request values, then use `localUrl` to configure those clients. Call
`stop()` when the application no longer needs the cache. Test-runner integrations can manage these
steps for their users; the Playwright integration does so automatically.

## External servers and shards

Clients connect through the `serverUrl` option. To share run-scoped values across shards, give every
shard the same `GLOBAL_CACHE_RUN_ID` and server URL. The system coordinating those shards should use a
new run ID for each unrelated execution.
