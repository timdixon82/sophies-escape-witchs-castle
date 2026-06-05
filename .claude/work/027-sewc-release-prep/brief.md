# Work folder 027: SEWC v0.5.0 release prep

**Status:** done
**Triage type:** Bug fix (type 6)
**Opened:** 2026-06-05

## Summary

Carol's pre-release test pass found two blocking items that must be resolved before v0.5.0 can ship. Both are small, low-risk fixes.

## Blocking items

### Item 1: Stylelint errors in base.css

File: `src/ui/styles/base.css`

- Line 48: `border-radius: 0 0 6px 0;` — trailing zero is redundant. Correct form: `border-radius: 0 0 6px;`
- Line 52: `.skip-link:focus` rule has no empty line before it — `rule-empty-line-before` violation

Both are auto-fixable with `stylelint --fix`.

### Item 2: Pa11y false-positive NaN contrast in pa11y.json

Pa11y reports `NaN:1` contrast on two `aria-hidden="true"` canvas overlay elements:
- `#room-label-hud`
- The 3D item label overlay (anonymous div)

Pa11y cannot compute contrast over semi-transparent backgrounds on top of a canvas. Actual contrast is approximately 16.74:1, which passes WCAG 1.4.6 AAA (7:1 threshold). Both elements are `aria-hidden` and excluded from the accessibility tree. Both are covered by exception SE-002.

Ignore entries must be added to `pa11y.json` and documented in `docs/exceptions/SE-002-3d-geometry-colours.md`.

## Out of scope

- Any gameplay changes
- Any visual changes
- Any other CSS or accessibility work beyond these two items

## Risk and rollback

Low risk. The CSS change is cosmetic (removes a redundant value with no computed effect). The pa11y.json change adds false-positive ignore entries that are already documented under SE-002. Rollback: revert the commit on the branch.

## Definition of done

- `npm run lint` exits 0 with no stylelint errors
- `pa11y.json` has ignore entries for `#room-label-hud` and the 3D item label overlay, with comments citing SE-002
- `docs/exceptions/SE-002-3d-geometry-colours.md` updated to note the Pa11y NaN false-positive and the ignore entries
- Carol re-tests lint and Pa11y and signs off
- PR open on branch `fix/sewc-release-prep`

## Pre-approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than main
- [x] Open a pull request
- [x] Comment on a pull request or issue
- [x] Create an issue
