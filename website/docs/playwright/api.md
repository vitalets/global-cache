---
title: API reference
---

Import the singleton used by the integration:

```ts
import { globalCache } from '@global-cache/playwright';
```

## Playwright lifecycle

### `globalCache.wrap(config, options?)`

Returns a Playwright config with Global Cache's setup and reporter composed with existing values.

`options.cleanup` is an optional synchronous or asynchronous callback. It runs after all tests finish
and before run-scoped data resets. See [Cleanup](./guides/cleanup.md).

### `globalCache.setup`

Absolute path to the Playwright global-setup module. Intended for advanced manual configuration.

### `globalCache.reporter`

Absolute path to the Playwright reporter module. The reporter runs cleanup and `resetTestRun()` from
`onEnd()`. There is intentionally no `globalCache.teardown` export.

## Cache client

### `globalCache.config(config)`

Updates cache configuration. Call it before `wrap()`. See [Configuration](./configuration.md).

### `globalCache.get(key, computeFn)`

### `globalCache.get(key, { ttl }, computeFn)`

Returns the cached value or computes, stores, and returns it. A TTL accepts milliseconds, an
[`ms`](https://github.com/vercel/ms)-compatible string, or `'infinite'`.

### `globalCache.getStale(key)`

Returns the value available for end-of-run cleanup, or `undefined`.

### `globalCache.getStaleList(prefix)`

Returns cleanup values for every key beginning with `prefix`.

### `globalCache.delete(key)`

Removes a value from memory and persistent storage. The next `get()` recomputes it.

### `globalCache.resetTestRun()`

Clears non-persistent values and creates a new local run ID. The reporter calls this automatically;
most Playwright users should not call it themselves.

## Types

### `GlobalCache<Schema>`

The Playwright-aware client class. Provide a key/value schema for strict typing.

### `WrapOptions`

The options accepted by `wrap()`. Currently contains the optional `cleanup` callback.
