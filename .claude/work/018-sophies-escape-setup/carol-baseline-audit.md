# Carol: Baseline WCAG 2.2 AAA Accessibility Audit

Sophie's Escape: The Witch's Castle, v0.1 scaffold, PR 2.

Audit date: 2026-05-24. Branch: feat/v0.1-scaffold. Auditor: Carol.

## Summary verdict

Overall: CONDITIONAL PASS with four rework items.

The scaffold is well-built. All contrast ratios are verified as correct. The focus ring, dialog roles, and reduced-motion support are properly implemented. Four issues require rework before the AAA gate is met:

1. **Focus trap not implemented** (Level A, 2.1.2): the overlay controller claims Tab-wrapping but does not subscribe to the NEXT_FOCUSABLE or PREV_FOCUSABLE intents. The native dialog focus trap covers showModal() paths but not the attribute-open fallback. This is a functional gap.
2. **aria-expanded missing on hint and pause HUD buttons in HTML** (Level A, 4.1.2): only the inventory button has the initial aria-expanded="false" attribute. Hint and pause buttons have aria-controls but no aria-expanded, so their initial state is undeclared to screen readers.
3. **Inventory item buttons lack role="listitem"** (Level A, 1.3.1 / 4.1.2): the grid container has role="list" but dynamically created item buttons are appended directly as button elements, not wrapped in a role="listitem" container. The list structure is incomplete.
4. **Two H1 elements in the document** (Level A, 1.3.1): the loading screen and the main menu dialog each use an H1. When both are in the DOM simultaneously, two H1s exist, which breaks heading hierarchy for screen reader navigation.

Two further observations are not rework items at this stage but are flagged for attention:

- The Escape key handler on the keyboard bridge correctly emits CLOSE_OVERLAY, which the overlay controller handles. However, the native dialog cancel event (fired by the browser's own Escape key handling for dialogs) is not suppressed or intercepted. On browsers where showModal() is used, the browser may fire the cancel event independently. This needs a preventDefaulted cancel listener on each dialog element, or it may close a dialog before the overlay controller can record the closure in its open stack, producing a state desync.
- The screen-reader evidence gate requires a manual VoiceOver and JAWS pass before any release. No evidence file exists yet. That is expected at scaffold stage and is not a blocker now, but it must be completed before the v0.1 milestone ships.

## Scope and method

This is a static code audit of the files named in the brief. It covers: index.html, overlay-controller.js, inventory-panel.js, hint-panel.js, tokens.css, base.css, and overlays.css. Contrast ratios were recalculated independently from the hex values in tokens.css using the WCAG relative luminance formula. No live browser or automated tool run (axe-core, Pa11y) was possible against the scaffold in isolation. The S-series regression suite status is reviewed from PR 2's own claims plus this static analysis.

## Section 1: Colour contrast

All claimed contrast ratios were independently recalculated. All pass. Minor rounding differences (one decimal place) are within tolerance.

Primary text on panel background: 14.34:1. Claimed 14.34:1. Confirmed AAA pass.

Primary text on raised panel: 12.89:1. Claimed 12.89:1. Confirmed AAA pass.

Primary text on canvas: 16.55:1. Claimed 16.54:1. Rounding delta of 0.01. Confirmed AAA pass.

Secondary text on panel: 9.31:1. Claimed 9.31:1. Confirmed AAA pass.

Secondary text on raised panel: 8.36:1. Claimed 8.39:1. Rounding delta of 0.03. Confirmed AAA pass.

Amber on panel: 8.46:1. Claimed 8.46:1. Confirmed AAA pass for normal text and focus indicator.

Amber on raised panel: 7.61:1. Claimed 7.61:1. Confirmed AAA pass.

Amber on canvas: 9.76:1. Claimed 9.66:1. Rounding delta of 0.10. Confirmed AAA pass.

Black on amber: 10.35:1. Claimed 10.35:1. Confirmed AAA pass.

Purple on panel: 8.00:1. Claimed 8.00:1. Confirmed AAA pass.

Purple on raised panel: 7.19:1. Claimed 7.19:1. Confirmed AAA pass.

Green on panel: 9.65:1. Claimed 9.65:1. Confirmed AAA pass.

Green on raised panel: 8.68:1. Claimed 8.67:1. Rounding delta of 0.01. Confirmed AAA pass.

Error status on panel: 7.07:1. Claimed 7.07:1. Confirmed AAA pass. The constraint that this colour must not appear on --bg-panel-raised (calculated at 6.36:1, which fails AAA) is correctly documented and should be enforced in a CSS linting rule.

Disabled label on panel: 2.86:1. This fails AAA and AA. This is correct and intentional: the disabled token is only ever applied alongside the disabled HTML attribute or aria-disabled="true", which exempts it from the contrast requirement under WCAG 1.4.3. The tokens.css and overlays.css code both document this restriction. Confirmed the token is not used in any non-disabled context in the reviewed files.

Focus ring: 3px amber ring, 8.46:1 against --bg-panel. The WCAG 2.4.13 AAA requirement is 3:1 minimum for focus indicator contrast. 8.46:1 exceeds this by a wide margin. The 2px offset prevents the ring from being hidden by the element's own background. Confirmed pass.

## Section 2: Landmark structure and heading hierarchy

### 2.1 Landmarks

The page has one main landmark, id="game-main", wrapping the canvas, announcer, HUD, and touch joystick area (criterion 2.4.1, Level A). This is the S-09 fix. The four overlays are placed outside main, which is correct for dialog elements.

The main-menu and pause overlays each contain a nav element with aria-label. This is correct and provides two named navigation landmarks.

No skip link is present. For a full-screen game application that loads directly into a modal menu, a skip link is not required because there is no repeated navigation block before main content. The game's landmark structure (loading screen, main, dialogs) is navigable via the screen reader's landmark list. WCAG 2.4.1 is satisfied by the landmark structure.

### 2.2 Heading hierarchy

Issue found (Level A, criterion 1.3.1 Info and Relationships).

The loading screen contains H1: "Sophie's Escape: The Witch's Castle" (line 45).

The main-menu dialog also contains H1: "Sophie's Escape: The Witch's Castle" (line 160).

Both elements are present in the DOM simultaneously on page load. This produces two H1 elements in the same document. Screen readers that navigate by heading will encounter two level-1 headings, which breaks the heading hierarchy expected under WCAG 1.3.1 and disrupts users who rely on the heading list to understand document structure.

The loading screen H1 should be demoted to a paragraph or visually styled heading that does not carry H1 semantics, since it is a transient loading state rather than the true page heading. Alternatively, the loading screen should be removed from the DOM (not just hidden) before the main menu is shown.

The inventory, hint, and pause overlays correctly use H2 as their dialog titles. These are inside dialog elements and do not conflict with the document heading structure.

### 2.3 Page title

The page title is "Sophie's Escape: The Witch's Castle" (criterion 2.4.2, Level A). This is unique and descriptive. Confirmed pass.

### 2.4 Language

The html element has lang="en" (criterion 3.1.1, Level A). Confirmed pass.

## Section 3: Keyboard access and focus management

### 3.1 Focus ring

Global :focus-visible rule applies a 3px solid amber outline with 2px offset. Hover and focus-visible states on HUD buttons, overlay close buttons, menu buttons, inventory item buttons, and action buttons all apply the amber-on-black or amber-on-panel combination. All verified as present in base.css and overlays.css. Confirmed pass against criterion 2.4.13 Focus Appearance (AAA).

### 3.2 Escape key and overlay close

The keyboard bridge at keyboard-bridge.js handles the Escape key as follows: if overlays are open, emit CLOSE_OVERLAY; otherwise, emit OPEN_PAUSE. The overlay controller handles CLOSE_OVERLAY by calling _closeTop(), which closes the topmost dialog in the open stack and restores focus.

Issue: the overlay controller does not listen to the native cancel event on dialog elements. When the browser handles a showModal() dialog, pressing Escape fires both the native cancel event (which calls dialog.close()) and the keydown event. The keyboard bridge's keydown handler fires first and calls _closeTop(), which calls dialog.close() a second time. dialog.close() on an already-closed dialog either throws or silently does nothing. The _openStack desync risk is real: if the cancel event closes the dialog before _closeTop() has run, the stack entry is not removed cleanly. This is a medium-severity edge case. The fix is to call e.preventDefault() on the cancel event and let the keyboard bridge remain the sole close path. Flagged for rework.

### 3.3 Focus trap in overlays

Issue (Level A, criterion 2.1.2 No Keyboard Trap).

The overlay controller's contract states "Focus trapped inside dialog while open (Tab wraps)". The keyboard bridge correctly emits NEXT_FOCUSABLE when Tab is pressed with an overlay open, and PREV_FOCUSABLE when Shift+Tab is pressed. However, the overlay controller does not subscribe to either of these intents. The handlers are documented but not connected.

When showModal() is used, the browser's native dialog focus trap prevents Tab from leaving the dialog, so the gap is not visible on supporting browsers. When the attribute-open fallback is active (on iOS Safari 15.3 and below), there is no focus trap and Tab will move through the page behind the overlay, which violates 2.1.2.

The fix is to add on('NEXT_FOCUSABLE') and on('PREV_FOCUSABLE') handlers in installOverlayController() that cycle focus through the focusable elements of the topmost open dialog. This is a Level A defect. Flagged for rework.

### 3.4 Return focus on close

The overlay controller stores document.activeElement or the trigger element in _returnFocusMap at open time, and calls returnEl.focus() on close. This correctly implements the return-focus contract across all four overlays. Confirmed pass against criterion 2.4.3 Focus Order (Level A).

### 3.5 Single-character shortcuts

The keyboard bridge uses I for inventory, H for hints, and W/A/S/D/E/Space for movement and interaction. These fire only when focus is not inside a form field (_inFormField() guard). However, there is no mechanism to disable or remap these single-character shortcuts when a screen reader is active. Criterion 2.1.4 (Level A) requires that single-character shortcuts can be turned off or remapped. A screen reader user in application mode on the canvas element will find that I, H, and Escape conflict with screen reader commands on some configurations.

The existing exception SE-001 covers the broader 3D navigation conflict. The single-character shortcut conflict with screen readers should either be explicitly covered within SE-001 or recorded as a separate exception with Tim's approval. Flagged as an observation, not a new blocker, since SE-001 already acknowledges the screen reader / application mode boundary.

## Section 4: Overlay dialog pattern

All four overlays use the element with role="dialog" and aria-modal="true". Each is associated with a visible heading via aria-labelledby. This is correct.

Note on redundant attributes: the element has an implicit role of "dialog". Adding role="dialog" explicitly is redundant but not harmful. The aria-modal="true" attribute is correctly used to tell screen readers that content behind the dialog is inert.

### 4.1 Main-menu overlay

The dialog is opened via _showMainMenu() which calls _open('overlay-main-menu', null). Because triggerElementId is null, no aria-expanded is updated and no return-focus target is stored. This is correct for the initial game-load case because there is no previous focus state to return to.

Focus moves into the dialog via _moveFocusInto(), which targets the first focusable element. In the main-menu, the first focusable element is the "New Game" button. Confirmed correct.

The menu contains one button ("New Game"). No Continue or other options exist in v0.1. The nav element with aria-label="Main menu" is present and correct.

The GoatCounter privacy notice link is present with descriptive text "GoatCounter", target="_blank", and rel="noopener noreferrer". Criterion 2.4.4 / 2.4.9 Link Purpose is met: "GoatCounter" is clear as link text. Criterion 3.2.5 Change on Request is met: the link opens in a new tab as expected for an external link, and the HTML pattern (target="_blank") is the accepted convention. A screen reader user would benefit from a visually-hidden "(opens in new tab)" notice appended to the link text. Flagged as a recommended improvement, not a blocker at this level.

### 4.2 Inventory overlay

The dialog has aria-labelledby="inventory-heading" pointing to the H2 "Inventory". Correct.

The close button has aria-label="Close inventory" and min-width / min-height of 44px. Correct.

The combine button uses the disabled HTML attribute when fewer than two items are selected, not aria-disabled alone. This is the correct approach for disabling button interaction. Confirmed pass.

The feedback live region has role="status" aria-live="polite" aria-atomic="true". This is the correct pattern for combination results and errors.

Issue (Level A, criterion 1.3.1 / 4.1.2): inventory item buttons are created in JavaScript as bare button elements and appended directly to the grid container, which has role="list". The ARIA specification requires that list items inside a role="list" element have role="listitem". The current code creates no wrapper element with role="listitem". Screen readers that enforce this relationship (JAWS in particular) may not announce the items as list members or may not provide list navigation commands. Fix: wrap each item button in a div with role="listitem" before appending to the grid, or change the grid to a ul and the items to li elements. Flagged for rework.

### 4.3 Hint overlay

The dialog has aria-labelledby="hint-heading" pointing to the H2 "Hint for this puzzle". Correct.

The three-step hint cascade is implemented in hint-panel.js. The first hint is shown automatically on first open by dispatching REVEAL_HINT immediately. Subsequent hints require an explicit "Show next hint" button press. The button is hidden when all three hints are revealed. This is the correct accessibility pattern for progressive disclosure: the user is in control of each reveal.

The hint-step-label element ("Hint 1 of 3") has aria-live="polite" directly on it (line 263 of index.html). This means the step label will be announced when it changes. This is an acceptable approach.

The hint-announcer div has role="status" aria-live="polite" aria-atomic="true" and is in the DOM as an sr-only element. The hint-panel.js clears the announcer text then sets it in a requestAnimationFrame callback to force re-announcement. This is a known pattern for re-triggering aria-live announcements. It works in most screen reader / browser combinations but is fragile: some screen readers observe the DOM mutation directly and may announce the empty string first. A more robust approach is to use a dual-buffer pattern (two live regions that alternate). Flagged as a recommended improvement.

The "Show next hint" button updates its text to "Show final hint" at step 2. This is a label change: the accessible name changes but the element stays in place. This is correct and preserves focus.

### 4.4 Pause overlay

The dialog has aria-labelledby="pause-heading" pointing to the H2 "Game Paused". Correct.

The nav element with aria-label="Pause menu" contains Resume, Hint, and Exit to Main Menu buttons. All buttons have explicit aria-label attributes with clear purpose.

Focus management: the pause overlay is opened via OPEN_PAUSE, which is triggered by Escape or the pause HUD button. The controller opens the overlay and calls _moveFocusInto(), which targets the first focusable element (the Resume button). This is correct.

## Section 5: aria-expanded on HUD buttons

Issue (Level A, criterion 4.1.2 Name, Role, Value).

The inventory HUD button has aria-expanded="false" in HTML and aria-controls="overlay-inventory". The overlay controller correctly updates aria-expanded to "true" on open and "false" on close.

The hint HUD button has aria-controls="overlay-hint" but no aria-expanded attribute in HTML. The overlay controller sets aria-expanded="true" and "false" dynamically, but the button's initial state is undeclared. Screen readers that read aria-expanded before any user action will find no attribute.

The pause HUD button has aria-controls="overlay-pause" but no aria-expanded attribute in HTML. Same issue.

The fix is to add aria-expanded="false" to both the hint and pause HUD buttons in index.html, matching the inventory button's initial state. Flagged for rework.

## Section 6: Touch target sizes

All interactive elements declare min-height: 44px and min-width matching or exceeding 44px via the --space-touch-target token (44px). This covers the overlay close buttons, menu buttons, HUD buttons, inventory item buttons, and action buttons. The token is applied consistently through the CSS. Confirmed pass against criterion 2.5.5 Target Size Enhanced (AAA).

The touch gap token --space-touch-gap (8px) is applied in menu lists to prevent 44px areas from overlapping. Confirmed present.

The touch joystick knob is 44px by 44px. The joystick base is 100px by 100px. These are purely decorative/input controls in the canvas layer; they do not have WCAG target-size requirements, but they exceed 44px anyway. Confirmed pass.

## Section 7: prefers-reduced-motion

The tokens.css file includes a media query for prefers-reduced-motion: reduce that sets --transition-panel and --transition-fade to 0s. All panel slide transitions and dialog fade transitions reference these tokens. When the user has reduced motion enabled, transitions are instant.

The first-person-controller.js reads window.matchMedia('(prefers-reduced-motion: reduce)') and applies it to look acceleration in the 3D scene. This is the correct approach for 3D animation.

The state schema includes reducedMotionUserOverride, indicating a planned in-app override toggle. This is a good pattern for users whose system setting does not reflect their preference.

Confirmed pass against criterion 2.3.3 Animation from Interactions (AAA).

## Section 8: Canvas element accessibility posture

The Three.js canvas has role="application", aria-label="Sophie's Escape game view. Use keyboard controls or on-screen buttons to play.", and tabindex="0". The canvas is hidden until the game initialises.

Posture assessment: this is the correct approach for a 3D browser game. The WCAG success criteria do not formally extend to WebGL canvas content because the canvas is a single image element to the browser. The HTML overlay layer (dialogs, HUD, announcer regions) carries all accessible content. The canvas receives role="application" so that screen readers know it is an interactive region and can pass keys through in application mode.

The aria-label text is clear and instructional. It tells screen reader users what the element is and that keyboard and on-screen controls are available. This satisfies the spirit of criterion 1.1.1 Non-text Content (Level A) for an interactive application region.

The game-announcer div (role="status" aria-live="polite" aria-atomic="true") is present in the DOM as an sr-only element. This is the channel for room entry descriptions, item pickup confirmations, and puzzle progress. The project accessibility doc at docs/accessibility.md describes its intended content in detail. The announcer is correctly designed. Confirmed pass.

Exception SE-001 (criterion 2.1.3 Keyboard No Exception) is documented and awaits Tim's approval. The exception is valid in reasoning: real-time 3D navigation cannot be fully operated by a screen reader user in browse mode, and the overlay system provides equivalent access to all story and puzzle content. The exception record at docs/exceptions/SE-001-3d-navigation.md should be created and Tim's sign-off recorded before the v0.1 milestone ships.

## Section 9: Loading screen

The loading screen has role="status" aria-live="polite" and aria-label="Loading Sophie's Escape". The loading-bar element has role="progressbar" with aria-valuenow="0", aria-valuemin="0", aria-valuemax="100", and aria-label="Loading progress". These are correct.

The diagnostic panel (boot-diagnostic div) uses role="alert" aria-live="assertive" aria-atomic="true". This is correct for an error panel: assertive live regions interrupt the screen reader immediately, which is appropriate for boot failures.

No mechanism was found to update aria-valuenow on the progress bar during loading. The value is set to 0 in HTML and would need to be updated via JavaScript as the game assets load. This is an implementation detail not yet present in v0.1; it should be added when the loading system is implemented.

## Section 10: S-series regression suite review

The PR 2 report claims all 12 S-series checks pass. Based on this static audit, the following assessment applies.

S-09 (missing landmark, main wraps canvas and HUD): CONFIRMED PASS. game-main is present with the correct landmark role.

S-10 (focus ring contrast): CONFIRMED PASS. 3px amber ring at 8.46:1 against bg-panel. Exceeds 3:1.

S-12 (modal missing role, focus, trap): PARTIAL PASS. The role, aria-modal, aria-labelledby, focus-on-open, and return-focus-on-close contracts are met. The focus trap is incomplete in the attribute-open fallback path. The intent handling gap (NEXT_FOCUSABLE and PREV_FOCUSABLE not consumed by the overlay controller) is a defect. S-12 should not be marked as a full pass until the focus trap is implemented.

New S-series entries recommended for a 3D browser game stack:

S-13: Canvas application role and label. For any Three.js or WebGL game, the canvas must have role="application" and a descriptive aria-label. Without these, screen readers either announce "canvas" with no context or skip the element. Check: canvas element has role="application" and a non-empty aria-label.

S-14: Game-state live region present. For any game with real-time state changes (room transitions, item pickups, puzzle events), an aria-live="polite" region must be present in the DOM and receive announcements on state change. Check: a live region with id matching the game-announcer pattern is in the DOM outside the canvas and is not display:none.

S-15: Overlay focus trap verified. For any overlay controller that claims focus trapping, the NEXT_FOCUSABLE and PREV_FOCUSABLE intents (or equivalent Tab keydown handlers) must be subscribed and functional. Check: Tab from the last focusable element in an open overlay wraps to the first; Shift+Tab from the first wraps to the last.

## Section 11: Findings summary table

The table below lists every finding with its WCAG criterion, level, and severity.

Finding 1: Two H1 elements in DOM simultaneously. Criterion 1.3.1, Level A. Rework required.

Finding 2: Focus trap not implemented for attribute-open fallback. Criterion 2.1.2, Level A. Rework required.

Finding 3: aria-expanded absent from hint and pause HUD buttons in HTML. Criterion 4.1.2, Level A. Rework required.

Finding 4: Inventory item buttons lack role="listitem" wrapper inside role="list". Criterion 1.3.1 and 4.1.2, Level A. Rework required.

Finding 5: Native dialog cancel event not suppressed; risk of overlay-controller open-stack desync on Escape. No specific criterion, implementation defect. Rework recommended.

Finding 6: GoatCounter link lacks "(opens in new tab)" advisory text. Criterion 2.4.9, Level AAA. Recommended improvement, not a blocker.

Finding 7: aria-live re-announcement pattern in hint-panel uses a single buffer cleared and reset via requestAnimationFrame. This is fragile in some screen reader / browser pairs. Criterion 4.1.3, Level AA. Recommended improvement.

Finding 8: Loading progress bar aria-valuenow is static at 0; needs JavaScript updates during loading. Criterion 4.1.2, Level A. Not a blocker at scaffold stage, must be implemented before v0.1 ships.

Finding 9: Screen-reader evidence file not yet on file (VoiceOver and JAWS manual passes). Required by team release gate in CLAUDE.md and docs/accessibility.md. Must be completed before v0.1 ships.

Finding 10: Exception SE-001 (3D navigation) and SE-002 (3D decorative colours) are documented but do not yet have Tim's approval. Required before any release.

## Section 12: What passes

All colour contrast ratios confirmed at AAA. All touch target sizes meet the 44px AAA threshold. prefers-reduced-motion is handled in both CSS and JavaScript. The dialog role, aria-modal, and aria-labelledby pattern is correct on all four overlays. Return focus on close is correctly implemented. The Escape key routing is correct in the keyboard bridge. The hint cascade is correctly designed with user-controlled progression. The aria-live announcer pattern for inventory feedback and hint text is correctly structured. The canvas role and label are correct for a 3D game architecture. The loading screen live regions are correctly configured. The page title and language attributes are correct.
