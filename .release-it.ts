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
      // publish all packages individually before repo-related steps (git tag, GitHub release)
      'pnpm -r --filter "./packages/*" exec npm version ${version}',
      'pnpm -r --filter "./packages/*" --no-git-checks publish',
    ],
  },
} satisfies Config;
