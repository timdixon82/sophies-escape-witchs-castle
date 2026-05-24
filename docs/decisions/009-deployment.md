# ADR 009: Deployment to GitHub Pages with a Vite build

## Status

Accepted on 2026-05-23 by Jacob.

## Context

The brief commits to a static, no-server deployment (`docs/design-brief.md` section 3, section 13). The team's standing default for static hosting is GitHub Pages (global wiki Decision 002 and the static front-end stack page). The branch protections on `main` are already in place from Decision 012 of the project's setup work.

Sophie's Escape has enough JavaScript and asset weight to justify a real build step:

- Three.js is imported as ECMAScript modules. Tree-shaking is needed to keep the bundle under the size budget.
- Per-room geometry is lazy-loaded. The build tool has to split chunks per route or per room.
- Static assets (audio, models, textures) need content-hashing so the service worker (ADR 008) can detect changes and invalidate the cache cleanly.
- The Content Security Policy `<meta>` tag (ADR 007) is injected into the HTML during the build.

This puts Sophie's Escape on the "offline build step" branch of the static stack's build-or-no-build choice (per the static stack page). Vite is the team default for that branch.

## Decision

### Use Vite as the build tool

`package.json` declares Vite as a development dependency, pinned to an exact version. The `scripts` section provides:

- `npm run dev`: `vite` (the development server, with hot-module reload for fast iteration).
- `npm run build`: `vite build` (produces the deployable `dist/` folder).
- `npm run preview`: `vite preview` (serves `dist/` locally for a final check before publish).

The Vite configuration at `vite.config.js`:

- `base: '/sophies-escape-witchs-castle/'`. The repository name is the GitHub Pages sub-path under `timdixon82.github.io`. If Tim later attaches a custom domain (for example `sophies-escape.timdixon.net`), this changes to `'/'` and the build is re-run; nothing else in the code knows the base path.
- `build.target: 'es2022'`. The target the browser support set in NFR-BROWSER-01 supports natively.
- `build.assetsInlineLimit: 0`. Nothing is inlined as a data URL. Every asset is emitted as a real file so the service worker can cache it.
- `build.rollupOptions.input`: a single HTML entry point at `index.html`. The credits page is a route inside the same single-page application, not a second HTML file.
- `build.rollupOptions.output.manualChunks`: a chunking strategy that puts each room's geometry-and-texture loader into its own chunk so per-room lazy loading works without manual `import()` calls everywhere.
- `worker.format: 'es'`: any Web Worker the project introduces (none in the first build) is emitted as ECMAScript modules.
- `optimizeDeps.exclude`: empty unless a future loader needs it. ICCC needed this for `onnxruntime-web`; Sophie's Escape does not have an equivalent.

### What gets deployed

The deployable artefact is the `dist/` folder produced by `vite build`. Its shape:

```
dist/
  index.html
  assets/
    index-<hash>.js
    index-<hash>.css
    room-01-<hash>.js
    room-02-<hash>.js
    ...
  models/
    room-01-dungeon-cell-<hash>.glb
    ...
  textures/
    atlas-dungeon-cell-<hash>.webp
    ...
  audio/
    mp3/
      ambient-dungeon-cell-<hash>.mp3
      ...
    ogg/
      ambient-dungeon-cell-<hash>.ogg
      ...
  fonts/
    roboto-<hash>.woff2
  scripts/
    goatcounter-count.js   (self-hosted, not hashed)
  sw.js   (the service worker, not hashed because the registration URL is fixed)
  build-info.js   (carries the VERSION string; read by the service worker)
```

Every asset is content-hashed by Vite. The service worker's cache key is therefore the URL itself, and a changed file gets a different URL, which the cache treats as a new entry.

### The GitHub Actions workflow

The repository carries `.github/workflows/deploy.yml`:

- Triggers: `push` to `main`, and `workflow_dispatch`.
- Permissions: `contents: read`, `pages: write`, `id-token: write` (the standard GitHub Pages deploy set).
- Runs on `ubuntu-latest`.
- Steps:
  1. Check out the repository.
  2. Set up Node.js 20 with npm caching keyed on `package-lock.json`.
  3. Run `npm ci` (never `npm install` in continuous integration; the lockfile is the source of truth).
  4. Run `npm run lint` (HTMLHint, Stylelint, ESLint, all pinned in `devDependencies` per the static stack standard).
  5. Run `npm run test` (Vitest unit tests for `src/core/`; mocked render and audio layers).
  6. Run `npm run build` (Vite build).
  7. Configure Pages (`actions/configure-pages@v4`).
  8. Upload the `dist/` folder as a Pages artefact (`actions/upload-pages-artifact@v3`).
  9. Deploy the artefact to the `github-pages` environment (`actions/deploy-pages@v4`).

