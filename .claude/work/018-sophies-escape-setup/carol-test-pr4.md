# Carol: Test Report — PR 4

Sophie's Escape: The Witch's Castle.
Branch: fix/new-game-overlay-and-diagnostics. Commit: e14c3b0.
Test date: 2026-05-24. Auditor: Carol.

## Verdict

SIGN OFF WITH CONDITIONS.

Both fixes in PR 4 are functionally correct. All 17 unit tests pass. The New Game button game-breaking bug is resolved. The diagnostics panel redesign meets WCAG 2.2 AAA requirements for the toggle button. Four pre-existing conditional items from carol-retest-rework.md remain open; none are introduced by this PR. One new observation is noted as a non-blocking improvement.

## Scope and method

Static code audit of the two changed files in commit e14c3b0: `src/main.js` and `src/ui/overlay-controller.js`, plus the inline `<script>` block in `index.html`. Vitest test suite run against the branch. Regression suite checks S-01 through S-12 reviewed. WCAG 2.2 AAA criteria checked against the changed scope.

## Test area 1: New Game fix

### 1.1 closeOverlayById exported and imported

`overlay-controller.js` line 108 exports `closeOverlayById(overlayId)`:

    export function closeOverlayById(overlayId) {
      _close(overlayId);
    }

`main.js` line 115 imports it:

    import { installOverlayController, showMainMenu, closeOverlayById } from './ui/overlay-controller.js';

Result: PASS.

### 1.2 _startNewGame calls closeOverlayById

`main.js` line 278:

    closeOverlayById('overlay-main-menu');

This routes through the private `_close()` function in overlay-controller.js. No direct call to `mainMenu.close()` remains. Result: PASS.

### 1.3 _openStack cleared and OVERLAY_CLOSED dispatched

`_close()` in overlay-controller.js (lines 175 to 217) does the following in sequence:

1. Guards on `!dialog || !dialog.open`. If the menu is open, execution continues.
2. Calls `dialog.close()` (with fallback to `removeAttribute('open')`).
3. Finds and splices the overlay ID from `_openStack` (lines 193 to 194). The splice removes `'overlay-main-menu'` from the array.
4. Calls `returnEl.focus()` if a return element is stored (lines 197 to 200). For the main menu, the trigger was `null`, so `_returnFocusMap` holds `document.activeElement` at open time or null; the guard handles null correctly.
5. Updates HUD button `aria-expanded` if the overlay is in the `triggerMap`. The main menu is not in `triggerMap`; no spurious attribute write occurs.
6. Dispatches `{ type: 'OVERLAY_CLOSED', payload: { overlayName: 'overlay-main-menu' } }` (line 216).

Result: PASS. `_openStack` is cleared, `OVERLAY_CLOSED` is dispatched.

### 1.4 game-canvas.focus() called after HUD shown

`main.js` lines 280 to 294 (in order):

1. Line 280: `if (canvas) canvas.hidden = false;` — canvas made visible.
2. Line 283: `if (hud) hud.hidden = false;` — HUD shown.
3. Lines 286 to 290: touch joystick shown on touch devices.
4. Line 294: `document.getElementById('game-canvas')?.focus();`

The canvas has `tabindex="0"` in index.html (confirmed: line 70). The focus call fires after the canvas is unhidden. VoiceOver will land on an element it can perceive. Result: PASS.

### 1.5 Focus sequence correctness

The overlay controller's return-focus (from `_returnFocusMap`) fires first at step 4 of `_close()`, then main.js immediately calls `canvas.focus()`. The canvas focus overrides the return-focus. This is intentional: the menu had no prior focus state (it opened at page load with `null` trigger), so the canvas is the correct and only sensible landing point. Result: PASS.

### 1.6 S-12 regression check

S-12 (modal role, focus management, focus trap) is not touched by this PR. All five contracts established in carol-retest-rework.md (role, aria-modal, labelledby, focus-on-open, return-focus-on-close) remain intact. The focus trap subscribers (NEXT_FOCUSABLE, PREV_FOCUSABLE) at overlay-controller.js lines 44 to 45 are unchanged. Result: FULL CONDITIONAL PASS (unchanged from prior re-test; pending screen-reader evidence file).

## Test area 2: Diagnostics panel

### 2.1 Three elements created

The pre-module inline script (index.html lines 354 to 489) creates three elements:

