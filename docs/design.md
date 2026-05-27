# Sophie's Escape: The Witch's Castle — Visual Design Specification

Version 1.0, dated 2026-05-23. Author: Simon (designer agent). First-cut pass, awaiting Tim's decisions logged in `.claude/work/018-sophies-escape-setup/simon-decisions-for-tim.md`.

This specification covers the colour palette, typography, iconography, every major UI component, the witch cutscene treatment, and loading and error states. It is written in full text so Tim can navigate it with VoiceOver or JAWS. Where a visual element is described, the text description is the authoritative design record; no visual mockup exists at this stage.

## Brand alignment note

Sophie's Escape is a standalone game with its own visual identity. It does not use the Tim Dixon Design System palette, because the game's dark castle atmosphere needs colours that the brand palette (Navy, Orange, Sky Blue) does not cover. The game introduces a project-specific token set derived from the brief's stated palette. Tim's brand personality — clarity, accessibility, warmth — is carried through structure and spacing rather than brand colours. This decision is item D1 in the decision log and requires Tim's confirmation before Sean implements.

Brand citation: "Design style: minimalist flat vector" and "generous whitespace" (`docs/brand.md`, Design style) are applied to all UI overlays. The 3D game world is atmospheric, not minimalist, but every UI element that sits over it is clean and flat.

## Colour palette

The brief states: "deep stone greys, amber torch light, purple and green magical accents" (`docs/design-brief.md`, Section 4, Visual Style). The tokens below translate that statement into concrete hex values with verified AAA contrast ratios.

The palette has two layers: the game-world layer, which is the 3D scene rendered by the engine, and the UI overlay layer, which is the HTML/CSS that sits above the canvas. All accessibility requirements apply to the UI overlay layer. The game-world layer is rendered 3D geometry and is subject to the same principles but cannot be guaranteed by CSS alone; contrast commitments for 3D text-in-world are documented separately if that feature arises.

### Background tokens

Background tokens define the surfaces that text and icons sit on.

`--bg-canvas`: `#0A0A0A`. The underlying page background behind the 3D canvas. Near-black with no colour tint, so the canvas engine output fills the viewport completely. Not a text surface.

`--bg-panel`: `#1E1B16`. The primary surface for all UI panels: inventory, hints, pause screen, controls overlay, and win screen. Dark warm charcoal with a slight brown-amber undertone, evoking old stone. This is the most common text surface in the game.

`--bg-panel-raised`: `#28241E`. Slightly lighter than `--bg-panel`. Used for list items, selected states, and card-within-panel insets. Provides gentle visual separation without breaking the dark atmosphere.

`--bg-overlay-scrim`: `rgba(10, 10, 10, 0.85)`. Semi-transparent black, placed between the 3D canvas and full-screen overlays (pause, cutscene, win screen) to ensure the overlay text reads against whatever room is visible behind it. The opacity is fixed; it does not vary.

`--bg-focus-ring`: `#FFA040`. The amber token used as the background colour of the focus indicator ring, not as a surface colour. See Focus indicator section.

### Foreground tokens

`--fg-primary`: `#F0EAE0`. Warm off-white. The primary reading colour for all body text, labels, and inventory item names. Slightly cream rather than pure white, which reduces glare against the very dark panel background and feels warmer and more atmospheric. Contrast ratios are documented in the pairings section below.

`--fg-secondary`: `#C8BEA8`. Stone beige. Used for secondary labels, subheadings, puzzle progress indicators, and hint step numbers. Still meets AAA for normal text on all panel surfaces.

`--fg-disabled`: `#6A6258`. Dark stone brown. Used for interactive elements that are unavailable. Not a text colour for body copy; only for control labels on disabled controls. Contrast against `--bg-panel`: 3.47:1. This is deliberately below AAA because disabled controls are communicated primarily through `aria-disabled="true"` and should read as visually subdued. The inaccessibility of disabled text is a documented and accepted pattern in WCAG; the accessible name still conveys the disabled state.

### Accent tokens

