import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { globalStorage } from '@vitalets/global-storage';

const url = pathToFileURL(__dirname + '/index.html').toString();

test.use({
  page: async ({ page }, use) => {
    // setup request mock
    await page.route('https://jsonplaceholder.typicode.com/users', async (route) => {
      // send real request only once and store the response in the global storage
      const json = await globalStorage.get('users-response', async () => {
        console.log(`Sending real request to: ${route.request().url()}`);
        await new Promise((r) => setTimeout(r, 1000)); // emulate the delay
        const response = await route.fetch();
        return response.json();
      });
      json[0].name = 'Dummy'; // modify the response
      await route.fulfill({ json }); // fulfill the request with cached data
    });
    await use(page);
  },
});

test('failing test 1', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('body')).toContainText('"name": "Dummy"');
  throw new Error('Make test fail to create a new worker');
});

test('failing test 2', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('body')).toContainText('"name": "Dummy"');
  throw new Error('Make test fail to create a new worker');
});

test('failing test 3', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('body')).toContainText('"name": "Dummy"');
  throw new Error('Make test fail to create a new worker');
});
