# Work folder 034: SEWC UI improvements

**Status:** done
**Triage type:** Small feature (type 7)
**Opened:** 2026-06-06

## Issue 1: Inventory items too small for text — convert to scrollable list

Inventory item buttons are currently sized too small to display item names clearly. Convert the inventory panel to use a proper vertical list layout:
- Each item is a full-width list item (`<li>` in a `<ul>`) with a large enough touch target (min 44px height per WCAG 2.5.5)
- Text is fully visible, not clipped
- The list scrolls if it exceeds the panel height

## Issue 2: Help panel needs keyboard and touch gesture reference

The help dialog currently has placeholder content. Populate it with a complete reference of all keyboard controls and touch gestures:

Keyboard controls:
- W / Arrow Up — move forward
- S / Arrow Down — move back
- A / Arrow Left — strafe left
- D / Arrow Right — strafe right
- Mouse drag / Arrow keys (look mode) — look around
- I — open/close inventory
- H — show hint
- P or Escape — pause / resume
- ; (semicolon) — open settings
- Escape — deselect selected item (when no overlay open)
- Space or Enter — interact with focused object

Touch gestures:
- Drag on canvas — look around
- Tap interactive object button — interact
- Swipe up/down in lists — scroll

Format as two clear sections with headings. Ensure the content is plain text (no ASCII art), screen-reader friendly, and uses the existing overlay styling.

## Issue 3: Inventory panel too small on iPad

On iPad (typically 768px–1024px wide), the inventory sidebar panel is too small. Apply responsive CSS:
- On screens narrower than 768px: inventory takes full width
- On screens 768px–1024px: inventory is at least 400px wide
- Ensure the panel is still scrollable on smaller screens

## Issue 4: HUD buttons show keyboard shortcut

Each HUD button that has a keyboard shortcut should display it clearly. Use one of these formats (choose the most accessible):
- "Inventory (I)" — letter in parentheses
- "Inventory" with the I underlined using `<span class="kbd-hint">I</span>`

Apply to all shortcut-bearing HUD buttons: Inventory (I), Hint (H), Pause (P), Settings (;), Help (?). Use `<abbr>` or `<kbd>` element for the key label so screen readers announce it correctly.

## Out of scope

- New gameplay features
- Visual redesign beyond layout fixes

## Risk and rollback

Low. CSS and HTML content changes. Rollback: revert the branch.

## Definition of done

- Inventory list items are full-width with min 44px height, text fully visible, list scrolls
- Help panel has complete keyboard and touch reference in two clear sections
- Inventory panel is at least 400px wide on iPad (768–1024px)
- HUD buttons show shortcut key using accessible markup
- All existing tests pass
- Lint: 0 errors
- PR open on branch `fix/sewc-ui-improvements`

## Pre-approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than main
- [x] Open a pull request
- [x] Comment on a pull request or issue
- [x] Create an issue
