---
title: Cleanup
---

Do not delete a shared resource in `afterAll`: one worker may finish while another still needs it.
Instead, pass a cleanup callback to `globalCache.wrap()`:

```ts title="playwright.config.ts"
import { defineConfig } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

const config = defineConfig({
  testDir: './tests',
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

Use dynamic imports for cleanup-only dependencies. A top-level import in `playwright.config.ts` is also
evaluated in worker processes, while the callback runs only in Playwright's main process.

## Which value is stale?

- **Non-persistent key:** `getStale()` returns the current value, which is about to be cleared.
- **Persistent key:** when a value was replaced during this run, `getStale()` returns the previous
  value. The new value remains available for later runs.

Cleanup runs before Global Cache resets the test run, so stale values are still available.

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

## Why the reporter owns cleanup

Playwright invokes reporter `onEnd()` after every execution in CLI, UI, and VS Code modes. Global setup
and teardown are not reliably repeated for every execution when the main process remains alive. The
Global Cache reporter therefore runs cleanup and then resets run-scoped values; it does not stop the
server.

[View the runnable cleanup example](https://github.com/vitalets/global-cache/tree/docs/examples/cleanup).