Accent tokens are used for headings, highlights, interactive element labels, and magical-theme details.

`--accent-amber`: `#FFA040`. Amber torch light. The primary accent for headings, selected states, and interactive affordances. Contrast against `--bg-panel` (`#1E1B16`): 8.46:1. Contrast against `--bg-panel-raised` (`#28241E`): 7.61:1. Both pass AAA for normal text (7:1). Brand citation: the brief names "amber torch light" as a core palette element (`docs/design-brief.md`, Section 4).

`--accent-purple`: `#C89EFF`. Pastel purple. Used for magical accent text, hint step labels, combine-result messages, and witch dialogue. The lightened, pastel version of purple is used — not a saturated mid-range purple — because saturated purple at the relevant lightness values fails AAA on dark surfaces. Contrast against `--bg-panel`: 8.00:1. Contrast against `--bg-panel-raised`: 7.19:1. Both pass AAA. Note: saturated purples such as `#9B59FF` achieve only 4.31:1 against `--bg-panel` and may not be used as text colours. They may appear only as non-text decorative game effects in the 3D scene.

`--accent-green`: `#7ED4A0`. Sage green. Used for success states, puzzle-solved feedback, and item-combination success messages. Contrast against `--bg-panel`: 9.65:1. Contrast against `--bg-panel-raised`: 8.67:1. Both pass AAA. Note: saturated greens may be used decoratively in the 3D scene without contrast restrictions, since they are not rendered as text. `#00CC66` passes at 8.04:1 and may be used for non-background-panel text if Tim approves the slightly brighter tone (decision D5 in the decision log).

### Status tokens

`--status-error`: `#FF8080`. Warm soft red. Used for invalid-combination messages and error states. Contrast against `--bg-panel`: 7.07:1, which passes AAA for normal text. Contrast against `--bg-panel-raised`: 6.35:1, which does not pass AAA. For this reason, error text must always be placed directly on `--bg-panel`, not on `--bg-panel-raised`. Error state is communicated by this colour plus a text prefix ("That did not work:") and an `aria-live` announcement, so colour is not the only cue.

`--status-success`: `#7ED4A0`. Reuses the green accent. See above.

`--status-info`: `#C89EFF`. Reuses the purple accent for informational messages.

### All contrast pairings documented

The table below lists every foreground-on-background pairing and the verified AAA contrast ratio. AAA requires 7:1 for normal text and 4.5:1 for large text (18 px or above, or 14 px bold or above).

Foreground `--fg-primary` (`#F0EAE0`, luminance 0.8271) on `--bg-panel` (`#1E1B16`, luminance 0.01117): ratio 14.34:1. Passes AAA normal text.

Foreground `--fg-primary` on `--bg-panel-raised` (`#28241E`, luminance 0.01807): ratio 12.89:1. Passes AAA normal text.

Foreground `--fg-primary` on `--bg-overlay-scrim` (treated as `#0A0A0A`, luminance 0.00304): ratio 16.54:1. Passes AAA normal text.

Foreground `--fg-secondary` (`#C8BEA8`, luminance 0.5195) on `--bg-panel`: ratio 9.31:1. Passes AAA normal text.

Foreground `--fg-secondary` on `--bg-panel-raised`: ratio 8.39:1. Passes AAA normal text.

Foreground `--accent-amber` (`#FFA040`, luminance 0.4677) on `--bg-panel`: ratio 8.46:1. Passes AAA normal text.

Foreground `--accent-amber` on `--bg-panel-raised`: ratio 7.61:1. Passes AAA normal text.

Foreground `--accent-purple` (`#C89EFF`, luminance 0.4396) on `--bg-panel`: ratio 8.00:1. Passes AAA normal text.

Foreground `--accent-purple` on `--bg-panel-raised`: ratio 7.19:1. Passes AAA normal text.

Foreground `--accent-green` (`#7ED4A0`, luminance 0.5404) on `--bg-panel`: ratio 9.65:1. Passes AAA normal text.

