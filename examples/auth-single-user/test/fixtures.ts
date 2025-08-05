import { test as baseTest, expect } from '@playwright/test';
import { globalStorage } from '@vitalets/global-storage';

export const test = baseTest.extend({
  storageState: async ({ storageState, browser }, use, testInfo) => {
    if (!testInfo.tags.includes('@no-auth')) {
      // - perform auth only for tests not marked with '@no-auth' tag
      // - authenticate once, then re-use the storage state in all tests
      // - re-use auth for subsequent test-runs within 5 minutes
      storageState = await globalStorage.get('storage-state', { ttl: '5 min' }, async () => {
        console.log('Performing sing-in...');
        const loginPage = await browser.newPage(); // <-- important to use 'browser', not 'page' or 'context' fixture to avoid circullar dependency
        await loginPage.goto('https://authenticationtest.com/simpleFormAuth/');
        await loginPage.getByLabel('E-Mail Address').fill('simpleForm@authenticationtest.com');
        await loginPage.getByLabel('Password').fill('pa$$w0rd');
        await loginPage.getByRole('button', { name: 'Log In' }).click();
        await expect(loginPage.getByRole('heading', { name: 'Login Success' })).toBeVisible();

        return loginPage.context().storageState();
      });
    }
    await use(storageState);
  },
});
