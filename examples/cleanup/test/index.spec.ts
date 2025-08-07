import { test } from '@playwright/test';
import { globalCache } from '@vitalets/global-cache';

let userId = '';

test.beforeAll(async () => {
  userId = await globalCache.get('db-user-id', async () => {
    const userId = Math.random().toString(); // emulate user creation in db
    await new Promise((r) => setTimeout(r, 1000)); // emulate delay
    console.log(`User created in db: ${userId}`);

    return userId;
  });
});

test('test 1', async () => {
  console.log(`Test 1 with user id: ${userId}`);
});

test('test 2', async () => {
  console.log(`Test 2 with user id: ${userId}`);
});
