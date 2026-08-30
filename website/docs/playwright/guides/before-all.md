---
title: Share work from beforeAll
---

Playwright runs `beforeAll` once per worker process, not necessarily once for the whole test run. Wrap
the expensive part with Global Cache when every worker should reuse one result:

```ts
import { test } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

let userId: string;

test.beforeAll(async () => {
  userId = await globalCache.get('seeded-user-id', async () => {
    const user = await database.createUser();
    return user.id;
  });
});
```

If a failed test causes Playwright to create another worker, the new worker calls `beforeAll` again but
receives the cached user ID without creating another database record.

The same coordination works from `beforeEach`; choose the Playwright hook based on where the value
should be assigned, not based on how often the expensive computation may run.

[View the runnable beforeAll example](https://github.com/vitalets/global-cache/tree/docs/examples/before-all).
