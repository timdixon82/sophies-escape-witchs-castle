# Requirements: Sophie's Escape: The Witch's Castle

Version 1.0, dated 2026-05-23. Derived from the game design brief at `docs/design-brief.md` (version 1.0). Every requirement carries a reference in square brackets so you can trace it back to the brief section it came from.

This document is organised by the team's build flow: scope first, then functional requirements grouped by area, then non-functional requirements, then content requirements, then operational requirements. Sean builds from functional requirements. Jacob's architecture pass uses the non-functional and content sections alongside his own ADRs (Architecture Decision Records). Simon's design pass uses the non-functional requirements and the content detail for each room.

Where I have taken a sensible interpretation of an ambiguous brief element, I mark it with the tag [TAD CALL] so Tim can accept or revise it at morning review.

---

## 1. Scope

### 1.1 In scope

The following is in scope for version 1.0.

- A browser-based, first-person 3D puzzle adventure, fully client-side, with no server component.
- Ten interconnected rooms, each with a distinct theme and at least one puzzle.
- An inventory system that supports collecting, selecting, and combining items.
- A three-step hint system, one set of three hints per puzzle.
- A witch antagonist that appears as a crystal-ball cutscene triggered by time.
- Full keyboard controls and full touchscreen controls, each complete on their own.
- Session-based saving that persists state within the browser tab.
- A pause screen with resume, hints, settings, and exit to main menu.
- A main menu with New Game, Continue, and Credits.
- A win condition: Sophie reaching the Castle Gate, a final cutscene, an end screen.
- Audio sourced from the BBC Sound Effects Library (bbcrewind.co.uk/sound-effects).
- WCAG 2.2 AAA conformance throughout.
- Deployment on GitHub Pages.

[Ref: brief sections 1, 3, 5, 6, 7, 8, 10, 12, 13]

### 1.2 Out of scope

The following is explicitly out of scope for version 1.0.

- Multiplayer.
- Server-side saving or accounts.
- Procedurally generated puzzles.
- Any backend infrastructure.
- Analytics beyond the team's standing GoatCounter default (see Decision 4 in the decision log).

[Ref: brief section 12]

---

## 2. Functional Requirements: Exploration and Navigation

### FR-NAV-01: First-person movement

Sophie moves through the castle in a first-person perspective. The player can move forward and backward.

Acceptance criteria:

- [ ] Pressing W or the Up arrow key moves Sophie forward.
- [ ] Pressing S or the Down arrow key moves Sophie backward.
- [ ] On touchscreen, forward and backward motion is achievable by swipe or an on-screen joystick.
- [ ] Movement responds within 100 milliseconds on both desktop and mobile.

[Ref: brief sections 3, 6.1, 9]

### FR-NAV-02: Looking around

The player can look around the current room.

Acceptance criteria:

