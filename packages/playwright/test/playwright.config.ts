import { defineConfig } from '@playwright/test';
import { globalCache } from '../src';

const config = defineConfig({
  testDir: '.',
});

export default globalCache.wrap(config, {
  cleanup: async () => {
    const userId = await globalCache.getStale('user-id');
    if (userId !== 'foo') {
      throw new Error(`Expected stale userId to be "foo", got: ${JSON.stringify(userId)}`);
    }
  },
});
