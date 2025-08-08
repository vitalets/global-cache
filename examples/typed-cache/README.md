# Typed Global Cache

An example of typed global cache.

## Details
- Allowed keys and values schema is defined in `test/global-cache.ts` file, that re-exports typed cache instance.
- All calls of `globalCache.get(key)` and other methods are strictly typed. 

## Testing

```ts
import { globalCache } from './global-cache';

// valid call
const userInfo = await globalCache.get('user-info', fn);

// invalid call
const value = await globalCache.get('foo', fn);
```
