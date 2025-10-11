import { pathToFileURL } from 'node:url';
import { test, expect } from '@playwright/test';
import { globalCache } from '@global-cache/playwright';

const url = pathToFileURL(__dirname + '/../app.html').toString();

test.use({
  page: async ({ page }, use) => {
    // setup request mock
    await page.route('https://jsonplaceholder.typicode.com/users', async (route) => {
      // send real request only once and store the response in the global cache
      const json = await globalCache.get('users-api-response', async () => {
        console.log(`Sending real request to: ${route.request().url()}`);
        const response = await route.fetch();
        return response.json();
      });

      // modify the response for testing purposes
      json[0].name = 'Dummy';

      // fulfill the request with the modified response
      await route.fulfill({ json });
    });
    await use(page);
  },
});

test('failing test 1', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('body')).toContainText('"name": "Dummy"');
  throw new Error('Make test fail to start a new worker');
});

test('failing test 2', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('body')).toContainText('"name": "Dummy"');
  throw new Error('Make test fail to start a new worker');
});

test('failing test 3', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('body')).toContainText('"name": "Dummy"');
  throw new Error('Make test fail to start a new worker');
});
