# Work folder 037: SEWC small fixes — Pa11y standard, HUD overlap, favicon

**Status:** done
**Triage type:** Bug fix (type 6)
**Opened:** 2026-06-06

## Fix 1: pa11y.json missing WCAG2AAA standard

Added `"standard": "WCAG2AAA"` to `pa11y.json`. Previously Pa11y defaulted to WCAG 2.1 AA.

## Fix 2: HUD button overlap — Settings obscures Help (WCAG 2.5.8)

Settings button made explicit at `top: 0; left: 16px`. Help button moved from `top: 16px` to `top: 56px` (44px button + 12px gap). Each button now has 44px safe click area.

## Fix 3: favicon.svg missing from public/

Created `public/favicon.svg` — 32×32 witch's-hat silhouette (black hat, purple band). Fixes 404 on every page load.

## Out of scope

- New gameplay features
- Visual redesign

## Risk and rollback

Low. Config, CSS, and a new static asset. Rollback: revert the branch.

## Definition of done

- `pa11y.json` contains `"standard": "WCAG2AAA"` ✓
- Settings and Help HUD buttons do not overlap ✓
- `public/favicon.svg` exists and loads without 404 ✓
- All existing tests pass ✓
- Lint: 0 errors ✓
- PR #37 merged ✓

## Pre-approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than main
- [x] Open a pull request
- [x] Comment on a pull request or issue
- [x] Create an issue
