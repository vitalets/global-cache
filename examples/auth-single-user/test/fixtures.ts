import { test as baseTest, expect } from '@playwright/test';
import { globalCache } from '@vitalets/global-cache';

export const test = baseTest.extend({
  storageState: async ({ storageState, browser }, use, testInfo) => {
    // Skip authentication for '@no-auth'-tagged tests
    if (testInfo.tags.includes('@no-auth')) return use(storageState);

    // Get auth state: authenticate only if not authenticated yet.
    // Cache auth for 5 minutes, to reuse in futher test runs as well!
    const authState = await globalCache.get('auth-state', { ttl: '5 min' }, async () => {
      console.log('Performing sing-in...');
      const loginPage = await browser.newPage(); // <-- important to use 'browser', not 'page' or 'context' fixture to avoid circullar dependency

      await loginPage.goto('https://authenticationtest.com/simpleFormAuth/');
      await loginPage.getByLabel('E-Mail Address').fill('simpleForm@authenticationtest.com');
      await loginPage.getByLabel('Password').fill('pa$$w0rd');
      await loginPage.getByRole('button', { name: 'Log In' }).click();
      await expect(loginPage.getByRole('heading', { name: 'Login Success' })).toBeVisible();

      return loginPage.context().storageState();
    });

    await use(authState);
  },
});
