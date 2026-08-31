---
title: Debugging
---

Enable all Global Cache debug namespaces when running Playwright:

```bash
DEBUG=global-cache* npx playwright test
```

Or set it before Playwright loads the configuration:

```ts title="playwright.config.ts"
process.env.DEBUG = 'global-cache*';
```

The output shows when a key is computed, reused, persisted, or removed. It also includes the address
of the small local cache server. For example:

```text
global-cache Starting server...
global-cache Starting server: done http://localhost:50138
global-cache:auth-state Fetching value...
global-cache:auth-state Computed: {"cookies":[...]}
global-cache:auth-state Saving value for 1h...
global-cache:auth-state Fetching value...
global-cache:auth-state cache-hit: {"cookies":[...]}
```

Limit logging to one key by using its namespace:

```bash
DEBUG=global-cache:auth-state npx playwright test
```

Run-scoped values are refreshed between executions in command-line, UI, and VS Code modes. Values
with a TTL may be reused across executions until they expire or are explicitly deleted.
