/**
 * Sophie's Escape — Interaction Handler (v0.3)
 *
 * Listens for INTERACT intents from the intent bus.
 * Uses a THREE.Raycaster to detect what interactable object the player
 * is looking at (centre of the screen = camera forward direction).
 *
 * Resolves the object's userData.type to decide what action to fire:
 *
 *   type: 'item'    → dispatch PICK_UP_ITEM
 *   type: 'door'    → check precondition, then dispatch ENTER_ROOM
 *   type: 'puzzle'  → check required items, then dispatch USE_ITEM_ON_TARGET
 *   type: 'examine' → dispatch EXAMINE_CLUE
 *
 * Accessibility: every interaction outcome is announced via the game-announcer
 * ARIA live region, so screen-reader users hear what happened.
 *
 * Keyboard accessibility: _updateKeyboardNavList() builds a visually-hidden list
 * of buttons, one per interactable in the current room. Each button triggers
 * the same logic as a Raycaster click. This satisfies WCAG 2.1.1 Keyboard.
 *
 * Per-frame highlight: tickHighlight(camera, announce) raycasts from the screen
 * centre each frame. If the nearest hit is within INTERACT_DISTANCE, it applies
 * an emissive boost to that mesh and resets all others. When the highlighted mesh
 * changes the item label is announced to screen readers.
 */

import * as THREE from 'three';
import { on } from './input/intent-bus.js';
import { dispatch, getState } from '../core/state.js';
import { getCamera } from './engine.js';
import { getInteractables, enterRoom, removeItemMesh } from './room-manager.js';
import { PUZZLE_DEFINITIONS, ITEMS } from '../assets/room-data.js';
import { play as playSound } from '../audio/audio-manager.js';
import { speak } from '../ui/speech-manager.js';

/** @type {THREE.Raycaster} */
const _raycaster = new THREE.Raycaster();

/** The centre of the screen in NDC (Normalised Device Coordinates). */
const _screenCentre = new THREE.Vector2(0, 0);

/** Max interaction distance in metres. */
const INTERACT_DISTANCE = 4.0;

/** @type {(() => void) | null} */
let _unsubInteract = null;

/** @type {HTMLElement | null} */
let _keyboardNavList = null;

/** @type {HTMLElement | null} */
let _crosshair = null;

/**
 * The mesh that is currently highlighted by tickHighlight.
 * Tracked so we can reset its emissive when the highlight moves.
 * @type {THREE.Mesh | null}
 */
let _highlightedMesh = null;

/**
 * Emissive intensity applied when an item is highlighted (within reach).
 * @type {number}
 */
const HIGHLIGHT_INTENSITY = 1.5;

/**
 * Emissive intensity restored when an item is no longer highlighted.
 * @type {number}
 */
const BASE_INTENSITY = 0.5;

/**
 * Installs the interaction handler. Call once after initRoomManager().
 * @param {(message: string) => void} announce — function that writes to the ARIA live region
 */
export function installInteractionHandler(announce) {
  _unsubInteract = on('INTERACT', () => _onInteract(announce));
  _installKeyboardNav(announce);
  _installCrosshair();
}

/**
 * Removes the interaction handler.
 */
export function removeInteractionHandler() {
  if (_unsubInteract) {
    _unsubInteract();
    _unsubInteract = null;
  }
  if (_keyboardNavList) {
    _keyboardNavList.remove();
    _keyboardNavList = null;
  }
  if (_crosshair) {
    _crosshair.remove();
    _crosshair = null;
  }
}

/**
 * Updates the keyboard navigation list when the room changes.
 * Call from main.js whenever currentRoomId changes.
 * @param {(message: string) => void} announce
 */
export function refreshInteractionList(announce) {
  _updateKeyboardNavList(announce);
}

/**
 * Per-frame hover highlight. Call this from the game loop each frame.
 *
 * Raycasts from the screen centre (NDC 0,0) toward the scene. If the nearest
 * hit is within INTERACT_DISTANCE, that mesh receives a raised emissiveIntensity
 * of HIGHLIGHT_INTENSITY; all other interactable meshes are reset to
 * BASE_INTENSITY. When the highlighted mesh changes, the item label is announced
 * to the screen reader via `announce` so keyboard and screen-reader users know
 * what they are looking at.
 *
 * Only item-type meshes are highlighted; doors and puzzle targets are left at
 * their authored emissive values.
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {(message: string) => void} announce
 */
