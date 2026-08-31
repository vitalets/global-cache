---
title: Cleanup
---

Cleaning up shared resources requires more care than cleaning up data created by a single test. A
Playwright `afterAll` hook runs once per worker, so one worker may delete a cached user, database
record, or other resource while another worker is still using it.

Global Cache provides a dedicated cleanup callback that runs after all workers have finished. Pass it
to `globalCache.wrap()` when configuring Playwright:

```ts title="playwright.config.ts"
import { defineConfig } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

const config = defineConfig({
  // ...your Playwright config
});

export default globalCache.wrap(config, {
  cleanup: async () => {
    const { removeUser } = await import('./tests/helpers/database');
    const userId = await globalCache.getStale('seeded-user-id');

    if (userId) {
      await removeUser(userId);
    }
  },
});
```

Keep cleanup-only dependencies inside the callback so test workers do not load code they never use.

## Which value is stale?

- **Non-persistent key:** `getStale()` returns the current value, which is about to be cleared.
- **Persistent key:** when a value was replaced during this run, `getStale()` returns the previous
  value. The new value remains available for later runs.

These stale values remain available for the duration of the cleanup callback.

## Dynamic keys

Use `getStaleList(prefix)` to clean a family of resources:

```ts
cleanup: async () => {
  const userIds = await globalCache.getStaleList<string>('created-user:');
  for (const userId of userIds) {
    await removeUser(userId);
  }
},
```

[View the runnable cleanup example](https://github.com/vitalets/global-cache/tree/main/examples/cleanup).
