import { defineConfig } from '@playwright/test';
import { globalCache } from '@vitalets/global-cache';

export default globalCache.playwright(
  defineConfig({
    testDir: './test',
  }),
);
