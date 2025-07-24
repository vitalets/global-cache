import { test, expect } from '@playwright/test';

// this file does not trigger auth flow

test('no auth test', async ({ page }) => {
  await page.goto('https://authenticationtest.com');
  await expect(page.getByText('Please Sign In')).toBeVisible();
});
