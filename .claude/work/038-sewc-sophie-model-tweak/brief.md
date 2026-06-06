# Work folder 038: SEWC Sophie model — feet on look-down, hands only when forward

**Status:** done
**Triage type:** Bug fix (type 6)
**Opened:** 2026-06-06

## Summary

Sophie model was too prominent — the dress filled the bottom of the screen at all times. Tim wanted: hands barely visible at lower screen edges when looking forward; feet visible only when looking down.

## Fix

Split the model into two groups with different parents:

**handsGroup** (camera-parented): left arm + right arm at `x = ±0.35, y = -0.25, z = -0.4`. Always faintly visible at screen corners regardless of camera pitch.

**bodyGroup** (world-parented): body, legs, shoes, hair. Placed in scene space, position and yaw synced to player each frame. Camera pitch not applied, so body only comes into view when pitching down ~60°+.

## Out of scope

- Full skeletal animation
- Third-person camera

## Risk and rollback

Low-medium. Rollback: revert PR #38.

## Definition of done

- Default view: no dress visible, only faint arm geometry at corners ✓
- Look-down ~60°+: body geometry visible at lower-centre ✓
- 195 tests pass ✓
- Lint: 0 errors ✓
- PR #38 merged ✓

## Pre-approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than main
- [x] Open a pull request
- [x] Comment on a pull request or issue
- [x] Create an issue