- `diag-live`: div, `role="alert"`, `aria-live="assertive"`, `aria-atomic="true"`, visually hidden via CSS (position absolute, 1px by 1px, overflow hidden, clip, white-space nowrap). Created at lines 363 to 371.
- `diag-toggle`: button, `type="button"`, `aria-expanded="false"`, `aria-controls="boot-diagnostic"`, `aria-label="Diagnostics"`. Created at lines 375 to 386.
- `boot-diagnostic`: div, `role="log"`, `aria-label="Boot diagnostics"`, `display:none`. Created at lines 389 to 399.

All three elements are present. Result: PASS.

### 2.2 diag-toggle 44px minimum touch target

Inline style on diag-toggle (line 381 to 384):

    'position:fixed;top:0.5rem;left:0.5rem;z-index:10000;width:44px;height:44px;...'

Width and height are exactly 44px. This meets WCAG 2.5.5 Target Size Enhanced (AAA) (44px minimum). The token `--space-touch-target: 44px` in tokens.css is not used here (the inline script runs before CSS may load), but the value is identical. Result: PASS.

### 2.3 diag-toggle starts visible, panel starts hidden

`diag-toggle` is created with `display:block` in its inline style (line 384, `display:block` is the last property in the CSS string).

`boot-diagnostic` (the panel) is created with `display:none` in its inline style (line 397).

Result: toggle visible on creation, panel hidden on creation. PASS.

Note: `_hideDiagnostics()` in main.js hides the toggle on clean boot (see section 2.6 below). So the toggle is visible from page load until boot completes, then hidden if boot succeeds. This is the intended behaviour.

### 2.4 Click handler toggles aria-expanded and display

Handler at index.html lines 402 to 410:

    diagToggle.onclick = function () {
      if (diagEl.style.display === 'none') {
        diagEl.style.display = 'block';
        diagToggle.setAttribute('aria-expanded', 'true');
      } else {
        diagEl.style.display = 'none';
        diagToggle.setAttribute('aria-expanded', 'false');
      }
    };

When panel is hidden (`display:none`): clicking shows panel (`display:block`) and sets `aria-expanded="true"`.
When panel is visible (`display:block`): clicking hides panel (`display:none`) and sets `aria-expanded="false"`.

`aria-expanded` is correctly synchronised with the panel's visible state. Result: PASS.

### 2.5 Errors auto-expand the panel

The `showBootMessage(message, isError)` helper (lines 424 to 452) is called by `window.onerror`, `window.onunhandledrejection`, and the boot timeout. It does:

    diagToggle.style.display = 'block';    // ensures toggle is visible
    diagEl.style.display = 'block';        // expands panel
    diagToggle.setAttribute('aria-expanded', 'true');  // correct ARIA state

Error messages therefore auto-expand the panel without requiring the user to activate the toggle. Result: PASS.

The `_showBootError(message)` function in main.js (lines 37 to 73) mirrors this behaviour for module-layer errors: it sets `diagToggle.style.display = 'block'`, `diagToggle.setAttribute('aria-expanded', 'true')`, and `diagEl.style.display = 'block'`. Result: PASS.

### 2.6 _hideDiagnostics() hides toggle on clean boot

`main.js` lines 101 to 104:

    function _hideDiagnostics() {
      const diagToggle = document.getElementById('diag-toggle');
      if (diagToggle) diagToggle.style.display = 'none';
    }

Called at main.js line 201, after `window.__bootComplete = true` is set (line 196). On a clean boot, the toggle button disappears. No diagnostic UI is visible during normal gameplay. Result: PASS.

### 2.7 ES5 compatibility of inline script

The pre-module classic script block is bounded by lines 354 to 489. Requirement: no arrow functions, no template literals, no optional chaining, no nullish coalescing (comment at lines 350 to 353 states iOS Safari 14.5 safe).

Scan results:
- All variable declarations use `var`. No `let` or `const`. PASS.
- All functions use `function` declarations or `function` expressions assigned to variables. No arrow functions in this block. PASS.
- All string concatenation uses the `+` operator. No backtick template literals. PASS.
- No `?.` optional chaining. PASS.
- No `??` nullish coalescing. PASS.
- No destructuring assignments. PASS.

The arrow functions at lines 499 and 501 are inside `<script type="module">` (the service worker registration block) and are exempt from the ES5 constraint. Module scripts are never executed on browsers that do not support ES modules; those browsers fall back to the pre-module error path instead. Result: PASS.

## Test area 3: Vitest test suite

Command run: `npm --prefix /Users/timdixon/Code/AgentTeam/Inputs/sophies-escape-witchs-castle test -- --reporter=verbose`

