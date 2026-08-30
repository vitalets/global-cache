---
title: FAQ
---

## Why not clean up in `afterAll`?

`afterAll` runs per worker. The first worker to finish can delete a resource while other workers still
need it. Use the [`cleanup` callback](./guides/cleanup.md), which runs after the complete execution.

## Why did Global Cache report a signature mismatch?

The same key was requested with a different computation, TTL, or call site during one run. Give each
logical computation a unique key and keep one canonical call site per key.

## Can I cache a Playwright page or database connection?

No. Values cross an HTTP/JSON boundary. Cache serializable data such as a storage state, identifier,
token, or plain response, then use it to configure a local object.

## How do I force a value to be recalculated?

Call `await globalCache.delete(key)`. It removes the in-memory and persistent value, so the next
`get()` computes it again.

## Should I persist values in CI?

Usually not on ephemeral runners. Set `ignoreTTL: true` in CI so values remain shared within a run but
are not written for reuse by later runs. If your CI restores `.global-cache` deliberately, keep TTLs
enabled.

## Why does the server stay alive in UI mode or VS Code?

Those modes keep Playwright's main process alive between executions. Global Cache keeps the same local
server and resets its run-scoped state from reporter `onEnd()` after every execution. In CLI mode, the
server is unreferenced and exits naturally with the process.

## Can multiple shards share values?

Yes, if they can reach the same external Core server and use the same `GLOBAL_CACHE_RUN_ID`. The
external coordinator then owns cleanup for that shared run.
