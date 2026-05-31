# Carol: Re-test Report — Rework Verification

Sophie's Escape: The Witch's Castle, v0.1 scaffold, commit 1835613.

Re-test date: 2026-05-24. Branch: feat/v0.1-scaffold. Auditor: Carol.

Baseline: carol-baseline-audit.md, dated 2026-05-24.

## Updated verdict

Overall: CONDITIONAL PASS.

All four Level A rework items are resolved. The implementation defect (dialog cancel desync) is resolved. S-12 (modal focus and trap) is now a full conditional pass, not a partial pass.

The conditional pass carries the same four outstanding items from the baseline that are not yet blockers but must be resolved before the v0.1 milestone ships:

1. Screen-reader evidence files (VoiceOver and JAWS manual passes) are not yet on file.
2. Exception SE-001 (3D navigation) does not yet have Tim's approval.
3. Exception SE-002 (3D decorative colours) does not yet have Tim's approval.
4. The loading progress bar aria-valuenow is static at 0. JavaScript updates are needed during loading.

Two recommended improvements remain open but are not blockers at any level:

- GoatCounter link lacks a visually-hidden "(opens in new tab)" advisory notice.
- The hint-panel aria-live re-announcement uses a single-buffer cleared-and-reset pattern that is fragile in some screen reader and browser pairs. A dual-buffer pattern would be more robust.

No new issues were introduced by Sean's changes.

## Scope and method

This is a static code audit of the three files changed in commit 1835613: index.html, src/ui/overlay-controller.js, and src/ui/inventory-panel.js. Each of Sean's five fixes is assessed in turn. The S-12 regression check is re-evaluated against the updated overlay-controller.js. All other baseline findings that are outside the changed files are carried forward without re-checking; those files did not change.

## Fix 1: Focus trap — NEXT_FOCUSABLE and PREV_FOCUSABLE intent subscribers

Baseline finding: the overlay controller did not subscribe to the NEXT_FOCUSABLE or PREV_FOCUSABLE intents. The keyboard bridge emitted them, but nothing consumed them. The browser's native showModal() trap covered most browsers, but the attribute-open fallback path (iOS Safari 15.3 and below) had no trap at all. Criterion 2.1.2 Level A.

What Sean added to overlay-controller.js:

Lines 44 to 45 of overlay-controller.js now register:

    _unsubs.push(on('NEXT_FOCUSABLE', () => _moveFocusByStep(1)));
    _unsubs.push(on('PREV_FOCUSABLE', () => _moveFocusByStep(-1)));

The _moveFocusByStep(step) helper (lines 233 to 252) does the following:

- If the open stack is empty, it returns immediately.
- It gets the topmost open dialog ID from the stack.
- It calls _getFocusableElements(dialog) to collect all focusable elements in DOM order, excluding any inside aria-hidden="true" subtrees.
- If no focusable elements exist, it returns.
- It finds the index of the currently focused element. If the active element is not inside the dialog, it moves to the first element (forward) or the last element (backward).
- Otherwise it advances by step, wrapping via modulo arithmetic.

Assessment:

The implementation is correct and complete. The subscriber registration is inside installOverlayController(), so it is cleaned up by disposeOverlayController() through the _unsubs array. The boundary wrapping is correct: (idx + step + focusable.length) % focusable.length handles both +1 overflow at the last element and -1 underflow at the first element without producing a negative index. The guard against elements inside aria-hidden subtrees is correct; it prevents focus being sent to hidden decorative icons. The fallback when the active element is outside the dialog (idx === -1) moves focus to the first or last element, which is the correct behaviour when focus has somehow escaped the trap.

One observation: the querySelectorAll selector at line 276 excludes [tabindex="-1"] elements, which is correct. It does not exclude hidden or visibility:hidden elements. In the current scaffold the overlays contain no such elements, so this is not a defect at this stage, but it is worth noting for future content.

Verdict: PASS. Criterion 2.1.2 Level A is now met.

## Fix 2: aria-expanded on hint and pause HUD buttons

Baseline finding: the hint button and pause button had aria-controls but no initial aria-expanded attribute. Screen readers reading the buttons before any user interaction would find no expanded state declared. Criterion 4.1.2 Level A.

What Sean added to index.html:

Line 109: hud-hint-btn now has aria-expanded="false".
Line 129: hud-pause-btn now has aria-expanded="false".

Both buttons already had aria-controls pointing to the correct overlay IDs. The new attribute brings them into line with the inventory button, which had aria-expanded="false" from the start.

The overlay controller's _open() and _close() functions both reference the triggerMap at lines 194 to 203, which maps overlay IDs to HUD button IDs. The hint and pause buttons are already in that map. On open, setAttribute('aria-expanded', 'true') is called on the trigger element (line 128). On close, setAttribute('aria-expanded', 'false') is called via the triggerMap (lines 199 to 202). The dynamic updates were always in place; the fix adds the initial HTML declaration to match.

