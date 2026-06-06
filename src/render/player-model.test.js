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
  it('returns an object with handsGroup and bodyGroup', () => {
    const model = createSophieModel();
    expect(model).toHaveProperty('handsGroup');
    expect(model).toHaveProperty('bodyGroup');
  });

  it('handsGroup is a THREE.Group', () => {
    const { handsGroup } = createSophieModel();
    expect(handsGroup).toBeInstanceOf(THREE.Group);
  });

  it('bodyGroup is a THREE.Group', () => {
    const { bodyGroup } = createSophieModel();
    expect(bodyGroup).toBeInstanceOf(THREE.Group);
  });

  it('handsGroup has exactly 2 children (left arm and right arm)', () => {
    const { handsGroup } = createSophieModel();
    expect(handsGroup.children).toHaveLength(2);
  });

  it('bodyGroup has exactly 6 children (body, legs x2, shoes x2, hair)', () => {
    const { bodyGroup } = createSophieModel();
    expect(bodyGroup.children).toHaveLength(6);
  });

  it('every child in handsGroup is a THREE.Mesh', () => {
    const { handsGroup } = createSophieModel();
    for (const child of handsGroup.children) {
      expect(child).toBeInstanceOf(THREE.Mesh);
    }
  });

  it('every child in bodyGroup is a THREE.Mesh', () => {
    const { bodyGroup } = createSophieModel();
    for (const child of bodyGroup.children) {
      expect(child).toBeInstanceOf(THREE.Mesh);
    }
  });

  it('bodyGroup child 0 (body/dress) material colour is blue #3a6fd8', () => {
    const { bodyGroup } = createSophieModel();
    const body = bodyGroup.children[0];
    expect(body.material.color.getHex()).toBe(0x3a6fd8);
  });

  it('bodyGroup child 5 (hair) material colour is blonde #f0d060', () => {
    const { bodyGroup } = createSophieModel();
    const hair = bodyGroup.children[5];
    expect(hair.material.color.getHex()).toBe(0xf0d060);
  });

  it('bodyGroup child 3 (left shoe) material colour is white #f0f0f0', () => {
    const { bodyGroup } = createSophieModel();
    const leftShoe = bodyGroup.children[3];
    expect(leftShoe.material.color.getHex()).toBe(0xf0f0f0);
  });

  it('bodyGroup child 4 (right shoe) material colour is white #f0f0f0', () => {
    const { bodyGroup } = createSophieModel();
    const rightShoe = bodyGroup.children[4];
    expect(rightShoe.material.color.getHex()).toBe(0xf0f0f0);
  });

  it('handsGroup arms are flesh coloured #f5c5a3', () => {
    const { handsGroup } = createSophieModel();
    for (const arm of handsGroup.children) {
      expect(arm.material.color.getHex()).toBe(0xf5c5a3);
    }
  });
});
