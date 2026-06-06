/**
 * Sophie's Escape — First-person Sophie player model
 *
 * Creates a low-poly Three.js representation of Sophie (the player character)
 * split into two groups so the body responds to camera pitch:
 *
 *   handsGroup — left arm and right arm only.
 *     Parent to the camera. These two parts are always visible at the
 *     lower screen corners regardless of camera pitch (HUD-style).
 *
 *   bodyGroup — body/dress, legs, shoes, and hair.
 *     Parent to world or yaw space. The group origin sits at the player's
 *     eye level. Body parts are offset downward so they sit at ground level.
 *     When the camera pitches down ~60° or more, these parts scroll up into
 *     the lower portion of the viewport.
 *
 * All parts use MeshLambertMaterial for consistency with existing room
 * materials (ADR 002). No textures are used — colour only.
 *
 * The calling code must:
 *   - Add handsGroup to the camera: `camera.add(handsGroup)`
 *   - Add bodyGroup to the scene (world space): `scene.add(bodyGroup)`
 *   - Each frame, copy the camera's world position and yaw into bodyGroup
 *   - Set camera.near = 0.05 to prevent near-frustum clipping of handsGroup
 */

import * as THREE from 'three';

// ─── Colour palette ───────────────────────────────────────────────────────────

const COLOUR_DRESS   = 0x3a6fd8; // blue dress
const COLOUR_FLESH   = 0xf5c5a3; // skin / limbs
const COLOUR_SHOE    = 0xf0f0f0; // white shoes
const COLOUR_HAIR    = 0xf0d060; // blonde hair

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Creates a Mesh with the given geometry and a MeshLambertMaterial in the
 * specified colour.
 * @param {THREE.BufferGeometry} geometry
 * @param {number} colour  Hex colour integer (e.g. 0x3a6fd8)
 * @returns {THREE.Mesh}
 */
function _makePart(geometry, colour) {
  const material = new THREE.MeshLambertMaterial({ color: colour });
  return new THREE.Mesh(geometry, material);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Builds and returns Sophie's body split into two Three.js Groups.
 *
 * @returns {{ handsGroup: THREE.Group, bodyGroup: THREE.Group }}
 *
 * handsGroup — attach to the camera.
 *   Contains the left and right arms only. They remain fixed at the lower
 *   screen corners regardless of camera pitch.
 *
 * bodyGroup — attach to world/yaw space (scene).
 *   Contains the body, legs, shoes, and hair. The group origin is at the
 *   player's eye level. Each frame the caller must copy the camera's world
 *   position into bodyGroup.position and the player yaw into bodyGroup.rotation.y.
 *   When the camera pitches down the body parts rise into the lower viewport.
 *
 * The caller must also set `camera.near = 0.05` and call
 * `camera.updateProjectionMatrix()` so close geometry on handsGroup does not clip.
 */
export function createSophieModel() {
  // ── handsGroup (camera-parented) ──────────────────────────────────────────
  // Arms only. Positioned at the very bottom corners of the view.
  // z = -0.4 places them 40 cm in front of the lens (inside a 0.05 near plane).
  // rotation.z angles each arm slightly outward from the body centreline.

  const handsGroup = new THREE.Group();

  const leftArm = _makePart(new THREE.CylinderGeometry(0.03, 0.03, 0.25), COLOUR_FLESH);
  leftArm.position.set(-0.35, -0.25, -0.4);
  leftArm.rotation.z = 0.4; // angle outward (positive Z = left arm tilts right at top)
  handsGroup.add(leftArm);

  const rightArm = _makePart(new THREE.CylinderGeometry(0.03, 0.03, 0.25), COLOUR_FLESH);
  rightArm.position.set(0.35, -0.25, -0.4);
  rightArm.rotation.z = -0.4; // angle outward (negative Z = right arm tilts left at top)
  handsGroup.add(rightArm);

  // ── bodyGroup (world/yaw-parented) ────────────────────────────────────────
  // Body parts offset downward from the eye-level origin so they sit at
  // ground level. Eye height is ~1.7 m; offsets below:
  //   y = -1.35  → 0.35 m above ground  (dress centre)
  //   y = -1.65  → 0.05 m above ground  (legs)
  //   y = -1.62  → 0.08 m above ground  (shoes — just below legs, visible when looking down)
  //   y = -1.0   → 0.70 m above ground  (top of head / hair)
  // z = 0 so the body is centred directly on the player position in yaw space.

  const bodyGroup = new THREE.Group();

  // Body / dress
  const body = _makePart(new THREE.BoxGeometry(0.28, 0.35, 0.14), COLOUR_DRESS);
  body.position.set(0, -1.35, 0);
  bodyGroup.add(body);

  // Left leg
  const leftLeg = _makePart(new THREE.CylinderGeometry(0.04, 0.04, 0.25), COLOUR_FLESH);
  leftLeg.position.set(-0.08, -1.65, 0);
  bodyGroup.add(leftLeg);

  // Right leg
  const rightLeg = _makePart(new THREE.CylinderGeometry(0.04, 0.04, 0.25), COLOUR_FLESH);
  rightLeg.position.set(0.08, -1.65, 0);
  bodyGroup.add(rightLeg);

  // Left shoe
  const leftShoe = _makePart(new THREE.BoxGeometry(0.06, 0.04, 0.1), COLOUR_SHOE);
  leftShoe.position.set(-0.08, -1.62, 0);
  bodyGroup.add(leftShoe);

  // Right shoe
  const rightShoe = _makePart(new THREE.BoxGeometry(0.06, 0.04, 0.1), COLOUR_SHOE);
  rightShoe.position.set(0.08, -1.62, 0);
  bodyGroup.add(rightShoe);

  // Hair — top of head, just below eye level. Mostly out of frame when looking
  // forward; visible only when looking steeply down.
  const hair = _makePart(new THREE.BoxGeometry(0.22, 0.14, 0.18), COLOUR_HAIR);
  hair.position.set(0, -1.0, 0);
  bodyGroup.add(hair);

  return { handsGroup, bodyGroup };
}
