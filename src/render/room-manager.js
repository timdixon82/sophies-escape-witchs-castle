/**
 * Sophie's Escape — Room Manager (v0.3, ADR 001, ADR 002)
 *
 * Builds and tears down Three.js geometry for each game room.
 * All geometry is placeholder: BoxGeometry, PlaneGeometry, CylinderGeometry.
 * No GLTF files are used. Each room is visually distinct via different wall
 * colours and a text HUD label so the player always knows where they are.
 *
 * Architecture:
 *   - Exports initRoomManager(scene) → call once after initEngine().
 *   - Exports enterRoom(roomId) → tears down previous room, builds new one.
 *   - Exports getInteractables() → returns the list of Raycaster targets.
 *
 * All interactable objects have userData:
 *   { interactable: true, id: string, label: string, type: 'item'|'door'|'puzzle' }
 *
 * The interaction handler (interaction-handler.js) reads userData to decide
 * what action to fire.
 *
 * Room wall colours are drawn from the design token set (tokens.css) mirrored
 * here as hex values. SE-002 accessibility exception applies: 3D scene colour
 * contrast criteria are not applicable to decorative geometry.
 */

import * as THREE from 'three';
import { getState } from '../core/state.js';
import { ITEMS } from '../assets/room-data.js';
import { setCollidableMeshes, resetCameraToRoomEntry } from './first-person-controller.js';
import { areItemLabelsVisible } from '../ui/settings-panel.js';

/** @type {THREE.Scene | null} */
let _scene = null;

/** @type {THREE.Object3D[]} — objects added for the current room; removed on transition. */
let _roomObjects = [];

/** @type {THREE.Mesh[]} — interactable meshes for the current room. */
let _interactables = [];

/**
 * Decorative prop meshes that block movement.
 * Walls and floor/ceiling planes are not included (the boundary-clamp handles
 * those). Only solid 3D props (cauldron, chest, desk, shelf, etc.) are here.
 * Populated during room build; cleared on teardown.
 * @type {THREE.Mesh[]}
 */
let _propMeshes = [];

/** @type {string | null} */
let _currentRoomId = null;

/** @type {HTMLElement | null} */
let _roomLabel = null;

/**
 * The ambient light for the current room.
 * Stored so brightness changes from settings can be applied immediately.
 * @type {THREE.AmbientLight | null}
 */
let _currentAmbient = null;

/**
 * The baseline ambient intensity for the current room (before brightness multiplier).
 * @type {number}
 */
let _currentAmbientBase = 0.8;

// ─── Design token wall colours (SE-002 exception — decorative geometry) ──────

const COLOURS = {
  dungeonCell: 0x6a6560,    // stone grey (lightened)
  stoneCorridor: 0x5d5b58,  // darker grey (lightened)
  kitchen: 0x7a5a40,        // warm brown (lightened)
  library: 0x4a5060,        // deep blue-grey (lightened)
  greatHall: 0x5a4a30,      // dark oak (lightened)
  chapel: 0x3a3a50,         // deep indigo (lightened)
  armoury: 0x505050,        // iron grey (lightened)
  towerRoom: 0x445060,      // slate blue (lightened)
  witchsStudy: 0x3e2a3e,    // deep purple (lightened)
  castleGate: 0x504840,     // aged stone (lightened)
};

const ROOM_FOG = {
  'dungeon-cell':    { color: 0x1a1510, density: 0.18 },
  'stone-corridor':  { color: 0x0e0e14, density: 0.10 },
  kitchen:           { color: 0x1a0e06, density: 0.12 },
  library:           { color: 0x0a0c12, density: 0.14 },
  'great-hall':      { color: 0x100800, density: 0.08 },
  chapel:            { color: 0x06060e, density: 0.12 },
  armoury:           { color: 0x080808, density: 0.14 },
  'tower-room':      { color: 0x060810, density: 0.12 },
  'witchs-study':    { color: 0x0a0410, density: 0.16 },
  'castle-gate':     { color: 0x101010, density: 0.06 },
};

const TOKEN_FG_PRIMARY = 0xf0eae0;
const TOKEN_ACCENT_AMBER = 0xffa040;
const TOKEN_ACCENT_GREEN = 0x7ed4a0;
const TOKEN_ACCENT_PURPLE = 0xc89eff;
const TOKEN_STATUS_ERROR = 0xff8080;

/**
 * Initialises the room manager with the Three.js scene.
 * Creates the room label HUD element.
 * @param {THREE.Scene} scene
 */
export function initRoomManager(scene) {
  _scene = scene;

  // Create the room label overlay element (WCAG: always announces current room).
  _roomLabel = document.getElementById('room-label-hud');
  if (!_roomLabel) {
    _roomLabel = document.createElement('div');
    _roomLabel.id = 'room-label-hud';
    _roomLabel.setAttribute('aria-live', 'off'); // announcements handled by game-announcer
    _roomLabel.setAttribute('aria-hidden', 'true'); // visual-only label
    _roomLabel.style.cssText = [
      'position:fixed',
      'top:16px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:15',
      'padding:4px 14px',
      'background:rgba(10,10,10,0.75)',
      'color:#f0eae0',
      'font:700 14px/1.5 system-ui,sans-serif',
      'border:1px solid rgba(255,160,64,0.4)',
      'border-radius:4px',
      'pointer-events:none',
      'letter-spacing:0.04em',
    ].join(';');
    document.body.appendChild(_roomLabel);
  }
}

/**
 * Transitions to a new room.
 * Tears down the previous room's objects, builds the new room, then places the
 * player near the entry door facing into the room.
 *
 * The entry door is the door in the NEW room whose target matches the room we
 * came FROM. Its stored `worldPos` and `rotationY` (set by `_makeDoor`) drive
 * the spawn offset (Fix 2). When no matching door is found — new game, or rooms
 * whose entry door uses the legacy raw-mesh path — the fallback is room centre
 * facing −Z, preserving the Issue 5 fix.
 *
 * @param {string} roomId
 */
export function enterRoom(roomId) {
  if (!_scene) return;
  if (roomId === _currentRoomId) return;

  // Capture the room we are leaving before teardown clears _currentRoomId.
  const fromRoomId = _currentRoomId;

  _tearDownRoom();
  _currentRoomId = roomId;
  _buildRoom(roomId);
  _updateRoomLabel(roomId);

  // Derive spawn position from the entry door in the newly built room.
  const [spawnPos, facingAngleY] = _spawnFromDoor(fromRoomId);
  resetCameraToRoomEntry(spawnPos, facingAngleY);
}

/**
 * Removes a single item mesh from the scene by its itemId.
 * Called by the interaction handler immediately after PICK_UP_ITEM dispatch.
 * More surgical than rebuildCurrentRoom() — only the specific mesh is removed,
 * so the keyboard nav list never briefly contains a stale entry.
 * @param {string} itemId — the item ID without the 'item-' prefix, e.g. 'bent-spoon'
 */
export function removeItemMesh(itemId) {
  const targetId = `item-${itemId}`;
  const idx = _interactables.findIndex((m) => m.userData.id === targetId);
  if (idx === -1) return;

  const mesh = _interactables[idx];

  // Remove the floating DOM label if present.
  if (mesh.userData.labelEl) {
    mesh.userData.labelEl.remove();
    mesh.userData.labelEl = null;
  }

  // Remove and dispose the interactable mesh itself.
  // When the mesh is a child of a Group (e.g. the bent-spoon handle), _scene.remove
  // is a no-op; the parent Group is listed in mesh.userData.companions and is
  // removed by the loop below.
  if (_scene) _scene.remove(mesh);
  if (mesh.geometry) mesh.geometry.dispose();
  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      for (const m of mesh.material) m.dispose();
    } else {
      mesh.material.dispose();
    }
  }

  // Remove from both tracking arrays.
  _interactables.splice(idx, 1);
  const roomIdx = _roomObjects.indexOf(mesh);
  if (roomIdx !== -1) _roomObjects.splice(roomIdx, 1);

  // Remove companion objects (wick, lights, groups, bow, teeth, etc.) whose
  // references are stored on the interactable mesh's userData.companions array.
  // This removes ghost geometry that would otherwise linger in the scene after
  // the interactable mesh is picked up.
  for (const companion of (mesh.userData.companions ?? [])) {
    if (_scene) _scene.remove(companion);
    if (companion.geometry) companion.geometry.dispose();
    if (companion.material) {
      if (Array.isArray(companion.material)) {
        for (const m of companion.material) m.dispose();
      } else {
        companion.material.dispose();
      }
    }
    const ci = _roomObjects.indexOf(companion);
    if (ci !== -1) _roomObjects.splice(ci, 1);
  }
}

