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

![Playwright workers sharing Global Cache](/img/architecture.png)

A tiny local HTTP server coordinates cache access between Playwright workers. When several workers
request the same key, the first worker runs the computation while the others wait. When it finishes,
every worker receives the same stored value instead of repeating the expensive setup.

```ts
import { test } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

let userId = '';

test.beforeAll(async () => {
  userId = await globalCache.get('seeded-user-id', async () => {
    const user = await database.createUser();
    return user.id;
  });
});

// Every test receives the same user ID.
```

Start with [Installation](./installation.md), then learn the [basic usage](./usage/basic.md).
