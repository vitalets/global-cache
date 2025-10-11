import { test as baseTest } from '@playwright/test';
import { signIn } from './auth';

export const test = baseTest.extend({
  storageState: async ({ storageState, playwright }, use, testInfo) => {
    // Skip authentication for '@no-auth'-tagged tests
    if (testInfo.tags.includes('@no-auth')) return use(storageState);

    // Important to use 'playwright' fixture, not 'request' fixture to avoid cyclic dependency
    const authState = await signIn(playwright.request, {
      email: 'simpleForm@authenticationtest.com',
      password: 'pa$$w0rd',
    });

    await use(authState);
  },
});