/**
 * Rebuilds the current room in-place.
 * Called when a puzzle is solved and the room geometry needs to update
 * (e.g. to reveal a newly accessible item or change object colour).
 */
export function rebuildCurrentRoom() {
  if (!_scene || !_currentRoomId) return;
  const roomId = _currentRoomId;
  _tearDownRoom();
  _currentRoomId = roomId;
  _buildRoom(roomId);
  _updateRoomLabel(roomId);
}

/**
 * Returns the list of interactable meshes for the current room.
 * Used by the Raycaster in interaction-handler.js.
 * @returns {THREE.Mesh[]}
 */
export function getInteractables() {
  return _interactables;
}

/**
 * Returns the current room ID.
 * @returns {string | null}
 */
export function getCurrentRoomId() {
  return _currentRoomId;
}

/**
 * Applies a brightness multiplier to the current room's ambient light.
 * Called immediately when the brightness slider changes.
 * @param {number} multiplier — value in 0.2–4.0 range
 */
export function applyBrightness(multiplier) {
  if (_currentAmbient) {
    _currentAmbient.intensity = _currentAmbientBase * multiplier;
  }
}

/**
 * Repositions the floating DOM labels for all item-type interactables.
 * Call from the game loop each frame, after the camera matrices have been updated.
 *
 * Projects each item mesh's world position to screen coordinates using the
 * camera's projection matrix. Hides the label when the item is behind the camera
 * (projected Z > 1) or when no label element is present.
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.WebGLRenderer} renderer
 */
export function updateItemLabels(camera, renderer) {
  // Respect the "Show item labels" setting. When off, hide all labels and skip
  // projection work. When on, project each label to screen space as before.
  const labelsOn = areItemLabelsVisible();

  if (!labelsOn) {
    // Hide all labels efficiently without projecting geometry.
    for (const mesh of _interactables) {
      const labelEl = mesh.userData.labelEl;
      if (labelEl) labelEl.style.display = 'none';
    }
    return;
  }

  const size = renderer.getSize(new THREE.Vector2());
  const halfW = size.x / 2;
  const halfH = size.y / 2;

  for (const mesh of _interactables) {
    const labelEl = mesh.userData.labelEl;
    if (!labelEl) continue;

    // Project the mesh world position into NDC.
    const pos = mesh.position.clone();
    pos.project(camera);

    // pos.z > 1 means the point is behind the camera's near/far range.
    if (pos.z > 1) {
      labelEl.style.display = 'none';
      continue;
    }

    // Convert NDC to CSS pixel coordinates relative to the viewport.
    const screenX = (pos.x + 1) * halfW;
    const screenY = (-pos.y + 1) * halfH;

    labelEl.style.display = 'block';
    labelEl.style.left = `${Math.round(screenX)}px`;
    labelEl.style.top = `${Math.round(screenY - 24)}px`; // 24px above the projected centre
  }
}

// ─── Private: teardown ────────────────────────────────────────────────────────

function _tearDownRoom() {
  if (_scene) _scene.fog = null;
  for (const obj of _roomObjects) {
    // Remove the floating DOM label if this object has one.
    if (obj.userData && obj.userData.labelEl) {
      obj.userData.labelEl.remove();
      obj.userData.labelEl = null;
    }

    _scene.remove(obj);
    // Dispose geometry and material to avoid GPU memory leaks.
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        for (const m of obj.material) m.dispose();
      } else {
        obj.material.dispose();
      }
    }
  }

  // Some interactable meshes (e.g. the bent-spoon handle) hold a labelEl but
  // are not themselves entries in _roomObjects — their parent Group is. Walk
  // _interactables to catch any labelEl not already removed above.
  for (const mesh of _interactables) {
    if (mesh.userData && mesh.userData.labelEl) {
      mesh.userData.labelEl.remove();
      mesh.userData.labelEl = null;
    }
  }

  _roomObjects = [];
  _interactables = [];
  _propMeshes = [];
  _currentAmbient = null;
  _currentAmbientBase = 0.8;
  setCollidableMeshes([]);
}

// ─── Private: entry spawn ─────────────────────────────────────────────────────

/**
 * Computes the spawn position and yaw angle for the player when entering a room.
 *
 * Finds the door mesh in `_interactables` whose `userData.id` matches
 * `door-<fromRoomId>`, then offsets 0.7 m away from the door surface into the
 * room and sets the yaw so the player faces inward.
 *
 * Spawn rules (yaw = 0 faces −Z):
 *   End-wall door, +Z side  → spawn at (dx, 1.7, dz − 0.7), yaw = 0    (face −Z)
 *   End-wall door, −Z side  → spawn at (dx, 1.7, dz + 0.7), yaw = π    (face +Z)
 *   Left-wall door  (+π/2)  → spawn at (dx + 0.7, 1.7, dz), yaw = −π/2 (face +X)
 *   Right-wall door (−π/2)  → spawn at (dx − 0.7, 1.7, dz), yaw = +π/2 (face −X)
 *
 * Falls back to ([0, 1.7, 0], 0) when no matching door or door has no worldPos.
 *
 * @param {string | null} fromRoomId  The room the player came from.
 * @returns {[[number, number, number], number]}  [spawnPos, facingAngleY]
 */
function _spawnFromDoor(fromRoomId) {
  if (!fromRoomId) return [[0, 1.7, 0], 0];

  const doorMesh = _interactables.find((m) => m.userData.id === `door-${fromRoomId}`);
  if (!doorMesh || !doorMesh.userData.worldPos) return [[0, 1.7, 0], 0];

  const { x: dx, z: dz } = doorMesh.userData.worldPos;
  const rotY = doorMesh.userData.rotationY ?? 0;

  if (rotY > 0.01) {
    // Left-wall door (rotationY ≈ +π/2): face +X into the room.
    return [[dx + 0.7, 1.7, dz], -Math.PI / 2];
  }
  if (rotY < -0.01) {
    // Right-wall door (rotationY ≈ −π/2): face −X into the room.
    return [[dx - 0.7, 1.7, dz], Math.PI / 2];
  }
  // End-wall door (rotationY = 0).
  if (dz > 0) {
    // Door on the +Z end wall: face −Z into the room.
    return [[dx, 1.7, dz - 0.7], 0];
  }
  // Door on the −Z end wall: face +Z into the room.
  return [[dx, 1.7, dz + 0.7], Math.PI];
}

// ─── Private: room builders ───────────────────────────────────────────────────

function _buildRoom(roomId) {
  const fogCfg = ROOM_FOG[roomId] ?? { color: 0x0a0a0a, density: 0.12 };
  _scene.background = new THREE.Color(fogCfg.color);
  _scene.fog = new THREE.FogExp2(fogCfg.color, fogCfg.density);

  switch (roomId) {
    case 'dungeon-cell':
      _buildDungeonCell();
      break;
    case 'stone-corridor':
      _buildStoneCorridor();
      break;
    case 'kitchen':
      _buildKitchen();
      break;
    case 'library':
      _buildLibrary();
      break;
    case 'great-hall':
      _buildGreatHall();
      break;
    case 'chapel':
      _buildChapel();
      break;
    case 'armoury':
      _buildArmoury();
      break;
    case 'tower-room':
      _buildTowerRoom();
      break;
    case 'witchs-study':
      _buildWitchsStudy();
      break;
    case 'castle-gate':
      _buildCastleGate();
      break;
    default:
      _buildGenericRoom(roomId);
  }

  // Register solid props for per-object collision detection.
  setCollidableMeshes(_propMeshes);
}

// ─── Shared geometry helpers ──────────────────────────────────────────────────

/**
 * Reads the saved brightness multiplier from localStorage.
 * Returns the raw stored value (0.2–4.0), defaulting to 0.8 (the new lighter baseline).
 * @returns {number}
 */
