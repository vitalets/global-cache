import { expect } from '@playwright/test';
import { test } from './helpers/fixtures';

// this test does not trigger auth because of @no-auth tag
test('no-auth test', { tag: '@no-auth' }, async ({ page }, testInfo) => {
  await page.goto('https://authenticationtest.com');
  await expect(page.getByText('Please Sign In')).toBeVisible();
  console.log(`Worker ${testInfo.workerIndex}, user is NOT authenticated.`);
});
