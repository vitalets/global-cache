import { defineConfig } from '@playwright/test';
import { globalStorage } from '@vitalets/global-storage';

/* Uncomment to disable global storage and compare test results */
// globalStorage.defineConfig({
//   disabled: true,
// });

export default defineConfig({
  testDir: './test',
  globalSetup: globalStorage.setup,
  globalTeardown: globalStorage.teardown,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
});