function _getBrightnessMultiplier() {
  try {
    const stored = localStorage.getItem('sewc-brightness');
    if (stored !== null) {
      const v = parseFloat(stored);
      if (!isNaN(v)) return Math.max(0.2, Math.min(4.0, v));
    }
  } catch {
    // localStorage unavailable
  }
  return 0.8;
}

/**
 * Creates a box-room (6 planes: floor, ceiling, 4 walls).
 * Floor and ceiling use distinct materials derived from the wall colour
 * unless explicit overrides are provided.
 * @param {{ color: number, w: number, h: number, d: number, ambientIntensity?: number, floorColor?: number, ceilColor?: number }} opts
 * @returns {{ ambient: THREE.AmbientLight }}
 */
function _makeBoxRoom({ color, w, h, d, ambientIntensity = 0.8, floorColor, ceilColor }) {
  const wallMat  = new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0.0 });
  const floorMat = new THREE.MeshStandardMaterial({ color: floorColor ?? _darken(color, 0.85), roughness: 0.98, metalness: 0.0 });
  const ceilMat  = new THREE.MeshStandardMaterial({ color: ceilColor  ?? _lighten(color, 1.1),  roughness: 0.90, metalness: 0.0 });

  const planes = [
    // floor
    _makePlane(w, d, floorMat, [0, 0, 0], [-Math.PI / 2, 0, 0]),
    // ceiling
    _makePlane(w, d, ceilMat, [0, h, 0], [Math.PI / 2, 0, 0]),
    // back wall
    _makePlane(w, h, wallMat, [0, h / 2, -d / 2], [0, 0, 0]),
    // front wall
    _makePlane(w, h, wallMat, [0, h / 2, d / 2], [0, Math.PI, 0]),
    // left wall
    _makePlane(d, h, wallMat, [-w / 2, h / 2, 0], [0, Math.PI / 2, 0]),
    // right wall
    _makePlane(d, h, wallMat, [w / 2, h / 2, 0], [0, -Math.PI / 2, 0]),
  ];

  for (const p of planes) _add(p);

  const brightnessMult = _getBrightnessMultiplier();
  const ambient = new THREE.AmbientLight(TOKEN_FG_PRIMARY, ambientIntensity * brightnessMult);
  _add(ambient);

  // Store for live brightness updates via applyBrightness().
  _currentAmbient = ambient;
  _currentAmbientBase = ambientIntensity;

  return { ambient };
}

function _darken(hex, factor) {
  const r = Math.round(((hex >> 16) & 0xff) * factor);
  const g = Math.round(((hex >> 8)  & 0xff) * factor);
  const b = Math.round(( hex        & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

function _lighten(hex, factor) {
  const r = Math.min(255, Math.round(((hex >> 16) & 0xff) * factor));
  const g = Math.min(255, Math.round(((hex >> 8)  & 0xff) * factor));
  const b = Math.min(255, Math.round(( hex        & 0xff) * factor));
  return (r << 16) | (g << 8) | b;
}

function _makePlane(w, h, mat, pos, rot) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.set(...pos);
  mesh.rotation.set(...rot);
  return mesh;
}

function _makeBox(w, h, d, color, pos, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.8,
    metalness: opts.metalness ?? 0.0,
    emissive: opts.emissive ?? 0xffffff,
    emissiveIntensity: opts.emissiveIntensity ?? 0.0,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(...pos);
  return mesh;
}

function _makeCylinder(rt, rb, h, color, pos) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
    emissive: 0xffffff,
    emissiveIntensity: 0.0,
  });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 12), mat);
  mesh.position.set(...pos);
  return mesh;
}

function _makePointLight(color, intensity, distance, decay, pos) {
  const light = new THREE.PointLight(color, intensity, distance, decay);
  light.position.set(...pos);
  return light;
}

function _add(obj) {
  _scene.add(obj);
  _roomObjects.push(obj);
  return obj;
}

function _addInteractable(mesh, id, label, type) {
  mesh.userData = { interactable: true, id, label, type };
  _add(mesh);
  _interactables.push(mesh);
  return mesh;
}

/**
 * Adds a solid decorative prop to the scene and registers it for player collision.
 * Use for furniture-scale objects (cauldron, chest, shelf, etc.) that the player
 * should not be able to walk through. Small item pick-ups do not need this —
 * they are collected before the player reaches them.
 * @param {THREE.Mesh} mesh
 * @returns {THREE.Mesh}
 */
function _addProp(mesh) {
  _add(mesh);
  _propMeshes.push(mesh);
  return mesh;
}

/**
 * Attaches a floating DOM label (aria-hidden, visual only) to a mesh.
 * Stores it on mesh.userData.labelEl so the render loop can reposition it each frame.
 * @param {THREE.Mesh} mesh
 * @param {string} label
 */
function _attachItemLabel(mesh, label) {
  const labelEl = document.createElement('div');
  labelEl.className = 'item-label';
  labelEl.textContent = label;
  labelEl.setAttribute('aria-hidden', 'true');
  labelEl.style.cssText = [
    'position:absolute',
    'pointer-events:none',
    'z-index:5',
    'font:11px/1.4 system-ui,sans-serif',
    'color:#f0eae0',
    'background:rgba(0,0,0,0.6)',
    'padding:2px 5px',
    'border-radius:2px',
    'white-space:nowrap',
    'display:none',
  ].join(';');

  // On touch devices add a small "Tap" badge so the affordance is obvious.
  // aria-hidden: the badge is purely visual; the item label already names the action.
  // Guard typeof window: in the Node test environment window is not defined.
  if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    const tapBadge = document.createElement('span');
    tapBadge.className = 'tap-badge';
    tapBadge.textContent = 'Tap';
    tapBadge.setAttribute('aria-hidden', 'true');
    labelEl.appendChild(tapBadge);
  }

  document.body.appendChild(labelEl);
  mesh.userData.labelEl = labelEl;
}

// ─── Per-item shape builders ──────────────────────────────────────────────────

function _makeItemBentSpoon(pos) {
  const label = ITEMS['bent-spoon'].label;
  // Group: handle (long thin cylinder) + bowl (very shallow cylinder).
  // The group is rotated flat so the spoon lies on the floor as if dropped.
  const handleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.28, 8);
  // Shallow bowl: 8mm deep (0.008), wider top than bottom to read as a spoon bowl.
  const bowlGeo   = new THREE.CylinderGeometry(0.04, 0.025, 0.008, 10);
  const mat = new THREE.MeshStandardMaterial({ color: 0xa8a8a8, metalness: 0.85, roughness: 0.2 });
  const handle = new THREE.Mesh(handleGeo, mat);
  const bowl   = new THREE.Mesh(bowlGeo,   mat);

  // Bowl sits at the end of the handle in local space (same Y plane as handle
  // after the group rotation makes everything lie flat).
  handle.position.set(0, 0, 0);
  bowl.position.set(0.07, 0.15, 0);

  const group = new THREE.Group();
  group.add(handle);
  group.add(bowl);
  group.position.set(...pos);
  // Lay flat on the floor; slight sideways tilt adds a natural dropped look.
  group.rotation.x = -Math.PI / 2;
  group.rotation.z = 0.15;

  _scene.add(group);
  _roomObjects.push(group);

  // Invisible hitbox centred on the group — much larger than the spoon geometry
  // so the raycaster can hit it reliably without pixel-perfect aim.
  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.16, 0.35),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  hitbox.userData = {
    interactable: true,
    id: 'item-bent-spoon',
    label,
    type: 'item',
    // companions: the group holds all visible geometry; removing it clears the
    // spoon from the scene when the item is picked up.
    companions: [group],
  };
  hitbox.position.set(0, 0, 0); // centred on the group
  group.add(hitbox);
  _interactables.push(hitbox);
  _attachItemLabel(hitbox, label);
  return hitbox;
}

