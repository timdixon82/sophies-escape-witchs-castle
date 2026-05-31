# Release process: Sophie's Escape: The Witch's Castle

This document records the release process for Sophie's Escape: The Witch's Castle. It is produced during the project setup pass and updated whenever the process changes.

## Branching model

`main` is the production branch. Feature work happens on short-lived branches named for the change (for example, `feat/v0.2`, `fix/loading-bar-progress`). There are no long-lived development branches. Each branch opens a pull request against `main` and is deleted after merge.

## Pull-request flow

A change goes through these steps before it reaches `main`:

1. Open a pull request from a feature branch to `main`.
2. Continuous integration checks pass: CI (lint, test, build), accessibility (Pa11y and axe at WCAG 2.2 AAA), security (Semgrep token-free, Trivy, dependency review), and CodeQL.
3. Carol signs off functional, accessibility, and visual testing.
4. Sonja reviews for architecture and security conformance.
5. Tim gives express approval to merge.
6. Sonja merges.

## Merge gate

The following conditions must all hold before Sonja merges:

- All required CI checks pass.
- Carol has signed off.
- The architecture-and-security conformance check has passed.
- Tim has given express approval at the time of the merge.

## Release steps

Releases are managed by release-please. The release-please workflow in `.github/workflows/release.yml` watches `main`, opens a release pull request when conventional-commit messages on `main` warrant a version bump, and on merge of that release pull request tags the release and updates `CHANGELOG.md` and the `VERSION` file. The configuration lives in `release-please-config.json` and the version manifest in `.release-please-manifest.json`.

The live build is owned by the deploy workflow in `.github/workflows/deploy.yml`. On every push to `main`, the deploy workflow builds the Vite project and publishes the `dist/` folder to GitHub Pages. No manual deploy step is required. The one-time activation (Settings, Pages, Build and deployment, Source = GitHub Actions) has been done.
