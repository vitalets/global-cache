# Data Cleanup with Global Cache

An example of proper data cleanup with global cache. 

## Details
- A test user is lazily created in `beforeAll` hook and its ID is stored in the global cache.
- A custom teardown script `cleanup.ts` is added to the Playwright config. 
- The teardown script gets stale value for the user ID and removes the user from db.

## Running tests
```
cd examples/cleanup
npx playwright test
```
Output:
```
Running 2 tests using 1 worker

  ✓  1 test/index.spec.ts:16:5 › test 1 (0ms)
  ✓  2 test/index.spec.ts:20:5 › test 2 (0ms)
User created in db: 79
Running test 1 with user id: 79
Running test 2 with user id: 79
Removing user from db: 79

  2 passed (1.5s)
```
