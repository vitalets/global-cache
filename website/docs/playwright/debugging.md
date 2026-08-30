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

The output shows server startup, cache lookups, computation, persistence, and run reset activity. For
example:

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

In CLI mode, the unreferenced server exits naturally when Playwright exits. In UI mode and the VS Code
extension, Playwright keeps the main process alive, so the server remains available and the reporter
resets the run after each execution.
