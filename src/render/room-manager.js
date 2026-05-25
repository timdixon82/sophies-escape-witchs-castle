/**
 * Sophie's Escape — Room Manager (v0.2, ADR 001, ADR 002)
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

/** @type {THREE.Scene | null} */
let _scene = null;

/** @type {THREE.Object3D[]} — objects added for the current room; removed on transition. */
let _roomObjects = [];

/** @type {THREE.Mesh[]} — interactable meshes for the current room. */
let _interactables = [];

/** @type {string | null} */
let _currentRoomId = null;

/** @type {HTMLElement | null} */
let _roomLabel = null;

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
 * Tears down the previous room's objects and builds the new room.
 * @param {string} roomId
 */
export function enterRoom(roomId) {
  if (!_scene) return;
  if (roomId === _currentRoomId) return;

  _tearDownRoom();
  _currentRoomId = roomId;
  _buildRoom(roomId);
  _updateRoomLabel(roomId);
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

// ─── Private: teardown ────────────────────────────────────────────────────────

function _tearDownRoom() {
  for (const obj of _roomObjects) {
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
  _roomObjects = [];
  _interactables = [];
}

// ─── Private: room builders ───────────────────────────────────────────────────

function _buildRoom(roomId) {
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
}

// ─── Shared geometry helpers ──────────────────────────────────────────────────

/**
 * Creates a box-room (6 planes: floor, ceiling, 4 walls).
 * @param {{ color: number, w: number, h: number, d: number }} opts
 * @returns {{ ambient: THREE.AmbientLight, stone: THREE.MeshStandardMaterial }}
 */
function _makeBoxRoom({ color, w, h, d, ambientIntensity = 0.65 }) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0.0 });

  const planes = [
    // floor
    _makePlane(w, d, mat, [0, 0, 0], [-Math.PI / 2, 0, 0]),
    // ceiling
    _makePlane(w, d, mat, [0, h, 0], [Math.PI / 2, 0, 0]),
    // back wall
    _makePlane(w, h, mat, [0, h / 2, -d / 2], [0, 0, 0]),
    // front wall
    _makePlane(w, h, mat, [0, h / 2, d / 2], [0, Math.PI, 0]),
    // left wall
    _makePlane(d, h, mat, [-w / 2, h / 2, 0], [0, Math.PI / 2, 0]),
    // right wall
    _makePlane(d, h, mat, [w / 2, h / 2, 0], [0, -Math.PI / 2, 0]),
  ];

  for (const p of planes) _add(p);

  const ambient = new THREE.AmbientLight(TOKEN_FG_PRIMARY, ambientIntensity);
  _add(ambient);

  return { mat, ambient };
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
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0.0,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(...pos);
  return mesh;
}

function _makeCylinder(rt, rb, h, color, pos) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
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
 * Creates a glowing amber interactable item box.
 */
function _makeItemBox(pos, id, label) {
  const mesh = _makeBox(0.25, 0.25, 0.25, TOKEN_ACCENT_AMBER, pos, {
    emissive: TOKEN_ACCENT_AMBER,
    emissiveIntensity: 0.5,
    roughness: 0.4,
  });
  _addInteractable(mesh, id, label, 'item');
  return mesh;
}

/**
 * Creates a door mesh — dark recessed box on a wall.
 * The door is clickable if unlocked.
 */
function _makeDoor(pos, targetRoomId, label) {
  const mesh = _makeBox(0.9, 1.8, 0.1, 0x1e1a14, pos, { roughness: 1.0 });
  _addInteractable(mesh, `door-${targetRoomId}`, label, 'door');
  return mesh;
}

// ─── Room 1: Dungeon Cell ────────────────────────────────────────────────────

