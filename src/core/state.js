/**
 * Sophie's Escape — Game State (ADR 004)
 *
 * Single source of truth for all run-time state.
 * The state is a plain JSON-serialisable object.
 * The only mutation path is dispatch(action).
 *
 * src/core/ has no browser APIs, no Three.js, no Howler. Worker-safe.
 */

import { reducer } from './reducer.js';
import { getPersistence } from './persistence.js';

/** @type {GameState} */
let _state = createInitialState();

/** @type {Array<(state: GameState, prev: GameState) => void>} */
const _subscribers = [];

let _saveDebounceTimer = null;
const SAVE_DEBOUNCE_MS = 500;

/**
 * Returns a deep-frozen snapshot of the current state.
 * @returns {Readonly<GameState>}
 */
export function getState() {
  return Object.freeze({ ..._state });
}

/**
 * The single mutation entry. Runs the action through the reducer.
 * @param {{ type: string, payload?: object }} action
 */
export function dispatch(action) {
  const prev = _state;
  _state = reducer(_state, action);
  _notifySubscribers(prev);
  _scheduleSave();
}

/**
 * Subscribes to state changes.
 * @param {(state: GameState, prev: GameState) => void} listener
 * @returns {() => void} unsubscribe function
 */
export function subscribe(listener) {
  _subscribers.push(listener);
  return () => {
    const idx = _subscribers.indexOf(listener);
    if (idx !== -1) _subscribers.splice(idx, 1);
  };
}

/**
 * Loads saved state from browser storage. Returns true if a save was found.
 * @returns {boolean}
 */
export function loadFromStorage() {
  try {
    const storage = getPersistence();
    const raw = storage.getItem('sophies-escape:save:v1');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed?.schemaVersion !== 1) return false;
    _state = { ...createInitialState(), ...parsed };
    return true;
  } catch {
    // Corrupted JSON, quota error, or private-browsing restriction.
    return false;
  }
}

/**
 * Writes the current state to browser storage immediately (bypasses debounce).
 */
export function saveToStorage() {
  try {
    const storage = getPersistence();
    storage.setItem('sophies-escape:save:v1', JSON.stringify(_state));
  } catch {
    // Storage unavailable (private browsing, quota exceeded). Non-fatal.
  }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _notifySubscribers(prev) {
  for (const listener of _subscribers) {
    listener(_state, prev);
  }
}

function _scheduleSave() {
  if (_saveDebounceTimer !== null) clearTimeout(_saveDebounceTimer);
  _saveDebounceTimer = setTimeout(saveToStorage, SAVE_DEBOUNCE_MS);
}

// ─── Initial state factory ────────────────────────────────────────────────────

/**
 * @returns {GameState}
 */
export function createInitialState() {
  return {
    schemaVersion: 1,
    sessionId: _generateUUID(),
    startedAt: new Date().toISOString(),
    elapsedMs: 0,
    currentRoomId: 'dungeon-cell',
    roomsVisited: ['dungeon-cell'],
    inventory: {
      items: [],
      selectedItemIds: [],
    },
    puzzles: {},
    hints: {},
    witch: {
      encountersCount: 0,
      lastEncounterAt: null,
      linesUsed: [],
      trigger: {
        currentPuzzleId: null,
        puzzleEnteredAt: null,
        timerActiveMs: 0,
      },
    },
    settings: {
      masterVolume: 0.8,
      reducedMotionUserOverride: null,
      controlsHelpSeen: false,
    },
    /** @type {'menu' | 'playing' | 'paused' | 'won'} */
    gameStatus: 'menu',
    /** @type {string[]} */
    openOverlays: [],
  };
}

function _generateUUID() {
  // NFR-BROWSER-01 target browsers all support crypto.randomUUID:
  // Chrome 92+, Safari 15.4+, Firefox 95+, Edge 92+.
  // Using Math.random() as a fallback would produce predictable session IDs
  // (CodeQL insecure-randomness High). Throw instead so the absence of the
  // API is a clear feature-detection failure, not silent degradation.
  if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') {
    throw new Error(
      'crypto.randomUUID is not available in this environment. ' +
      'Sophie\'s Escape requires Chrome 92+, Safari 15.4+, Firefox 95+, or Edge 92+.'
    );
  }
  return crypto.randomUUID();
}

/**
 * @typedef {{
 *   schemaVersion: number,
 *   sessionId: string,
 *   startedAt: string,
 *   elapsedMs: number,
 *   currentRoomId: string,
 *   roomsVisited: string[],
 *   inventory: { items: InventoryItem[], selectedItemIds: string[] },
 *   puzzles: Record<string, PuzzleState>,
 *   hints: Record<string, HintState>,
 *   witch: WitchState,
 *   settings: SettingsState,
 *   gameStatus: 'menu' | 'playing' | 'paused' | 'won',
 *   openOverlays: string[],
 * }} GameState
 *
 * @typedef {{ itemId: string, pickedUpAt: string, consumed: boolean }} InventoryItem
 * @typedef {{ state: 'unsolved'|'in-progress'|'solved', stepsCompleted: string[], attemptsCount: number }} PuzzleState
 * @typedef {{ revealed: number, lastViewedAt: string | null }} HintState
 * @typedef {{ encountersCount: number, lastEncounterAt: string|null, linesUsed: string[], trigger: WitchTrigger }} WitchState
 * @typedef {{ currentPuzzleId: string|null, puzzleEnteredAt: string|null, timerActiveMs: number }} WitchTrigger
 * @typedef {{ masterVolume: number, reducedMotionUserOverride: boolean|null, controlsHelpSeen: boolean }} SettingsState
 */