function _makeItemCandleStub(pos) {
  const label = ITEMS['candle-stub'].label;
  // Stubby wax cylinder (wider than tall — it's a used-down candle).
  const waxMat = new THREE.MeshStandardMaterial({ color: 0xf0ead8, roughness: 0.75, metalness: 0.0 });
  const waxGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.10, 10);
  const wax = new THREE.Mesh(waxGeo, waxMat);
  wax.position.set(...pos);

  // Thin dark wick on top.
  const wickMat = new THREE.MeshStandardMaterial({ color: 0x1a1008, roughness: 0.9 });
  const wickGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.05, 6);
  const wick = new THREE.Mesh(wickGeo, wickMat);
  wick.position.set(pos[0], pos[1] + 0.075, pos[2]);

  _addInteractable(wax, 'item-candle-stub', label, 'item');
  _attachItemLabel(wax, label);
  _add(wick);

  // Tiny amber wick light.
  const wickLight = new THREE.PointLight(0xffa040, 0.3, 0.6, 2);
  wickLight.position.set(pos[0], pos[1] + 0.11, pos[2]);
  _add(wickLight);
  // companions: wick and wickLight must be removed alongside the wax body on pickup.
  wax.userData.companions = [wick, wickLight];
  return wax;
}

function _makeItemMoonflowerPetal(pos) {
  const label = ITEMS['moonflower-petal'].label;
  // Elliptical flat disc — wider than deep, suggesting a leaf/petal shape.
  const geo = new THREE.CylinderGeometry(0.0, 0.0, 0.0, 6); // placeholder, overridden below
  // Build a flat ellipse with LatheGeometry points (cross-section = narrow teardrop).
  const petalGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0, -0.09),
      new THREE.Vector2(0.05, -0.04),
      new THREE.Vector2(0.12, 0.0),
      new THREE.Vector2(0.08, 0.06),
      new THREE.Vector2(0, 0.09),
    ],
    8 // segments around the Y axis
  );
  geo.dispose(); // dispose the placeholder
  const mat = new THREE.MeshStandardMaterial({
    color: 0xd0b8ff,
    emissive: TOKEN_ACCENT_PURPLE,
    emissiveIntensity: 0.5,
    roughness: 0.4,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(petalGeo, mat);
  // Lay flat on the surface.
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(...pos);
  _addInteractable(mesh, 'item-moonflower-petal', label, 'item');
  _attachItemLabel(mesh, label);
  return mesh;
}

function _makeItemOilSoakedRag(pos) {
  const label = ITEMS['oil-soaked-rag'].label;
  // Bundled cloth: a non-uniform blob created by scaling a sphere unevenly.
  const geo = new THREE.SphereGeometry(0.1, 6, 5);
  const mat = new THREE.MeshStandardMaterial({ color: 0x2e1e0e, roughness: 1.0, metalness: 0.0 });
  const mesh = new THREE.Mesh(geo, mat);
  // Scale to look like a crumpled flat bundle rather than a ball.
  mesh.scale.set(1.4, 0.45, 1.0);
  mesh.position.set(...pos);
  _addInteractable(mesh, 'item-oil-soaked-rag', label, 'item');
  _attachItemLabel(mesh, label);
  return mesh;
}

function _makeItemPinchOfSalt(pos) {
  const label = ITEMS['pinch-of-salt'].label;
  const mesh = _makeBox(0.10, 0.10, 0.10, 0xe8e8e0, pos, { roughness: 0.9 });
  _addInteractable(mesh, 'item-pinch-of-salt', label, 'item');
  _attachItemLabel(mesh, label);
  // Small near-white light to make tiny cube catch the eye
  const saltLight = new THREE.PointLight(0xf0f0e0, 0.15, 0.5, 2);
  saltLight.position.set(pos[0], pos[1], pos[2]);
  _add(saltLight);
  // companions: saltLight is purely decorative; remove it alongside the cube on pickup.
  mesh.userData.companions = [saltLight];
  return mesh;
}

function _makeItemDriedMushroom(pos) {
  const label = ITEMS['dried-mushroom'].label;
  // Stem (primary interactable)
  const stem = _makeCylinder(0.04, 0.05, 0.10, 0x8a6040, pos);
  _addInteractable(stem, 'item-dried-mushroom', label, 'item');
  _attachItemLabel(stem, label);
  // Cap (decorative, offset upward)
  const cap = _makeCylinder(0.14, 0.08, 0.07, 0x6b4a28, [pos[0], pos[1] + 0.085, pos[2]]);
  _add(cap);
  // companions: cap is decorative; remove it alongside the stem on pickup.
  stem.userData.companions = [cap];
  return stem;
}


function _makeItemSymbolOrderScroll(pos) {
  const label = ITEMS['symbol-order-scroll'].label;
  const mesh = _makeCylinder(0.04, 0.04, 0.35, 0xe8d8a0, pos);
  mesh.material.roughness = 0.7;
  mesh.rotation.z = Math.PI / 2;
  _addInteractable(mesh, 'item-symbol-order-scroll', label, 'item');
  _attachItemLabel(mesh, label);
  return mesh;
}

function _makeItemTornSpellBookPage(pos) {
  const label = ITEMS['torn-spell-book-page'].label;
  const mesh = _makeBox(0.32, 0.012, 0.42, 0xd4c080, pos, { roughness: 0.8 });
  _addInteractable(mesh, 'item-torn-spell-book-page', label, 'item');
  _attachItemLabel(mesh, label);
  return mesh;
}

function _makeItemArmouryChestKey(pos) {
  const label = ITEMS['armoury-chest-key'].label;
  // Brass-toned key: shaft + bow ring + two teeth.
  const color = 0xc8902a; // warm brass
  const shaft = _makeBox(0.05, 0.05, 0.30, color, pos, { metalness: 0.7, roughness: 0.3 });
  _addInteractable(shaft, 'item-armoury-chest-key', label, 'item');
  _attachItemLabel(shaft, label);
  // Bow (ring at the grip end).
  const bowGeo = new THREE.TorusGeometry(0.055, 0.018, 8, 16);
  const bowMat = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.3 });
  const bow = new THREE.Mesh(bowGeo, bowMat);
  bow.position.set(pos[0], pos[1], pos[2] - 0.155);
  _add(bow);
  // Teeth: two small boxes on the blade end.
  const tooth1 = _makeBox(0.05, 0.055, 0.06, color, [pos[0], pos[1] + 0.05, pos[2] + 0.08], { metalness: 0.7, roughness: 0.3 });
  _add(tooth1);
  const tooth2 = _makeBox(0.05, 0.055, 0.04, color, [pos[0], pos[1] + 0.05, pos[2] + 0.12], { metalness: 0.7, roughness: 0.3 });
  _add(tooth2);
  // companions: bow, tooth1, tooth2 are decorative; remove all on pickup.
  shaft.userData.companions = [bow, tooth1, tooth2];
  return shaft;
}

function _makeItemChapelSigil(pos) {
  const label = ITEMS['chapel-sigil'].label;
  const mesh = _makeCylinder(0.15, 0.15, 0.05, 0x808090, pos);
  mesh.material.roughness = 0.6;
  mesh.material.emissive.setHex(TOKEN_ACCENT_PURPLE);
  mesh.material.emissiveIntensity = 0.2;
  _addInteractable(mesh, 'item-chapel-sigil', label, 'item');
  _attachItemLabel(mesh, label);
  return mesh;
}

function _makeItemIronGateKey(pos) {
  const label = ITEMS['iron-gate-key'].label;
  // Shaft (interactable)
  const shaft = _makeBox(0.07, 0.07, 0.32, 0x505050, pos, { metalness: 0.8, roughness: 0.4 });
  _addInteractable(shaft, 'item-iron-gate-key', label, 'item');
  _attachItemLabel(shaft, label);
  // Bow (decorative torus)
  const bowGeo = new THREE.TorusGeometry(0.07, 0.026, 8, 16);
  const bowMat = new THREE.MeshStandardMaterial({ color: 0x505050, metalness: 0.8, roughness: 0.4, emissive: 0xffffff, emissiveIntensity: 0.0 });
  const bow = new THREE.Mesh(bowGeo, bowMat);
  bow.position.set(pos[0], pos[1], pos[2] - 0.16);
  _add(bow);
  // companions: bow is decorative; remove it alongside the shaft on pickup.
  shaft.userData.companions = [bow];
  return shaft;
}

