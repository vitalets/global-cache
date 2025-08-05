import { defineConfig } from '@playwright/test';
import { globalStorage } from '@vitalets/global-storage';

export default defineConfig({
  globalSetup: globalStorage.setup,
  globalTeardown: [
    require.resolve('./cleanup'), // <-- custom teardown script for cleanup
    globalStorage.teardown,
  ],
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
});