Result: 17 tests passed, 0 failed, 1 test file.

All 17 tests in `src/core/reducer.test.js` pass:
- NEW_GAME returns fresh state with gameStatus playing.
- ENTER_ROOM updates currentRoomId and roomsVisited.
- ENTER_ROOM does not duplicate already-visited rooms.
- PICK_UP_ITEM adds item to inventory.
- PICK_UP_ITEM does not duplicate already-held item.
- SELECT_ITEM and DESELECT_ITEM toggle selection.
- REVEAL_HINT increments revealed count and resets witch timer.
- REVEAL_HINT caps at 3.
- OVERLAY_OPENED and OVERLAY_CLOSED manage openOverlays list.
- PAUSE sets gameStatus to paused.
- RESUME sets gameStatus to playing and removes pause from openOverlays.
- UPDATE_SETTINGS merges partial settings.
- Unknown action returns state unchanged.
- shouldFireWitchEncounter returns false when gameStatus is not playing.
- shouldFireWitchEncounter returns false when overlays are open.
- shouldFireWitchEncounter returns false when timer has not crossed threshold.
- shouldFireWitchEncounter returns true when timer exceeds threshold and no minimum interval block.

Duration: 327ms. Result: PASS.

## Test area 4: WCAG 2.2 AAA — diagnostics toggle button

### 4.1 aria-label

`diagToggle.setAttribute('aria-label', 'Diagnostics')` at line 380. The button has a descriptive accessible name. The button content is the Unicode character `ⓘ` (line 385); without an `aria-label` this would be announced as "circled Latin small letter i" by some screen readers. The explicit `aria-label` overrides that. Result: PASS.

### 4.2 Minimum touch target (2.5.5 Target Size Enhanced, AAA)

44px by 44px confirmed in section 2.2. Result: PASS.

### 4.3 Colour contrast

The toggle button uses background `#1a0000` and colour `#ffcccc`. Contrast calculation:

`#ffcccc` luminance: 0.2126 * (0.8^2.2) + 0.7152 * (0.6^2.2) + 0.0722 * (0.6^2.2) = approximately 0.5910.
`#1a0000` luminance: 0.2126 * (0.1019^2.2) + 0.7152 * (0^2.2) + 0.0722 * (0^2.2) = approximately 0.0076.

Contrast ratio: (0.5910 + 0.05) / (0.0076 + 0.05) = 0.6410 / 0.0576 = 11.13:1.

This exceeds the 7:1 AAA normal text threshold. Result: PASS.

The border is `#ff6666` on `#1a0000`. `#ff6666` luminance: approximately 0.2126*(1.0) + 0.7152*(0.1329) + 0.0722*(0.1329) = 0.2126 + 0.0951 + 0.0096 = 0.3173. Contrast against `#1a0000`: (0.3173 + 0.05) / (0.0076 + 0.05) = 0.3673 / 0.0576 = 6.38:1. This exceeds the 3:1 non-text contrast threshold (WCAG 1.4.11) for the button border. The border serves as a visual indicator of the button boundary. Result: PASS.

### 4.4 Keyboard focusable

`diagToggle` is a `button` element with `type="button"`. Native button elements are in the tab order by default without needing `tabindex`. Result: PASS.

### 4.5 aria-expanded on toggle button

`aria-expanded="false"` is set at creation (line 378). The click handler updates it correctly (section 2.4). The `aria-controls="boot-diagnostic"` attribute (line 379) correctly references the panel ID. Result: PASS.

### 4.6 S-08 regression check (assertive live region)

The `diag-live` element carries both `role="alert"` and `aria-live="assertive"` (lines 365 to 366). Under S-08, assertive live regions are appropriate only for time-critical errors. Boot errors and module load failures are genuine time-critical errors — the user must know the game has failed to load. The `role="alert"` co-presence confirms the intent is correct per the S-08 criterion. Result: PASS.

## Test area 5: Accessibility regression suite

Checks performed against the static front-end suite entries applicable to this PR:

S-01 (filtered items absent from accessibility tree): Not applicable to this PR. No filter functionality changed.

S-02 (keyboard focus to aria-hidden element): Not applicable. No aria-hidden targets created in this PR.

S-03 (ARIA grid row wrappers): Not applicable. No grid structure changed.

S-04 (opacity-derived text colours): No `opacity` property found in any CSS file in the project (confirmed by grep). PASS.

S-05 (category colour not updated in revision): Not applicable. No colour scheme revision in this PR.

