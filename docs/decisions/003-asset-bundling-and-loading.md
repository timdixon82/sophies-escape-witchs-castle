# ADR 003: Asset bundling and loading

## Status

Accepted on 2026-05-23 by Jacob.

## Context

The design brief commits to "fast and responsive on both mobile and desktop hardware" (`docs/design-brief.md` section 3), and the requirements set concrete targets: load in under five seconds on a typical 4G mobile connection, 30 frames per second on a three-year-old mid-range phone, 60 frames per second on a mid-range desktop browser, and no network requests after the initial page load except the model and audio files the build itself fetches (`docs/requirements.md` NFR-PERF-01, NFR-PERF-02).

The brief also states that the game ships as a static site with no server. Every asset the game uses (3D model files, textures, audio files, the JavaScript) is part of the deployed `dist/` folder and is served by GitHub Pages from the same origin.

The asset budget for Sophie's Escape is medium for a browser game and large for a static site:

- Ten rooms of low-polygon 3D geometry plus their textures.
- One witch character model used in cutscenes.
- A library of audio files: ten ambient-room loops, nine event sounds, the witch cackles, and the triumphant fanfare (`docs/requirements.md` section 18). Each sound is bundled as a matched pair of MP3 and OGG files for browser compatibility (FR-AUDIO-03).
- The Three.js engine and the Howler.js library.
- The user-interface fonts (self-hosted, per the standing static-stack standard).

A rough first estimate: 8 to 15 megabytes of total assets, depending on the audio compression rate.

The decision is how to structure those assets so:

1. The first paint and the main menu appear quickly (under five seconds on 4G).
2. The game runs at the target frame rate once gameplay starts.
3. Subsequent visits are fast even on a phone that aggressively evicts the HyperText Transfer Protocol cache.
4. Nothing in the bundle is loaded that the player has not yet reached, so the initial bundle stays small.

## Decision

### Three-tier loading

Assets load in three tiers. Each tier is named so the loader can report progress to a screen reader (`docs/accessibility.md`, screen-reader narration section).

**Tier 1: critical bundle.** Loads at first page load, before the main menu is interactive. Contains:

- The compiled JavaScript bundle (the application code plus the engine, tree-shaken).
- The Cascading Style Sheets file.
- The HTML entry point.
- The user-interface fonts (self-hosted).
- The main-menu background sound (a single short ambient loop).
- The audio-manifest JSON, the rooms-index JSON, and the items JSON.

Target size: under 1 megabyte gzipped. Target time to interactive on 4G: under 3 seconds.

**Tier 2: the first room and its immediate audio.** Loads while the player is on the main menu, in the background. The fetch is started as soon as the main menu has painted, so by the time the player selects New Game or Continue, the first room is likely already cached.

Contains:

- The Room 1 (Dungeon Cell) geometry and textures.
- The Room 1 ambient audio (MP3 and OGG).
- The shared user-interface event sounds (item picked up, puzzle solved, inventory open and close).

Target size: under 2 megabytes.

**Tier 3: the other nine rooms.** Each room is lazy-loaded on demand. When the player approaches a doorway to a room that is not yet loaded, the loader starts fetching that room while the player is still in the current room. The transition does not begin until the next room is ready. If the player is on a slow connection, a "loading next room" indicator (text plus an ARIA live region announcement) appears.

Each room is roughly 500 kilobytes to 1.5 megabytes. With ten rooms the worst case is around 15 megabytes total, but the player rarely loads every room back to back. Lazy loading keeps the user-experienced load short.

### Cache strategy: service worker with Cache Storage

Once a file has been fetched, it is cached so the next visit is fast. The standard HyperText Transfer Protocol cache is unreliable on iOS Safari, which aggressively evicts large files. The team has the same problem on ICCC and solved it the same way: a service worker with Cache Storage.

Sophie's Escape ships a small service worker that caches:

- The Tier 1 critical bundle: cache-first, with a stale-while-revalidate update on every visit.
- The room geometry, textures, and audio: cache-first, never revalidated until the cache version bumps.
- The fonts: cache-first.

The cache is namespaced with a version suffix (for example `sophies-escape-cache-v1`). When the project's `VERSION` bumps, the suffix bumps with it; the old cache is retired on the next service worker activation. This is the same pattern ICCC uses in its ADR 0008.

The service worker is recorded in ADR 008. This ADR records what the service worker caches; ADR 008 records the worker's lifecycle.

### Precache critical audio

Three short event sounds are kept in the Tier 1 bundle even though they are technically per-event rather than per-room: item picked up, puzzle solved, inventory open and close. They are precached because they fire on the very first puzzle in Room 1 and a delayed first-puzzle sound would feel broken.

The witch encounter sting and the witch cackle are tier-2-loaded (with Room 1) because the witch encounter can fire as early as a few minutes into Room 1, but they are not needed at first paint.

