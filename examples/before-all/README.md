# Usage of BeforeAll Hook with Global Cache

This example shows how to make `beforeAll` hook execute exactly once with the global globalCache. 
It's how most people expect `beforeAll` to work.

## Details

- There are 3 identical tests in `test/index.spec.ts`, each test intentionally fails to start a new worker.
- `test.beforeAll` hook emulates test user creation in DB.
- Created user's ID is stored in the global cache under `user-id` key and re-used in all tests.

> In fact, `test.beforeAll` can be replaced with `test.beforeEach` here - the code will run once anyway.

## Running tests

Although there are 3 workers created during the test run, a user is created only once:
```
npx playwright test
```
Output:
```
Running 3 tests using 1 worker

  ✘  1 test/index.spec.ts:19:5 › test 1 (1ms)
Creating user in db...
Worker 0, using user id: 0.6415918256249196
  ✘  2 test/index.spec.ts:24:5 › test 2 (1ms)
Worker 1, using user id: 0.6415918256249196
  ✘  3 test/index.spec.ts:29:5 › test 3 (1ms)
Worker 2, using user id: 0.6415918256249196
```
