# Carol Post-Build Findings — PR 21 (fix/sewc-visual-and-item-bug)

Date: 2026-06-01 (final re-test)
Branch: fix/sewc-visual-and-item-bug
Commits tested: 11 commits, tip at dac0ff6
Test environment: Python Playwright (headless Chromium), http://localhost:5174, Vite dev server (VITEST=true)

Previous test date: 2026-06-01 (prior run, tip at 83cf9ad)
Previous verdict: rework needed — stale keyboard-nav entry after pickup
This run: verifies two rework items fixed in dac0ff6 and 83cf9ad

---

## Boot

Pass.

The game loads without errors. The main menu dialog renders correctly with the title, "New Game" button, and GoatCounter privacy notice. The announcer fires the Dungeon Cell room description when New Game is started.

Three console errors on every load (pre-existing):

1. Content Security Policy directive 'frame-ancestors' ignored in meta element.
2. WebSocket connection failed on port 5174 (HMR, expected in dev).
3. WebSocket connection blocked by CSP on port 5173.

None are introduced by this branch.

Screenshot: after/01-main-menu.png

---

## Bug Fix — Item Pickup (commits 83cf9ad and dac0ff6)

### Fix 1: Missing ITEMS import (commit 83cf9ad)

Confirmed resolved. The game boots without the `ReferenceError: ITEMS is not defined` crash that blocked the previous test. The dungeon cell renders all items and the kbd list populates correctly.

### Fix 2: Stale keyboard-nav entry after pickup (commit dac0ff6)

Confirmed resolved.

The fix replaced the `rebuildCurrentRoom()` call (which re-read state that did not yet reflect the pickup) with a surgical `removeItemMesh(itemId)` function. That function splices the specific mesh out of `_interactables` directly, then `refreshInteractionList()` rebuilds the kbd list from the now-correct interactables array.

Test evidence (Python Playwright, headless Chromium, fresh module loads):

Kbd list before pickup: ['Bent spoon', 'Candle stub', 'Heavy wooden door (use bent spoon to open)']
Action: programmatic click on 'Bent spoon' button via dispatchEvent
Announcer immediately after: 'You picked up: Bent spoon.'
Kbd list immediately after: ['Candle stub', 'Heavy wooden door (use bent spoon to open)']

The 'Bent spoon' item button is absent. The door button, whose label text contains the phrase "bent spoon to open", correctly remains. The pickup-announced and list-updated results are synchronous — no delay required.

Verified twice across two separate test sessions. Both confirm the fix.

### Mesh removal from 3D scene

The bent spoon mesh (a small flat metallic box at floor level near the back wall) is removed from the Three.js scene on pickup. The scene after pickup (after/02-item-removed.png) shows only the candle stub and door — no spoon geometry. This is consistent with both the removeItemMesh disposal code (which calls scene.remove(mesh) and mesh.geometry.dispose()) and the visual output.

### Inventory confirmation

Inventory overlay (after/03-inventory.png) shows 'Bent spoon' as the sole inventory item after pickup. The inventory dialog has an accessible H2 heading and a Combine button. Close button (X) returns to the game view cleanly.

### Keyboard nav stable after inventory close

Kbd list after inventory close: ['Candle stub', 'Heavy wooden door (use bent spoon to open)']
The 'Bent spoon' button does not return after closing the overlay. The list is stable.

---

## Visual Assessment Per Room

### Dungeon Cell

Before (baseline: screenshots/02-dungeon-cell.png): Two large irregular amber-orange flat box meshes in the upper left and lower left, set against a featureless plain warm-brown gradient. No visible room walls meeting at corners. The candle stub is a short angled flat box with a notched edge. No depth cues.

After (after/01-dungeon-cell.png): The room has visible 3D geometry — walls meeting at a corner in the upper left, a darker floor plane visible below, a warm amber fog gradient (colour 0x1a1510, density 0.18) creating atmospheric depth. The candle stub is now a cylinder shape sitting atop a box (the shelf), clearly different in silhouette from the before version. The door is the same dark rectangle but now has a visible door-frame surround. The HUD buttons are styled consistently with dark rounded outlines.

Change magnitude: substantial. The room is recognisably a 3D enclosed space rather than floating objects on a flat gradient.

Tim's direction ("more detailed and game-like"): partially met in the Dungeon Cell. The per-room fog, 3D wall geometry, and per-item silhouettes are real improvements. The default camera start position shows only the candle stub and door prominently — the bent spoon item (a small flat box at floor level, position [0.6, 0.13, 1.5]) is below the camera sightline and not prominently visible from the start position.

