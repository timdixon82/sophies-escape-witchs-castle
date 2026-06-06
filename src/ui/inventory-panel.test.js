/**
 * Sophie's Escape — Inventory panel unit tests
 *
 * Covers the list-rendering behaviour introduced in work folder 034:
 *   - Items render as <li> elements inside the item list.
 *   - Each <li> contains a button with class 'item-btn'.
 *   - The empty-state message is shown/hidden correctly.
 *   - The combine button is disabled when fewer than two items are selected.
 *
 * The DOM is stubbed manually (no jsdom) consistent with the existing test
 * strategy in this project (ADR 002).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Top-level mocks (hoisted by Vitest before any imports) ───────────────────

vi.mock('../core/state.js', () => ({
  getState: vi.fn(),
  subscribe: vi.fn(() => vi.fn()),
  dispatch: vi.fn(),
}));

vi.mock('../assets/room-data.js', () => ({
  ITEMS: {
    'key-rusty': { label: 'Rusty Key' },
    'gem-blue': { label: 'Blue Gem' },
  },
  ITEM_COMBINATIONS: [],
}));

// ─── Fake DOM helpers ─────────────────────────────────────────────────────────

/**
 * Creates a minimal fake DOM element that supports the operations used by
 * inventory-panel.js during rendering.
 * @param {string} tag
 */