export function tickHighlight(camera, announce) {
  const interactables = getInteractables();
  if (!interactables.length) return;

  _raycaster.setFromCamera(_screenCentre, camera);
  const hits = _raycaster.intersectObjects(interactables, false);

  /** @type {THREE.Mesh | null} */
  let nearestItem = null;
  if (hits.length > 0 && hits[0].distance <= INTERACT_DISTANCE) {
    const candidate = hits[0].object;
    if (candidate.userData.type === 'item') {
      nearestItem = candidate;
    }
  }

  // If the highlighted mesh has changed, update emissive intensities and announce.
  if (nearestItem !== _highlightedMesh) {
    // Reset the previously highlighted mesh.
    if (_highlightedMesh && _highlightedMesh.material && !Array.isArray(_highlightedMesh.material)) {
      _highlightedMesh.material.emissiveIntensity = BASE_INTENSITY;
    }

    // Apply the highlight to the new mesh.
    if (nearestItem && nearestItem.material && !Array.isArray(nearestItem.material)) {
      nearestItem.material.emissiveIntensity = HIGHLIGHT_INTENSITY;
      const label = nearestItem.userData.label ?? nearestItem.userData.id;
      announce(`${label} nearby.`);
    }

    _highlightedMesh = nearestItem;
  }
}

// ─── Private: crosshair ───────────────────────────────────────────────────────

function _installCrosshair() {
  _crosshair = document.getElementById('game-crosshair');
  if (!_crosshair) {
    _crosshair = document.createElement('div');
    _crosshair.id = 'game-crosshair';
    _crosshair.setAttribute('aria-hidden', 'true');
    _crosshair.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:12px',
      'height:12px',
      'border:2px solid rgba(255,160,64,0.8)',
      'border-radius:50%',
      'pointer-events:none',
      'z-index:10',
    ].join(';');
    document.body.appendChild(_crosshair);
  }
}

// ─── Private: mouse/keyboard INTERACT handler ─────────────────────────────────

function _onInteract(announce) {
  const state = getState();
  if (state.gameStatus !== 'playing') return;
  if (state.openOverlays.length > 0) return;

  const camera = getCamera();
  if (!camera) return;

  _raycaster.setFromCamera(_screenCentre, camera);

  const interactables = getInteractables();
  const hits = _raycaster.intersectObjects(interactables, false);

  if (hits.length === 0 || hits[0].distance > INTERACT_DISTANCE) {
    announce('Nothing nearby to interact with.');
    return;
  }

  const hit = hits[0].object;
  _handleInteractable(hit, announce);
}

// ─── Private: interactable resolution ────────────────────────────────────────

/**
 * @param {THREE.Mesh} mesh
 * @param {(message: string) => void} announce
 */
function _handleInteractable(mesh, announce) {
  const { id, type } = mesh.userData;
  const state = getState();

  switch (type) {
    case 'item':
      _handleItemPickup(id, announce);
      break;

    case 'door':
      _handleDoor(id, announce, state);
      break;

    case 'puzzle':
      _handlePuzzleTarget(id, announce, state);
      break;

    case 'examine':
      _handleExamine(id, announce, state);
      break;

    default:
      break;
  }
}

// ─── Item pickup ──────────────────────────────────────────────────────────────

function _handleItemPickup(objectId, announce) {
  // objectId is like 'item-bent-spoon' — strip prefix.
  const itemId = objectId.replace(/^item-/, '');
  const state = getState();

  const alreadyHeld = state.inventory.items.some((i) => i.itemId === itemId);
  if (alreadyHeld) {
    const label = ITEMS[itemId]?.label ?? itemId;
    announce(`You already have the ${label}.`);
    return;
  }

  dispatch({ type: 'PICK_UP_ITEM', payload: { itemId } });
  removeItemMesh(itemId);
  refreshInteractionList(announce);

  const label = ITEMS[itemId]?.label ?? itemId;
  const pickupMsg = `You picked up: ${label}.`;
  announce(pickupMsg);
  playSound('pickup');
  speak(pickupMsg);
}

