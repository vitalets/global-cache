---
title: GlobalCacheClient
---

Import the cache client from the main Core entry point:

```ts
import { GlobalCacheClient } from '@global-cache/core';
```

## Constructor

```ts
new GlobalCacheClient()
new GlobalCacheClient<Schema>()
```

Creates a cache client. The optional `Schema` maps cache keys to their value types.

**Type parameters**

| Name     | Description                                      |
| -------- | ------------------------------------------------ |
| `Schema` | The key/value schema used to type cache entries. |

**Returns:** A new `GlobalCacheClient<Schema>` instance.

## Methods

### `config`

```ts
client.config(config: GlobalCacheConfig): void
```

Updates the global client configuration. See [Configuration](../configuration.md).

**Parameters**

| Name     | Type                | Description                 |
| -------- | ------------------- | --------------------------- |
| `config` | `GlobalCacheConfig` | The configuration to apply. |

### `get`

```ts
client.get(key, computeFn)
client.get(key, { ttl }, computeFn)
```

Returns the cached value, or computes, stores, and returns it when no reusable value exists.

**Parameters**

| Name        | Type                                       | Description                                                                       |
| ----------- | ------------------------------------------ | --------------------------------------------------------------------------------- |
| `key`       | `keyof Schema & string`                    | The cache key. Its schema entry determines the value type.                        |
| `options`   | `{ ttl?: TTL }`                            | Optional settings. Omit it to keep the value only for the current run.            |
| `computeFn` | `() => Schema[Key] \| Promise<Schema[Key]>` | Computes the value on a cache miss.                                                |

`ttl` accepts milliseconds, an [`ms`](https://github.com/vercel/ms)-compatible string such as
`'1 hour'`, or `'infinite'`.

**Returns:** `Promise<Schema[Key]>` containing the cached or computed value.

### `getStale`

```ts
client.getStale(key): Promise<Schema[Key] | undefined>
```

Returns the value available for cleanup. For non-persistent keys this is the current value; for a
replaced persistent key it is the previous value.

**Parameters**

| Name  | Type                    | Description            |
| ----- | ----------------------- | ---------------------- |
| `key` | `keyof Schema & string` | The cache key to read. |

**Returns:** The stale value, or `undefined` when none is available.

### `getStaleList`

```ts
client.getStaleList<Value>(prefix: string): Promise<Value[]>
```

Returns cleanup values for all keys beginning with a prefix.

**Type parameters**

| Name    | Description                               |
| ------- | ----------------------------------------- |
| `Value` | The expected type of each returned value. |

**Parameters**

| Name     | Type     | Description                     |
| -------- | -------- | ------------------------------- |
| `prefix` | `string` | The prefix used to select keys. |

**Returns:** A promise resolving to the matching stale values.

### `delete`

```ts
client.delete(key): Promise<void>
```

Removes a key from both in-memory and persistent storage. The next `get()` recomputes it.

**Parameters**

| Name  | Type                    | Description              |
| ----- | ----------------------- | ------------------------ |
| `key` | `keyof Schema & string` | The cache key to remove. |

### `resetTestRun`

```ts
client.resetTestRun(): Promise<void>
```

Starts a fresh local cache scope by clearing run-scoped values. Externally coordinated runs using
`GLOBAL_CACHE_RUN_ID` are not changed.
