---
title: API reference
---

Core provides a client for requesting shared values and a small HTTP server that coordinates those
requests across processes. Most code uses the client; use the server API when you need to host the
cache yourself or build another integration.

## [`GlobalCacheClient`](./api/global-cache-client.md)

The typed key/value client exported from `@global-cache/core`. Use it to configure the cache, read or
compute values, retrieve stale values for cleanup, and delete entries.

```ts
import { GlobalCacheClient } from '@global-cache/core';
```

## [`GlobalCacheServer`](./api/global-cache-server.md)

The HTTP cache server exported from `@global-cache/core/server`. Integrations usually manage it for
you; import it directly when building an integration or running a standalone server.

```ts
import { GlobalCacheServer } from '@global-cache/core/server';
```
