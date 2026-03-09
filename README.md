<h1 align="center">⚡ global-cache</h1>

<p align="center">
Speed up E2E tests by caching data between workers
</p>

<p align="center">
<a href="https://github.com/vitalets/global-cache/actions/workflows/lint.yaml">
  <img alt="lint" src="https://github.com/vitalets/global-cache/actions/workflows/lint.yaml/badge.svg" />
</a>
<a href="https://github.com/vitalets/global-cache/actions/workflows/test.yaml">
  <img alt="test" src="https://github.com/vitalets/global-cache/actions/workflows/test.yaml/badge.svg" />
</a>
<a href="https://github.com/vitalets/global-cache/blob/main/LICENSE">
<img alt="license" src="https://img.shields.io/github/license/vitalets/global-cache" />
</a>
</p>

## Why use it?

When running E2E tests in parallel, you might need to:

✅ Authenticate user only once\
✅ Seed database only once\
✅ Compute heavy values on demand\
✅ Reuse heavy-computed values across workers\
✅ Persist heavy-computed values between test runs

Global Cache makes all of this possible.

## How it works?

The first worker that requests a value becomes responsible for computing it. Others wait until the result is ready — and all workers get the same value. The value is cached in memory or on the filesystem and reused by subsequent workers and test runs:

<p align="center">
<img  alt="Global cache schema" src="https://raw.githubusercontent.com/vitalets/global-cache/refs/heads/main/scripts/img/schema-1628.png" />
</p>

<details><summary>What happens under the hood?</summary>

Under the hood, Global Cache spins up a tiny HTTP server, with a simple REST API for getting and setting values. This server is a single storage point for all workers. When a worker needs a value, it performs a `GET` request to the server, and either gets a cached value instantly or computes the value and sets it via the `POST` request.

</details>

## Packages

Check out the documentation for your test runner integration:

- [@global‑cache/playwright](https://github.com/vitalets/global-cache/tree/main/packages/playwright)

## Feedback

Feel free to share your feedback and suggestions in the [issues](https://github.com/vitalets/global-cache/issues).

## License

[MIT](https://github.com/vitalets/global-cache/blob/main/LICENSE)