Candle stub shape: confirmed cylinder, not box. In after/01-dungeon-cell.png, the candle stub shows as a small cylinder above a rectangular shelf body. In after/08-candle-stub.png (same room view with both items present), the cylindrical stub is visible with the warm amber wick point-light glow on the surrounding walls.

### Stone Corridor

Screenshot: after/07-stone-corridor.png (from previous test run, same code).
Fog colour 0x0e0e14 (near-black blue-grey), density 0.10. The screenshot shows near-black with visible diagonal geometry lines at lower left (floor edge or skirting stones). Room label reads "Stone Corridor". The colour temperature is cold and dark — immediately distinguishable from the warm dungeon cell.

Change from before: the before state used the same generic warm brown. The corridor now has a distinct cold near-black blue-grey atmosphere.

### Kitchen

Screenshot: after/08-kitchen.png.
Fog colour 0x1a0e06 (dark warm brown with a reddish cast), density 0.12. The screenshot shows a deep warm reddish-brown. Room label reads "Kitchen". Warmer than the corridor, cooler than the dungeon cell.

Change from before: distinct from both dungeon cell and corridor by hue.

### Chapel

Screenshot: after/09-chapel.png.
Fog colour 0x06060e (near-black with a blue cast), density 0.12. The screenshot shows close to pure black with a very slight blue tint. The coldest and darkest room. Room label reads "Chapel".

Change from before: the darkest and most visually distinct room. Appropriate for a chapel atmosphere.

### Tower Room

Not captured (pre-existing navigation gap — cell door type stays 'puzzle' after solving, blocking kbd-list room entry). Code review confirms fog 0x060810 and a blue-grey floor. The per-room geometry additions apply.

---

## Tim's Direction ("More detailed and game-like — cartoon-like is fine")

Partially met.

The per-room fog and background colour, distinctive item shapes (spoon as small metallic box, candle as cylinder with wick point-light, petal as emissive disc, key as torus-and-shaft, crystal as sphere), per-room lighting rigs, floor/ceiling surface differentiation, door frames, and room geometry additions (pillars, beams, alcoves) all move the game meaningfully in the requested direction.

The improvements are most visible when moving through the rooms — static screenshots at the default camera position show the fog and item shape changes but not the full depth of the room geometry. The Dungeon Cell default position shows the candle stub cylinder clearly. Other rooms appear near-black in static screenshots because the fog density is high for atmosphere.

Verdict: partially. The direction is correct and the implementation is real. More work would be needed to reach "cartoon-like" detail with clearly legible 3D geometry from a static viewpoint, but this branch makes substantial progress. The visual quality is higher than the before state in every tested room.

---

## Accessibility Checks

### D1 — Canvas ARIA setup

Pass. Canvas has role="application", aria-label="Sophie's Escape game view. Use keyboard controls or on-screen buttons to play.", and tabindex="0". Matches approved exception SE-001.

### D2 — Keyboard navigation list after pickup

Pass. After pickup, the 'Bent spoon' item button is removed from #interaction-kbd-list. The list correctly shows only 'Candle stub' and 'Heavy wooden door (use bent spoon to open)'. Confirmed via two independent programmatic test runs.

### D3 — Room label HUD

Pass. #room-label-hud text is 'Dungeon Cell' when in the dungeon cell. aria-hidden="true" correctly set (visual only; screen-reader announcements come from the live region).

### D4 — HUD buttons keyboard-reachable with labels

Pass. All four HUD buttons have descriptive aria-label attributes:
- "Open inventory"
- "Show hint"
- "Pause game"
- "Help — how to play"

Tab order: Open inventory, Show hint, Pause game, Help, then kbd list buttons, then game canvas.

### D5 — Game announcer live region

Pass. #game-announcer has role="status", aria-live="polite", aria-atomic="true". Pickup events announce immediately. Room narration fires on entry.

### D6 — Dialogs accessible names

Pass (resolved since previous test). All five overlays now have aria-labelledby attributes referencing their H2 heading elements. Previous test flagged this as a rework concern — it has been addressed in this branch:

- overlay-main-menu: aria-labelledby="main-menu-heading"
- overlay-inventory: aria-labelledby="inventory-heading"
- overlay-hint: aria-labelledby="hint-heading"
- overlay-pause: aria-labelledby="pause-heading"
- overlay-help: aria-labelledby="help-heading"

