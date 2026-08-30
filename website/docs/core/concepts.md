---
title: Concepts
---

## Compute once, share everywhere

Every cached value has a string key and a computation function:

```ts
const user = await cache.get('seeded-user', async () => {
  return database.createUser();
});
```

The first caller claims the key and performs the computation. Other callers requesting the same key
wait for it to finish. When it succeeds, every caller receives the stored result.

Values cross the HTTP boundary, so computations should return JSON-serializable data such as strings,
numbers, booleans, arrays, plain objects, `null`, or `undefined`. Class instances and other values that
depend on prototypes do not survive serialization.

## Keys and signatures

A key identifies one logical value. Include every input that can change the result in the key:

```ts
const profile = await cache.get(`profile-${userId}`, () => loadProfile(userId));
```

Global Cache also calculates a signature from the computation, TTL, and call site. If the same key is
requested from incompatible call sites during one run, it warns about the mismatch instead of silently
overwriting the shared value. Use one canonical computation per key.

## Test runs

Non-persistent values belong to a **test run**. A run ID lets all workers address the same in-memory
storage. At the end of a run, an integration calls `resetTestRun()` to clear non-persistent values and
create a new run ID.

An externally supplied `GLOBAL_CACHE_RUN_ID` can make multiple processes or shards share one run.
Because an external coordinator owns that run ID, `resetTestRun()` does not clear it automatically.

## Persistent values

Passing a TTL stores a value on the filesystem as well as in memory:

```ts
const token = await cache.get('service-token', { ttl: '30 min' }, issueToken);
```

Persistent values can survive multiple test runs. They are reused while all of these remain true:

- The TTL has not expired.
- The computation signature has not changed.
- The key has not been deleted.

The default persistence directory is `.global-cache`.

## Stale values and cleanup

Cleanup often needs the value that is about to stop being current:

- For a non-persistent key, `getStale(key)` returns the current value before the run is cleared.
- For a persistent key replaced during the run, it returns the previous value while preserving the
  new value for later runs.

`getStaleList(prefix)` applies the same rule to every matching key. Integrations should call cleanup
before resetting the test run.
