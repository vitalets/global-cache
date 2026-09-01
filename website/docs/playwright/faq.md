---
title: FAQ
---

## Why not clean up in `after*` hooks?

`afterAll` runs per worker, and `afterEach` runs per test. Either can delete a shared resource while
other tests or workers still need it. Use the dedicated [`cleanup` callback](./usage/cleanup.md), which
runs after the complete execution.

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

## Do I need to stop the local server?

No. The Playwright integration manages the small local HTTP server in command-line, UI, and VS Code
runs. Run-scoped values are refreshed between executions even when Playwright keeps its process open.

## Can multiple shards share values?

Yes, if they can reach the same external Core server and use the same `GLOBAL_CACHE_RUN_ID`. The
system launching the shards should use a new run ID for each unrelated execution and clean shared
resources only after every shard finishes.
