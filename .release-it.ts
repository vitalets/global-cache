import type { Config } from 'release-it';

// See: https://github.com/release-it/release-it/blob/main/docs/recipes/monorepo.md

export default {
  npm: {
    // don't publish root package
    publish: false,
  },
  git: {
    // allow dirty dir, because packages will have version bumped
    requireCleanWorkingDir: false,
    commitArgs: ['--no-verify'],
    pushArgs: ['--no-verify'],
  },
  github: {
    release: true,
    web: true,
  },
  plugins: {
    '@release-it/keep-a-changelog': {
      filename: 'CHANGELOG.md',
      addUnreleased: true,
      addVersionUrl: true,
    },
  },
  hooks: {
    'before:init': [
      'pnpm i',
      'pnpm run lint', // prettier-ignore
      'pnpm run prettier',
      'pnpm run tsc',
      'pnpm run build',
      'pnpm test',
    ],
    'before:version:bump': [
      // publish all packages, then run repo-related steps (git tag, GitHub release)
      'turbo run bump --filter "./packages/*" -- ${version}',
      'turbo run publish-to-npm --filter "./packages/*"',
    ],
  },
} satisfies Config;