Assessment: correct and complete. The initial state is now declared in HTML, and the dynamic controller already kept it accurate at runtime. No gap remains.

Verdict: PASS. Criterion 4.1.2 Level A is now met for the hint and pause HUD buttons.

## Fix 3: Inventory item buttons wrapped in role="listitem"

Baseline finding: the inventory grid had role="list" but item buttons were appended directly as bare button elements. The ARIA list and listitem relationship was broken. Screen readers, especially JAWS, may not announce items as list members or provide list navigation. Criteria 1.3.1 and 4.1.2 Level A.

What Sean changed in inventory-panel.js:

In _renderItems() (lines 79 to 126), the section that creates a new item button (lines 101 to 121) now does the following after constructing the button:

    const listItem = document.createElement('div');
    listItem.setAttribute('role', 'listitem');
    listItem.appendChild(btn);
    grid.appendChild(listItem);

The stale-item removal section (lines 83 to 93) was also updated. The comment states "Remove listitem wrappers whose item is no longer in the inventory." The removal code now does:

    const wrapper = btn.closest('[role="listitem"]');
    (wrapper ?? btn).remove();

This removes the enclosing div[role="listitem"] when present, not just the button. Without this companion fix, removing a stale item would have left an empty role="listitem" shell in the grid, which would be an empty list item announced by screen readers.

Assessment: both the creation path and the removal path are correctly updated. The grid structure is now role="list" containing div[role="listitem"] elements each containing a button. This is a valid ARIA list pattern. A native ul and li structure would also be valid; the div approach is acceptable and equivalent for ARIA purposes.

One check: the querySelectorAll('.inventory-item-btn') selector used to find existing buttons (line 84) still targets the button class directly, not the wrapper. This is correct, because btn.closest('[role="listitem"]') then walks up to find the wrapper. If the closest() call returns null (for example, if a button was created by another code path without a wrapper), the fallback (wrapper ?? btn).remove() removes the button itself. This defensive fallback is appropriate.

Verdict: PASS. Criteria 1.3.1 and 4.1.2 Level A are now met for inventory list structure.

## Fix 4: Single H1 in the document — loading screen heading demoted

Baseline finding: the loading screen used an H1 element ("Sophie's Escape: The Witch's Castle") and the main-menu dialog also used an H1. Both were in the DOM simultaneously on page load, producing two H1 elements and breaking heading hierarchy for screen reader navigation. Criterion 1.3.1 Level A.

What Sean changed in index.html:

Line 45 of the updated index.html reads:

    <p class="game-title">Sophie's Escape: The Witch's Castle</p>

The element was previously an H1 with class="game-title". It is now a paragraph with the same class. The main-menu dialog retains its H1 at line 162:

    <h1 id="main-menu-heading" class="overlay-title">Sophie's Escape: The Witch's Castle</h1>

The brief states that the CSS class preserves visual appearance, meaning the loading screen title continues to render with the same large styled text as before, using the .game-title rules in the stylesheet.

Assessment: there is now exactly one H1 in the document at any point: the main-menu heading. The loading screen title carries no heading semantics. The heading hierarchy is clean. The visual appearance is unchanged for sighted users because the CSS class is retained on the paragraph.

One question was whether the main-menu H1 is the correct choice for the document H1 rather than a standard H2 or paragraph. The main-menu dialog is the first meaningful content the user encounters after loading. Making it the document's single H1 is a valid and common pattern for single-page applications where the app title is the page's primary heading. This is consistent with WCAG 1.3.1.

Verdict: PASS. Criterion 1.3.1 Level A is now met for heading hierarchy.

## Fix 5: Native dialog cancel event suppressed

Baseline finding: the overlay controller did not intercept the native cancel event fired by showModal() dialogs when the browser handles the Escape key. This risked the dialog closing via the browser's own handler before _closeTop() could remove the overlay from _openStack, producing a state desync. Flagged as a medium-severity implementation defect with rework recommended.

What Sean added to overlay-controller.js:

Lines 153 to 154 of the _open() function, after the dialog is opened and before the overlay ID is pushed to the stack:

    dialog.addEventListener('cancel', (e) => e.preventDefault(), { once: false });

This registers a cancel listener that calls e.preventDefault() on every cancel event for the dialog's lifetime.

Assessment: the fix is correct. e.preventDefault() on the cancel event prevents the browser from calling dialog.close() on its own. The keyboard bridge's keydown handler for Escape emits CLOSE_OVERLAY, which calls _closeTop(), which calls _close(). That is the sole close path. The open stack is therefore always updated before the dialog is closed.

