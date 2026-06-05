import { defineConfig } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

const config = defineConfig({
  testDir: './test',
});

export default globalCache.wrap(config, {
  cleanup: async () => {
    const userId = await globalCache.getStale('db-user-id');
    if (userId) {
      console.log(`\nRemoving user from db: ${userId}\n`);
    }
  },
});
