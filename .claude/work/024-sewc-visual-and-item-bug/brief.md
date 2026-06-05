# Work Folder 024: Visual Design Review and Item-Pickup Bug

- Project: sophies-escape-witchs-castle
- Project-Name: Sophie's Escape — Witch's Castle
- Status: done
- Branch: fix/sewc-visual-and-item-bug
- Priority: 1
- Blockers: None.
- Mockup mode: C (screenshots in work folder)

## Summary

Two issues reported by Tim after playing the game:

1. **All geometry is basic placeholder boxes.** Every room uses BoxGeometry and PlaneGeometry with flat colour. There is no visual design — items, doors, walls, and furniture look identical in shape. Tim wants Simon to assess the current visuals and propose improvements.

2. **Items are not removed from the room when picked up.** After the player picks up an item (PICK_UP_ITEM dispatched), the item mesh remains in the 3D scene. The state updates correctly (the item enters inventory and the room skips the mesh on a full rebuild), but `rebuildCurrentRoom()` is never called after pickup, so the visual persists.

## Root cause of item-pickup bug

In `src/render/interaction-handler.js`, `_handleItemPickup()` (around line 241):

```js
dispatch({ type: 'PICK_UP_ITEM', payload: { itemId } });
// Missing: rebuildCurrentRoom() and refreshInteractionList(announce)
```

The room manager checks inventory state when building item meshes (e.g. `if (!state.inventory.items.some(i => i.itemId === 'bent-spoon'))`), so calling `rebuildCurrentRoom()` after dispatch would correctly omit the picked-up item. `rebuildCurrentRoom` must be imported from `room-manager.js` and called immediately after dispatch.

After rebuilding, `refreshInteractionList(announce)` must also be called so the keyboard-accessible button list reflects the new room state.

## Visual design scope

Simon will review:
- `src/render/room-manager.js` — all room builder functions and the geometry helpers
- Carol's screenshots of the running game

Simon should propose the most impactful improvements achievable with the current Three.js / plain geometry stack (no GLTF, no external texture assets). The aim is character and visual interest, not photorealism. Tim's brand is warm, family-friendly, accessible.

## Out of scope

- New rooms, new items, or new game content.
- GLTF or texture loading from external sources.
- Audio changes.
- Changes to the AgentTeam scripts or global wiki.
- Changes to external sites or social media.

## Risk and rollback

- The item-pickup bug fix touches `src/render/interaction-handler.js` only — two lines added after the `dispatch` call. Rollback: `git checkout -- src/render/interaction-handler.js`.
- Visual design changes touch `src/render/room-manager.js`. Rollback: `git checkout -- src/render/room-manager.js`.
- No state reducer, no HTML, no CSS design tokens, and no test files are changed unless a new visual helper requires a test.

## Definition of done

- Picking up an item removes its mesh from the 3D scene immediately, and the keyboard interaction list updates to match.
- Simon has assessed the game visuals and produced a written design proposal with concrete, implementable changes.
- Carol has screenshots of the current state and confirms the items-not-removed bug on screen.
- After Sean builds Simon's improvements, Carol confirms the visual changes and re-tests item removal.
- CI passes.

## Tim's direction (2026-05-31)

"Make the graphics more detailed and game-like. Cartoon-like is fine, but must be more detailed than current. Goal: update all the graphics of the game to make it more game-like. Test with Carol checking the outcome."

All seven of Simon's improvements are in scope. Sean should apply them in Simon's revised priority order (from the screenshot-review update appended to `simon-design-proposal.md`):

1. Scene background colour per room
2. Fog per room
3. Floor and ceiling surface differentiation (promoted from seventh — screenshots showed no visible floor edge)
4. Door design with frame, handle, and depth
5. Per-room lighting rigs
6. Distinctive item shapes (cartoon-readable silhouettes; brighter and more saturated than Simon's atmospheric-dark defaults where "cartoon-like" calls for it)
7. Room geometry additions (pillars, alcoves, shelves, etc.)

The item-pickup bug fix (call `rebuildCurrentRoom()` and `refreshInteractionList(announce)` after `PICK_UP_ITEM` in `interaction-handler.js`) goes in first, before any visual work, as it is a two-line change.

## Approved GitHub actions

Tim pre-approved all six standard actions (Q-SEWC2ABCDEF, 2026-05-31):

- Create branch `fix/sewc-visual-and-item-bug`
- Commit to that branch
- Push that branch to remote (not main)
- Open a pull request against main
- Comment on a pull request or issue
- Create an issue
