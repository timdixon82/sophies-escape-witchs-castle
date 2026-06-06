# Work folder 036: SEWC service worker auto-versioning

**Status:** active
**Triage type:** Bug fix (type 6)
**Opened:** 2026-06-06

## Summary

The service worker VERSION is hardcoded as '0.2.0' in public/sw.js and never changes between builds. This causes browsers to serve stale cached JS, CSS, and HTML after deployments. The fix is to inject the current build version (package.json version + short git hash) into sw.js at build time via a Vite plugin.

## Fix

In vite.config.js, add a small custom plugin using Vite's `generateBundle` hook to:
1. Read the built `dist/sw.js` (or transform `public/sw.js` using the `transform` hook)
2. Replace `const VERSION = '...'` with `const VERSION = '<pkg-version>-<git-short-hash>'`
3. Write the result back to `dist/sw.js`

Use Node's `execSync('git rev-parse --short HEAD')` for the git hash and `import { version } from './package.json'` for the version.

Also ensure the dev server gets a fresh SW on each restart by injecting a timestamp in development mode.

## Out of scope

- Changing the SW caching strategy
- Adding new cached routes

## Risk and rollback

Low. Build-only change. Rollback: revert the branch.

## Definition of done

- `npm run build` produces a `dist/sw.js` where VERSION includes the current package.json version and git short hash
- Each new build produces a different VERSION, busting the old cache
- All existing tests pass
- Lint: 0 errors
- PR open on branch `fix/sewc-sw-versioning`

## Pre-approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than main
- [x] Open a pull request
- [x] Comment on a pull request or issue
- [x] Create an issue
