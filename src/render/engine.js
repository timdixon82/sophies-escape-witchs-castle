/**
 * Sophie's Escape — Three.js engine initialiser (ADR 001, ADR 002)
 *
 * One of the files in src/render/ that import from 'three'.
 * Per ADR 001: no code outside src/render/ imports from 'three' directly.
 * Within src/render/, room-manager.js and interaction-handler.js also import
 * Three.js. All Three.js imports remain behind the src/render/ facade.
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

  // Scene — background colour matches --bg-canvas token.
  // Room geometry is built by room-manager.js, not here.
  _scene = new THREE.Scene();
  _scene.background = new THREE.Color(TOKEN_BG_CANVAS);

  // The camera must be a scene descendant for Three.js to render objects
  // parented to it (e.g. the Sophie first-person model added in
  // first-person-controller.js). Without this call, camera.add(model) attaches
  // the model to the camera but renderer.render(scene, camera) never visits it
  // because the camera is not in the scene graph.
  _scene.add(_camera);
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

/**
 * Returns the WebGL renderer so callers can read its dimensions and pass it
 * to helpers such as updateItemLabels.
 * @returns {THREE.WebGLRenderer | null}
 */
export function getRenderer() {
  return _renderer;
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

// Room geometry is now managed entirely by src/render/room-manager.js.
// The v0.1 _buildDungeonCellPlaceholder function has been removed.
// engine.js remains the sole file importing from 'three' (ADR 001).