Foreground `--accent-green` on `--bg-panel-raised`: ratio 8.67:1. Passes AAA normal text.

Foreground `--status-error` (`#FF8080`, luminance 0.3827) on `--bg-panel`: ratio 7.07:1. Passes AAA normal text. Must not be placed on `--bg-panel-raised` (6.35:1, fails AAA).

Foreground `#000000` (black) on `--accent-amber` (`#FFA040`): luminance of amber is 0.4677, ratio = (0.4677+0.05)/(0+0.05) = 10.35:1. Passes AAA. Used for button labels on amber-background buttons.

Stop condition note: the brief's magical accent colours pass AAA only in their pastel form for UI text. Saturated purple and bright saturated magic colours cannot be used as text on dark surfaces and pass AAA only as large decorative text (at 4.5:1) or as non-text 3D scene elements. This is not a blocking stop condition; the pastel tokens meet the brief's intent. It is documented here and in the decision log (item D4) so Tim understands the constraint.

## Typography

Brand citation: `docs/brand.md` Typography section establishes Roboto as the primary face for Tim Dixon projects, with the full stack: `"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif`.

The game has two typographic roles: UI text and atmospheric display text.

### UI typography

All menus, overlays, inventory labels, hint text, and button labels use the Tim Dixon standard sans-serif stack:

`font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif`

Roboto is a screen-reader-friendly humanist sans-serif. It is already self-hosted in the Tim Dixon Design System at `docs/design-system/fonts/`. Decisions about whether to carry those font files into the Sophie's Escape repository or serve them from the design system location are for Jacob and Sean. This design records the font choice only.

Type scale for UI:

- Body text / inventory labels / hint text: 16 px, weight 400, line height 1.6. 16 px is one step above the design system's 15 px baseline to aid readability for the target age nine-plus audience.
- Button labels: 16 px, weight 700, all caps is not used. Sentence case throughout.
- Secondary labels / subtext: 14 px, weight 400, line height 1.5. Secondary labels sit at the threshold of "large text" under WCAG; they must always use foreground tokens that pass AAA for both normal and large text sizes.
- Headings within overlays (H2): 20 px, weight 700.
- Panel titles (H1 within a dialog): 24 px, weight 900.

### Display typography for headings and cutscene text

The brief calls for an "atmospheric" style (`docs/design-brief.md`, Section 4: "stylised, slightly storybook-spooky visual style"). A display face would reinforce the atmosphere for room titles and witch dialogue captions.

Decision D2 in the decision log puts three options to Tim: system stack only; self-hosted display face (for example a serif like Cinzel or a gothic slab like UnifrakturMaguntia licensed under the SIL Open Font Licence); or a Google Fonts web load (which adds a third-party dependency).

Until Tim decides, the fallback is: `"Georgia", "Times New Roman", serif` for cutscene captions and room entry titles. This already provides a slightly more period-appropriate serif contrast to the sans-serif UI. Georgia renders cleanly at all sizes and in all screen readers.

Cutscene caption text size: 22 px, weight 700 (if Roboto or system sans), or 22 px, weight 400 (if a display serif is chosen, since serifs carry visual weight at lighter weights). Line height 1.5. Placed on `--bg-overlay-scrim`. Contrast documented: `--fg-primary` on `--bg-overlay-scrim` is 16.54:1, passes AAA.

### Text spacing rule

All text blocks observe: letter-spacing at least 0.12em, word-spacing at least 0.16em, line height at least 1.5 times the font size, and paragraph spacing at least 2em. This satisfies WCAG 2.2 criterion 1.4.12 Text Spacing. These values are set through CSS custom properties so they can be overridden by user stylesheets.

## Iconography

Brand citation: `docs/brand.md` Design style: "flat: no gradients, no drop shadows, no 3D effects." "consistent flat vector style for icons."

All game UI icons are flat line icons, not filled. Line weight: 2 px stroke at 24 px icon size, scaling proportionally. This approach:

