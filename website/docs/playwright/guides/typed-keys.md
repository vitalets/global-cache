---
title: Typed keys
---

Typed keys catch misspelled keys and mismatched value types before tests run. Define a schema for
the cache keys and their values, then re-export a typed cache instance:

```ts title="tests/helpers/global-cache.ts"
import {
  globalCache as genericGlobalCache,
  type GlobalCache,
} from '@global-cache/playwright';

export type CacheSchema = {
  'user-id': string;
  'user-info': { name: string; email: string };
};

export const globalCache = genericGlobalCache as GlobalCache<CacheSchema>;
```

Import that instance everywhere else:

```ts
import { globalCache } from './helpers/global-cache';

const userInfo = await globalCache.get('user-info', async () => ({
  name: 'Test User',
  email: 'test@example.com',
}));
```

TypeScript now checks the key, the computation's return type, and the resolved value. Unknown keys are
rejected.

[View the runnable typed-keys example](https://github.com/vitalets/global-cache/tree/main/examples/typed-cache).