function makeFakeElement(tag) {
  const el = {
    tagName: tag.toUpperCase(),
    type: '',
    className: '',
    textContent: '',
    hidden: false,
    disabled: false,
    dataset: {},
    _attributes: {},
    _children: [],
    _listeners: {},

    addEventListener(event, fn) {
      this._listeners[event] = fn;
    },
    setAttribute(k, v) {
      this._attributes[k] = String(v);
    },
    getAttribute(k) {
      return this._attributes[k] ?? null;
    },
    appendChild(child) {
      if (child) this._children.push(child);
      return child;
    },
    remove() {
      this._removed = true;
    },
    // closest('li') — used when removing stale items.
    closest(selector) {
      if (selector === 'li' && this.tagName === 'LI') return this;
      return null;
    },
    // querySelector('[data-item-id="X"]') — used to find an existing button.
    querySelector(selector) {
      const match = selector.match(/\[data-item-id="([^"]+)"\]/);
      if (match) {
        const targetId = match[1];
        for (const child of this._children) {
          for (const grandchild of (child._children || [])) {
            if (grandchild.dataset?.itemId === targetId) return grandchild;
          }
        }
      }
      return null;
    },
    // querySelectorAll('.item-btn') and querySelectorAll('li') — used in render.
    querySelectorAll(selector) {
      if (selector === '.item-btn') {
        const buttons = [];
        for (const child of this._children) {
          for (const grandchild of (child._children || [])) {
            if (grandchild.className === 'item-btn') buttons.push(grandchild);
          }
        }
        return buttons;
      }
      if (selector === 'li') {
        return this._children.filter((c) => c.tagName === 'LI');
      }
      return [];
    },
  };
  return el;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('inventory-panel — list rendering', () => {
  let fakeGrid;
  let fakeEmptyMsg;
  let fakeCombineBtn;

  beforeEach(async () => {
    vi.resetModules();

    fakeGrid = makeFakeElement('ul');
    fakeEmptyMsg = { hidden: false };
    fakeCombineBtn = { addEventListener: vi.fn(), disabled: true };

    globalThis.document = {
      getElementById: vi.fn((id) => {
        if (id === 'inventory-grid') return fakeGrid;
        if (id === 'inventory-empty-msg') return fakeEmptyMsg;
        if (id === 'btn-combine') return fakeCombineBtn;
        // selected-item-hud and inventory-feedback return null — tested elsewhere.
        return null;
      }),
      createElement: (tag) => makeFakeElement(tag),
    };
  });

  it('renders each item as a <li> containing a button with class item-btn', async () => {
    const { getState, subscribe } = await import('../core/state.js');
    vi.mocked(getState).mockReturnValue({
      inventory: {
        items: [{ itemId: 'key-rusty', consumed: false }],
        selectedItemIds: [],
      },
    });
    vi.mocked(subscribe).mockReturnValue(vi.fn());

    const { mountInventoryPanel } = await import('./inventory-panel.js');
    mountInventoryPanel();

    const lis = fakeGrid._children.filter((c) => c.tagName === 'LI');
    expect(lis.length).toBe(1);

    const btn = lis[0]._children.find((c) => c.className === 'item-btn');
    expect(btn).toBeTruthy();
    expect(btn.dataset.itemId).toBe('key-rusty');
  });

  it('renders multiple items as separate <li> rows', async () => {
    const { getState, subscribe } = await import('../core/state.js');
    vi.mocked(getState).mockReturnValue({
      inventory: {
        items: [
          { itemId: 'key-rusty', consumed: false },
          { itemId: 'gem-blue', consumed: false },
        ],
        selectedItemIds: [],
      },
    });
    vi.mocked(subscribe).mockReturnValue(vi.fn());

    const { mountInventoryPanel } = await import('./inventory-panel.js');
    mountInventoryPanel();

    const lis = fakeGrid._children.filter((c) => c.tagName === 'LI');
    expect(lis.length).toBe(2);
  });

  it('sets aria-pressed to false on unselected items', async () => {
    const { getState, subscribe } = await import('../core/state.js');
    vi.mocked(getState).mockReturnValue({
      inventory: {
        items: [{ itemId: 'key-rusty', consumed: false }],
        selectedItemIds: [],
      },
    });
    vi.mocked(subscribe).mockReturnValue(vi.fn());

    const { mountInventoryPanel } = await import('./inventory-panel.js');
    mountInventoryPanel();

    const btn = fakeGrid._children[0]._children[0];
    expect(btn._attributes['aria-pressed']).toBe('false');
  });

  it('sets aria-pressed to true on selected items', async () => {
    const { getState, subscribe } = await import('../core/state.js');
    vi.mocked(getState).mockReturnValue({
      inventory: {
        items: [{ itemId: 'key-rusty', consumed: false }],
        selectedItemIds: ['key-rusty'],
      },
    });
    vi.mocked(subscribe).mockReturnValue(vi.fn());

    const { mountInventoryPanel } = await import('./inventory-panel.js');
    mountInventoryPanel();

    const btn = fakeGrid._children[0]._children[0];
    expect(btn._attributes['aria-pressed']).toBe('true');
  });

  it('shows the empty message and has no <li> rows when inventory is empty', async () => {
    const { getState, subscribe } = await import('../core/state.js');
    vi.mocked(getState).mockReturnValue({
      inventory: { items: [], selectedItemIds: [] },
    });
    vi.mocked(subscribe).mockReturnValue(vi.fn());

    const { mountInventoryPanel } = await import('./inventory-panel.js');
    mountInventoryPanel();

    expect(fakeEmptyMsg.hidden).toBe(false);
    const lis = fakeGrid._children.filter((c) => c.tagName === 'LI');
    expect(lis.length).toBe(0);
  });

  it('hides the empty message when there are items', async () => {
    fakeEmptyMsg.hidden = false;
    const { getState, subscribe } = await import('../core/state.js');
    vi.mocked(getState).mockReturnValue({
      inventory: {
        items: [{ itemId: 'gem-blue', consumed: false }],
        selectedItemIds: [],
      },
    });
    vi.mocked(subscribe).mockReturnValue(vi.fn());

    const { mountInventoryPanel } = await import('./inventory-panel.js');
    mountInventoryPanel();

    expect(fakeEmptyMsg.hidden).toBe(true);
  });

  it('disables the combine button when fewer than two items are selected', async () => {
    const { getState, subscribe } = await import('../core/state.js');
    vi.mocked(getState).mockReturnValue({
      inventory: {
        items: [{ itemId: 'key-rusty', consumed: false }],
        selectedItemIds: ['key-rusty'],
      },
    });
    vi.mocked(subscribe).mockReturnValue(vi.fn());

    const { mountInventoryPanel } = await import('./inventory-panel.js');
    mountInventoryPanel();

    expect(fakeCombineBtn.disabled).toBe(true);
  });

  it('enables the combine button when two or more items are selected', async () => {
    const { getState, subscribe } = await import('../core/state.js');
    vi.mocked(getState).mockReturnValue({
      inventory: {
        items: [
          { itemId: 'key-rusty', consumed: false },
          { itemId: 'gem-blue', consumed: false },
        ],
        selectedItemIds: ['key-rusty', 'gem-blue'],
      },
    });
    vi.mocked(subscribe).mockReturnValue(vi.fn());

    const { mountInventoryPanel } = await import('./inventory-panel.js');
    mountInventoryPanel();

    expect(fakeCombineBtn.disabled).toBe(false);
  });
});
