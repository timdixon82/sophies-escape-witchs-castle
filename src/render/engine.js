/**
 * Sophie's Escape — Three.js engine initialiser (ADR 001, ADR 002)
 *
 * The ONLY file in the project that imports from 'three'.
 * No code outside src/render/ imports from 'three' directly.
 *
 * Initialises the WebGL renderer, the camera, and the first-person
 * scene with brand colours from Simon's design tokens.
 *
 * Design tokens used here (contrast ratios in tokens.css):
 *   --bg-canvas: #0a0a0a → Three.js clearColor
 *   --accent-amber: #ffa040 → torch point light colour
 */

import * as THREE from 'three';

/** @type {THREE.WebGLRenderer | null} */
let _renderer = null;

/** @type {THREE.Scene | null} */
let _scene = null;

/** @type {THREE.PerspectiveCamera | null} */
let _camera = null;

/** @type {boolean} */
let _running = false;

/** @type {number | null} */
let _animFrameId = null;

/** @type {((deltaMs: number) => void) | null} */
let _onFrameCallback = null;

let _prevTime = 0;

// ─── Design token values (mirrored from tokens.css) ───────────────────────────
// These are referenced here so the renderer uses the same brand colours as the
// HTML overlay layer. If Simon's tokens change, update both places.
const TOKEN_BG_CANVAS = 0x0a0a0a; // #0a0a0a — near-black canvas background
const TOKEN_ACCENT_AMBER = 0xffa040; // #ffa040 — torch point light
const TOKEN_FG_PRIMARY = 0xf0eae0; // #f0eae0 — ambient light tint (warm off-white)

/**
 * Initialises the Three.js renderer and attaches it to the canvas element.
 *
 * iOS Safari note: the canvas is hidden during boot (display:none equivalent
 * because of the HTML `hidden` attribute), so clientWidth/clientHeight are 0.
 * We fall back to window.innerWidth/innerHeight so the WebGL context is
 * created with a valid non-zero size. The ResizeObserver fires once the
 * canvas becomes visible and corrects the dimensions.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {void}
 * @throws {Error} if WebGL context creation fails (caught by boot() in main.js)
 */
export function initEngine(canvas) {
  // Resolve viewport dimensions. A hidden canvas reports clientWidth=0;
  // fall back to the window viewport so Three.js gets a non-zero size.
  const initialW = canvas.clientWidth || window.innerWidth || 320;
  const initialH = canvas.clientHeight || window.innerHeight || 568;

  // WebGL renderer — uses the provided canvas element.
  // No try/catch here: let the error propagate to boot() in main.js so the
  // global error handler can surface it on the loading screen.
  _renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'default',
  });
  _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  _renderer.setSize(initialW, initialH);

  // clearColor matches --bg-canvas: #0a0a0a, full opacity.
  _renderer.setClearColor(TOKEN_BG_CANVAS, 1);

  // Handle resize. ResizeObserver fires when the canvas becomes visible.
  const resizeObserver = new ResizeObserver(() => _onResize(canvas));
  resizeObserver.observe(canvas);

  // Camera — 75° FoV, aspect set on resize, near 0.1m, far 100m.
  // Use the same fallback dimensions so aspect is never NaN.
  _camera = new THREE.PerspectiveCamera(
    75,
    initialW / initialH,
    0.1,
    100
  );
  _camera.position.set(0, 1.7, 0); // eye height 1.7 m
  _camera.rotation.order = 'YXZ';

  // Scene with ambient light and the dungeon-cell room placeholder.
  _scene = new THREE.Scene();
  _scene.background = new THREE.Color(TOKEN_BG_CANVAS);

  _buildDungeonCellPlaceholder(_scene);
}

/**
 * Starts the render loop. Calls onFrame(deltaMs) each frame.
 * @param {(deltaMs: number) => void} onFrame
 */
export function startLoop(onFrame) {
  _onFrameCallback = onFrame;
  _running = true;
  _prevTime = performance.now();
  _tick();
}

/**
 * Stops the render loop.
 */
export function stopLoop() {
  _running = false;
  if (_animFrameId !== null) {
    cancelAnimationFrame(_animFrameId);
    _animFrameId = null;
  }
}

/**
 * Returns the camera so the first-person controller can mutate it.
 * @returns {THREE.PerspectiveCamera | null}
 */
