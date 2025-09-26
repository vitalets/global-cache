import { defineConfig } from '@playwright/test';
import { globalCache } from '@vitalets/global-cache';

export default globalCache.playwright(
  defineConfig({
    testDir: './test',
    globalTeardown: require.resolve('./test/cleanup'), // <-- custom teardown script for cleanup
  }),
);
