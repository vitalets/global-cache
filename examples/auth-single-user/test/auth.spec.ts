import { expect } from '@playwright/test';
import { test } from './fixtures';

test('test 1', async ({ page }, testInfo) => {
  await page.goto('https://authenticationtest.com');
  await expect(page.getByRole('link', { name: 'Sign Out' })).toBeVisible();
  console.log(`Worker ${testInfo.workerIndex}, user is authenticated.`);
  throw new Error('Make test fail to start a new worker');
});

test('test 2', async ({ page }, testInfo) => {
  // although previous test fails and new worker is stared, auth state is re-used
  await page.goto('https://authenticationtest.com');
  await expect(page.getByRole('link', { name: 'Sign Out' })).toBeVisible();
  console.log(`Worker ${testInfo.workerIndex}, user is authenticated.`);
  throw new Error('Make test fail to start a new worker');
});
