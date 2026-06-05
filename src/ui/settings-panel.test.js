/**
 * Sophie's Escape — Settings panel unit tests
 *
 * Tests the settings module: localStorage persistence, initial defaults,
 * and toggle/slider behaviour for item labels, brightness, volume, speech,
 * and captions.
 *
 * Dependencies that touch the render layer or audio are mocked via vi.mock()
 * at the top level (required by Vitest module hoisting).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Top-level mocks — hoisted by Vitest before any imports.
vi.mock('../render/room-manager.js', () => ({ applyBrightness: vi.fn() }));
vi.mock('../audio/audio-manager.js', () => ({ setVolume: vi.fn(), setMasterVolume: vi.fn() }));
vi.mock('./speech-manager.js', () => ({ setEnabled: vi.fn() }));

// ─── Stub helpers ─────────────────────────────────────────────────────────────

function makeStorageStub(initial = {}) {
  const store = { ...initial };
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, val) => { store[key] = String(val); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { for (const k in store) delete store[k]; }),
    _store: store,
  };
}

function makeCheckboxStub(id, initialChecked = false) {
  const listeners = {};
  return {
    id,
    checked: initialChecked,
    addEventListener: vi.fn((event, handler) => { listeners[event] = handler; }),
    _trigger: (event, value) => {
      if (listeners[event]) listeners[event]({ target: { checked: value } });
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('settings-panel — item labels', () => {
  let storageMock;
  let labelsCb;

  beforeEach(async () => {
    vi.resetModules();

    storageMock = makeStorageStub();
    globalThis.localStorage = storageMock;

    labelsCb = makeCheckboxStub('settings-item-labels-checkbox');
    globalThis.document = {
      getElementById: vi.fn((id) => {
        if (id === 'settings-item-labels-checkbox') return labelsCb;
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
    expect(labelsCb.checked).toBe(true);
  });

  it('persists the new value to localStorage when the checkbox is toggled on', async () => {
    const { mountSettingsPanel, areItemLabelsVisible } = await import('./settings-panel.js');
    mountSettingsPanel();
    labelsCb._trigger('change', true);
    expect(areItemLabelsVisible()).toBe(true);
    expect(storageMock.setItem).toHaveBeenCalledWith('sewc-item-labels', 'true');
  });

  it('persists the new value to localStorage when the checkbox is toggled off', async () => {
    storageMock._store['sewc-item-labels'] = 'true';
    const { mountSettingsPanel, areItemLabelsVisible } = await import('./settings-panel.js');
    mountSettingsPanel();
    labelsCb._trigger('change', false);
    expect(areItemLabelsVisible()).toBe(false);
    expect(storageMock.setItem).toHaveBeenCalledWith('sewc-item-labels', 'false');
  });

  it('does not throw when localStorage is unavailable', async () => {
    globalThis.localStorage = {
      getItem: vi.fn(() => { throw new Error('storage unavailable'); }),
      setItem: vi.fn(() => { throw new Error('storage unavailable'); }),
    };
    const { mountSettingsPanel, areItemLabelsVisible } = await import('./settings-panel.js');
    expect(() => mountSettingsPanel()).not.toThrow();
    expect(areItemLabelsVisible()).toBe(false);
  });
});

describe('settings-panel — brightness applies on mount', () => {
  beforeEach(() => {
    vi.resetModules();
    globalThis.localStorage = makeStorageStub();
    globalThis.document = { getElementById: vi.fn(() => null) };
  });

  it('calls applyBrightness with default 0.8 when no stored value', async () => {
    const roomMod = await import('../render/room-manager.js');
    const { mountSettingsPanel } = await import('./settings-panel.js');
    mountSettingsPanel();
    expect(roomMod.applyBrightness).toHaveBeenCalledWith(0.8);
  });

  it('calls applyBrightness with stored brightness value', async () => {
    globalThis.localStorage = makeStorageStub({ 'sewc-brightness': '1.4' });
    const roomMod = await import('../render/room-manager.js');
    const { mountSettingsPanel } = await import('./settings-panel.js');
    mountSettingsPanel();
    expect(roomMod.applyBrightness).toHaveBeenCalledWith(1.4);
  });
});

describe('settings-panel — volume applies on mount', () => {
  beforeEach(() => {
    vi.resetModules();
    globalThis.localStorage = makeStorageStub();
    globalThis.document = { getElementById: vi.fn(() => null) };
  });

  it('calls setVolume with default 0.7 (70/100) when no stored value', async () => {
    const audioMod = await import('../audio/audio-manager.js');
    const { mountSettingsPanel } = await import('./settings-panel.js');
    mountSettingsPanel();
    expect(audioMod.setVolume).toHaveBeenCalledWith(0.7);
  });

  it('calls setVolume with stored volume value divided by 100', async () => {
    globalThis.localStorage = makeStorageStub({ 'sewc-volume': '50' });
    const audioMod = await import('../audio/audio-manager.js');
    const { mountSettingsPanel } = await import('./settings-panel.js');
    mountSettingsPanel();
    expect(audioMod.setVolume).toHaveBeenCalledWith(0.5);
  });
});