function _makeItemBrassStarChart(pos) {
  const label = ITEMS['brass-star-chart'].label;
  const mesh = _makeBox(0.28, 0.025, 0.28, 0xc09030, pos, { metalness: 0.7, roughness: 0.3, emissive: 0xffc040, emissiveIntensity: 0.15 });
  _addInteractable(mesh, 'item-brass-star-chart', label, 'item');
  _attachItemLabel(mesh, label);
  return mesh;
}

function _makeItemChargedBindingCrystal(pos) {
  const label = ITEMS['charged-binding-crystal'].label;
  const geo = new THREE.SphereGeometry(0.12, 12, 12);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x9060d0,
    emissive: TOKEN_ACCENT_PURPLE,
    emissiveIntensity: 0.8,
    roughness: 0.3,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  _addInteractable(mesh, 'item-charged-binding-crystal', label, 'item');
  _attachItemLabel(mesh, label);
  return mesh;
}

/**
 * Creates a door group: panel, four-piece stone frame, and an iron handle.
 * The panel is the interactable mesh; frame and handle are decorative.
 *
 * All parts are children of a THREE.Group positioned at `pos`. Applying
 * `rotationY` to the group lets side-wall doors face into the room without
 * requiring per-part position arithmetic:
 *   - rotationY = 0           end-wall door (default)
 *   - rotationY = Math.PI/2   left-wall door  (faces +X)
 *   - rotationY = -Math.PI/2  right-wall door (faces -X)
 *
 * The group world position (px, py, pz) and rotationY are stored on the
 * panel's userData so room-manager can derive spawn positions on entry.
 *
 * @param {[number, number, number]} pos         World position for the door centre.
 * @param {string}                   targetRoomId Room ID this door leads to.
 * @param {string}                   label        Accessible label for the door.
 * @param {number}                   [rotationY=0] Y-axis rotation in radians.
 * @returns {THREE.Mesh} The interactable door panel.
 */
function _makeDoor(pos, targetRoomId, label, rotationY = 0) {
  const [px, py, pz] = pos;

  // Group holds all door parts; rotation is applied once here.
  const group = new THREE.Group();
  group.position.set(px, py, pz);
  group.rotation.y = rotationY;
  _scene.add(group);
  _roomObjects.push(group);

  // Helper: build a box in group-local space, register for disposal.
  const _localBox = (w, h, d, color, lpos, opts = {}) => {
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.8,
      metalness: opts.metalness ?? 0.0,
      emissive: 0xffffff,
      emissiveIntensity: 0.0,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(...lpos);
    group.add(mesh);
    _roomObjects.push(mesh); // track for geometry/material disposal on teardown
    return mesh;
  };

  // Panel (interactable) — at the group's local origin.
  const panel = _localBox(0.9, 1.8, 0.12, 0x2a1e12, [0, 0, 0], { roughness: 0.95, metalness: 0.0 });
  panel.userData = {
    interactable: true,
    id: `door-${targetRoomId}`,
    label,
    type: 'door',
    // Store world position and rotation so enterRoom() can compute spawn offset.
    worldPos: { x: px, y: py, z: pz },
    rotationY,
  };
  _interactables.push(panel);

  // Frame: two vertical stiles and two horizontal rails (group-local positions).
  const frameColor = 0x3d3028;
  _localBox(0.1, 2.0, 0.14, frameColor, [-0.5, 0, 0], { roughness: 1.0 });
  _localBox(0.1, 2.0, 0.14, frameColor, [0.5, 0, 0], { roughness: 1.0 });
  _localBox(1.1, 0.12, 0.14, frameColor, [0, 0.96, 0], { roughness: 1.0 });
  _localBox(1.1, 0.10, 0.14, frameColor, [0, -0.95, 0], { roughness: 1.0 });

  // Handle: iron cylinder on the right side of the door (group-local).
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x707070, metalness: 0.8, roughness: 0.35,
    emissive: 0xffffff, emissiveIntensity: 0.0,
  });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.14, 12), handleMat);
  handle.position.set(0.32, 0.05, 0);
  handle.rotation.z = Math.PI / 2;
  group.add(handle);
  _roomObjects.push(handle);

  return panel;
}

// ─── Room 1: Dungeon Cell ────────────────────────────────────────────────────

function _buildDungeonCell() {
  const W = 5, H = 3.5, D = 6;
  _makeBoxRoom({ color: COLOURS.dungeonCell, w: W, h: H, d: D, ambientIntensity: 0.3 });

  // Two amber torch sconces at low-to-mid height on side walls
  _add(_makePointLight(TOKEN_ACCENT_AMBER, 1.2, 8, 2, [-1.8, 1.2, -1.5]));
  _add(_makePointLight(TOKEN_ACCENT_AMBER, 1.2, 8, 2, [1.8, 1.2, -1.5]));

  // Cold seeping-damp ground-level light near door
  _add(_makePointLight(0x8090a0, 0.4, 3, 2, [0, 0.1, 0]));

  // Torch sconce visual mesh (left wall)
  const torch = _makeBox(0.15, 0.4, 0.1, TOKEN_ACCENT_AMBER, [-1.5, 1.2, -1.5], {
    emissive: TOKEN_ACCENT_AMBER,
    emissiveIntensity: 0.8,
    roughness: 0.5,
  });
  _add(torch);

  // Loose stone on the floor (item: bent-spoon)
  const state = getState();
  if (!state.inventory.items.some((i) => i.itemId === 'bent-spoon')) {
    _makeItemBentSpoon([0.6, 0.13, 1.5]);
  }

  // Candle on a shelf (item: candle-stub)
  if (!state.inventory.items.some((i) => i.itemId === 'candle-stub')) {
    _makeItemCandleStub([-1.8, 1.4, -2.0]);
  }

  // Decorative geometry: stone pillars at front corners
  _add(_makeCylinder(0.18, 0.20, H, 0x5a5550, [-W / 2 + 0.22, H / 2, D / 2 - 0.22]));
  _add(_makeCylinder(0.18, 0.20, H, 0x5a5550, [W / 2 - 0.22, H / 2, D / 2 - 0.22]));

  // Ceiling lintel beam above door
  _add(_makeBox(1.1, 0.15, 0.2, 0x4a4540, [0, H - 0.08, -D / 2 + 0.1]));

  // Iron bar slivers on right wall — barred window suggestion
  for (let i = 0; i < 3; i++) {
    _add(_makeBox(0.04, 0.5, 0.05, 0x303030, [W / 2 - 0.05, 1.8 + i * 0.15, -1.0]));
  }

  // Cell door (back wall) — puzzle type until solved, then a navigable door.
  const cellSolved = state.puzzles['cell-escape']?.state === 'solved';
  const cellDoor = _makeBox(
    0.9, 1.8, 0.1,
    cellSolved ? 0x2a1e12 : 0x1e1a14,
    [0, 0.9, -D / 2 + 0.05],
    { roughness: 1.0 }
  );
  _addInteractable(
    cellDoor,
    cellSolved ? 'door-stone-corridor' : 'room1-door',
    cellSolved ? 'Door to Stone Corridor' : 'Heavy wooden door (use bent spoon to open)',
    cellSolved ? 'door' : 'puzzle'
  );
}

// ─── Room 2: Stone Corridor ──────────────────────────────────────────────────

