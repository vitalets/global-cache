import { defineConfig } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

const config = defineConfig({
  testDir: './test',
});

export default globalCache.wrap(config);
