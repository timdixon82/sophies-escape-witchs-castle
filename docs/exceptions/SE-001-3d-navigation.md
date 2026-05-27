# Exception SE-001: 3D First-Person Navigation

## Summary

Sophie's Escape: The Witch's Castle cannot meet WCAG 2.2 criterion 2.1.3 (Keyboard No Exception, AAA) for its 3D first-person view. This exception is approved and permanent.

## WCAG criterion

- **Criterion:** 2.1.3 Keyboard (No Exception) — Level AAA
- **Requirement:** All functionality of the content is operable through a keyboard interface without requiring specific timings for individual keystrokes.

## Why the exception applies

The 3D view uses pointer-lock and mouse-look to control the first-person camera. This is the standard interaction model for first-person 3D games in the browser. There is no keyboard equivalent that preserves the first-person experience; keyboard-only navigation would require a fundamentally different game design.

The 3D canvas is marked `aria-hidden="true"`. It is not part of the assistive-technology experience. Screen-reader support covers the UI overlay layer only.

## What is accessible

The UI overlay layer is fully keyboard-accessible and screen-reader-compatible:

- Main menu (game start, options)
- Inventory panel (item selection, item examination)
- Hint system
- Pause screen

All overlay controls meet WCAG 2.2 AAA keyboard and focus-management requirements.

## Decision

Manual VoiceOver and JAWS screen-reader evidence passes are not required for this project. Automated accessibility checks (axe-core, Pa11y, WCAG 2.2 AAA code review) cover the overlay layer. The 3D view is `aria-hidden` and outside the screen-reader experience.

## Approval

- **Approved by:** Tim Dixon
- **Date:** 2026-05-27
- **Method:** Verbal approval in Claude Code session (Q213A)

## Status

Permanent exception. No review date.
