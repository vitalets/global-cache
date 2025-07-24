# global-storage

A package for Playwright that lets you share data between tests, workers and even test-runs. It can significantly boost the performance of your tests.

## Installation

## Basic Usage

1. Enable global storage in the Playwright config:

    ```ts
    import { defineConfig } from '@playwright/test';
    import { globalStorage } from 'global-storage/playwright';

    export default defineConfig({
      globalSetup: globalStorage.setup,        // <-- setup global storage
      globalTeardown: globalStorage.teardown,  // <-- teardown global storage
      // ...
    });
    ```

2. Wrap heavy operations with `globalStorage.get()` to compute value once and re-use in all tests:
    ```ts
    const value = await globalStorage.get('some-key', async () => {
        const value = /* heavy operation */
        return value;
    });
    ```

  * If key is not populated, the function will be called and its result will be stored.
  * If key is already populated, the stored value will be returned without calling the function.

  > Important note: the value must be **serializable**, e.g. string, boolean, number, or JSON.

**The main benefit: once value is computed, it can be accessed across all Playwright workers and tests.**

### Dynamic keys

If your function depends on some variables, you should add these variables to the key for propper data separation:

```ts
const value = await globalStorage.get(`some-key-${id}`, async () => {
    const value = /* heavy operation that depends on `id` */
    return value;
});
```

By default, all values are stored in memory and cleared when test run ends.
Although, it is possible to [persist data between test runs](#persist-data-between-test-runs).

## Examples

### Authentication

You can perform lazy, on-demand, re-usable authentication. Use `storageState` fixture to authenticate once, store the auth state, and provide it to all subsequent tests:
```ts
import { test } from '@playwright/test';
import { globalStorage } from 'global-storage/playwright';

test.use({ 
    storageState: async ({ context }, use) => {
        const storageState = await globalStorage.get('auth', async () => {
            const loginPage = await context.newPage();
            await loginPage.goto('https://example.com');
            await loginPage.getByLabel('Username').fill('admin');
            await loginPage.getByLabel('Password').fill('password');
            await loginPage.getByRole('button', { name: 'Sign in' }).click();
            await expect(loginPage.getByText('Authenticated.')).toBeVisible();

            return context.storageState();
        });
        await use(storageState);
    }
});

test('authenticated page', async ({ page }) => {
  // ...
});
```

If you need multiple users, you should add username to the key, to split their storage states:

```ts
import { test } from '@playwright/test';
import { globalStorage } from 'global-storage/playwright';

const username = process.env.TEST_USER;

test.use({ 
    storageState: async ({ context }, use) => {
        const storageState = await globalStorage.get(`auth-${username}`, async () => {
            const loginPage = await context.newPage();
            await loginPage.goto('https://example.com');
            await loginPage.getByLabel('Username').fill(username);
            // ...
        });
        await use(storageState);
    }
});
```

### Sharing a variable

You can calculate any variable once and re-use it in all tests. 
For example, populate database with a user and assign user ID to a shared `userId` variable:

```ts
import { test } from '@playwright/test';
import { globalStorage } from 'global-storage/playwright';

let userId = '';

test.before(async () => {
  userId = await globalStorage.get('userId', async () => {
    const user = await db.createUser();
    return user.id;
  });
});

test('test', async ({ page }) => {
  // page uses 'userId'
});
```

### Caching network request

You can store and re-use result of a network request: 
```ts
import { test } from '@playwright/test';
import { globalStorage } from 'global-storage/playwright';

test('test', async ({ page }) => {
  await page.route('/api/cats/**', (route) => {
    const json = globalStorage.get('cats-response', async () => {
       const response = await route.fetch();
       return response.json();
    });

    // modify response if needed

    await route.fulfill({ json });
  });
});
```

If the response depends on query parameters or body, you should add these value to the key:

```ts
import { test } from '@playwright/test';
import { globalStorage } from 'global-storage/playwright';

test('test', async ({ page }) => {
  await page.route('/api/cats/**', (route, req) => {
    const query = new URL(req.url()).searchParams;
    const reqBody = req.postDataJSON();
    const storageKey = `cats-response-${query.get('id')}-${reqBody.page}`;
    const json = globalStorage.get(storageKey, async () => {
       const response = await route.fetch();
       return response.json();
    });

    await route.fulfill({ json });
  });
});
```

### Persist data between test runs

You may store data on the filesystem and re-use it between test runs. For example, you can authenticate user and save auth state for 1 hour. During this period, all test runs will re-use stored auth state and will not waste time on performing authentication steps.

To enable persistent storage for a key, provide an object `{ key, ttl }` as a first argument. `ttl` defines the cache time in minutes:
```ts
test.use({ 
    storageState: async ({ browser }, use) => {
        const storageState = await globalStorage.get({
            key: 'auth',
            ttl: '1h', // 1 hour
        }, async () => {
            const loginPage = await browser.newPage();
            // ...perform auth
            return loginPage.context().storageState();
        });
        await use(storageState);
    }
});
```
To persist data forever set `ttl: -1`. Such value will be re-used until file is removed:


## Cleanup

After the test run, you may need to cleanup the created resources. For example, remove the user from the database. When resource IDs are in global storage, you can access them inside a teardown script:

1. Define a custom teardown script in the Playwright config:
```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import { globalStorage } from 'global-storage';

export default defineConfig({
  globalSetup: globalStorage.setup,
  globalTeardown: [
    /* custom teardown script before globalStorage.teardown */
    require.resolve('./global-teardown'),
    globalStorage.teardown,
  ],
  // ...
});
```

2. In `global-teardown.js` leverage `globalStorage.get()` to check stored value and run appropriate actions:

```ts
// global-teardown.js
import { defineConfig } from '@playwright/test';
import { globalStorage } from 'global-storage';

export default async function() {
    const userId = await globalStorage.get('userId');
    if (userId) {
        /* remove user from database */
    }
}
```

> Note that for **persistent** values clearing data may break your tests on the next run!

### Cleanup multiple values

When using dynamic keys, you can leverage `globalStorage.getAll()` to retrieve all keys with the provided prefix:

```ts
// global-teardown.ts
import { defineConfig } from '@playwright/test';
import { globalStorage } from 'global-storage/playwright';

export default async function() {
    const userIds = await globalStorage.getAll({ prefix: 'user-' });
    for (const userId of userIds) {
      /* remove every created user from database */
    }
}
```



## Configuration

To provide configuration options, call `globalStorage.configure()` in the Playwright config:

```ts
import { defineConfig } from '@playwright/test';
import { globalStorage } from 'global-storage/playwright';

globalStorage.configure({ /* options */ })

// ...
```

Available options:

- **disabled** `boolean` - Disables global storage. All values will be calculated each time. Default is `false`.
- **url** `string` *(experimental)* - URL of a separate instance of global storage server. Default is `undefined`.

## FAQ

#### Do I need `beforeAll` / `afterAll` hooks?
In most cases - no. Having global storage enabled, you don't need `test.beforeAll` / `test.afterAll` anymore, because you have better and more optimized control of running something once before/after all tests. Native `beforeAll` hook re-runs after every failed test, that is usually not what you expect.

## Changelog
See [CHANGELOG.md](./CHANGELOG.md).

## Feedback
Feel free to share your feedback and suggestions in the [issues](https://github.com/vitalets/global-storage/issues).

## License
[MIT](https://github.com/vitalets/global-storage/blob/main/LICENSE)