# Jacob: Architecture review of PR 2 (v0.1 scaffold)

Project: Sophie's Escape: The Witch's Castle
Branch reviewed: `feat/v0.1-scaffold` (PR 2)
Reviewer: Jacob (architect)
Date: 2026-05-24
Scope: Retroactive backfill. Nine Architecture Decision Records (ADRs) and the v0.1 scaffold source.

## Verdict

Approved with conditions.

The architecture is sound for a long-lived browser game project. The three-layer split (render, core, user interface) holds together, the intent bus is the right shape for the input bridge, the reducer is pure and testable, and the service worker is small and safe. The conditions below are mostly v0.2 follow-ups that should be tracked, plus a small number of v0.1 corrections that Sean can pick up before or after merge.

I have no architectural blockers to merging PR 2. The merge gate is Sonja's, with Tim's express approval.

## Summary of what was reviewed

- All nine Architecture Decision Records in `docs/decisions/`.
- Key source files: `src/main.js`, `src/render/engine.js`, `src/render/first-person-controller.js`, `src/render/input/intent-bus.js`, `src/render/input/keyboard-bridge.js`, `src/render/input/mouse-bridge.js`, `src/render/input/touch-bridge.js`, `src/core/state.js`, `src/core/reducer.js`, `src/core/persistence.js`, `src/core/reducer.test.js`, `src/ui/overlay-controller.js`, `src/ui/inventory-panel.js`, `src/audio/audio-manager.js`, `src/analytics/analytics.js`, `vite.config.js`, `public/sw.js`, `package.json`.

## The nine ADRs as a set

The nine records hang together as a coherent architecture. The dependency directions in ADR 002 are echoed correctly in every other record (no ADR proposes an import that ADR 002 forbids). The CSP in ADR 007 reflects the engine, audio, and analytics choices in ADRs 001, 003, 006, and 008 without contradiction. The service worker in ADR 008 lines up with the asset tiers in ADR 003 and the deployment shape in ADR 009. The state model in ADR 004 lines up with the intent set in ADR 005.

I would normally call this a high-quality first pass. The ADR set is detailed, the "Alternatives considered" sections are honest, the cross-references resolve, and the lessons from ICCC (Q67 WebAssembly retrofit, no Subresource Integrity on `count.js`, `coi-serviceworker` upgrade cost) are folded in from the start. That is the right way for a second project in a stack to read.

## The three-layer split (render, core, user interface)

Verdict: holds together.

The split in ADR 002 is the same shape that ICCC and SWOT-Builder use. Sophie's Escape adds an audio layer and a static-content `assets/` layer; the trade is correct for a game.

Key checks I made:

- `src/core/` is genuinely browser-free. `reducer.js` has no `document`, no `window`, no `THREE`, no `Howl`. `state.js` does call `crypto.randomUUID` and `new Date().toISOString()`, both of which are available in Node.js 16+ (and `crypto.randomUUID` in modern browsers); this keeps the layer worker-safe and unit-testable.
- Only `src/render/engine.js` imports from `three`. `first-person-controller.js` imports from `three` only as a JSDoc type (`@type {import('three').PerspectiveCamera}`), so no runtime coupling. That is the facade pattern ADR 002 commits to.
- `src/audio/audio-manager.js` is a stub today. The interface is the surface the rest of the game will see; Howler is not yet imported. Good.
- `src/ui/overlay-controller.js` reads from `src/core/state.js` and emits actions back through `dispatch`. It does not import from `src/render/` for any runtime concern. It does import from `src/render/input/intent-bus.js`, which I flag below as the one architectural smell to fix.

### One architectural smell: the intent bus lives under `src/render/input/`

`src/ui/overlay-controller.js` imports `on` from `src/render/input/intent-bus.js`. By ADR 002, the user-interface layer is not allowed to import from the render layer; only the other way around. The intent bus is logically a cross-cutting bus, not a render concern.

Recommendation (v0.2 cleanup): move `intent-bus.js` to `src/core/intent-bus.js` (or `src/input/intent-bus.js` at the top level). The bridges (keyboard, mouse, touch) stay in `src/render/input/` because they consume browser events that the render layer handles. The bus itself is plain data and is needed by both `src/render/` and `src/ui/`. Once moved, the user-interface layer imports from the new path and the dependency rule in ADR 002 holds without exception.

