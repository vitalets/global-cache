# Data Cleanup with Global Cache

An example of proper data cleanup with global globalCache. 

## Details
- A test user is lazily created in `beforeAll` hook and its ID is stored in the global globalCache.
- A custom teardown script `cleanup.ts` is added to the Playwright config. 
- The teardown script gets stale value for the user ID and removes the user from db.

## Running tests
After all tests finish tardown 
```
npx playwright test
```
Output:
```
Running 2 tests using 1 worker

  ✓  1 test/index.spec.ts:16:5 › test 1 (0ms)
  ✓  2 test/index.spec.ts:20:5 › test 2 (0ms)
User created in db: 0.4337935196663074
Test 1 with user id: 0.4337935196663074
Test 2 with user id: 0.4337935196663074
Removing user from db: 0.4337935196663074

  2 passed (1.5s)
```
