import type { Config } from 'release-it';

export default {
  git: {
    requireCleanWorkingDir: false,
  },
  hooks: {
    'before:init': [
      'npm run lint',
      'npm run prettier',
      'npx publint',
      'npm ci',
      'npm test',
      // don't run example, b/c it's expected to fail
      // 'npm run example',
      'npm run build',
    ],
  },
  plugins: {
    '@release-it/keep-a-changelog': {
      filename: 'CHANGELOG.md',
      addUnreleased: true,
      addVersionUrl: true,
    },
  },
} satisfies Config;
