import { test } from '@playwright/test';
import { globalStorage } from '@vitalets/global-storage';

let userId = '';

test.beforeAll(async () => {
  // This code in beforeAll will run exactly once across all workers.
  // It's how most people expect beforeAll to behave.
  userId = await globalStorage.get('user-id', async () => {
    console.log('Creating user in db...');
    await new Promise((r) => setTimeout(r, 1000)); // emulate the delay
    return Math.random().toString();
  });
});

test('failing test 1', async ({}, testInfo) => {
  console.log(`Worker ${testInfo.workerIndex}, using user id: ${userId}`);
  throw new Error('Make test fail to create a new worker');
});

test('failing test 2', async ({}, testInfo) => {
  console.log(`Worker ${testInfo.workerIndex}, using user id: ${userId}`);
  throw new Error('Make test fail to create a new worker');
});

test('failing test 3', async ({}, testInfo) => {
  console.log(`Worker ${testInfo.workerIndex}, using user id: ${userId}`);
  throw new Error('Make test fail to create a new worker');
});
