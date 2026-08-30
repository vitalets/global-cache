---
title: Server
---

The Core server is a small HTTP service that owns the shared in-memory and persistent storage. It is
exported separately so importing the client in every worker does not also load the server runtime.

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

## Lifecycle

`start()` starts the HTTP server and exposes its resolved address through `localUrl` and `port`.
`stop()` closes it. The server handle is unreferenced, so it does not keep a Node.js process alive by
itself; the host integration or application must own the surrounding lifecycle.

In the Playwright integration, global setup starts the server before workers run. The server is not
stopped by the reporter: it exits naturally with the Playwright process in CLI mode and remains
available for subsequent executions when Playwright UI mode or the VS Code extension keeps the main
process alive.

## External servers and shards

Clients can connect through the `serverUrl` client option. To make multiple shards share one in-memory
run, give them the same `GLOBAL_CACHE_RUN_ID` as well as the same server URL. The process running the
server is responsible for deciding when shared state may be cleared.
