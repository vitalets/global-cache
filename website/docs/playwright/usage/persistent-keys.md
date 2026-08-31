---
title: Persistent keys
---

By default, keys live in memory for one Playwright execution. Pass a time to live (TTL) to persist a
key's value on the filesystem and reuse it in later runs:

```ts
const authState = await globalCache.get('auth-state', { ttl: '1 hour' }, async () => {
  const page = await browser.newPage();
  await signIn(page);
  return page.context().storageState();
});
```

TTL accepts:

- A number of milliseconds.
- An [`ms`](https://github.com/vercel/ms)-compatible string such as `'5 min'` or `'1 hour'`.
- `'infinite'` for no time-based expiration.

The default directory is `.global-cache`:

```text
.global-cache/
└── auth-state.json
```

Add this directory to `.gitignore`, or choose another path with
[`basePath`](../configuration.md#options).

## Recalculation

The value for a persistent key is recalculated when its TTL expires, its computation signature
changes, or the key is deleted. The first worker to encounter the invalid value performs the new
computation while other workers wait.

To force recalculation you can either:

- delete the corresponding file in the `.global-cache` directory
- invoke the `.delete()` method:
    ```ts
    await globalCache.delete('auth-state');
    ```
    `delete()` removes both the in-memory and filesystem entries.

## CI

Filesystem persistence often provides no benefit on an ephemeral CI runner. Set `ignoreTTL: true` to
keep the same application code while treating all keys as run-scoped:

```ts
globalCache.config({ 
  ignoreTTL: Boolean(process.env.CI) 
});
```
