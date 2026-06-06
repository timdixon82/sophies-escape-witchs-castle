/**
 * Sophie's Escape — First-person Sophie player model
 *
 * Creates a low-poly Three.js representation of Sophie's hands in camera space.
 *
 *   handsGroup — left hand group and right hand group.
 *     Parent to the camera. These parts are always visible at the
 *     lower screen corners regardless of camera pitch (HUD-style).
 *
 * All parts use MeshLambertMaterial for consistency with existing room
 * materials (ADR 002). No textures are used — colour only.
 *
 * The calling code must:
 *   - Add handsGroup to the camera: `camera.add(handsGroup)`
 *   - Set camera.near = 0.05 to prevent near-frustum clipping of handsGroup
 */

import * as THREE from 'three';

// ─── Colour palette ───────────────────────────────────────────────────────────

const COLOUR_FLESH = 0xf5c5a3; // skin / limbs

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Creates a Mesh with the given geometry and a MeshLambertMaterial in the
 * specified colour.
 * @param {THREE.BufferGeometry} geometry
 * @param {number} colour  Hex colour integer (e.g. 0xf5c5a3)
 * @returns {THREE.Mesh}
 */
function _makePart(geometry, colour) {
  const material = new THREE.MeshLambertMaterial({ color: colour });
  return new THREE.Mesh(geometry, material);
}

/**
 * Builds one multi-part hand group (7 meshes: forearm, palm, 4 fingers, thumb).
 * All parts are flesh-coloured. Group position and rotation are set in camera
 * space so the hand sits at the lower-left or lower-right corner of the view.
 * @param {'left' | 'right'} side
 * @returns {THREE.Group}
 */
function _makeHand(side) {
  const group = new THREE.Group();

  // Forearm — drops off-screen below the palm.
  const forearm = _makePart(new THREE.CylinderGeometry(0.025, 0.03, 0.22, 6), COLOUR_FLESH);
  forearm.position.set(0, -0.14, 0);
  group.add(forearm);

  // Palm — the main hand body.
  const palm = _makePart(new THREE.BoxGeometry(0.09, 0.10, 0.05), COLOUR_FLESH);
  palm.position.set(0, 0.0, 0);
  group.add(palm);

  // Index finger
  const index = _makePart(new THREE.BoxGeometry(0.016, 0.065, 0.020), COLOUR_FLESH);
  index.position.set(-0.030, 0.097, 0);
  group.add(index);

  // Middle finger — slightly longer.
  const middle = _makePart(new THREE.BoxGeometry(0.016, 0.072, 0.020), COLOUR_FLESH);
  middle.position.set(-0.010, 0.101, 0);
  group.add(middle);

  // Ring finger
  const ring = _makePart(new THREE.BoxGeometry(0.016, 0.065, 0.020), COLOUR_FLESH);
  ring.position.set(0.010, 0.098, 0);
  group.add(ring);

  // Pinky — shortest finger.
  const pinky = _makePart(new THREE.BoxGeometry(0.013, 0.052, 0.018), COLOUR_FLESH);
  pinky.position.set(0.030, 0.092, 0);
  group.add(pinky);

  // Thumb — angled outward, mirrored per side.
  const thumb = _makePart(new THREE.BoxGeometry(0.020, 0.052, 0.022), COLOUR_FLESH);
  if (side === 'left') {
    thumb.position.set(-0.058, 0.020, 0.010);
    thumb.rotation.z = -0.55;
  } else {
    thumb.position.set(0.058, 0.020, 0.010);
    thumb.rotation.z = 0.55;
  }
  group.add(thumb);

  // Group position and rotation in camera space.
  // rotation.z angles the arm inward from the bottom corner;
  // rotation.x tilts the palm slightly toward the viewer.
  if (side === 'left') {
    group.position.set(-0.30, -0.28, -0.38);
    group.rotation.z = 0.35;
    group.rotation.x = -0.10;
  } else {
    group.position.set(0.30, -0.28, -0.38);
    group.rotation.z = -0.35;
    group.rotation.x = -0.10;
  }

  return group;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Builds and returns Sophie's hands as a Three.js Group.
 *
 * @returns {{ handsGroup: THREE.Group }}
 *
 * handsGroup — attach to the camera.
 *   Contains the left and right hand groups. Each hand has 7 parts: forearm,
 *   palm, index finger, middle finger, ring finger, pinky, and thumb. The
 *   hands remain fixed at the lower screen corners regardless of camera pitch.
 *
 * The caller must also set `camera.near = 0.05` and call
 * `camera.updateProjectionMatrix()` so close geometry on handsGroup does not clip.
 */
export function createSophieModel() {
  const handsGroup = new THREE.Group();
  handsGroup.add(_makeHand('left'));
  handsGroup.add(_makeHand('right'));
  return { handsGroup };
}
