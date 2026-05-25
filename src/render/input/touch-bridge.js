/**
 * Sophie's Escape — Touch input bridge (ADR 005)
 *
 * Handles touchscreen input:
 *   - Drag on look area (right side of canvas) → LOOK_DELTA { dx, dy }
 *   - On-screen joystick (left side) → MOVE_FORWARD / MOVE_BACKWARD intents
 *   - Tap on canvas → INTERACT
 *   - On-screen HUD buttons → handled by HTML button click events
 *
 * Touch targets enforced at 44×44 CSS pixels minimum (NFR-MOB-01, ADR 005).
 * The joystick base is 100px (larger gesture surface; ADR 005 note).
 *
 * Sensitivity: 0.3 degrees per pixel for look. Joystick: threshold 12px.
 * TODO(v0.2): calibration pass on real device.
 */

import { emit } from './intent-bus.js';
import { getState } from '../../core/state.js';

const TOUCH_LOOK_SENSITIVITY = 0.3;
const JOYSTICK_MOVE_THRESHOLD = 12; // pixels

/** @type {HTMLCanvasElement | null} */
let _canvas = null;
/** @type {HTMLElement | null} */
let _joystickBase = null;
/** @type {HTMLElement | null} */
let _joystickKnob = null;

// Active touches.
let _lookTouchId = null;
let _lookPrevX = 0;
let _lookPrevY = 0;
let _joystickTouchId = null;
// eslint-disable-next-line no-unused-vars -- retained for v0.2: horizontal joystick look (only Y used in v0.1)
let _joystickOriginX = 0;
let _joystickOriginY = 0;

// Current joystick movement intents.
const _joystickHeld = new Set();

let _touchStartHandler = null;
let _touchMoveHandler = null;
let _touchEndHandler = null;

/**
 * Installs the touch bridge.
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLElement} joystickBase
 * @param {HTMLElement} joystickKnob
 */
export function installTouchBridge(canvas, joystickBase, joystickKnob) {
  _canvas = canvas;
  _joystickBase = joystickBase;
  _joystickKnob = joystickKnob;

  _touchStartHandler = (e) => _onTouchStart(e);
  _touchMoveHandler = (e) => _onTouchMove(e);
  _touchEndHandler = (e) => _onTouchEnd(e);

  canvas.addEventListener('touchstart', _touchStartHandler, { passive: false });
  canvas.addEventListener('touchmove', _touchMoveHandler, { passive: false });
  canvas.addEventListener('touchend', _touchEndHandler);
  canvas.addEventListener('touchcancel', _touchEndHandler);

  joystickBase.addEventListener('touchstart', _touchStartHandler, { passive: false });
  joystickBase.addEventListener('touchmove', _touchMoveHandler, { passive: false });
  joystickBase.addEventListener('touchend', _touchEndHandler);
  joystickBase.addEventListener('touchcancel', _touchEndHandler);
}

/**
 * Removes the touch bridge.
 */
export function removeTouchBridge() {
  if (_canvas && _touchStartHandler) {
    _canvas.removeEventListener('touchstart', _touchStartHandler);
    _canvas.removeEventListener('touchmove', _touchMoveHandler);
    _canvas.removeEventListener('touchend', _touchEndHandler);
    _canvas.removeEventListener('touchcancel', _touchEndHandler);
  }
  if (_joystickBase && _touchStartHandler) {
    _joystickBase.removeEventListener('touchstart', _touchStartHandler);
    _joystickBase.removeEventListener('touchmove', _touchMoveHandler);
    _joystickBase.removeEventListener('touchend', _touchEndHandler);
    _joystickBase.removeEventListener('touchcancel', _touchEndHandler);
  }
  _canvas = null;
  _joystickBase = null;
  _joystickKnob = null;
  _lookTouchId = null;
  _joystickTouchId = null;
  _joystickHeld.clear();
}

/**
 * Returns the current joystick movement intents (for the game loop to read each frame).
 * @returns {Set<string>}
 */
export function getJoystickHeld() {
  return _joystickHeld;
}

// ─── Private ─────────────────────────────────────────────────────────────────

function _isGameplayActive() {
  const state = getState();
  return state.gameStatus === 'playing' && state.openOverlays.length === 0;
}

function _onTouchStart(e) {
  if (!_isGameplayActive()) return;
  e.preventDefault();

  for (const touch of e.changedTouches) {
    // Check if this touch is on the joystick base.
    if (
      _joystickBase &&
      touch.target === _joystickBase &&
      _joystickTouchId === null
    ) {
      _joystickTouchId = touch.identifier;
      const rect = _joystickBase.getBoundingClientRect();
      _joystickOriginX = rect.left + rect.width / 2;
      _joystickOriginY = rect.top + rect.height / 2;
      continue;
    }

    // Otherwise treat as a look touch on the canvas.
    if (_lookTouchId === null && touch.target === _canvas) {
      _lookTouchId = touch.identifier;
      _lookPrevX = touch.clientX;
      _lookPrevY = touch.clientY;
    }
  }
}

function _onTouchMove(e) {
  if (!_isGameplayActive()) return;
  e.preventDefault();

  for (const touch of e.changedTouches) {
    // Look drag.
    if (touch.identifier === _lookTouchId) {
      const dx = (touch.clientX - _lookPrevX) * TOUCH_LOOK_SENSITIVITY;
      const dy = (touch.clientY - _lookPrevY) * TOUCH_LOOK_SENSITIVITY;
      _lookPrevX = touch.clientX;
      _lookPrevY = touch.clientY;
      if (dx !== 0 || dy !== 0) {
        emit('LOOK_DELTA', { dx, dy });
      }
    }

    // Joystick movement.
    if (touch.identifier === _joystickTouchId) {
      const offsetY = touch.clientY - _joystickOriginY;
      _joystickHeld.clear();

      if (offsetY < -JOYSTICK_MOVE_THRESHOLD) {
        _joystickHeld.add('MOVE_FORWARD');
      } else if (offsetY > JOYSTICK_MOVE_THRESHOLD) {
        _joystickHeld.add('MOVE_BACKWARD');
      }

      // Visual feedback: move the joystick knob.
      if (_joystickKnob) {
        const clampedY = Math.max(-30, Math.min(30, offsetY));
        _joystickKnob.style.transform = `translateY(${clampedY}px)`;
      }
    }
  }
}

function _onTouchEnd(e) {
  for (const touch of e.changedTouches) {
    if (touch.identifier === _lookTouchId) {
      // Short tap (< 200ms movement) → INTERACT
      // For simplicity in v0.1, any touch-end on canvas is treated as a tap
      // unless it was a look drag (delta > threshold).
      // TODO(v0.2): track touch duration and delta to distinguish tap from drag.
      _lookTouchId = null;
      emit('INTERACT');
    }

    if (touch.identifier === _joystickTouchId) {
      _joystickTouchId = null;
      _joystickHeld.clear();
      // Reset knob position.
      if (_joystickKnob) _joystickKnob.style.transform = '';
    }
  }
}
