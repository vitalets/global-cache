/**
 * Release script publishes all packages in the monorepo under the same version.
 * Pros: it's simpler than manage different versions per package.
 * Cons: all packages are published even if only one changed.
 * See: https://github.com/release-it/release-it/blob/main/docs/recipes/monorepo.md
 */
import type { Config } from 'release-it';

const isDryRun = process.argv.includes('--dry-run');
const isSkipNpmPublish = process.argv.includes('--no-npm');

export default {
  npm: {
    publish: false, // don't publish root package
  },
  github: {
    release: true,
  },
  git: {
    commitArgs: ['--no-verify'],
    pushArgs: ['--no-verify'],
  },
  plugins: {
    '@release-it/keep-a-changelog': {
      filename: 'CHANGELOG.md',
      addUnreleased: true,
      addVersionUrl: true,
    },
  },
  hooks: {
    'before:version:bump': isDryRun
      ? []
      : [
          // Bump all packages with the same version
          'pnpm -r --filter "./packages/*" exec npm version "${version}"',
          // Publish all packages individually before repo-related steps (git tag, GitHub release)
          // Adjust `--tag` for pre-releases (e.g., 1.0.0-0)
          isSkipNpmPublish
            ? 'echo "Skip NPM publishing."'
            : [
                'tag=latest; case "${version}" in *-*) tag=next ;; esac;',
                'pnpm -r --filter "./packages/*" publish --no-git-checks --tag "$tag"',
              ].join(' '),
        ],
  },
} satisfies Config;
