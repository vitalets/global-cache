import { APIRequest } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

/**
 * Performs sign-in via API and caches the auth state for the test run.
 */
export async function signIn(
  request: APIRequest,
  credentials: { email: string; password: string },
) {
  return globalCache.get('auth-state-via-api', async () => {
    console.log(`Singing-in as: ${credentials.email}`);

    const ctx = await request.newContext();
    await ctx.post('https://authenticationtest.com//login/?mode=simpleFormAuth', {
      form: credentials,
    });

    return ctx.storageState();
  });
}