// ─── Door navigation ──────────────────────────────────────────────────────────

function _handleDoor(objectId, announce, state) {
  // objectId is 'room1-door' or 'door-<roomId>'
  let targetRoomId;

  if (objectId === 'room1-door') {
    // Cell door — requires cell-escape puzzle to be solved.
    if (state.puzzles['cell-escape']?.state !== 'solved') {
      announce('The door is locked. You need to find a way to open it.');
      return;
    }
    targetRoomId = 'stone-corridor';
  } else {
    // Generic door — id is 'door-<roomId>'
    targetRoomId = objectId.replace(/^door-/, '');
  }

  if (!targetRoomId) return;

  dispatch({ type: 'ENTER_ROOM', payload: { roomId: targetRoomId } });
  enterRoom(targetRoomId);
  // Rebuild the keyboard nav list AFTER enterRoom has populated _interactables
  // for the new room. Calling it here (rather than in the _onStateChange
  // subscriber) guarantees the list reflects the new room's objects, not the
  // departing room's. See work folder 032 and the keynav-timing fix.
  refreshInteractionList(announce);
  playSound('door');
  announce(`You enter the ${_roomName(targetRoomId)}.`);
}

// ─── Puzzle target ────────────────────────────────────────────────────────────

function _handlePuzzleTarget(targetId, announce, state) {
  // Require explicit item selection before using on a puzzle target (Issue 3).
  const selectedItemId = state.inventory.selectedItemIds[0] ?? null;

  if (!selectedItemId) {
    const msg = 'Select an item from your inventory first.';
    announce(msg);
    speak(msg);
    return;
  }

  // Find the puzzle for this target.
  const puzzleEntry = Object.entries(PUZZLE_DEFINITIONS).find(
    ([, def]) => def.target === targetId
  );

  if (!puzzleEntry) {
    announce('Nothing happens.');
    dispatch({ type: 'DESELECT_ITEM', payload: { itemId: selectedItemId } });
    _updateSelectedItemHud(null);
    return;
  }

  const [puzzleId, puzzleDef] = puzzleEntry;

  // Puzzle already solved.
  if (state.puzzles[puzzleId]?.state === 'solved') {
    announce('This puzzle is already solved.');
    return;
  }

  // Check prerequisite puzzles.
  const unmetPrereqs = puzzleDef.prerequisitePuzzles.filter(
    (prereqId) => state.puzzles[prereqId]?.state !== 'solved'
  );
  if (unmetPrereqs.length > 0) {
    announce('You are not ready for this puzzle yet. Explore more of the castle first.');
    return;
  }

  // Check if the selected item is one of the required items.
  const heldNotConsumed = new Set(
    state.inventory.items.filter((i) => !i.consumed).map((i) => i.itemId)
  );
  const selectedIsRequired = puzzleDef.requiredItems.includes(selectedItemId);
  const allRequiredHeld = puzzleDef.requiredItems.every((id) => heldNotConsumed.has(id));

  if (!selectedIsRequired || !allRequiredHeld) {
    // Wrong item or missing items — deselect and give feedback.
    const failMsg = "That doesn't seem to work.";
    announce(failMsg);
    speak(failMsg);
    dispatch({ type: 'DESELECT_ITEM', payload: { itemId: selectedItemId } });
    _updateSelectedItemHud(null);
    return;
  }

  // Fire the use-item-on-target intent. The reducer does the rest.
  dispatch({ type: 'USE_ITEM_ON_TARGET', payload: { itemId: selectedItemId, targetId } });
  _updateSelectedItemHud(null);

  const updatedState = getState();
  if (updatedState.puzzles[puzzleId]?.state === 'solved') {
    playSound('puzzleSolve');
    let msg = 'Puzzle solved!';
    if (puzzleDef.producedItem) {
      const producedLabel = ITEMS[puzzleDef.producedItem]?.label ?? puzzleDef.producedItem;
      msg += ` You found: ${producedLabel}.`;
    }

    // Special case: gate puzzle completes the game.
    if (puzzleId === 'gate-pedestals') {
      dispatch({ type: 'GAME_COMPLETE' });
      const gateMsg = 'You have placed all three items. The gate swings open. You escape! Congratulations!';
      announce(gateMsg);
      speak(gateMsg);
    } else {
      announce(msg);
      speak(msg);
    }
  } else {
    const nothingMsg = 'Nothing happens. Make sure you have all the required items.';
    announce(nothingMsg);
    speak(nothingMsg);
  }
}

