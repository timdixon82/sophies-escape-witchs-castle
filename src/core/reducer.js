/**
 * Sophie's Escape — Pure reducer (ADR 004)
 *
 * (state, action) → state
 * Deterministic and side-effect-free. Every behaviour rule lives here.
 * No browser APIs. No Three.js. No Howler. Worker-safe.
 *
 * Witch trigger timer:
 * - Resets to zero on REVEAL_HINT (Decision 10, option A1).
 * - Does not tick when overlays are open or game is paused (Decision 10, B1).
 *
 * v0.2 additions:
 *   USE_ITEM_ON_TARGET — use a held item on a scene target (puzzle trigger).
 *   COMBINE_ITEMS      — combine two inventory items into one.
 *   EXAMINE_CLUE       — observe a clue (adds it to inventory as a non-consumed note).
 *   PUZZLE_COMPLETE    — alias for PUZZLE_SOLVED with optional item production.
 *   GAME_COMPLETE      — alias for WIN, fires when castle gate opens.
 */

import { createInitialState } from './state.js';
import { ITEM_COMBINATIONS, PUZZLE_DEFINITIONS } from '../assets/room-data.js';

// Witch trigger thresholds (milliseconds).
const WITCH_TRIGGER_ROOMS_1_6 = 240_000; // 4 minutes (Tad Decision 10 recommendation)
const WITCH_TRIGGER_ROOMS_7_10 = 180_000; // 3 minutes in later rooms
const WITCH_MIN_INTERVAL = 300_000; // 5 minutes minimum between encounters

/**
 * @param {import('./state.js').GameState} state
 * @param {{ type: string, payload?: object }} action
 * @returns {import('./state.js').GameState}
 */
