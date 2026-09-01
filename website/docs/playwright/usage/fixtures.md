---
title: Fixtures
---

Use Global Cache inside a custom Playwright fixture when tests should receive shared data. The fixture still follows Playwright's normal scope and lifecycle, while
`globalCache.get()` ensures that its expensive computation runs only once across all workers.

## Test-scoped fixture

A test-scoped fixture is the recommended default when the cached value is used directly by tests or
depends on another test-scoped fixture:

```ts title="tests/fixtures.ts"
import { test as base, expect } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';
import { database } from './database';

type Fixtures = {
  seededUserId: string;
};

export const test = base.extend<Fixtures>({
  seededUserId: async ({}, use) => {
    const userId = await globalCache.get('seeded-user-id', async () => {
      const user = await database.createUser();
      return user.id;
    });

    await use(userId);
  },
});

export { expect };
```

Import the extended `test` in the test file:

```ts title="tests/users.spec.ts"
import { test, expect } from './fixtures';

test('opens the user profile', async ({ page, seededUserId }) => {
  await page.goto(`/users/${seededUserId}/profile`);
  await expect(page).toHaveURL(/\/profile$/);
});
```

Playwright sets up `seededUserId` for each test that requests it, but the cached computation creates
the database user only once. Tests that do not request the fixture do not trigger the computation.

## Worker-scoped fixture

Use a worker-scoped fixture when the fixture itself manages worker-scoped state or performs
additional setup that should run once per worker:

```ts title="tests/fixtures.ts"
import { test as base } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

type WorkerFixtures = {
  seededUserId: string;
};

export const test = base.extend<{}, WorkerFixtures>({
  seededUserId: [
    async ({}, use) => {
      const userId = await globalCache.get('seeded-user-id', async () => {
        const user = await database.createUser();
        return user.id;
      });

      await use(userId);
    },
    { scope: 'worker' },
  ],
});
```

Each worker initializes the fixture once, and every worker receives the same cached user ID. Choose
the scope based on the fixture dependencies and lifecycle you need; Global Cache coordinates the
shared computation independently of that scope.

For authentication, where a fixture overrides Playwright's built-in `storageState`, see the
[Authentication guide](../guides/authentication.md).
