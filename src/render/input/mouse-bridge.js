/**
 * Sophie's Escape — Mouse input bridge (ADR 005)
 *
 * Handles desktop mouse-look (pointer-lock) and click-to-interact.
 * Emits LOOK_DELTA { dx, dy } intents for continuous camera rotation.
 * Emits INTERACT on left-click when gameplay is active.
 *
 * Pointer lock is optional in v0.1. The game works without it;
 * the player can still look with A/D keyboard.
 *
 * Sensitivity: 0.2 degrees per pixel (tuneable; see TODO below).
 * TODO(v0.2): expose sensitivity in settings per ADR 004 UPDATE_SETTINGS.
 */

import { emit } from './intent-bus.js';
import { getState } from '../../core/state.js';

const MOUSE_SENSITIVITY = 0.2;

/** @type {HTMLCanvasElement | null} */
let _canvas = null;
let _pointerlockChangeHandler = null;
let _mousemoveHandler = null;
let _clickHandler = null;

/**
 * Installs the mouse bridge on the given canvas.
 * @param {HTMLCanvasElement} canvas
 */
export function installMouseBridge(canvas) {
  _canvas = canvas;

  // Click on canvas — request pointer lock (desktop experience) and emit INTERACT.
  _clickHandler = () => {
    const state = getState();
    if (state.gameStatus !== 'playing' || state.openOverlays.length > 0) return;
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock().catch(() => {
        // Pointer lock refused (iOS, incognito, etc.). Non-fatal.
      });
    } else {
      emit('INTERACT');
    }
  };
  canvas.addEventListener('click', _clickHandler);

  // Pointer lock change — resume game state if pointer lock is released.
  _pointerlockChangeHandler = () => {
    if (document.pointerLockElement !== canvas) {
      // Pointer lock was released (Escape pressed). The keyboard bridge
      // handles the Escape intent; nothing extra needed here.
    }
  };
  document.addEventListener('pointerlockchange', _pointerlockChangeHandler);

  // Mouse move — only fires while pointer is locked.
  _mousemoveHandler = (e) => {
    if (document.pointerLockElement !== canvas) return;
    const state = getState();
    if (state.gameStatus !== 'playing' || state.openOverlays.length > 0) return;
    emit('LOOK_DELTA', {
      dx: e.movementX * MOUSE_SENSITIVITY,
      dy: e.movementY * MOUSE_SENSITIVITY,
    });
  };
  document.addEventListener('mousemove', _mousemoveHandler);
}

/**
 * Removes the mouse bridge.
 */
export function removeMouseBridge() {
  if (_canvas && _clickHandler) _canvas.removeEventListener('click', _clickHandler);
  if (_pointerlockChangeHandler)
    document.removeEventListener('pointerlockchange', _pointerlockChangeHandler);
  if (_mousemoveHandler) document.removeEventListener('mousemove', _mousemoveHandler);
  _canvas = null;
  _clickHandler = null;
  _pointerlockChangeHandler = null;
  _mousemoveHandler = null;
}
