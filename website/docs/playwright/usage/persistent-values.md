---
title: Persistent values
---

By default, values live in memory for one Playwright execution. Pass a time to live (TTL) to persist a
value on the filesystem and reuse it in later runs:

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

A persistent value is recalculated when its TTL expires, its computation signature changes, or the key
is deleted. The first worker to encounter the invalid value performs the new computation while other
workers wait.

To force recalculation explicitly:

```ts
await globalCache.delete('auth-state');
```

`delete()` removes both the in-memory and filesystem entries.

## CI

Filesystem persistence often provides no benefit on an ephemeral CI runner. Set `ignoreTTL: true` to
keep the same application code while treating all values as run-scoped:

```ts
globalCache.config({ ignoreTTL: Boolean(process.env.CI) });
```
