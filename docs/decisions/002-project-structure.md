# ADR 002: Layered project structure with strict dependency direction

## Status

Accepted on 2026-05-23 by Jacob.

## Context

Sophie's Escape mixes five concerns that often collapse into one tangle in browser game projects:

- Pure game logic: inventory rules, puzzle state machines, hint cascades, the witch trigger timer, item dependencies, the win condition. None of this needs a browser, a screen, or a sound card to be correct.
- 3D rendering: meshes, cameras, lights, the first-person controller, collision against walls.
- HyperText Markup Language overlay user interface: the inventory panel, the hint panel, the pause screen, the main menu, the win screen, all rendered as accessible HTML on top of the 3D canvas.
- Audio: ambient room loops, event sounds, the witch cackle, all played through the audio library.
- Static content: the room data, the puzzle data, the hint cascade text, the item catalogue, the witch lines.

Without a clear structure these collide. Game-logic code reaches into the Document Object Model to update a label. Render-layer code carries copies of inventory rules. Audio playback gets tangled with puzzle state. Each entanglement makes the game harder to test, harder to change, and harder to keep accessible.

The team has run this pattern before. Image-Colour-Contrast-Checker (ICCC) uses a layered split with strict dependency direction (`src/core/`, `src/adapters/`, `src/render/`, `src/export/`, `src/ui/`) and it has aged well. SWOT-Builder uses a similar split. Sophie's Escape adopts the same pattern, adjusted for a game (an audio layer instead of an export layer, a `src/assets/` static-content layer instead of a model catalogue).

## Decision

Split `src/` into five folders with the dependency rules below. Each rule is enforced by code review and by an ESLint import rule once the project's linter manifest is in place.

### `src/core/`

Pure game logic. No `document`, no `window`, no `THREE`, no `Howl`, no DOM application programming interfaces, no engine application programming interfaces. Worker-safe. Each module exports plain functions and plain data shapes. Allowed imports: standard JavaScript and other modules in `src/core/`.

What lives here:

- The game state model (ADR 004): inventory, room state, puzzle state, hint cascade state, witch encounter state, save and load helpers.
- The puzzle state machines and the item-dependency graph.
- The hint cascade rules.
- The witch trigger timer logic, including the reset-on-hint behaviour Tad recommends in Decision 10.
- The win-condition check.
- The session save serialiser and deserialiser.

This layer is the part of the game that has unit tests. Every change to puzzle logic, witch timing, or save shape is a unit test in this layer first.

### `src/render/`

3D rendering, bound to Three.js. The only place in the project that imports from `three`. Owns the scene graph, the cameras, the lights, the meshes, the first-person controller (keyboard, mouse, touch), the collision check, and the room loader.

Allowed imports: `three`, modules in `src/render/`, type-only imports from `src/core/` (for shared shapes such as `RoomId` and `ItemId`).

Not allowed: importing from `src/ui/`, `src/audio/`, `src/assets/`. The render layer receives data it needs through a small input interface defined in `src/render/types.js` and emits user-intent events out through a small event bus. It does not reach across the project to fetch its own data.

What lives here:

- The Three.js scene per room.
- The first-person controller (`FirstPersonController` class), including the keyboard A/D look behaviour required for WCAG keyboard parity (FR-NAV-02).
- The raycast-based collision check against wall meshes (`collision.js`).
- The raycast-based interactable-object detection that drives hover and keyboard-focus highlights (FR-NAV-03).
- The room transition animation (which respects `prefers-reduced-motion`, NFR-ACC-03).
- The witch cutscene render (the crystal-ball scene the cutscene transitions to).

### `src/ui/`

The HyperText Markup Language overlay. All accessible user-interface code lives here. Every WCAG 2.2 AAA commitment in the project (NFR-ACC-01, NFR-ACC-02) is met by code in this layer.

Allowed imports: modules in `src/ui/`, modules in `src/core/`. May read from `src/core/` to render state. May not import from `src/render/`, `src/audio/`, or `src/assets/`.

What lives here:

- The main menu, the inventory panel, the hint panel, the pause panel, the settings panel, the controls overlay, the win screen.
- The Accessible Rich Internet Applications (ARIA) live regions that announce inventory state, puzzle progress, room descriptions, and witch encounters (covered in detail by `docs/accessibility.md` in this repository).
- The focus-management logic that traps focus inside dialog overlays.
- The visual cue components that accompany audio events (the picked-up flash, the puzzle-solved badge, the witch-encounter banner).

The ARIA live regions are a deliberate feature of the user-interface layer rather than the render layer, because they are part of the accessible HTML and must be in the accessibility tree.

### `src/audio/`

The audio layer. The only place in the project that imports from `howler`. Wraps Howler.js in a thin manager so the rest of the game does not couple to Howler-specific application programming interfaces.

