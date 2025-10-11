import { test as base } from '@playwright/test';
import { signIn } from './auth';

export const test = base.extend({
  storageState: async ({ storageState, browser }, use, testInfo) => {
    // Skip authentication for '@no-auth'-tagged tests
    if (testInfo.tags.includes('@no-auth')) return use(storageState);

    const authState = await signIn(browser, {
      email: 'simpleForm@authenticationtest.com',
      password: 'pa$$w0rd',
    });

    await use(authState);
  },
});