This is a small refactor, not a blocker. It does not change any behaviour, only the file location and the import paths.

## The intent bus pattern for the input bridge

Verdict: appropriate, with the path-fix above.

The publish-subscribe shape in `intent-bus.js` is the right one for this problem. Three bridges fan in (keyboard, mouse, touch); two consumers fan out (first-person controller, overlay controller). The bridges are device-aware and the controllers are intent-aware; the game logic in `src/core/` does not need to know which device fired anything. ADR 005's design is met by the code.

Specific items I checked:

- The held-key set lives in `keyboard-bridge.js` (`_held`). The first-person controller reads it through `getHeldIntents()` each frame. This is the right shape: continuous movement is read by polling, one-shot intents go through the bus. Mixing the two would either flood the bus or lose key-up.
- The joystick held set lives in `touch-bridge.js` (`_joystickHeld`). The first-person controller reads it through `getJoystickHeld()` each frame. Same pattern, applied consistently.
- `LOOK_DELTA` (continuous) and `INTERACT`, `TOGGLE_*`, `OPEN_*`, `CLOSE_OVERLAY` (one-shot) go through the bus.
- The keyboard bridge respects focus context: shortcuts (`I`, `H`, `E`) do not fire when focus is in an `input`, `select`, or `textarea`. WCAG 2.1.4 (Character Key Shortcuts) is satisfied at AAA by this guard.

### Issue: touch-end on canvas always emits INTERACT (false positives)

`touch-bridge.js` lines 173 to 191: on `_onTouchEnd` for the look touch, the bridge always emits `INTERACT`. The TODO at line 179 acknowledges the gap. A long drag that ends without releasing on an interactable target should not register as a tap. In v0.1 with no interactables this is a no-op, but as soon as v0.2 ships pickable items, this will produce false "tap" interactions after every look drag.

Recommendation: track the touch's accumulated delta and elapsed time on `touchstart` and `touchmove`. On `touchend`, emit `INTERACT` only if the total movement is below a threshold (about 10 CSS pixels) and the elapsed time is under 300 milliseconds. This is the standard tap-versus-drag rule and is small (about 15 lines).

This is a v0.2 follow-up unless v0.1 ever exposes a pickable object. PR 2 itself is fine.

## Vite configuration and build setup

Verdict: correct for the project, with one risk to flag.

- `base: '/sophies-escape-witchs-castle/'` is the right value for GitHub Pages under `timdixon82.github.io`. The one-line swap to `'/'` for a future custom domain is documented in ADR 009.
- `build.target: 'es2022'` matches NFR-BROWSER-01 (Chrome 120+, Safari 17+, Firefox 120+, Edge 120+). All of those support ES2022.
- `build.assetsInlineLimit: 0` is correct: every asset must be a file so the service worker can cache it by URL.
- `worker.format: 'es'` matches ADR 009.
- The mkcert plugin is correctly gated to `command === 'serve' && !isVitestRun`. It will not interfere with `vite build`, `vite preview`, or `vitest run`. Good.
- The `server.port: 5174` is set in `vite.config.js`, but `package.json` has `"dev": "vite --port 5173"`. The command-line flag wins, so the dev server actually runs on 5173. This is fine for Tim's chosen test flow (commit-to-main, no local HTTPS dev server) but should be reconciled in v0.2 so the configuration and the script agree.

### Risk: no `rollupOptions.output.manualChunks` yet

ADR 009 commits to per-room manual chunks so per-room lazy loading works without scattered `import()` calls. The current `vite.config.js` does not configure `manualChunks`. For v0.1 with only one room this is fine, because there is nothing to split. For v0.2 with multiple rooms, the chunking strategy needs to be added. Track this against the v0.2 milestone.

## Game state reducer and 17 unit tests

Verdict: shape is right, with three small risks.

The reducer is pure, deterministic, and side-effect-free. The state shape closely tracks ADR 004 with two small differences from the ADR text that I note below. The unit tests cover the spine of the behaviour: room entry, item pickup, item de-duplication, selection toggle, hint reveal with witch timer reset, hint cap, overlay open and close, pause and resume, settings merge, unknown action returns identity, and the four `shouldFireWitchEncounter` branches. Coverage looks proportionate for v0.1.

### Risk 1: `getState()` returns a shallow freeze, not a deep freeze

