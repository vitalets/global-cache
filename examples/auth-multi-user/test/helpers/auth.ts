import { Browser, expect } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';
import { users } from './users';

/**
 * Performs sign-in for a given role and caches the auth state for the test run.
 */
export async function signIn(browser: Browser, role: 'user' | 'admin') {
  const { email, password } = users[role];
  return globalCache.get(`auth-state-${role}`, async () => {
    console.log(`Singing-in as: ${role}`);

    const loginPage = await browser.newPage();
    await loginPage.goto('https://authenticationtest.com/simpleFormAuth/');
    await loginPage.getByLabel('E-Mail Address').fill(email);
    await loginPage.getByLabel('Password').fill(password);
    await loginPage.getByRole('button', { name: 'Log In' }).click();
    await expect(loginPage.getByRole('heading', { name: 'Login Success' })).toBeVisible();

    return loginPage.context().storageState();
  });
}
