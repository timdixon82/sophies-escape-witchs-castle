# Work folder 031: SEWC popup centering and scrollbars

**Status:** done
**Triage type:** Bug fix (type 6)
**Opened:** 2026-06-05

## Summary

All overlay/popup dialogs (settings, inventory, pause, help, hint) should be centred on screen. When the content exceeds the visible area (as the settings panel now does with multiple controls), the dialog body should scroll rather than overflow off-screen.

## Issues

### Issue 1: Popups not centred on screen

Dialogs should be horizontally and vertically centred in the viewport. Use CSS flexbox or the native `<dialog>` centring behaviour (`margin: auto` on a `<dialog>` element). Check all overlay dialogs in `src/ui/styles/overlays.css` and `index.html`.

### Issue 2: No scrollbar when content overflows

The settings panel in particular now has multiple controls (item labels, brightness, volume, speech, captions) and can overflow on smaller screens or when the viewport is short. Add `overflow-y: auto` to the dialog body/content area so a scrollbar appears when needed. Set a `max-height` (e.g. 80vh) so the dialog never taller than the viewport.

Apply this to all overlay dialogs consistently, not just settings.

## Out of scope

- Any gameplay changes
- Redesigning the dialog content

## Risk and rollback

Low risk — CSS only. Rollback: revert the branch.

## Definition of done

- All dialogs are centred horizontally and vertically on screen
- All dialogs cap at max-height 80vh with a scrollbar when content overflows
- Existing 78+ unit tests pass (no JS changes expected)
- Lint: 0 errors
- PR open on branch `fix/sewc-popup-layout`

## Pre-approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than main
- [x] Open a pull request
- [x] Comment on a pull request or issue
- [x] Create an issue
