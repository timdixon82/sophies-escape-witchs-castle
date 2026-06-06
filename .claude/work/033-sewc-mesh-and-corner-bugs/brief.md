# Work folder 033: SEWC mesh cleanup and corner interaction bugs

**Status:** done
**Triage type:** Bug fix (type 6)
**Opened:** 2026-06-06

## Issue 1: Candle wick stays in scene after pickup

When the candle stub is picked up, the wax cylinder is removed but the wick mesh (a separate child mesh) remains floating in the scene. Fix: ensure all child meshes of the candle group are removed from the scene and from _roomObjects/_interactables on pickup. The fix should apply to any multi-mesh item group.

## Issue 2: Spoon mesh stays after use

After selecting the bent spoon from inventory and using it on the cell door to solve the puzzle, the spoon mesh remains visible in the scene. Investigate whether PICK_UP_ITEM is still dispatched correctly with the new item-use mechanic, and whether the mesh removal path fires. Fix so the mesh is removed when the item is consumed.

## Issue 3: Items in corners not interactive

Items placed near walls or in corners of rooms cannot be interacted with. Likely cause: the collision system's prop bounding boxes (or wall planes) are blocking the raycaster ray before it reaches the item mesh. Fix: ensure the raycaster for interactions ignores collision-only meshes (those in _propMeshes but not in _interactables), or adjust item placement so they are not obscured.

## Out of scope

- New rooms or content

## Risk and rollback

Low. Targeted mesh and raycaster fixes. Rollback: revert the branch.

## Definition of done

- All child meshes of multi-mesh items (candle, spoon, any group) are removed from scene on pickup or use
- Items near walls and in corners are interactable
- All existing tests pass
- Lint: 0 errors
- PR open on branch `fix/sewc-mesh-and-corner-bugs`

## Pre-approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than main
- [x] Open a pull request
- [x] Comment on a pull request or issue
- [x] Create an issue
