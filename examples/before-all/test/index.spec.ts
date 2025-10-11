import { test } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

let userId = '';

test.beforeAll(async () => {
  // This code will create a user once for all workers.
  userId = await globalCache.get('user-id', async () => {
    console.log('Creating user in db...');

    const userId = Math.random().toString().slice(-2); // emulate user creation in db
    await new Promise((r) => setTimeout(r, 1000)); // emulate delay

    return userId;
  });
});

test('test 1', async ({}, testInfo) => {
  console.log(`Worker ${testInfo.workerIndex}, using user id: ${userId}`);
  throw new Error('Make test fail to start a new worker');
});

test('test 2', async ({}, testInfo) => {
  console.log(`Worker ${testInfo.workerIndex}, using user id: ${userId}`);
  throw new Error('Make test fail to start a new worker');
});

test('test 3', async ({}, testInfo) => {
  console.log(`Worker ${testInfo.workerIndex}, using user id: ${userId}`);
  throw new Error('Make test fail to start a new worker');
});
