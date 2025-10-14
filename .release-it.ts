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
    tagArgs: ['--no-verify'],
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
    'before:version:bump': [
      // 'npm ci',
      'npm run lint',
      'npm run prettier',
      'npm run tsc',
      'npm run build',
      'npm test',
      // publish all packages, then run repo-related steps (git tag, GitHub release)
      'npx turbo run release -- -i ${version} --ci',
    ],
  },
} satisfies Config;
