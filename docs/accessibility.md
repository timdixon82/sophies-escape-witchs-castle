# Project Accessibility: Sophie's Escape, The Witch's Castle

This page records Sophie's Escape's WCAG 2.2 AAA interpretation. The global standard is at `docs/accessibility.md` in the team repository. This page records only what is specific to this project: how each criterion applies to a browser-based 3D game, which features serve as accessibility features, the contrast claims cross-referenced to the design tokens, and the exceptions.

All references to design tokens and contrast ratios are sourced from `docs/design-system/tokens.md` (the design token source of truth) and `docs/design.md` (the visual design specification).

## Scope of WCAG 2.2 AAA in a browser game

Sophie's Escape is a browser-based game. The WCAG success criteria apply to all HTML and CSS layers: menus, overlays, dialogs, and the on-screen UI. They do not formally extend to the interior of a WebGL or Three.js canvas, because a rendered canvas is a single image element to the browser. The team's commitment is:

- Every user interface element outside the canvas meets WCAG 2.2 AAA.
- The canvas itself carries `aria-label="Sophie's Escape game view"` and `role="application"` so screen readers know its purpose and character.
- All gameplay actions that require the canvas (moving, looking, interacting with objects) have keyboard equivalents that work through the canvas focus or through UI overlays, not through canvas-internal mouse events alone.
- Any text or label rendered inside the canvas as 3D world geometry (room name plates, book text, etc.) is also available as HTML text in an accessible overlay or in the game's state narration, so the canvas rendering is not the sole source of that information.

## Keyboard parity

Criterion 2.1.3 Keyboard (No Exception), Level AAA, requires full keyboard operation with no exceptions.

Every interactive control in Sophie's Escape is reachable from the keyboard and operable without a pointer. The full controls map is in `docs/design.md`, Controls overlay section, and in the brief at `docs/design-brief.md`, Section 9 Controls Reference.

Logical tab order within each overlay:

- Main menu: New Game, Continue, Credits, Controls.
- Inventory dialog: inventory items in grid order (left to right, top to bottom), Combine button, Close button.
- Hint dialog: hint text (read-only, focusable as a block), Show next hint button (when available), Close button.
- Pause dialog: Resume, Hint, Settings, Exit to Main Menu; within Settings: Volume slider, Mute toggle, Back.
- Controls overlay: Close button only (content is read-only).
- Witch cutscene dialog: Continue button.
- Error dialog: Try again, Return to main menu.

Focus order is set by DOM order, not by `tabindex` values greater than 0. Using `tabindex="0"` on non-interactive elements and `tabindex="-1"` for programmatic focus is the only accepted use of tabindex.

Movement in the 3D game world uses W/S/Arrow keys when the canvas element has focus. The canvas element receives focus via Tab from the page. If a screen reader user is playing in browse mode, the movement keys are consumed by the screen reader rather than the game. The resolution is that screen reader users engage with the game through keyboard overlays (inventory, hints, pause) rather than real-time 3D navigation; the narrative state system (room description, inventory state) provides equivalent content. This is documented as an exception if it falls short of 2.1.3; see the Exceptions section.

## Touch parity

Criterion 2.5.5 Target Size Enhanced, Level AAA, requires pointer targets of at least 44 by 44 CSS pixels.

All interactive elements in the UI overlays have a minimum touch target of 44 by 44 CSS pixels. This includes inventory item cards, hint reveal buttons, pause menu buttons, settings controls, and all dialog close buttons. The inventory toggle button and the hint and pause buttons that sit over the game canvas are also 44 by 44 px minimum.

On-screen joystick and swipe controls for 3D navigation are provided for touchscreen players as an alternative to physical keyboard movement. These are rendered in the canvas layer and do not have WCAG target-size requirements, but are designed to be large enough for comfortable use by the target age nine-plus audience.

## Contrast claims cross-referenced to design tokens

All contrast ratios are documented in `docs/design-system/tokens.md`. The key pairings relevant to accessibility conformance are:

