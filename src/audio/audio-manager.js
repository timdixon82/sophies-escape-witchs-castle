/**
 * Sophie's Escape — Audio Manager (Issue 4)
 *
 * Replaces the v0.1 Howler stub with a Web Audio API implementation.
 * All sounds are synthesised procedurally — no binary audio files.
 *
 * Architecture:
 *   - AudioContext is created lazily on the first user gesture (browser
 *     autoplay policy). Call init() from the first keyboard or click event.
 *   - A master GainNode sits between all sources and the destination.
 *   - play(soundName) synthesises a short procedural sound.
 *   - Ambient pink noise runs on a separate loop and is started once.
 *
 * Sound names: footstep, pickup, door, puzzleSolve, ambient, menuOpen, menuClose
 *
 * Volume is stored in localStorage under 'sewc-volume' (0–100).
 */

/** @type {AudioContext | null} */
let _ctx = null;

/** @type {GainNode | null} */
let _masterGain = null;

/** @type {boolean} */
let _initialised = false;

/** @type {AudioBufferSourceNode | null} — ambient pink-noise loop */
let _ambientSource = null;

/** @type {GainNode | null} — gain for the ambient loop */
let _ambientGain = null;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Creates the AudioContext. Must be called from a user gesture event handler
 * to satisfy browser autoplay policy.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function init() {
  if (_initialised) return;
  try {
    const g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : null);
    if (!g) return;
    const AudioContextCtor =
      g.AudioContext ?? g.webkitAudioContext ?? null;
    if (!AudioContextCtor) return;

    _ctx = new AudioContextCtor();
    _masterGain = _ctx.createGain();
    _masterGain.connect(_ctx.destination);

    const stored = _readStoredVolume();
    _masterGain.gain.value = stored / 100;

    _startAmbient();
    _initialised = true;
  } catch {
    // AudioContext creation may fail in locked-down environments. Non-fatal.
  }
}

// Keep the old initAudio name as an alias so existing callers (main.js) do not break.
export { init as initAudio };

/**
 * Sets the master volume.
 * @param {number} volume — 0 to 1
 */
export function setVolume(volume) {
  const clamped = Math.max(0, Math.min(1, volume));
  if (_masterGain) {
    _masterGain.gain.value = clamped;
  }
}

/** Alias used by main.js (legacy name). @param {number} volume 0–1 */
export function setMasterVolume(volume) {
  setVolume(volume);
}

/**
 * Plays a named synthesised sound.
 * @param {'footstep'|'pickup'|'door'|'puzzleSolve'|'ambient'|'menuOpen'|'menuClose'} soundName
 */
export function play(soundName) {
  if (!_ctx || !_masterGain) return;
  // Resume the context on play — some browsers suspend after user inactivity.
  if (_ctx.state === 'suspended') {
    _ctx.resume().catch(() => {});
  }
  switch (soundName) {
    case 'footstep':   _playFootstep(); break;
    case 'pickup':     _playPickup(); break;
    case 'door':       _playDoor(); break;
    case 'puzzleSolve': _playPuzzleSolve(); break;
    case 'ambient':    _startAmbient(); break;
    case 'menuOpen':   _playMenuClick(1200); break;
    case 'menuClose':  _playMenuClick(900); break;
    default: break;
  }
}

/** Alias used by main.js legacy callers. @param {string} _eventName */
export function playEventSound(_eventName) {
  // No-op legacy alias kept so main.js import does not break.
}

/** Alias — no-op since ambient is managed internally. @param {string} _roomId */
export function setRoomAmbient(_roomId) {}

/** Stops the ambient loop. */
export function stopAmbient() {
  if (_ambientSource) {
    try { _ambientSource.stop(); } catch { /* already stopped */ }
    _ambientSource = null;
  }
}

// ─── Private: localStorage helpers ───────────────────────────────────────────

function _readStoredVolume() {
  try {
    const storage = typeof localStorage !== 'undefined' ? localStorage : null;
    if (!storage) return 70;
    const v = storage.getItem('sewc-volume');
    if (v !== null) {
      const n = parseFloat(v);
      if (!isNaN(n)) return Math.max(0, Math.min(100, n));
    }
  } catch { /* storage unavailable */ }
  return 70; // default
}

// ─── Private: sound synthesisers ─────────────────────────────────────────────

