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
 * Sound names: footstep, pickup, door, doorCreak, puzzleSolve, ambient, menuOpen, menuClose
 *
 * Volume is stored in localStorage under 'sewc-volume' (0–100).
 */

/** @type {AudioContext | null} */
let _ctx = null;

/** @type {GainNode | null} */
let _masterGain = null;

/** @type {boolean} */
let _initialised = false;

/** @type {AudioBufferSourceNode | null} — ambient brown-noise base loop */
let _ambientSource = null;

/** @type {AudioBufferSourceNode | null} — ambient crackle layer */
let _ambientCrackSource = null;

/** @type {GainNode | null} — gain for the ambient loop */
let _ambientGain = null;

/** @type {ReturnType<typeof setTimeout> | null} — handle for the random sound scheduler */
let _randomSoundTimer = null;

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
 * @param {'footstep'|'pickup'|'door'|'doorCreak'|'puzzleSolve'|'ambient'|'menuOpen'|'menuClose'} soundName
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
    case 'doorCreak':  _playDoorCreak(); break;
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

/** Stops all ambient layers and cancels any pending random-sound timer. */
export function stopAmbient() {
  _stopRandomSounds();
  if (_ambientSource) {
    try { _ambientSource.stop(); } catch { /* already stopped */ }
    _ambientSource = null;
  }
  if (_ambientCrackSource) {
    try { _ambientCrackSource.stop(); } catch { /* already stopped */ }
    _ambientCrackSource = null;
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
 * Door traversal creak: 1.6 s slow creak using two sawtooth oscillators
 * sweeping in opposite directions through a bandpass filter at 250 Hz, Q 5,
 * with a scraping noise layer underneath.
 * Called after enterRoom() so it follows the initial door click.
 */
function _playDoorCreak() {
  if (!_ctx || !_masterGain) return;
  const dur = 1.6;
  const now = _ctx.currentTime;

  // Creak oscillator 1: 140 Hz → 60 Hz (slow downward sweep)
  const osc1 = _ctx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(140, now);
  osc1.frequency.exponentialRampToValueAtTime(60, now + dur);

  // Creak oscillator 2: 95 Hz → 130 Hz (upward sweep — harmonic scrape)
  const osc2 = _ctx.createOscillator();
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(95, now);
  osc2.frequency.exponentialRampToValueAtTime(130, now + dur * 0.7);

  // Scraping noise: filtered white noise burst for texture
  const noiseBuf = _ctx.createBuffer(1, Math.floor(_ctx.sampleRate * dur), _ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * 0.18;
  const noiseSrc = _ctx.createBufferSource();
  noiseSrc.buffer = noiseBuf;

  const bandpass = _ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 250;
  bandpass.Q.value = 5;

  const env = _ctx.createGain();
  env.gain.setValueAtTime(0.0, now);
  env.gain.linearRampToValueAtTime(0.4, now + 0.05);
  env.gain.setValueAtTime(0.4, now + dur * 0.6);
  env.gain.exponentialRampToValueAtTime(0.001, now + dur);

  const noiseGain = _ctx.createGain();
  noiseGain.gain.value = 0.06;

  osc1.connect(bandpass);
  osc2.connect(bandpass);
  bandpass.connect(env);
  noiseSrc.connect(noiseGain);
  noiseGain.connect(env);
  env.connect(_masterGain);

  osc1.start(now); osc1.stop(now + dur);
  osc2.start(now); osc2.stop(now + dur * 0.7);
  noiseSrc.start(now);
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
 * Ambient: two-layer candle/fire sound — warm brown-noise base plus sparse
 * crackle pops. All procedurally generated with the Web Audio API.
 * Safe to call multiple times — only one instance runs at a time.
 */
function _startAmbient() {
  if (!_ctx || !_masterGain) return;
  if (_ambientSource) return; // already running

  // ── Layer 1: brown noise base ──────────────────────────────────────────────
  // Brown noise is approximated by integrating white noise (1/f² spectrum).
  // Sounds warmer and deeper than pink noise, like a low rumble from candles.
  const bufSize = _ctx.sampleRate * 3;
  const buf = _ctx.createBuffer(1, bufSize, _ctx.sampleRate);
  const data = buf.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufSize; i++) {
    const w = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.02 * w) / 1.02;
    data[i] = lastOut * 3.5;
  }
  const brownSrc = _ctx.createBufferSource();
  brownSrc.buffer = buf;
  brownSrc.loop = true;

  const lowpass = _ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 600;
  lowpass.Q.value = 0.7;

  _ambientGain = _ctx.createGain();
  _ambientGain.gain.value = 0.06;

  brownSrc.connect(lowpass);
  lowpass.connect(_ambientGain);
  _ambientGain.connect(_masterGain);
  brownSrc.start();
  _ambientSource = brownSrc;

  // ── Layer 2: crackle pops ──────────────────────────────────────────────────
  // A 4 s buffer of mostly silence with ~30 sparse random impulse pops.
  // Band-passed to give a woody, natural crack, like candle wax popping.
  const popBufSize = _ctx.sampleRate * 4;
  const popBuf = _ctx.createBuffer(1, popBufSize, _ctx.sampleRate);
  const popData = popBuf.getChannelData(0);
  for (let p = 0; p < 30; p++) {
    const t = Math.floor(Math.random() * (popBufSize - 200));
    const amp = 0.15 + Math.random() * 0.25;
    const len = 80 + Math.floor(Math.random() * 120);
    for (let s = 0; s < len; s++) {
      popData[t + s] = amp * Math.exp(-s / 20) * (Math.random() * 2 - 1);
    }
  }

  const crackSrc = _ctx.createBufferSource();
  crackSrc.buffer = popBuf;
  crackSrc.loop = true;

  const bandpass = _ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 3000;
  bandpass.Q.value = 1.5;

  const crackGain = _ctx.createGain();
  crackGain.gain.value = 0.03;

  crackSrc.connect(bandpass);
  bandpass.connect(crackGain);
  crackGain.connect(_masterGain);
  crackSrc.start();
  _ambientCrackSource = crackSrc;

  // ── Layer 3: random one-shot sounds ───────────────────────────────────────
  _scheduleRandomSounds();
}

// ─── Private: random ambient sound scheduler ─────────────────────────────────

/**
 * Schedules the next random one-shot dungeon sound (drip, thud, or wind gust)
 * at a random interval between 8 and 25 seconds.
 * Reschedules itself after each firing until stopAmbient() is called.
 */
function _scheduleRandomSounds() {
  if (!_ctx || !_masterGain) return;
  const delay = (8 + Math.random() * 17) * 1000; // 8–25 seconds
  _randomSoundTimer = setTimeout(() => {
    if (!_ambientSource) return; // ambient stopped — do not reschedule
    _playRandomAmbientSound(Math.floor(Math.random() * 3));
    _scheduleRandomSounds();
  }, delay);
}

/** Cancels the pending random-sound timer. */
function _stopRandomSounds() {
  if (_randomSoundTimer) {
    clearTimeout(_randomSoundTimer);
    _randomSoundTimer = null;
  }
}

/**
 * Dispatches to one of three short procedural dungeon sounds.
 * @param {0|1|2} pick  0 = stone drip, 1 = distant thud, 2 = brief wind gust
 */
function _playRandomAmbientSound(pick) {
  if (!_ctx || !_masterGain) return;
  const sounds = [_playStoneDrip, _playDistantThud, _playWindGust];
  sounds[pick]?.();
}

/**
 * Stone drip: short sine burst decaying quickly, ~180–220 Hz, ~0.4 s, gain ~0.12.
 */
function _playStoneDrip() {
  if (!_ctx || !_masterGain) return;
  const osc = _ctx.createOscillator();
  const env = _ctx.createGain();
  osc.frequency.value = 180 + Math.random() * 40;
  osc.type = 'sine';
  env.gain.setValueAtTime(0.12, _ctx.currentTime);
  env.gain.exponentialRampToValueAtTime(0.001, _ctx.currentTime + 0.4);
  osc.connect(env);
  env.connect(_masterGain);
  osc.start();
  osc.stop(_ctx.currentTime + 0.4);
}

/**
 * Distant thud: short burst of low-passed noise, ~60 Hz, ~0.3 s, gain ~0.08.
 */
function _playDistantThud() {
  if (!_ctx || !_masterGain) return;
  const bufSize = Math.floor(_ctx.sampleRate * 0.3);
  const thudBuf = _ctx.createBuffer(1, bufSize, _ctx.sampleRate);
  const d = thudBuf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.2));
  }
  const thudSrc = _ctx.createBufferSource();
  thudSrc.buffer = thudBuf;
  const lp = _ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 80;
  const g = _ctx.createGain();
  g.gain.value = 0.08;
  thudSrc.connect(lp);
  lp.connect(g);
  g.connect(_masterGain);
  thudSrc.start();
}

/**
 * Brief wind gust: short burst of high-passed noise, ~1200 Hz, ~1.2 s, gain ~0.04.
 */
function _playWindGust() {
  if (!_ctx || !_masterGain) return;
  const gustSize = Math.floor(_ctx.sampleRate * 1.2);
  const gustBuf = _ctx.createBuffer(1, gustSize, _ctx.sampleRate);
  const gd = gustBuf.getChannelData(0);
  for (let i = 0; i < gustSize; i++) {
    gd[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / gustSize);
  }
  const gustSrc = _ctx.createBufferSource();
  gustSrc.buffer = gustBuf;
  const hp = _ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1200;
  const gg = _ctx.createGain();
  gg.gain.value = 0.04;
  gustSrc.connect(hp);
  hp.connect(gg);
  gg.connect(_masterGain);
  gustSrc.start();
}