`src/core/state.js` line 28: `return Object.freeze({ ..._state });`. This freezes the top-level object but the nested objects (`inventory`, `inventory.items`, `puzzles`, `hints`, `witch`, `witch.trigger`, `settings`) are still mutable. A subscriber that does `state.inventory.items.push(...)` would corrupt the state tree without going through `dispatch`, defeating the single-mutation-path commitment in ADR 004.

The ADR commits to "deep-frozen snapshot" (ADR 004, section "The state owner"). The implementation is shallow-frozen.

Recommendation: replace the shallow freeze with a deep-freeze pass, or rely on TypeScript-strict `Readonly<>` plus a lint rule that bans direct property mutation. The deep-freeze pass is about 10 lines of code and is what the ADR commits to. Deep-freeze costs nothing at runtime in modern V8 (the freeze flag is set once per object) and catches accidental mutations in development immediately. Track for v0.2 unless Sean wants to fix it before merge.

### Risk 2: `LOAD_GAME` does a shallow spread, not a schema-validated merge

`reducer.js` line 31: `case 'LOAD_GAME': return { ...state, ...(action.payload ?? {}), gameStatus: 'playing' };`. This is fine when the payload is a previously-saved state of the same schema version. It is not safe if a future release changes the shape (a new top-level key, a renamed sub-object). The schema check is in `loadFromStorage()` (`if (parsed?.schemaVersion !== 1) return false;`), but `LOAD_GAME` itself does not check.

Recommendation: `LOAD_GAME` should reject payloads with a schema version other than the current one, or run through a migration helper. ADR 004 has the migration sketch (read old key, transform, write new key, delete old key). Track for v0.2 when the second schema version arrives; not urgent now because there is only one schema.

### Risk 3: `roomsVisited` is initialised with `'dungeon-cell'` already in it

`state.js` line 111: `roomsVisited: ['dungeon-cell']`. This means the analytics `room-entered` event for the first room never fires, because `main.js` line 217 checks `if (!prev.roomsVisited.includes(state.currentRoomId)) trackEvent(...)`. The first room is already in the visited list at state creation.

This is a small analytics bug, not a state-model risk. ADR 006 commits to a `room-entered` event "once per first entry to each of the ten rooms", and the Dungeon Cell is one of them. Either initialise `roomsVisited` to `[]` and let `ENTER_ROOM` add the first entry, or fire the first `room-entered` event explicitly on `NEW_GAME`. Track for v0.2 milestone events.

## State shape differences from ADR 004

Two small differences between the ADR text and the implementation. Neither is wrong; they are clarifications that should be back-filed into the ADR or the next ADR update.

- ADR 004 lists no `openOverlays` field at the top level. The implementation adds `openOverlays: string[]`. The reducer handles `OVERLAY_OPENED` and `OVERLAY_CLOSED` against this field, and `shouldFireWitchEncounter` reads it. This is necessary for ADR 005 to work (the input bridges check overlay state) and is the right place to put it. The ADR text just predates the field.
- ADR 004 lists actions including `USE_ITEM`, `COMBINE_ITEMS`, `HINT_REVEALED_RESETS_WITCH_TIMER`, `PUZZLE_STEP_COMPLETE`, etc. The implementation has the same actions but adds `CLEAR_SELECTION`, `CONSUME_ITEM`, `PUZZLE_ATTEMPT`, and `TICK_ELAPSED`. These are reasonable additions. Again, ADR text predates the code.

Recommendation: when v0.2 work begins, update ADR 004 to match what the code actually exposes. The ADR's role is the durable record; let the code lead, then settle the text.

## Overlay controller pattern

Verdict: robust for v0.1, with two notes.

The overlay controller has the right shape for a screen-reader-accessible dialog system. Key items I checked:

- The open and close stack manages multiple overlays cleanly. `_openStack` records the order; `_closeTop` and `_closeAll` are correct.
- Focus management: the previously-focused element is stored in `_returnFocusMap` keyed by overlay ID. On close, focus returns. On open, `_moveFocusInto` walks the dialog and focuses the first interactive descendant. This satisfies WCAG 2.4.3 (Focus Order) and 2.4.11 (Focus Not Obscured) at AAA when paired with the visual design.
- `aria-expanded` is set on the trigger button when the overlay opens and closes. Good.
- Native `<dialog>` is used with a fallback for iOS Safari 15.3 and below (the `setAttribute('open', '')` path). The try-catch around `showModal()` covers the edge case where the dialog is not connected. Defensive, correct.
- The `OVERLAY_OPENED` and `OVERLAY_CLOSED` actions dispatch to the core state, which is what the input bridges, the witch timer, and the test suite all rely on. The state-driven model is consistent end to end.

