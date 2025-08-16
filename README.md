# @vitalets/global-cache

[![lint](https://github.com/vitalets/global-cache/actions/workflows/lint.yaml/badge.svg)](https://github.com/vitalets/global-cache/actions/workflows/lint.yaml)
[![test](https://github.com/vitalets/global-cache/actions/workflows/test.yaml/badge.svg)](https://github.com/vitalets/global-cache/actions/workflows/test.yaml)
[![npm version](https://img.shields.io/npm/v/@vitalets/global-cache)](https://www.npmjs.com/package/@vitalets/global-cache)
[![license](https://img.shields.io/npm/l/%40vitalets%2Fglobal-cache)](https://github.com/vitalets/global-cache/blob/main/LICENSE)

> Key-value cache for sharing data between parallel workers and subsequent runs.

With the global cache, the first worker that requests a value becomes responsible for computing it. Others wait until the result is ready — and all workers get the same value. The value is cached in memory or on the file system and reused by later workers and test runs.

This can significantly boost your E2E test performance.

<img align="center" alt="Global cache schema" src="https://raw.githubusercontent.com/vitalets/global-cache/refs/heads/main/scripts/img/schema-1628.png" />

## Index
<details>
<summary>Click to expand</summary>

<!-- doc-gen TOC maxDepth="4" excludeText="Index" -->
- [Index](#index)
- [Features](#features)
- [Why use it?](#why-use-it)
- [Installation](#installation)
- [Usage (Playwright)](#usage-playwright)
  - [Basic](#basic)
  - [Dynamic keys](#dynamic-keys)
  - [Persistent values](#persistent-values)
- [Use Cases](#use-cases)
  - [Authentication (single user)](#authentication-single-user)
  - [Authentication (multi user)](#authentication-multi-user)
  - [Sharing a variable](#sharing-a-variable)
  - [Caching network request](#caching-network-request)
  - [Cleanup (single value)](#cleanup-single-value)
  - [Cleanup (by prefix)](#cleanup-by-prefix)
  - [Typed cache](#typed-cache)
- [Configuration](#configuration)
- [API](#api)
  - [`globalCache.setup`](#globalcachesetup)
  - [`globalCache.teardown`](#globalcacheteardown)
  - [`globalCache.defineConfig(config)`](#globalcachedefineconfigconfig)
  - [`globalCache.get(key,[ params,] computeFn)`](#globalcachegetkey-params-computefn)
  - [`globalCache.getStale(key)`](#globalcachegetstalekey)
  - [`globalCache.getStaleList(prefix)`](#globalcachegetstalelistprefix)
  - [`globalCache.clear()`](#globalcacheclear)
- [Debug](#debug)
- [Changelog](#changelog)
- [Feedback](#feedback)
- [License](#license)
<!-- end-doc-gen -->

</details>

## Features

* **On-demand execution**: Computes heavy values only when they’re actually needed.
* **Deduplicated**: Ensures each key is computed exactly once.
* **Worker-safe**: Designed for test environments with parallel workers (e.g. [Playwright](https://playwright.dev/)).

## Why use it?

When running E2E tests in parallel, you might need to:

* Authenticate a user only once.
* Populate a database only once.
* Reuse the state even if a worker fails.
* Keep some values persistently to speed up subsequent test runs.

## Installation

```sh
npm i -D @vitalets/global-cache
```

## Usage (Playwright)

### Basic

1. Enable the global cache in the Playwright config:

    ```ts
    // playwright.config.ts
    import { defineConfig } from '@playwright/test';
    import { globalCache } from '@vitalets/global-cache';

    export default defineConfig({
      globalSetup: globalCache.setup,        // <-- Setup globalCache
      globalTeardown: globalCache.teardown,  // <-- Teardown globalCache
      // ...
    });
    ```

2. Wrap heavy operations with `globalCache.get(key, fn)` to compute the value once:
    ```ts
    import { globalCache } from '@vitalets/global-cache';
    
    const value = await globalCache.get('key', async () => {
      const value = /* ...heavy operation */
      return value;
    });
    ```

  * If `key` is not populated, the function will be called, and its result will be cached.
  * If `key` is already populated, the cached value will be returned instantly.

  > **NOTE**: The return value must be **serializable**: only plain JavaScript objects and primitive types can be used, e.g., string, boolean, number, or JSON.

  You can use `globalCache.get()` anywhere in your tests. Typically, it could be [fixtures](https://playwright.dev/docs/test-fixtures) or `before / beforeAll` hooks. See [more examples](#use-cases) below.

### Dynamic keys

If your computation depends on some variables, you should add these variables to the key for proper data caching:

```ts
const value = await globalCache.get(`some-key-${id}`, async () => {
  const value = /* ...heavy operation that depends on `id` */
  return value;
});
```

### Persistent values

By default, all values are stored in memory and cleared when the test run finishes. 
However, you can store data permanently on the file system and reuse it between subsequent runs. 
For example, you can authenticate a user once and save the auth state for 1 hour.
During this period, all test runs will reuse the auth state and execute faster.

To make a value persistent, pass the `{ ttl }` (time-to-live) option in the second argument of the `.get()` method. TTL can be an [ms-compatible](https://github.com/vercel/ms) string or a number of milliseconds:
```ts
// Cache auth for 1 hour
const authState = await globalCache.get('auth-state', { ttl: '1 hour' }, async () => {
  const loginPage = await browser.newPage();
  // ...authenticate user
  return loginPage.context().storageState();
});
```

After running this test, the auth state will be cached in the file:
```
.global-cache
 └── auth-state.json
```

> By default, all persistent values are stored in the `.global-cache` directory, but you can change this location in the [config](#globalcachedefineconfigconfig). Make sure to add the chosen directory to your `.gitignore` file to avoid committing it.

## Use Cases
All code samples are currently for Playwright.

### Authentication (single user)

You can perform lazy, on-demand authentication. Use the `storageState` fixture to authenticate once, save the auth state, and share it with all subsequent tests.

This approach is more efficient than the [separate auth project](https://playwright.dev/docs/auth#basic-shared-account-in-all-tests), because authentication runs only when needed and doesn't require an additional project.

```ts
// fixtures.ts
import { test as baseTest, expect } from '@playwright/test';
import { globalCache } from '@vitalets/global-cache';

export const test = baseTest.extend({
  storageState: async ({ storageState, browser }, use, testInfo) => {
    // Skip authentication for '@no-auth'-tagged tests
    if (testInfo.tags.includes('@no-auth')) return use(storageState);

    // Get auth state: authenticate only if not authenticated yet.
    // Cache auth for 1 hour, to reuse in futher test runs as well.
    const authState = await globalCache.get('auth-state', { ttl: '1 hour' }, async () => {
      console.log('Performing sing-in...');
      // Important to use 'browser', not 'page' or 'context' fixture to avoid circular dependency
      const loginPage = await browser.newPage();
      
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
// index.spec.ts
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

> [!TIP]
> Check out a fully working example of [single user authentication](/examples/auth-single-user/). There is also a separate [global-cache-example-playwright](https://github.com/vitalets/global-cache-example-playwright) repo, that you can clone and play.

### Authentication (multi user)

If you need to authenticate multiple users, you should add username to the key, to split their auth data. 

For example, you are testing your app under `user` and `admin` roles. You can create two separte test files `user.spec.ts` and `admin.spec.ts`:

```ts
// user.spec.ts
import { test } from '@playwright/test';
import { globalCache } from '@vitalets/global-cache';

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
import { globalCache } from '@vitalets/global-cache';

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

The approach is more efficient than the [multi-role auth project](https://playwright.dev/docs/auth#multiple-signed-in-roles), because only needed roles get authenticated.

If you run these tests on 2 shards, the 1st shard will only authenticate `user` and the 2nd will authenticate `admin`. It executes much faster. 

> [!TIP]
> Check out a fully working example of [multi user authentication](/examples/auth-multi-user/).

### Sharing a variable

You can calculate any variable once and re-use it in all tests. 
For example, populate database with a user and assign user ID to a shared `userId` variable.
You can use either `beforeAll` or `before` hook, in this case it does not matter.

```ts
import { test } from '@playwright/test';
import { globalCache } from '@vitalets/global-cache';

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

> [!TIP]
> Check out a fully working example of [multi user authentication](/examples/auth-multi-user/).

### Caching network request

You can store and re-use result of a network request: 
```ts
import { test } from '@playwright/test';
import { globalCache } from '@vitalets/global-cache';

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

> [!TIP]
> Check out a fully working example of [caching network request](/examples/cache-api-response/).

### Cleanup (single value)

After the test run, you may need to cleanup the created resources. For example, remove the user from the database. It can't be just called in `after / afterAll` hook, because at this point other workers may still need the value. 

The solution is to preform cleanup in a custom teardown script via `globalCache.getStale()` method.

1. Define a custom teardown script in the Playwright config:
```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import { globalCache } from '@vitalets/global-cache';

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
import { globalCache } from '@vitalets/global-cache';

export default async function() {
    const userId = await globalCache.getStale('user-id');
    if (userId) {
        /* remove user from database */
    }
}
```

The result of `globalCache.getStale(key)` is different for non-presistent and persistent keys:
- **non-persistent**: returns the current value (as it will be cleared right after test run end)
- **persistent**: returns the previous value that was updated during the test run (as the current value may be reused in the subsequent runs)

> [!TIP]
> Check out a fully working example of [cleanup](/examples/cleanup/).

### Cleanup (by prefix)

When using dynamic keys, you can use `globalCache.getStaleList(prefix)` to retrieve all values for the provided prefix:

```ts
// cleanup.ts
import { defineConfig } from '@playwright/test';
import { globalCache } from '@vitalets/global-cache';

export default async function() {
    const userIds = await globalCache.getStaleList('user-');
    for (const userId of userIds) {
      /* remove every created user from database */
    }
}
```

### Typed cache

You can make cache keys and values strictly typed.
To achieve it, create own `global-cache.ts` file, define cache schema and re-export typed cache:

```ts
// global-cache.ts
import { globalCache as genericGlobalCache, GlobalCache } from '@vitalets/global-cache';

export type GlobalCacheSchema = {
  'user-id': string;
  'user-info': { name: string; email: string };
  // ...add more keys as needed
};

// Re-export typed globalCache
export const globalCache = genericGlobalCache as GlobalCache<GlobalCacheSchema>;
```

In tests import typed `globalCache`:
```ts
import { globalCache } from './global-cache';

// valid call
const userInfo = await globalCache.get('user-info', fn);

// invalid call
const value = await globalCache.get('foo', fn);
```

> [!TIP]
> Check out a fully working example of [typed cache](/examples/typed-cache/).

## Configuration

To provide configuration options, call `globalCache.defineConfig()` in the Playwright config:

```ts
import { globalCache } from '@vitalets/global-cache';

globalCache.defineConfig({ 
  // ...options
});
```

[Available options](#globalcachedefineconfigconfig).

## API

`globalCache` is a singleton used to manage cache values. Import it directly from the package:

```ts
import { globalCache } from '@vitalets/global-cache';
```

#### `globalCache.setup`

Returns an absolute path to the file, that performs the global cache setup.

**Returns**: `string`

#### `globalCache.teardown`

Returns an absolute path to the file, that performs the global cache teardown.

**Returns**: `string`

#### `globalCache.defineConfig(config)`

Configures global cache.

**Parameters**:
- `config: `
  - `basePath: string` - Path to a directory to store persistent values. Default is `.global-cache`.
  - `ignoreTTL: boolean` - Forces all values to be non-persistent, usefull for CI (where cross run caching is redundant). Default is `false`.
  - `disabled: boolean` - Disables global cache. All values will be computed each time. Default is `false`.

**Returns**: `void`

**Example**:
```ts
import { globalCache } from '@vitalets/global-cache';

globalCache.defineConfig({ 
  basePath: 'path/to/cache',
  ignoreTTL: !!process.env.CI,
});
```

#### `globalCache.get(key,[ params,] computeFn)`

Get value by key or compute it if not found.

**Parameters**:
- `key: string`
- `params: object`
  - `ttl: string | number | 'infinite'`
- `computeFn: Function`

**Returns**: `Promise`

#### `globalCache.getStale(key)`

Get "stale" value for cleanup. The result is different for presistent and non-persistent keys:
- **non-persistent**: returns the current value (as it will be cleared right after test run end)
- **persistent**: returns the previous value that was replaced during the test run (as the current value can be reused in the future runs)

**Parameters**:
- `key: string`

**Returns**: `Promise`

#### `globalCache.getStaleList(prefix)`

Get a list of "stale" values by prefix. The result follow the same rules as for `.getStale()`.

**Parameters**:
- `prefix: string`

**Returns**: `Promise<Array>`

#### `globalCache.clear()`

Clears all non-peristent keys for the current run.

**Returns**: `Promise`

## Debug

To debug global cache, run Playwright with the following `DEBUG` environment variable:
```sh
DEBUG=global-cache* npx playwright test 
```

Example output:
```
global-cache Starting server... +0ms
global-cache Server started on port: 50138 +1ms
global-cache:auth-state Fetching value... +0ms
global-cache:auth-state Cache miss. Computing... +0ms
global-cache:auth-state Computed: {"cookies":[{"name":"PHPSESSID","value":"372lp9jct... +0ms
global-cache:auth-state Saving value... +0ms
global-cache:auth-state Saved. +0ms
global-cache:auth-state Fetching value... +0ms
global-cache:auth-state Cache hit: {"cookies":[{"name":"PHPSESSID","value":"372lp9jct... +0ms
global-cache Stopping server... +6s
global-cache Server stopped. +0ms
```

To debug particular key use `global-cache:KEY` format: 
```sh
DEBUG=global-cache:auth-state npx playwright test 
```

## Changelog
See [CHANGELOG.md](./CHANGELOG.md).

## Feedback
Feel free to share your feedback and suggestions in the [issues](https://github.com/vitalets/@vitalets/global-cache/issues).

## License
[MIT](https://github.com/vitalets/@vitalets/global-cache/blob/main/LICENSE)