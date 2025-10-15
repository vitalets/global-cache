# global-cache

[![lint](https://github.com/vitalets/global-cache/actions/workflows/lint.yaml/badge.svg)](https://github.com/vitalets/global-cache/actions/workflows/lint.yaml)
[![test](https://github.com/vitalets/global-cache/actions/workflows/test.yaml/badge.svg)](https://github.com/vitalets/global-cache/actions/workflows/test.yaml)
![license](https://img.shields.io/github/license/vitalets/global-cache)

A key-value cache for sharing data between parallel workers and test runs.

> \[!IMPORTANT]
> Package name was changed from **@vitalets/global-cache** to **@global-cache/playwright** to provide dedicated Playwright integration.

## Why use it?

When running E2E tests in parallel, you might need to:

✅ Authenticate user only once\
✅ Seed database only once\
✅ Compute heavy values on demand\
✅ Reuse those values across workers\
✅ Persist some values between test runs

Global Cache makes all of this possible.

## How it works

The first worker that requests a value becomes responsible for computing it. Others wait until the result is ready — and all workers get the same value. The value is cached in memory or on the filesystem and reused by subsequent workers and test runs:

<img align="center" alt="Global cache schema" src="https://raw.githubusercontent.com/vitalets/global-cache/refs/heads/main/scripts/img/schema-1628.png" />

## Index

<details><summary>Click to expand</summary>

* [Usage (Playwright)](#usage-playwright)
  * [Install](#install)
  * [Configure](#configure)
  * [Use in tests](#use-in-tests)
  * [Dynamic keys](#dynamic-keys)
  * [Persistent values](#persistent-values)
* [Examples](#examples)
  * [Authentication (single user)](#authentication-single-user)
  * [Authentication (multi user)](#authentication-multi-user)
  * [Sharing a variable (BeforeAll)](#sharing-a-variable-beforeall)
  * [Caching network request](#caching-network-request)
  * [Cleanup (single value)](#cleanup-single-value)
  * [Cleanup (dynamic keys)](#cleanup-dynamic-keys)
  * [Typed cache](#typed-cache)
* [Configuration](#configuration)
* [API](#api)
  * [`globalCache.wrap(config)`](#globalcachewrapconfig)
  * [`globalCache.defineConfig(config)`](#globalcachedefineconfigconfig)
  * [`globalCache.get(key,[ params,] computeFn)`](#globalcachegetkey-params-computefn)
  * [`globalCache.getStale(key)`](#globalcachegetstalekey)
  * [`globalCache.getStaleList(prefix)`](#globalcachegetstalelistprefix)
  * [`globalCache.clearTestRun()`](#globalcachecleartestrun)
  * [`globalCache.setup`](#globalcachesetup)
  * [`globalCache.teardown`](#globalcacheteardown)
  * [`globalCache.reporter`](#globalcachereporter)
* [Debug](#debug)
* [Changelog](#changelog)
* [FAQ](#faq)
  * [How to use Global Cache in AfterAll hook?](#how-to-use-global-cache-in-afterall-hook)
* [Feedback](#feedback)
* [License](#license)

</details>

## Usage (Playwright)

Currently Global Cache is primarily developed for [Playwright](https://playwright.dev/), but can be integrated with other frameworks.

### Install

Install via any package manager:

```sh
npm i -D @global-cache/playwright
```

### Configure

Enable Global Cache in the `playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

const config = defineConfig({
  // ...your Playwright config
});

export default globalCache.wrap(config);
```

<details>
    <summary>Manual configuration</summary>

You can manually adjust Playwright config to enable Global Cache:

```ts
import { defineConfig } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

export default defineConfig({
  globalSetup: globalCache.setup,        // <-- Add globalCache setup script
  globalTeardown: globalCache.teardown,  // <-- Add globalCache teardown script
  reporter: [
    globalCache.reporter,                // <-- Add globalCache reporter
    // ...
  ],
  // ...
});
```

</details> 

### Use in tests

In tests and hooks, wrap heavy operations with `globalCache.get(key, computeFn)` to compute the value once and share between workers:

```ts
import { globalCache } from '@global-cache/playwright';

// ...

const value = await globalCache.get('cache-key', async () => {
  const value = /* ...heavy operation */
  return value;
});
```

* If `cache-key` is not populated yet, the function will be evaluated, its result will be returned and cached.
* If `cache-key` is already populated, the cached value will be returned instantly.

> \[!IMPORTANT]
> The return value must be **serializable**: only plain JavaScript objects and primitive types can be used, e.g., string, boolean, number, or JSON.

You can use `globalCache.get()` anywhere in your tests. Typically, it could be [fixtures](https://playwright.dev/docs/test-fixtures) or `beforeAll / before` hooks. See [more examples](#examples) below.

### Dynamic keys

If your computation depends on some variables, you should add these variables to the cache key for proper data separation:

```ts
const value = await globalCache.get(`some-key-${id}`, async () => {
  const value = /* ...computation that depends on `id` */
  return value;
});
```

### Persistent values

By default, all values are stored in memory and cached during the test run.
However, you can store data permanently on the filesystem and reuse it between subsequent runs.
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

After running this test, the auth state will be stored in a file:

```
.global-cache
 └── auth-state.json
```

> The default directory for persistent values is `.global-cache`, but you can change this location in the [config](#globalcachedefineconfigconfig). Make sure to add the chosen directory to your `.gitignore` file to avoid committing it.

## Examples

All code samples are currently for Playwright.

### Authentication (single user)

You can perform lazy, on-demand authentication with Global Cache. Use the `storageState` fixture to authenticate once, save the auth state, and share it with all subsequent tests.

This approach is more efficient than a [dependency project](https://playwright.dev/docs/auth#basic-shared-account-in-all-tests), because authentication runs only when needed, and there is no extra projects in the Playwright config.

```ts
// fixtures.ts
import { test as baseTest, expect } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

export const test = baseTest.extend({
  storageState: async ({ storageState, browser }, use, testInfo) => {
    // Skip authentication for '@no-auth'-tagged tests
    if (testInfo.tags.includes('@no-auth')) return use(storageState);

    // Get auth state once and cache for 1 hour
    const authState = await globalCache.get('auth-state', { ttl: '1 hour' }, async () => {
      console.log('Performing sing-in...');
      // Note: use 'browser', not 'page' or 'context' fixture to avoid circular dependency
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

> \[!TIP]
> Check out a fully working example of [single user authentication](/examples/auth-single-user/). There is also a separate [global-cache-example-playwright](https://github.com/vitalets/global-cache-example-playwright) repo, that you can clone and play.

### Authentication (multi user)

If you run tests with multiple users, you should add username to the cache key, to separate their auth states.

For example, you are testing your app under `user` and `admin` roles. You can create two separte test files `user.spec.ts` and `admin.spec.ts`:

```ts
// user.spec.ts
import { test } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

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
import { globalCache } from '@global-cache/playwright';

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

> \[!TIP]
> Check out a fully working example of [multi user authentication](/examples/auth-multi-user/).

### Sharing a variable (BeforeAll)

You can calculate any variable once and re-use it in all tests.
For example, populate database with a user and assign user ID to a shared `userId` variable.
You can use either `beforeAll` or `before` hook, in this case it does not matter.

```ts
import { test } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

let userId = '';

test.beforeAll(async () => {
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

> \[!TIP]
> Check out a fully working example of [multi user authentication](/examples/auth-multi-user/).

### Caching network request

You can store and re-use result of a network request:

```ts
import { test } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

test.use({
  page: async ({ page }, use) => {
    // setup request mock
    await page.route('https://jsonplaceholder.typicode.com/users', async (route) => {
      // send real request once and store the response JSON
      const json = await globalCache.get('users-api-response', async () => {
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

If the response depends on query parameters or body, you should add these value to the cache key:

```ts
await page.route('/api/cats/**', (route, req) => {
  const query = new URL(req.url()).searchParams;
  const reqBody = req.postDataJSON();
  const cacheKey = `cats-api-response-${query.get('id')}-${reqBody.page}`;
  const json = globalCache.get(cacheKey, async () => {
      const response = await route.fetch();
      return response.json();
  });

  await route.fulfill({ json });
});
```

> \[!TIP]
> Check out a fully working example of [caching network request](/examples/cache-api-response/).

### Cleanup (single value)

After the test run, you may need to cleanup the created resources. For example, remove the user from the database. It can't be just called in `after / afterAll` hook, because at this point other workers may still need the value.

The solution is to preform cleanup in a custom teardown script via `globalCache.getStale()` method.

1. Define a custom teardown script in the Playwright config:

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

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
import { globalCache } from '@global-cache/playwright';

export default async function() {
    const userId = await globalCache.getStale('user-id');
    if (userId) {
        /* remove user from database */
    }
}
```

The result of `globalCache.getStale(key)` is different for non-presistent and persistent keys:

* **non-persistent**: returns the current value (as it will be cleared right after test run end)
* **persistent**: returns the previous value that was updated during the test run (as the current value may be reused in the subsequent runs)

> \[!TIP]
> Check out a fully working example of [cleanup](/examples/cleanup/).

### Cleanup (dynamic keys)

When using dynamic keys, you can use `globalCache.getStaleList(prefix)` to retrieve all values for the provided prefix:

```ts
// cleanup.ts
import { defineConfig } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

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
import { globalCache as genericGlobalCache, GlobalCache } from '@global-cache/playwright';

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

> \[!TIP]
> Check out a fully working example of [typed cache](/examples/typed-cache/).

## Configuration

To provide configuration options, call `globalCache.config()`:

```ts
import { globalCache } from '@global-cache/playwright';

globalCache.config({ 
  // ...global cache options
});
```

[Available options](#globalcachedefineconfigconfig).

## API

`globalCache` is a singleton used to manage cache values. Import it directly from the package:

```ts
import { globalCache } from '@global-cache/playwright';
```

### `globalCache.wrap(config)`

A helper method to adjust Playwright config for global cache usage.

**Parameters**:

* `config: object` - Playwright config

**Returns**: `object` - Playwright config with global cache configured.

### `globalCache.defineConfig(config)`

Configures global cache.

**Parameters**:

* `config: `
  * `basePath: string` - Path to a directory to store persistent values. Default is `.global-cache`.
  * `ignoreTTL: boolean` - Forces all values to be non-persistent, usefull for CI (where cross run caching is redundant). Default is `false`.
  * `disabled: boolean` - Disables global cache. All values will be computed each time. Default is `false`.

**Returns**: `void`

**Example**:

```ts
import { globalCache } from '@global-cache/playwright';

globalCache.defineConfig({ 
  basePath: 'path/to/cache',
  ignoreTTL: !!process.env.CI,
});
```

### `globalCache.get(key,[ params,] computeFn)`

Get value by key or compute it if not found.

**Parameters**:

* `key: string`
* `params: object`
  * `ttl: string | number | 'infinite'`
* `computeFn: Function`

**Returns**: `Promise`

### `globalCache.getStale(key)`

Get "stale" value for cleanup. The result is different for presistent and non-persistent keys:

* **non-persistent**: returns the current value (as it will be cleared right after test run end)
* **persistent**: returns the previous value that was replaced during the test run (as the current value can be reused in the future runs)

**Parameters**:

* `key: string`

**Returns**: `Promise`

### `globalCache.getStaleList(prefix)`

Get a list of "stale" values by prefix. The result follow the same rules as for `.getStale()`.

**Parameters**:

* `prefix: string`

**Returns**: `Promise<Array>`

### `globalCache.clearTestRun()`

Clears all non peristent keys for the current test-run.

**Returns**: `Promise`

### `globalCache.setup`

Returns an absolute path to the file, that performs the global cache setup.

**Returns**: `string`

### `globalCache.teardown`

Returns an absolute path to the file, that performs the global cache teardown.

**Returns**: `string`

### `globalCache.reporter`

Returns an absolute path to the global cache Playwright reporter, used for improving user experience with VSCode and UI-mode.

**Returns**: `string`

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

## FAQ

### How to use Global Cache in AfterAll hook?

Running some code once in a `AfterAll` hook is a bit tricky.
Unlike a `BeforeAll`, cleanup code is expected to run for the **last worker**, not for the first one.
But reliably detecting that “last call” is hard, as other tests may still be scheduled to access the value.

```ts
// ❌ Don't do this in `afterAll`
test.afterAll(async () => {
  await globalCache.get('key', async () => {
    // ...cleanup code 
  });
});
```

The cleanup would run as soon as the first worker finishes, while other workers might still use the resource.

**Do this instead:** move any "run-once-after-everything" logic to a global teardown. That guarantees all workers have finished. During the teardown, use Global Cache’s [getStale()](#globalcachegetstalekey) method to access the value and perform the cleanup.

## Feedback

Feel free to share your feedback and suggestions in the [issues](https://github.com/vitalets/global-cache/issues).

## License

[MIT](https://github.com/vitalets/global-cache/blob/main/LICENSE)
