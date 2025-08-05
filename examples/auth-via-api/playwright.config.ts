import { defineConfig } from '@playwright/test';
import { globalStorage } from '@vitalets/global-storage';

export default defineConfig({
  testDir: './test',
  globalSetup: globalStorage.setup,
  globalTeardown: globalStorage.teardown,
});
