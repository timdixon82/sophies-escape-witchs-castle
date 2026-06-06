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
      this.position = {
        set: vi.fn(function (x, y, z) {
          this.x = x;
          this.y = y;
          this.z = z;
        }),
      };
      this.rotation = { x: 0, y: 0, z: 0 };
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
  it('returns an object with handsGroup', () => {
    const model = createSophieModel();
    expect(model).toHaveProperty('handsGroup');
    expect(model).not.toHaveProperty('bodyGroup');
  });

  it('handsGroup is a THREE.Group', () => {
    const { handsGroup } = createSophieModel();
    expect(handsGroup).toBeInstanceOf(THREE.Group);
  });

  it('handsGroup has exactly 2 children (left hand group and right hand group)', () => {
    const { handsGroup } = createSophieModel();
    expect(handsGroup.children).toHaveLength(2);
  });

  it('every child in handsGroup is a THREE.Group', () => {
    const { handsGroup } = createSophieModel();
    for (const child of handsGroup.children) {
      expect(child).toBeInstanceOf(THREE.Group);
    }
  });

  it('each hand group has 7 children (forearm, palm, 4 fingers, thumb)', () => {
    const { handsGroup } = createSophieModel();
    expect(handsGroup.children[0].children).toHaveLength(7);
    expect(handsGroup.children[1].children).toHaveLength(7);
  });

  it('all hand parts are flesh coloured #f5c5a3', () => {
    const { handsGroup } = createSophieModel();
    for (const handGroup of handsGroup.children) {
      for (const part of handGroup.children) {
        expect(part.material.color.getHex()).toBe(0xf5c5a3);
      }
    }
  });
});
