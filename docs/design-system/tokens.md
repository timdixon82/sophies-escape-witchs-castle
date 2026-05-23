# Sophie's Escape Design Tokens

Version 1.0, dated 2026-05-23. Author: Simon (designer agent). This file is the design source of truth for all visual tokens in Sophie's Escape: The Witch's Castle. Sean converts these tokens to CSS custom properties when implementing. The CSS file is not produced here.

Each token has: a name, a hex value, a semantic note, the surfaces it pairs with, and the verified AAA contrast ratio for each pairing. Contrast ratios are calculated against WCAG 2.2 relative luminance values. AAA requires 7:1 for normal text and 4.5:1 for large text (18 px and above, or 14 px bold and above).

This game uses a fixed dark scheme. Light-mode variant slots are provided in each category so a light mode can be added in a future version without restructuring the token file. Light-mode values are marked "(unset — pending Tim's decision D9)".

## Background tokens

Background tokens define the surfaces that text and icons sit on.

### --bg-canvas

Dark mode: `#0A0A0A`
Light mode: (unset)
Semantic note: The underlying page background behind the 3D canvas. Near-black. Not a direct text surface. Used as the page body background.
Relative luminance: 0.00304
Text pairings: None (not a text surface). Foreground `--accent-amber` against this surface: 9.66:1 (passes AAA — for any ambient UI element that floats directly on the near-black page outside panels).

### --bg-panel

Dark mode: `#1E1B16`
Light mode: (unset)
Semantic note: Primary surface for all UI panels. Inventory panel, hint dialog, pause screen, controls overlay, win screen. Dark warm charcoal with a slight brown-amber undertone.
Relative luminance: 0.01117
Text pairings:
- `--fg-primary` (`#F0EAE0`) on `--bg-panel`: ratio 14.34:1. Passes AAA normal text.
- `--fg-secondary` (`#C8BEA8`) on `--bg-panel`: ratio 9.31:1. Passes AAA normal text.
- `--accent-amber` (`#FFA040`) on `--bg-panel`: ratio 8.46:1. Passes AAA normal text.
- `--accent-purple` (`#C89EFF`) on `--bg-panel`: ratio 8.00:1. Passes AAA normal text.
- `--accent-green` (`#7ED4A0`) on `--bg-panel`: ratio 9.65:1. Passes AAA normal text.
- `--status-error` (`#FF8080`) on `--bg-panel`: ratio 7.07:1. Passes AAA normal text.

### --bg-panel-raised

Dark mode: `#28241E`
Light mode: (unset)
Semantic note: Slightly lighter than `--bg-panel`. Used for list items, selected states, and card-within-panel insets. Provides gentle visual separation.
Relative luminance: 0.01807
Text pairings:
- `--fg-primary` (`#F0EAE0`) on `--bg-panel-raised`: ratio 12.89:1. Passes AAA normal text.
- `--fg-secondary` (`#C8BEA8`) on `--bg-panel-raised`: ratio 8.39:1. Passes AAA normal text.
- `--accent-amber` (`#FFA040`) on `--bg-panel-raised`: ratio 7.61:1. Passes AAA normal text.
- `--accent-purple` (`#C89EFF`) on `--bg-panel-raised`: ratio 7.19:1. Passes AAA normal text.
- `--accent-green` (`#7ED4A0`) on `--bg-panel-raised`: ratio 8.67:1. Passes AAA normal text.
- `--status-error` (`#FF8080`) on `--bg-panel-raised`: ratio 6.35:1. FAILS AAA normal text. The error token must not be used as text on this surface. Error text must be placed on `--bg-panel` only.

### --bg-overlay-scrim

Dark mode: `rgba(10, 10, 10, 0.85)` — treated as `#0A0A0A` for contrast purposes (the scrim is always over the game canvas, and any background behind it is darker).
Light mode: (unset)
Semantic note: Semi-transparent black scrim placed between the 3D canvas and full-screen overlays. Ensures overlay text reads against any room background. Fixed at 0.85 opacity.
Relative luminance (treated as): 0.00304
Text pairings:
- `--fg-primary` on `--bg-overlay-scrim`: ratio 16.54:1. Passes AAA normal text.
- `--accent-amber` on `--bg-overlay-scrim`: ratio 9.66:1. Passes AAA normal text.

## Foreground tokens

### --fg-primary