Primary text (`--fg-primary` `#F0EAE0`) on primary panel surface (`--bg-panel` `#1E1B16`): 14.34:1. Passes AAA for normal text (7:1 minimum). This is the pairing for all body copy, inventory labels, hint text, and menu copy.

Primary text on raised panel surface (`--bg-panel-raised` `#28241E`): 12.89:1. Passes AAA for normal text.

Primary text on overlay scrim (`#0A0A0A`): 16.54:1. Passes AAA for normal text.

Secondary text (`--fg-secondary` `#C8BEA8`) on `--bg-panel`: 9.31:1. Passes AAA for normal text.

Secondary text on `--bg-panel-raised`: 8.39:1. Passes AAA for normal text.

Amber accent (`--accent-amber` `#FFA040`) on `--bg-panel`: 8.46:1. Passes AAA for normal text. Used for headings, selected-state labels, and interactive affordances.

Amber accent on `--bg-panel-raised`: 7.61:1. Passes AAA for normal text.

Purple accent (`--accent-purple` `#C89EFF`) on `--bg-panel`: 8.00:1. Passes AAA for normal text. Used for hint annotations, magical theme text.

Purple accent on `--bg-panel-raised`: 7.19:1. Passes AAA for normal text.

Green accent (`--accent-green` `#7ED4A0`) on `--bg-panel`: 9.65:1. Passes AAA for normal text. Used for success feedback and puzzle-solved messages.

Green accent on `--bg-panel-raised`: 8.67:1. Passes AAA for normal text.

Error status (`--status-error` `#FF8080`) on `--bg-panel`: 7.07:1. Passes AAA for normal text. The error token must not be used on `--bg-panel-raised` (6.35:1, fails AAA).

Black (`#000000`) on amber (`--accent-amber` `#FFA040`): 10.35:1. Passes AAA. Used for button labels on amber-background interactive states.

Focus ring (`--accent-amber` `#FFA040`) against `--bg-panel`: 8.46:1. Exceeds the 3:1 minimum for focus indicator contrast (WCAG 2.4.13 AAA).

## The hint system as an accessibility feature

The hint system is not only a gameplay aid. It also meets WCAG 3.3.5 Help (Level AAA), which requires context-sensitive help to be available.

Each puzzle has three hints accessible at any time, with no cost or penalty. The first hint is shown on first open; subsequent hints require a deliberate action to reveal. This design prevents accidental spoilers while keeping help available at all times.

The hint system is documented as meeting the cognitive accessibility goal of the brief: "no lives, no death, no game over" (`docs/design-brief.md`, Section 11). Players who are stuck always have a path forward. For players with cognitive or learning differences, the escalating hint cascade (subtle nudge, more specific direction, near-solution guidance) provides graduated support without stigma.

Screen reader narration of hints: each hint is announced via `aria-live="polite"` when revealed. The player does not need to re-focus to hear the new hint. See `docs/design.md`, Hint user interface section.

## Pause and save as an accessibility feature

The pause system meets WCAG 2.2.3 No Timing, Level AAA, because the game imposes no session time limit. A player can pause at any moment and return to exactly the same state.

The witch's periodic appearances add atmospheric time pressure, but they have no mechanical consequence and do not interact with session state. The witch does not punish the player; she adds atmosphere only.

Pause and resume is important for players who need more time, who use screen readers (which read more slowly than visual scanning), who have motor or fatigue conditions that require breaks, and who play in short sessions across multiple sittings.

Session-based save state (`docs/design-brief.md`, Section 8) is implemented through browser storage, not a server. The state persists as long as the browser session is active. This is sufficient for the game's 30 to 60 minute estimated play time. If the browser is closed or the session ends, the state is lost. This limitation is acceptable for a game of this length but should be communicated to the player on the main menu ("Your progress is saved automatically while the game is open in this browser tab. Closing the tab will reset your progress.").

## No lives and no failure states as cognitive accessibility

