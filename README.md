<p align="center">
  <img src="./website/static/img/logo.png" alt="Global Cache logo" width="128">
</p>

# Global Cache

Speed up parallel end-to-end tests by computing expensive shared data once and reusing it across
workers and test runs.

## How it works

The first worker to request a key computes its value. Concurrent workers wait for that computation
and then receive the same cached result.

![Test runner workers sharing Global Cache](./website/static/img/how-it-works-core.png)

## Documentation

- [Core](https://vitalets.github.io/global-cache/)
- [Playwright](https://vitalets.github.io/global-cache/playwright/)

## License

[MIT](./LICENSE)
