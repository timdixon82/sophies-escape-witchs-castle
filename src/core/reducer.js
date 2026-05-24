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
 */

import { createInitialState } from './state.js';

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