S-06 (ESLint glob coverage): Not in scope for this PR. No ESLint configuration changes.

S-07 (emoji in live regions): No emoji in any live region content added or changed in this PR. The `diag-live` region receives plain text strings only. PASS.

S-08 (assertive live region for non-urgent feedback): Assessed in section 4.6. PASS.

S-09 (main landmark): `<main id="game-main">` confirmed at index.html line 60. Unchanged from prior re-test. PASS.

S-10 (focus ring contrast): Focus ring tokens unchanged. Amber (#ffa040) on bg-panel (#1e1b16) at 8.46:1 confirmed in prior baseline audit. PASS.

S-11 (input border contrast): No `input`, `select`, `textarea`, or `fieldset` elements exist in this project. Not applicable.

S-12 (modal role, focus, trap): Unchanged from prior re-test. FULL CONDITIONAL PASS (pending screen-reader evidence).

## Observations (non-blocking)

### OB-1: diag-toggle aria-label is generic

The `aria-label` "Diagnostics" is clear but brief. When the diagnostics panel is in an error state, the label does not communicate urgency. This is mitigated by the `diag-live` region, which announces errors assertively. Recommended improvement: on error, update `aria-label` to "Diagnostics — errors detected" alongside the auto-expand. Not a WCAG violation; the current label meets 4.1.2. No rework required.

### OB-2: Multiple cancel listeners on repeated open/close cycles

Carried forward from carol-retest-rework.md. The `dialog.addEventListener('cancel', ...)` call in `_open()` (overlay-controller.js line 164) adds a new listener each time a dialog is opened. This is harmless in terms of behaviour (multiple `preventDefault()` calls on the same event have no cumulative effect), but the listener count grows unboundedly over a session. This was noted in the prior re-test and is not a new finding. Minor code quality concern only.

### OB-3: Pre-existing conditional items remain open

The following four items from carol-retest-rework.md remain open. They are not introduced or worsened by PR 4:

1. Screen-reader evidence files (VoiceOver and JAWS manual passes) are not yet on file. Required before v0.1 ships.
2. Exception SE-001 (3D navigation, criterion 2.1.3) does not yet have Tim's approval. Required before v0.1 ships.
3. Exception SE-002 (3D decorative colours) does not yet have Tim's approval. Required before v0.1 ships.
4. Loading progress bar `aria-valuenow` is static at 0. JavaScript updates needed during loading. Required before v0.1 ships.

The two recommended improvements (GoatCounter new-tab advisory text; dual-buffer hint announcer pattern) also remain open at non-blocking status.

## Summary

| Area | Result |
|------|--------|
| Fix 1: closeOverlayById exported and used | PASS |
| Fix 1: _openStack cleared and OVERLAY_CLOSED dispatched | PASS |
| Fix 1: game-canvas.focus() after HUD shown | PASS |
| Fix 2: Three diagnostic elements created | PASS |
| Fix 2: diag-toggle 44px touch target | PASS |
| Fix 2: diag-toggle visible, panel hidden on create | PASS |
| Fix 2: Toggle handler synchronises aria-expanded | PASS |
| Fix 2: Errors auto-expand panel | PASS |
| Fix 2: _hideDiagnostics on clean boot | PASS |
| Fix 2: ES5 compatibility in inline script | PASS |
| Vitest: 17 tests | PASS (17/17) |
| WCAG 2.2 AAA: toggle aria-label | PASS |
| WCAG 2.2 AAA: touch target 44px | PASS |
| WCAG 2.2 AAA: colour contrast (11.13:1) | PASS |
| WCAG 2.2 AAA: keyboard focusable | PASS |
| WCAG 2.2 AAA: aria-expanded correct | PASS |
| S-08 assertive live region | PASS |
| S-09 main landmark | PASS |
| S-10 focus ring contrast | PASS |
| S-12 modal role, focus, trap | FULL CONDITIONAL PASS |
| New issues introduced by PR 4 | NONE |

### Conditions for merge

The conditional status reflects the four pre-existing items from carol-retest-rework.md, not any new finding in this PR. PR 4 is ready to merge into the main branch subject to those conditions being addressed before the v0.1 milestone ships. The PR itself introduces no new blockers and resolves two game-breaking or degraded-experience issues.

Screen-reader evidence gate: a live VoiceOver pass and a live JAWS pass are required before the v0.1 milestone ships, per CLAUDE.md and docs/patterns/screen-reader-evidence.md. This requirement applies to the cumulative codebase, not specifically to PR 4's changes.
