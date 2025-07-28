import { expect } from '@playwright/test';
import { test } from './fixtures';

// this test does not trigger auth flow because of @no-auth tag
test('no auth test', { tag: '@no-auth' }, async ({ page }) => {
  await page.goto('https://authenticationtest.com');
  await expect(page.getByText('Please Sign In')).toBeVisible(); // not authenticated!
});
