# Example: Cache API Response

This example shows how to cache API response with the global storage.

## Details

- Webpage under test `index.html` performs a fetch request to https://jsonplaceholder.typicode.com/users and renders list of users. API response has a synthetic delay of 1s.
- There are 3 identical tests in `test/index.spec.ts`, checking the page output. Each test intentionally fails to start a new worker.
- The `page` fixture sets up a request interceptor via `page.route`, fetches actual data and stores the  response in the global storage under `users-response` key.
- All subsequent workers instantly receive response from global storage.

## Running tests

Real request is sent only once. Execution time: **~2s**.
```
Running 3 tests using 1 worker

  ✘  1 test/index.spec.ts:25:5 › failing test 1 (2.3s)
Sending real request to: https://jsonplaceholder.typicode.com/users
  ✘  2 test/index.spec.ts:31:5 › failing test 2 (220ms)
  ✘  3 test/index.spec.ts:37:5 › failing test 3 (197ms)
```

## Running tests (without global storage)

Real request is sent in each worker, 3 times in total. Execution time: **~6s**.
```
Running 3 tests using 1 worker

  ✘  1 test/index.spec.ts:25:5 › failing test 1 (2.3s)
Sending real request to: https://jsonplaceholder.typicode.com/users
  ✘  2 test/index.spec.ts:31:5 › failing test 2 (2.1s)
Sending real request to: https://jsonplaceholder.typicode.com/users
  ✘  3 test/index.spec.ts:37:5 › failing test 3 (2.1s)
Sending real request to: https://jsonplaceholder.typicode.com/users
```