### Bundling: Vite builds `dist/`

The project uses Vite as the build tool (ADR 009). Vite is responsible for:

- Tree-shaking the Three.js modules so only the parts the game uses ship.
- Code-splitting per route (the main menu, the gameplay shell, the credits page) so each gets its own JavaScript chunk.
- Hashing every asset file name so the service worker's cache key changes whenever the asset changes.
- Producing one HTML entry file, one or two JavaScript chunks for Tier 1, and per-room chunks for Tier 3.

Vite does not need to know about audio files; those are stored under `public/audio/` and referenced by the manifest. Vite copies the `public/` folder into `dist/` verbatim.

### File layout under `public/` and the manifest

```
public/
  audio/
    mp3/
      ambient-dungeon-cell.mp3
      ambient-corridor.mp3
      ...
      witch-cackle-01.mp3
      ...
    ogg/
      ambient-dungeon-cell.ogg
      ...
  models/
    room-01-dungeon-cell.glb
    room-02-corridor.glb
    ...
    witch.glb
  textures/
    atlas-dungeon-cell.webp
    atlas-corridor.webp
    ...
```

The `src/assets/audio-manifest.json` file lists each logical sound name, both file paths (MP3 and OGG), the source library (BBC Sound Effects Library plus the original record identifier), the licence terms recorded against that record, and the volume default. This is the audio equivalent of the team's `models.json` manifest that ICCC retrofitted (ICCC's ADR 0006). It makes the audio licence audit one file to read rather than a tour of the source.

The rooms manifest at `src/assets/rooms.json` lists each room's geometry file, its texture file, its ambient audio name, its accessible description text (for the screen-reader announcement on room entry, see `docs/accessibility.md`), and its puzzle identifiers.

### Model format

3D geometry is delivered as glTF (`.glb`, the binary form). Three.js loads glTF natively through `GLTFLoader`. The team uses glTF because it is the standard interchange format for browser 3D, it carries materials and lights in one file, and Three.js's loader is well-tested.

Texture format: WebP, with a PNG fallback only if a browser in the supported set (NFR-BROWSER-01) cannot render the texture. WebP is supported by every browser in scope.

Each room's `.glb` is built so that all static room geometry is merged into one or two meshes, keeping the per-room draw call count low (the budget is recorded in ADR 001).

## Alternatives considered

### Eager-load all ten rooms at startup

Rejected. The total budget (8 to 15 megabytes) is too large for a 4G mobile load under five seconds. Eager loading would force the player to wait through a multi-megabyte download before the main menu paints, which fails NFR-PERF-01.

### Pure lazy-load, no Tier 2 preload of Room 1

Rejected because the brief reads as "the player starts a game and is immediately in the castle". A short loading screen between New Game and Room 1 is acceptable, but it should be barely noticeable. Tier 2 background-fetching while the main menu is shown removes the noticeable wait.

### No service worker; rely on the standard HyperText Transfer Protocol cache

Rejected for the iOS Safari eviction reason recorded in ICCC's ADR 0008. The team has the same pattern available; reusing it is straightforward.

### Bundle audio as base-64 inside the JavaScript

Rejected. Base-64 audio loses the ability to stream the file, defeats Howler.js's progressive loading, and bloats the JavaScript bundle (the Tier 1 budget would be blown). Audio stays as separate files referenced by the manifest.

## Consequences

### Positive

- First load on 4G is under three seconds for the main menu, which is well under the five-second budget.
- Each subsequent room load is a small fetch with the next room frequently already cached during the previous room's gameplay.
- Repeat visits are near-instant because the service worker serves the cached files.
- The audio licence audit (Decision 5 in Tad's decision log) is concentrated in one manifest file.

### Negative or to manage

- The service worker adds a small amount of code that the team must maintain. The pattern is taken from ICCC, so it is not new ground.
- A player who jumps between rooms quickly on a slow connection will sometimes see a "loading next room" indicator. This is acceptable. Carol's test pass includes a slow-connection test (throttled to 3 megabits per second) so the indicator is exercised.
- Room geometry must be authored carefully to stay within the per-room draw call and triangle budgets recorded in ADR 001. The asset-production pipeline must include a build-time check; Sean adds a small Node.js script that reads each `.glb` and fails the build if the triangle count is over the budget.

## Cross-references

- `docs/decisions/001-3d-engine-choice.md`: the per-room geometry budget that the assets must respect.
- `docs/decisions/008-service-worker.md`: the service worker's lifecycle and cache versioning.
- `docs/decisions/009-deployment.md`: the Vite build that produces `dist/`.
- `docs/requirements.md` FR-AUDIO-03: the audio manager.
- `docs/requirements.md` section 18: the BBC Sound Effects Library audio sourcing.
- `tad-decisions-for-tim.md` Decision 5: the BBC licence path that this ADR's manifest depends on.
