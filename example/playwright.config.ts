import { defineConfig } from '@playwright/test';
import { globalStorage } from 'global-storage';

// Uncomment to provide global storage configuration
// globalStorage.defineConfig({
//   disabled: true,
// });

export default defineConfig({
  globalSetup: globalStorage.setup,
  globalTeardown: globalStorage.teardown,
  testDir: './test',
  reporter: [['html', { open: 'never' }]],
  use: {
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
});
