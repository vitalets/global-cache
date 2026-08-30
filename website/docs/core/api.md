---
title: API reference
---

## `@global-cache/core`

### `new GlobalCacheClient<Schema>()`

Creates a cache client. The optional `Schema` maps string keys to their value types.

### `client.config(config)`

Updates the global client configuration. See [Configuration](./configuration.md).

### `client.get(key, computeFn)`

### `client.get(key, { ttl }, computeFn)`

Returns the cached value or computes, stores, and returns it. `ttl` accepts milliseconds, an
[`ms`](https://github.com/vercel/ms)-compatible string such as `'1 hour'`, or `'infinite'`.

### `client.getStale(key)`

Returns the value available for cleanup, or `undefined`. For non-persistent keys this is the current
value; for replaced persistent keys it is the previous value.

### `client.getStaleList(prefix)`

Returns cleanup values for all keys beginning with `prefix`.

### `client.delete(key)`

Removes a key from both in-memory and persistent storage. The next `get()` recomputes it.

### `client.resetTestRun()`

Clears non-persistent values for the current locally managed run and creates a new run ID. It does
nothing when there is no server or when the run ID came from `GLOBAL_CACHE_RUN_ID`.

### `globalConfig`

The shared configuration singleton used by integrations. Most consumers should configure a client
through `client.config()` instead.

### `logger`

The Core logger used for lifecycle warnings and errors.

## `@global-cache/core/server`

### `new GlobalCacheServer()`

Creates an independent server instance.

### `server.start(config?)`

Starts the server. The configuration accepts `port` and `basePath`.

### `server.stop()`

Stops a running server. Calling it when the server is already stopped is safe.

### `server.port`

The resolved listening port, or `0` before the server starts.

### `server.localUrl`

The server URL using `localhost` and the resolved port.

### `server.isRunning`

Whether the underlying HTTP server is listening.

### `globalCacheServer`

The package's default `GlobalCacheServer` instance.
