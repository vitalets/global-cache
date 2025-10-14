# Changelog

> This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

## [Unreleased]
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


[unreleased]: https://github.com/vitalets/global-cache/compare/0.2.4...HEAD
[0.2.4]: https://github.com/vitalets/global-cache/compare/0.2.3...0.2.4
[0.2.3]: https://github.com/vitalets/global-cache/compare/0.2.2...0.2.3
[0.2.2]: https://github.com/vitalets/global-cache/compare/0.2.1...0.2.2
[0.2.1]: https://github.com/vitalets/global-cache/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/vitalets/global-cache/compare/0.1.2...0.2.0
[0.1.2]: https://github.com/vitalets/global-cache/compare/0.1.1...0.1.2
