# Carol Test Report: PR 5 — Loading Screen aria-hidden Fix

**Date:** 2026-05-24
**PR:** https://github.com/timdixon82/sophies-escape-witchs-castle/pull/5
**Branch:** fix/loading-screen-aria-hidden
**Commit tested:** c2d5628
**Tester:** Carol
**Verdict:** PASS

## Summary

All seven checks pass. No blocking items. PR 5 is clear for merge subject to Sonja's merge gate and Tim's approval.

## Functional tests

### Check 1: `_hideLoadingScreen()` sets both `hidden = true` and `aria-hidden="true"`

Pass. At `src/main.js` lines 325-331, the function reads:

```
function _hideLoadingScreen() {
  const screen = document.getElementById('loading-screen');
  if (screen) {
    screen.hidden = true;
    screen.setAttribute('aria-hidden', 'true');
  }
}
```

Both attributes are set in the same guarded block.

### Check 2: `_showBootError()` calls `removeAttribute('aria-hidden')`

Pass. At `src/main.js` lines 37-43:

```
if (loadingScreen) {
  loadingScreen.hidden = false;
  loadingScreen.removeAttribute('aria-hidden');
}
```

The attribute is removed before the error content is made visible, so screen readers can read the error.

### Check 3: `canvas.focus()` is inside `setTimeout(function(){...}, 0)`

Pass. At `src/main.js` lines 300-302:

```
setTimeout(function () {
  document.getElementById('game-canvas')?.focus();
}, 0);
```

The call is deferred by one task, which allows the browser to complete layout before focus is applied.

### Check 4: No other call sites for `_hideLoadingScreen()` exist

Pass. A grep of `src/main.js` for `_hideLoadingScreen` returns exactly two lines: the function definition at line 325 and a single call site at line 192 inside `boot()`. No other callers exist.

### Check 5: Loading screen has `role="status"` and `aria-live="polite"` in `index.html`

Pass. At `index.html` lines 39-44:

```
id="loading-screen"
role="status"
aria-live="polite"
aria-label="Loading Sophie's Escape"
```

Both attributes are present on the element. This confirms the live region is properly declared.

## Automated tests

### Check 6: `npm test` — all 17 tests pass

Pass. Vitest ran the full suite in `src/core/reducer.test.js`:

- Test files: 1 passed
- Tests: 17 passed
- Duration: 250 ms

No failures or skipped tests.

## Accessibility checks (WCAG 2.2 AAA)

### Check 7: `aria-hidden` on a `role="status"` element is valid and correct

Pass. The pattern is correct.

The Accessible Rich Internet Applications (ARIA) specification permits `aria-hidden="true"` on any element, including those with `role="status"`. When `aria-hidden="true"` is set, the element and all its descendants are removed from the accessibility tree. This overrides the live region: VoiceOver and JAWS will not announce any content changes to the element while it is hidden, and will not re-announce stale loading text when the main menu dialog closes.

The complementary use of `hidden = true` (the HTML `hidden` attribute) ensures the element is also removed from layout and from tab order, satisfying WCAG 2.2 Success Criterion 1.3.1 (Info and Relationships) and SC 4.1.2 (Name, Role, Value) at Level A, and contributes to the AAA conformance target by ensuring the hidden state is communicated at every level — visual, DOM, and accessibility tree.

Removing `aria-hidden` in `_showBootError()` before re-showing the element restores accessibility tree membership so the error text is readable. This is the correct reversal sequence.

The `setTimeout(0)` deferral for `canvas.focus()` is an established browser pattern for ensuring focus moves after layout is complete. It does not affect the accessibility tree state of any element.

No WCAG issues introduced by this PR.

## Notes

The inline `onerror` handler in `index.html` at line 493 shows the loading screen by setting `loadingScreen.hidden = false` but does not call `removeAttribute('aria-hidden')`. This is a pre-existing gap outside the scope of PR 5, which touches `src/main.js` only. I am flagging it as an observation for the backlog, not as a blocker for this PR, because it fires only on a catastrophic module load failure where the JS module environment itself is absent and `_showBootError` cannot run.

## Verdict

PASS. All seven checks pass. The PR is ready to merge.
