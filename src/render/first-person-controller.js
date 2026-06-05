/**
 * Sophie's Escape — First-person controller (ADR 001, ADR 005)
 *
 * Consumes MOVE_* and LOOK_* intents from the intent bus.
 * Updates the Three.js camera position and rotation each frame.
 *
 * Look range constraints (FR-NAV-02):
 *   Horizontal: unlimited — full 360° rotation allowed.
 *   Vertical: ±85° — nearly straight down to nearly straight up.
 *
 * Reduced-motion: when prefers-reduced-motion is set, look acceleration
 * is removed (linear movement, no easing).
 *
 * Collision: room-boundary clamping + per-object Box3 collision.
 * Prop meshes registered via setCollidableMeshes() are checked each frame.
 *
 * NOTE: This file imports from 'three' indirectly via engine.js
 * (which is the only direct importer). The camera reference is
 * passed in, keeping this file free of direct THREE imports.
 * That preserves the facade pattern from ADR 002.
 */

import * as THREE from 'three';
import { on } from './input/intent-bus.js';
import { getHeldIntents } from './input/keyboard-bridge.js';
import { getJoystickHeld } from './input/touch-bridge.js';
import { getCurrentRoomId } from './room-manager.js';
import { play as playSound } from '../audio/audio-manager.js';

// Look sensitivity constants (degrees).
const KEYBOARD_LOOK_SPEED_DEG = 90; // degrees per second for keyboard look
const MOVE_SPEED = 3.0; // metres per second

// Clamp range in radians.
const MAX_VERTICAL_RAD = (85 * Math.PI) / 180; // ±85°

/** Player body radius used for collision response (metres). */
const PLAYER_RADIUS = 0.3;

/** Half-dimensions per room in metres, leaving a 0.3m body buffer from walls. */
const ROOM_BOUNDS = {
  'dungeon-cell':   { hw: 2.2, hd: 2.7 },
  'stone-corridor': { hw: 1.7, hd: 6.7 },
  kitchen:          { hw: 2.2, hd: 2.7 },
  library:          { hw: 2.7, hd: 3.2 },
  'great-hall':     { hw: 3.7, hd: 4.7 },
  chapel:           { hw: 2.7, hd: 3.7 },
  armoury:          { hw: 2.7, hd: 3.2 },
  'tower-room':     { hw: 2.2, hd: 2.2 },
  'witchs-study':   { hw: 2.2, hd: 3.2 },
  'castle-gate':    { hw: 2.7, hd: 2.2 },
};
const DEFAULT_BOUNDS = { hw: 2.2, hd: 2.7 };

// Euler rotation stored as yaw (horizontal) and pitch (vertical).
// Applied to camera.rotation (order = 'YXZ' set in engine.js).
let _yaw = 0; // radians, horizontal
let _pitch = 0; // radians, vertical

/** Accumulated distance (metres) since the last footstep sound. */
let _footstepAccum = 0;

/** Distance between footstep sounds (metres). */
const FOOTSTEP_INTERVAL = 0.5;

/** @type {import('three').PerspectiveCamera | null} */
let _camera = null;

/** @type {MediaQueryList | null} */
// eslint-disable-next-line no-unused-vars -- retained for v0.2: addEventListenter('change') will drive look-easing toggle
let _reducedMotionQuery = null;

let _lookDeltaUnsub = null;

/**
 * Collidable prop meshes for the current room.
 * Each entry has a pre-computed Box3 bounding box.
 * Updated when the room changes via setCollidableMeshes().
 * @type {Array<{ box: THREE.Box3 }>}
 */
let _collidables = [];

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
  _collidables = [];
}

/**
 * Registers collidable prop meshes for the current room.
 * Call from room-manager.js after building a room.
 * Only non-interactive meshes (furniture, props) should be registered here;
 * interactive items are small pick-ups that do not block movement.
 * @param {THREE.Mesh[]} meshes
 */
export function setCollidableMeshes(meshes) {
  _collidables = meshes.map((m) => {
    const box = new THREE.Box3().setFromObject(m);
    return { box };
  });
}

/**
 * Resets the player's position and look direction to the room entry position.
 * Call from room-manager.js immediately after a room transition.
 *
 * When `spawnPos` and `facingAngleY` are provided the player spawns near the
 * entry door facing into the new room (Fix 2). When called with no arguments
 * (new game, or rooms with no detectable entry door) the player spawns at
 * room centre facing −Z, matching the previous behaviour.
 *
 * Without this reset, the camera position persists across transitions and the
 * player may respawn directly in front of the dungeon-cell door, causing the
 * "two doors both lead to dungeon" symptom Tim reported (Issue 5).
 *
 * @param {[number, number, number]} spawnPos  World position [x, y, z] for the camera.
 * @param {number}                   facingAngleY  Yaw angle in radians (0 = facing −Z).
 */
