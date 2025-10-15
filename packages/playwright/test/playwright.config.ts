import { defineConfig } from '@playwright/test';
import { globalCache } from '../src';

const config = defineConfig({
  testDir: '.',
});

export default globalCache.wrap(config);