/**
 * Footstep: white noise burst, 80 ms, low-pass at 400 Hz, low volume.
 */
function _playFootstep() {
  if (!_ctx || !_masterGain) return;
  const bufSize = _ctx.sampleRate * 0.08; // 80 ms
  const buf = _ctx.createBuffer(1, bufSize, _ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.18;
  }
  // Apply a simple amplitude envelope: fast attack, exponential decay.
  for (let i = 0; i < bufSize; i++) {
    const t = i / bufSize;
    data[i] *= Math.exp(-t * 8);
  }

  const src = _ctx.createBufferSource();
  src.buffer = buf;

  const filter = _ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;

  const gain = _ctx.createGain();
  gain.gain.value = 0.25;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(_masterGain);
  src.start();
}

/**
 * Pickup: sine wave 880 Hz → 1320 Hz glide, 150 ms, medium volume.
 */
function _playPickup() {
  if (!_ctx || !_masterGain) return;
  const dur = 0.15;
  const osc = _ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, _ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(1320, _ctx.currentTime + dur);

  const gain = _ctx.createGain();
  gain.gain.setValueAtTime(0.45, _ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, _ctx.currentTime + dur);

  osc.connect(gain);
  gain.connect(_masterGain);
  osc.start(_ctx.currentTime);
  osc.stop(_ctx.currentTime + dur);
}

/**
 * Door: sawtooth 120 Hz → 80 Hz glide, 400 ms, filtered creak.
 */
function _playDoor() {
  if (!_ctx || !_masterGain) return;
  const dur = 0.4;
  const osc = _ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120, _ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, _ctx.currentTime + dur);

  const filter = _ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 300;
  filter.Q.value = 4;

  const gain = _ctx.createGain();
  gain.gain.setValueAtTime(0.35, _ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, _ctx.currentTime + dur);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(_masterGain);
  osc.start(_ctx.currentTime);
  osc.stop(_ctx.currentTime + dur);
}

/**
 * Puzzle solve: C5 (523 Hz), E5 (659 Hz), G5 (784 Hz) ascending chord,
 * 600 ms total, overlapping sine waves.
 */
function _playPuzzleSolve() {
  if (!_ctx || !_masterGain) return;
  const notes = [
    { freq: 523.25, start: 0.0 },   // C5
    { freq: 659.25, start: 0.15 },  // E5
    { freq: 784.00, start: 0.30 },  // G5
  ];
  for (const { freq, start } of notes) {
    const dur = 0.45;
    const osc = _ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = _ctx.createGain();
    gain.gain.setValueAtTime(0, _ctx.currentTime + start);
    gain.gain.linearRampToValueAtTime(0.4, _ctx.currentTime + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, _ctx.currentTime + start + dur);

    osc.connect(gain);
    gain.connect(_masterGain);
    osc.start(_ctx.currentTime + start);
    osc.stop(_ctx.currentTime + start + dur);
  }
}

/**
 * Menu open/close: sine click at a given frequency, 50 ms.
 * @param {number} freq
 */
function _playMenuClick(freq) {
  if (!_ctx || !_masterGain) return;
  const dur = 0.05;
  const osc = _ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;

  const gain = _ctx.createGain();
  gain.gain.setValueAtTime(0.3, _ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, _ctx.currentTime + dur);

  osc.connect(gain);
  gain.connect(_masterGain);
  osc.start(_ctx.currentTime);
  osc.stop(_ctx.currentTime + dur);
}

/**
 * Ambient: very low-volume pink noise loop, subtle presence.
 * Pink noise is approximated by filtering white noise through a shelf filter.
 * Safe to call multiple times — only one instance runs at a time.
 */
function _startAmbient() {
  if (!_ctx || !_masterGain) return;
  if (_ambientSource) return; // already running

  // Generate 2 s of noise, then loop.
  const bufSize = _ctx.sampleRate * 2;
  const buf = _ctx.createBuffer(1, bufSize, _ctx.sampleRate);
  const data = buf.getChannelData(0);

  // Approximate pink noise via Paul Kellet's filter.
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufSize; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }

  const src = _ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;

  _ambientGain = _ctx.createGain();
  _ambientGain.gain.value = 0.04; // very subtle

  src.connect(_ambientGain);
  _ambientGain.connect(_masterGain);
  src.start();
  _ambientSource = src;
}
