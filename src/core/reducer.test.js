/**
 * Sophie's Escape — Reducer unit tests
 *
 * These tests run in Node.js via Vitest. They require no browser, no Three.js,
 * and no DOM. This proves src/core/ is truly browser-free (ADR 002).
 */

import { describe, it, expect } from 'vitest';
import { reducer, shouldFireWitchEncounter } from './reducer.js';
import { createInitialState } from './state.js';

// Vitest does not provide a real localStorage; stub it for persistence.js import.
// The reducer itself does not call localStorage, so no stub is needed in reducer tests.

describe('reducer', () => {
  it('NEW_GAME returns fresh state with gameStatus playing', () => {
    const initial = createInitialState();
    const next = reducer(initial, { type: 'NEW_GAME' });
    expect(next.gameStatus).toBe('playing');
    expect(next.inventory.items).toHaveLength(0);
    expect(next.elapsedMs).toBe(0);
  });

  it('ENTER_ROOM updates currentRoomId and roomsVisited', () => {
    const initial = { ...createInitialState(), roomsVisited: ['dungeon-cell'] };
    const next = reducer(initial, {
      type: 'ENTER_ROOM',
      payload: { roomId: 'stone-corridor' },
    });
    expect(next.currentRoomId).toBe('stone-corridor');
    expect(next.roomsVisited).toContain('stone-corridor');
    expect(next.roomsVisited).toHaveLength(2);
  });

  it('ENTER_ROOM does not duplicate already-visited rooms', () => {
    const initial = {
      ...createInitialState(),
      roomsVisited: ['dungeon-cell', 'stone-corridor'],
    };
    const next = reducer(initial, {
      type: 'ENTER_ROOM',
      payload: { roomId: 'dungeon-cell' },
    });
    expect(next.roomsVisited).toHaveLength(2);
  });

  it('PICK_UP_ITEM adds item to inventory', () => {
    const initial = createInitialState();
    const next = reducer(initial, {
      type: 'PICK_UP_ITEM',
      payload: { itemId: 'rusty-key' },
    });
    expect(next.inventory.items).toHaveLength(1);
    expect(next.inventory.items[0].itemId).toBe('rusty-key');
    expect(next.inventory.items[0].consumed).toBe(false);
  });

  it('PICK_UP_ITEM does not duplicate already-held item', () => {
    const initial = reducer(createInitialState(), {
      type: 'PICK_UP_ITEM',
      payload: { itemId: 'rusty-key' },
    });
    const next = reducer(initial, {
      type: 'PICK_UP_ITEM',
      payload: { itemId: 'rusty-key' },
    });
    expect(next.inventory.items).toHaveLength(1);
  });

  it('SELECT_ITEM and DESELECT_ITEM toggle selection', () => {
    let state = reducer(createInitialState(), {
      type: 'PICK_UP_ITEM',
      payload: { itemId: 'rusty-key' },
    });
    state = reducer(state, { type: 'SELECT_ITEM', payload: { itemId: 'rusty-key' } });
    expect(state.inventory.selectedItemIds).toContain('rusty-key');

    state = reducer(state, { type: 'DESELECT_ITEM', payload: { itemId: 'rusty-key' } });
    expect(state.inventory.selectedItemIds).not.toContain('rusty-key');
  });

  it('REVEAL_HINT increments revealed count and resets witch timer', () => {
    let state = {
      ...createInitialState(),
      witch: {
        ...createInitialState().witch,
        trigger: { ...createInitialState().witch.trigger, timerActiveMs: 120_000 },
      },
    };
    state = reducer(state, {
      type: 'REVEAL_HINT',
      payload: { puzzleId: 'cell-escape' },
    });
    expect(state.hints['cell-escape'].revealed).toBe(1);
    expect(state.witch.trigger.timerActiveMs).toBe(0); // Decision 10 A1
  });

  it('REVEAL_HINT caps at 3', () => {
    let state = createInitialState();
    for (let i = 0; i < 5; i++) {
      state = reducer(state, { type: 'REVEAL_HINT', payload: { puzzleId: 'cell-escape' } });
    }
    expect(state.hints['cell-escape'].revealed).toBe(3);
  });

  it('OVERLAY_OPENED and OVERLAY_CLOSED manage openOverlays list', () => {
    let state = reducer(createInitialState(), {
      type: 'OVERLAY_OPENED',
      payload: { overlayName: 'inventory' },
    });
    expect(state.openOverlays).toContain('inventory');

    state = reducer(state, {
      type: 'OVERLAY_CLOSED',
      payload: { overlayName: 'inventory' },
    });
    expect(state.openOverlays).not.toContain('inventory');
  });

  it('PAUSE sets gameStatus to paused', () => {
    const initial = { ...createInitialState(), gameStatus: 'playing' };
    const next = reducer(initial, { type: 'PAUSE' });
    expect(next.gameStatus).toBe('paused');
  });

  it('RESUME sets gameStatus to playing and removes pause from openOverlays', () => {
    const initial = {
      ...createInitialState(),
      gameStatus: 'paused',
      openOverlays: ['pause'],
    };
    const next = reducer(initial, { type: 'RESUME' });
    expect(next.gameStatus).toBe('playing');
    expect(next.openOverlays).not.toContain('pause');
  });

  it('UPDATE_SETTINGS merges partial settings', () => {
    const initial = createInitialState();
    const next = reducer(initial, {
      type: 'UPDATE_SETTINGS',
      payload: { masterVolume: 0.5 },
    });
    expect(next.settings.masterVolume).toBe(0.5);
    expect(next.settings.controlsHelpSeen).toBe(false); // unchanged
  });

  it('unknown action returns state unchanged', () => {
    const initial = createInitialState();
    const next = reducer(initial, { type: 'UNKNOWN_ACTION_XYZ' });
    expect(next).toBe(initial);
  });
});

describe('shouldFireWitchEncounter', () => {
  it('returns false when gameStatus is not playing', () => {
    const state = { ...createInitialState(), gameStatus: 'paused' };
    expect(shouldFireWitchEncounter(state)).toBe(false);
  });

  it('returns false when overlays are open', () => {
    const state = {
      ...createInitialState(),
      gameStatus: 'playing',
      openOverlays: ['inventory'],
      witch: {
        ...createInitialState().witch,
        trigger: { ...createInitialState().witch.trigger, timerActiveMs: 999_999 },
      },
    };
    expect(shouldFireWitchEncounter(state)).toBe(false);
  });

  it('returns false when timer has not crossed threshold', () => {
    const state = {
      ...createInitialState(),
      gameStatus: 'playing',
      witch: {
        ...createInitialState().witch,
        trigger: { ...createInitialState().witch.trigger, timerActiveMs: 1_000 },
      },
    };
    expect(shouldFireWitchEncounter(state)).toBe(false);
  });

  it('returns true when timer exceeds threshold and no minimum interval block', () => {
    const state = {
      ...createInitialState(),
      gameStatus: 'playing',
      witch: {
        ...createInitialState().witch,
        trigger: {
          ...createInitialState().witch.trigger,
          timerActiveMs: 300_000,
        },
      },
    };
    expect(shouldFireWitchEncounter(state)).toBe(true);
  });
});
