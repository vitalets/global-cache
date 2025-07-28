import { expect } from '@playwright/test';
import { test } from './fixtures';

test('failing test', async ({ page }) => {
  await page.goto('https://authenticationtest.com');
  await expect(page.getByRole('link', { name: 'Sign Out' })).toBeVisible(); // authenticated!
  throw new Error('Make test fail to create new worker');
});

test('passing test', async ({ page }) => {
  // although previous test fails and new worker is stared, auth state is re-used
  await page.goto('https://authenticationtest.com');
  await expect(page.getByRole('link', { name: 'Sign Out' })).toBeVisible(); // authenticated!
});
