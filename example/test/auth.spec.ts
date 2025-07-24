import { test, expect } from '@playwright/test';
import { globalStorage } from '@vitalets/global-storage';

test.use({
  storageState: async ({ browser }, use) => {
    // authenticate once, then re-use the storage state in all tests in this file.
    const storageState = await globalStorage.get('storage-state', { ttl: '1 min' }, async () => {
      const loginPage = await browser.newPage();
      await loginPage.goto('https://authenticationtest.com/simpleFormAuth/');
      await loginPage.getByLabel('E-Mail Address').fill('simpleForm@authenticationtest.com');
      await loginPage.getByLabel('Password').fill('pa$$w0rd');
      await loginPage.getByRole('button', { name: 'Log In' }).click();
      await expect(loginPage.getByRole('heading', { name: 'Login Success' })).toBeVisible();

      return loginPage.context().storageState();
    });
    await use(storageState);
  },
});

test('failing test', async ({ page }) => {
  await page.goto('https://authenticationtest.com');
  await expect(page.getByRole('link', { name: 'Sign Out' })).toBeVisible();
  throw new Error('This test is expected to fail');
});

test('passing test', async ({ page }) => {
  // although previous test fails and new worker is stared, auth state is re-used
  await page.goto('https://authenticationtest.com');
  await expect(page.getByRole('link', { name: 'Sign Out' })).toBeVisible();
});