Allowed imports: `howler`, modules in `src/audio/`, type-only imports from `src/core/`.

Not allowed: importing from `src/ui/`, `src/render/`, or `src/assets/`. The audio layer receives play requests (`play('door-creak')`, `setRoomAmbient('library')`, `stopAmbient()`) and emits no inbound dependencies.

What lives here:

- The Howler.js wrapper (`AudioManager` class).
- Volume control (linked to the settings panel through the event bus).
- Ambient-loop scheduling per room.
- Event-sound queuing and the de-duplication rule that stops two stings playing on top of each other (FR-AUDIO-03).
- The autoplay-policy first-interaction unlock.

### `src/assets/`

Static content data. Pure JavaScript Object Notation (JSON) or plain JavaScript objects describing what the game contains, not how it runs.

Allowed imports: none from other layers. This is a leaf layer.

What lives here:

- `rooms.json` (or per-room files): the ten room descriptions, including the accessible room-description text used by the screen-reader narration (`docs/accessibility.md`).
- `items.json`: the inventory item catalogue.
- `puzzles.json`: the puzzle definitions, including each puzzle's three hints (FR-HINT-02).
- `witch-lines.json`: the witch's text lines (FR-WITCH-03).
- `audio-manifest.json`: the mapping from logical event names to audio file paths and their licence record (see ADR 003).
- The 3D model files, texture files, and audio files are referenced from these manifests but live under `public/` (Vite's static-asset folder) so Three.js can fetch them at runtime.

### `src/main.js`

The single orchestration entry point. Wires the five layers together. Holds the top-level event bus, the load order, and the game loop. Carries no business logic of its own.

## Allowed dependency edges, drawn out

A clean diagram in plain text:

- `src/main.js` may import from `src/core/`, `src/render/`, `src/ui/`, `src/audio/`, and `src/assets/`.
- `src/render/` may import from `src/core/` (type-only) and `three`.
- `src/ui/` may import from `src/core/`.
- `src/audio/` may import from `src/core/` (type-only) and `howler`.
- `src/core/` may import from itself only.
- `src/assets/` is a leaf; it imports from nothing in `src/`.

Cycles are forbidden. A new import that closes a cycle is a code-review block.

## Alternatives considered

### A flat module set with no layering

Rejected. The five concerns are large enough that they collide quickly. Three.js types leak everywhere if they are not contained. The game-logic unit tests need the core layer to be free of `document` and `window`, which is only possible if the layer is enforced.

### Use a user-interface framework with its own component model (React, Svelte)

Rejected for the same reasons recorded in ICCC's ADR 0006: the overlay user-interface is small (six dialogs, an inventory panel, a hint panel, a win screen). Plain HTML and Document Object Model code is enough, easier to test for accessibility, and avoids a build-time framework cost on a game whose bundle weight needs to stay small. The team has done both, and the Sophie's Escape user-interface lands well inside the "no framework needed" zone.

### A single Three.js scene shared across all ten rooms

Rejected. A per-room scene is easier to reason about, easier to test in isolation, easier to lazy-load (ADR 003), and avoids one room's geometry budget eating another room's. The trade is a small set-up cost at room transition, which is acceptable.

## Consequences

### Positive

- Game-logic unit tests run in Node.js without a browser, because `src/core/` carries no browser application programming interfaces.
- The Three.js engine can be replaced or upgraded without touching `src/core/`, `src/ui/`, or `src/audio/`.
- Carol's accessibility test pass concentrates on `src/ui/` and the ARIA live regions, because nothing accessible-but-DOM lives anywhere else.
- The audio layer can be muted in unit tests by a single stub, because the rest of the game only knows the small `AudioManager` interface.

### Negative or to manage

- Five layers add ceremony. A small change in a puzzle's hint text touches `src/assets/puzzles.json` only; a small change in the way hints animate touches `src/ui/hint-panel.js` only; a small change in the witch trigger timer touches `src/core/witch-trigger.js` only. The team accepts the ceremony because the layering pays its way as soon as the project has more than a handful of features, and Sophie's Escape has many.
- The render layer's `FirstPersonController` carries platform-specific code paths (keyboard, mouse, touch) that need real device testing. This is recorded in ADR 005 and in the work folder brief.

## Cross-references

- `docs/decisions/001-3d-engine-choice.md`: Three.js is the engine contained by the render layer.
- `docs/decisions/004-game-state-model.md`: the shape of the state that `src/core/` carries.
- `docs/decisions/005-input-model.md`: how the render layer's `FirstPersonController` connects to the keyboard, mouse, and touch input bridges.
- `docs/decisions/007-content-security-policy.md`: the Content Security Policy lists `script-src 'self'` only because of this layering (no inline behaviour, no third-party scripts outside the analytics tag).
- ICCC ADR 0002 (the same pattern, applied to a different problem).
