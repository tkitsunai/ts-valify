# Releasing Guide

This document defines the release operations for ts-valify.

## Prerequisites

- The GitHub Actions `Release` workflow is enabled.
- `NPM_TOKEN` is configured in repository secrets.
- Your npm account has publish permission for `@tkitsunai/ts-valify`.

## How Releases Work

This repository uses release-please to automate releases.

- A push to `main` automatically creates or updates a Release PR.
- Merging the Release PR creates a GitHub Release.
- npm publish runs only when a new GitHub Release is created.

See [release workflow](.github/workflows/release.yml) for the implementation details.

## Standard Release Procedure

1. Merge PRs using Conventional Commits.
2. Review the auto-generated Release PR.
3. Merge the Release PR.
4. Verify GitHub Releases and npm publish results.

## Versioning Rules

- `fix:` patch release
- `feat:` minor release
- `feat!:` or `BREAKING CHANGE:` major release

To force a specific version, include `Release-As: x.y.z` in the commit body.

## Post-release Checklist

- A new tag and release notes are visible in GitHub Releases.
- The target version is published on npm.
- Installation from README works as expected.

## Troubleshooting

### Release PR Is Not Created

- Confirm that releasable commits (`feat` / `fix`) exist on `main`.
- Check whether an old release PR is still labeled `autorelease: pending`.
- Re-run the workflow from the Actions run history.

### npm Publish Fails

- Validate `NPM_TOKEN`.
- Confirm npm package publish permissions.
- Check whether any `npm publish --access public` constraints apply.
