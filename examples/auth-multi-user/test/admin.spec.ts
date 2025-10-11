import { test, expect } from '@playwright/test';
import { signIn } from './helpers/auth';

test.use({
  storageState: async ({ storageState, browser }, use) => {
    storageState = await signIn(browser, 'admin');
    await use(storageState);
  },
});

test('test for admin', async ({ page }) => {
  await page.goto('https://authenticationtest.com');
  await expect(page.getByRole('link', { name: 'Sign Out' })).toBeVisible();
});
