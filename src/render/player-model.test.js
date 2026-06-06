/**
 * Sophie's Escape — Player model unit tests
 *
 * Tests the createSophieModel() export in isolation.
 *
 * Three.js is mocked so these tests run in Node via Vitest without a
 * browser or WebGL context, consistent with ADR 002. The mock matches
 * the subset of Three.js that player-model.js uses:
 *   Group, Mesh, BoxGeometry, CylinderGeometry, MeshLambertMaterial.
 */

import { describe, it, expect, vi } from 'vitest';

// ─── Mock Three.js ────────────────────────────────────────────────────────────

vi.mock('three', () => {
  class Group {
    constructor() {
      this.children = [];
    }
    add(child) {
      this.children.push(child);
    }
  }

  class MeshLambertMaterial {
    constructor({ color } = {}) {
      this.color = { getHex: () => color };
    }
  }

  class Mesh {
    constructor(geometry, material) {
      this.geometry = geometry;
      this.material = material;
      this.position = {
        set: vi.fn(function (x, y, z) {
          this.x = x;
          this.y = y;
          this.z = z;
        }),
      };
      this.rotation = { x: 0, y: 0, z: 0 };
    }
  }

  class BoxGeometry {
    constructor(w, h, d) {
      this.type = 'BoxGeometry';
      this.w = w;
      this.h = h;
      this.d = d;
    }
  }

  class CylinderGeometry {
    constructor(rt, rb, h) {
      this.type = 'CylinderGeometry';
      this.rt = rt;
      this.rb = rb;
      this.h = h;
    }
  }

  return {
    Group,
    Mesh,
    BoxGeometry,
    CylinderGeometry,
    MeshLambertMaterial,
  };
});

// ─── Import after mocks ───────────────────────────────────────────────────────

import { createSophieModel } from './player-model.js';
import * as THREE from 'three';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createSophieModel', () => {
  it('returns a THREE.Group', () => {
    const model = createSophieModel();
    expect(model).toBeInstanceOf(THREE.Group);
  });

  it('the group has exactly 8 children (one per body part)', () => {
    const model = createSophieModel();
    expect(model.children).toHaveLength(8);
  });

  it('every child is a THREE.Mesh', () => {
    const model = createSophieModel();
    for (const child of model.children) {
      expect(child).toBeInstanceOf(THREE.Mesh);
    }
  });

  it('body mesh (index 0) material colour is blue #3a6fd8', () => {
    const model = createSophieModel();
    const body = model.children[0];
    expect(body.material.color.getHex()).toBe(0x3a6fd8);
  });

  it('hair mesh (index 7) material colour is blonde #f0d060', () => {
    const model = createSophieModel();
    const hair = model.children[7];
    expect(hair.material.color.getHex()).toBe(0xf0d060);
  });

  it('left shoe mesh (index 3) material colour is white #f0f0f0', () => {
    const model = createSophieModel();
    const leftShoe = model.children[3];
    expect(leftShoe.material.color.getHex()).toBe(0xf0f0f0);
  });

  it('right shoe mesh (index 4) material colour is white #f0f0f0', () => {
    const model = createSophieModel();
    const rightShoe = model.children[4];
    expect(rightShoe.material.color.getHex()).toBe(0xf0f0f0);
  });
});
