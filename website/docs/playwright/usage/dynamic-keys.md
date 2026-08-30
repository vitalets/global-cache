---
title: Dynamic keys
---

Include every input that affects a computation in its key:

```ts
async function loadAccount(accountId: string) {
  return globalCache.get(`account-${accountId}`, () => api.getAccount(accountId));
}
```

Without `accountId` in the key, the first loaded account would be returned for every later request.

Use stable, deterministic key parts. Avoid random values, timestamps, or worker indexes unless they
are genuinely part of the logical identity; those values prevent workers from sharing the entry.

## Namespacing keys

Prefixes make dynamic values easy to group and clean up:

```ts
const userId = await globalCache.get(`created-user:${role}`, () => createUser(role));
```

The matching cleanup callback can retrieve all old values:

```ts
const userIds = await globalCache.getStaleList<string>('created-user:');
```

See [Cleanup](../guides/cleanup.md) for the complete lifecycle.