- Reads clearly at small sizes on mobile screens.
- Works in a single colour, so every icon can be recoloured using `currentColor` and inherits the foreground token.
- Is distinct from filled icons, making it easier for a developer to source a consistent icon set.

Recommended icon set: Lucide Icons (open source, MIT licence, consistent 24 px grid, line-only). Decision D6 in the decision log asks Tim to confirm the icon set.

### Touch target sizing

All interactive icons are placed inside a visible or invisible touch target of at least 44 by 44 CSS pixels. This satisfies WCAG 2.2 criterion 2.5.5 Target Size Enhanced (AAA). The icon itself may be 24 px, but the surrounding interactive area is padded to 44 px minimum. For example, a 24 px inventory icon sits inside a `<button>` element styled to `min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center;`.

Adjacent touch targets are spaced at least 8 px apart so that the 44 px hit areas do not overlap.

### Icon list and accessible names

Each icon has a visible label where space permits, and an `aria-label` on the button element when the label is not visible. Screen readers announce the `aria-label`, not the icon. The icon itself carries `aria-hidden="true"` so it is not announced separately.

Inventory toggle button: icon is an open satchel bag. `aria-label="Open inventory"` when closed, `aria-label="Close inventory"` when open. The `aria-expanded` attribute reflects the current state.

Hint button: icon is a question mark inside a circle. `aria-label="Show hint"`.

Pause button: icon is two vertical bars. `aria-label="Pause game"`.

Resume button: icon is a right-pointing triangle. `aria-label="Resume game"`.

Settings button: icon is a gear. `aria-label="Game settings"`.

Combine button: icon is two overlapping circles with a plus symbol. `aria-label="Combine selected items"`.

Close / dismiss button: icon is an X. `aria-label="Close"` for overlays; specific context added where clarity requires, for example `aria-label="Close inventory"`.

Map button (if a room map is implemented): icon is a folded map. `aria-label="Open map"`.

## Inventory user interface

The inventory is the most complex interactive component. It is a slide-in panel, accessible by pressing `I` (keyboard) or tapping the inventory button.

### Semantic structure

The inventory panel is a `<dialog>` element with `role="dialog"`, `aria-labelledby` pointing to the inventory heading, and `aria-modal="true"`. This gives screen readers the correct context immediately on open. The heading inside the dialog is an `<h2>` reading "Inventory".

When the inventory opens, focus moves to the dialog element itself, then the first item in the inventory grid is focused. When the inventory closes, focus returns to the element that opened it (the inventory toggle button). This is the WAI-ARIA modal dialog focus management pattern.

### Closed state

When the inventory is closed, only the inventory toggle button is visible: a 44 by 44 px button in the bottom-right corner of the screen on desktop, and the bottom-centre on mobile. The button shows the satchel icon and the word "Inventory" as a visible label on desktop; the icon alone on mobile (with the full `aria-label`). The button sits above the game canvas with `position: fixed`.

### Open state

The inventory panel slides in from the right on desktop (width 320 px, full screen height), and from the bottom on mobile (full screen width, up to 60% of screen height with scroll if needed). The slide animation respects `prefers-reduced-motion`: if the user has requested reduced motion, the panel appears instantly without sliding.

Panel header: the heading "Inventory" at `--accent-amber`, 24 px, weight 900. A close button (`aria-label="Close inventory"`) at the right of the header.

Item grid: items are displayed in a grid of cards, four columns on desktop and three on mobile. Each card shows an item icon (40 px, flat line icon) and the item name below it in 14 px text. Cards use `<button>` elements with `aria-pressed="false"` (unselected) or `aria-pressed="true"` (selected). The accessible name of each button is the item name, for example "Candle".

Selected item state: the card background changes from `--bg-panel-raised` to a stroke border in `--accent-amber` (2 px border). The selected card also shows a small amber checkmark icon in its top-right corner, providing a visual state cue that is not colour-only (satisfying WCAG 1.4.1). The `aria-pressed="true"` state conveys this to screen readers.