### Note 1: focus trap is not enforced inside the dialog

ADR 005 commits to focus trapping ("Tab at the last element wraps to the first; Shift-Tab at the first wraps to the last"). The current code emits `NEXT_FOCUSABLE` and `PREV_FOCUSABLE` intents but the controller does not consume them with a wrap. The `<dialog>` element's native `showModal()` provides an inert-background guard (clicks and tabs cannot reach the page behind the dialog), which is most of what is needed. Inside the dialog, Tab walks the dialog's own focusable elements; at the end, browsers behave inconsistently (some loop, some leave).

Recommendation: have the overlay controller subscribe to `NEXT_FOCUSABLE` and `PREV_FOCUSABLE`, compute the focusable list (`_getFocusableElements` already exists), and explicitly wrap on the boundary. About 20 lines. Track as a v0.1 follow-up if Carol's WCAG audit flags it, or v0.2 otherwise. For Tim's iPhone test pass, the native `<dialog>` behaviour is enough to be playable.

### Note 2: `_closeAll` plus `PAUSE` plus `_showMainMenu` is a three-step sequence in one click handler

The Quit-to-Menu button (`overlay-controller.js` line 57) does three things: closes all overlays, dispatches `PAUSE`, then shows the main menu. The order is correct, but the state transitions are stepped (close, pause, open menu) rather than expressed as a single action. The reducer cannot tell, after the fact, why the state ended up where it did; subscribers may observe an intermediate state.

This is a minor design observation, not a defect. A future `QUIT_TO_MENU` action that does the three things in one reducer call would be slightly cleaner. Track for v0.2.

## Service worker

Verdict: caching strategy is safe, no update-blocking risks.

The worker is small (92 lines), readable, and does exactly what ADR 008 commits to: cache-first for same-origin GETs, pass-through for the GoatCounter origin, ignore everything else. Key checks:

- `install` calls `skipWaiting()`. The new worker takes over without waiting for all tabs to close. Combined with `activate` calling `clients.claim()`, this gives the user a clean update on the next page load.
- `activate` evicts every cache whose name is not in `ALL_CACHES`. The version-bump-evicts-old pattern is in place. Once the `build-info.js` integration ships (the TODO at line 15), every release bump rotates the cache cleanly.
- `_cacheFirst` returns the cached response when present, otherwise fetches, stores, and returns. If the network fails and the cache is empty, a 503 Response is returned. This is the correct cache-first behaviour.
- Only `GET` requests are cached. Non-GET requests pass through. Good.
- The GoatCounter origin is excluded from caching. ADR 006 commits to this explicitly; the code matches.

### One small follow-up: the cached `Response` clone

`_cacheFirst` line 84 does `cache.put(request, response.clone())` and returns the original. This is the standard pattern and is correct. Worth noting that a partial response (status 206) would also be `response.ok === false`, so it would not be cached. The game has no range requests in v0.1, so this is academic.

### Update-blocking risk: none today

The worker does not pre-cache, so a slow first-fetch on a Tier 1 asset will not block the install. The worker does not skip waiting until activation completes; `clients.claim()` is called inside the `activate` waitUntil, so claim runs after the activation promise resolves. No risk of taking over with a half-installed worker.

The one risk I would flag for the future: when the version string moves to read from `build-info.js`, the production worker reads it through `importScripts('build-info.js')`. The hash of `build-info.js` must change with every release, otherwise the service worker would not register as a new worker. This is ADR 008's commitment; track it in the v0.2 build pipeline.

## CSP and security architecture

Verdict: tight, with the two recorded exceptions (`'wasm-unsafe-eval'` on `script-src`, `'unsafe-inline'` on `style-src`).

The CSP in ADR 007 is well-shaped. Five things I want to note for Jed's parallel security review:

