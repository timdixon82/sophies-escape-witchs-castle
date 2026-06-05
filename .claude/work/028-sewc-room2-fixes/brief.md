# Work folder 028: SEWC room 2 gameplay and UX fixes

**Status:** done
**Triage type:** Small feature / Bug fix (types 6 and 7)
**Opened:** 2026-06-05

## Summary

Tim found five issues while playing the Stone Corridor (room 2). Fix all five on a single branch.

## Issues

### Issue 1: Objects have no collision — player walks through them (bug fix)

Objects in room 2 (and likely all rooms) have no collision volumes. The player walks through them freely. Objects should block player movement. This is the most architecturally significant change: a collision system needs to be added to the first-person-controller, using the existing mesh data or new bounding boxes.

Sean must report on how complex this is before building it, and flag if the approach needs Jacob's architectural review.

### Issue 2: Object 3D graphics are not distinctive (small feature)

Items do not look clearly like the things they represent. The visual overhaul in v0.5.0 added shapes but Tim reports they still do not feel right. Sean should examine the current item mesh code and improve the geometry so each item is more immediately recognisable. The bent spoon, candle stub, moonflower petal, key, and other items each need a shape that reads clearly.

### Issue 3: Vertical look range is too narrow (bug fix)

The player can only look a limited distance up and down. Tim needs to look almost at their feet and directly above. The pitch clamp in the first-person-controller needs to be widened to roughly -85° to +85° (or close to vertical in both directions).

### Issue 4: Text labels on objects are on by default (small feature)

Item labels (the text overlays on 3D objects) are visible by default. They should be off by default. A toggle must be added to the settings panel so Tim can turn them on when needed. The default state (off) must persist across sessions via localStorage.

### Issue 5: Two doors in room 2 both lead back to the dungeon (bug fix)

Tim navigated through two different doors in the Stone Corridor and both returned him to the Dungeon Cell. The door-to-room mapping in room-data.js or the door navigation logic in interaction-handler.js needs to be checked and corrected. Each door in a room should lead to a distinct destination.

## Out of scope

- New rooms or game content
- Audio or music
- Any changes to the puzzle logic beyond door routing

## Risk and rollback

Medium risk on collision detection (new system touching movement code). Low risk on the remaining four. Rollback: revert the branch commit.

## Definition of done

- Player cannot walk through room objects
- Each item has a clearly recognisable 3D shape
- Player can look from almost directly down to directly up
- Item text labels are off by default; a settings toggle turns them on; preference persists in localStorage
- Each door in room 2 leads to a distinct, correct destination
- All 33 existing unit tests pass
- Lint: 0 errors
- PR open on branch `fix/sewc-room2-fixes`

## Pre-approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than main
- [x] Open a pull request
- [x] Comment on a pull request or issue
- [x] Create an issue
