import type { Config } from 'release-it';

// See: https://github.com/release-it/release-it/blob/main/docs/recipes/monorepo.md

export default {
  npm: {
    publish: false,
  },
  git: {
    requireCleanWorkingDir: false,
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
      'npm ci',
      'npm run lint',
      'npm run prettier',
      'npm run tsc',
      // 'npx publint',
      'npm run build',
      'npm test',
      'npx turbo run release',
    ],
  },
} satisfies Config;
