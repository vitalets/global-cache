---
title: Installation
---

Install the Playwright integration as a development dependency:

```bash npm2yarn
npm install --save-dev @global-cache/playwright
```

Wrap your Playwright configuration:

```ts title="playwright.config.ts"
import { defineConfig } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

const config = defineConfig({
  testDir: './tests',
});

export default globalCache.wrap(config);
```

The wrapper preserves your existing Playwright configuration and enables Global Cache for every test
run. No additional setup or teardown files are required.

Add the persistent cache directory to source control ignores:

```gitignore title=".gitignore"
.global-cache
```

You are ready to [cache a value](./usage/basic.md).
