---
title: Basics
---

Global Cache stores a value under a key and returns that value to every test worker that requests
the same key. Use a static key for one shared value, a dynamic key when the value depends on inputs,
and a persistent key when the value should be reused across Playwright executions.

## Static keys

Call `globalCache.get(key, computeFn)` with a fixed key when every caller should share one value:

```ts title="tests/users.spec.ts"
import { test, expect } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

let userId: string;

test.beforeAll(async () => {
  userId = await globalCache.get('seeded-user-id', async () => {
    const user = await database.createUser();
    return user.id;
  });
});

test('opens user profile', async ({ page }) => {
  await page.goto(`/users/${userId}/profile`);
  await expect(page).toHaveURL(/\/profile$/);
});

test('opens user dashboard', async ({ page }) => {
  await page.goto(`/users/${userId}/dashboard`);
  await expect(page).toHaveURL(/\/dashboard$/);
});
```

The first worker requesting `seeded-user-id` creates the user. Concurrent workers wait, and every
worker receives the same stored `userId`. A static, non-persistent value remains available until the
Playwright execution ends.

The computed value crosses an HTTP boundary, so return primitives, arrays, or plain JSON-compatible
objects. Do not cache a Playwright `Page`, `BrowserContext`, database connection, or class instance;
cache the data needed to recreate or configure it instead.

You can call `get()` from hooks, fixtures, helper functions, or route handlers. See [Hooks](./hooks.md)
and [Fixtures](./fixtures.md) for the recommended patterns in Playwright setup code.

## Dynamic keys

If a computed value depends on one or more parameters, include every parameter in the cache key.
This gives each parameter combination a separate cache entry, so callers only reuse a value that
matches their inputs:

```ts
const userData = await globalCache.get(`user-${userId}`, async () => {
  return api.getUser(userId);
});
```

Without `userId` in the key, the first loaded account would be returned for every later request.

Use stable, deterministic key parts. Avoid random values, timestamps, or worker indexes unless they
are genuinely part of the logical identity; those values prevent workers from sharing the entry.

### Namespacing keys

Prefixes make dynamic values easy to group and clean up:

```ts
const userId = await globalCache.get(`created-user:${role}`, () => createUser(role));
```

The matching cleanup callback can retrieve all old values:

```ts
const userIds = await globalCache.getStaleList<string>('created-user:');
```

See [Cleanup](./cleanup.md) for a complete cleanup callback.

## Persistent keys

By default, keys live in memory for one Playwright execution. Pass a time to live (TTL) to persist a
key's value on the filesystem and reuse it in later runs:

```ts
const authState = await globalCache.get('auth-state', { ttl: '1 hour' }, async () => {
  const page = await browser.newPage();
  await signIn(page);
  return page.context().storageState();
});
```

TTL accepts:

- A number of milliseconds.
- An [`ms`](https://github.com/vercel/ms)-compatible string such as `'5 min'` or `'1 hour'`.
- `'infinite'` for no time-based expiration.

The default directory is `.global-cache`:

```text
.global-cache/
└── auth-state.json
```

Add this directory to `.gitignore`, or choose another path with
[`basePath`](../configuration.md#options).

### Recalculation

The value for a persistent key is recalculated when its TTL expires, its computation signature
changes, or the key is deleted. The first worker to encounter the invalid value performs the new
computation while other workers wait.

To force recalculation, delete the corresponding file in `.global-cache` or call `delete()`:

```ts
await globalCache.delete('auth-state');
```

`delete()` removes both the in-memory and filesystem entries.

### CI

Filesystem persistence often provides no benefit on an ephemeral CI runner. Set `ignoreTTL: true` to
keep the same application code while treating all keys as run-scoped:

```ts
globalCache.config({
  ignoreTTL: Boolean(process.env.CI),
});
```
