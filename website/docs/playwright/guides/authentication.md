---
title: Authentication
---

Global Cache can authenticate lazily: a user is signed in only when a test requests that role, and the
resulting Playwright storage state is shared with other workers.

## Single user

Override the `storageState` fixture and cache the authenticated state:

```ts title="tests/fixtures.ts"
import { test as base, expect } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

export const test = base.extend({
  storageState: async ({ storageState, browser }, use, testInfo) => {
    if (testInfo.tags.includes('@no-auth')) {
      await use(storageState);
      return;
    }

    const authState = await globalCache.get('auth-state', { ttl: '1 hour' }, async () => {
      const page = await browser.newPage();
      await page.goto('/login');
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Password').fill('secret');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page).toHaveURL('/dashboard');
      return page.context().storageState();
    });

    await use(authState);
  },
});
```

Use `browser` to create the login page. Depending on `page` or `context` while defining
`storageState` creates a fixture dependency cycle.

Tests import the extended fixture:

```ts
import { test } from './fixtures';

test('authenticated flow', async ({ page }) => {
  await page.goto('/dashboard');
});

test('public flow', { tag: '@no-auth' }, async ({ page }) => {
  await page.goto('/');
});
```

[View the complete single-user example](https://github.com/vitalets/global-cache/tree/main/examples/auth-single-user).

## Multiple users

Put the role in the key so each identity has its own state:

```ts
async function signIn(browser: Browser, role: 'user' | 'admin') {
  return globalCache.get(`auth-state-${role}`, async () => {
    const page = await browser.newPage();
    await authenticate(page, credentials[role]);
    return page.context().storageState();
  });
}
```

Only roles requested by the selected tests or shard are authenticated.

[View the complete multi-user example](https://github.com/vitalets/global-cache/tree/main/examples/auth-multi-user).

## Authentication through an API

The cached computation can use Playwright's request API instead of a browser:

```ts
const authState = await globalCache.get('auth-state-via-api', async () => {
  const context = await playwright.request.newContext();
  await context.post('/api/login', { data: credentials });
  return context.storageState();
});
```

When overriding `storageState`, depend on the `playwright` fixture rather than the `request` fixture to
avoid a dependency cycle.

[View the complete API authentication example](https://github.com/vitalets/global-cache/tree/main/examples/auth-via-api).
