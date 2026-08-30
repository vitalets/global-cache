---
title: Client
---

`GlobalCacheClient` is the framework-independent API for reading and coordinating cached values. Use
it when building an integration or when you already control the server lifecycle.

## Connect to a server

```ts
import { GlobalCacheClient } from '@global-cache/core';

const cache = new GlobalCacheClient();

cache.config({
  serverUrl: 'http://localhost:3000',
});

const value = await cache.get('expensive-value', async () => {
  return performExpensiveWork();
});
```

Calling `get()` without a server URL throws an error. A test-runner integration normally starts a
local server and propagates its URL before workers call the client.

## Start Core in the same process

For a small custom integration, the exported server can be started alongside the client:

```ts
import { GlobalCacheClient } from '@global-cache/core';
import { globalCacheServer } from '@global-cache/core/server';

await globalCacheServer.start({ basePath: '.global-cache' });

const cache = new GlobalCacheClient();
cache.config({ serverUrl: globalCacheServer.localUrl });

try {
  const result = await cache.get('seed', () => seedDatabase());
  // Use result...
} finally {
  await cache.resetTestRun();
  await globalCacheServer.stop();
}
```

The direct consumer owns shutdown and run boundaries. Playwright users should use the
[Playwright integration](../playwright/index.md), which manages those concerns automatically.

## Typed keys

Pass a schema to `GlobalCacheClient` to constrain both keys and values:

```ts
type CacheSchema = {
  'seeded-user-id': string;
  'feature-flags': Record<string, boolean>;
};

const cache = new GlobalCacheClient<CacheSchema>();

const userId = await cache.get('seeded-user-id', async () => {
  return database.createUser().then((user) => user.id);
});
```

See the [API reference](./api.md) for all client methods.
