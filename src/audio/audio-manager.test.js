/**
 * Sophie's Escape — Audio Manager unit tests (Issue 4)
 *
 * Tests init, setVolume, and play() using a mock AudioContext.
 * No real Web Audio API is available in Node/Vitest, so the AudioContext
 * and all related APIs are stubbed with minimal compatible objects.
 *
 * Strategy: vi.resetModules() gives a fresh module each describe block.
 * The AudioContext stub is installed on globalThis before each import.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Minimal Web Audio API stubs ─────────────────────────────────────────────

function makeGainNodeStub() {
  return {
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };
}

function makeOscillatorStub() {
  return {
    type: 'sine',
    frequency: {
      value: 440,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function makeBiquadFilterStub() {
  return {
    type: 'lowpass',
    frequency: { value: 400 },
    Q: { value: 1 },
    connect: vi.fn(),
  };
}

function makeBufferSourceStub() {
  return {
    buffer: null,
    loop: false,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function makeAudioBufferStub(length) {
  const data = new Float32Array(length);
  return { getChannelData: vi.fn(() => data) };
}

function makeAudioContextStub() {
  const sampleRate = 44100;
  return {
    sampleRate,
    currentTime: 0,
    state: 'running',
    destination: {},
    createGain: vi.fn(() => makeGainNodeStub()),
    createOscillator: vi.fn(() => makeOscillatorStub()),
    createBiquadFilter: vi.fn(() => makeBiquadFilterStub()),
    createBufferSource: vi.fn(() => makeBufferSourceStub()),
    createBuffer: vi.fn((_ch, length) => makeAudioBufferStub(length)),
    resume: vi.fn(() => Promise.resolve()),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('audio-manager — init and volume', () => {
  let ctxStub;

  beforeEach(async () => {
    vi.resetModules();

    ctxStub = makeAudioContextStub();

    // AudioContext must be a proper class so `new AudioContext()` works.
    // The constructor returns ctxStub so the module uses our spy object.
    class AudioContextMock {
      constructor() { return ctxStub; }
    }
    globalThis.AudioContext = AudioContextMock;
    delete globalThis.webkitAudioContext;

    globalThis.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete globalThis.AudioContext;
  });

  it('init() creates an AudioContext', async () => {
    const { init } = await import('./audio-manager.js');
    init();
    // If _ctx was set, createGain was called (AudioContext was constructed).
    expect(ctxStub.createGain).toHaveBeenCalled();
  });

  it('init() creates a master gain node and connects to destination', async () => {
    const { init } = await import('./audio-manager.js');
    init();
    expect(ctxStub.createGain).toHaveBeenCalled();
    const masterGain = ctxStub.createGain.mock.results[0].value;
    expect(masterGain.connect).toHaveBeenCalledWith(ctxStub.destination);
  });

  it('init() is safe to call multiple times without creating extra contexts', async () => {
    const { init } = await import('./audio-manager.js');
    init();
    const callCount = ctxStub.createGain.mock.calls.length;
    init();
    init();
    // createGain is only called once (on the first init).
    expect(ctxStub.createGain.mock.calls.length).toBe(callCount);
  });

  it('setVolume() sets master gain to clamped value', async () => {
    const { init, setVolume } = await import('./audio-manager.js');
    init();
    const masterGain = ctxStub.createGain.mock.results[0].value;
    setVolume(0.5);
    expect(masterGain.gain.value).toBe(0.5);
  });

  it('setVolume() clamps negative values to 0', async () => {
    const { init, setVolume } = await import('./audio-manager.js');
    init();
    const masterGain = ctxStub.createGain.mock.results[0].value;
    setVolume(-5);
    expect(masterGain.gain.value).toBe(0);
  });

  it('setVolume() clamps values above 1 to 1', async () => {
    const { init, setVolume } = await import('./audio-manager.js');
    init();
    const masterGain = ctxStub.createGain.mock.results[0].value;
    setVolume(999);
    expect(masterGain.gain.value).toBe(1);
  });

  it('setVolume() before init() does not throw', async () => {
    const { setVolume } = await import('./audio-manager.js');
    expect(() => setVolume(0.5)).not.toThrow();
  });
});

describe('audio-manager — play() sounds', () => {
  let ctxStub;

  beforeEach(async () => {
    vi.resetModules();

    ctxStub = makeAudioContextStub();

    class AudioContextMock {
      constructor() { return ctxStub; }
    }
    globalThis.AudioContext = AudioContextMock;
    delete globalThis.webkitAudioContext;

    globalThis.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete globalThis.AudioContext;
  });

  it('play() before init() does not throw', async () => {
    const { play } = await import('./audio-manager.js');
    expect(() => play('pickup')).not.toThrow();
  });

  it('play("pickup") creates and starts an oscillator', async () => {
    const { init, play } = await import('./audio-manager.js');
    init();
    play('pickup');
    expect(ctxStub.createOscillator).toHaveBeenCalled();
    const osc = ctxStub.createOscillator.mock.results[0].value;
    expect(osc.start).toHaveBeenCalled();
  });

  it('play("footstep") creates and starts a buffer source', async () => {
    const { init, play } = await import('./audio-manager.js');
    init();
    // The ambient buffer source is created on init. Find the footstep one.
    const countBefore = ctxStub.createBufferSource.mock.calls.length;
    play('footstep');
    expect(ctxStub.createBufferSource.mock.calls.length).toBeGreaterThan(countBefore);
    const footstepSrc = ctxStub.createBufferSource.mock.results[countBefore].value;
    expect(footstepSrc.start).toHaveBeenCalled();
  });

  it('play("door") creates and starts an oscillator', async () => {
    const { init, play } = await import('./audio-manager.js');
    init();
    play('door');
    expect(ctxStub.createOscillator).toHaveBeenCalled();
  });

  it('play("puzzleSolve") creates three oscillators for C5, E5, G5', async () => {
    const { init, play } = await import('./audio-manager.js');
    init();
    const countBefore = ctxStub.createOscillator.mock.calls.length;
    play('puzzleSolve');
    expect(ctxStub.createOscillator.mock.calls.length - countBefore).toBe(3);
  });

  it('play("menuOpen") creates and starts an oscillator', async () => {
    const { init, play } = await import('./audio-manager.js');
    init();
    const countBefore = ctxStub.createOscillator.mock.calls.length;
    play('menuOpen');
    expect(ctxStub.createOscillator.mock.calls.length).toBeGreaterThan(countBefore);
  });

  it('play("menuClose") creates and starts an oscillator', async () => {
    const { init, play } = await import('./audio-manager.js');
    init();
    const countBefore = ctxStub.createOscillator.mock.calls.length;
    play('menuClose');
    expect(ctxStub.createOscillator.mock.calls.length).toBeGreaterThan(countBefore);
  });

  it('play("ambient") starts a looping buffer source on init', async () => {
    const { init } = await import('./audio-manager.js');
    init();
    // Ambient starts on init internally.
    expect(ctxStub.createBufferSource).toHaveBeenCalled();
    const ambientSrc = ctxStub.createBufferSource.mock.results[0].value;
    expect(ambientSrc.loop).toBe(true);
    expect(ambientSrc.start).toHaveBeenCalled();
  });

  it('init() starts two looping buffer sources — brown noise base and crackle layer', async () => {
    const { init } = await import('./audio-manager.js');
    init();
    // Layer 1: brown noise (index 0); Layer 2: crackle (index 1).
    expect(ctxStub.createBufferSource.mock.calls.length).toBeGreaterThanOrEqual(2);
    const brownSrc = ctxStub.createBufferSource.mock.results[0].value;
    const crackSrc = ctxStub.createBufferSource.mock.results[1].value;
    expect(brownSrc.loop).toBe(true);
    expect(brownSrc.start).toHaveBeenCalled();
    expect(crackSrc.loop).toBe(true);
    expect(crackSrc.start).toHaveBeenCalled();
  });

  it('stopAmbient() stops both the brown noise and crackle layers', async () => {
    const { init, stopAmbient } = await import('./audio-manager.js');
    init();
    const brownSrc = ctxStub.createBufferSource.mock.results[0].value;
    const crackSrc = ctxStub.createBufferSource.mock.results[1].value;
    stopAmbient();
    expect(brownSrc.stop).toHaveBeenCalled();
    expect(crackSrc.stop).toHaveBeenCalled();
  });
});
