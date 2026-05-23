/**
 * Sophie's Escape — Hint panel UI (FR-HINT-01 to FR-HINT-03)
 *
 * Renders the hint overlay for the current room's puzzle.
 * Three hints revealed progressively; each triggers an aria-live announcement.
 *
 * Accessibility:
 *   - Hint text in aria-live="polite" region (Simon's design spec).
 *   - "Show next hint" button removed after all 3 hints shown.
 *   - Step label "Hint 1 of 3" etc. announced via live region.
 */

import { getState, subscribe, dispatch } from '../core/state.js';
import { ROOM_HINTS } from '../assets/room-data.js';

/** @type {(() => void) | null} */
let _unsubscribe = null;

/**
 * Mounts the hint panel and subscribes to state.
 */
export function mountHintPanel() {
  document.getElementById('btn-show-next-hint')?.addEventListener('click', _onNextHint);

  _unsubscribe = subscribe((state, prev) => {
    if (state.hints !== prev.hints || state.currentRoomId !== prev.currentRoomId) {
      _render(state);
    }
  });

  _render(getState());
}

/**
 * Unmounts the hint panel.
 */
export function unmountHintPanel() {
  if (_unsubscribe) {
    _unsubscribe();
    _unsubscribe = null;
  }
}

// ─── Private ─────────────────────────────────────────────────────────────────

function _onNextHint() {
  const state = getState();
  const puzzleId = _currentPuzzleId(state);
  if (!puzzleId) return;
  dispatch({ type: 'REVEAL_HINT', payload: { puzzleId } });
}

function _render(state) {
  const puzzleId = _currentPuzzleId(state);
  const hintData = puzzleId ? ROOM_HINTS[puzzleId] : null;
  const hintState = puzzleId ? (state.hints[puzzleId] ?? { revealed: 0 }) : null;
  const revealed = hintState?.revealed ?? 0;

  const textEl = document.getElementById('hint-text');
  const stepLabelEl = document.getElementById('hint-step-label');
  const nextBtn = document.getElementById('btn-show-next-hint');
  const announcerEl = document.getElementById('hint-announcer');

  if (!puzzleId || !hintData) {
    if (textEl) textEl.textContent = 'No hints available in this room yet.';
    if (stepLabelEl) stepLabelEl.textContent = '';
    if (nextBtn) nextBtn.hidden = true;
    return;
  }

  if (revealed === 0) {
    // First open — show hint 1 immediately.
    dispatch({ type: 'REVEAL_HINT', payload: { puzzleId } });
    return;
  }

  // Render the revealed hints (accumulative display).
  if (textEl) {
    textEl.textContent = hintData[revealed - 1] ?? 'No hint available.';
  }

  if (stepLabelEl) {
    stepLabelEl.textContent = `Hint ${revealed} of 3`;
  }

  // Show "Show next hint" unless all 3 are revealed.
  if (nextBtn) {
    nextBtn.hidden = revealed >= 3;
    nextBtn.textContent = revealed === 2 ? 'Show final hint' : 'Show next hint';
  }

  // Announce the latest hint to screen readers via the live region.
  if (announcerEl && hintData[revealed - 1]) {
    announcerEl.textContent = '';
    // Force re-announcement by resetting then setting.
    requestAnimationFrame(() => {
      if (announcerEl) announcerEl.textContent = hintData[revealed - 1];
    });
  }
}

/**
 * Returns the active puzzle ID for the current room.
 * In v0.1 each room has at most one puzzle.
 * @param {import('../core/state.js').GameState} state
 * @returns {string | null}
 */
function _currentPuzzleId(state) {
  const roomPuzzleMap = {
    'dungeon-cell': 'cell-escape',
    // Other rooms: TODO(v0.2) — populate when puzzle data is confirmed.
  };
  return roomPuzzleMap[state.currentRoomId] ?? null;
}
