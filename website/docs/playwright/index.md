---
title: Global Cache for Playwright
sidebar_label: Overview
slug: /playwright
---

Global Cache provides an integration with [Playwright](https://playwright.dev/) through the dedicated
[`@global-cache/playwright`](https://www.npmjs.com/package/@global-cache/playwright) package. It makes
shared cached values available from tests, fixtures, and hooks. Parallel workers can reuse expensive
setup data instead of repeating it.

Use it to perform expensive work and share the result across workers:

- Authenticate users on demand.
- Seed a database once.
- Cache API responses or computed fixtures.
- Persist reusable values across test runs.
- Clean up shared resources after all workers finish.

## How it works

![Playwright workers sharing Global Cache](/img/how-it-works-pw.png)

A tiny local HTTP server coordinates cache access between Playwright workers. When several workers
request the same key, the first worker runs the computation while the others wait. When it finishes,
every worker receives the same stored value instead of repeating the expensive setup.

## Example

This example creates a test user once and shares its ID across all tests and workers. Even in fully parallel mode or after a test failure, the user is reused rather than created again:

```ts
import { test } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

let userId = '';

test.beforeAll(async () => {
  // Create a test user once and cache it for the entire test run.
  userId = await globalCache.get('test-user', async () => {
    const user = await database.createUser();
    return user.id;
  });
});

test('test 1', async ({ page }) => {
  // uses 'userId'
});

test('test 2', async ({ page }) => {
  // uses the same 'userId'
});
```

Start with [Installation](./installation.md), then learn the [basic usage](./usage/basic.md).