A separate `.github/workflows/codeql.yml` runs CodeQL static analysis on JavaScript, on the team's standard cadence.

A `.github/workflows/release-please.yml` runs release-please, which reads Conventional Commits, opens release pull requests that bump `VERSION` and the changelog, and tags the release once the pull request merges.

### Branch and pull-request flow

The `main` branch is protected (recorded in Decision 012 of the project setup): no direct pushes, pull-request-only, status checks (lint, test, build) must pass.

Every feature lands on a feature branch, opens a pull request against `main`, runs the deploy workflow's status checks in a build job (without the deploy step), and waits for Sonja's review and Tim's express merge approval (per the team's two non-negotiable rules).

A merge to `main` triggers the deploy workflow, which runs lint, test, build, and then publishes to GitHub Pages.

### Pre-deploy quality gates

The deploy workflow does not deploy unless:

- Lint passes (HTMLHint, Stylelint, ESLint).
- Unit tests pass (Vitest against `src/core/`).
- The build succeeds.

The accessibility test suite (axe-core through Playwright, plus Pa11y) runs on every pull request build but is not in the deploy workflow's critical path because the served deploy is the same artefact the pull-request build verified.

### Versioning

`VERSION` at the repository root holds the semantic-version string. release-please reads Conventional Commits and opens a release pull request that updates `VERSION` and the changelog. Merging the release pull request tags the release and triggers the deploy.

The service worker reads `VERSION` (through the generated `build-info.js`) to pick its cache version suffix (ADR 008).

### Manual publish guardrail

Per the team's two non-negotiable rules, Sonja is the only agent who can publish, and only with Tim's express approval at the time. The deploy workflow's `workflow_dispatch` trigger is the manual publish path; Sonja runs it only after Tim says yes.

A push to `main` also triggers the deploy. This means Tim's express approval to merge a pull request into `main` is also his express approval to deploy. This is consistent with the team's release process.

## Alternatives considered

### No build step (the SWOT-Builder approach)

Rejected. Three.js as ECMAScript modules in the browser without a bundler works in development but blows the bundle size budget in production (no tree-shaking, no code splitting). For Sophie's Escape's asset weight, a real build step pays for itself in the first sprint.

### Webpack or Rollup directly

Rejected. Vite is the team default and the developer experience is better. Both have the same output capability; Vite is the easier choice.

### Deploy to Cloudflare Pages or Netlify (which can send full security headers)

Considered. Sophie's Escape's Content Security Policy is delivered through a `<meta>` tag (per ADR 007) because GitHub Pages cannot send headers, and the team's standing exception covers that. Moving to a host that can send headers would let the policy be sent as a header (slightly stronger, because the policy applies before the page begins parsing). Rejected for the first build because GitHub Pages is the standing default and moving hosts is a separate decision; the standing exception is in place and the practical difference is small.

### Deploy from a `gh-pages` branch instead of GitHub Actions

Rejected. The GitHub Actions deploy is the team's current default and is cleaner: the `dist/` folder is an artefact of the build, not a committed branch.

## Consequences

### Positive

- The repository stays small (the deployed `dist/` folder is the build output, not a committed branch).
- Tree-shaking and code-splitting bring the bundle inside the size budget.
- Content-hashed assets play cleanly with the service worker's cache (ADR 008).
- Lint, test, and build all run on every pull request and gate the deploy.
- release-please handles versioning automatically.

### Negative or to manage

- A build step adds a development manifest (`package.json`, `package-lock.json`, `node_modules/`). This is the standing team trade.
- A failed build leaves the production site as it was; this is good. A failed test leaves the build unrun; this is also good.
- If Tim attaches a custom domain in future, the `base` path in `vite.config.js` changes from `'/sophies-escape-witchs-castle/'` to `'/'`. This is a one-line change.

## Cross-references

- `docs/decisions/003-asset-bundling-and-loading.md`: the asset layout Vite produces.
- `docs/decisions/007-content-security-policy.md`: the Content Security Policy `<meta>` tag injected into the HTML.
- `docs/decisions/008-service-worker.md`: the service worker that consumes the content-hashed assets.
- The team's static front-end stack page in the global wiki.
- ICCC ADR 0005 (Vite, with the same shape).
