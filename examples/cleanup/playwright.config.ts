import { defineConfig } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

const config = defineConfig({
  testDir: './test',
  globalTeardown: require.resolve('./test/cleanup'), // <-- custom teardown script for cleanup
});

export default globalCache.wrap(config);