function _buildDungeonCell() {
  const W = 5, H = 3.5, D = 6;
  _makeBoxRoom({ color: COLOURS.dungeonCell, w: W, h: H, d: D });

  // Warm ceiling point light for depth and visibility
  const light = _makePointLight(0xffc070, 1.5, 12, 2, [0, 2.8, 0]);
  _add(light);

  // Torch sconce (point light + visual mesh)
  const torchLight = _makePointLight(TOKEN_ACCENT_AMBER, 1.5, 8, 2, [-1.5, 2.2, -1.5]);
  _add(torchLight);

  const torch = _makeBox(0.15, 0.4, 0.1, TOKEN_ACCENT_AMBER, [-1.5, 2.2, -1.5], {
    emissive: TOKEN_ACCENT_AMBER,
    emissiveIntensity: 0.8,
    roughness: 0.5,
  });
  _add(torch);

  // Loose stone on the floor (item: bent-spoon)
  const state = getState();
  if (!state.inventory.items.some((i) => i.itemId === 'bent-spoon')) {
    _makeItemBox([0.6, 0.13, 1.5], 'item-bent-spoon', 'Loose stone (Bent spoon underneath)');
  }

  // Candle on a shelf (item: candle-stub)
  if (!state.inventory.items.some((i) => i.itemId === 'candle-stub')) {
    _makeItemBox([-1.8, 1.4, -2.0], 'item-candle-stub', 'Candle stub on a shelf');
  }

  // Cell door (back wall) — only interactable if dungeon-cell puzzle solved
  const door = _makeBox(0.9, 1.8, 0.1, 0x1e1a14, [0, 0.9, -D / 2 + 0.05], { roughness: 1.0 });
  _addInteractable(door, 'room1-door', 'Heavy wooden door (use bent spoon to open)', 'puzzle');
}

// ─── Room 2: Stone Corridor ──────────────────────────────────────────────────

function _buildStoneCorridor() {
  const W = 4, H = 3.5, D = 14;
  _makeBoxRoom({ color: COLOURS.stoneCorridor, w: W, h: H, d: D, ambientIntensity: 0.2 });

  // Warm ceiling point light for depth and visibility
  const light = _makePointLight(0xffc070, 1.5, 12, 2, [0, 2.8, 0]);
  _add(light);

  // Wall sconces
  _add(_makePointLight(TOKEN_ACCENT_AMBER, 1.0, 6, 2, [-1.5, 2.5, -4]));
  _add(_makePointLight(TOKEN_ACCENT_AMBER, 1.0, 6, 2, [1.5, 2.5, 0]));
  _add(_makePointLight(TOKEN_ACCENT_AMBER, 1.0, 6, 2, [-1.5, 2.5, 4]));

  const state = getState();

  // Moonflower petal in wall alcove (left wall)
  if (!state.inventory.items.some((i) => i.itemId === 'moonflower-petal')) {
    const petal = _makeItemBox([-1.9, 1.8, -3.5], 'item-moonflower-petal', 'Moonflower petal in alcove');
    // Give it a soft purple glow
    petal.material.color.setHex(TOKEN_ACCENT_PURPLE);
    petal.material.emissive.setHex(TOKEN_ACCENT_PURPLE);
    petal.material.emissiveIntensity = 0.4;
  }

  // Oil-soaked rag in a wall sconce
  if (!state.inventory.items.some((i) => i.itemId === 'oil-soaked-rag')) {
    _makeItemBox([1.8, 2.3, 0.2], 'item-oil-soaked-rag', 'Oil-soaked rag in wall sconce');
  }

  // Doors to other rooms — arranged along the corridor walls
  const doors = [
    { pos: [0, 0.9, -D / 2 + 0.1], target: 'dungeon-cell', label: 'Door to Dungeon Cell' },
    { pos: [-1.5, 0.9, -2.0], target: 'kitchen', label: 'Door to Kitchen' },
    { pos: [1.5, 0.9, -2.0], target: 'library', label: 'Door to Library' },
    { pos: [-1.5, 0.9, 2.0], target: 'great-hall', label: 'Door to Great Hall' },
    { pos: [1.5, 0.9, 2.0], target: 'chapel', label: 'Door to Chapel' },
    { pos: [-1.5, 0.9, 5.0], target: 'armoury', label: 'Door to Armoury' },
    { pos: [1.5, 0.9, 5.0], target: 'tower-room', label: 'Door to Tower Room' },
    { pos: [-1.5, 0.9, -5.5], target: 'witchs-study', label: "Door to Witch's Study" },
    { pos: [0, 0.9, D / 2 - 0.1], target: 'castle-gate', label: 'Door to Castle Gate' },
  ];
  for (const d of doors) {
    _makeDoor(d.pos, d.target, d.label);
  }
}

