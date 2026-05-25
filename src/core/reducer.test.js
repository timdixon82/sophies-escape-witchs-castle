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

// ─── v0.2 reducer tests ───────────────────────────────────────────────────────

describe('v0.2 reducer — COMBINE_ITEMS', () => {
  it('combines candle-stub + oil-soaked-rag into lit-torch', () => {
    let state = createInitialState();
    state = reducer(state, { type: 'PICK_UP_ITEM', payload: { itemId: 'candle-stub' } });
    state = reducer(state, { type: 'PICK_UP_ITEM', payload: { itemId: 'oil-soaked-rag' } });

    state = reducer(state, {
      type: 'COMBINE_ITEMS',
      payload: { itemIds: ['candle-stub', 'oil-soaked-rag'] },
    });

    const heldNotConsumed = state.inventory.items.filter((i) => !i.consumed);
    const itemIds = heldNotConsumed.map((i) => i.itemId);

    expect(itemIds).toContain('lit-torch');
    expect(state.inventory.items.find((i) => i.itemId === 'candle-stub').consumed).toBe(true);
    expect(state.inventory.items.find((i) => i.itemId === 'oil-soaked-rag').consumed).toBe(true);
    // Selection is cleared after combine.
    expect(state.inventory.selectedItemIds).toHaveLength(0);
  });

  it('returns state unchanged for an invalid combination', () => {
    let state = createInitialState();
    state = reducer(state, { type: 'PICK_UP_ITEM', payload: { itemId: 'bent-spoon' } });
    state = reducer(state, { type: 'PICK_UP_ITEM', payload: { itemId: 'candle-stub' } });

    const after = reducer(state, {
      type: 'COMBINE_ITEMS',
      payload: { itemIds: ['bent-spoon', 'candle-stub'] },
    });

    // No items consumed, no items added.
    expect(after.inventory.items.every((i) => !i.consumed)).toBe(true);
    expect(after.inventory.items).toHaveLength(2);
  });

  it('combines in any order — order of itemIds does not matter', () => {
    let state = createInitialState();
    state = reducer(state, { type: 'PICK_UP_ITEM', payload: { itemId: 'candle-stub' } });
    state = reducer(state, { type: 'PICK_UP_ITEM', payload: { itemId: 'oil-soaked-rag' } });

    // Provide in reverse order.
    state = reducer(state, {
      type: 'COMBINE_ITEMS',
      payload: { itemIds: ['oil-soaked-rag', 'candle-stub'] },
    });

    expect(state.inventory.items.some((i) => i.itemId === 'lit-torch' && !i.consumed)).toBe(true);
  });
});

describe('v0.2 reducer — EXAMINE_CLUE', () => {
  it('adds a clue to the inventory', () => {
    const state = reducer(createInitialState(), {
      type: 'EXAMINE_CLUE',
      payload: { clueItemId: 'portrait-clue' },
    });
    expect(state.inventory.items.some((i) => i.itemId === 'portrait-clue')).toBe(true);
    expect(state.inventory.items.find((i) => i.itemId === 'portrait-clue').consumed).toBe(false);
  });

  it('does not duplicate an already-noted clue', () => {
    let state = reducer(createInitialState(), {
      type: 'EXAMINE_CLUE',
      payload: { clueItemId: 'portrait-clue' },
    });
    state = reducer(state, {
      type: 'EXAMINE_CLUE',
      payload: { clueItemId: 'portrait-clue' },
    });
    const clues = state.inventory.items.filter((i) => i.itemId === 'portrait-clue');
    expect(clues).toHaveLength(1);
  });
});

describe('v0.2 reducer — USE_ITEM_ON_TARGET (cell-escape puzzle)', () => {
  it('solves cell-escape when bent-spoon is used on room1-door', () => {
    let state = reducer(createInitialState(), {
      type: 'PICK_UP_ITEM',
      payload: { itemId: 'bent-spoon' },
    });

    state = reducer(state, {
      type: 'USE_ITEM_ON_TARGET',
      payload: { itemId: 'bent-spoon', targetId: 'room1-door' },
    });

    expect(state.puzzles['cell-escape'].state).toBe('solved');
    // No items consumed for this puzzle.
    expect(state.inventory.items.find((i) => i.itemId === 'bent-spoon').consumed).toBe(false);
    // Selection is cleared.
    expect(state.inventory.selectedItemIds).toHaveLength(0);
  });

  it('records an attempt when required item is missing', () => {
    const state = createInitialState();
    const after = reducer(state, {
      type: 'USE_ITEM_ON_TARGET',
      payload: { itemId: 'candle-stub', targetId: 'room1-door' },
    });

    expect(after.puzzles['cell-escape']?.attemptsCount).toBe(1);
    expect(after.puzzles['cell-escape']?.state).not.toBe('solved');
  });

  it('is a no-op when the puzzle is already solved', () => {
    let state = reducer(createInitialState(), {
      type: 'PICK_UP_ITEM',
      payload: { itemId: 'bent-spoon' },
    });
    state = reducer(state, {
      type: 'USE_ITEM_ON_TARGET',
      payload: { itemId: 'bent-spoon', targetId: 'room1-door' },
    });
    const solvedState = state;

    // Second attempt on same target.
    const after = reducer(solvedState, {
      type: 'USE_ITEM_ON_TARGET',
      payload: { itemId: 'bent-spoon', targetId: 'room1-door' },
    });

    // State unchanged (same object reference not guaranteed, but puzzle still solved).
    expect(after.puzzles['cell-escape'].state).toBe('solved');
  });
});

describe('v0.2 reducer — USE_ITEM_ON_TARGET (kitchen-cauldron puzzle)', () => {
  it('solves kitchen-cauldron, consumes ingredients, produces small-iron-key', () => {
    let state = createInitialState();
    state = reducer(state, { type: 'PICK_UP_ITEM', payload: { itemId: 'moonflower-petal' } });
    state = reducer(state, { type: 'PICK_UP_ITEM', payload: { itemId: 'pinch-of-salt' } });
    state = reducer(state, { type: 'PICK_UP_ITEM', payload: { itemId: 'dried-mushroom' } });

    state = reducer(state, {
      type: 'USE_ITEM_ON_TARGET',
      payload: { itemId: 'moonflower-petal', targetId: 'kitchen-cauldron' },
    });

    expect(state.puzzles['kitchen-cauldron'].state).toBe('solved');
    expect(state.inventory.items.find((i) => i.itemId === 'moonflower-petal').consumed).toBe(true);
    expect(state.inventory.items.find((i) => i.itemId === 'pinch-of-salt').consumed).toBe(true);
    expect(state.inventory.items.find((i) => i.itemId === 'dried-mushroom').consumed).toBe(true);
    expect(state.inventory.items.some((i) => i.itemId === 'small-iron-key' && !i.consumed)).toBe(true);
  });
});

describe('v0.2 reducer — PUZZLE_COMPLETE', () => {
  it('marks the puzzle as solved', () => {
    const state = reducer(createInitialState(), {
      type: 'PUZZLE_COMPLETE',
      payload: { puzzleId: 'cell-escape' },
    });
    expect(state.puzzles['cell-escape'].state).toBe('solved');
  });
});

describe('v0.2 reducer — GAME_COMPLETE', () => {
  it('sets gameStatus to won', () => {
    const initial = { ...createInitialState(), gameStatus: 'playing' };
    const next = reducer(initial, { type: 'GAME_COMPLETE' });
    expect(next.gameStatus).toBe('won');
  });
});
