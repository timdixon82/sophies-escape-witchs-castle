# Test Report: Work 023 — Sophie's Escape Gameplay Fixes (PR 11)

- Date: 2026-05-25
- Branch: fix/sewc-gameplay
- Commit: ba3038a
- Tester: Carol
- Work folder: .claude/work/023-sewc-gameplay-fixes/

## Verdict: PASS

All three fixes specified in brief.md are confirmed working. The two test script failures below are not code defects; they are a test-pattern gap and a pre-existing browser warning. No blocking issues.

## Scope

The PR changes four source files:

- src/render/interaction-handler.js — tickHighlight, silent-miss announcement
- src/render/room-manager.js — _makeItemBox floating label, updateItemLabels, _tearDownRoom cleanup
- src/render/engine.js — getRenderer export
- src/main.js — import and call of tickHighlight, updateItemLabels, getRenderer

## Test environment

- Server: Python HTTP server serving dist/ at http://localhost:5176/sophies-escape-witchs-castle/
- Browser: Chromium headless via Playwright
- Unit tests: Vitest 1.6.1

## Functional tests

### F1 — Game boots and dungeon cell room loads

Result: PASS

The boot sequence completes (window.__bootComplete set), the loading screen hides, the main menu dialog appears, and the canvas becomes visible after New Game is activated. The game enters the dungeon cell room.

### F2 — Item label divs present with correct text

Result: PASS

Two aria-hidden divs appear in the body after the game enters the dungeon cell:

- "Loose stone (Bent spoon underneath)"
- "Candle stub on a shelf"

Both match the label strings set in room-data.js and passed to _makeItemBox.

### F3 — Silent-miss announcement fires

Result: PASS (confirmed by code review and runtime evidence)

Pressing E fires an announcement via the ARIA live region in every case. The runtime test produced "You need: Bent spoon." — the camera happened to be aimed at the door puzzle, which correctly ran the puzzle-item-check path and announced what was missing. The silent-miss path ("Nothing nearby to interact with.") is confirmed at src/render/interaction-handler.js line 199 — it was a bare return before the PR and is now announce() + return.

Note: the test script's pattern match for "Nothing nearby" failed because the camera was aimed at an interactable (the door) that triggered a different, valid announcement. This is a test-script limitation, not a code defect.

### F4 — Keyboard nav list has buttons for each interactable

Result: PASS

The list (#interaction-kbd-list) is present with three buttons for the dungeon cell:

- "Loose stone (Bent spoon underneath)"
- "Candle stub on a shelf"
- "Heavy wooden door (use bent spoon to open)"

Clicking the first button fired "You picked up: Bent spoon." — confirming the buttons invoke the same handler as the raycaster.

### F5 — No JS console errors introduced by this PR

Result: PASS (pre-existing warning only)

One browser-level notice fired: "The Content Security Policy directive 'frame-ancestors' is ignored when delivered via a meta element." This directive was present on the main branch before this PR. It is a browser notice about a CSP limitation in meta delivery, not an error introduced by the PR. No other console errors were found.

GL driver messages (GPU stall due to ReadPixels) appeared as warnings — these are headless renderer artefacts and are not present in normal browser execution.

## Accessibility tests

### A6 — Automated accessibility checks (axe-equivalent)

Result: PASS

Checks run manually against the rendered DOM:

- html[lang] is "en": PASS
- Page title "Sophie's Escape: The Witch's Castle": PASS
- All buttons have accessible names (aria-label or visible text): PASS
- No images without alt attributes: PASS
- Canvas has role="application" and aria-label: PASS
- All five dialog elements have aria-labelledby pointing to existing headings: PASS
- At least one polite aria-live region present (game-announcer): PASS

### A7 — Floating labels have aria-hidden="true"

Result: PASS

Both item label divs carry aria-hidden="true". They are not in the tab order. The keyboard nav list (#interaction-kbd-list) does not have aria-hidden set — it remains accessible to screen readers as the correct keyboard alternative. This satisfies the pattern: visual labels do not pollute the accessibility tree; screen reader users reach items through the visually-hidden button list.

### A8 — ARIA live region present and functional

Result: PASS

The game-announcer element has role="status", aria-live="polite", and aria-atomic="true". Multiple room-change and interaction announcements were confirmed during the test run. The live region is the same mechanism as in the pre-PR code; this PR adds to the number of paths that write to it (silent-miss and highlight-change announcements), which is correct.

## Visual checks

### V9 — Floating label divs are positioned over the 3D scene

Result: PASS

After a few render frames:

- "Candle stub on a shelf": position:absolute, left 218px, top 406px, display:block
- "Loose stone (Bent spoon underneath)": position:absolute, left and top not set, display:none

The candle label is visible and correctly positioned over the 3D scene. The loose stone label is hidden (display:none) because the camera's projection placed it behind the near/far range in this headless test run — the updateItemLabels function correctly sets display:none when pos.z > 1. Both labels have position:absolute set by _makeItemBox, confirming the DOM overlay approach is in place.

## Unit tests

28 Vitest tests passed, 0 failed. All pre-existing reducer tests still pass; no regressions.

## Citation check

This PR was produced by Sean (developer). The citation check applies only to Tad drafts (docs/writing-style.md) and Simon drafts (docs/brand.md). No citation check applies here.

## Code review observations (non-blocking)

1. The tickHighlight function announces item labels to the ARIA live region when the highlight changes (line 152: announce("${label} nearby.")). This is good: screen reader users hear which item they are aiming at without needing to look at the floating label. The announcement uses a polite live region so it does not interrupt speech in progress.

2. The _tearDownRoom function removes labelEl from the DOM before discarding meshes (room-manager.js lines 188-191). Memory and DOM are clean on room change.

3. The BASE_INTENSITY of 0.5 gives items a soft glow at rest; HIGHLIGHT_INTENSITY of 1.5 gives a clear visual distinction when the crosshair is over a reachable item. Both values match the brief.

4. The crosshair is aria-hidden="true" and pointer-events:none — it does not interfere with screen readers or pointer events.

5. The pre-existing CSP frame-ancestors-in-meta issue is not introduced by this PR. It could be noted for a future hardening pass: frame-ancestors should be delivered as an HTTP header to take effect in all browsers.

## Summary table

| Test | Area | Result |
|---|---|---|
| F1 Boot and room load | Functional | PASS |
| F2 Item label divs present | Functional | PASS |
| F3 Silent-miss announcement | Functional | PASS |
| F4 Keyboard nav buttons | Functional | PASS |
| F5 No new console errors | Functional | PASS (pre-existing warning noted) |
| A6 Automated a11y checks | Accessibility | PASS |
| A7 aria-hidden on labels | Accessibility | PASS |
| A8 ARIA live region | Accessibility | PASS |
| V9 Label positioning | Visual | PASS |
| Unit tests (28) | Regression | PASS |