function _buildStoneCorridor() {
  const W = 4, H = 3.5, D = 14;
  _makeBoxRoom({ color: COLOURS.stoneCorridor, w: W, h: H, d: D, ambientIntensity: 0.25 });

  // Wall sconces (existing rhythm, kept as-is)
  _add(_makePointLight(TOKEN_ACCENT_AMBER, 1.0, 6, 2, [-1.5, 2.5, -4]));
  _add(_makePointLight(TOKEN_ACCENT_AMBER, 1.0, 6, 2, [1.5, 2.5, 0]));
  _add(_makePointLight(TOKEN_ACCENT_AMBER, 1.0, 6, 2, [-1.5, 2.5, 4]));

  // Cool blue ambient to give a sense of stone cold
  _add(new THREE.AmbientLight(0xa0b0c0, 0.08));

  const state = getState();

  // Moonflower petal in wall alcove (left wall)
  if (!state.inventory.items.some((i) => i.itemId === 'moonflower-petal')) {
    _makeItemMoonflowerPetal([-1.7, 1.8, -3.5]); // moved 0.2 units from wall so raycaster can reach it
  }

  // Oil-soaked rag in a wall sconce
  if (!state.inventory.items.some((i) => i.itemId === 'oil-soaked-rag')) {
    _makeItemOilSoakedRag([1.8, 2.3, 0.2]);
  }

  // Decorative geometry: skirting stones along both side walls
  _add(_makeBox(D, 0.12, 0.1, 0x4a4844, [-W / 2 + 0.05, 0.06, 0]));
  _add(_makeBox(D, 0.12, 0.1, 0x4a4844, [W / 2 - 0.05, 0.06, 0]));

  // Six shallow alcove boxes for sconce lights (alternating sides)
  const alcoveW = 0.08, alcoveH = 0.5, alcoveD = 0.05;
  const alcoveColor = COLOURS.stoneCorridor;
  const alcovePositions = [
    [-W / 2 + 0.02, 2.2, -4], [W / 2 - 0.02, 2.2, 0], [-W / 2 + 0.02, 2.2, 4],
    [W / 2 - 0.02, 2.2, -4], [-W / 2 + 0.02, 2.2, 0], [W / 2 - 0.02, 2.2, 4],
  ];
  for (const apos of alcovePositions) {
    _add(_makeBox(alcoveW, alcoveH, alcoveD, alcoveColor, apos));
  }

  // Doors to other rooms — end-wall doors at z = ±D/2, side-wall doors at x = ±W/2.
  // Side-wall doors rotate to face into the corridor:
  //   left wall (x = −2.0): rotationY = +π/2  (faces +X)
  //   right wall (x = +2.0): rotationY = −π/2  (faces −X)
  const doors = [
    { pos: [0, 0.9, -D / 2 + 0.1], target: 'dungeon-cell',  label: 'Door to Dungeon Cell',    rot: 0 },
    { pos: [-2.0, 0.9, -2.0],       target: 'kitchen',       label: 'Door to Kitchen',          rot: Math.PI / 2 },
    { pos: [2.0, 0.9, -2.0],        target: 'library',       label: 'Door to Library',          rot: -Math.PI / 2 },
    { pos: [-2.0, 0.9, 2.0],        target: 'great-hall',    label: 'Door to Great Hall',       rot: Math.PI / 2 },
    { pos: [2.0, 0.9, 2.0],         target: 'chapel',        label: 'Door to Chapel',           rot: -Math.PI / 2 },
    { pos: [-2.0, 0.9, 5.0],        target: 'armoury',       label: 'Door to Armoury',          rot: Math.PI / 2 },
    { pos: [2.0, 0.9, 5.0],         target: 'tower-room',    label: 'Door to Tower Room',       rot: -Math.PI / 2 },
    { pos: [-2.0, 0.9, -5.5],       target: 'witchs-study',  label: "Door to Witch's Study",    rot: Math.PI / 2 },
    { pos: [0, 0.9, D / 2 - 0.1],  target: 'castle-gate',   label: 'Door to Castle Gate',      rot: 0 },
  ];
  for (const d of doors) {
    _makeDoor(d.pos, d.target, d.label, d.rot);
  }
}

// ─── Room 3: Kitchen ─────────────────────────────────────────────────────────

function _buildKitchen() {
  const W = 5, H = 3.2, D = 6;
  _makeBoxRoom({ color: COLOURS.kitchen, w: W, h: H, d: D, ambientIntensity: 0.5, floorColor: 0x6a3a20 });

  // Strong fire glow under cauldron
  _add(_makePointLight(0xff6010, 2.0, 6, 2, [0, 0.4, -1.5]));

  // Shelf warm light
  _add(_makePointLight(0xffe0a0, 0.8, 4, 2, [-2.2, 2.2, 0]));

  // Cauldron (puzzle target)
  const cauldron = _makeCylinder(0.5, 0.4, 0.7, 0x222222, [0, 0.35, -1.5]);
  _addInteractable(cauldron, 'kitchen-cauldron', 'Cauldron (use moonflower petal, salt, and mushroom)', 'puzzle');

  // Shelves on left wall — collidable prop so player cannot walk through it.
  const shelf1 = _makeBox(1.5, 0.1, 0.3, 0x4a3020, [-2.2, 1.8, 0], { roughness: 1.0 });
  _addProp(shelf1);

  const state = getState();

  // Pinch of salt on shelf
  if (!state.inventory.items.some((i) => i.itemId === 'pinch-of-salt')) {
    _makeItemPinchOfSalt([-2.2, 1.95, 0.1]);
  }

  // Dried mushroom on shelf
  if (!state.inventory.items.some((i) => i.itemId === 'dried-mushroom')) {
    _makeItemDriedMushroom([-2.2, 1.95, -0.3]);
  }

  // Decorative geometry: pot-rack beam and hanging chains
  _add(_makeBox(W - 0.6, 0.1, 0.1, 0x3a2810, [0, H - 0.1, -0.5]));
  for (let i = 0; i < 3; i++) {
    _add(_makeBox(0.04, 0.6, 0.04, 0x282020, [-0.6 + i * 0.6, H - 0.4, -0.5]));
  }

  // Back door to corridor
  _makeDoor([0, 0.9, D / 2 - 0.05], 'stone-corridor', 'Door to Stone Corridor');
}

// ─── Room 4: Library ─────────────────────────────────────────────────────────

function _buildLibrary() {
  const W = 6, H = 4, D = 7;
  _makeBoxRoom({ color: COLOURS.library, w: W, h: H, d: D, ambientIntensity: 0.3 });

  // Reading lamp over desk
  _add(_makePointLight(0xffe0a0, 1.2, 5, 2, [0.5, 1.8, -0.5]));

  // Cool general blue ambient for the book-filled space
  _add(new THREE.AmbientLight(0x8090b0, 0.1));

  // Bookshelf rows (decorative boxes)
  for (let row = 0; row < 3; row++) {
    const shelf = _makeBox(2.5, 0.8, 0.4, 0x1a2030, [-2.5, 1.0 + row * 0.9, -3.0], { roughness: 0.9 });
    _add(shelf);
  }

  // Reading desk — collidable prop so player cannot walk through it.
  const desk = _makeBox(1.5, 0.08, 0.8, 0x3a2810, [0.5, 0.9, -0.5], { roughness: 0.8 });
  _addProp(desk);

  // Symbol order scroll on desk (readable clue — not consumed)
  const state = getState();
  if (!state.inventory.items.some((i) => i.itemId === 'symbol-order-scroll')) {
    _makeItemSymbolOrderScroll([0.5, 0.97, -0.5]);
  }

  // Locked cabinet (puzzle target)
  const cabinetPuzzleSolved = state.puzzles['library-cabinet']?.state === 'solved';
  const cabinet = _makeBox(1.0, 1.8, 0.5, cabinetPuzzleSolved ? 0x2a3a50 : 0x1a2030, [-2.0, 0.9, -D / 2 + 0.5], { roughness: 0.7 });
  _addInteractable(cabinet, 'library-cabinet', 'Locked cabinet (use small iron key)', 'puzzle');

  // Torn spell book page inside cabinet — only visible after solve
  if (cabinetPuzzleSolved && !state.inventory.items.some((i) => i.itemId === 'torn-spell-book-page')) {
    _makeItemTornSpellBookPage([-2.0, 1.2, -D / 2 + 0.5]);
  }

  // Decorative geometry: bookcase columns at left wall
  _add(_makeBox(0.15, H, 0.42, 0x1a2030, [-3.2, H / 2, -3.0]));
  _add(_makeBox(0.15, H, 0.42, 0x1a2030, [-1.8, H / 2, -3.0]));

  // Reading lectern cone beside desk
  _add(_makeCylinder(0.0, 0.25, 0.6, 0x3a2810, [1.5, 0.3, -0.5]));

  // Back door to corridor
  _makeDoor([0, 0.9, D / 2 - 0.05], 'stone-corridor', 'Door to Stone Corridor');
}

// ─── Room 5: Great Hall ───────────────────────────────────────────────────────

