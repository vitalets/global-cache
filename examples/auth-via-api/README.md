# Authentication via API Request with Global Cache

An example of authentication via API request with the global cache. 

The approach is more efficient than making auth request in a [separate project](https://playwright.dev/docs/auth#authenticate-with-api-request), because it authenticates on demand and doesn't require additional project.

## Details
- `auth.spec.ts` runs tests for authenticated user, and `no-auth.spec.ts` for non-authenticated.
- `fixtures.ts` overwrites `storageState` fixture to lazily perform authetication if the current test does not marked with `@no-auth` tag.

## Running all tests
When running all tests with 2 workers, authentication performed only in one worker (where it's really needed):
```
npx playwright test
```
Output:
```
Running 3 tests using 2 workers

  ✓  1 test/no-auth.spec.ts:5:5 › no auth test @no-auth (2.6s)
  ✘  2 test/auth.spec.ts:4:5 › test 1 (3.6s)
Performing sing-in...
Worker 1, user is NOT authenticated.
Worker 0, user is authenticated.
  ✘  3 test/auth.spec.ts:11:5 › test 2 (1.9s)
Worker 2, user is authenticated.
```

## Running no-auth test 
When running only no-auth test, authentication is skipped and test runs faster:
```
npx playwright test no-auth.spec.ts
```
Output:
```
Running 1 test using 1 worker

  ✓  1 test/no-auth.spec.ts:5:5 › no auth test @no-auth (2.1s)
Worker 0, user is NOT authenticated.
```

## Running on shards
When running on 2 shards, authentication is performed only in one shard:

Shard 1:
```
npx playwright test --shard=1/2
```
Output:
```
Running 2 tests using 1 worker, shard 1 of 2

  ✘  1 test/auth.spec.ts:4:5 › test 1 (4.3s)
Performing sing-in...
Worker 0, user is authenticated.
  ✘  2 test/auth.spec.ts:11:5 › test 2 (2.0s)
Worker 1, user is authenticated.
```

Shard 2:
```
npx playwright test --shard=2/2
```
Output:
```
Running 1 test using 1 worker, shard 2 of 2

  ✓  1 test/no-auth.spec.ts:5:5 › no-auth test @no-auth (2.3s)
Worker 0, user is NOT authenticated.
```