- `connect-src` is the strongest line in the policy: only `'self'` and the GoatCounter endpoint. A supply-chain compromise in any future library cannot exfiltrate to anywhere except the team's own counter. This is the right shape.
- `'wasm-unsafe-eval'` is on day one, not retrofitted. ADR 007's text references ICCC's Q67 explicitly. Good.
- `'unsafe-inline'` on `style-src` is the one starter-pattern exception. ADR 007 records it as a tightening task. The dynamic styles in `inventory-panel.js` (the `_showFeedback` className change) and `touch-bridge.js` (the joystick knob transform) are good candidates to refactor to class toggles or CSS custom properties.
- `frame-ancestors 'none'` substitutes for `X-Frame-Options: DENY` that GitHub Pages cannot send.
- `report-uri` and `report-to` are not configured. Reasonable for v0.1.

I see no architectural objection. Jed will look at the implementation details.

## Boot sequence and error reporting

Verdict: solid, with one observation.

`main.js` has a careful boot sequence with `_logStep` and `_showBootError` helpers. The pre-module inline script in `index.html` (referenced in the comment at line 19) creates the diagnostic panel; the module-layer code appends to it. This is the right pattern for an iPhone test pass without developer tools.

The `window.__bootComplete` flag at line 167 is the canary the pre-module timer reads. The diagnostic panel surfaces module-load failures even if the module loader itself dies.

### Observation: green diagnostic text colour `#aaffaa` on near-black

`main.js` line 71 sets `color:#aaffaa;font-size:0.85rem;` on the boot-step lines. On the `#0a0a0a` near-black background (the design token `--bg-canvas`), the contrast ratio of `#aaffaa` (lightness around 90%) is approximately 13:1, which is comfortably above WCAG 2.2 AAA (7:1 for normal text). The `0.85rem` font size is on the small side but within AAA when the contrast is this high. No issue.

## Architectural gaps and decisions needed before v0.2

These are the items the team should track explicitly. None of them blocks PR 2; they are the v0.2 list.

1. Move `intent-bus.js` out of `src/render/input/` so `src/ui/` does not import from `src/render/`. ADR 002 conformance.
2. Add `rollupOptions.output.manualChunks` to `vite.config.js` for per-room chunks. ADR 009 conformance.
3. Resolve port mismatch between `vite.config.js` (5174) and `package.json` script (5173).
4. Deep-freeze the state snapshot in `getState()` (or add a lint rule banning direct state mutation). ADR 004 conformance.
5. Track tap-versus-drag in `touch-bridge.js` so a look drag does not emit a false `INTERACT`. ADR 005 conformance.
6. Implement explicit focus-trap wrapping in `overlay-controller.js` when `NEXT_FOCUSABLE` / `PREV_FOCUSABLE` reach the boundary. ADR 005 conformance.
7. Fix the `roomsVisited` initial value so the analytics `room-entered` event fires on first entry to the Dungeon Cell. ADR 006 conformance.
8. Update ADR 004 to match the actual state shape (`openOverlays` field, `CLEAR_SELECTION`, `CONSUME_ITEM`, `PUZZLE_ATTEMPT`, `TICK_ELAPSED` actions). Record-keeping.
9. Tighten `style-src` by removing `'unsafe-inline'` once the inline-style audit completes. ADR 007 commitment.
10. Wire `build-info.js` so the service worker reads `VERSION` from a content-hashed file rather than a hard-coded constant. ADR 008 commitment.
11. Replace the room-boundary clamp in `first-person-controller.js` with the raycast-against-walls collision check ADR 001 commits to.
12. Add Tim's Clarification 4 answer (sessionStorage versus localStorage) and switch `persistence.js` accordingly. ADR 004 open item.

## Conditions for approval

I approve PR 2 with the following conditions, all of them tracked rather than blocking the merge:

- The 12 items above are written into the project log as the v0.2 architecture backlog. Sonja decides which (if any) Sean fixes before merge; my recommendation is to merge as-is and ship the backlog as the next planned work.
- Tad's Clarification 4 (sessionStorage versus localStorage) is presented to Tim with Sonja's next batch. Until Tim answers, `persistence.js` keeps the current `localStorage` default; this is a reasonable hold position.
- Carol's WCAG audit runs against the merged main, and any focus-trap or contrast finding feeds into items 6 and 9 above.
- Jed's security review runs against the merged main, and any CSP or service worker finding feeds into items 9 and 10 above.

The architecture is sound. The scaffold is well-shaped for the project's full ten-room scope. Sean has built a clean v0.1 that the team can extend without architectural surgery.

End of review.
