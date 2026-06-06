# Work folder 039: SEWC Sophie shoe position above floor

**Status:** done
**Triage type:** Bug fix (type 6)
**Opened:** 2026-06-06

## Problem

Sophie's shoes were at `y = -1.85` in the bodyGroup (world y = -0.15, 15 cm below floor). Occluded when looking down.

## Fix

Raised shoe y-positions in `src/render/player-model.js` from `-1.85` to `-1.62` (world y = 0.08, 8 cm above floor). Two lines changed.

## Definition of done

- White shoe geometry visible above floor when looking down ✓
- 195 tests pass ✓
- Lint: 0 errors ✓
- PR #39 merged ✓

## Pre-approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than main
- [x] Open a pull request
- [x] Comment on a pull request or issue
- [x] Create an issue
