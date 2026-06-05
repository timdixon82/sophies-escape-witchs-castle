# Work folder 030: SEWC door positions and entry spawn

**Status:** active
**Triage type:** Bug fix (type 6)
**Opened:** 2026-06-05

## Summary

Two door-related bugs: side doors in the Stone Corridor float in the middle of the room instead of sitting against the walls; and the player always spawns at room centre regardless of which door they came through.

## Issue 1: Stone Corridor side doors floating, not against walls

The Stone Corridor is W=4, H=3.5, D=14. Its two end doors (Dungeon Cell at z=-6.9, Castle Gate at z=6.9) are correctly placed against the end walls. The six side doors are NOT against walls — they currently have x = ±1.5 which is in the middle of the 4-unit-wide corridor.

Current positions (wrong):
- Kitchen:       [-1.5, 0.9, -2.0]
- Library:       [ 1.5, 0.9, -2.0]
- Great Hall:    [-1.5, 0.9,  2.0]
- Chapel:        [ 1.5, 0.9,  2.0]
- Armoury:       [-1.5, 0.9,  5.0]
- Tower Room:    [ 1.5, 0.9,  5.0]
- Witch's Study: [-1.5, 0.9, -5.5]

Correct positions — place against side walls (x = ±W/2 = ±2), same Z:
- Kitchen:       [-2.0, 0.9, -2.0]  — left wall, facing +X into room
- Library:       [ 2.0, 0.9, -2.0]  — right wall, facing -X into room
- Great Hall:    [-2.0, 0.9,  2.0]  — left wall, facing +X
- Chapel:        [ 2.0, 0.9,  2.0]  — right wall, facing -X
- Armoury:       [-2.0, 0.9,  5.0]  — left wall, facing +X
- Tower Room:    [ 2.0, 0.9,  5.0]  — right wall, facing -X
- Witch's Study: [-2.0, 0.9, -5.5]  — left wall, facing +X

Also check _makeDoor — it needs to support a rotation parameter so side-wall doors face the correct direction (±X axis) rather than always facing -Z. End-wall doors face ±Z (current default is fine for those). Read the _makeDoor function before changing positions to understand whether rotation is already supported or needs adding.

## Issue 2: Player spawns at room centre, not near entry door

`resetCameraToRoomEntry()` in first-person-controller.js always places the player at (0, 1.7, 0) facing +Z. The player should spawn near the door they entered through, facing into the room (back to the door).

The fix: pass the entry door position into `resetCameraToRoomEntry(entryPos, entryFacing)`. Room-manager.js calls `resetCameraToRoomEntry()` from `enterRoom()` — update that call to pass the door position.

Each room needs to know where its entry door is relative to its own coordinate space:
- Side rooms (Kitchen, Library, etc.): their exit door back to the Stone Corridor is at [0, 1.7, D/2 - 0.5], facing -Z (into the room from the door end).
- Stone Corridor: entry from Dungeon Cell is at z = -D/2 + 0.5, facing +Z. Entry from a side room is near x = ±W/2, at the z position of that door, facing ∓X.
- Dungeon Cell: entry from Stone Corridor is at [0, 1.7, D/2 - 0.5], facing -Z.

The simplest correct approach: in `enterRoom(roomId, fromDoorId)`, derive the spawn point from the door mesh position in the room being entered. The door mesh is already known (it is the door with target matching the room we came from). Spawn 0.5 units in front of the door (away from the wall), facing away from the door.

If `fromDoorId` is not provided (e.g. on new game), keep the current default (room centre, facing +Z).

## Out of scope

- Any new rooms or content
- Any puzzle logic changes

## Risk and rollback

Low risk — geometry position changes only. Rollback: revert the branch.

## Definition of done

- All Stone Corridor side doors sit flush against the side walls and face into the corridor
- Player spawns near the door they entered through, facing into the new room
- Player spawns at room centre on new game (no regression)
- All 78 existing unit tests pass
- Lint: 0 errors
- PR open on branch `fix/sewc-door-positions`

## Pre-approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than main
- [x] Open a pull request
- [x] Comment on a pull request or issue
- [x] Create an issue
