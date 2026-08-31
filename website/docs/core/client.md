---
title: Client
---

`GlobalCacheClient` is the framework-independent API for reading and coordinating cached values. Use
it when building an integration or connecting an application to a Core server you operate.

## Connect to a server

```ts
import { GlobalCacheClient } from '@global-cache/core';

const globalCache = new GlobalCacheClient();

globalCache.config({
  serverUrl: 'http://localhost:3000',
});

const value = await globalCache.get('expensive-value', async () => {
  return performExpensiveWork();
});
```

Configure a reachable server URL before calling `get()`. The Playwright integration handles this
automatically for Playwright projects.

## Typed keys

Pass a schema to `GlobalCacheClient` to constrain both keys and values:

```ts
type CacheSchema = {
  'seeded-user-id': string;
  'feature-flags': Record<string, boolean>;
};

const globalCache = new GlobalCacheClient<CacheSchema>();

const userId = await globalCache.get('seeded-user-id', async () => {
  return database.createUser().then((user) => user.id);
});
```

See the [`GlobalCacheClient` API reference](./api/global-cache-client.md) for all client methods.