export function resetCameraToRoomEntry(spawnPos = [0, 1.7, 0], facingAngleY = 0) {
  if (!_camera) return;
  _camera.position.set(...spawnPos);
  _yaw = facingAngleY;
  _pitch = 0;
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

    // Room boundary clamp, then per-object collision check.
    const bounds = _getRoomBounds();
    const clampedX = Math.max(-bounds.hw, Math.min(bounds.hw, newX));
    const clampedZ = Math.max(-bounds.hd, Math.min(bounds.hd, newZ));
    const resolved = _resolveCollision(_camera.position.x, _camera.position.z, clampedX, clampedZ);

    const movedX = resolved.x - _camera.position.x;
    const movedZ = resolved.z - _camera.position.z;
    _footstepAccum += Math.sqrt(movedX * movedX + movedZ * movedZ);

    _camera.position.x = resolved.x;
    _camera.position.z = resolved.z;
  }

  // Strafe — perpendicular to the camera's facing direction.
  let moveX = 0;
  if (held.has('MOVE_LEFT'))  moveX -= 1;
  if (held.has('MOVE_RIGHT')) moveX += 1;

  if (moveX !== 0) {
    const speed = MOVE_SPEED * deltaSec;
    // The camera's world-space right vector is (cos(yaw), 0, -sin(yaw)).
    const newX = _camera.position.x + Math.cos(_yaw) * moveX * speed;
    const newZ = _camera.position.z - Math.sin(_yaw) * moveX * speed;
    const bounds = _getRoomBounds();
    const clampedX = Math.max(-bounds.hw, Math.min(bounds.hw, newX));
    const clampedZ = Math.max(-bounds.hd, Math.min(bounds.hd, newZ));
    const resolved = _resolveCollision(_camera.position.x, _camera.position.z, clampedX, clampedZ);

    const movedX = resolved.x - _camera.position.x;
    const movedZ = resolved.z - _camera.position.z;
    _footstepAccum += Math.sqrt(movedX * movedX + movedZ * movedZ);

    _camera.position.x = resolved.x;
    _camera.position.z = resolved.z;
  }

  // Play footstep sound every FOOTSTEP_INTERVAL metres of actual movement.
  if (_footstepAccum >= FOOTSTEP_INTERVAL) {
    _footstepAccum -= FOOTSTEP_INTERVAL;
    playSound('footstep');
  }

  // Apply current yaw/pitch to camera.
  _camera.rotation.y = _yaw;
  _camera.rotation.x = _pitch;
}

// ─── Private ─────────────────────────────────────────────────────────────────

/**
 * Returns the movement half-dimensions for the current room.
 * Falls back to DEFAULT_BOUNDS when the room ID is unknown.
 * @returns {{ hw: number, hd: number }}
 */
function _getRoomBounds() {
  return ROOM_BOUNDS[getCurrentRoomId() ?? ''] ?? DEFAULT_BOUNDS;
}

/**
 * Applies a look delta (in degrees) to yaw/pitch with clamping.
 * Reduced-motion: linear (no easing).
 * @param {number} dx horizontal degrees
 * @param {number} dy vertical degrees
 */
function _applyLookDelta(dx, dy) {
  _yaw -= (dx * Math.PI) / 180;
  _pitch -= (dy * Math.PI) / 180;

  // Clamp vertical pitch to ±85° (nearly straight down/up, FR-NAV-02).
  _pitch = Math.max(-MAX_VERTICAL_RAD, Math.min(MAX_VERTICAL_RAD, _pitch));
}

/**
 * Checks the proposed new position (newX, newZ) against all registered
 * collidable meshes. If the player's body sphere (radius PLAYER_RADIUS,
 * centre Y = camera position Y) would overlap a bounding box, the movement
 * axis that caused the overlap is cancelled.
 *
 * Axes are resolved independently so the player can slide along a surface
 * rather than stopping dead.
 *
 * @param {number} oldX previous X position
 * @param {number} oldZ previous Z position
 * @param {number} newX proposed X position (after boundary clamp)
 * @param {number} newZ proposed Z position (after boundary clamp)
 * @returns {{ x: number, z: number }}
 */
function _resolveCollision(oldX, oldZ, newX, newZ) {
  if (_collidables.length === 0) return { x: newX, z: newZ };

  // Camera Y stays constant (1.6m eye height).
  const y = _camera ? _camera.position.y : 1.6;
  const r = PLAYER_RADIUS;

  let resolvedX = newX;
  let resolvedZ = newZ;

  for (const { box } of _collidables) {
    // Test proposed position: expand box by player radius and check centre point.
    const expanded = box.clone().expandByScalar(r);

    const inX = resolvedX >= expanded.min.x && resolvedX <= expanded.max.x;
    const inY = y >= expanded.min.y && y <= expanded.max.y;
    const inZ = resolvedZ >= expanded.min.z && resolvedZ <= expanded.max.z;

    if (inX && inY && inZ) {
      // There is an overlap. Try rolling back each axis independently.
      const tryOldX_newZ = oldX >= expanded.min.x && oldX <= expanded.max.x
        ? null // old X also inside — X slide won't help
        : oldX;
      const tryNewX_oldZ = oldZ >= expanded.min.z && oldZ <= expanded.max.z
        ? null
        : oldZ;

      if (tryOldX_newZ !== null) {
        // Slide along Z — revert X to old position.
        resolvedX = oldX;
      } else if (tryNewX_oldZ !== null) {
        // Slide along X — revert Z to old position.
        resolvedZ = oldZ;
      } else {
        // Both axes blocked — stop completely.
        resolvedX = oldX;
        resolvedZ = oldZ;
      }
    }
  }

  return { x: resolvedX, z: resolvedZ };
}
