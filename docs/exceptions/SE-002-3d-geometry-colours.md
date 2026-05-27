# Exception SE-002: 3D Decorative Geometry Colours

## Summary

Sophie's Escape: The Witch's Castle cannot meet WCAG 2.2 criterion 1.4.6 (Contrast Enhanced, AAA) for the colours of 3D decorative geometry. This exception is approved and permanent.

## WCAG criterion

- **Criterion:** 1.4.6 Contrast (Enhanced) — Level AAA
- **Requirement:** The visual presentation of text and images of text has a contrast ratio of at least 7:1.

## Why the exception applies

The castle's 3D geometry (walls, floors, ceilings, furnishings, and atmospheric lighting) uses colours chosen for visual atmosphere. In a 3D rendered scene, the concept of "background colour" does not map to a fixed value. Stone walls, dynamic shadows, and point-light sources produce contrast relationships that cannot be measured as text-against-background in the WCAG sense.

WCAG 1.4.6 applies to text and images of text. The 3D geometry contains no text. The exception is confined to decorative geometry only.

The 3D canvas is marked `aria-hidden="true"`. It is not part of the assistive-technology experience.

## What is accessible

All text in the UI overlay layer meets WCAG 2.2 AAA contrast requirements (7:1 minimum). This includes:

- Main menu text and buttons
- Inventory panel text and item names
- Hint panel text
- Pause screen text
- All status messages delivered via `aria-live` regions

## Decision

Manual VoiceOver and JAWS screen-reader evidence passes are not required for this project. Automated accessibility checks (axe-core, Pa11y, WCAG 2.2 AAA code review) cover the overlay layer. The 3D geometry is `aria-hidden` and outside the screen-reader experience.

## Approval

- **Approved by:** Tim Dixon
- **Date:** 2026-05-27
- **Method:** Verbal approval in Claude Code session (Q214A)

## Status

Permanent exception. No review date.
