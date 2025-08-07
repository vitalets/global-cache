# @vitalets/global-cache

> Key-value cache for sharing data between parallel workers.

With global cache, the first worker that requests a value becomes responsible for computing it. Others wait until the result is ready — and all workers get the same value. The value is cached in memory or on the file system and reused by later workers and even across test runs.

## Index
<details>
<summary>Click to expand</summary>

<!-- doc-gen TOC maxDepth="3" excludeText="Index" -->
- [Index](#index)
- [Features](#features)
- [Why use it?](#why-use-it)
- [Installation](#installation)
- [Basic Usage (Playwright)](#basic-usage-playwright)
  - [Dynamic keys](#dynamic-keys)
  - [Persistent values](#persistent-values)
- [Use Cases](#use-cases)
  - [Authentication (single user)](#authentication-single-user)
  - [Authentication (multi user)](#authentication-multi-user)
  - [Sharing a variable](#sharing-a-variable)
  - [Caching network request](#caching-network-request)
  - [Cleanup (single key)](#cleanup-single-key)
  - [Cleanup (by prefix)](#cleanup-by-prefix)
- [Configuration](#configuration)
- [API](#api)
- [Changelog](#changelog)
- [Feedback](#feedback)
- [License](#license)
<!-- end-doc-gen -->

</details>

## Features

* **On-demand execution**: Computes heavy values only when they’re actually required.
* **Deduplicated**: Ensures each key is computed exactly once.
* **Worker-safe**: Designed for test environments with parallel execution (e.g. [Playwright](https://playwright.dev/)).

## Why use it?

When running E2E tests in parallel, you might need to:

* Authenticate user only once
* Populate a database only once
* Reuse the state even if worker fails
* Keep some value persistently to speed up subsequent test runs

## Installation

```
npm i -D @vitalets/global-cache
```

## Basic Usage (Playwright)

1. Enable global cache in the Playwright config:

    ```ts
    import { defineConfig } from '@playwright/test';
    import { globalCache } from '@vitalets/global-cache';

    export default defineConfig({
      globalSetup: globalCache.setup,        // <-- setup globalCache
      globalTeardown: globalCache.teardown,  // <-- teardown globalCache
      // ...
    });
    ```

2. Wrap heavy operations with `globalCache.get()` to compute value once:
    ```ts
    const value = await globalCache.get('some-key', async () => {
        const value = /* ...heavy operation */
        return value;
    });
    ```

  * If `some-key` is not populated, the function will be called and its result will be cached.
  * If `some-key` is already populated, the cached value will be returned instantly.

  > **Important note**: the return value must be **serializable**: only plain JavaScript objects and primitive types can be used, e.g. string, boolean, number, or JSON.

### Dynamic keys

If your function depends on some variables, you should add these variables to the key for propper data caching:

```ts
const value = await globalCache.get(`some-key-${id}`, async () => {
    const value = /* ...heavy operation that depends on `id` */
    return value;
});
```

### Persistent values

By default, all values are stored in memory and cleared when test run finish. 
But you can store data permanently on the file system and reuse between subsequent runs. 
For example, you can authenticate user once and save auth state for 1 hour.
During this period, all test runs will reuse auth state and execute faster.

To make value persistent, pass `{ ttl }` (time-to-live) option in the second argument of `.get()` method. TTL can be [ms](https://github.com/vercel/ms)-compatible string or number of miliseconds:
```ts
// cache auth-state for 1 hour
const authState = await globalCache.get('auth-state', { ttl: '1h' }, async () => {
    const loginPage = await browser.newPage();
    // ...authenticate user
    return loginPage.context().storageState();
});
```

> To persist data forever set `ttl: 'infinite'`.

## Use Cases
All code samples are currently for Playwright.

### Authentication (single user)

You can perform lazy, on-demand authentication. Use the `storageState` fixture to authenticate once, save the auth state, and share it with all subsequent tests.

This approach is more efficient than the [separate auth project](https://playwright.dev/docs/auth#basic-shared-account-in-all-tests). It authenticates only when needed and doesn't require an additional project.

```ts
// fixtures.ts
import { test as baseTest, expect } from '@playwright/test';
import globalCache from '@vitalets/global-cache';

export const test = baseTest.extend({
  storageState: async ({ storageState, browser }, use, testInfo) => {
    // Skip authentication for '@no-auth'-tagged tests
    if (testInfo.tags.includes('@no-auth')) return use(storageState);

    // Get auth state: authenticate only if not authenticated yet.
    // Cache auth for 1 hour, to reuse in futher test runs as well.
    const authState = await globalCache.get('auth-state', { ttl: '1 hour' }, async () => {
      console.log('Performing sing-in...');
      const loginPage = await browser.newPage(); // <-- important to use 'browser', not 'page' or 'context' fixture to avoid circullar dependency
      
      await loginPage.goto('https://authenticationtest.com/simpleFormAuth/');
      await loginPage.getByLabel('E-Mail Address').fill('simpleForm@authenticationtest.com');
      await loginPage.getByLabel('Password').fill('pa$$w0rd');
      await loginPage.getByRole('button', { name: 'Log In' }).click();
      await expect(loginPage.getByRole('heading', { name: 'Login Success' })).toBeVisible();

      return loginPage.context().storageState();
    });
  
    await use(authState);
  },
});
```

In tests:
```ts
import { test } from './fixtures';

test('test 1', async ({ page }) => {
  // ...page is authenticated
});

test('test 2', async ({ page }) => {
  // ...page is authenticated (from cached state)
});

test('test 3', { tag: '@no-auth' }, async ({ page }) => {
  // ...page is NOT authenticated
});
```

If you run only `@no-auth` test, authentication **will not be triggered**:
```
npx playwright test -g "@no-auth"
```

> Check out a fully working example of [single user authentication](/examples/auth-single-user/).

### Authentication (multi user)

If you need to authenticate multiple users, you should add username to the key, to split their auth data. 

For example, you are testing your app under `user` and `admin` roles. You can create two separte test files `user.spec.ts` and `admin.spec.ts`:

```ts
// user.spec.ts
import { test } from '@playwright/test';
import globalCache from '@vitalets/global-cache';

// Use your logic to define a username for this test file
const USERNAME = 'user';

test.use({ 
    storageState: async ({ browser }, use) => {
        const authState = await globalCache.get(`auth-state-${USERNAME}`, async () => {
            const loginPage = await browser.newPage();
            // ...authenticate as user
        });
        await use(authState);
    }
});

test('test for user', async ({ page }) => {
  // ...
});
```

Test for `admin`:
```ts
// admin.spec.ts
import { test } from '@playwright/test';
import globalCache from '@vitalets/global-cache';

// Use your logic to define a username for this test file
const USERNAME = 'admin';

test.use({ 
    storageState: async ({ browser }, use) => {
        const authState = await globalCache.get(`auth-state-${USERNAME}`, async () => {
            const loginPage = await browser.newPage();
            // ...authenticate as admin
        });
        await use(authState);
    }
});

test('test for admin', async ({ page }) => {
  // ...
});
```

The approach is more efficient than the [multi-role auth project](https://playwright.dev/docs/auth#multiple-signed-in-roles) because it authenticates the required roles on demand.

If you run these tests on 2 shards, the 1st shard will only authenticate `user` and the 2nd will authenticate `admin`. It executes much faster. 

> Check out a fully working example of [multi user authentication](/examples/auth-multi-user/).

### Sharing a variable

You can calculate any variable once and re-use it in all tests. 
For example, populate database with a user and assign user ID to a shared `userId` variable.
You can use either `beforeAll` or `before` hook, in this case it does not matter.

```ts
import { test } from '@playwright/test';
import globalCache from '@vitalets/global-cache';

let userId = '';

test.before(async () => {
  userId = await globalCache.get('user-id', async () => {
    const user = // ...create user in DB
    return user.id;
  });
});

test('test 1', async () => {
  // ...test uses 'userId'
});

test('test 2', async () => {
  // ...test uses 'userId'
});
```

> Check out a fully working example of [multi user authentication](/examples/auth-multi-user/).

### Caching network request

You can store and re-use result of a network request: 
```ts
import { test } from '@playwright/test';
import globalCache from '@vitalets/global-cache';

test.use({
  page: async ({ page }, use) => {
    // setup request mock
    await page.route('https://jsonplaceholder.typicode.com/users', async (route) => {
      // send real request once and store the response JSON
      const json = await globalCache.get('users-response', async () => {
        const response = await route.fetch();
        return response.json();
      });

      json[0].name = 'Dummy'; // modify the response for testing purposes

      await route.fulfill({ json }); // fulfill the request with the modified response
    });
    await use(page);
  },
});

test('test', async ({ page }) => {
  // ...uses page with mock
});
```

If the response depends on query parameters or body, you should add these value to the key:

```ts
await page.route('/api/cats/**', (route, req) => {
  const query = new URL(req.url()).searchParams;
  const reqBody = req.postDataJSON();
  const cacheKey = `cats-response-${query.get('id')}-${reqBody.page}`;
  const json = globalCache.get(cacheKey, async () => {
      const response = await route.fetch();
      return response.json();
  });

  await route.fulfill({ json });
});
```

### Cleanup (single key)

After the test run, you may need to cleanup the created resources. For example, remove the user from the database. It can't be just called in `after / afterAll` hook, because at this point other workers may still need the vlaue. 

The solution is to preform cleanup in a custom teardown script.

1. Define a custom teardown script in the Playwright config:
```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import globalCache from '@vitalets/global-cache';

export default defineConfig({
  globalSetup: globalCache.setup,
  globalTeardown: [
    require.resolve('./cleanup'), // <-- custom teardown script before globalCache.teardown
    globalCache.teardown,
  ],
  // ...
});
```

2. In the cleanup script use `globalCache.getStale()` method to access outdated values: 

```ts
// cleanup.js
import { defineConfig } from '@playwright/test';
import globalCache from '@vitalets/global-cache';

export default async function() {
    const userId = await globalCache.getStale('user-id');
    if (userId) {
        /* remove user from database */
    }
}
```

The result of `globalCache.getStale(key)` is different for presistent and non-persistent values:
- **non-persistent**: it returns the current value (as it will be cleared right after test run end)
- **persistent**: it returns the previous value that was replaced during the test run (as the current value can be reused in future runs)

### Cleanup (by prefix)

When using dynamic keys, you can use `globalCache.getStaleList(prefix)` to retrieve all values for the provided prefix:

```ts
// cleanup.ts
import { defineConfig } from '@playwright/test';
import globalCache from '@vitalets/global-cache';

export default async function() {
    const userIds = await globalCache.getStaleList('user-');
    for (const userId of userIds) {
      /* remove every created user from database */
    }
}
```

## Configuration

To provide configuration options, call `globalCache.defineConfig()` in the Playwright config:

```ts
import { defineConfig } from '@playwright/test';
import globalCache from '@vitalets/global-cache';

globalCache.defineConfig({ /* options */ })

// ...
```

Available options:

- **disabled** `boolean` - Disables global globalCache. All values will be calculated each time. Default is `false`.

tbd

## API
tbd

## Changelog
See [CHANGELOG.md](./CHANGELOG.md).

## Feedback
Feel free to share your feedback and suggestions in the [issues](https://github.com/vitalets/@vitalets/global-cache/issues).

## License
[MIT](https://github.com/vitalets/@vitalets/global-cache/blob/main/LICENSE)