function _buildGreatHall() {
  const W = 8, H = 5, D = 10;
  _makeBoxRoom({ color: COLOURS.greatHall, w: W, h: H, d: D, ambientIntensity: 0.3 });

  // Strong fireplace glow at the front/fireplace wall
  _add(_makePointLight(0xff5800, 2.0, 10, 2, [0, 0.8, D / 2 - 1.0]));

  // Portrait wall candles — three amber point lights
  _add(_makePointLight(0xffa040, 0.5, 3, 2, [-3, 2.0, -D / 2 + 0.2]));
  _add(_makePointLight(0xffa040, 0.5, 3, 2, [0, 2.0, -D / 2 + 0.2]));
  _add(_makePointLight(0xffa040, 0.5, 3, 2, [3, 2.0, -D / 2 + 0.2]));

  // Portrait frames on walls (decorative)
  for (let i = 0; i < 3; i++) {
    const portrait = _makeBox(1.2, 1.6, 0.05, 0x2a1a08, [-3.0 + i * 3, 2.5, -D / 2 + 0.1], { roughness: 0.9 });
    _add(portrait);
  }

  // Largest portrait (puzzle target) — centre portrait, slightly bigger
  const state = getState();
  const portraitSolved = state.puzzles['great-hall-portrait']?.state === 'solved';
  const largestPortrait = _makeBox(1.8, 2.2, 0.08, portraitSolved ? 0x4a3a10 : 0x1a0a00, [0, 2.5, -D / 2 + 0.1]);
  _addInteractable(largestPortrait, 'great-hall-portrait', 'Largest portrait (use lit torch to reveal secret)', 'puzzle');

  // Armoury chest key behind portrait — only visible after solve
  if (portraitSolved && !state.inventory.items.some((i) => i.itemId === 'armoury-chest-key')) {
    _makeItemArmouryChestKey([0, 0.5, -D / 2 + 0.5]);
  }

  // Portrait clue observation point
  if (!state.inventory.items.some((i) => i.itemId === 'portrait-clue')) {
    const clueTarget = _makeBox(0.4, 0.4, 0.05, TOKEN_ACCENT_PURPLE, [2.0, 2.5, -D / 2 + 0.1], {
      emissive: TOKEN_ACCENT_PURPLE,
      emissiveIntensity: 0.3,
    });
    _addInteractable(clueTarget, 'examine-portrait-clue', 'Observe the portrait symbols (chalice, quill, star)', 'examine');
  }

  // Structural pillars partway down side walls — registered as collidable so
  // the player cannot walk through them (Issue 1: partition wall collision).
  _addProp(_makeBox(0.5, H, 0.5, 0x4a4035, [-W / 2 + 0.6, H / 2, 0]));
  _addProp(_makeBox(0.5, H, 0.5, 0x4a4035, [W / 2 - 0.6, H / 2, 0]));

  // Banner boxes flanking the portrait wall
  _add(_makeBox(0.4, 2.0, 0.06, 0x6a1a1a, [-2.4, 2.5, -D / 2 + 0.08]));
  _add(_makeBox(0.4, 2.0, 0.06, 0x6a1a1a, [2.4, 2.5, -D / 2 + 0.08]));

  // Back door to corridor
  _makeDoor([0, 0.9, D / 2 - 0.05], 'stone-corridor', 'Door to Stone Corridor');
}

// ─── Room 6: Chapel ──────────────────────────────────────────────────────────

function _buildChapel() {
  const W = 6, H = 5, D = 8;
  _makeBoxRoom({ color: COLOURS.chapel, w: W, h: H, d: D, ambientIntensity: 0.25, floorColor: 0x25253a });

  // Stained-glass coloured lights (raised to 1.2)
  _add(_makePointLight(0x6040ff, 1.2, 8, 2, [-2.0, 3.5, 0]));
  _add(_makePointLight(0xff4060, 1.2, 6, 2, [2.0, 3.5, 0]));

  // Cold white skylight from above
  _add(_makePointLight(0xe8f0ff, 0.8, 8, 2, [0, 4.5, 0]));

  // Altar (puzzle target)
  const state = getState();
  const altarSolved = state.puzzles['chapel-altar']?.state === 'solved';
  const altar = _makeBox(2.0, 1.2, 0.8, altarSolved ? 0x3a2a60 : 0x1a1a40, [0, 0.6, -D / 2 + 1.5], { roughness: 0.6 });
  _addInteractable(altar, 'chapel-altar', 'Altar with six discs (use symbol order scroll)', 'puzzle');

  // Six altar discs on top of altar (visual)
  const discColors = [0x8060ff, 0xff8060, 0x60ff80, 0xff6080, 0x60a0ff, 0xffc040];
  for (let i = 0; i < 6; i++) {
    const disc = _makeCylinder(0.15, 0.15, 0.05, discColors[i], [(-1.25 + i * 0.5), 1.25, -D / 2 + 1.5]);
    _add(disc);
  }

  // Chapel sigil in altar drawer — visible after solve
  if (altarSolved && !state.inventory.items.some((i) => i.itemId === 'chapel-sigil')) {
    _makeItemChapelSigil([0, 0.8, -D / 2 + 1.5]);
  }

  // Structural columns flanking the altar — registered as collidable.
  _addProp(_makeCylinder(0.12, 0.18, H * 0.8, 0x2a2a40, [-1.2, H * 0.4, -D / 2 + 1.8]));
  _addProp(_makeCylinder(0.12, 0.18, H * 0.8, 0x2a2a40, [1.2, H * 0.4, -D / 2 + 1.8]));

  // Back door to corridor
  _makeDoor([0, 0.9, D / 2 - 0.05], 'stone-corridor', 'Door to Stone Corridor');
}

// ─── Room 7: Armoury ─────────────────────────────────────────────────────────

function _buildArmoury() {
  const W = 6, H = 3.5, D = 7;
  _makeBoxRoom({ color: COLOURS.armoury, w: W, h: H, d: D, ambientIntensity: 0.35 });

  // Cold blue-white overhead for the stone armoury
  _add(_makePointLight(0xd0e0ff, 1.0, 10, 2, [0, 3.0, 0]));

  // Single amber corner torch
  _add(_makePointLight(0xffa040, 0.8, 5, 2, [2.5, 2.2, -D / 2 + 0.5]));

  // Weapon racks (decorative) — framed with uprights and horizontal bars
  for (let i = 0; i < 3; i++) {
    const x = -2.5 + i * 2.5;
    // Left upright
    _add(_makeBox(0.06, 1.4, 0.06, 0x707070, [x - 0.25, 1.5, -D / 2 + 0.08], { roughness: 0.3, metalness: 0.6 }));
    // Right upright
    _add(_makeBox(0.06, 1.4, 0.06, 0x707070, [x + 0.25, 1.5, -D / 2 + 0.08], { roughness: 0.3, metalness: 0.6 }));
    // Top bar
    _add(_makeBox(0.6, 0.06, 0.06, 0x808080, [x, 2.18, -D / 2 + 0.08], { roughness: 0.3, metalness: 0.6 }));
    // Bottom bar
    _add(_makeBox(0.6, 0.06, 0.06, 0x808080, [x, 0.82, -D / 2 + 0.08], { roughness: 0.3, metalness: 0.6 }));
  }

  // Chest (puzzle target)
  const state = getState();
  const chestSolved = state.puzzles['armoury-chest']?.state === 'solved';
  const chest = _makeBox(1.2, 0.8, 0.8, chestSolved ? 0x504030 : 0x303030, [1.5, 0.4, D / 2 - 1.5], { roughness: 0.7 });
  _addInteractable(chest, 'armoury-chest', 'Iron chest (use armoury chest key)', 'puzzle');

  // Iron gate key inside chest — visible after solve
  if (chestSolved && !state.inventory.items.some((i) => i.itemId === 'iron-gate-key')) {
    _makeItemIronGateKey([1.5, 0.85, D / 2 - 1.5]);
  }

  // Back door to corridor
  _makeDoor([0, 0.9, D / 2 - 0.05], 'stone-corridor', 'Door to Stone Corridor');
}

// ─── Room 8: Tower Room ───────────────────────────────────────────────────────

