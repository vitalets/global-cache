import { test } from '@playwright/test';
import { globalCache, GlobalCacheSchema } from './global-cache';

let userInfo: GlobalCacheSchema['user-info'];

test.beforeAll(async () => {
  // only known keys are allowed, userInfo is properly typed
  userInfo = await globalCache.get('user-info', async () => {
    const userInfo = { name: 'test-user', email: 'test@email.com' };
    return userInfo;
  });
});

test('test 1', async () => {
  console.log(`Test 1 with user info:`, userInfo);
});

test('test 2', async () => {
  console.log(`Test 2 with user info:`, userInfo);
});
