---
title: Global Cache for Playwright
sidebar_label: Overview
slug: /playwright
---

`@global-cache/playwright` connects [Global Cache Core](../core/index.md) to Playwright Test. It starts
the shared server before workers run and uses a reporter to perform cleanup and reset run-scoped data
after every execution—including runs started from UI mode and the VS Code extension.

Use it to perform expensive work only when a test needs it and share the result across workers:

- Authenticate users on demand.
- Seed a database once.
- Cache API responses or computed fixtures.
- Persist reusable values across test runs.
- Clean up shared resources after all workers finish.

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
