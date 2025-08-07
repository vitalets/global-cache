import { defineConfig } from '@playwright/test';
import { globalCache } from '@vitalets/global-cache';

export default defineConfig({
  testDir: './test',
  globalSetup: globalCache.setup,
  globalTeardown: [
    require.resolve('./test/cleanup'), // <-- custom teardown script for cleanup
    globalCache.teardown,
  ],
});