The decision to eliminate lives and game-over states (`docs/design-brief.md`, Section 11) is a cognitive accessibility decision as well as a design choice.

Repeated failure and reset states increase cognitive load and can be distressing for players with anxiety, attention difficulties, or processing differences. Sophie's Escape replaces punishment with exploration. Every wrong action is reversible. Every hint is available. The only pressure is the witch's appearances, which are atmospheric and non-punishing.

This directly satisfies the intent of WCAG 2.2.3 No Timing (no time limits that cause failure) and the broader principle of designing for the widest range of cognitive abilities.

## Audio plus visual cue requirement

The brief requires "sound design with visual cues accompanying audio events where possible" (`docs/design-brief.md`, Section 3, Accessibility). This satisfies WCAG 1.1.1 Non-text Content (Level A) and moves toward 1.4.2 Audio Control (Level A) and the principle of not relying on audio alone.

Implementation requirements for each audio event:

- Footsteps: no accompanying UI cue needed; they are ambient and not informational.
- Witch cackle (cutscene): the witch cutscene overlay is the visual cue. The dialogue text on screen is the caption.
- Cauldron bubbling: ambient; no UI cue needed unless tied to a puzzle event.
- Door opening: if a door opens as a puzzle result, the transition animation to the new room is the visual cue.
- Item picked up: a visual confirmation message in an `aria-live` region ("Picked up: [item name]") is shown. This is both the visual and screen-reader cue.
- Puzzle solved: a full-screen or panel success message ("Puzzle solved!") in `--accent-green`, with `aria-live="polite"` announcement.
- Witch appearing: the cutscene overlay is the visual cue. Sound alone must never be the first notification.
- Inventory open/close: the inventory panel sliding open or closed is the visual cue.
- Escape / win: a win screen is displayed.

All audio must respect the master volume setting in the pause menu and the browser's own audio settings. The game must not auto-play audio before the player has interacted with the page (required by browser autoplay policies and by WCAG 1.4.2).

## Descriptive subtitles and captions for witch cutscenes

Witch cutscene dialogue is displayed as on-screen text (`<p>` inside an `aria-live="assertive"` region) for the duration of the cutscene. This text serves as:

- A caption for any witch voice audio, satisfying WCAG 1.2.2 Captions (Prerecorded).
- The primary content for screen reader users, who may not hear or interpret audio.
- A subtitle for players in noisy environments, players who are deaf or hard of hearing, and players who prefer to read.

The caption text must match the witch dialogue exactly (not a paraphrase). It must remain visible for the full duration of the witch's audio line. After the audio ends, the caption remains until the player dismisses the cutscene.

Font: `--fg-primary` text, 20 px, on `--bg-panel` background, line height 1.6. Contrast: 14.34:1, passes AAA.

Extended audio description: if the cutscene includes visual action (crystal ball glowing, witch gesturing) that conveys story information not captured in the dialogue, an extended audio description `aria-describedby` attribute should link to a description block. For this first version, the witch illustrations are static or minimally animated and the dialogue carries all narrative content, so extended description is not required. If animations are added, this must be revisited.

## Screen reader narration of inventory state

When the inventory dialog opens, VoiceOver or JAWS reads: the dialog heading "Inventory", then the inventory items in grid order. Each item is announced as its button accessible name, for example "Candle, not selected" or "Old key, selected".

When an item is picked up during gameplay, an `aria-live="polite"` region outside the canvas announces "Picked up: [item name]." This region is always present in the DOM but empty until an event fires. It is positioned off-screen (not `display: none`) so it is in the accessibility tree.

When an item is used or consumed, the region announces "Used: [item name]." When items are combined, it announces "Combined [item 1] and [item 2]: [result item name] created."

## Screen reader narration of room state

When Sophie enters a room, an `aria-live="polite"` region announces a brief room description. These descriptions are pre-written for each of the ten rooms and injected when the room loads. Example for Room 1: "You are in the Dungeon Cell. Stone walls surround you. There is a heavy iron door to the north. You can see a pile of straw in the corner." These descriptions serve as the audio description for the 3D environment.

