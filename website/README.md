# Documentation website

The Global Cache documentation is a Docusaurus site deployed to
`https://vitalets.github.io/global-cache/`.

## Local development

From the repository root:

```sh
pnpm docs
```

Build the production site and validate internal links:

```sh
pnpm docs:build
```

The generated site is written to `website/dist/` and is included in the root Turbo build.

## Publishing model

- `main` contains documentation for upcoming changes. Pushes validate the site but never deploy it.
- `docs` contains the source for the live site. Every push to `docs` runs
  `.github/workflows/docs.yaml` and deploys the generated artifact to GitHub Pages.
- Release documentation by merging `main` into `docs`.
- Apply urgent live fixes to `docs`, then merge `docs` back into `main` so a later release does not
  undo them.

The deployment workflow can also be started manually, but its branch guard rejects every branch
except `docs`.

## Initial GitHub Pages activation

After reviewing the site locally:

1. Create the `docs` branch from the reviewed repository state and push it.
2. Open **Settings → Pages** in the GitHub repository.
3. Under **Build and deployment**, select **GitHub Actions** as the source.
4. Push to `docs` again or manually run the `docs` workflow with the `docs` branch selected.

Generated output is uploaded as a GitHub Pages artifact; no `gh-pages` branch is used.