// ─── Examine / clue observation ───────────────────────────────────────────────

function _handleExamine(objectId, announce, state) {
  if (objectId === 'examine-portrait-clue') {
    const alreadyNoted = state.inventory.items.some((i) => i.itemId === 'portrait-clue');
    if (alreadyNoted) {
      const msg = 'You have already noted the symbols: chalice, quill, and star.';
      announce(msg);
      speak(msg);
      return;
    }
    dispatch({ type: 'EXAMINE_CLUE', payload: { clueItemId: 'portrait-clue' } });
    const clueMsg = 'You observe three symbols on the portraits: a chalice, a quill, and a star. You note these down.';
    announce(clueMsg);
    speak(clueMsg);
  }
}

// ─── Keyboard-accessible interaction list ────────────────────────────────────

/**
 * Builds a visually-hidden list of buttons for keyboard-only interaction.
 * Each button represents one interactable in the current room.
 * @param {(message: string) => void} announce
 */
function _installKeyboardNav(announce) {
  _keyboardNavList = document.getElementById('interaction-kbd-list');
  if (!_keyboardNavList) {
    _keyboardNavList = document.createElement('ul');
    _keyboardNavList.id = 'interaction-kbd-list';
    _keyboardNavList.setAttribute('aria-label', 'Interactive objects in this room');
    _keyboardNavList.setAttribute('role', 'list');
    // Screen-reader-only: AT can reach it, visually hidden.
    _keyboardNavList.style.cssText = [
      'position:absolute',
      'width:1px',
      'height:1px',
      'padding:0',
      'margin:-1px',
      'overflow:hidden',
      'clip:rect(0,0,0,0)',
      'white-space:nowrap',
      'border:0',
    ].join(';');
    document.body.appendChild(_keyboardNavList);
  }
  _updateKeyboardNavList(announce);
}

function _updateKeyboardNavList(announce) {
  if (!_keyboardNavList) return;

  // Remove all existing children safely (no innerHTML).
  while (_keyboardNavList.firstChild) {
    _keyboardNavList.removeChild(_keyboardNavList.firstChild);
  }

  const interactables = getInteractables();

  for (const mesh of interactables) {
    const { id, label } = mesh.userData;
    const li = document.createElement('li');
    li.setAttribute('role', 'listitem');

    const btn = document.createElement('button');
    btn.type = 'button';
    // S-14: guard against missing label — screen readers would read the raw ID.
    if (!label) {
      console.warn(
        `[interaction-handler] Mesh "${id}" has no label — screen readers will see the raw ID. Add a label property in room-data.js.`
      );
    }
    btn.textContent = label ?? id;
    btn.addEventListener('click', () => {
      _handleInteractable(mesh, announce);
    });

    li.appendChild(btn);
    _keyboardNavList.appendChild(li);
  }
}

// ─── Selected-item HUD ────────────────────────────────────────────────────────

/**
 * Updates the selected-item HUD indicator (Issue 3).
 * @param {string | null} itemId — item ID or null to hide
 */
function _updateSelectedItemHud(itemId) {
  const hud = document.getElementById('selected-item-hud');
  if (!hud) return;
  if (itemId) {
    const label = ITEMS[itemId]?.label ?? itemId;
    hud.textContent = `Using: ${label}`;
    hud.hidden = false;
  } else {
    hud.textContent = '';
    hud.hidden = true;
  }
}

/**
 * Deselects any currently selected item. Called from keyboard-bridge.js on Escape.
 * Only deselects if an item is currently selected and no overlay is open.
 */
export function deselectSelectedItem() {
  const state = getState();
  if (state.openOverlays.length > 0) return;
  const selectedItemId = state.inventory.selectedItemIds[0] ?? null;
  if (!selectedItemId) return;
  dispatch({ type: 'DESELECT_ITEM', payload: { itemId: selectedItemId } });
  _updateSelectedItemHud(null);
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const _ROOM_NAMES = {
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

function _roomName(roomId) {
  return _ROOM_NAMES[roomId] ?? roomId;
}