The room state region does not re-announce on every camera movement, only on room transition. This prevents screen reader flooding.

An accessible room name heading (`<h2>`, visually hidden, present in accessibility tree) is updated on each room transition, for example "Dungeon Cell". This appears in the VoiceOver heading list and allows keyboard navigation to the room name as a landmark.

## Screen reader narration of puzzle progress

Puzzle progress is narrated in two situations:

When a puzzle step is completed: an `aria-live="polite"` region announces "Puzzle progress updated. [Brief description of what changed]." For example: "The cabinet lock is now open."

When a puzzle is fully solved: an `aria-live="assertive"` region announces "Puzzle solved: [puzzle name]. [Brief description of what is now available]." For example: "Puzzle solved: Library cabinet. The cabinet is open. You can now take the scroll."

These announcements are also shown as brief on-screen text in the `--accent-green` colour.

## Exceptions

### Exception SE-001: Screen reader users and real-time 3D navigation

Criterion: 2.1.3 Keyboard (No Exception), Level AAA.

Reason: Real-time 3D navigation (WASD movement, mouse-look) in a Three.js or Babylon.js canvas cannot be operated by a screen reader user in virtual browse mode. The screen reader intercepts keyboard input at the OS level. The canvas `role="application"` attribute passes keys through in application mode, but many screen reader users work primarily in browse mode.

Mitigation: The game's narrative content (room descriptions, item discovery, puzzle progress, cutscene dialogue) is fully available through accessible `aria-live` regions and the visual overlay system. Screen reader users can engage with the inventory, hints, and all overlay systems using standard dialog keyboard patterns. The experience is not identical to sighted 3D navigation, but all story content and puzzle content is reachable. A future version may add a text-adventure mode as a fully accessible alternative play mode.

Tim's approval: Approved 2026-05-27 (Q213A). Exception record filed at `docs/exceptions/SE-001-3d-navigation.md`.

## CI accessibility tooling

### Pa11y AppArmor fix for Ubuntu 24.04 runners

Pa11y 9.x is built on Puppeteer. On Ubuntu 24.04 GitHub Actions runners, AppArmor blocks the default sandboxed Chromium launch. The fix is `pa11y.json` at the project root with `chromeLaunchConfig.args` set to `["--no-sandbox", "--disable-setuid-sandbox"]`. Pa11y reads this file automatically from the working directory. No CLI flag is needed; the older `--chromium-flags` argument is not the correct key for Pa11y 9.x. This is the same pattern used in Poop-Breakout (commit `bd6c732`).

### Manual screen-reader evidence

Manual VoiceOver and JAWS evidence passes are not required for this project. Tim Dixon has directed that automated accessibility checks (axe-core, Pa11y, WCAG 2.2 AAA code review) are sufficient. The 3D game view is `aria-hidden`; the overlay layer is covered by automated tooling. This decision was made on 2026-05-27 and applies for the lifetime of the project.

The global screen-reader evidence pattern at `docs/patterns/screen-reader-evidence.md` (team repository) is suspended for this project.

### Exception SE-002: Saturated magical accent colours as non-text 3D decoration

Criterion: 1.4.6 Contrast Enhanced, Level AAA.

Reason: Saturated purple and bright green used as lighting effects or particle effects in the 3D canvas (spell glows, magical auras, torch flicker) cannot meet AAA text contrast because they are not rendered as text. The canvas element is a single composited image. These effects are purely decorative and atmospheric; they convey no information that is not also conveyed in text elsewhere.

Mitigation: All informational use of purple and green uses the AAA-compliant pastel tokens `--accent-purple` and `--accent-green` in the HTML overlay layer. The 3D canvas decorative use of saturated colours is clearly separated from informational use.

Tim's approval: Approved 2026-05-27 (Q214A). Exception record filed at `docs/exceptions/SE-002-3d-geometry-colours.md`.
