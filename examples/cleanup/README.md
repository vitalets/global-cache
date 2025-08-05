# Cleanup Example with Global Storage

This example demonstrates how to implement proper data cleanup with global storage. 

## Details
- User ID for test is lazily created in `beforeAll` hook and stored in the global storage.
- A custom teardown script `cleanup.ts` is added to the Playwright config. 
- The teardown script gets stale value for the user ID and removes it from db.

## Running tests
After all tests finish tardown 
```
npx playwright test
```
Output:
```
Running 2 tests using 1 worker

  ✓  1 index.spec.ts:16:5 › test 1 (0ms)
  ✓  2 index.spec.ts:20:5 › test 2 (0ms)
User created in db: 0.4337935196663074
Test 1 with user id: 0.4337935196663074
Test 2 with user id: 0.4337935196663074
Removing user from db: 0.4337935196663074

  2 passed (1.5s)
```
