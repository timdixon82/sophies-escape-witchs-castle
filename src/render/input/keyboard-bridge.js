/**
 * Sophie's Escape — Keyboard input bridge (ADR 005)
 *
 * Listens to keydown/keyup on window.
 * Maps raw keyboard events to game intents via the intent bus.
 *
 * Control mapping (FR-CTRL-01):
 *   W / ArrowUp       → MOVE_FORWARD (held)
 *   S / ArrowDown     → MOVE_BACKWARD (held)
 *   A / ArrowLeft     → LOOK_LEFT (held)
 *   D / ArrowRight    → LOOK_RIGHT (held)
 *   E / Enter         → INTERACT (one-shot)
 *   I                 → TOGGLE_INVENTORY (one-shot)
 *   H                 → TOGGLE_HINTS (one-shot)
 *   Escape            → OPEN_PAUSE or CLOSE_OVERLAY depending on overlay state
 *   Tab               → NEXT_FOCUSABLE (when overlay open)
 *   Shift+Tab         → PREV_FOCUSABLE (when overlay open)
 *   Space             → ACTIVATE_FOCUSED (when overlay item focused)
 *
 * The bridge respects focus context: single-character shortcuts only fire
 * when focus is NOT inside an HTML form field (input, select, textarea).
 */

import { emit } from './intent-bus.js';
import { getState } from '../../core/state.js';

/** Keys currently held down (for movement intents). */
const _held = new Set();

/** @type {(() => void) | null} */
let _keydownHandler = null;
let _keyupHandler = null;

/**
 * Installs the keyboard bridge.
 */
export function installKeyboardBridge() {
  _keydownHandler = (e) => _onKeydown(e);
  _keyupHandler = (e) => _onKeyup(e);
  window.addEventListener('keydown', _keydownHandler);
  window.addEventListener('keyup', _keyupHandler);
}

/**
 * Removes the keyboard bridge.
 */
export function removeKeyboardBridge() {
  if (_keydownHandler) window.removeEventListener('keydown', _keydownHandler);
  if (_keyupHandler) window.removeEventListener('keyup', _keyupHandler);
  _keydownHandler = null;
  _keyupHandler = null;
  _held.clear();
}

/**
 * Returns the set of currently held movement intents.
 * The game loop reads this each frame.
 * @returns {Set<string>}
 */
export function getHeldIntents() {
  return _held;
}

// ─── Private ─────────────────────────────────────────────────────────────────

function _inFormField() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'select' || tag === 'textarea';
}

function _overlaysOpen() {
  return getState().openOverlays.length > 0;
}

function _onKeydown(e) {
  const key = e.key;
  const inForm = _inFormField();

  // Tab handling — always allowed when an overlay is open.
  if (key === 'Tab' && _overlaysOpen()) {
    // Do NOT prevent default here: the browser's native focus management
    // is what we want to use. The OverlayController traps focus inside dialogs.
    emit(e.shiftKey ? 'PREV_FOCUSABLE' : 'NEXT_FOCUSABLE');
    return;
  }

  // Escape — handles overlay close and game pause.
  if (key === 'Escape') {
    if (_overlaysOpen()) {
      emit('CLOSE_OVERLAY');
    } else {
      emit('OPEN_PAUSE');
    }
    return;
  }

  // All other shortcuts: skip if focus is in a form field to avoid
  // conflicting with text input (WCAG 2.1.4).
  if (inForm) return;

  // Movement keys (held — emit on press, remove on release).
  switch (key) {
    case 'w':
    case 'W':
    case 'ArrowUp':
      _held.add('MOVE_FORWARD');
      break;
    case 's':
    case 'S':
    case 'ArrowDown':
      _held.add('MOVE_BACKWARD');
      break;
    case 'a':
    case 'A':
    case 'ArrowLeft':
      _held.add('LOOK_LEFT');
      break;
    case 'd':
    case 'D':
    case 'ArrowRight':
      _held.add('LOOK_RIGHT');
      break;

    // One-shot intents.
    case 'e':
    case 'E':
      if (!_overlaysOpen()) emit('INTERACT');
      break;
    case 'Enter':
      if (_overlaysOpen()) {
        emit('ACTIVATE_FOCUSED');
      } else {
        emit('INTERACT');
      }
      break;
    case 'i':
    case 'I':
      emit('TOGGLE_INVENTORY');
      break;
    case 'h':
    case 'H':
      emit('TOGGLE_HINTS');
      break;
    case ' ':
      if (_overlaysOpen()) emit('ACTIVATE_FOCUSED');
      break;
    default:
      break;
  }
}

function _onKeyup(e) {
  const key = e.key;
  switch (key) {
    case 'w':
    case 'W':
    case 'ArrowUp':
      _held.delete('MOVE_FORWARD');
      break;
    case 's':
    case 'S':
    case 'ArrowDown':
      _held.delete('MOVE_BACKWARD');
      break;
    case 'a':
    case 'A':
    case 'ArrowLeft':
      _held.delete('LOOK_LEFT');
      break;
    case 'd':
    case 'D':
    case 'ArrowRight':
      _held.delete('LOOK_RIGHT');
      break;
    default:
      break;
  }
}
