---
title: BeforeAll / BeforeEach
---

Global Cache can share expensive setup from either `beforeAll` or `beforeEach`. In both cases, the
cached value is created once and shared across all tests and workers. The key benefit is that the
value is reused even in fully parallel mode and when Playwright starts a new worker after a test
failure. **Global Cache guarantees that the value is computed exactly once during the test run.**

The hook itself still follows Playwright's normal lifecycle, so choose it based on the fixture scope
you need and when the cached value should be assigned.

## `beforeAll`

Playwright runs `beforeAll` once per worker process, not necessarily once for the whole test run. Wrap
the expensive part with Global Cache when every worker should reuse one result:

```ts
import { test } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';
import { database } from './database';

let userId: string;

test.beforeAll(async () => {
  userId = await globalCache.get('seeded-user-id', async () => {
    const user = await database.createUser();
    return user.id;
  });
});
```

If a failed test causes Playwright to create another worker, the new worker calls `beforeAll` again
but receives the cached user ID without creating another database record.

`beforeAll` can use worker-scoped fixtures, but not test-scoped fixtures.

## `beforeEach`

Use `beforeEach` when setup needs a test-scoped fixture. In this example, `database` is a custom
test-scoped fixture:

```ts
import { test } from './fixtures';
import { globalCache } from '@global-cache/playwright';

let userId: string;

test.beforeEach(async ({ database }) => {
  userId = await globalCache.get('seeded-user-id', async () => {
    const user = await database.createUser();
    return user.id;
  });
});

test('opens user profile', async ({ page }) => {
  await page.goto(`/users/${userId}/profile`);
});
```

`beforeEach` runs before every test, but the cached computation still runs only once. Every test and
worker receives the same `userId`, while the hook remains free to use test-scoped fixtures.

[View the runnable beforeAll example](https://github.com/vitalets/global-cache/tree/main/examples/before-all).