function _buildTowerRoom() {
  const W = 5, H = 5, D = 5;
  _makeBoxRoom({ color: COLOURS.towerRoom, w: W, h: H, d: D, ambientIntensity: 0.25, floorColor: 0x1e2430 });

  // Moonlight as a directional light from above-left
  const moonlight = new THREE.DirectionalLight(0xc0d8ff, 1.5);
  moonlight.position.set(0.5, 1, -0.5);
  _add(moonlight);

  // Telescope accent point
  _add(_makePointLight(0xffc040, 0.6, 3, 2, [0.5, 1.8, -0.5]));

  // Telescope (puzzle target)
  const state = getState();
  const telescopeSolved = state.puzzles['tower-telescope']?.state === 'solved';
  const telescope = _makeBox(0.3, 0.3, 1.2, telescopeSolved ? 0xc0a830 : 0x806820, [0.5, 1.4, -0.5], {
    roughness: 0.4,
    metalness: 0.6,
    emissive: telescopeSolved ? TOKEN_ACCENT_AMBER : 0x000000,
    emissiveIntensity: telescopeSolved ? 0.3 : 0.0,
  });
  _addInteractable(telescope, 'tower-telescope', 'Telescope (align to chalice, quill, and star)', 'puzzle');

  // Telescope stand
  _add(_makeCylinder(0.06, 0.1, 1.1, 0x505050, [0.5, 0.55, -0.5]));

  // Star chart panel — revealed after solve
  if (telescopeSolved && !state.inventory.items.some((i) => i.itemId === 'brass-star-chart')) {
    _makeItemBrassStarChart([0.5, 1.85, -0.5]);
  }

  // Decorative geometry: window sill blocks suggesting a window opening
  _add(_makeBox(1.2, 0.12, 0.2, 0x445060, [-0.6, 2.0, -D / 2 + 0.1]));
  _add(_makeBox(1.2, 0.12, 0.2, 0x445060, [0.6, 2.0, -D / 2 + 0.1]));
  // Cross-bar between sill blocks
  _add(_makeBox(0.12, 0.8, 0.15, 0x445060, [0, 1.6, -D / 2 + 0.1]));

  // Back door to corridor
  _makeDoor([0, 0.9, D / 2 - 0.05], 'stone-corridor', 'Door to Stone Corridor');
}

// ─── Room 9: Witch's Study ───────────────────────────────────────────────────

function _buildWitchsStudy() {
  const W = 5, H = 4, D = 7;
  _makeBoxRoom({ color: COLOURS.witchsStudy, w: W, h: H, d: D, ambientIntensity: 0.25 });

  // Purple magic glow (raised to 1.2)
  _add(_makePointLight(TOKEN_ACCENT_PURPLE, 1.2, 6, 2, [0, 2.0, -1.0]));

  // Candle on desk — dim amber
  _add(_makePointLight(0xffa040, 0.4, 3, 2, [0.5, 1.2, 0.5]));

  // Lectern (place torn page) — collidable prop so player cannot walk through it.
  const lectern = _makeBox(0.6, 1.2, 0.4, 0x300820, [0, 0.6, -1.5], { roughness: 0.8 });
  _addProp(lectern);

  // Plate on desk (place sigil + star chart) — desk is collidable.
  const desk = _makeBox(1.8, 0.08, 1.0, 0x200010, [0.5, 0.9, 0.5], { roughness: 0.7 });
  _addProp(desk);
  const plate = _makeBox(0.8, 0.04, 0.8, 0x505060, [0.5, 0.95, 0.5], { roughness: 0.5, metalness: 0.3 });
  _add(plate);

  // Cast button (puzzle target)
  const state = getState();
  const spellSolved = state.puzzles['study-spell']?.state === 'solved';
  const castBtn = _makeBox(0.3, 0.15, 0.3, spellSolved ? TOKEN_ACCENT_GREEN : TOKEN_STATUS_ERROR, [0.5, 1.05, 0.5], {
    emissive: spellSolved ? TOKEN_ACCENT_GREEN : 0x000000,
    emissiveIntensity: spellSolved ? 0.5 : 0.0,
  });
  _addInteractable(castBtn, 'study-cast-btn', 'Cast button (use torn page, chapel sigil, and star chart)', 'puzzle');

  // Charged binding crystal — visible after solve
  if (spellSolved && !state.inventory.items.some((i) => i.itemId === 'charged-binding-crystal')) {
    _makeItemChargedBindingCrystal([0.5, 1.2, 0.5]);
  }

  // Decorative geometry: suspended spell bundles from ceiling
  _add(_makeBox(0.2, 0.4, 0.2, 0x1a0820, [-0.8, H - 0.3, -1.0]));
  _add(_makeBox(0.2, 0.4, 0.2, 0x1a0820, [0.4, H - 0.5, -1.2]));
  _add(_makeBox(0.2, 0.4, 0.2, 0x1a0820, [-0.2, H - 0.2, -0.5]));

  // Back door to corridor
  _makeDoor([0, 0.9, D / 2 - 0.05], 'stone-corridor', 'Door to Stone Corridor');
}

// ─── Room 10: Castle Gate ─────────────────────────────────────────────────────

function _buildCastleGate() {
  const W = 6, H = 5, D = 5;
  _makeBoxRoom({ color: COLOURS.castleGate, w: W, h: H, d: D, ambientIntensity: 0.5 });

  // Strong daylight glow from the gate (brighter, wider reach)
  _add(_makePointLight(0xfff8e0, 3.5, 16, 2, [0, 2.5, -D / 2 + 0.5]));

  // Gate (visual — decorative bars)
  for (let i = -2; i <= 2; i++) {
    const bar = _makeBox(0.08, H, 0.08, 0x404040, [i * 0.8, H / 2, -D / 2 + 0.1], {
      roughness: 0.4,
      metalness: 0.8,
    });
    _add(bar);
  }

  // Pedestals (puzzle target)
  const state = getState();
  const gateSolved = state.puzzles['gate-pedestals']?.state === 'solved';

  const pedestalColor = gateSolved ? TOKEN_ACCENT_GREEN : 0x505050;
  const p1 = _makeBox(0.4, 0.8, 0.4, pedestalColor, [-1.5, 0.4, 0.5], { roughness: 0.6 });
  _addInteractable(p1, 'gate-pedestal', 'Place iron gate key, star chart, and binding crystal here', 'puzzle');

  const p2 = _makeBox(0.4, 0.8, 0.4, pedestalColor, [0, 0.4, 0.5], { roughness: 0.6 });
  _add(p2);

  const p3 = _makeBox(0.4, 0.8, 0.4, pedestalColor, [1.5, 0.4, 0.5], { roughness: 0.6 });
  _add(p3);

  // When gate is solved, show it open
  if (gateSolved) {
    const openGlow = _makePointLight(0xfff8e0, 3.0, 12, 2, [0, 2.5, -D / 2]);
    _add(openGlow);
  }

  // Stone gate-pillar boxes flanking the bars — registered as collidable.
  _addProp(_makeBox(0.5, H, 0.5, 0x5a5040, [-2.2, H / 2, -D / 2 + 0.3]));
  _addProp(_makeBox(0.5, H, 0.5, 0x5a5040, [2.2, H / 2, -D / 2 + 0.3]));

  // Back door to corridor
  _makeDoor([0, 0.9, D / 2 - 0.05], 'stone-corridor', 'Door to Stone Corridor');
}

// ─── Generic fallback room ────────────────────────────────────────────────────

function _buildGenericRoom(_roomId) {
  _makeBoxRoom({ color: 0x2a2a2a, w: 5, h: 3.5, d: 6, ambientIntensity: 0.3 });
  _add(_makePointLight(0xffc070, 1.0, 10, 2, [0, 2.8, 0]));
  _makeDoor([0, 0.9, 2.95], 'stone-corridor', 'Door to Stone Corridor');
}

// ─── Room label helper ────────────────────────────────────────────────────────

const ROOM_NAMES = {
  'dungeon-cell': 'Dungeon Cell',
  'stone-corridor': 'Stone Corridor',
  kitchen: 'Kitchen',
  library: 'Library',
  'great-hall': 'Great Hall',
  chapel: 'Chapel',
  armoury: 'Armoury',
  'tower-room': 'Tower Room',
  'witchs-study': "Witch's Study",
  'castle-gate': 'Castle Gate',
};

function _updateRoomLabel(roomId) {
  if (_roomLabel) {
    _roomLabel.textContent = ROOM_NAMES[roomId] ?? roomId;
  }
}