### D7 — Heading structure

Pass. One H1 (Sophie's Escape: The Witch's Castle), five H2 elements (overlay titles: Inventory, Hint for this puzzle, Game Paused, How to Play, and main menu heading), six H3 elements (Help subsections: Moving and looking, Picking up items, Using items, Combining items, Hints, Pausing). No skipped levels.

### D8 — Language attribute

Pass. html[lang="en"] present.

### D9 — Skip link

Fail (pre-existing, not introduced by this branch). No skip link present. WCAG 2.4.1 Bypass Blocks (Level A) requires a mechanism to skip repeated navigation. This pre-existed the branch.

### D10 — Images without alt text

Pass. Zero images without alt text. HUD button icons use aria-hidden="true", relying on sibling text for accessible names.

### D11 — Tab order

Pass. Tab traversal reaches: Open inventory, Show hint, Pause game, Help, kbd list buttons (Candle stub, Heavy wooden door...), then the game canvas (which has tabindex="0"). All interactive elements are keyboard-reachable.

---

## Unit Tests

Pass. 33 of 33 tests pass across 2 test files.

Test Files: 2 passed (2)
Tests: 33 passed (33)
Duration: approximately 380ms

Files:
- src/core/reducer.test.js — 28 tests (reducer actions including PICK_UP_ITEM, NEW_GAME, ENTER_ROOM, OVERLAY_OPENED, OVERLAY_CLOSED, puzzle and combination mechanics)
- src/render/room-manager.test.js — 5 tests (removeItemMesh: removes target mesh, leaves others intact, calls dispose on geometry and material, removes DOM label, is no-op for absent item)

The five new unit tests for removeItemMesh cover the full happy path and the edge case of an absent item ID. All pass.

---

## Lint

Pass. ESLint reports 0 errors, 2 warnings. Both warnings are intentional: one no-console warning for the boot diagnostic logger in main.js (line 87), one for the screen-reader label guard in interaction-handler.js (line 417). Neither is introduced by this branch.

Stylelint reports 0 errors.

---

## Pre-existing Issues (not rework for this branch)

These were noted in the previous test report. They remain:

1. Skip link absent — WCAG 2.4.1 (Bypass Blocks) Level A. Pre-existing.
2. Cell door stays type 'puzzle' after puzzle is solved, so the kbd list door button fires the puzzle handler ("This puzzle is already solved.") rather than the door handler. Navigation to Stone Corridor is only possible via raycaster pointer interaction, not via the keyboard-only button. Pre-existing design gap.

---

## Sign-off

Ready to merge.

Both rework items from the previous test report are resolved:

1. Missing ITEMS import (commit 83cf9ad) — game boots correctly, no crash.
2. Stale keyboard-nav entry after pickup (commit dac0ff6) — the surgical removeItemMesh approach correctly splices the mesh out of _interactables before refreshInteractionList runs. The kbd list removes the picked-up item immediately and synchronously. Confirmed by two independent programmatic test runs with DOM evidence.

All accessibility checks pass except the pre-existing skip link absence and the pre-existing cell-door navigation gap, neither of which are introduced by this branch. Dialog accessible names (previously flagged as a concern) are now confirmed present via aria-labelledby on all five overlays.

Visual design improvements (per-room fog, distinctive item shapes, room geometry) are confirmed by screenshots and code review. Tim's direction of "more detailed and game-like" is partially met — the improvements are real but the static default-camera view shows primarily the atmospheric fog changes rather than the full room geometry.

Unit tests: 33/33 pass. Lint: 0 errors.

---

## Screenshot Evidence Summary

| Screenshot | Content |
|---|---|
| after/01-main-menu.png | Main menu renders correctly |
| after/01-dungeon-cell.png | Dungeon Cell — 3D room geometry, candle stub cylinder, warm amber fog |
| after/02-item-removed.png | Dungeon Cell after pickup — bent spoon absent from scene |
| after/03-inventory.png | Inventory showing Bent spoon after pickup |
| after/04-scene-clean.png | Scene after inventory closed — stable, no stale items |
| after/07-stone-corridor.png | Stone Corridor — near-black blue-grey fog, room label correct |
| after/08-kitchen.png | Kitchen — dark warm reddish-brown fog, room label correct |
| after/09-chapel.png | Chapel — near-black blue fog, coldest room |
| after/08-candle-stub.png | Dungeon Cell candle stub — cylinder shape confirmed |
