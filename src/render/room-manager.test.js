/**
 * Sophie's Escape — Room Manager unit tests
 *
 * Tests the removeItemMesh export in isolation.
 *
 * Three.js and the DOM are both mocked so these tests run in Node via Vitest
 * without a browser or WebGL context, consistent with ADR 002.
 *
 * State module is also mocked so enterRoom() can call getState() safely.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Three.js ────────────────────────────────────────────────────────────
//
// We only need the subset of Three.js that room-manager.js touches. Each
// mock constructor/function returns a minimal stub that satisfies the call sites.
//

vi.mock('three', () => {
  const makeMaterial = () => ({
    dispose: vi.fn(),
    emissive: { setHex: vi.fn() },
    emissiveIntensity: 0,
    roughness: 0.8,
    metalness: 0,
  });
  const makeGeometry = () => ({ dispose: vi.fn() });

  class Scene {
    constructor() { this.fog = null; this.background = null; }
    add() {}
    remove() {}
  }

  class Mesh {
    constructor(geometry, material) {
      this.geometry = geometry ?? makeGeometry();
      this.material = material ?? makeMaterial();
      this.userData = {};
      this.position = { set: vi.fn(), clone: vi.fn(() => ({ project: vi.fn() })) };
      this.rotation = { set: vi.fn(), z: 0, x: 0 };
      this.scale = { set: vi.fn() };
    }
  }

  class Group {
    constructor() {
      this.position = { set: vi.fn() };
      this.rotation = { x: 0, y: 0, z: 0 };
      this.userData = {};
    }
    add() {}
  }

  class Vector2 { constructor() {} }
  class Color { constructor() {} }
  class PlaneGeometry { constructor() { return makeGeometry(); } }
  class BoxGeometry { constructor() { return makeGeometry(); } }
  class CylinderGeometry { constructor() { return makeGeometry(); } }
  class SphereGeometry { constructor() { return makeGeometry(); } }
  class TorusGeometry { constructor() { return makeGeometry(); } }
  class LatheGeometry { constructor() { return makeGeometry(); } }
  class MeshStandardMaterial { constructor() { return makeMaterial(); } }
  class AmbientLight { constructor() {} }
  class PointLight { constructor() { this.position = { set: vi.fn() }; } }
  class DirectionalLight { constructor() { this.position = { set: vi.fn() }; } }
  class FogExp2 { constructor() {} }
  class Box3 {
    constructor() {
      this.min = { x: 0, y: 0, z: 0 };
      this.max = { x: 0, y: 0, z: 0 };
    }
    setFromObject() { return this; }
    expandByScalar() { return this.clone(); }
    clone() {
      const b = new Box3();
      b.min = { ...this.min };
      b.max = { ...this.max };
      b.expandByScalar = () => b.clone();
      b.clone = () => b;
      return b;
    }
  }

  const DoubleSide = 2;

  return {
    Scene, Mesh, Group, Vector2, Color,
    PlaneGeometry, BoxGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, LatheGeometry,
    MeshStandardMaterial, AmbientLight, PointLight, DirectionalLight, FogExp2,
    Box3, DoubleSide,
  };
});

// ─── Mock first-person-controller ────────────────────────────────────────────
//
// room-manager.js now imports setCollidableMeshes and resetCameraToRoomEntry.
// Stub them so no THREE.Box3 or camera wiring is needed in tests.
//

vi.mock('./first-person-controller.js', () => ({
  setCollidableMeshes: vi.fn(),
  resetCameraToRoomEntry: vi.fn(),
}));

// ─── Mock settings-panel ──────────────────────────────────────────────────────
//
// room-manager.js imports areItemLabelsVisible from settings-panel.js.
// Return false (labels off) as the default test state.
//

vi.mock('../ui/settings-panel.js', () => ({
  areItemLabelsVisible: vi.fn(() => false),
}));

// ─── Mock state module ────────────────────────────────────────────────────────
//
// getState() is called by every room-builder function. Return a minimal state
// with empty inventory and no puzzles so no items are conditionally added.
//

vi.mock('../core/state.js', () => ({
  getState: () => ({
    inventory: { items: [] },
    puzzles: {},
  }),
  dispatch: vi.fn(),
}));

// ─── Mock room-data ───────────────────────────────────────────────────────────
//
// Provide minimal item stubs matching the items placed in the dungeon cell.
//

vi.mock('../assets/room-data.js', () => ({
  ITEMS: {
    'bent-spoon':    { label: 'Bent spoon' },
    'candle-stub':   { label: 'Candle stub' },
    'moonflower-petal': { label: 'Moonflower petal' },
    'oil-soaked-rag': { label: 'Oil-soaked rag' },
    'pinch-of-salt': { label: 'Pinch of salt' },
    'dried-mushroom': { label: 'Dried mushroom' },
    'symbol-order-scroll': { label: 'Symbol order scroll' },
    'torn-spell-book-page': { label: 'Torn spell book page' },
    'armoury-chest-key': { label: 'Armoury chest key' },
    'chapel-sigil': { label: 'Chapel sigil' },
    'iron-gate-key': { label: 'Iron gate key' },
    'brass-star-chart': { label: 'Brass star chart' },
    'charged-binding-crystal': { label: 'Charged binding crystal' },
  },
  PUZZLE_DEFINITIONS: {},
}));

// ─── Import after mocks are registered ───────────────────────────────────────

import * as THREE from 'three';
import {
  initRoomManager,
  enterRoom,
  getInteractables,
  removeItemMesh,
  rebuildCurrentRoom,
} from './room-manager.js';

// ─── Minimal DOM stubs ────────────────────────────────────────────────────────
//
// room-manager.js calls document.getElementById and document.createElement.
// Provide the minimum DOM surface so the module initialises without errors.
//

function _makeLabelEl() {
  return {
    remove: vi.fn(),
    setAttribute: vi.fn(),
    style: { cssText: '', display: 'block', left: '', top: '' },
    textContent: '',
    appendChild: vi.fn(),
  };
}

function _installDomStubs() {
  global.document = {
    getElementById: vi.fn(() => null),
    createElement: vi.fn(() => _makeLabelEl()),
    body: { appendChild: vi.fn() },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('removeItemMesh', () => {
  beforeEach(() => {
    _installDomStubs();
    // Re-initialise the room manager with a fresh scene. This resets _scene
    // but not _currentRoomId, so we must force a tear-down by entering a
    // different room before entering the room under test. This guarantees
    // a clean _interactables and _roomObjects list for every test.
    initRoomManager(new THREE.Scene());
    enterRoom('kitchen');       // any room other than dungeon-cell — triggers teardown
    enterRoom('dungeon-cell'); // build the test room with bent-spoon and candle-stub
  });

  it('removes the target mesh from the interactables list', () => {
    const before = getInteractables();
    expect(before.some((m) => m.userData.id === 'item-bent-spoon')).toBe(true);

    removeItemMesh('bent-spoon');

    const after = getInteractables();
    expect(after.some((m) => m.userData.id === 'item-bent-spoon')).toBe(false);
  });

  it('leaves other interactables intact', () => {
    const totalBefore = getInteractables().length;

    removeItemMesh('bent-spoon');

    const after = getInteractables();
    expect(after).toHaveLength(totalBefore - 1);
    // candle-stub and the puzzle door should still be present.
    expect(after.some((m) => m.userData.id === 'item-candle-stub')).toBe(true);
  });

  it('calls dispose on geometry and material', () => {
    const spoonMesh = getInteractables().find((m) => m.userData.id === 'item-bent-spoon');

    removeItemMesh('bent-spoon');

    expect(spoonMesh.geometry.dispose).toHaveBeenCalledOnce();
    expect(spoonMesh.material.dispose).toHaveBeenCalledOnce();
  });

  it('removes the DOM label element when one is attached', () => {
    const spoonMesh = getInteractables().find((m) => m.userData.id === 'item-bent-spoon');

    // Attach a label element stub so the removal branch is exercised.
    const fakeLabelEl = _makeLabelEl();
    spoonMesh.userData.labelEl = fakeLabelEl;

    removeItemMesh('bent-spoon');

    expect(fakeLabelEl.remove).toHaveBeenCalledOnce();
    expect(spoonMesh.userData.labelEl).toBeNull();
  });

  it('is a no-op when the itemId is not in the current room', () => {
    const countBefore = getInteractables().length;

    // 'moonflower-petal' is not in the dungeon cell.
    removeItemMesh('moonflower-petal');

    expect(getInteractables()).toHaveLength(countBefore);
  });
});

// ─── removeItemMesh: companion object cleanup ─────────────────────────────────
//
// Regression: multi-mesh items (candle stub, bent spoon, etc.) are built from
// several Three.js objects (meshes, lights, groups). Before the fix, only the
// interactable mesh was removed; companion objects tagged with itemGroupId were
// left in the scene and _roomObjects, causing ghost geometry after pickup.
//

describe('removeItemMesh: companion object cleanup', () => {
  let scene;
  let removeSpy;

  beforeEach(() => {
    _installDomStubs();
    scene = new THREE.Scene();
    removeSpy = vi.spyOn(scene, 'remove');
    initRoomManager(scene);
    enterRoom('kitchen');
    enterRoom('dungeon-cell');
    removeSpy.mockClear(); // discard remove calls from room setup
  });

  it('removes wick and point-light companions from scene when candle-stub is picked up', () => {
    // candle-stub: wax (interactable) + wick (companion) + wickLight (companion).
    // Expect scene.remove called 3 times: once for wax, once for wick, once for wickLight.
    removeItemMesh('candle-stub');
    expect(removeSpy).toHaveBeenCalledTimes(3);
  });

  it('removes the spoon group from scene when bent-spoon is picked up', () => {
    // bent-spoon: handle (interactable, inside group) + group (companion holding handle+bowl).
    // scene.remove(handle) is still called even though it is a no-op in real Three.js.
    // scene.remove(group) is called by the companion scan.
    // Expect exactly 2 remove calls.
    removeItemMesh('bent-spoon');
    expect(removeSpy).toHaveBeenCalledTimes(2);
  });

  it('removes only the targeted item companions, not those of other items', () => {
    // Removing bent-spoon must not affect candle-stub companions.
    removeItemMesh('bent-spoon');
    removeSpy.mockClear();

    // candle-stub is still present; its companions (wick + wickLight) should
    // still be removable independently.
    removeItemMesh('candle-stub');
    expect(removeSpy).toHaveBeenCalledTimes(3);
  });
});

// ─── rebuildCurrentRoom label teardown regression ─────────────────────────────
//
// Regression: _tearDownRoom() only iterated _roomObjects when removing label
// elements. Item meshes whose labelEl is registered only in _interactables (such
// as the bent spoon handle) were skipped, orphaning one div.item-label per call.
//

describe('rebuildCurrentRoom', () => {
  beforeEach(() => {
    _installDomStubs();
    initRoomManager(new THREE.Scene());
    enterRoom('kitchen');
    enterRoom('dungeon-cell');
  });

  it('removes label DOM elements attached to interactable meshes during teardown', () => {
    // Find the bent-spoon handle, which holds userData.labelEl but whose Group
    // (not the handle itself) is registered in _roomObjects. This is the exact
    // path that was orphaning labels before the fix.
    const spoonMesh = getInteractables().find((m) => m.userData.id === 'item-bent-spoon');
    expect(spoonMesh).toBeDefined();

    // Attach a fresh label stub so we can assert it is cleaned up.
    const fakeLabelEl = _makeLabelEl();
    spoonMesh.userData.labelEl = fakeLabelEl;

    // rebuildCurrentRoom() calls _tearDownRoom() then rebuilds. The orphan
    // would survive teardown before the fix; it must be cleaned up after.
    rebuildCurrentRoom();

    expect(fakeLabelEl.remove).toHaveBeenCalledOnce();
  });

  it('does not leave stale labelEl references on interactable meshes after teardown', () => {
    const spoonMesh = getInteractables().find((m) => m.userData.id === 'item-bent-spoon');
    const fakeLabelEl = _makeLabelEl();
    spoonMesh.userData.labelEl = fakeLabelEl;

    rebuildCurrentRoom();

    // The reference is nulled so a subsequent tick of the render loop cannot
    // attempt to reposition a label that is no longer in the DOM.
    expect(spoonMesh.userData.labelEl).toBeNull();
  });
});
