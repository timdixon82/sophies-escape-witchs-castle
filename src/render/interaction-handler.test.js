/**
 * Sophie's Escape — Interaction Handler unit tests
 *
 * Focuses on the timing contract for refreshInteractionList after a door
 * transition: the keyboard nav list must be rebuilt from the NEW room's
 * interactables (returned by getInteractables), not the departing room's.
 *
 * This test was introduced alongside the fix for the keynav timing bug
 * (work folder 032). The bug: _handleDoor called dispatch(ENTER_ROOM) before
 * enterRoom(), causing the _onStateChange subscriber in main.js to call
 * refreshInteractionList while getInteractables() still held the old room's
 * meshes.
 *
 * The fix: _handleDoor now calls refreshInteractionList(announce) AFTER
 * enterRoom() returns. The _onStateChange room-change branch no longer calls
 * refreshInteractionList.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock Three.js ────────────────────────────────────────────────────────────

vi.mock('three', () => {
  class Vector2 { constructor() {} }
  class Raycaster {
    constructor() {}
    setFromCamera() {}
    intersectObjects() { return []; }
  }
  return { Vector2, Raycaster };
});

// ─── Mock intent-bus ──────────────────────────────────────────────────────────
//
// on() registers listeners; we capture the INTERACT listener so tests can fire
// it directly if needed. For keyboard-nav tests we do not need to fire INTERACT.
//

vi.mock('./input/intent-bus.js', () => ({
  on: vi.fn(() => vi.fn()), // returns an unsubscribe no-op
}));

// ─── Mock state ───────────────────────────────────────────────────────────────

const _mockDispatch = vi.fn();
const _mockGetState = vi.fn();

vi.mock('../core/state.js', () => ({
  dispatch: (...args) => _mockDispatch(...args),
  getState: (...args) => _mockGetState(...args),
}));

// ─── Mock room-manager ────────────────────────────────────────────────────────
//
// getInteractables and enterRoom are the two functions whose call order the fix
// enforces. We track that order explicitly.
//

const _mockGetInteractables = vi.fn();
const _mockEnterRoom = vi.fn();
const _mockRemoveItemMesh = vi.fn();

vi.mock('./room-manager.js', () => ({
  getInteractables: (...args) => _mockGetInteractables(...args),
  enterRoom: (...args) => _mockEnterRoom(...args),
  removeItemMesh: (...args) => _mockRemoveItemMesh(...args),
}));

// ─── Mock engine ──────────────────────────────────────────────────────────────

vi.mock('./engine.js', () => ({
  getCamera: vi.fn(() => null),
}));

// ─── Mock room-data ───────────────────────────────────────────────────────────

vi.mock('../assets/room-data.js', () => ({
  PUZZLE_DEFINITIONS: {},
  ITEMS: {},
  ROOM_DESCRIPTIONS: {},
}));

// ─── Mock audio ───────────────────────────────────────────────────────────────

vi.mock('../audio/audio-manager.js', () => ({
  play: vi.fn(),
}));

// ─── Mock speech ──────────────────────────────────────────────────────────────

vi.mock('../ui/speech-manager.js', () => ({
  speak: vi.fn(),
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import {
  installInteractionHandler,
  removeInteractionHandler,
} from './interaction-handler.js';

// ─── DOM helpers ─────────────────────────────────────────────────────────────

function _makeButton() {
  const listeners = {};
  return {
    type: '',
    textContent: '',
    addEventListener: vi.fn((event, handler) => {
      listeners[event] = handler;
    }),
    _trigger: (event) => listeners[event]?.(),
  };
}

function _makeLi() {
  let _child = null;
  return {
    setAttribute: vi.fn(),
    appendChild: vi.fn((child) => { _child = child; }),
    get firstChild() { return _child; },
    querySelector(sel) {
      if (sel === 'button' && _child) return _child;
      return null;
    },
  };
}

let _navListEl;

function _installDomStubs() {
  const items = [];
  _navListEl = {
    id: 'interaction-kbd-list',
    setAttribute: vi.fn(),
    style: { cssText: '' },
    get firstChild() { return items[0] ?? null; },
    removeChild: vi.fn((child) => {
      const idx = items.indexOf(child);
      if (idx >= 0) items.splice(idx, 1);
    }),
    appendChild: vi.fn((child) => { items.push(child); }),
    get children() { return items; },
    remove: vi.fn(),
  };

  global.document = {
    getElementById: vi.fn((id) => {
      if (id === 'interaction-kbd-list') return null; // force creation
      if (id === 'game-crosshair') return null;
      if (id === 'selected-item-hud') return null;
      return null;
    }),
    createElement: vi.fn((tag) => {
      if (tag === 'ul') return _navListEl;
      if (tag === 'li') return _makeLi();
      if (tag === 'button') return _makeButton();
      if (tag === 'div') return {
        id: '',
        setAttribute: vi.fn(),
        style: { cssText: '' },
        remove: vi.fn(),
      };
      return { setAttribute: vi.fn(), style: { cssText: '' }, textContent: '' };
    }),
    body: { appendChild: vi.fn() },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('_handleDoor: keyboard nav list timing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _installDomStubs();
  });

  afterEach(() => {
    removeInteractionHandler();
  });

  it('rebuilds the keyboard nav list from new-room interactables after enterRoom completes', () => {
    // Arrange ─────────────────────────────────────────────────────────────────
    //
    // Two mesh populations:
    //   oldRoom: contains the cell door (used to build the initial nav list)
    //   newRoom: contains a stone-corridor item (expected after door transition)
    //
    let enterRoomHasBeenCalled = false;

    const doorMesh = {
      userData: {
        id: 'room1-door',
        type: 'door',
        label: 'Cell Door',
        interactable: true,
      },
    };

    const corridorMesh = {
      userData: {
        id: 'wall-torch',
        type: 'item',
        label: 'Wall Torch',
        interactable: true,
      },
    };

    // getInteractables returns old-room items until enterRoom is called.
    _mockGetInteractables.mockImplementation(() =>
      enterRoomHasBeenCalled ? [corridorMesh] : [doorMesh]
    );

    // enterRoom flips the flag so subsequent getInteractables calls return
    // new-room items.
    _mockEnterRoom.mockImplementation(() => {
      enterRoomHasBeenCalled = true;
    });

    // State: game is playing, puzzle solved so the cell door opens.
    _mockGetState.mockReturnValue({
      gameStatus: 'playing',
      openOverlays: [],
      puzzles: { 'cell-escape': { state: 'solved' } },
      inventory: { items: [], selectedItemIds: [] },
      roomsVisited: ['dungeon-cell'],
    });

    const announce = vi.fn();

    // Install the handler — this also builds the initial nav list (old room).
    installInteractionHandler(announce);

    // The initial list must contain the door button (sanity check).
    expect(_navListEl.children).toHaveLength(1);
    expect(_navListEl.children[0].querySelector('button').textContent).toBe('Cell Door');

    // Act ──────────────────────────────────────────────────────────────────────
    //
    // Click the door button. This calls _handleInteractable → _handleDoor.
    // _handleDoor must call enterRoom THEN refreshInteractionList so the list
    // is rebuilt from new-room items.
    //
    _navListEl.children[0].querySelector('button')._trigger('click');

    // Assert ───────────────────────────────────────────────────────────────────
    //
    // After the click:
    //   1. enterRoom('stone-corridor') should have been called.
    //   2. The nav list should contain 'Wall Torch', not 'Cell Door'.
    //
    expect(_mockEnterRoom).toHaveBeenCalledWith('stone-corridor');

    expect(_navListEl.children).toHaveLength(1);
    expect(_navListEl.children[0].querySelector('button').textContent).toBe('Wall Torch');
  });
});
