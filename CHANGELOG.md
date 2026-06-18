# Changelog

> This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

## [Unreleased]

## [0.5.1] - 2026-06-18
* fix remaining race condition when a key is recomputed from persistent storage (stale signature or expired TTL) by concurrent callers.

## [0.5.0] - 2026-06-05
* fix race condition when computing values ([#6](https://github.com/vitalets/global-cache/issues/6)).
* increase request body size limit from 100kb to 10mb to support larger cached values ([#5](https://github.com/vitalets/global-cache/pull/5)).
* add `cleanup` option to `globalCache.wrap()` for reliable post-run cleanup in VSCode and UI mode ([#4](https://github.com/vitalets/global-cache/issues/4)).
* add `globalCache.delete(key)` to remove a cached entry and force re-computation on the next `get()` call ([#3](https://github.com/vitalets/global-cache/issues/3)).

## [0.4.1] - 2026-03-09
* Move documentation to packages readme.
* Setup trusted publishing.

## [0.4.0] - 2025-12-06
* minor: use live config values to better support VSCode extension.
* patch: make `debug` initialize lazily to pick up env vars in runtime.
* patch: add root route to the global cache server.
* patch: improve logging.

## [0.3.2] - 2025-10-15
* fix typing for module resolution `node`.

## [0.3.1] - 2025-10-15
* improve release script.

## [0.3.0] - 2025-10-15
* rename `globalCache.clear()` to `globalCache.clearTestRun()`.

## [0.2.16] - 2025-10-15
* fix: handle Playwright UI mode and VSCode extension runs.

## [0.2.4] - 2025-10-14
* breaking: move to a monorepo and publish packages under the **new scope**:
  - `@global-cache/core`: framework-agnostic core package.
  - `@global-cache/playwright`: Playwright integration package.

## [0.2.2] - 2025-09-03
* feat: better signature checks.

## [0.2.1] - 2025-08-26
* chore: better error message for missing setup

## [0.2.0] - 2025-08-15
* feat: store value metadata on the file system.
* feat: check signature to invalidate cache after code changes

## [0.1.2] - 2025-08-08

* Initial release


[0.3.2]: https://github.com/vitalets/global-cache/compare/0.3.1...0.3.2
[0.3.1]: https://github.com/vitalets/global-cache/compare/0.3.0...0.3.1
[0.3.0]: https://github.com/vitalets/global-cache/compare/0.2.16...0.3.0
[0.2.16]: https://github.com/vitalets/global-cache/compare/0.2.15...0.2.16
[0.2.15]: https://github.com/vitalets/global-cache/compare/0.2.12...0.2.15
[0.2.6]: https://github.com/vitalets/global-cache/compare/0.2.4...0.2.6
[0.2.5]: https://github.com/vitalets/global-cache/compare/0.2.4...0.2.5
[0.2.4]: https://github.com/vitalets/global-cache/compare/0.2.3...0.2.4
[0.2.3]: https://github.com/vitalets/global-cache/compare/0.2.2...0.2.3
[0.2.2]: https://github.com/vitalets/global-cache/compare/0.2.1...0.2.2
[0.2.1]: https://github.com/vitalets/global-cache/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/vitalets/global-cache/compare/0.1.2...0.2.0
[0.1.2]: https://github.com/vitalets/global-cache/compare/0.1.1...0.1.2

[Unreleased]: https://github.com/vitalets/global-cache/compare/0.5.1...HEAD
[0.4.0]: https://github.com/vitalets/global-cache/compare/0.4.0-4...0.4.0

[0.4.1]: https://github.com/vitalets/global-cache/releases/tag/0.4.1

[0.5.0]: https://github.com/vitalets/global-cache/releases/tag/0.5.0

[0.5.1]: https://github.com/vitalets/global-cache/releases/tag/0.5.1