- [ ] On desktop, moving the pointer device rotates the camera view.
- [ ] On touchscreen, dragging a finger rotates the camera view.
- [ ] The look range is constrained to prevent disorienting full-rotation vertigo. [TAD CALL: I have taken 160 degrees horizontal and 90 degrees vertical as the default constraint range, consistent with the vestibular check the team has established for other projects. Tim may adjust this.]
- [ ] A keyboard alternative for looking is available (for example, the A/D keys or Left/Right arrow keys rotate view). [TAD CALL: The brief does not explicitly list a keyboard look; it lists mouse move and drag only. I am adding keyboard look because WCAG 2.2 AAA and the brief's own "full keyboard navigation" commitment require it. Tim should confirm.]

[Ref: brief sections 3, 6.1]

### FR-NAV-03: Interactable objects

Objects the player can interact with are visually distinguished when they have keyboard focus or pointer hover.

Acceptance criteria:

- [ ] An interactable object displays a visible highlight when the pointer hovers over it.
- [ ] An interactable object displays the same or equivalent highlight when it receives keyboard focus.
- [ ] The highlight meets WCAG 2.2 AAA focus-visible requirements (minimum 3:1 contrast ratio between the focused and unfocused states).
- [ ] Pressing E or Enter on a focused object triggers the interaction.
- [ ] Tapping an object on touchscreen triggers the interaction.

[Ref: brief sections 3, 6.1]

### FR-NAV-04: Room navigation

The player can move between rooms freely via visible doorways or a map.

Acceptance criteria:

- [ ] Each room has at least one visible exit that the player can approach and activate.
- [ ] Activating an exit transitions Sophie to the connected room.
- [ ] Room transitions are keyboard-accessible: the player can navigate to a doorway using movement keys and activate it without a pointer.
- [ ] Room transitions are touchscreen-accessible: the player can reach and tap a doorway.
- [ ] [TAD CALL: The brief offers "visible doorways or a simple map" as alternatives. I recommend visible doorways as the primary navigation, with a keyboard-accessible map as a secondary aid. Simon and Jacob should confirm the map UI and the minimap toggle key.]

[Ref: brief section 6.1, 6.2]

---

## 3. Functional Requirements: Inventory System

### FR-INV-01: Opening and closing the inventory

The inventory panel is accessible at any time during gameplay.

Acceptance criteria:

- [ ] Pressing I opens the inventory panel.
- [ ] Pressing I again, or pressing Escape when the inventory is open, closes the inventory panel.
- [ ] Tapping the inventory button on touchscreen opens and closes the inventory panel.
- [ ] The inventory button is visible on screen at all times during gameplay.
- [ ] The inventory panel opens and closes with a smooth animation.
- [ ] The animation does not trigger vestibular motion. [TAD CALL: I have flagged this because the brief says "slides in/out smoothly". Smooth sliding can trigger vestibular discomfort for some players. The animation should respect the operating system's reduced-motion preference, following `prefers-reduced-motion: reduce`. Simon should specify the fallback behaviour.]

[Ref: brief sections 3, 6.4]

### FR-INV-02: Displaying collected items

The inventory shows all items Sophie has collected.

Acceptance criteria:

- [ ] Each collected item is displayed as an icon with a text label.
- [ ] The icon-to-label association is programmatically clear so screen readers announce the label.
- [ ] Items are listed in collection order, oldest first.
- [ ] The inventory remains readable when it contains up to twenty items. [TAD CALL: The brief does not cap item count. I have set twenty as a reasonable upper bound for the ten-room design; Jacob should confirm the exact item count and Simon should confirm the grid layout handles it.]

[Ref: brief section 6.4]

### FR-INV-03: Selecting an item for use

The player selects an item to use it on an object in the environment.

Acceptance criteria:

- [ ] Selecting an item (by keyboard focus and Enter, or by tap) highlights it.
- [ ] The player can then press E or tap an environmental object to attempt to use the item on that object.
- [ ] If the use is valid, the game advances the puzzle state.
- [ ] If the use is invalid, the game shows a non-punishing failure message (for example, "That doesn't seem to work here").
- [ ] The failure message is read by screen readers (announced via an ARIA live region). [TAD CALL: The brief does not specify an ARIA live region; I am adding this to meet WCAG 2.2 AAA.]

[Ref: brief section 6.4]

### FR-INV-04: Combining items

The player can combine two or more items in the inventory.

Acceptance criteria:

- [ ] The player can select multiple items by activating each in turn (keyboard Enter or tap); each selected item shows a distinct highlighted state.
- [ ] When two or more items are selected, a "Combine" button becomes available and receives keyboard focus automatically. [TAD CALL: The brief uses both "Use Together" and "Combine" as button labels. I recommend "Combine" as the single label for consistency; Tim should confirm.]
- [ ] Activating the Combine button with a valid combination produces the result item or advances the puzzle.
- [ ] Activating the Combine button with an invalid combination shows a non-punishing failure message (for example, "That doesn't work together").
- [ ] The failure message is read by screen readers via an ARIA live region.
- [ ] The player can deselect items by activating them again.

[Ref: brief section 6.4]

---

## 4. Functional Requirements: Hint System

### FR-HINT-01: Accessing hints

The player can request a hint for the current puzzle at any time.

Acceptance criteria:

- [ ] Pressing H opens the hint panel for the current room's active puzzle.
- [ ] Tapping the Hint button on touchscreen opens the hint panel.
- [ ] The Hint button is accessible from both the gameplay screen and the pause screen.
- [ ] The hint panel is keyboard-accessible: the player can navigate and dismiss it without a pointer.

[Ref: brief sections 3, 6.6]

### FR-HINT-02: Hint progression

Each puzzle has three hints, revealed one at a time.

Acceptance criteria:

- [ ] The first hint request for a puzzle shows Hint 1, a subtle nudge.
- [ ] A second request (or a "Next hint" action within the panel) shows Hint 2, a more specific direction.
- [ ] A third request shows Hint 3, near-solution guidance.
- [ ] No further hints are revealed after Hint 3.
- [ ] All three hints remain available throughout the session: the player can re-read any of the three hints at any point.
- [ ] There is no global hint economy: requesting hints has no cost or consequence.
- [ ] Each hint is displayed as text and is read by screen readers.

[Ref: brief section 6.6]

### FR-HINT-03: Hint wording style

Hints follow a consistent wording pattern.

Acceptance criteria:

- [ ] Hint 1 is a room-level prompt (for example, "Have you looked carefully at everything in this room?").
- [ ] Hint 2 is a puzzle-level direction (for example, "The symbol on the altar matches something you've seen elsewhere").
- [ ] Hint 3 is near-solution guidance naming the items or actions involved (for example, "Combine the candle and the mirror, then use them on the altar").
- [ ] All hint wording is written in plain English at or below Flesch-Kincaid grade 9.
- [ ] [TAD CALL: Exact hint wording for all ten puzzles is not provided in the brief; only the style examples above are given. I have raised this as Clarification 1 in the clarification log. Tim should either supply wording or approve a wording approach before Sean populates the hint data.]

[Ref: brief section 6.6]

---

## 5. Functional Requirements: The Witch Encounter

### FR-WITCH-01: Trigger

The witch encounter triggers when Sophie has been working on the same puzzle for too long without solving it.

Acceptance criteria:

- [ ] The trigger timer starts when Sophie enters a room with an unsolved puzzle.
- [ ] The trigger fires after three to five minutes on the same puzzle without progress. [TAD CALL: The brief gives "3-5 minutes" as a range. I recommend defaulting to four minutes, with Simon specifying whether the timer resets when the player opens hints. Tim should confirm the default.]
- [ ] The trigger does not fire more than once in any five-minute window, regardless of puzzle state.
- [ ] In later rooms (Rooms 7 to 10), the trigger interval shortens to increase tension. [TAD CALL: The brief says "more frequently in later rooms" but does not give a specific interval. I recommend a three-minute trigger for rooms 7 to 10. Jacob should confirm this is configurable.]

[Ref: brief section 7.1, 7.3]

### FR-WITCH-02: Cutscene flow

The witch encounter runs as a cutscene.

Acceptance criteria:

- [ ] Gameplay pauses when the cutscene begins.
- [ ] The screen transitions to a view of the witch at her crystal ball.
- [ ] The witch delivers one short line, either as text on screen or as audio with a visible text transcript.
- [ ] An animation plays: the crystal ball glows and the witch cackles.
- [ ] The screen cuts back to gameplay and the game resumes from the exact paused state.
- [ ] The cutscene has a keyboard-accessible skip control. [TAD CALL: The brief does not specify a skip; I am adding this because WCAG 2.2 AAA (Success Criterion 2.2.2) requires a mechanism to pause or stop time-based media, and because some players find unexpected sound and motion stressful. Simon should design the skip button.]
- [ ] All animation in the cutscene respects `prefers-reduced-motion: reduce`.

[Ref: brief section 7.2]

### FR-WITCH-03: Witch lines

The witch delivers a menacing short line during each encounter.

Acceptance criteria:

- [ ] The game has a minimum of four distinct witch lines in rotation.
- [ ] Lines rotate so the same line does not appear in consecutive encounters within a session.
- [ ] Each line is written as text (the brief's four suggestions serve as the initial set).
- [ ] [TAD CALL: The brief says "short voiced or text line" with either as acceptable. I recommend text-only for the initial build because voiced lines require voice acting, recording, licencing, and audio production that is not costed or specified. Tim should confirm whether voiced audio is in scope before Sean implements the audio layer.]

[Ref: brief section 7.2, 7.4]

---

## 6. Functional Requirements: Pause and Exit System

### FR-PAUSE-01: Triggering pause

The player can pause the game at any point during gameplay.

Acceptance criteria:

- [ ] Pressing Escape pauses the game.
- [ ] Tapping the pause icon on touchscreen pauses the game.
- [ ] The pause icon is visible on screen at all times during gameplay.
- [ ] The pause icon has a touch target of at least 44 by 44 CSS pixels (WCAG 2.2 AAA target size). [TAD CALL: The brief says "adequate size"; I have applied the WCAG AAA figure of 44x44 pixels. Simon should confirm the final target size specification.]

[Ref: brief sections 3, 8]

### FR-PAUSE-02: Pause screen contents

The pause screen provides the player with clear options.

Acceptance criteria:

- [ ] The pause screen displays: Resume, Hint (for current puzzle), Settings, and Exit to Main Menu.
- [ ] Each option is reachable by keyboard (Tab navigation) and by tap.
- [ ] The pause screen announces its contents to screen readers via appropriate ARIA landmarks.
- [ ] Game state is fully preserved while paused: timers stop, no witch trigger fires, no ambient audio plays. [TAD CALL: The brief does not specify whether the witch timer pauses. I have taken it as paused; Tim should confirm.]

[Ref: brief section 8]

### FR-PAUSE-03: Exit to main menu and continue

The player can exit to the main menu and return to exactly where they left off.

Acceptance criteria:

- [ ] Selecting "Exit to Main Menu" from the pause screen navigates to the main menu.
- [ ] The current game state (rooms visited, items collected, puzzles solved, current room, hint progress) is stored in the browser session.
- [ ] Selecting "Continue" from the main menu restores Sophie to the exact state at the point of exit.
- [ ] The "Continue" option is only shown if a saved session exists.

[Ref: brief section 8]

### FR-PAUSE-04: Settings

The pause screen settings control audio volume.

Acceptance criteria:

- [ ] The settings panel includes a volume control for game audio.
- [ ] The volume control is keyboard-operable (for example, a labelled range slider).
- [ ] Volume changes take effect immediately.
- [ ] [TAD CALL: The brief lists "volume, etc." in settings. I have scoped settings to volume only for version 1.0. Other settings, such as control sensitivity or motion reduction, are logged as Clarification 2. Tim should confirm scope.]

[Ref: brief section 8]

---

## 7. Functional Requirements: Main Menu

### FR-MENU-01: Main menu options

The main menu provides three options.

Acceptance criteria:

- [ ] The main menu displays: New Game, Continue (shown only when a session exists), and Credits.
- [ ] Each option is reachable by keyboard (Tab navigation) and by tap.
- [ ] Selecting New Game clears any existing session and starts Sophie in Room 1.
- [ ] Selecting Continue restores the stored session.
- [ ] Selecting Credits navigates to a Credits screen listing contributors, audio attribution, and licences.

[Ref: brief section 8]

---

## 8. Functional Requirements: Win Condition

### FR-WIN-01: Final puzzle and escape

Sophie escapes when she reaches the Castle Gate and solves the final puzzle.

Acceptance criteria:

- [ ] Room 10 (the Castle Gate) contains the final puzzle requiring items or solutions from earlier rooms.
- [ ] Solving the final puzzle triggers the escape cutscene.
- [ ] The escape cutscene shows Sophie running out into daylight.
- [ ] After the cutscene, an end screen is shown with: a congratulations message, the time taken to complete the game, and a short fun message from Sophie.
- [ ] The end screen offers a "Play again" option and, optionally, a share option. [TAD CALL: The brief says "option to restart or share". I have included both but flagged sharing as a decision item (Decision 6 in the decision log) because sharing requires clipboard or Web Share API access, which has minor privacy implications.]
- [ ] The end screen is fully keyboard-navigable and screen-reader-accessible.

[Ref: brief section 10]

---

## 9. Functional Requirements: No Failure States

### FR-FAIL-01: Player protection

The game has no lives, no death, and no game-over state.

Acceptance criteria:

- [ ] No action the player takes reduces a life counter.
- [ ] No action the player takes triggers a death state or restarts the current room.
- [ ] Invalid puzzle attempts and invalid item combinations show a gentle non-punishing response.
- [ ] The witch encounter does not penalise the player; gameplay resumes identically after each cutscene.
- [ ] The hint system is always available and has no negative consequence.

[Ref: brief section 11]

---

## 10. Functional Requirements: Audio

### FR-AUDIO-01: Ambient audio per room

Each room plays a looping ambient sound.

Acceptance criteria:

- [ ] A distinct ambient sound plays when Sophie is in each room.
- [ ] The ambient sound loops continuously without an audible gap at the loop point.
- [ ] The ambient sound fades or cuts when Sophie transitions to another room.
- [ ] The ambient sound for Room 2 (the Stone Corridor) includes wind and distant drips per the brief's example.

[Ref: brief section 5]

### FR-AUDIO-02: Event sounds

Specific in-game events trigger corresponding sounds.

Acceptance criteria:

- [ ] The following sounds each trigger at the correct event:
  - Footsteps on stone when Sophie moves.
  - A witch cackle during the witch encounter cutscene.
  - Cauldron bubbling when Sophie is in or near the Kitchen (Room 3).
  - A door creak when Sophie moves through a doorway.
  - A magical chime when Sophie picks up an item.
  - A success chime when Sophie solves a puzzle.
  - A dramatic sting when the witch encounter begins.
  - A parchment rustle when the inventory opens or closes.
  - A triumphant fanfare when Sophie escapes.
- [ ] Each event sound is accompanied by a visual cue. [TAD CALL: The brief says "visual cues accompanying audio events where possible". I have made visual cues a requirement for all listed events, because WCAG 2.2 AAA requires that information conveyed by sound is also conveyed visually. Simon should design each visual cue.]

[Ref: brief sections 3, 5]

### FR-AUDIO-03: Audio management

Audio is managed cleanly so it never overlaps unintentionally.

Acceptance criteria:

- [ ] Multiple ambient and event sounds can play simultaneously where appropriate (for example, ambient plus footsteps).
- [ ] Sounds that should not overlap (for example, two trigger stings) are queued or the earlier sound is interrupted.
- [ ] All audio is managed through Howler.js.
- [ ] Audio files are bundled with the game as MP3 and OGG format pairs for browser compatibility.

[Ref: brief section 13]

---

## 11. Functional Requirements: Controls

### FR-CTRL-01: Keyboard control set

The full control set is operable by keyboard alone.

Acceptance criteria:

- [ ] W / Up arrow: move forward.
- [ ] S / Down arrow: move backward.
- [ ] A / Left arrow: look left. [TAD CALL: See FR-NAV-02.]
- [ ] D / Right arrow: look right. [TAD CALL: See FR-NAV-02.]
- [ ] E or Enter: interact with the focused object.
- [ ] I: open or close inventory.
- [ ] H: open or close hints.
- [ ] Escape: pause or dismiss the current overlay.
- [ ] Tab and Shift-Tab: cycle keyboard focus through interactive elements in menus and overlays.
- [ ] A controls reference screen is accessible from the main menu and the pause screen.

[Ref: brief section 9]

### FR-CTRL-02: Touchscreen control set

The full control set is operable by touchscreen alone.

Acceptance criteria:

- [ ] Swipe or on-screen joystick: forward and backward movement.
- [ ] Drag: look around.
- [ ] Tap an object: interact.
- [ ] Inventory button: open or close inventory.
- [ ] Hint button: open or close hints.
- [ ] Pause button: pause.
- [ ] Tap: navigate menus.
- [ ] All on-screen buttons have touch targets of at least 44 by 44 CSS pixels.
- [ ] On-screen buttons do not overlap each other.

[Ref: brief sections 3, 9]

---

## 12. Non-functional Requirements: Performance

### NFR-PERF-01: Responsiveness on mobile and desktop

The game runs responsively on both mobile and desktop browsers.

Acceptance criteria:

- [ ] The game loads in under five seconds on a typical 4G mobile connection. [TAD CALL: The brief says "fast and responsive" without a specific figure; I have applied a five-second target as a measurable threshold consistent with good web practice.]
- [ ] Frame rate maintains at least 30 frames per second on a mid-range mobile device (for example, a three-year-old iPhone or an equivalent Android device).
- [ ] Frame rate maintains at least 60 frames per second on a mid-range desktop browser.
- [ ] All assets are bundled or lazy-loaded to avoid blocking the initial render.

[Ref: brief section 3]

### NFR-PERF-02: No server component

The game runs entirely client-side.

Acceptance criteria:

- [ ] No HTTP requests are made to any server during gameplay (excluding the initial page load from GitHub Pages).
- [ ] All assets (3D models, textures, audio, scripts) are bundled with the deployed build.
- [ ] The game functions after the initial load even if the network connection is lost.

[Ref: brief sections 1, 3, 12, 13]

---

## 13. Non-functional Requirements: Accessibility

### NFR-ACC-01: WCAG 2.2 AAA conformance

The game meets the Web Content Accessibility Guidelines (WCAG) 2.2 at AAA conformance throughout.

Acceptance criteria:

- [ ] All text elements meet a contrast ratio of at least 7:1 against their background.
- [ ] All large text elements (18pt and above, or 14pt bold and above) meet a contrast ratio of at least 4.5:1. [TAD CALL: AAA requires 7:1 even for large text; I have listed 4.5:1 here only as a floor. The project targets 7:1 for all text.]
- [ ] All interactive elements meet a focus-visible state with a minimum 3:1 contrast ratio between focused and unfocused states.
- [ ] All on-screen buttons and touch targets meet a minimum size of 44 by 44 CSS pixels.
- [ ] No content flashes more than three times per second (seizure safety, WCAG 2.3.2 AAA).
- [ ] All time-based media (cutscenes, animations) can be paused, stopped, or skipped.
- [ ] All audio information is also conveyed visually.
- [ ] The game is fully operable by keyboard alone.
- [ ] The game is fully operable by touchscreen alone.
- [ ] Animations respect `prefers-reduced-motion: reduce`.
- [ ] All text is at or below Flesch-Kincaid grade 9 (plain language for age nine and up).
- [ ] Carol runs an accessibility check at the end of each build sprint before any pull request merges.

[Ref: brief section 3; CLAUDE.md compliance baseline]

### NFR-ACC-02: Screen reader compatibility

The game's menus, overlays, and informational content are navigable by screen reader.

Acceptance criteria:

- [ ] Menus, the inventory, the hint panel, the pause screen, and the end screen use ARIA landmarks and roles.
- [ ] Dynamic content changes (item collection, puzzle solved, witch encounter beginning, failure message) are announced via ARIA live regions.
- [ ] The game canvas itself is a known limitation for screen reader navigation in 3D environments. [TAD CALL: Full screen-reader navigation of a 3D game world is not achievable at AAA. I have scoped screen-reader support to the UI overlays and all informational events. Jacob's architecture pass should document this as an accessibility exception, including a rationale, in `docs/exceptions/`. This needs Tim's approval before the exception is filed.]

[Ref: brief section 3; CLAUDE.md compliance baseline]

### NFR-ACC-03: Vestibular safety

The game minimises motion effects that can trigger vestibular discomfort.

Acceptance criteria:

- [ ] The look range is constrained (see FR-NAV-02).
- [ ] All slide and transition animations respond to `prefers-reduced-motion: reduce` with a fade or instant-cut alternative.
- [ ] No spinning, scrolling, or parallax effects appear without a way to disable them.
- [ ] The team's vestibular check procedure (established in the ICCC project) is applied during Carol's test pass.

[Ref: brief section 3; ICCC project vestibular work]

---

## 14. Non-functional Requirements: Browser Support

### NFR-BROWSER-01: Supported browsers

The game runs on current-version browsers across desktop and mobile.

Acceptance criteria:

- [ ] The game runs on the current and one prior version of: Chrome (desktop and Android), Safari (desktop and iOS), Firefox (desktop), Edge (desktop).
- [ ] The game is tested on iOS Safari because it has the most restrictive WebGL and audio policies.
- [ ] The game does not require the player to install any plugin or extension.

[Ref: brief section 3; team standing practice]

---

## 15. Non-functional Requirements: Mobile Parity

### NFR-MOB-01: Equal experience on mobile

The touchscreen experience is equal in every way to the keyboard-and-pointer experience. Not "also supported" but genuinely equal.

Acceptance criteria:

- [ ] Every puzzle, every item, every hint, every cutscene, and every menu is reachable and completable on touchscreen alone.
- [ ] No feature is gated behind a keyboard or pointer device.
- [ ] The game layout is responsive and adjusts correctly to the common screen sizes: 375px wide (small phone), 428px wide (large phone), 768px wide (tablet), 1280px and above (desktop).
- [ ] Touch targets do not overlap at any of these breakpoints.

[Ref: brief sections 3, 6]

---

## 16. Content Requirements: The Ten Rooms

The design brief lists ten rooms with distinct themes. The dependency structure between rooms creates a natural progression without locked doors.

### Room 1: The Dungeon Cell

Starting room. Introductory difficulty. Sophie must find a way out of the cell.

Puzzle type: Inventory-based. The player must find an item in the cell and use it to escape.
Dependencies: None. This room is self-contained.
Audio: Ambient drips, distant wind.
Notes: This room teaches the core mechanics (look around, pick up item, use item) through play. The brief describes it as "basic intro puzzle".

[Ref: brief section 6.3]

### Room 2: The Stone Corridor

Connecting room. Atmospheric. Contains a small hidden item.

Puzzle type: Exploration. The player discovers an item by looking carefully.
Dependencies: None. The item here may be needed in a later room.
Audio: Wind in stone corridors, distant drips (ambient). Footsteps prominent.
Notes: The Stone Corridor links multiple rooms and is a thoroughfare. It reinforces the idea that paying attention to your surroundings pays off.

[Ref: brief section 6.3]

### Room 3: The Kitchen

Contains a cauldron, shelves, and hidden items. Puzzle involves ingredients.

Puzzle type: Inventory combination. The player collects ingredients and combines them.
Dependencies: May require an item from another room. [TAD CALL: The brief does not specify which rooms feed the Kitchen. I have left this open for Jacob and Tim to specify in the puzzle design pass.]
Audio: Cauldron bubbling (ambient when in Kitchen), fire crackle.
Notes: The cauldron is the central interactive object.

[Ref: brief sections 6.2, 6.3]

### Room 4: The Library

Contains books, a locked cabinet, and scrolls. Puzzle is riddle-based.

Puzzle type: Riddle. The player reads a scroll or book to find the answer to a symbol or word puzzle.
Dependencies: The library cabinet requires a key found in Room 7 (the Armoury) per the brief's example "to open the library cabinet (Room 3), Sophie needs a key found in the kitchen (Room 6)". [TAD CALL: The brief's example is slightly inconsistent in its room numbering; it says Room 3 needs a key from Room 6, but the room list places the Library at Room 4 and the Kitchen at Room 3. I have followed the room list numbering and marked this as Clarification 3.]
Audio: Pages turning (on interaction), silence or faint wind (ambient).

[Ref: brief sections 6.2, 6.3]

### Room 5: The Great Hall

Large central room. Contains portraits, a fireplace. Multi-item puzzle.

Puzzle type: Multi-item combination. The player brings items from other rooms to solve the puzzle.
Dependencies: Requires items from at least two other rooms.
Audio: Fireplace crackle (ambient), occasional settling stone.
Notes: The Great Hall is intended as a hub that rewards multiple visits.

[Ref: brief section 6.3]

### Room 6: The Chapel

Eerie stained glass windows and an altar. Puzzle involves symbols or patterns.

Puzzle type: Pattern observation and replication. The player observes a pattern in one location and replicates it at the altar.
Dependencies: May require an item found elsewhere. Pattern observation may depend on a clue in another room.
Audio: Distant organ or choir (atmospheric), silence.
Notes: The chapel visual of stained glass is a strong candidate for a WCAG colour contrast exception because colour distinguishes the symbols. Simon and Jed should review.

[Ref: brief section 6.3]

### Room 7: The Armoury

Decorative weapons on walls, chests. Lock and key puzzle.

Puzzle type: Lock and key. The player finds the key and opens the chest (or vice versa).
Dependencies: None specified. The key found here unlocks the Library cabinet.
Audio: Metal echo, dripping water (ambient).

[Ref: brief sections 6.2, 6.3]

### Room 8: The Tower Room

High up. Contains a telescope and a star map. Observational puzzle.

Puzzle type: Observation. The player uses the telescope or star map to find a clue or code used elsewhere.
Dependencies: The star map clue may be needed in another room.
Audio: Wind (prominent, high pitched), creaking timbers (ambient).
Notes: This room's height and window view are a strong visual opportunity. The wind sound is described as prominent in the brief.

[Ref: brief section 6.3]

### Room 9: The Witch's Study

The most atmospheric room. Contains an inactive crystal ball and spell books. Complex multi-item puzzle.

Puzzle type: Complex multi-item. The player must bring several items and consult the spell books.
Dependencies: Requires items from multiple earlier rooms. This is the penultimate puzzle and should be the most challenging.
Audio: Eerie hum, crystal ball sound effects (ambient), subtle magical tones.
Notes: The crystal ball here is inactive (the witch watches from her own study off-screen). This room sets up the final confrontation narrative.

[Ref: brief section 6.3]

### Room 10: The Castle Gate

Final room. All previous puzzle solutions and items combine to open the gate.

Puzzle type: Culminating multi-item. The player applies every previous solution.
Dependencies: Requires items and solutions from rooms 1 through 9. The exact combination is [TAD CALL: left for Tim and Jacob to specify in the puzzle design pass, as the brief does not detail the final puzzle mechanic].
Audio: Dramatic sting when gate puzzle begins. Triumphant fanfare when the gate opens.
Notes: The successful escape triggers the escape cutscene and the end screen.

[Ref: brief sections 6.3, 10]

---

## 17. Content Requirements: The Witch Encounter

The witch appears as a crystal-ball cutscene, not as a character in the game world. She is the antagonist but never enters Sophie's environment directly.

Her four suggested lines from the brief serve as the initial set:

1. "You'll never find the way out..."
2. "How long have you been stumbling around my castle?"
3. "Every second you waste is another second I grow stronger..."
4. "Did you check everywhere? I think not..."

Additional lines are expected for later rooms to avoid repetition. [TAD CALL: The brief does not specify how many lines are needed. I recommend a minimum of eight lines, two per difficulty tier (Rooms 1 to 3, 4 to 6, 7 to 9, Room 10), so the witch's tone escalates across the game. Tim should confirm or adjust.]

The witch's visual style is described as "storybook-spooky". Simon's design pass will specify this. See Decision 9 in the decision log for the recommended direction.

[Ref: brief sections 7.2, 7.4]

---

## 18. Content Requirements: Audio Sourcing

All audio is sourced from the BBC Sound Effects Library (bbcrewind.co.uk/sound-effects) and bundled locally as MP3 and OGG file pairs.

The ten required sound categories, derived from the brief, are:

| Sound event | Category in BBC library |
|---|---|
| Footsteps on stone | Stone or castle footsteps |
| Witch cackle | Witch laugh or cackle |
| Cauldron bubbling | Bubbling liquid or cauldron |
| Door creaking open | Creaking wooden or stone door |
| Item picked up | Magical chime or sparkle |
| Puzzle solved | Success chime |
| Witch tension sting | Dramatic sting or horror accent |
| Inventory open or close | Parchment rustle or UI click |
| Ambient castle atmosphere | Wind in stone corridors, distant drips |
| Escape or win | Triumphant fanfare |

Each sourced file must be logged with its BBC library title, its identification number, and its licence terms before Sean bundles it. The licence position is Decision 5 in the decision log.

[Ref: brief section 5]

---

## 19. Operational Requirements: Saving

### OR-SAVE-01: Session-based save

Game state persists within a browser session.

Acceptance criteria:

- [ ] The save stores: rooms visited, items collected, puzzles solved, current room, hint progress, witch encounter count, and time elapsed.
- [ ] The save is written to browser session storage. [TAD CALL: The brief says "session-based save". I have interpreted this as browser session storage, which persists until the browser tab is closed. This is Clarification 4 in the clarification log: Tim should confirm whether "session" means the browser tab lifetime or the browser window lifetime.]
- [ ] No personal data is stored. The save contains only game state, not player identity.
- [ ] The game reads the saved state on load and offers "Continue" if a save exists.

[Ref: brief section 8]

---

## 20. Operational Requirements: Exit and Restart

### OR-EXIT-01: Exit to main menu

Covered by FR-PAUSE-03.

### OR-RESTART-01: New game from main menu

Starting a new game clears the existing session save and starts Sophie in Room 1 with an empty inventory, no hints revealed, and the timer reset to zero.

Acceptance criteria:

- [ ] Selecting "New Game" when a save exists prompts the player to confirm they want to abandon the current save. [TAD CALL: The brief does not specify a confirmation prompt; I am adding one because losing a session inadvertently would be frustrating for a young player.]
- [ ] On confirmation, the session is cleared and Room 1 loads.
- [ ] On cancellation, the player returns to the main menu with the session intact.

[Ref: brief section 8]

---

## 21. Dependencies Between Requirements

The following dependencies must be resolved before Sean writes substantive game code. They are also listed in the decision log.

- FR-HINT-03 depends on Tim approving hint wording or a wording approach (Clarification 1).
- FR-WITCH-03 depends on Tim confirming whether voiced audio is in scope (Decision 7).
- FR-AUDIO-01 and FR-AUDIO-02 depend on Tim confirming the BBC licence path (Decision 5).
- NFR-ACC-02 depends on Jacob documenting the 3D canvas screen-reader exception and Tim approving it.
- Room puzzle specifics (Rooms 3, 4, 5, 9, 10) depend on Tim and Jacob defining the item dependency graph (Clarification 3).

---

*End of requirements, version 1.0. Next version follows Jacob's architecture pass and Tim's responses to the decision log and clarification list.*