// ─── Room 3: Kitchen ─────────────────────────────────────────────────────────

function _buildKitchen() {
  const W = 5, H = 3.2, D = 6;
  _makeBoxRoom({ color: COLOURS.kitchen, w: W, h: H, d: D, ambientIntensity: 0.3 });

  // Warm ceiling point light for depth and visibility
  const light = _makePointLight(0xffc070, 1.5, 12, 2, [0, 2.8, 0]);
  _add(light);

  // Fire glow
  _add(_makePointLight(0xff6010, 1.2, 5, 2, [0, 0.5, -1.5]));

  // Cauldron (puzzle target)
  const cauldron = _makeCylinder(0.5, 0.4, 0.7, 0x222222, [0, 0.35, -1.5]);
  _addInteractable(cauldron, 'kitchen-cauldron', 'Cauldron (use moonflower petal, salt, and mushroom)', 'puzzle');

  // Shelves on left wall
  const shelf1 = _makeBox(1.5, 0.1, 0.3, 0x4a3020, [-2.2, 1.8, 0], { roughness: 1.0 });
  _add(shelf1);

  const state = getState();

  // Pinch of salt on shelf
  if (!state.inventory.items.some((i) => i.itemId === 'pinch-of-salt')) {
    _makeItemBox([-2.2, 1.95, 0.1], 'item-pinch-of-salt', 'Pinch of salt on shelf');
  }

  // Dried mushroom on shelf
  if (!state.inventory.items.some((i) => i.itemId === 'dried-mushroom')) {
    const mushroom = _makeItemBox([-2.2, 1.95, -0.3], 'item-dried-mushroom', 'Dried mushroom on shelf');
    mushroom.material.color.setHex(0x8a6040);
    mushroom.material.emissive.setHex(0x000000);
  }

  // Back door to corridor
  _makeDoor([0, 0.9, D / 2 - 0.05], 'stone-corridor', 'Door to Stone Corridor');
}

// ─── Room 4: Library ─────────────────────────────────────────────────────────

function _buildLibrary() {
  const W = 6, H = 4, D = 7;
  _makeBoxRoom({ color: COLOURS.library, w: W, h: H, d: D, ambientIntensity: 0.2 });

  // Warm ceiling point light for depth and visibility
  const light = _makePointLight(0xffc070, 1.5, 12, 2, [0, 2.8, 0]);
  _add(light);

  // Reading lamp
  _add(_makePointLight(0xffe0a0, 1.0, 5, 2, [0.5, 2.0, -0.5]));

  // Bookshelf rows (decorative boxes)
  for (let row = 0; row < 3; row++) {
    const shelf = _makeBox(2.5, 0.8, 0.4, 0x1a2030, [-2.5, 1.0 + row * 0.9, -3.0], { roughness: 0.9 });
    _add(shelf);
  }

  // Reading desk
  const desk = _makeBox(1.5, 0.08, 0.8, 0x3a2810, [0.5, 0.9, -0.5], { roughness: 0.8 });
  _add(desk);

  // Symbol order scroll on desk (readable clue — not consumed)
  const state = getState();
  if (!state.inventory.items.some((i) => i.itemId === 'symbol-order-scroll')) {
    const scroll = _makeBox(0.3, 0.05, 0.5, 0xe8d8a0, [0.5, 0.97, -0.5], { roughness: 0.6 });
    _addInteractable(scroll, 'item-symbol-order-scroll', 'Symbol order scroll (readable clue)', 'item');
  }

  // Locked cabinet (puzzle target)
  const cabinetPuzzleSolved = state.puzzles['library-cabinet']?.state === 'solved';
  const cabinet = _makeBox(1.0, 1.8, 0.5, cabinetPuzzleSolved ? 0x2a3a50 : 0x1a2030, [-2.0, 0.9, -D / 2 + 0.5], { roughness: 0.7 });
  _addInteractable(cabinet, 'library-cabinet', 'Locked cabinet (use small iron key)', 'puzzle');

  // Torn spell book page inside cabinet — only visible after solve
  if (cabinetPuzzleSolved && !state.inventory.items.some((i) => i.itemId === 'torn-spell-book-page')) {
    _makeItemBox([-2.0, 1.2, -D / 2 + 0.5], 'item-torn-spell-book-page', 'Torn spell book page');
  }

  // Back door to corridor
  _makeDoor([0, 0.9, D / 2 - 0.05], 'stone-corridor', 'Door to Stone Corridor');
}

