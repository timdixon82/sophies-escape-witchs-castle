# Work folder 041: SEWC ambient audio — candle/fire atmosphere

**Status:** done
**Triage type:** Small feature (type 7)
**Opened:** 2026-06-06

## Summary

Replace the current pink-noise ambient loop with a more atmospheric candle/fire sound, keeping everything procedural using the Web Audio API (no binary audio files).

## Target sound

A warm dungeon ambient: low crackling fire with occasional sparse pops, like candles burning in a stone room. Two layers:

### Layer 1 — warm base rumble (brown noise)
Brown noise (1/f² spectrum) sits warmer and deeper than pink noise. Approximated by integrating white noise:

```js
let lastOut = 0;
for (let i = 0; i < bufSize; i++) {
  const w = Math.random() * 2 - 1;
  lastOut = (lastOut + (0.02 * w)) / 1.02;
  data[i] = lastOut * 3.5; // compensate for low amplitude
}
```

Pass through a low-pass filter (frequency ~600Hz, Q 0.7) to cut harsh high frequencies. Gain: ~0.06.

### Layer 2 — crackle pops
A short separate AudioBuffer of sparse random impulse pops that loops over ~4 seconds:

```js
// 4s buffer, mostly silence, with ~30 random pops
const popBuf = _ctx.createBuffer(1, _ctx.sampleRate * 4, _ctx.sampleRate);
const popData = popBuf.getChannelData(0);
for (let p = 0; p < 30; p++) {
  const t = Math.floor(Math.random() * popData.length);
  const amp = 0.15 + Math.random() * 0.25;
  const len = 80 + Math.floor(Math.random() * 120);
  for (let s = 0; s < len && t + s < popData.length; s++) {
    popData[t + s] = amp * Math.exp(-s / 20) * (Math.random() * 2 - 1);
  }
}
```

Pass through a band-pass filter (frequency ~3000Hz, Q 1.5) to give the pops a woody, natural crack. Gain: ~0.03.

## Implementation

In `src/audio/audio-manager.js`, replace the `_startAmbient()` function body with the two-layer approach above. Keep the same public API — `play('ambient')` starts it, `stopAmbient()` stops it.

Store references to both source nodes so `stopAmbient()` can stop both.

## Out of scope

- Room-specific audio (all rooms get the same ambient for now)
- Positional audio
- Music

## Risk and rollback

Low. Replaces only the `_startAmbient()` function body. Rollback: revert.

## Definition of done

- Ambient plays as a warm crackle/fire sound instead of pink noise
- Sound starts correctly on first user interaction
- stopAmbient() stops both layers cleanly
- All existing tests pass
- Lint: 0 errors
- PR open on branch `feat/sewc-ambient-audio`

## Pre-approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than main
- [x] Open a pull request
- [x] Comment on a pull request or issue
- [x] Create an issue
