---
title: API reference
---

The package exports a ready-to-use `GlobalCache` singleton:

```ts
import { globalCache } from '@global-cache/playwright';
```

## Methods

### `config`

```ts
globalCache.config(config: GlobalCacheConfig): void
```

Updates cache configuration. Call it before `wrap()`. See [Configuration](./configuration.md).

**Parameters**

| Name     | Type                | Description                 |
| -------- | ------------------- | --------------------------- |
| `config` | `GlobalCacheConfig` | The configuration to apply. |

### `wrap`

```ts
globalCache.wrap(config, options?): PlaywrightConfig
```

Enables Global Cache on a Playwright configuration while preserving its existing settings.

**Parameters**

| Name      | Type                   | Description                                         |
| --------- | ---------------------- | --------------------------------------------------- |
| `config`  | `PlaywrightLikeConfig` | The Playwright configuration to extend.             |
| `options` | [`WrapOptions`](#wrapoptions) | Optional cleanup settings for the integration. |

**Returns:** The supplied Playwright config with Global Cache enabled.

### `get`

```ts
globalCache.get(key, computeFn)
globalCache.get(key, { ttl }, computeFn)
```

Returns the cached value, or computes, stores, and returns it when no reusable value exists.

**Parameters**

| Name        | Type                                       | Description                                                                           |
| ----------- | ------------------------------------------ | ------------------------------------------------------------------------------------- |
| `key`       | `keyof Schema & string`                    | The cache key. Its schema entry determines the value type.                            |
| `options`   | `{ ttl?: TTL }`                            | Optional settings. Omit this argument to keep the value only for the current run.     |
| `computeFn` | `() => Schema[Key] \| Promise<Schema[Key]>` | Computes the value on a cache miss.                                                    |

`ttl` accepts milliseconds, an [`ms`](https://github.com/vercel/ms)-compatible string, or
`'infinite'`.

**Returns:** `Promise<Schema[Key]>` containing the cached or computed value.

### `getStale`

```ts
globalCache.getStale(key): Promise<Schema[Key] | undefined>
```

Returns the value available for end-of-run cleanup.

**Parameters**

| Name  | Type                    | Description            |
| ----- | ----------------------- | ---------------------- |
| `key` | `keyof Schema & string` | The cache key to read. |

**Returns:** The stale value, or `undefined` when none is available.

### `getStaleList`

```ts
globalCache.getStaleList<Value>(prefix: string): Promise<Value[]>
```

Returns cleanup values for every key beginning with a prefix.

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
globalCache.delete(key): Promise<void>
```

Removes a value from memory and persistent storage. The next `get()` recomputes it.

**Parameters**

| Name  | Type                    | Description              |
| ----- | ----------------------- | ------------------------ |
| `key` | `keyof Schema & string` | The cache key to remove. |

### `resetTestRun`

```ts
globalCache.resetTestRun(): Promise<void>
```

Starts a fresh local cache scope by clearing run-scoped values. The Playwright integration manages
this automatically; most users should not call it themselves.

## Properties

### `setup`

```ts
globalCache.setup: string
```

Module path used for [manual Playwright configuration](./configuration.md#manual-playwright-configuration).
Normal configurations should use `wrap()` instead.

### `reporter`

```ts
globalCache.reporter: string
```

Reporter path used for [manual Playwright configuration](./configuration.md#manual-playwright-configuration).
It ensures cleanup completes after the full test execution. Normal configurations should use
`wrap()` instead.

## Types

### `GlobalCache`

```ts
class GlobalCache<Schema extends DefaultKeysSchema = DefaultKeysSchema>
```

The Playwright-aware client class. Provide a key/value schema for strict typing.

**Type parameters**

| Name     | Description                                      |
| -------- | ------------------------------------------------ |
| `Schema` | The key/value schema used to type cache entries. |

### `WrapOptions`

```ts
type WrapOptions = {
  cleanup?: () => Promise<void> | void;
};
```

The options accepted by `wrap()`.

| Property  | Type                           | Description                                     |
| --------- | ------------------------------ | ----------------------------------------------- |
| `cleanup` | `() => void \| Promise<void>` | Callback invoked after all tests while cleanup values are still available. |
