<p align="center">
  <img src="https://raw.githubusercontent.com/vitalets/global-cache/main/website/static/img/logo.png" alt="Global Cache logo" width="128">
</p>
<h1 align="center">global-cache</h1>

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

<p align="center">
  <a href="https://vitalets.github.io/global-cache/">Documentation</a> | <a href="./CHANGELOG.md">Changelog</a>
</p>

## Why use it?

When running E2E tests in parallel, you might need to:

✅ Authenticate user only once\
✅ Seed database only once\
✅ Compute heavy values on demand\
✅ Reuse heavy-computed values across workers\
✅ Persist heavy-computed values between test runs

Global Cache makes all of this possible.

## How it works

The first worker to request a key computes its value. Concurrent workers wait for that computation
and then receive the same cached result.

![Test runner workers sharing Global Cache](./website/static/img/how-it-works-core.png)

## Documentation

- [Main documentation website](https://vitalets.github.io/global-cache/)
- [Playwright integration](https://vitalets.github.io/global-cache/playwright/)

## License

[MIT](./LICENSE)
