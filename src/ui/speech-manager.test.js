/**
 * Sophie's Escape — Speech Manager unit tests (Issues 5 & 6)
 *
 * Tests setEnabled, speak, cancel, and caption overlay updates.
 * No real speechSynthesis or DOM is available in Node — both are stubbed.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Stubs ────────────────────────────────────────────────────────────────────

function makeSpeechSynthesisStub() {
  return {
    cancel: vi.fn(),
    speak: vi.fn(),
  };
}

function makeCaptionOverlayStub() {
  return {
    textContent: '',
    style: { display: 'none' },
  };
}

function makeStorageStub(captionsEnabled = false) {
  const store = { 'sewc-captions': captionsEnabled ? 'true' : 'false' };
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, val) => { store[key] = String(val); }),
    _store: store,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('speech-manager', () => {
  let synthStub;
  let captionEl;
  let storageMock;

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();

    synthStub = makeSpeechSynthesisStub();
    captionEl = makeCaptionOverlayStub();
    storageMock = makeStorageStub(false);

    globalThis.window = globalThis.window ?? {};
    globalThis.window.speechSynthesis = synthStub;

    // SpeechSynthesisUtterance must be a proper constructor function.
    globalThis.SpeechSynthesisUtterance = function SpeechSynthesisUtteranceStub(text) {
      this.text = text;
      this.onend = null;
      this.onerror = null;
    };

    globalThis.localStorage = storageMock;
    globalThis.document = {
      getElementById: vi.fn((id) => (id === 'caption-overlay' ? captionEl : null)),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('speak() does not call speechSynthesis when disabled (default)', async () => {
    const { speak } = await import('./speech-manager.js');
    speak('Hello world');
    expect(synthStub.speak).not.toHaveBeenCalled();
  });

  it('speak() calls speechSynthesis.speak() when enabled', async () => {
    const { setEnabled, speak } = await import('./speech-manager.js');
    setEnabled(true);
    speak('Hello world');
    expect(synthStub.speak).toHaveBeenCalledTimes(1);
  });

  it('speak() cancels previous utterance before starting a new one', async () => {
    const { setEnabled, speak } = await import('./speech-manager.js');
    setEnabled(true);
    speak('First');
    speak('Second');
    // cancel() called before each speak().
    expect(synthStub.cancel).toHaveBeenCalledTimes(2);
    expect(synthStub.speak).toHaveBeenCalledTimes(2);
  });

  it('cancel() calls speechSynthesis.cancel()', async () => {
    const { cancel } = await import('./speech-manager.js');
    cancel();
    expect(synthStub.cancel).toHaveBeenCalledTimes(1);
  });

  it('setEnabled(false) cancels any in-progress utterance', async () => {
    const { setEnabled, speak } = await import('./speech-manager.js');
    setEnabled(true);
    speak('Something');
    setEnabled(false);
    // cancel() is called when disabling (also called before speak, so at least 2 total).
    expect(synthStub.cancel.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('speak() does not show caption when captions are disabled', async () => {
    storageMock._store['sewc-captions'] = 'false';
    const { speak } = await import('./speech-manager.js');
    speak('No caption');
    expect(captionEl.style.display).toBe('none');
  });

  it('speak() shows caption overlay when captions are enabled', async () => {
    storageMock._store['sewc-captions'] = 'true';
    const { speak } = await import('./speech-manager.js');
    speak('Caption text');
    expect(captionEl.textContent).toBe('Caption text');
    expect(captionEl.style.display).toBe('block');
  });

  it('caption auto-clears after 4 seconds', async () => {
    storageMock._store['sewc-captions'] = 'true';
    const { speak } = await import('./speech-manager.js');
    speak('Will disappear');
    expect(captionEl.style.display).toBe('block');
    vi.advanceTimersByTime(4001);
    expect(captionEl.textContent).toBe('');
    expect(captionEl.style.display).toBe('none');
  });

  it('speak() with empty string does not call speechSynthesis', async () => {
    const { setEnabled, speak } = await import('./speech-manager.js');
    setEnabled(true);
    speak('');
    expect(synthStub.speak).not.toHaveBeenCalled();
  });

  it('captions work independently of speech (captions on, speech off)', async () => {
    storageMock._store['sewc-captions'] = 'true';
    const { speak } = await import('./speech-manager.js');
    // speech is off by default
    speak('Silent caption');
    // Caption shows even though speech is off.
    expect(captionEl.textContent).toBe('Silent caption');
    expect(captionEl.style.display).toBe('block');
    // Speech synthesis is not called.
    expect(synthStub.speak).not.toHaveBeenCalled();
  });
});