// ─── Room 5: Great Hall ───────────────────────────────────────────────────────

function _buildGreatHall() {
  const W = 8, H = 5, D = 10;
  _makeBoxRoom({ color: COLOURS.greatHall, w: W, h: H, d: D, ambientIntensity: 0.15 });

  // Warm ceiling point light for depth and visibility
  const light = _makePointLight(0xffc070, 1.5, 12, 2, [0, 2.8, 0]);
  _add(light);

  // Fireplace glow
  _add(_makePointLight(0xff6010, 1.5, 8, 2, [0, 0.5, D / 2 - 1.5]));

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
    _makeItemBox([0, 0.5, -D / 2 + 0.5], 'item-armoury-chest-key', 'Armoury chest key (hidden behind portrait)');
  }

  // Portrait clue observation point
  if (!state.inventory.items.some((i) => i.itemId === 'portrait-clue')) {
    const clueTarget = _makeBox(0.4, 0.4, 0.05, TOKEN_ACCENT_PURPLE, [2.0, 2.5, -D / 2 + 0.1], {
      emissive: TOKEN_ACCENT_PURPLE,
      emissiveIntensity: 0.3,
    });
    _addInteractable(clueTarget, 'examine-portrait-clue', 'Observe the portrait symbols (chalice, quill, star)', 'examine');
  }

  // Back door to corridor
  _makeDoor([0, 0.9, D / 2 - 0.05], 'stone-corridor', 'Door to Stone Corridor');
}

// ─── Room 6: Chapel ──────────────────────────────────────────────────────────

function _buildChapel() {
  const W = 6, H = 5, D = 8;
  _makeBoxRoom({ color: COLOURS.chapel, w: W, h: H, d: D, ambientIntensity: 0.15 });

  // Warm ceiling point light for depth and visibility
  const light = _makePointLight(0xffc070, 1.5, 12, 2, [0, 2.8, 0]);
  _add(light);

  // Coloured light through windows
  _add(_makePointLight(0x6040ff, 0.8, 8, 2, [-2.0, 3.5, 0]));
  _add(_makePointLight(0xff4060, 0.6, 6, 2, [2.0, 3.5, 0]));

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
    _makeItemBox([0, 0.8, -D / 2 + 1.5], 'item-chapel-sigil', 'Chapel sigil (take from altar drawer)');
  }

  // Back door to corridor
  _makeDoor([0, 0.9, D / 2 - 0.05], 'stone-corridor', 'Door to Stone Corridor');
}

// ─── Room 7: Armoury ─────────────────────────────────────────────────────────

function _buildArmoury() {
  const W = 6, H = 3.5, D = 7;
  _makeBoxRoom({ color: COLOURS.armoury, w: W, h: H, d: D, ambientIntensity: 0.2 });

  // Warm ceiling point light for depth and visibility
  const light = _makePointLight(0xffc070, 1.5, 12, 2, [0, 2.8, 0]);
  _add(light);

  // Torch
  _add(_makePointLight(TOKEN_ACCENT_AMBER, 1.0, 6, 2, [0, 2.5, 0]));

  // Weapon racks (decorative)
  for (let i = 0; i < 3; i++) {
    const rack = _makeBox(0.1, 1.5, 0.05, 0x808080, [-2.5 + i * 2.5, 2.2, -D / 2 + 0.05], { roughness: 0.3, metalness: 0.7 });
    _add(rack);
  }

  // Chest (puzzle target)
  const state = getState();
  const chestSolved = state.puzzles['armoury-chest']?.state === 'solved';
  const chest = _makeBox(1.2, 0.8, 0.8, chestSolved ? 0x504030 : 0x303030, [1.5, 0.4, D / 2 - 1.5], { roughness: 0.7 });
  _addInteractable(chest, 'armoury-chest', 'Iron chest (use armoury chest key)', 'puzzle');

  // Iron gate key inside chest — visible after solve
  if (chestSolved && !state.inventory.items.some((i) => i.itemId === 'iron-gate-key')) {
    _makeItemBox([1.5, 0.85, D / 2 - 1.5], 'item-iron-gate-key', 'Iron gate key (take from chest)');
  }

  // Back door to corridor
  _makeDoor([0, 0.9, D / 2 - 0.05], 'stone-corridor', 'Door to Stone Corridor');
}

