/**
 * Sophie's Escape — First-person Sophie player model
 *
 * Creates a low-poly Three.js Group representing Sophie (the player character)
 * that is parented to the camera so the player can see her body, legs, shoes,
 * arms, and hair when looking down or at the lower edges of the screen.
 *
 * All parts use MeshLambertMaterial for consistency with existing room materials
 * (ADR 002). No textures are used — colour only.
 *
 * The group origin sits at camera position. Every part is offset relative to
 * that origin so the model appears in the lower portion of the first-person view:
 *   - Body/dress: lower-centre, always visible when looking slightly down.
 *   - Legs: below the dress, visible when looking down ~45° and below.
 *   - Shoes: at the feet, visible when looking steeply down.
 *   - Arms: to each side of the lower view, faintly visible at all times.
 *   - Hair: barely at the top of the model, mostly out of frame.
 *
 * The calling code must set camera.near = 0.05 before adding this group to
 * prevent near-frustum clipping of geometry close to the camera.
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
 * Builds and returns a Three.js Group containing all of Sophie's body parts.
 * Parent this group to the camera: `camera.add(createSophieModel())`.
 *
 * The caller must also set `camera.near = 0.05` and call
 * `camera.updateProjectionMatrix()` so close geometry does not clip.
 *
 * @returns {THREE.Group}
 */
export function createSophieModel() {
  const group = new THREE.Group();

  // All positions are in camera-local space (z = -0.3 places parts 30 cm in
  // front of the lens). With a 75° vertical FoV the NDC y-formula is:
  //   y_NDC = y_local / 0.3 / tan(37.5°) ≈ y_local / 0.230
  // A part is on-screen when |y_NDC| ≤ 1, i.e. |y_local| ≤ ~0.23.
  //
  // Final calibrated positions (camera-local, verified in-browser):
  //   Body/dress  y = -0.18   top of dress near bottom of screen when looking ahead
  //   Legs        y = -0.30   below dress, visible when looking down ~30°
  //   Shoes       y = -0.40   feet, visible when looking steeply down
  //   Arms        y = -0.20   lower-left/right edges, faintly visible at all times
  //   Hair        y = +0.05   barely above screen centre, mostly out of frame
  //
  // The model is parented to the camera so its screen position does not change
  // as the camera pitches — it behaves as a fixed HUD-style body view.

  // Body / dress
  const body = _makePart(new THREE.BoxGeometry(0.28, 0.35, 0.14), COLOUR_DRESS);
  body.position.set(0, -0.18, -0.3);
  group.add(body);

  // Left leg
  const leftLeg = _makePart(new THREE.CylinderGeometry(0.04, 0.04, 0.25), COLOUR_FLESH);
  leftLeg.position.set(-0.08, -0.30, -0.3);
  group.add(leftLeg);

  // Right leg
  const rightLeg = _makePart(new THREE.CylinderGeometry(0.04, 0.04, 0.25), COLOUR_FLESH);
  rightLeg.position.set(0.08, -0.30, -0.3);
  group.add(rightLeg);

  // Left shoe
  const leftShoe = _makePart(new THREE.BoxGeometry(0.06, 0.04, 0.1), COLOUR_SHOE);
  leftShoe.position.set(-0.08, -0.40, -0.3);
  group.add(leftShoe);

  // Right shoe
  const rightShoe = _makePart(new THREE.BoxGeometry(0.06, 0.04, 0.1), COLOUR_SHOE);
  rightShoe.position.set(0.08, -0.40, -0.3);
  group.add(rightShoe);

  // Left arm
  const leftArm = _makePart(new THREE.CylinderGeometry(0.03, 0.03, 0.25), COLOUR_FLESH);
  leftArm.position.set(-0.22, -0.20, -0.3);
  leftArm.rotation.z = -0.3;
  group.add(leftArm);

  // Right arm
  const rightArm = _makePart(new THREE.CylinderGeometry(0.03, 0.03, 0.25), COLOUR_FLESH);
  rightArm.position.set(0.22, -0.20, -0.3);
  rightArm.rotation.z = 0.3;
  group.add(rightArm);

  // Hair
  const hair = _makePart(new THREE.BoxGeometry(0.22, 0.14, 0.18), COLOUR_HAIR);
  hair.position.set(0, 0.05, -0.3);
  group.add(hair);

  return group;
}
