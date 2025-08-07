import { defineConfig } from '@playwright/test';
import { storage } from 'parallel-storage';

export default defineConfig({
  testDir: './test',
  globalSetup: storage.setup,
  globalTeardown: storage.teardown,
});
