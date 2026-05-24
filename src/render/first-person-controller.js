/**
 * Sophie's Escape — First-person controller (ADR 001, ADR 005)
 *
 * Consumes MOVE_* and LOOK_* intents from the intent bus.
 * Updates the Three.js camera position and rotation each frame.
 *
 * Look range constraints (FR-NAV-02, Tad CALL):
 *   Horizontal: ±80° (160° total)
 *   Vertical: ±45° (90° total)
 * These match the vestibular check the team established for ICCC.
 *
 * Reduced-motion: when prefers-reduced-motion is set, look acceleration
 * is removed (linear movement, no easing).
 *
 * Collision: simple floor-clamping and forward-ray check in v0.1.
 * Full wall collision via Raycaster is a TODO for v0.2.
 *
 * NOTE: This file imports from 'three' indirectly via engine.js
 * (which is the only direct importer). The camera reference is
 * passed in, keeping this file free of direct THREE imports.
 * That preserves the facade pattern from ADR 002.
 */

import { on } from './input/intent-bus.js';
import { getHeldIntents } from './input/keyboard-bridge.js';
import { getJoystickHeld } from './input/touch-bridge.js';

// Look sensitivity constants (degrees).
const KEYBOARD_LOOK_SPEED_DEG = 90; // degrees per second for keyboard look
const MOVE_SPEED = 3.0; // metres per second

// Clamp range in radians.
const MAX_HORIZONTAL_RAD = (80 * Math.PI) / 180; // ±80°
const MAX_VERTICAL_RAD = (45 * Math.PI) / 180; // ±45°

// Euler rotation stored as yaw (horizontal) and pitch (vertical).
// Applied to camera.rotation (order = 'YXZ' set in engine.js).
let _yaw = 0; // radians, horizontal
let _pitch = 0; // radians, vertical

/** @type {import('three').PerspectiveCamera | null} */
let _camera = null;

/** @type {MediaQueryList | null} */
let _reducedMotionQuery = null;

let _lookDeltaUnsub = null;

/**
 * Initialises the first-person controller.
 * @param {import('three').PerspectiveCamera} camera
 */
export function initFirstPersonController(camera) {
  _camera = camera;

  // Respect prefers-reduced-motion (NFR-ACC-03).
  _reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Subscribe to continuous look-delta intents (from mouse / touch drag).
  _lookDeltaUnsub = on('LOOK_DELTA', (payload) => {
    const { dx, dy } = /** @type {{ dx: number, dy: number }} */ (payload);
    _applyLookDelta(dx, dy);
  });
}

/**
 * Disposes the controller and removes listeners.
 */
export function disposeFirstPersonController() {
  if (_lookDeltaUnsub) _lookDeltaUnsub();
  _lookDeltaUnsub = null;
  _camera = null;
}

/**
 * Called each frame by the game loop. Updates camera from held intents.
 * @param {number} deltaMs
 */
export function updateFirstPersonController(deltaMs) {
  if (!_camera) return;
  const deltaSec = deltaMs / 1000;

  const held = new Set([...getHeldIntents(), ...getJoystickHeld()]);

  // Look via keyboard (held keys → angular rotation).
  if (held.has('LOOK_LEFT')) {
    _applyLookDelta(-KEYBOARD_LOOK_SPEED_DEG * deltaSec, 0);
  }
  if (held.has('LOOK_RIGHT')) {
    _applyLookDelta(KEYBOARD_LOOK_SPEED_DEG * deltaSec, 0);
  }

  // Movement — along the camera's forward direction (yaw only, no pitch).
  let moveZ = 0;
  if (held.has('MOVE_FORWARD')) moveZ -= 1;
  if (held.has('MOVE_BACKWARD')) moveZ += 1;

  if (moveZ !== 0) {
    const sinYaw = Math.sin(_yaw);
    const cosYaw = Math.cos(_yaw);
    const speed = MOVE_SPEED * deltaSec;
    const newX = _camera.position.x + sinYaw * moveZ * speed;
    const newZ = _camera.position.z + cosYaw * moveZ * speed;

    // Simple room boundary clamp (placeholder; full raycast in v0.2).
    const ROOM_HALF_W = 2.3;
    const ROOM_HALF_D = 2.7;
    _camera.position.x = Math.max(-ROOM_HALF_W, Math.min(ROOM_HALF_W, newX));
    _camera.position.z = Math.max(-ROOM_HALF_D, Math.min(ROOM_HALF_D, newZ));
  }

  // Apply current yaw/pitch to camera.
  _camera.rotation.y = _yaw;
  _camera.rotation.x = _pitch;
}

// ─── Private ─────────────────────────────────────────────────────────────────

/**
 * Applies a look delta (in degrees) to yaw/pitch with clamping.
 * Reduced-motion: linear (no easing).
 * @param {number} dx horizontal degrees
 * @param {number} dy vertical degrees
 */
function _applyLookDelta(dx, dy) {
  _yaw -= (dx * Math.PI) / 180;
  _pitch -= (dy * Math.PI) / 180;

  // Clamp horizontal yaw to ±80° (160° total, FR-NAV-02).
  _yaw = Math.max(-MAX_HORIZONTAL_RAD, Math.min(MAX_HORIZONTAL_RAD, _yaw));

  // Clamp vertical pitch to ±45° (90° total, FR-NAV-02).
  _pitch = Math.max(-MAX_VERTICAL_RAD, Math.min(MAX_VERTICAL_RAD, _pitch));
}
