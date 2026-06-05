/**
 * Sophie's Escape — Settings panel unit tests
 *
 * Tests the settings module: localStorage persistence, initial default,
 * and the toggle behaviour.
 *
 * No DOM or browser APIs beyond a localStorage stub are required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Stub localStorage ────────────────────────────────────────────────────────
//
// Vitest does not provide a real localStorage in the Node environment.
// We use a simple in-memory stub for all tests.
//

function makeStorageStub() {
  const store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, val) => { store[key] = String(val); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { for (const k in store) delete store[k]; }),
    _store: store,
  };
}

// ─── Stub DOM elements ────────────────────────────────────────────────────────

function makeCheckboxStub(initialChecked = false) {
  const listeners = {};
  return {
    id: 'settings-item-labels-checkbox',
    checked: initialChecked,
    addEventListener: vi.fn((event, handler) => { listeners[event] = handler; }),
    _trigger: (event, value) => {
      if (listeners[event]) listeners[event]({ target: { checked: value } });
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('settings-panel', () => {
  let storageMock;
  let checkboxMock;

  beforeEach(async () => {
    // Reset module state by re-importing after each test.
    // We use vi.resetModules() to get a fresh module instance each time.
    vi.resetModules();

    storageMock = makeStorageStub();
    global.localStorage = storageMock;

    checkboxMock = makeCheckboxStub();
    global.document = {
      getElementById: vi.fn((id) => {
        if (id === 'settings-item-labels-checkbox') return checkboxMock;
        return null;
      }),
    };
  });

  it('defaults to labels off when localStorage has no stored value', async () => {
    const { mountSettingsPanel, areItemLabelsVisible } = await import('./settings-panel.js');
    mountSettingsPanel();
    expect(areItemLabelsVisible()).toBe(false);
  });

  it('reads a stored true value from localStorage on mount', async () => {
    storageMock._store['sewc-item-labels'] = 'true';
    const { mountSettingsPanel, areItemLabelsVisible } = await import('./settings-panel.js');
    mountSettingsPanel();
    expect(areItemLabelsVisible()).toBe(true);
  });

  it('reads a stored false value from localStorage on mount', async () => {
    storageMock._store['sewc-item-labels'] = 'false';
    const { mountSettingsPanel, areItemLabelsVisible } = await import('./settings-panel.js');
    mountSettingsPanel();
    expect(areItemLabelsVisible()).toBe(false);
  });

  it('syncs the checkbox checked state to the stored preference on mount', async () => {
    storageMock._store['sewc-item-labels'] = 'true';
    const { mountSettingsPanel } = await import('./settings-panel.js');
    mountSettingsPanel();
    expect(checkboxMock.checked).toBe(true);
  });

  it('persists the new value to localStorage when the checkbox is toggled on', async () => {
    const { mountSettingsPanel, areItemLabelsVisible } = await import('./settings-panel.js');
    mountSettingsPanel();
    // Simulate user checking the checkbox.
    checkboxMock._trigger('change', true);
    expect(areItemLabelsVisible()).toBe(true);
    expect(storageMock.setItem).toHaveBeenCalledWith('sewc-item-labels', 'true');
  });

  it('persists the new value to localStorage when the checkbox is toggled off', async () => {
    storageMock._store['sewc-item-labels'] = 'true';
    const { mountSettingsPanel, areItemLabelsVisible } = await import('./settings-panel.js');
    mountSettingsPanel();
    // Simulate user unchecking the checkbox.
    checkboxMock._trigger('change', false);
    expect(areItemLabelsVisible()).toBe(false);
    expect(storageMock.setItem).toHaveBeenCalledWith('sewc-item-labels', 'false');
  });

  it('does not throw when localStorage is unavailable', async () => {
    global.localStorage = {
      getItem: vi.fn(() => { throw new Error('storage unavailable'); }),
      setItem: vi.fn(() => { throw new Error('storage unavailable'); }),
    };
    const { mountSettingsPanel, areItemLabelsVisible } = await import('./settings-panel.js');
    expect(() => mountSettingsPanel()).not.toThrow();
    expect(areItemLabelsVisible()).toBe(false);
  });
});
