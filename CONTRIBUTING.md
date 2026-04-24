# Contributing Guide

This document describes how to contribute to ts-valify.

## Development Environment

- Node.js 22+
- Bun 1.x

Install dependencies:

```sh
bun install
```

## Development Flow

1. Create a branch and implement your changes.
2. Add or update tests that match the behavior you changed.
3. Verify locally.

```sh
bun run type-check
bun run test
bun run build
```

4. Open a Pull Request.

## Commit Message Convention

This repository uses release-please, so commit messages must follow Conventional Commits.

- `fix:` triggers a patch release
- `feat:` triggers a minor release
- `feat!:` or `BREAKING CHANGE:` triggers a major release

Examples:

- `fix: handle invalid date input`
- `feat: add custom validator option`
- `feat!: change validateSchema return type`

## Pull Request Guidelines

- Clearly describe the purpose and scope of your change.
- If behavior or usage changes, update README and related docs.
- Avoid mixing unrelated refactoring and feature changes in the same PR.

## Release Process

For release operations, see [RELEASING.md](RELEASING.md).
