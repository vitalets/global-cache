---
title: Cache API responses
---

Cache an upstream response inside a Playwright route handler when many workers need the same data:

```ts
test.use({
  page: async ({ page }, use) => {
    await page.route('https://api.example.com/users', async (route) => {
      const users = await globalCache.get('users-api-response', async () => {
        const response = await route.fetch();
        return response.json();
      });

      await route.fulfill({ json: users });
    });

    await use(page);
  },
});
```

The upstream request is sent once. Later route handlers receive the same cached data without
contacting the upstream service again.

## Dynamic params

If request parameters affect the result, include them in the key:

```ts
import { test, expect } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

test.beforeEach(async ({ page }) => {
  await page.route('https://api.example.com/users/*', async (route) => {
    const requestUrl = new URL(route.request().url());
    const userId = requestUrl.pathname.split('/').at(-1)!;

    const user = await globalCache.get(`user-api-response:${userId}`, async () => {
      const response = await route.fetch();
      return response.json();
    });

    await route.fulfill({ json: user });
  });
});

test('opens user profile', async ({ page }) => {
  await page.goto('/users/42');
  await expect(page.getByTestId('user-id')).toHaveText('42');
});
```

Requests for `/users/42` reuse one cache entry, while `/users/43` uses a separate entry and fetches
its own response.

[View the runnable API-response example](https://github.com/vitalets/global-cache/tree/main/examples/cache-api-response).
