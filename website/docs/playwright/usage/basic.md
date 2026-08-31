---
title: Basic usage
---

Call `globalCache.get(key, computeFn)` wherever a Playwright fixture or hook needs shared data:

```ts title="tests/users.spec.ts"
import { test, expect } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

let userId: string;

test.beforeAll(async () => {
  // create user once and store `userId` in a variable
  userId = await globalCache.get('seeded-user-id', async () => {
    const user = await database.createUser();
    return user.id;
  });
});

test('opens user profile', async ({ page }) => {
  // uses 'userId'
});

test('opens user dashboard', async ({ page }) => {
  // uses the same 'userId'
});
```

The first worker requesting `seeded-user-id` creates the user. Concurrent workers wait, and every
worker's `beforeAll()` receives the same stored `userId`, so both tests reuse that user. A
non-persistent value remains available until the Playwright execution ends.

## Where to call `get()`

Common locations include:

- `test.beforeAll()` or `test.beforeEach()` hooks.
- Worker- or test-scoped fixtures.
- Helper functions called by tests.
- Route handlers that need a shared response.

Global Cache coordinates the computation independently of the Playwright hook that calls it.

## Serializable results

Values cross an HTTP boundary. Return primitives, arrays, or plain JSON-compatible objects. Do not
cache a Playwright `Page`, `BrowserContext`, database connection, or class instance; cache the data
needed to recreate or configure it instead.
