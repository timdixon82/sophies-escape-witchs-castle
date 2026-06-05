# Work folder 029: SEWC audio, brightness, item-use mechanic, and UX fixes

**Status:** active
**Triage type:** Bug fix + Small feature (types 6 and 7)
**Opened:** 2026-06-05

## Summary

Tim found six issues after playing the Stone Corridor. One bug fix (partition wall collision) and five feature additions (brightness, item-use mechanic, sound, speech, captions).

## Issues

### Issue 1: Partition walls have no collision (bug fix)

The collision system added in work folder 028 covers prop objects but partition walls in the hall (and potentially other rooms) are not registered as collidable meshes. The player can walk through them. Add partition wall meshes to the collision system in room-manager.js using the same `_addProp()` / `setCollidableMeshes()` pattern.

### Issue 2: Brightness too dark — add brightness control (small feature)

The game is too dark in places. Two changes:
- Increase the default ambient light intensity across all rooms to a lighter baseline.
- Add a brightness slider to the settings panel (range: dim to bright, default at the new lighter value). Persist preference in localStorage under `sewc-brightness`. Apply immediately on slider change. On load, read and apply saved preference.

### Issue 3: Item-use selection mechanic (small feature)

Currently Tim can interact with a door and, if the required item is in inventory, the puzzle auto-solves. The expected mechanic is:
- Tim opens inventory and selects an item (clicking/activating it marks it as "selected").
- The HUD shows a small "Selected: [item name]" indicator.
- Tim then interacts with a target object (e.g. the door). The game uses the selected item against that target.
- If the selected item matches what the target needs, the puzzle solves.
- If not, the game gives feedback: "That doesn't seem to work."
- After a successful or failed use, the selected item is deselected.
- Pressing Escape deselects the current item without using it.

This changes the interaction flow in interaction-handler.js and inventory-panel.js. The reducer may need a new intent (SELECT_ITEM / DESELECT_ITEM).

### Issue 4: Sound system with volume control (significant new system)

Add sound to the game using the Web Audio API (no binary audio files — all sounds are synthesised programmatically). Implement these sounds:
- **Footsteps**: a soft shuffle sound on each movement step
- **Item pickup**: a short chime or pop when an item is collected
- **Door open**: a creak sound when a door is successfully opened
- **Puzzle solve**: a satisfying chord or chime sequence
- **Ambient**: a low, subtle room tone (different per room atmosphere)
- **Menu open/close**: a soft click

Add a volume slider to the settings panel (range 0–100, default 70). Persist preference in localStorage under `sewc-volume`. Mute all audio at 0. Apply immediately on slider change.

A master audio manager module (`src/audio/audio-manager.js`) should encapsulate all Web Audio API calls. It should handle the AudioContext resume on first user gesture (browser autoplay policy).

### Issue 5: Speech on/off toggle (small feature)

Add speech synthesis using the Web Speech API (`window.speechSynthesis`). When enabled:
- Read aloud the room description when the player enters a room.
- Read aloud item names when items appear in the interactive list or when picked up.
- Read aloud puzzle clue text when the player examines a clue.
- Read aloud the result of an interaction ("That doesn't seem to work." / "Puzzle solved!").

Add an on/off toggle to the settings panel: "Read aloud (speech synthesis)". Default: off. Persist in localStorage under `sewc-speech`. On load, apply saved preference.

A speech manager module (`src/ui/speech-manager.js`) should encapsulate all `speechSynthesis` calls. It must cancel any in-progress utterance before starting a new one to avoid queuing.

### Issue 6: Captions on/off toggle (small feature)

When speech synthesis reads text, display a caption overlay showing the text being spoken. This is a separate setting from speech — captions can be on even when speech is off (in that case, captions show silently). Add a toggle to the settings panel: "Show captions". Default: off. Persist in localStorage under `sewc-captions`.

The caption overlay should appear at the bottom of the viewport (above the HUD), be accessible (`aria-live="polite"`, not `aria-hidden`), use sufficient contrast against the game background, and auto-clear when speech ends or after a timeout if captions-only mode.

## Out of scope

- Binary audio asset files (sounds must be synthesised via Web Audio API)
- New rooms or game content
- Any changes to the puzzle logic beyond the item-selection mechanic

## Risk and rollback

Medium risk on the audio system (new Web Audio API code) and item-use mechanic (changes core interaction flow). Low risk on brightness, speech, and captions. Rollback: revert the branch.

## Definition of done

- Partition walls block player movement
- Ambient light is lighter by default; brightness slider in settings persists across sessions
- Player must select an item from inventory before it can be used on a target; HUD shows selected item; Escape deselects
- Footstep, pickup, door, puzzle, ambient, and menu sounds play correctly; volume slider in settings persists
- Speech synthesis reads room descriptions, item names, clues, and interaction results when enabled; toggle in settings persists
- Captions show text in an accessible overlay when enabled; toggle in settings persists; captions work independently of speech
- All existing 49 unit tests pass; new tests added for audio manager, speech manager, and item-selection mechanic
- Lint: 0 errors
- PR open on branch `fix/sewc-audio-and-ux`

## Pre-approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than main
- [x] Open a pull request
- [x] Comment on a pull request or issue
- [x] Create an issue
