import { defineConfig } from '@playwright/test';
import { globalStorage } from '@vitalets/global-storage';

export default defineConfig({
  testDir: './test',
  globalSetup: globalStorage.setup,
  globalTeardown: [
    require.resolve('./test/cleanup'), // <-- custom teardown script for cleanup
    globalStorage.teardown,
  ],
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
});