Empty inventory: when no items have been collected, the grid area shows the text "You have not found any items yet." at `--fg-secondary`, centred, with no icon. This is plain text so screen readers announce it on inventory open.

### Combine flow

Combine works by selecting two or more item cards (each toggling `aria-pressed`), then activating the Combine button. The Combine button is below the grid. It is enabled only when two or more items are selected; otherwise it is disabled (`disabled` attribute, not just `aria-disabled`).

When Combine is activated with a valid combination: an `aria-live="polite"` region at the bottom of the panel announces "Combined: [item name created]." The new item appears in the grid. The original items are removed.

When Combine is activated with an invalid combination: the live region announces "That combination did not work. Try something different." No penalty, no item loss. The error message text colour is `--status-error` on `--bg-panel`, at the documented 7.07:1 ratio.

### Keyboard shortcuts in inventory

`Tab` moves focus through inventory items and buttons in DOM order. `Space` or `Enter` selects or deselects an item (toggles `aria-pressed`). `Enter` activates a button (Combine, Close). `Escape` closes the inventory and returns focus to the inventory toggle button.

The single-character shortcut `I` that opens and closes the inventory from the game view is not a conflict with screen reader shortcuts because it only fires when the game canvas has focus, not when a form element or screen reader virtual buffer is active. However, in line with WCAG 2.1.4, the shortcut must be configurable. Decision D7 in the decision log asks Tim whether a settings screen to remap shortcuts is in scope for this version.

## Hint user interface

The hint system is described in the brief as a three-step cascade (`docs/design-brief.md`, Section 6.6). The design treats it as an accessibility feature as well as a gameplay feature.

### Semantic structure

The hint panel is a `<dialog>` element with `aria-labelledby` pointing to a heading "Hint". It opens modally over the game but not over the inventory (only one dialog is open at a time).

### Opening the hint

The player presses `H` or activates the Hint button. A dialog opens. The dialog heading reads: "Hint for this puzzle". Below the heading, the current hint step is shown.

### Three-step cascade

Step 1 (always available): the first hint is shown immediately. The text is displayed in `--fg-primary`, 16 px. An annotation in `--fg-secondary` reads "Hint 1 of 3".

Step 2: below the step 1 text, a button reads "Show next hint". When the player activates it, the step 2 text fades in below (or appears instantly under `prefers-reduced-motion`). The annotation updates to "Hint 2 of 3". The button changes to "Show final hint".

Step 3: activating "Show final hint" reveals the step 3 text. The annotation reads "Hint 3 of 3". The button is removed.

Each step is narrated by `aria-live="polite"` so VoiceOver and JAWS announce the new hint text without the player moving focus. The live region is a `<div>` inside the dialog.

### Focus and screen-reader narration

When the hint dialog opens, focus moves to the dialog. The heading is announced, then the first hint text is read by the screen reader as it is the next focusable element in the dialog. Each time a new hint step is revealed, the live region announces it. When the dialog closes (via the Close button or `Escape`), focus returns to the Hint button.

### Close affordance

A visible close button (`aria-label="Close hint"`) is in the top-right of the dialog. `Escape` also closes the dialog. This satisfies WCAG 1.4.13 (content on focus is dismissable) and the general dialog keyboard pattern.

## Pause user interface

Pause is triggered by pressing `Escape` during gameplay, or by tapping the Pause button.

### Semantic structure

The pause screen is a full-screen overlay using `<dialog>` with `aria-modal="true"` and `aria-labelledby` pointing to a heading "Game Paused". The overlay sits on top of `--bg-overlay-scrim` (85% black) which dims the game view behind it.

### Layout

Heading: "Game Paused" at `--accent-amber`, 24 px, weight 900, centred.

Four buttons, stacked vertically, centred, each 44 px tall and at least 200 px wide:

1. Resume (`aria-label="Resume game"`)
2. Hint (`aria-label="Show hint for current puzzle"`)
3. Settings (`aria-label="Open game settings"`)
4. Exit to Main Menu (`aria-label="Exit to main menu"`)

