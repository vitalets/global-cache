import { Browser, expect } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

/**
 * Performs sign-in and persistently caches the auth state for 5 minutes.
 */
export async function signIn(browser: Browser, credentials: { email: string; password: string }) {
  return globalCache.get(`auth-state`, { ttl: '5 min' }, async () => {
    console.log(`Singing-in as: ${credentials.email}`);

    const loginPage = await browser.newPage();
    await loginPage.goto('https://authenticationtest.com/simpleFormAuth/');
    await loginPage.getByLabel('E-Mail Address').fill(credentials.email);
    await loginPage.getByLabel('Password').fill(credentials.password);
    await loginPage.getByRole('button', { name: 'Log In' }).click();
    await expect(loginPage.getByRole('heading', { name: 'Login Success' })).toBeVisible();

    return loginPage.context().storageState();
  });
}
