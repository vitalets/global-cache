---
title: Cache an API response
---

Cache an upstream response inside a Playwright route handler when many workers need the same data:

```ts
test.use({
  page: async ({ page }, use) => {
    await page.route('https://api.example.com/users', async (route) => {
      const users = await globalCache.get('users-api-response', async () => {
        const response = await route.fetch();
        return response.json();
      });

      await route.fulfill({ json: users });
    });

    await use(page);
  },
});
```

The real request is sent once. Later route handlers receive the serialized response from Core.

If request parameters affect the result, include them in the key:

```ts
const request = route.request();
const page = request.postDataJSON()?.page ?? 1;
const id = new URL(request.url()).searchParams.get('id');
const key = `cats-response:${id}:page-${page}`;

const json = await globalCache.get(key, async () => {
  const response = await route.fetch();
  return response.json();
});
```

[View the runnable API-response example](https://github.com/vitalets/global-cache/tree/docs/examples/cache-api-response).