export function reducer(state, action) {
  switch (action.type) {
    case 'NEW_GAME':
      return { ...createInitialState(), gameStatus: 'playing' };

    case 'LOAD_GAME':
      return { ...state, ...(action.payload ?? {}), gameStatus: 'playing' };

    case 'ENTER_ROOM': {
      const roomId = action.payload.roomId;
      const alreadyVisited = state.roomsVisited.includes(roomId);
      return {
        ...state,
        currentRoomId: roomId,
        roomsVisited: alreadyVisited
          ? state.roomsVisited
          : [...state.roomsVisited, roomId],
      };
    }

    case 'PICK_UP_ITEM': {
      const { itemId } = action.payload;
      const alreadyHeld = state.inventory.items.some((i) => i.itemId === itemId);
      if (alreadyHeld) return state;
      return {
        ...state,
        inventory: {
          ...state.inventory,
          items: [
            ...state.inventory.items,
            { itemId, pickedUpAt: new Date().toISOString(), consumed: false },
          ],
        },
      };
    }

    case 'SELECT_ITEM': {
      const { itemId } = action.payload;
      if (state.inventory.selectedItemIds.includes(itemId)) return state;
      return {
        ...state,
        inventory: {
          ...state.inventory,
          selectedItemIds: [...state.inventory.selectedItemIds, itemId],
        },
      };
    }

    case 'DESELECT_ITEM': {
      const { itemId } = action.payload;
      return {
        ...state,
        inventory: {
          ...state.inventory,
          selectedItemIds: state.inventory.selectedItemIds.filter(
            (id) => id !== itemId
          ),
        },
      };
    }

    case 'CLEAR_SELECTION':
      return {
        ...state,
        inventory: { ...state.inventory, selectedItemIds: [] },
      };

    case 'CONSUME_ITEM': {
      const { itemId } = action.payload;
      return {
        ...state,
        inventory: {
          ...state.inventory,
          items: state.inventory.items.map((i) =>
            i.itemId === itemId ? { ...i, consumed: true } : i
          ),
        },
      };
    }

    case 'PUZZLE_STEP_COMPLETE': {
      const { puzzleId, stepId } = action.payload;
      const existing = state.puzzles[puzzleId] ?? {
        state: 'unsolved',
        stepsCompleted: [],
        attemptsCount: 0,
      };
      return {
        ...state,
        puzzles: {
          ...state.puzzles,
          [puzzleId]: {
            ...existing,
            state: 'in-progress',
            stepsCompleted: existing.stepsCompleted.includes(stepId)
              ? existing.stepsCompleted
              : [...existing.stepsCompleted, stepId],
          },
        },
      };
    }

    case 'PUZZLE_SOLVED': {
      const { puzzleId } = action.payload;
      const existing = state.puzzles[puzzleId] ?? {
        state: 'unsolved',
        stepsCompleted: [],
        attemptsCount: 0,
      };
      return {
        ...state,
        puzzles: {
          ...state.puzzles,
          [puzzleId]: { ...existing, state: 'solved' },
        },
      };
    }

    case 'PUZZLE_ATTEMPT': {
      const { puzzleId } = action.payload;
      const existing = state.puzzles[puzzleId] ?? {
        state: 'unsolved',
        stepsCompleted: [],
        attemptsCount: 0,
      };
      return {
        ...state,
        puzzles: {
          ...state.puzzles,
          [puzzleId]: {
            ...existing,
            attemptsCount: existing.attemptsCount + 1,
          },
        },
      };
    }

    case 'REVEAL_HINT': {
      const { puzzleId } = action.payload;
      const existingHint = state.hints[puzzleId] ?? {
        revealed: 0,
        lastViewedAt: null,
      };
      return {
        ...state,
        hints: {
          ...state.hints,
          [puzzleId]: {
            revealed: Math.min(existingHint.revealed + 1, 3),
            lastViewedAt: new Date().toISOString(),
          },
        },
        // Decision 10, option A1: hint reveal resets the witch trigger timer.
        witch: {
          ...state.witch,
          trigger: { ...state.witch.trigger, timerActiveMs: 0 },
        },
      };
    }

    case 'WITCH_TIMER_TICK': {
      const { deltaMs } = action.payload;
      const triggerThreshold = _witchThreshold(state.currentRoomId);
      const newTimerMs = state.witch.trigger.timerActiveMs + deltaMs;

      if (newTimerMs >= triggerThreshold) {
        // Threshold crossed: trigger will be fired by game loop.
        return {
          ...state,
          witch: {
            ...state.witch,
            trigger: { ...state.witch.trigger, timerActiveMs: newTimerMs },
          },
        };
      }

      return {
        ...state,
        witch: {
          ...state.witch,
          trigger: { ...state.witch.trigger, timerActiveMs: newTimerMs },
        },
      };
    }

    case 'WITCH_ENCOUNTER_FIRED': {
      const { lineId } = action.payload;
      const linesUsed = [...state.witch.linesUsed, lineId];
      return {
        ...state,
        witch: {
          ...state.witch,
          encountersCount: state.witch.encountersCount + 1,
          lastEncounterAt: new Date().toISOString(),
          linesUsed,
          trigger: {
            ...state.witch.trigger,
            timerActiveMs: 0,
          },
        },
        gameStatus: 'paused',
      };
    }

    case 'OVERLAY_OPENED': {
      const { overlayName } = action.payload;
      if (state.openOverlays.includes(overlayName)) return state;
      return {
        ...state,
        openOverlays: [...state.openOverlays, overlayName],
      };
    }

    case 'OVERLAY_CLOSED': {
      const { overlayName } = action.payload;
      return {
        ...state,
        openOverlays: state.openOverlays.filter((n) => n !== overlayName),
      };
    }

    case 'PAUSE':
      return { ...state, gameStatus: 'paused' };

    case 'RESUME':
      return {
        ...state,
        gameStatus: 'playing',
        openOverlays: state.openOverlays.filter((n) => n !== 'pause'),
      };

    case 'WIN':
      return { ...state, gameStatus: 'won' };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...(action.payload ?? {}) },
      };

    case 'TICK_ELAPSED': {
      const { deltaMs } = action.payload;
      return { ...state, elapsedMs: state.elapsedMs + deltaMs };
    }

    // ── v0.2 intents ─────────────────────────────────────────────────────────

    /**
     * USE_ITEM_ON_TARGET: apply a selected item to an interactable target.
     * payload: { itemId, targetId }
     *
     * Looks up the puzzle definition whose target matches targetId.
     * Checks whether itemId is a required item for that puzzle and whether
     * all required items are held (not consumed).
     * On success: marks puzzle solved, consumes items, adds produced item.
     */
    case 'USE_ITEM_ON_TARGET': {
      const { targetId } = action.payload;

      // Find the puzzle for this target.
      const puzzleEntry = Object.entries(PUZZLE_DEFINITIONS).find(
        ([, def]) => def.target === targetId
      );
      if (!puzzleEntry) return state;

      const [puzzleId, puzzleDef] = puzzleEntry;

      // Puzzle already solved — no-op.
      if (state.puzzles[puzzleId]?.state === 'solved') return state;

      // Check all required items are held and not consumed.
      const heldIds = new Set(
        state.inventory.items
          .filter((i) => !i.consumed)
          .map((i) => i.itemId)
      );
      const allRequiredHeld = puzzleDef.requiredItems.every((id) => heldIds.has(id));

      // Record the attempt.
      const existing = state.puzzles[puzzleId] ?? {
        state: 'unsolved',
        stepsCompleted: [],
        attemptsCount: 0,
      };

      if (!allRequiredHeld) {
        // Wrong or incomplete — just count the attempt.
        return {
          ...state,
          puzzles: {
            ...state.puzzles,
            [puzzleId]: { ...existing, attemptsCount: existing.attemptsCount + 1 },
          },
        };
      }

      // Puzzle solved — consume items and add produced item.
      let items = state.inventory.items.map((i) =>
        puzzleDef.consumedItems.includes(i.itemId) ? { ...i, consumed: true } : i
      );

      if (puzzleDef.producedItem) {
        const alreadyHeld = items.some((i) => i.itemId === puzzleDef.producedItem);
        if (!alreadyHeld) {
          items = [
            ...items,
            {
              itemId: puzzleDef.producedItem,
              pickedUpAt: new Date().toISOString(),
              consumed: false,
            },
          ];
        }
      }

      return {
        ...state,
        inventory: {
          ...state.inventory,
          items,
          selectedItemIds: [],
        },
        puzzles: {
          ...state.puzzles,
          [puzzleId]: { ...existing, state: 'solved', attemptsCount: existing.attemptsCount + 1 },
        },
      };
    }

    /**
     * COMBINE_ITEMS: attempt to combine two selected items.
     * payload: { itemIds: [string, string] }
     *
     * Sorts the pair alphabetically to find the combination definition.
     * On success: consumes the inputs and adds the output item.
     * On failure: returns state unchanged (UI shows feedback separately).
     */
    case 'COMBINE_ITEMS': {
      const { itemIds } = action.payload;
      if (!itemIds || itemIds.length < 2) return state;

      // Sort to match the combination table's canonical key.
      const sortedPair = [...itemIds].sort();

      const combo = ITEM_COMBINATIONS.find(
        (c) =>
          c.inputs[0] === sortedPair[0] && c.inputs[1] === sortedPair[1]
      );

      if (!combo) {
        // No valid combination — return unchanged (UI shows "nothing happened").
        return state;
      }

      // Consume inputs.
      let items = state.inventory.items.map((i) =>
        combo.consumedItems.includes(i.itemId) ? { ...i, consumed: true } : i
      );

      // Produce output.
      const alreadyHeld = items.some((i) => i.itemId === combo.output);
      if (!alreadyHeld) {
        items = [
          ...items,
          {
            itemId: combo.output,
            pickedUpAt: new Date().toISOString(),
            consumed: false,
          },
        ];
      }

      return {
        ...state,
        inventory: {
          ...state.inventory,
          items,
          selectedItemIds: [],
        },
      };
    }

    /**
     * EXAMINE_CLUE: observe a clue in the scene and record it as an inventory note.
     * payload: { clueItemId }
     *
     * Adds the clue item to inventory (as a non-consumed note). The item is
     * flagged with consumed: false so it remains visible in the inventory.
     */
    case 'EXAMINE_CLUE': {
      const { clueItemId } = action.payload;
      const alreadyHeld = state.inventory.items.some((i) => i.itemId === clueItemId);
      if (alreadyHeld) return state;
      return {
        ...state,
        inventory: {
          ...state.inventory,
          items: [
            ...state.inventory.items,
            {
              itemId: clueItemId,
              pickedUpAt: new Date().toISOString(),
              consumed: false,
            },
          ],
        },
      };
    }

    /**
     * PUZZLE_COMPLETE: alias for PUZZLE_SOLVED (used by scene interaction handler).
     * payload: { puzzleId }
     */
    case 'PUZZLE_COMPLETE': {
      const { puzzleId: completedPuzzleId } = action.payload;
      const ex = state.puzzles[completedPuzzleId] ?? {
        state: 'unsolved',
        stepsCompleted: [],
        attemptsCount: 0,
      };
      return {
        ...state,
        puzzles: {
          ...state.puzzles,
          [completedPuzzleId]: { ...ex, state: 'solved' },
        },
      };
    }

    /**
     * GAME_COMPLETE: the game is won. Alias for WIN.
     */
    case 'GAME_COMPLETE':
      return { ...state, gameStatus: 'won' };

    default:
      return state;
  }
}

// ─── Witch threshold helper ───────────────────────────────────────────────────

function _witchThreshold(roomId) {
  const lateRooms = [
    'armoury',
    'tower-room',
    'witchs-study',
    'castle-gate',
  ];
  return lateRooms.includes(roomId)
    ? WITCH_TRIGGER_ROOMS_7_10
    : WITCH_TRIGGER_ROOMS_1_6;
}

/**
 * Returns true if the witch encounter should fire given the current state.
 * Called by the game loop; kept here so the logic is testable without a browser.
 * @param {import('./state.js').GameState} state
 * @returns {boolean}
 */
export function shouldFireWitchEncounter(state) {
  if (state.gameStatus !== 'playing') return false;
  if (state.openOverlays.length > 0) return false;

  const threshold = _witchThreshold(state.currentRoomId);
  if (state.witch.trigger.timerActiveMs < threshold) return false;

  // Respect minimum interval between encounters.
  if (state.witch.lastEncounterAt) {
    const elapsed = Date.now() - new Date(state.witch.lastEncounterAt).getTime();
    if (elapsed < WITCH_MIN_INTERVAL) return false;
  }

  return true;
}
