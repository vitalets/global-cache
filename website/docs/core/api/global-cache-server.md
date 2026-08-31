---
title: GlobalCacheServer
---

Import the server from its dedicated entry point:

```ts
import { GlobalCacheServer } from '@global-cache/core/server';
```

## Constructor

```ts
new GlobalCacheServer()
```

Creates an independent server instance.

**Returns:** A new `GlobalCacheServer` instance.

## Methods

### `start`

```ts
server.start(config?: GlobalCacheServerConfig): Promise<void>
```

Starts the server.

**Parameters**

| Name     | Type                      | Description                                |
| -------- | ------------------------- | ------------------------------------------ |
| `config` | `GlobalCacheServerConfig` | Optional server configuration (see below). |

| Property   | Type     | Description                                                |
| ---------- | -------- | ---------------------------------------------------------- |
| `port`     | `number` | Listening port. Uses an available port when omitted.        |
| `basePath` | `string` | Persistent storage directory. Defaults to `.global-cache`. |

### `stop`

```ts
server.stop(): Promise<void>
```

Stops a running server. Calling it when the server is already stopped is safe.

## Properties

### `port`

```ts
server.port: number
```

The resolved listening port, or `0` before the server starts.

### `localUrl`

```ts
server.localUrl: string
```

The server URL using `localhost` and the resolved port.

### `isRunning`

```ts
server.isRunning: boolean
```

Whether the server is accepting connections.
