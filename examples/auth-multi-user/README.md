# Multi-User Authentication with Global Cache

An example of multi-user authentication with global cache. 

The approach is more efficient than the [multi-role auth project](https://playwright.dev/docs/auth#multiple-signed-in-roles), because only needed roles get authenticated.

## Details
- User credentials are stored in `test/users.ts`.
- Two spec files `test/{user,admin}.spec.ts` perform lazy authentication of the respective user and run test scenarios.
- Helper file `test/auth.ts` contains common auth function that is re-used in all tests.

## Running all tests
When running all tests with 2 workers, each file triggers authentication for its role:
```
cd examples/auth-multi-user
npx playwright test
```
Output:
```
Running 2 tests using 2 workers

  ✓  1 test/admin.spec.ts:11:5 › test for admin (2.7s)
  ✓  2 test/user.spec.ts:11:5 › test for user (2.7s)
Singing-in as admin
Singing-in as user

  2 passed (3.5s)
```

## Running single test 
Running single test file triggers authentication **only for the required role**:
```
npx playwright test user.spec.ts
```
Output:
```
Running 1 test using 1 worker

  ✓  1 test/user.spec.ts:11:5 › test for user (2.8s)
Singing-in as user
```

## Running on shards
When running on 2 shards, each shard executes faster, because authenticates only the required user.

Shard 1:
```
npx playwright test --shard=1/2
```
Output:
```
Running 1 test using 1 worker, shard 1 of 2

  ✓  1 test/admin.spec.ts:11:5 › test for admin (2.7s)
Singing-in as admin

  1 passed (3.7s)
```

Shard 2:
```
npx playwright test --shard=2/2
```
Output:
```
Running 1 test using 1 worker, shard 2 of 2

  ✓  1 test/user.spec.ts:11:5 › test for user (2.7s)
Singing-in as user

  1 passed (3.6s)
```