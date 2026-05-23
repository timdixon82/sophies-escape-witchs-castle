# ADR 008: Service worker for caching, not for cross-origin isolation

## Status

Accepted on 2026-05-23 by Jacob.

## Context

Sophie's Escape ships a multi-megabyte asset payload (geometry, textures, audio, and the engine code) and runs on browsers including iOS Safari, which aggressively evicts large files from the standard HyperText Transfer Protocol cache. Without a service worker, a player who returns to the game after a few days would re-download every asset. With a service worker that caches into Cache Storage, the return visit is near-instant.

ICCC ships a service worker that does two jobs in one file: persistent caching for model and runtime files, and cross-origin isolation (the `coi-serviceworker` technique). Cross-origin isolation is needed only when the page uses `SharedArrayBuffer`, which is needed only for multi-threaded WebAssembly.

Sophie's Escape does not need cross-origin isolation. The reasoning:

- Three.js does not use `SharedArrayBuffer` itself.
- The optional Three.js loaders (Draco, KTX2) can use Web Workers but do not require shared memory; they are configurable to run without it.
- Howler.js does not need `SharedArrayBuffer`.
- The team has chosen not to bundle a physics engine for Sophie's Escape (ADR 002 records that collision is a small custom raycast); the popular physics libraries (Rapier, Ammo) that need shared memory are absent.

Removing the cross-origin isolation half of the service worker simplifies the architecture significantly: the worker becomes a small, well-understood caching worker rather than a vendored upstream pattern carrying a manual upgrade obligation.

## Decision

### Ship a single service worker at `public/sw.js`

The worker does one job: cache static assets and serve them cache-first from Cache Storage. The cache is namespaced by version so a release bump retires the old cache cleanly.

### Cache scopes

The worker recognises three cache scopes by URL path:

- `core-cache-v<n>`: the JavaScript bundle, the Cascading Style Sheets, the HTML, the fonts. Cache-first with stale-while-revalidate: serve from cache, then fetch and update in the background so the next visit gets the latest. This works because the assets are content-hashed by Vite, so a changed file has a different URL.
- `room-cache-v<n>`: every URL under `/models/`, `/textures/`, and `/audio/`. Cache-first, no revalidation (these are content-hashed too). When the version suffix bumps, the old cache is wiped at the worker's `activate` event.
- `runtime-cache-v<n>`: any other application-origin URL fetched at runtime. Cache-first.

The cache version suffix matches the `VERSION` file at the repository root. A behavioural change bumps the version, the new service worker activates on the next page load, and the previous cache is deleted in the `activate` handler.

### What the worker does not do

- It does not add `Cross-Origin-Opener-Policy` or `Cross-Origin-Embedder-Policy` headers. The page does not need cross-origin isolation, because nothing in Sophie's Escape uses `SharedArrayBuffer`. If a future feature needs shared memory (for example a heavier physics engine), the worker can grow that capability — at which point the ICCC pattern is the reference, and the upstream-watch obligation comes with it.
- It does not cache third-party requests. The GoatCounter analytics ping is allowed to pass through without caching; analytics replayed from a cache would corrupt the count.
- It does not pre-cache assets it has not seen. The worker does not run a "install everything" pass at registration time; it caches assets as they are requested. This keeps the install fast and avoids redundant downloads for players who never reach every room.

### Lifecycle

The worker is registered from the main HTML entry point, after the page has finished its first paint, so the registration does not delay the visible main menu. The registration uses a feature check (`'serviceWorker' in navigator`) and fails silently if the browser does not support service workers. The game still works without the worker; it is purely a caching optimisation.

The `install` handler is a no-op (no precaching).

The `activate` handler claims clients and deletes any cache whose name does not match the current version suffix.

The `fetch` handler:

1. If the request is for a same-origin URL, look in the appropriate cache scope. If found, serve. If not found, fetch, store, and serve.
2. If the request is for `https://timdixon82.goatcounter.com`, pass through without caching.
3. Anything else, pass through.

### Cache version: the same string as the `VERSION` file

`VERSION` at the repository root holds the semantic-version string. The build step writes this string into a generated file `src/build-info.js`. The service worker reads it through `importScripts('build-info.js')`. When a release-please pull request bumps `VERSION`, the service worker version follows, the cache scopes change name, and the old caches are evicted at the next activation.

### Storage budget

iOS Safari budgets Cache Storage at roughly 7 percent of free disk. The largest worst-case Sophie's Escape payload (all ten rooms cached) is around 15 megabytes. This is well under any plausible budget. The worker does not include an eviction step of its own; if the browser evicts the cache under storage pressure, the worker simply refetches.

### The `coi-serviceworker` pattern is not used

Sophie's Escape explicitly does not use the cross-origin isolation pattern that ICCC needed. The pattern is excellent and reusable, but it carries a real cost: it intercepts every fetch on the page, re-emits the response with the cross-origin isolation headers, and ties the project to an upstream pattern that has had its own quirks (see ICCC's ADR 0008 and the open Q-numbers in ICCC's review). Avoiding it where it is not needed is the right call.

If a future Sophie's Escape feature needs multi-threaded WebAssembly (for example a physics engine), the team would add the cross-origin isolation half to this worker and adopt the ICCC pattern explicitly, in a new ADR. The architecture is forward-compatible.

## Alternatives considered

### No service worker

Rejected. The iOS Safari eviction problem is real and would hit returning players hard. The team has a tested pattern and should use it.

### Replicate ICCC's service worker wholesale

Rejected. The cross-origin isolation half is dead code in Sophie's Escape and would add complexity and an upstream-watch obligation for no benefit.

### Use Workbox (Google's service-worker library)

Considered. Workbox is well-tested and saves writing the cache logic by hand. Rejected because Sophie's Escape's caching needs are simple (three scopes, cache-first, version-bumped invalidation), well within the writing-by-hand range, and the team's no-extra-dependency preference (ADR 002 and the static stack standards) favours plain code over a library here. Workbox would be the right answer if the caching strategy were complex (different strategies per route, background sync, push notifications) — Sophie's Escape needs none of that.

### Cache everything at install time (precache)

Rejected. Precaching every asset would force a multi-megabyte download before the player ever reaches the second room, defeating the lazy-load strategy in ADR 003.

## Consequences

### Positive

- Return visits are near-instant.
- The worker is small (about 80 lines), readable, and entirely within the team's standards.
- No upstream pattern to track for security advisories (no `coi-serviceworker` to upgrade).
- The architecture remains forward-compatible if a future feature needs cross-origin isolation.

### Negative or to manage

- The service worker adds a small surface to test. Carol's release pass includes a "version bump invalidates the cache" check: bump `VERSION`, reload, confirm the old cached files are replaced.
- A development build sometimes confuses people who do not know a worker is registered (changes do not appear because the worker is serving old files). Sean's developer documentation includes the "unregister the worker" step for local development.
- Browsers that do not support service workers (very few in scope per NFR-BROWSER-01) fall back to standard HyperText Transfer Protocol caching, which is acceptable.

## Cross-references

- `docs/decisions/003-asset-bundling-and-loading.md`: the three-tier loading strategy the worker accelerates.
- `docs/decisions/007-content-security-policy.md`: the `worker-src 'self'` directive that allows the worker to load.
- `docs/decisions/009-deployment.md`: the build step that copies the worker into `dist/` and writes the `build-info.js` file the worker reads.
- ICCC ADR 0008 (the cross-origin isolation pattern this project does not need today).