// ─── Room 8: Tower Room ───────────────────────────────────────────────────────

function _buildTowerRoom() {
  const W = 5, H = 5, D = 5;
  _makeBoxRoom({ color: COLOURS.towerRoom, w: W, h: H, d: D, ambientIntensity: 0.1 });

  // Warm ceiling point light for depth and visibility
  const light = _makePointLight(0xffc070, 1.5, 12, 2, [0, 2.8, 0]);
  _add(light);

  // Moonlight from windows
  _add(_makePointLight(0xc0d8ff, 1.2, 8, 2, [0, 3.5, 0]));

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
    _makeItemBox([0.5, 1.85, -0.5], 'item-brass-star-chart', 'Brass star chart (take from opened panel)');
  }

  // Back door to corridor
  _makeDoor([0, 0.9, D / 2 - 0.05], 'stone-corridor', 'Door to Stone Corridor');
}

// ─── Room 9: Witch's Study ───────────────────────────────────────────────────

function _buildWitchsStudy() {
  const W = 5, H = 4, D = 7;
  _makeBoxRoom({ color: COLOURS.witchsStudy, w: W, h: H, d: D, ambientIntensity: 0.1 });

  // Warm ceiling point light for depth and visibility
  const light = _makePointLight(0xffc070, 1.5, 12, 2, [0, 2.8, 0]);
  _add(light);

  // Purple magic glow
  _add(_makePointLight(TOKEN_ACCENT_PURPLE, 0.8, 6, 2, [0, 2.0, -1.0]));

  // Lectern (place torn page)
  const lectern = _makeBox(0.6, 1.2, 0.4, 0x300820, [0, 0.6, -1.5], { roughness: 0.8 });
  _add(lectern);

  // Plate on desk (place sigil + star chart)
  const desk = _makeBox(1.8, 0.08, 1.0, 0x200010, [0.5, 0.9, 0.5], { roughness: 0.7 });
  _add(desk);
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
    const crystal = _makeItemBox([0.5, 1.2, 0.5], 'item-charged-binding-crystal', 'Charged binding crystal');
    crystal.material.color.setHex(TOKEN_ACCENT_PURPLE);
    crystal.material.emissive.setHex(TOKEN_ACCENT_PURPLE);
    crystal.material.emissiveIntensity = 0.7;
  }

  // Back door to corridor
  _makeDoor([0, 0.9, D / 2 - 0.05], 'stone-corridor', 'Door to Stone Corridor');
}

// ─── Room 10: Castle Gate ─────────────────────────────────────────────────────

function _buildCastleGate() {
  const W = 6, H = 5, D = 5;
  _makeBoxRoom({ color: COLOURS.castleGate, w: W, h: H, d: D, ambientIntensity: 0.3 });

  // Warm ceiling point light for depth and visibility
  const light = _makePointLight(0xffc070, 1.5, 12, 2, [0, 2.8, 0]);
  _add(light);

  // Daylight glow from the gate
  _add(_makePointLight(0xfff8e0, 2.0, 10, 2, [0, 2.5, -D / 2 + 0.5]));

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

  // Back door to corridor
  _makeDoor([0, 0.9, D / 2 - 0.05], 'stone-corridor', 'Door to Stone Corridor');
}

// ─── Generic fallback room ────────────────────────────────────────────────────

function _buildGenericRoom(_roomId) {
  _makeBoxRoom({ color: 0x2a2a2a, w: 5, h: 3.5, d: 6, ambientIntensity: 0.3 });

  // Warm ceiling point light for depth and visibility
  const light = _makePointLight(0xffc070, 1.5, 12, 2, [0, 2.8, 0]);
  _add(light);

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