Dark mode: `#F0EAE0`
Light mode: (unset)
Semantic note: Primary reading colour. All body text, labels, inventory item names, hint text, menu copy. Warm off-white; slightly cream to reduce glare.
Relative luminance: 0.8271
Used on surfaces: `--bg-panel`, `--bg-panel-raised`, `--bg-overlay-scrim`. Contrast documented above.

### --fg-secondary

Dark mode: `#C8BEA8`
Light mode: (unset)
Semantic note: Secondary labels, subheadings, puzzle progress indicators, hint step numbers. Used for lower-visual-weight text that is still informational.
Relative luminance: 0.5195
Used on surfaces: `--bg-panel`, `--bg-panel-raised`. Contrast documented above.

### --fg-disabled

Dark mode: `#6A6258`
Light mode: (unset)
Semantic note: Label colour for disabled interactive controls only. Not used for body copy. Deliberately subdued. Contrast against `--bg-panel`: 3.47:1. This does not meet AAA for normal text by design: disabled controls convey their state through `aria-disabled="true"` and through visual subduing. WCAG permits this pattern for disabled controls. Do not use this token for any non-disabled text.
Relative luminance: 0.14778 (estimated)
Constraint note: This token must only be applied alongside `aria-disabled="true"` or the `disabled` attribute on the element. Applying it to non-disabled text would create an accessibility failure.

## Accent tokens

### --accent-amber

Dark mode: `#FFA040`
Light mode: (unset)
Semantic note: Amber torch light. Primary accent. Headings, selected states, interactive affordances, focus-ring colour, button borders. The warmest and most energetic colour in the palette, evoking flickering torchlight.
Relative luminance: 0.4677
Used on surfaces: `--bg-panel`, `--bg-panel-raised`, `--bg-overlay-scrim`, and as a background colour for hover/active button states.
Text pairings documented above.
When used as a background (hover/active button state): foreground `#000000` (black) on `--accent-amber`: ratio 10.35:1. Passes AAA.

### --accent-purple

Dark mode: `#C89EFF`
Light mode: (unset)
Semantic note: Pastel purple magical accent. Hint step labels, combine-result messages, witch dialogue text, magical-theme UI text. Pastel form used because saturated purples (e.g. `#9B59FF`) fail AAA on dark surfaces (4.31:1 against `--bg-panel`).
Relative luminance: 0.4396
Constraint note: Saturated purples may not be used as text. They may appear as non-text 3D decorative lighting only.
Text pairings documented above.

### --accent-green

Dark mode: `#7ED4A0`
Light mode: (unset)
Semantic note: Sage green magical accent. Success states, puzzle-solved feedback, item-combination success messages.
Relative luminance: 0.5404
Text pairings documented above.

## Status tokens

### --status-error

Dark mode: `#FF8080`
Light mode: (unset)
Semantic note: Warm soft red. Invalid-combination messages, error states, error overlay headings. Must only be placed on `--bg-panel` (not on `--bg-panel-raised`).
Relative luminance: 0.3827
Constraint note: Error state uses this colour plus a text prefix ("That did not work:") and an `aria-live` announcement. Colour is not the sole error cue.
Approved pairings: `--status-error` on `--bg-panel`: 7.07:1 (AAA pass). Forbidden: `--status-error` on `--bg-panel-raised`: 6.35:1 (fails AAA).

### --status-success

Dark mode: `#7ED4A0` (same as `--accent-green`)
Light mode: (unset)
Semantic note: Alias of `--accent-green` for use in status contexts.

### --status-info

Dark mode: `#C89EFF` (same as `--accent-purple`)
Light mode: (unset)
Semantic note: Alias of `--accent-purple` for informational messages.

## Typography tokens

### --font-ui

Value: `"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif`
Semantic note: All UI text. Menus, overlays, inventory, hints, buttons. Source: Tim Dixon Design System standard stack per `docs/brand.md` Typography section.

### --font-display

