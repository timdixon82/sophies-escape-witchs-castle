# ADR 005: Input model

## Status

Accepted on 2026-05-23 by Jacob.

## Context

The brief commits to "full keyboard support AND full touchscreen support — must be equally playable on both" (`docs/design-brief.md` section 3). The requirements turn that into hard rules: every puzzle, every item, every hint, every cutscene, and every menu is reachable on touchscreen alone, and the same is true on keyboard alone (NFR-MOB-01, NFR-ACC-01). The brief also lists the desktop-mouse path (mouse-look for the camera, click for interaction), and the controls table at section 9 covers all three.

The architecture has to support all three input devices without the game logic caring which one fired the event. If the puzzle state machine has to check whether it was a keyboard or a touch event, the code becomes a maze of conditionals; the layered split (ADR 002) is undone.

A second pressure: WCAG 2.2 AAA requires full keyboard parity (Success Criterion 2.1.3). Tad's Decision 8 raises the brief's gap that mouse-look has no keyboard equivalent and recommends A/D and arrow keys for looking. The architecture must support a keyboard-only player completing the game.

A third pressure: screen-reader users. A canvas with `role="application"` passes keys through to the game (this is how it works), but most screen-reader users spend time in browse mode, where the screen reader intercepts the same keys the game wants to read. The architecture has to accept that real-time 3D navigation by screen-reader users is a known accessibility exception (`docs/accessibility.md` Exception SE-001, awaiting Tim's approval), and the non-3D parts of the game (menus, inventory, hints, puzzle progress narration) carry the rest of the accessibility weight.

## Decision

### Three input sources, one event bus, one set of intents

The input layer translates raw device events into a small, fixed set of intents. The game logic only sees intents. The intents:

- `MOVE_FORWARD`, `MOVE_BACKWARD` (held; emit until release)
- `LOOK_LEFT`, `LOOK_RIGHT`, `LOOK_UP`, `LOOK_DOWN` (held or value, emit while active)
- `INTERACT` (a one-shot; the focused or hovered object is implied)
- `OPEN_INVENTORY`, `CLOSE_INVENTORY`, `TOGGLE_INVENTORY`
- `OPEN_HINTS`, `CLOSE_HINTS`
- `OPEN_PAUSE`, `RESUME`
- `NEXT_FOCUSABLE`, `PREV_FOCUSABLE` (overlay focus management; only when an overlay is open)
- `ACTIVATE_FOCUSED` (Enter or tap inside an overlay)
- `COMBINE_SELECTED_ITEMS`

The intents are deliberately verb-shaped and small. They cover every action the brief lists in the controls table at section 9 (`docs/design-brief.md`), plus the keyboard-look intents from Tad's Decision 8.

### The input bridge: `src/render/input/`

Three small bridges convert raw events into intents:

- `keyboard-bridge.js` listens for `keydown` and `keyup` on `window`. It maps W and Up arrow to `MOVE_FORWARD`; S and Down arrow to `MOVE_BACKWARD`; A and Left arrow to `LOOK_LEFT`; D and Right arrow to `LOOK_RIGHT`; E and Enter to `INTERACT`; I to `TOGGLE_INVENTORY`; H to `TOGGLE_HINTS`; Escape to `OPEN_PAUSE` or `CLOSE_*` depending on overlay state; Tab and Shift-Tab to `NEXT_FOCUSABLE` and `PREV_FOCUSABLE` when an overlay is open. The bridge respects the focus context: if focus is inside an HTML form field (for example the settings volume slider), the bridge does not forward intents that would conflict with the field's own keys.
- `mouse-bridge.js` listens for pointer events on the 3D canvas. It uses Three.js's `PointerLockControls` for desktop mouse-look, translating mouse movement deltas into `LOOK_*` intents. Click on the canvas emits `INTERACT`. The bridge is enabled only when the game is in gameplay (no overlay open).
- `touch-bridge.js` listens for touch events on the 3D canvas and on the on-screen buttons. It implements a simple drag-to-look gesture (which translates into `LOOK_*` intents at a configurable sensitivity), a tap-to-interact gesture (emits `INTERACT`), and an on-screen joystick or swipe for movement (emits `MOVE_FORWARD` and `MOVE_BACKWARD`). The bridge also handles the on-screen buttons (inventory, hints, pause) which sit at the corners of the canvas (`docs/design.md`, on-screen controls section).

Each bridge dispatches intents through a shared `intentBus`. The bridge has no idea what happens to the intent; the bus has subscribers.

### Intent subscribers

Two subscribers handle the intents:

- The render layer's `FirstPersonController` consumes `MOVE_*`, `LOOK_*`, and `INTERACT`. It updates the camera and runs raycast checks; if an interactable object is under the reticle when `INTERACT` fires, it dispatches a core action (`PICK_UP_ITEM`, `USE_ITEM`, and so on).
- The user-interface layer's `OverlayController` consumes `OPEN_*`, `CLOSE_*`, `TOGGLE_*`, `NEXT_FOCUSABLE`, `PREV_FOCUSABLE`, `ACTIVATE_FOCUSED`, and `COMBINE_SELECTED_ITEMS`. It shows and hides overlay panels and routes focus.

The two subscribers do not know about each other. They share a small piece of state: which overlay (if any) is currently open. That bit of state lives in `src/core/state.js` and is set by `OVERLAY_OPENED` and `OVERLAY_CLOSED` actions (ADR 004). The controllers read it to know whether to consume an intent or ignore it.

### The first-person controller

`src/render/first-person-controller.js` is the most input-aware part of the render layer. It owns:

- The camera position and rotation.
- The collision check (raycast against wall meshes per ADR 002).
- The hover and focus highlight (raycast against interactable meshes).
- The movement integration (intent + delta time → new position, clamped by collision).
- The look integration (intent + delta time → camera euler, clamped to the look range from FR-NAV-02: 160 degrees horizontal, 90 degrees vertical, per Tad's [TAD CALL] in that requirement).
- The reduced-motion respect: when `prefers-reduced-motion: reduce` is set, the look acceleration is removed (movement is linear, no easing) so vestibular sensitivity is reduced. The controller checks `window.matchMedia('(prefers-reduced-motion: reduce)')` on construction and re-checks on `change`.

### Touch-target sizes

The on-screen touch controls (joystick or swipe area, look area, on-screen buttons) follow the brief's accessibility commitment to "touch targets of adequate size". Tad's requirements set this at 44 by 44 CSS pixels (FR-PAUSE-01 [TAD CALL], NFR-MOB-01); the architecture confirms this is enforced by the touch bridge's hit-test boundaries. The visual rendering of those touch areas is Simon's design work; the architecture only commits that the bridge does not register a touch under 44 by 44 CSS pixels as a press.

The on-screen joystick and the look-drag area are larger than 44 by 44 pixels because they are gesture surfaces rather than discrete buttons.

### Keyboard focus in overlays

When an overlay opens, the user-interface layer's `OverlayController` does three things:

1. Sets `tabindex="-1"` on the canvas so it leaves the keyboard tab order while the overlay is shown.
2. Sets focus on the first focusable element inside the overlay.
3. Traps focus inside the overlay: `NEXT_FOCUSABLE` at the last element wraps to the first; `PREV_FOCUSABLE` at the first wraps to the last.

When the overlay closes, focus returns to the previously focused element (the inventory button, the pause button, and so on).

The focus order inside each overlay is recorded in `docs/accessibility.md` (keyboard parity section). The architecture commits to following that order through the overlay's DOM order, not through `tabindex` greater than zero (per the team's standing accessibility rule).

### A note on screen-reader application mode

When a screen-reader user presses the screen reader's "application mode" toggle (VoiceOver Quick Nav off; JAWS Forms Mode on), the canvas's `role="application"` lets keys through to the game. The keyboard bridge works as written. When the screen-reader is in browse mode, the keys are intercepted by the screen reader; the game still works but the player navigates through the overlay layer.

This is recorded as Exception SE-001 in `docs/accessibility.md` and awaits Tim's approval.

## Alternatives considered

### One handler per device

Rejected. A keyboard handler that knows about inventory, a touch handler that knows about inventory, and a mouse handler that knows about inventory would each carry the same logic three times. The intent layer is the single point where the device-specific code meets the game logic.

### Use a third-party input library

Rejected. The team has no existing dependency on an input library and the surface area here is small (about 250 lines across the three bridges). The cost of an external library is not justified.

### Map raw events directly to core actions, skipping intents

Rejected. The intent layer absorbs the inevitable device-specific quirks (touch deltas vs. mouse deltas, key-repeat behaviour, browser-specific Escape handling) without leaking them into the game logic. It also makes a future rebindable-controls feature simple to add: the bridge re-reads its keymap from settings, and nothing else changes.

### Use Three.js's example `FirstPersonControls`

Considered. The Three.js example controller does not handle touch correctly, does not handle keyboard-look (it is mouse-only), and does not respect the WCAG keyboard parity rules. A custom controller is needed; the example is read for reference but not imported.

## Consequences

### Positive

- Game logic (`src/core/`) has no idea whether an action came from a keyboard, a mouse, or a touchscreen.
- Adding a new input source (for example a gamepad in a future version) is one new bridge file.
- Rebindable controls are straightforward because the bridge is one layer.
- The 44-by-44 minimum touch target is enforced in code, not just in design intent.

### Negative or to manage

- The intent bus is one more layer to walk in debugging. The team accepts that for the layering benefit.
- Touch sensitivity needs tuning on real devices. Sean's first build includes a calibration pass on a real phone.
- Keyboard-look (A/D, arrow keys) is non-standard for first-person games and players who expect mouse-look might miss it. The controls overlay (FR-CTRL-01, FR-CTRL-02) lists both schemes prominently, and the main-menu controls help (Tad's Decision 8 recommendation A) names the keys.

## Cross-references

- `docs/decisions/002-project-structure.md`: places the input bridges inside `src/render/input/`.
- `docs/decisions/004-game-state-model.md`: the core actions the bridges and the controllers dispatch.
- `docs/requirements.md` FR-CTRL-01, FR-CTRL-02, NFR-MOB-01, NFR-ACC-01: the keyboard, touch, and mobile parity requirements this ADR meets.
- `docs/accessibility.md` Exception SE-001: the canvas screen-reader exception that the input model accepts.
- `tad-decisions-for-tim.md` Decision 8: the keyboard-look recommendation (recommended option A: A/D and arrow keys).
- `tad-decisions-for-tim.md` Decision 10: the witch trigger pause-during-overlays behaviour that the overlay state in this ADR enables.
