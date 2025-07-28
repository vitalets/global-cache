import { test as baseTest } from '@playwright/test';
import { globalStorage } from '@vitalets/global-storage';

export const test = baseTest.extend({
  storageState: async ({ storageState, playwright }, use, testInfo) => {
    if (!testInfo.tags.includes('@no-auth')) {
      // - perform auth only for tests not marked with '@no-auth' tag
      // - authenticate once, then re-use the storage state in all tests
      storageState = await globalStorage.get('storage-state-via-api', async () => {
        console.log('Performing sing-in...');
        // important to use 'playwright' fixture, not 'request' to avoid cyclic dependency
        const request = await playwright.request.newContext();
        await request.post('https://authenticationtest.com//login/?mode=simpleFormAuth', {
          form: {
            email: 'simpleForm@authenticationtest.com',
            password: 'pa$$w0rd',
          },
        });
        return request.storageState();
      });
    }
    await use(storageState);
  },
});