Value: `"Georgia", "Times New Roman", serif` (default fallback pending Tim's decision D2)
Semantic note: Atmospheric display text for witch dialogue captions and room entry titles. A more atmospheric serif provides period contrast. Exact display face to be confirmed by Tim (decision D2).

### --font-mono

Value: `"SF Mono", "Fira Code", Menlo, Consolas, "Liberation Mono", monospace`
Semantic note: Code or reference text only. Not used in Sophie's Escape UI at this stage.

## Type scale tokens

### --text-body

Size: 16 px
Weight: 400
Line height: 1.6
Semantic note: Primary body text, inventory item descriptions, hint text, menu copy.

### --text-body-bold

Size: 16 px
Weight: 700
Line height: 1.6
Semantic note: Button labels, emphasis within body text.

### --text-secondary

Size: 14 px
Weight: 400
Line height: 1.5
Semantic note: Secondary labels, subtext, puzzle progress annotations. At the lower size boundary; must only use tokens that pass AAA for normal text (not just large text).

### --text-heading-panel

Size: 24 px
Weight: 900
Line height: 1.3
Semantic note: Dialog/overlay headings (H1 within a dialog, e.g. "Inventory", "Game Paused").

### --text-heading-section

Size: 20 px
Weight: 700
Line height: 1.4
Semantic note: Section headings within overlays (H2).

### --text-cutscene

Size: 20 px
Weight: 400 (or 700 if display serif is chosen)
Line height: 1.6
Semantic note: Witch dialogue captions in cutscenes.

### --text-game-title

Size: 28 px
Weight: 900
Line height: 1.2
Semantic note: Game title on loading screen and main menu. Uses `--accent-amber`.

## Spacing tokens

### --space-touch-target

Value: 44 px
Semantic note: Minimum width and height for all interactive elements. Satisfies WCAG 2.5.5 Target Size Enhanced, Level AAA.

### --space-touch-gap

Value: 8 px
Semantic note: Minimum gap between adjacent touch targets so 44 px areas do not overlap.

### --space-panel-padding

Value: 16 px (24 px on desktop)
Semantic note: Inner padding of all panel and dialog surfaces.

### --space-item-gap

Value: 12 px
Semantic note: Gap between inventory item cards in the grid.

## Border and focus tokens

### --border-panel

Value: 1 px solid `#3A3328`
Semantic note: Subtle border for panels, providing a gentle separation from the canvas behind. The border colour `#3A3328` is a mid-step between `--bg-panel` and `--bg-panel-raised` and is used for visual definition only, not to convey information.

### --border-selected

Value: 2 px solid `--accent-amber` (`#FFA040`)
Semantic note: Border applied to selected inventory item cards. The selection state is conveyed by `aria-pressed="true"` for screen readers; this border is the visual cue for sighted users.

### --focus-ring

Value: 3 px solid `--accent-amber` (`#FFA040`)
Offset: 2 px
Semantic note: Focus indicator for all interactive elements. Amber against dark panel: 8.46:1, exceeds the 3:1 minimum for focus indicator contrast per WCAG 2.4.13 Focus Appearance, Level AAA. The offset of 2 px ensures the ring is not hidden by the element background.

## Animation tokens

### --transition-panel

Value: `0.25s ease-in-out`
Semantic note: Slide-in/out transition for inventory and other panels. Respected-reduced-motion rule: if `prefers-reduced-motion: reduce` is detected, this token is overridden to `0s` so the panel appears instantly.

### --transition-fade

Value: `0.15s ease`
Semantic note: Fade transitions for dialogs. Same reduced-motion override applies.

## Forbidden pairings

The following combinations fail AAA and must not appear in any HTML/CSS layer of the game:

- `--status-error` on `--bg-panel-raised`: 6.35:1. Fails AAA normal text.
- Saturated purple (e.g. `#9B59FF`) as text on any panel surface: 4.31:1 on `--bg-panel`. Fails AAA.
- `--fg-disabled` as body text: 3.47:1. Only permitted on disabled control labels alongside `aria-disabled` or `disabled`.
- Any foreground token on a white or near-white background: this game does not use light surfaces. If a light surface is introduced, all pairings must be recalculated.

## Token summary table

The table below lists all tokens with their dark mode values and relative luminance for quick reference.

`--bg-canvas` `#0A0A0A` luminance 0.00304
`--bg-panel` `#1E1B16` luminance 0.01117
`--bg-panel-raised` `#28241E` luminance 0.01807
`--fg-primary` `#F0EAE0` luminance 0.8271
`--fg-secondary` `#C8BEA8` luminance 0.5195
`--fg-disabled` `#6A6258` luminance 0.14778
`--accent-amber` `#FFA040` luminance 0.4677
`--accent-purple` `#C89EFF` luminance 0.4396
`--accent-green` `#7ED4A0` luminance 0.5404
`--status-error` `#FF8080` luminance 0.3827
