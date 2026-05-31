# Work Folder 023: Sophie's Escape Gameplay Fixes

- Project: sophies-escape-witchs-castle
- Project-Name: Sophie's Escape — Witch's Castle
- Status: done
- Branch: fix/sewc-gameplay
- Priority: 1
- Blockers: None.

## Summary

Fix two gameplay bugs reported by Tim after v0.3.0:

1. **No visual distinction**: all interactable items are identical small amber cubes with no labels and no hover highlight. Players cannot tell what they are looking at or whether the crosshair is over something reachable.
2. **Silent miss**: pressing E or Enter when nothing is within reach produces no feedback. Players cannot tell whether the key press registered.

## Root causes (identified by Carol)

### Bug 1 — `src/render/room-manager.js` and `src/render/interaction-handler.js`

- `_makeItemBox` at lines 284-292 creates identical 0.25m amber cubes. No label is attached to the 3D scene (the keyboard-nav list has text buttons, but the 3D boxes are unmarked).
- There is no per-frame raycasting pass. The crosshair never changes and nothing glows or highlights when the player aims at an item.

### Bug 2 — `src/render/interaction-handler.js` line 124

- `_onInteract` returns silently when `hits.length === 0` or `hits[0].distance > INTERACT_DISTANCE`. No announcement fires. The player hears nothing.

## Items in scope

1. **Per-frame hover highlight** (`interaction-handler.js`): add a `tickHighlight(camera)` function that runs every frame. It raycasts from the screen centre; if the nearest hit is within `INTERACT_DISTANCE`, apply an emissive boost (e.g. `emissiveIntensity: 1.0`) to that mesh and reset all others to their base value. Export `tickHighlight` and call it from the `_onFrameCallback` in `engine.js` (or wire it through `main.js`).

2. **3D scene labels** (`room-manager.js`): add a floating HTML label above each interactable item. Use a `div` positioned via camera projection in the render loop, or use `CSS2DObject` from `three/examples/jsm/renderers/CSS2DRenderer.js`. The label must show the item's `label` string. Labels must hide when the item is picked up (room rebuilt). Choosing CSS2DObject is preferred (Three.js-idiomatic); if it adds significant bundle complexity, a simple DOM-overlay approach is acceptable.

3. **Silent-miss announcement** (`interaction-handler.js`): at line 124 (the early return), replace the bare `return` with `announce('Nothing nearby to interact with.')` then `return`. Same announcement if the player aims at the item but is beyond `INTERACT_DISTANCE`.

## Out of scope

- Any new rooms or game content.
- Changes to the AgentTeam scripts or wiki.
- Changes to external sites.
- GLTF or asset loading (geometry remains placeholder boxes).

## Risk and rollback

All changes are to JavaScript source files in `src/render/`. No HTML, CSS design tokens, or game-state reducer is touched. Rollback: `git checkout -- src/render/interaction-handler.js src/render/room-manager.js` (and `src/render/engine.js` if changed for CSS2DRenderer).

## Definition of done

- Hovering the crosshair over a reachable item makes that item visibly brighter (emissive boost).
- Each interactable item has a visible label in the 3D scene.
- Pressing E or Enter when nothing is in range announces "Nothing nearby to interact with."
- Existing interactions (pick up, door, puzzle) still work.
- Carol confirms all three fixes with Playwright.
- CI passes.

## Approved GitHub actions

- `git push origin fix/sewc-gameplay` — push the working branch.
- `gh pr create` — open a pull request against main on the Sophie's Escape repo.
