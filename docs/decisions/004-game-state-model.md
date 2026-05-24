# ADR 004: Game state model

## Status

Accepted on 2026-05-23 by Jacob.

## Context

The game has five state-carrying subsystems: the inventory, the room and exploration state, the puzzle state, the hint cascade, and the witch encounter timer. The pause and save requirement (`docs/requirements.md` FR-PAUSE-02, OR-SAVE-01) and the session save behaviour require all of this state to be serialisable, written to browser storage, and read back exactly so the player resumes where they left off.

The brief and the requirements set tight rules on the save:

- Session-based save (`docs/design-brief.md` section 8).
- Stored in browser storage so it survives a page reload (`docs/requirements.md` OR-SAVE-01).
- No personal data (`docs/requirements.md` OR-SAVE-01).
- Reads on load and offers Continue if a save exists (`docs/requirements.md` FR-MENU-01).

Tad's decision log raises a clarification (Clarification 4) about whether "session" means the browser tab lifetime or the browser window lifetime. The architecture has to support either choice without rewriting the state model; the storage location (`sessionStorage` or `localStorage`) is the swap point.

The state shape also has to support the design's accessibility narration: when the inventory changes, an ARIA live region announces the change (`docs/accessibility.md`, inventory state section). The cleanest way to do this is to make the state changes the single source of truth and let the user-interface layer subscribe; the alternative (the UI tracking its own state) drifts.

## Decision

### A single state tree

The whole game's run-time state is held in one plain JavaScript object owned by `src/core/state.js`. The object is serialisable: it contains only strings, numbers, booleans, arrays, and plain objects. No class instances, no Maps or Sets at the top level, no function references, no DOM nodes.

The shape:

```
{
  "schemaVersion": 1,
  "sessionId": "<uuid>",
  "startedAt": "<ISO 8601 timestamp>",
  "elapsedMs": 0,
  "currentRoomId": "dungeon-cell",
  "roomsVisited": ["dungeon-cell"],
  "inventory": {
    "items": [
      { "itemId": "rusty-key", "pickedUpAt": "<ISO 8601>", "consumed": false }
    ],
    "selectedItemIds": []
  },
  "puzzles": {
    "<puzzleId>": {
      "state": "unsolved" | "in-progress" | "solved",
      "stepsCompleted": ["step-1"],
      "attemptsCount": 0
    }
  },
  "hints": {
    "<puzzleId>": {
      "revealed": 0,
      "lastViewedAt": "<ISO 8601>"
    }
  },
  "witch": {
    "encountersCount": 0,
    "lastEncounterAt": "<ISO 8601 or null>",
    "linesUsed": ["line-1", "line-3"],
    "trigger": {
      "currentPuzzleId": "<puzzleId or null>",
      "puzzleEnteredAt": "<ISO 8601>",
      "timerActiveMs": 0
    }
  },
  "settings": {
    "masterVolume": 0.8,
    "reducedMotionUserOverride": null,
    "controlsHelpSeen": false
  },
  "gameStatus": "menu" | "playing" | "paused" | "won"
}
```

### The state owner: `src/core/state.js`

This module exports four things:

1. `getState()`: returns a deep-frozen snapshot. Read-only.
2. `dispatch(action)`: the single mutation entry. Every change to state is an action.
3. `subscribe(listener)`: lets the user-interface and the render layers react to changes. Returns an unsubscribe function.
4. `loadFromStorage()` and `saveToStorage()`: the persistence helpers (see below).

`dispatch(action)` runs the action through a reducer. The reducer is a pure function from `(state, action) → state`. This is the same shape Redux uses but written from scratch with no Redux dependency: about 60 lines of code, no library.

Actions follow a small, fixed set:

- `ENTER_ROOM { roomId }`
- `PICK_UP_ITEM { itemId }`
- `USE_ITEM { itemId, targetId }`
- `SELECT_ITEM { itemId }`
- `DESELECT_ITEM { itemId }`
- `COMBINE_ITEMS { itemIds }`
- `PUZZLE_STEP_COMPLETE { puzzleId, stepId }`
- `PUZZLE_SOLVED { puzzleId }`
- `REVEAL_HINT { puzzleId }`
- `WITCH_TIMER_TICK { deltaMs }`
- `WITCH_ENCOUNTER_FIRED { lineId }`
- `OVERLAY_OPENED { overlayName }` (pauses the witch timer, per Tad's Decision 10 recommendation B1)
- `OVERLAY_CLOSED { overlayName }`
- `HINT_REVEALED_RESETS_WITCH_TIMER { puzzleId }` (per Tad's Decision 10 recommendation A1)
- `PAUSE`
- `RESUME`
- `WIN`
- `NEW_GAME`
- `LOAD_GAME { state }`
- `UPDATE_SETTINGS { partialSettings }`

The reducer is deterministic: the same action against the same state always produces the same next state. This makes unit tests trivial: feed an action sequence, assert on the result.

### Persistence

The state is written to browser storage on every change, debounced to roughly every 500 milliseconds so a fast-moving sequence of actions does not thrash storage.

The storage location is chosen by Tad's Clarification 4. The architecture supports either:

- `window.sessionStorage`: scoped to the browser tab. The save survives a page reload but is gone when the tab closes.
- `window.localStorage`: scoped to the origin. The save survives across tabs and browser restarts.

The choice is held in one place: `src/core/persistence.js` exposes `getStorage()` which returns the chosen backend. Sean reads Tim's answer on Clarification 4 and sets the backend. The state shape does not change.

The key under which the save is written is `sophies-escape:save:v1`. The `v1` is the schema version. If the schema needs to change in a later release, the new save key is `:v2`, the old key is read and migrated once, then the old key is deleted.

If the save cannot be read (corrupted JSON, schema mismatch, storage unavailable) the game treats it as no save and offers New Game only. A short ARIA live region message announces "Save could not be loaded; starting fresh" so a screen-reader player knows what happened.

### Witch trigger timer

The trigger lives in `state.witch.trigger`. The game loop dispatches `WITCH_TIMER_TICK { deltaMs }` on each frame while the game is playing. The reducer adds the delta to `state.witch.trigger.timerActiveMs` if the player is on an unsolved puzzle, the witch is not currently appearing, and no overlay is open.

When `timerActiveMs` crosses the threshold (240,000 milliseconds by default, four minutes; 180,000 milliseconds in later rooms, three minutes) the trigger fires by dispatching `WITCH_ENCOUNTER_FIRED`. The reducer resets the trigger, records the encounter, picks a witch line not used in the last few encounters, and sets `gameStatus` so the render layer transitions to the cutscene.

The "reset on hint reveal" behaviour from Tad's Decision 10 recommendation A1 is implemented in the reducer: `REVEAL_HINT` also resets `state.witch.trigger.timerActiveMs` to zero.

The "pause during overlays" behaviour from Tad's Decision 10 recommendation B1 is implemented through the game loop: when `gameStatus === "paused"` or any overlay name is in `state.openOverlays`, the loop stops dispatching `WITCH_TIMER_TICK`.

### Subscriptions and reactivity

The user-interface layer subscribes to state changes. The subscription gets the new state and the previous state; the UI computes the diff (for example "inventory grew by one item") and updates the DOM, including the ARIA live region announcement.

The render layer subscribes similarly, but mostly to large-grained changes (`currentRoomId` changed, `gameStatus` changed). Frame-by-frame data such as camera position is not in this tree; it lives in the render layer's own non-serialised state. Anything that needs to persist across reloads is in the state tree; anything that does not is not.

### Inventory item cap

Tad recommends a soft upper bound of twenty items (FR-INV-02 [TAD CALL]). The state model does not enforce a cap; the puzzle design (Tim and Jacob's puzzle pass) will determine the actual number. Sean implements grid pagination in the inventory panel if the item count ever exceeds the visible cap; the architecture does not constrain it.

## Alternatives considered

### A class-based state object with methods

Rejected. A class is not JSON-serialisable without a custom toJSON, and the team has had to debug subtle "the save lost its methods" bugs on past projects. Plain data is the safer shape.

### Use a small state library (Zustand, Valtio, MobX)

Considered briefly. Rejected because the team's no-framework preference (ADR 002) extends to no-state-library when the state is small enough that a 60-line reducer is clearer than a library import. If Sophie's Escape grows in a future version, this ADR is the place to revisit.

### One JSON file per subsystem

Rejected. Five files would not survive a partial write (a power failure midway through saving could leave inventory updated and puzzle state stale). A single object saved atomically is the simpler shape.

### Track elapsed time as a delta accumulator only

Rejected. Storing the start timestamp lets the end screen show a real elapsed time even if the player paused, which feels right. The witch trigger uses the active-while-on-puzzle counter (not real time) because that is the actual signal the encounter is measuring.

## Consequences

### Positive

- The state is a single source of truth, easy to inspect (one `console.log(getState())`), easy to serialise, easy to test in unit tests.
- The reducer is pure and small; every behaviour rule (witch timer reset on hint, witch timer pause during overlays, item combination outcomes) is enforced in one file.
- Migrating the save shape between versions is a known shape (read old key, transform, write new key, delete old key).
- The ARIA live region announcements have a clean trigger point (state change), so screen-reader narration is integrated rather than bolted on.

### Negative or to manage

- Every change to state goes through `dispatch`. A code-review block on direct mutation is enforced.
- The 500-millisecond save debounce means a hard browser crash could lose half a second of progress. This is acceptable for the game's session-based commitment.
- `sessionStorage` (if chosen for Clarification 4) is cleared in some private-browsing modes. Detection and a graceful "save unavailable in private browsing" message is part of Sean's build.

## Cross-references

- `docs/decisions/002-project-structure.md`: places `src/core/state.js` in the core layer.
- `docs/decisions/005-input-model.md`: the input bridge dispatches the actions listed above.
- `docs/requirements.md` FR-PAUSE-02, FR-PAUSE-03, OR-SAVE-01: the save and pause behaviour this state model implements.
- `docs/accessibility.md`: the ARIA live region narration that subscribes to state changes.
- `tad-decisions-for-tim.md` Decision 10 (witch trigger behaviour) and Clarification 4 (session storage scope).
