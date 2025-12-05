/**
 * Release script publishes all packages in the monorepo under the same version.
 * Pros: it's simpler than manage different versions per package.
 * Cons: all packages are published even if only one changed.
 * See: https://github.com/release-it/release-it/blob/main/docs/recipes/monorepo.md
 */
import type { Config } from 'release-it';

const isDryRun = process.argv.includes('--dry-run');

export default {
  npm: {
    // don't publish root package
    publish: false,
  },
  git: {
    requireCleanWorkingDir: !isDryRun,
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
    'before:version:bump': isDryRun
      ? []
      : [
          // publish all packages individually before repo-related steps (git tag, GitHub release)
          // Add `--preid next` for pre-releases (e.g., 1.0.0-next.0)
          [
            'extra=; case "${version}" in *-*) extra="--preid next" ;; esac;',
            'pnpm -r --filter "./packages/*" exec npm version "${version}" $extra',
          ].join(' '),
          'pnpm -r --filter "./packages/*" --no-git-checks publish',
        ],
  },
} satisfies Config;