Button visual style: `--bg-panel-raised` background, `--fg-primary` text, `--accent-amber` border (2 px). Hover state (pointer) and focus state use `--accent-amber` as the background, `#000000` as the text (contrast 10.35:1), meeting AAA for both states.

Focus order: when the pause overlay opens, focus moves to the "Resume" button (the first and most likely action). Tab cycles through the four buttons. Escape closes the pause screen and resumes gameplay.

### Settings within pause

Settings is a sub-panel, not a separate screen. It opens as a second level within the same dialog (a section that slides into view, not a new dialog). This keeps the focus trap intact. Settings contains:

- Master volume slider (`<input type="range">` with an associated `<label>` "Volume", current value announced via `aria-valuetext`).
- Mute toggle (`<button>` with `aria-pressed`).
- Reduced motion note: a read-only text note stating whether the operating system's reduced-motion preference is active. No toggle is provided; respecting the OS setting is automatic.

A back button returns to the main pause menu.

## Controls overlay

The controls overlay is a reference screen available from the main menu and optionally from the pause screen. It is a `<dialog>` with heading "Controls".

### Content

The controls are presented as a definition list (`<dl>`) of action-name pairs, grouping keyboard and touch controls:

- Moving: W/S or Arrow keys (keyboard); Swipe or on-screen joystick (touch)
- Looking around: Mouse move (keyboard/mouse); Drag finger (touch)
- Interact: E key or Enter (keyboard); Tap object (touch)
- Open inventory: I key (keyboard); Inventory button (touch)
- Select inventory item: Tab then Space or Enter (keyboard); Tap item (touch)
- Combine items: Select items then Enter (keyboard); Select items then Combine button (touch)
- Show hint: H key (keyboard); Hint button (touch)
- Pause: Escape (keyboard); Pause button (touch)
- Navigate menus: Tab then Enter (keyboard); Tap (touch)

The definition list renders clearly in VoiceOver and JAWS in description list mode. Each `<dt>` is the action name, each `<dd>` is the keyboard and touch instruction.

## Witch cutscene visual treatment

The brief describes the witch as appearing in a "stylised, slightly storybook-spooky visual style" (`docs/design-brief.md`, Section 4). The cutscene is a full-screen overlay.

### Structure

The cutscene overlay is a `<dialog>` with `aria-labelledby` pointing to a visually hidden heading "The witch appears". The heading is present in the DOM for screen readers but not shown visually (CSS `clip: rect(0,0,0,0)` pattern, not `display: none`). The dialog has `aria-modal="true"`.

### Visual layout (described in text)

The cutscene fills the screen. The background is `--bg-overlay-scrim`. In the upper two-thirds of the screen, the witch illustration is displayed (a static image for this version, or a sprite animation if resources allow). The illustration is described by an `alt` attribute on the `<img>` element: "The witch leans over her crystal ball, watching Sophie with a cold smile." This description varies per cutscene line if illustrations vary; Sean should parameterise the alt text alongside the witch dialogue.

The witch dialogue text appears in the lower third of the screen, in a text box with `--bg-panel` background, `--fg-primary` text, 20 px, weight 400, line height 1.6. The dialogue is wrapped in a `<p>` element inside an `aria-live="assertive"` region so that screen readers interrupt their current announcement to read the witch's line (the assertive level is justified here because the cutscene halts gameplay and the witch's dialogue is the primary content). The assertive live region should contain only the dialogue text, not the heading or decorative text.

Caption/subtitle equivalent: the dialogue text serves as the caption for any audio (witch voice or sound sting). If voiced audio is added, the text on screen satisfies WCAG 1.2.2 Captions (Prerecorded) and 1.2.4 Captions (Live equivalent is not applicable). The text must remain on screen for the full duration of any audio.

After the dialogue display, a button "Continue" appears (or is automatically triggered after a fixed timer with an accessible countdown, decision D8). The button is focused automatically once it appears. Pressing Enter or Space dismisses the cutscene and resumes gameplay.

### Art treatment decision

