---
title: Architecture
---

Global Cache consists of two main parts: a tiny HTTP server and one or more clients. The test runner
starts the server during setup. Each test worker creates a Global Cache client and uses it to
read and write cached values.

```text
Test runner process
  ├─ starts Global Cache server on an available port
  ├─ passes the server URL and test-run ID to workers
  └─ starts worker processes
       ├─ worker client ─┐
       ├─ worker client ─┼─ HTTP ─> Global Cache server ─> memory / .global-cache
       └─ worker client ─┘
```

## Startup and port discovery

By default, the server asks the operating system to choose an available port. After `start()`
resolves, `globalCacheServer.localUrl` contains the URL with the selected port. Configure the client
with this URL before starting workers:

```ts
import { GlobalCacheClient } from '@global-cache/core';
import { globalCacheServer } from '@global-cache/core/server';

const globalCache = new GlobalCacheClient();

await globalCacheServer.start({
  basePath: '.global-cache',
});

globalCache.config({
  serverUrl: globalCacheServer.localUrl,
});

// Start workers only after the server URL has been configured.
await startTestWorkers();
```

To use a fixed port, pass it to `start()`. This can be useful for independently started processes,
but the chosen port must be available.

## How workers receive the URL

Calling `globalCache.config()` saves the server URL and test-run ID in the test runner's environment.
Child workers started afterward inherit these values. Their clients can connect without configuring
the port again.

Independently started processes, containers, or machines do not inherit this configuration. Configure
each one with the same reachable `serverUrl`. To share run-scoped values as well, give them the same
`GLOBAL_CACHE_RUN_ID`.

## Lifecycle ownership

The test runner owns the local server lifecycle. It starts the server before workers, resets
run-scoped state after each test run, and stops the server when the integration shuts down. Clients
only communicate with the server; they do not start or stop it.

Cleanup can inspect the value that is about to stop being current:

- For a non-persistent key, `getStale(key)` returns the current value before the run is cleared.
- For a persistent key replaced during the run, it returns the previous value while preserving the
  new value for later runs.

`getStaleList(prefix)` applies the same rule to every matching key, which is useful when cleaning up a
group of dynamically named resources.

The [Playwright integration](../playwright/index.md) handles this lifecycle automatically. It starts
a local server unless an external `serverUrl` is configured, then passes the URL to Playwright
workers. Direct Core consumers implement these steps in their own test runner integration.

## Compute-once coordination

Every cached value has a string key and a computation function:

```ts
const user = await globalCache.get('seeded-user', async () => {
  return database.createUser();
});
```

The first client requesting a key performs the computation. Other clients requesting the same key
wait. When the computation succeeds, the server stores its result and returns it to every waiting
client.

Values cross an HTTP boundary, so computations should return JSON-serializable data such as strings,
numbers, booleans, arrays, plain objects, `null`, or `undefined`. Class instances and other values that
depend on prototypes do not survive serialization.

### Keys and signatures

A key identifies one logical value. When a computation depends on parameters, include every
parameter that can change the result in the key:

```ts
const profile = await globalCache.get(`profile-${userId}`, () => loadProfile(userId));
```

Global Cache also creates a signature from the computation, TTL, and call site. If the same key is
used by incompatible call sites during one run, Global Cache warns instead of silently overwriting
the value. Use one canonical computation per key.

## Persistent values

Passing a TTL stores a value on the filesystem as well as in memory:

```ts
const token = await globalCache.get('service-token', { ttl: '30 min' }, issueToken);
```

Persistent values can survive multiple test runs. They are reused while all of these remain true:

- The TTL has not expired.
- The computation signature has not changed.
- The key has not been deleted.

The default persistence directory is `.global-cache`.

## Test-run isolation

Non-persistent values belong to a **test run**. Workers with the same run ID share these values.
Workers with different run IDs remain isolated. After an execution finishes, the test runner starts
a new run so run-scoped values are recomputed next time.

Set `GLOBAL_CACHE_RUN_ID` when independently launched processes or shards need to share one run. The
system assigning that ID should use a new value for the next unrelated execution.