export function getCamera() {
  return _camera;
}

/**
 * Returns the scene.
 * @returns {THREE.Scene | null}
 */
export function getScene() {
  return _scene;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _tick() {
  if (!_running) return;
  _animFrameId = requestAnimationFrame(_tick);

  const now = performance.now();
  const deltaMs = Math.min(now - _prevTime, 100); // cap at 100ms to survive tab background
  _prevTime = now;

  if (_onFrameCallback) _onFrameCallback(deltaMs);

  if (_renderer && _scene && _camera) {
    _renderer.render(_scene, _camera);
  }
}

function _onResize(canvas) {
  if (!_renderer || !_camera) return;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  _renderer.setSize(w, h);
  _camera.aspect = w / h;
  _camera.updateProjectionMatrix();
}

/**
 * Builds the Dungeon Cell placeholder room (Room 1 from the brief).
 * Target: atmospheric box room with stone-grey walls, one torch sconce.
 * Geometry budget: well under 20,000 triangles per ADR 001.
 *
 * Lights:
 *   - Ambient: dim warm off-white (--fg-primary tint) to suggest candlelight.
 *   - Point light: amber (--accent-amber) for the torch sconce.
 *   - No shadow casting in v0.1 (performance; shadow will be added in v0.2).
 * @param {THREE.Scene} scene
 */
function _buildDungeonCellPlaceholder(scene) {
  // Ambient light — warm dim fill (mimics secondary torch bounce).
  // Low intensity so the torch point light dominates.
  const ambient = new THREE.AmbientLight(TOKEN_FG_PRIMARY, 0.3);
  scene.add(ambient);

  // Torch point light — amber, positioned upper-left like a wall sconce.
  // Intensity 1.5, decay 2, distance 8m.
  const torchLight = new THREE.PointLight(TOKEN_ACCENT_AMBER, 1.5, 8, 2);
  torchLight.position.set(-1.5, 2.2, -1.5);
  scene.add(torchLight);

  // Stone-grey material for the room surfaces.
  // A MeshStandardMaterial reacts to the lights above.
  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4540, // stone grey
    roughness: 0.9,
    metalness: 0.0,
  });

  const roomWidth = 5;
  const roomHeight = 3.5;
  const roomDepth = 6;

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(roomWidth, roomDepth),
    stoneMaterial
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(roomWidth, roomDepth),
    stoneMaterial
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = roomHeight;
  scene.add(ceiling);

  // Back wall (far from camera start)
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(roomWidth, roomHeight),
    stoneMaterial
  );
  backWall.position.set(0, roomHeight / 2, -roomDepth / 2);
  scene.add(backWall);

  // Front wall (behind camera start — player faces away from this)
  const frontWall = new THREE.Mesh(
    new THREE.PlaneGeometry(roomWidth, roomHeight),
    stoneMaterial
  );
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, roomHeight / 2, roomDepth / 2);
  scene.add(frontWall);

  // Left wall
  const leftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(roomDepth, roomHeight),
    stoneMaterial
  );
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
  scene.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(
    new THREE.PlaneGeometry(roomDepth, roomHeight),
    stoneMaterial
  );
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
  scene.add(rightWall);

  // Torch sconce placeholder — amber-glowing box on the left wall.
  const torchGeom = new THREE.BoxGeometry(0.15, 0.4, 0.1);
  const torchMaterial = new THREE.MeshStandardMaterial({
    color: TOKEN_ACCENT_AMBER,
    emissive: TOKEN_ACCENT_AMBER,
    emissiveIntensity: 0.8,
    roughness: 0.5,
  });
  const torch = new THREE.Mesh(torchGeom, torchMaterial);
  torch.position.set(-1.5, 2.2, -1.5);
  scene.add(torch);

  // Door placeholder — dark recessed box on the back wall.
  // Does not yet open. An interactable marker is added in v0.2.
  const doorGeom = new THREE.BoxGeometry(0.9, 1.8, 0.1);
  const doorMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e1a14, // very dark wood
    roughness: 1.0,
  });
  const door = new THREE.Mesh(doorGeom, doorMaterial);
  door.position.set(0, 0.9, -roomDepth / 2 + 0.05);
  door.userData = { interactable: true, id: 'room1-door', label: 'Heavy wooden door' };
  scene.add(door);
}