Decision D3 in the decision log presents three art treatment options to Tim: storybook flat illustration, painted/textured illustration, and pure line art. This design holds the structural specification constant across all three; the art decision affects the source image files only, not the semantic structure.

## Loading state

Loading states occur on initial game load and when transitioning between rooms (if asynchronous asset loading is needed).

### Initial load screen

The initial load screen is a full-page `<div role="status" aria-live="polite" aria-label="Loading Sophie's Escape">`. It contains:

- The game title "Sophie's Escape: The Witch's Castle" as a visually styled heading (`<h1>`), in `--accent-amber`, 28 px, weight 900.
- A loading progress text: "Loading... please wait." The screen reader will announce this on page load via the live region. When loading completes, the text changes to "Ready." and the game fades in.
- A visible progress indicator: a horizontal bar, 300 px wide on desktop (full width minus 32 px padding on mobile), 8 px tall, with `--bg-panel-raised` as the track and `--accent-amber` as the fill. The bar has `role="progressbar"`, `aria-valuenow` updated as loading proceeds, `aria-valuemin="0"`, `aria-valuemax="100"`, and `aria-label="Loading progress"`.

The loading screen background is `--bg-canvas` (`#0A0A0A`). The heading and progress bar are centred vertically and horizontally.

### Room transition loading

If a room requires asynchronous asset loading, a brief transition overlay appears: `--bg-overlay-scrim` covers the screen, and an `aria-live="polite"` region announces "Moving to [room name]." The room name is injected dynamically. This prevents a jarring visual cut and gives screen reader users context about the transition.

## Error state

An error state occurs if a game asset fails to load or if session state is lost unexpectedly.

### Error overlay

The error overlay is a `<dialog>` with `aria-labelledby` pointing to the heading "Something went wrong", `aria-modal="true"`. Focus moves to the dialog on open.

Heading: "Something went wrong" in `--status-error` (`#FF8080`), 24 px, weight 900. The heading is on `--bg-panel`; contrast is 7.07:1, passes AAA.

Body text: "The game ran into a problem. Your progress in this session should be saved. Choose an option below." in `--fg-primary`, 16 px.

Buttons:
- "Try again" — attempts to reload the failed asset.
- "Return to main menu" — navigates to the main menu. Session state is preserved.

The error state never leads to data loss without warning. This satisfies WCAG 3.3.6 Error Prevention (All) at AAA.

## Focus indicator specification

All interactive elements show a visible focus indicator that meets WCAG 2.4.13 Focus Appearance (AAA). The requirements under 2.4.13 are: the focus indicator must have a minimum area equal to the perimeter of the unfocused component multiplied by 2 px, and must have a contrast ratio of at least 3:1 between the focused and unfocused states.

The game uses a thick amber ring:

- Outline: 3 px solid `--accent-amber` (`#FFA040`).
- Offset: 2 px (so the ring sits outside the element boundary, preventing it from being hidden by the element's background).
- The contrast between `--accent-amber` and `--bg-panel` is 8.46:1, exceeding the 3:1 minimum for focus indicator contrast.
- The contrast between `--accent-amber` and `--bg-canvas` is also well above 3:1 (amber luminance 0.4677, canvas luminance 0.00304: ratio = (0.4677+0.05)/(0.00304+0.05) = 9.66:1).

The focus indicator must never be hidden by a sticky header, a fixed overlay, or a `z-index` conflict. Sean must verify this in Carol's accessibility test.

## Light mode note

The brief's dark atmospheric setting does not include a light mode for gameplay. The game is fixed in dark mode. All UI overlays use the dark palette documented here, which already achieves AAA in a light-on-dark scheme.

The exception is the main menu, which could adopt a lighter treatment if Tim decides the entry experience should feel more welcoming. Decision D9 in the decision log asks Tim whether the main menu uses the dark game palette or a slightly lighter surface while retaining AAA contrast.

If a light mode is added in a future version, all tokens in `docs/design-system/tokens.md` already have light-mode variant slots, ready for values. This design does not populate them.
