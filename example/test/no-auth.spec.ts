import { test, expect } from '@playwright/test';

test('no auth test', async ({ page }) => {
  await page.goto('https://authenticationtest.com');
  await expect(page.getByText('Please Sign In')).toBeVisible();
});
