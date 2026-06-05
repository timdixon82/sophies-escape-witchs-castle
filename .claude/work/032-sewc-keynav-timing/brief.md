# Work folder 032: SEWC keyboard nav list timing bug

**Status:** done
**Triage type:** Bug fix (type 6)
**Opened:** 2026-06-05

## Summary

Carol found a pre-existing high-priority bug: after a door transition the interactive objects list shows the departing room's items, not the arriving room's items. The root cause is a timing issue — `_onStateChange` calls `refreshInteractionList` synchronously before `enterRoom` has populated `_interactables` for the new room.

## Fix

In `src/render/interaction-handler.js` (and/or `src/main.js`), move the `refreshInteractionList` call so it fires after `enterRoom` has finished building the new room's interactables. The fix is to call `refreshInteractionList` inside `_handleDoor` after `enterRoom` returns, or move the call to the end of `enterRoom` itself.

## Out of scope

- Any other gameplay changes

## Risk and rollback

Low. Single call-order change. Rollback: revert the branch.

## Definition of done

- After walking through a door, the interactive objects list shows the new room's items immediately
- All existing tests pass
- Lint: 0 errors
- PR open on branch `fix/sewc-keynav-timing`

## Pre-approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than main
- [x] Open a pull request
- [x] Comment on a pull request or issue
- [x] Create an issue