One observation about the listener management: the listener is registered with once: false, which means it is permanent for the element's lifetime. If a dialog is opened, closed, and then opened again, a second cancel listener is added. Each listener independently calls e.preventDefault(). Multiple listeners calling preventDefault() on the same event is harmless; the outcome is the same as one listener doing so. However, the listener count grows unboundedly with repeated open/close cycles. A cleaner pattern would be to register the cancel listener once, in installOverlayController(), using addEventListener on the dialog elements directly. This is a minor code quality observation; it is not an accessibility or functional defect at scaffold stage where the game flow opens each overlay a limited number of times per session.

Verdict: PASS. The implementation defect is resolved. Open-stack desync on Escape is no longer a risk.

## S-12 regression check: modal role, focus, and trap

Baseline status: PARTIAL PASS. The role, aria-modal, aria-labelledby, focus-on-open, and return-focus-on-close contracts were met. The focus trap was incomplete in the attribute-open fallback path.

With Fix 1 applied, the NEXT_FOCUSABLE and PREV_FOCUSABLE intents are now subscribed and connected to _moveFocusByStep. The focus trap now operates in both the showModal() path (native browser trap) and the attribute-open fallback path (manual trap via _moveFocusByStep). All five contracts of S-12 are now met:

- role="dialog" and aria-modal="true" are present on all four overlays (unchanged from baseline, confirmed pass).
- aria-labelledby is correctly set on all four overlays (unchanged from baseline, confirmed pass).
- Focus moves into the dialog on open via _moveFocusInto() (unchanged from baseline, confirmed pass).
- Focus is trapped inside the dialog while open via native showModal() trap plus the new NEXT_FOCUSABLE and PREV_FOCUSABLE subscribers (fix 1, now confirmed pass).
- Focus returns to the trigger element on close via _returnFocusMap (unchanged from baseline, confirmed pass).

S-12 status: FULL CONDITIONAL PASS.

The conditional qualifier applies because manual screen-reader evidence (VoiceOver and JAWS) has not yet been recorded. S-12 cannot become a clean pass until the evidence file exists.

## New issues introduced by Sean's changes

None found.

The changes are tightly scoped: two lines added to installOverlayController(), twelve lines added to _open(), twenty lines added to and around _renderItems(), two aria-expanded attributes added to index.html, and one tag change from H1 to P in index.html. No other logic was touched. The baseline findings in hint-panel.js and keyboard-bridge.js remain exactly as assessed; those files were not part of this commit.

The cancel listener observation (multiple listeners on repeated open/close) and the querySelectorAll fallback observation (does not filter hidden elements) are both minor code quality notes, not accessibility defects, and do not require rework at this stage.

## Outstanding items from baseline not addressed in this commit

The following items from the baseline remain open. They were not rework items for Sean's commit. They are recorded here so Sonja and the team know their current status.

Finding 6 (Recommended improvement, not a blocker): the GoatCounter link in the main-menu overlay has no visually-hidden "(opens in new tab)" advisory text. The link has target="_blank" and rel="noopener noreferrer". WCAG 2.4.9 Level AAA. Recommended to add before v0.1 ships.

Finding 7 (Recommended improvement, not a blocker): the hint-panel aria-live re-announcement uses a single-buffer pattern (clear then set via requestAnimationFrame). A dual-buffer pattern would be more robust across screen reader and browser pairs. Criterion 4.1.3 Level AA.

Finding 8 (Must be resolved before v0.1 ships): the loading progress bar aria-valuenow is static at 0. JavaScript must update it during asset loading. Criterion 4.1.2 Level A.

Finding 9 (Must be resolved before v0.1 ships): no screen-reader evidence file exists for a manual VoiceOver or JAWS pass. The team release gate in CLAUDE.md and docs/accessibility.md requires this evidence before any release.

Finding 10 (Must be resolved before v0.1 ships): exception SE-001 (3D navigation, criterion 2.1.3) and exception SE-002 (3D decorative colours) are documented but do not yet have Tim's approval. Required before the v0.1 milestone ships.

## Summary of re-test results

Fix 1: Focus trap via NEXT_FOCUSABLE and PREV_FOCUSABLE — PASS.
Fix 2: aria-expanded on hint and pause HUD buttons — PASS.
Fix 3: Inventory item buttons wrapped in role="listitem" — PASS.
Fix 4: Loading screen H1 demoted to paragraph — PASS.
Fix 5: Native dialog cancel event suppressed — PASS.
S-12 regression check — FULL CONDITIONAL PASS (pending screen-reader evidence).
New issues introduced by Sean's changes — NONE.

All four Level A rework items are resolved. The implementation defect is resolved. The scaffold now meets WCAG 2.2 AAA on the criteria testable by static code audit, subject to the outstanding items listed above. The release gate cannot be passed until screen-reader evidence files are on file and Tim has approved SE-001 and SE-002.
