# Work folder 042: SEWC minimum hitboxes on all items, door creak sound

**Status:** active
**Triage type:** Bug fix (type 6)
**Opened:** 2026-06-06

## Issue 1: Minimum pickup hitbox on all interactable items

Many items have very small raycaster targets (e.g. keys use a thin shaft cylinder, mushroom uses a thin stem, moonflower petal is a flat LatheGeometry disc). They are difficult to click or tap.

### Fix: modify `_addInteractable()` in `src/render/room-manager.js`

Add an invisible minimum-size hitbox child to every mesh registered through `_addInteractable`. The hitbox becomes the raycaster target instead of the raw mesh. Minimum hitbox size: 0.30 m on each axis (but not smaller than the geometry itself).

```js
function _addInteractable(mesh, id, label, type) {
  // Compute geometry size in local space
  mesh.geometry.computeBoundingBox();
  const bb = mesh.geometry.boundingBox;
  const size = new THREE.Vector3();
  bb.getSize(size);
  const hx = Math.max(size.x, 0.30);
  const hy = Math.max(size.y, 0.30);
  const hz = Math.max(size.z, 0.30);

  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(hx, hy, hz),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hitbox.userData = { interactable: true, id, label, type };
  mesh.add(hitbox); // hitbox lives in mesh's local space, centred at origin

  mesh.userData = { interactable: false }; // mesh itself not raycasted
  _interactables.push(hitbox);
  _roomObjects.push(mesh);
}
```

**Important:** the existing puzzle targets (cauldron, cabinet, chest, altar, telescope, cast button, gate pedestal) also go through `_addInteractable`. Their geometry is already large, so `Math.max(size, 0.30)` will just use the actual geometry size. No visual change for those.

**Note:** work folder 040 already adds a custom hitbox for `_makeItemBentSpoon` directly. That spoon-specific hitbox should be kept as-is; it does not go through `_addInteractable`. No conflict.

## Issue 2: Door creak sound when traversing a door

The current `_playDoor()` is 400 ms — a short click. Tim wants a longer door creak when the player actually goes through a door.

### Fix A — new `_playDoorCreak()` in `src/audio/audio-manager.js`

Add a new exported function `playDoorCreak()` (or add `'doorCreak'` as a named sound to the existing `play(soundName)` switch). A realistic slow creak: 1.6 s total, two overlapping sawtooth oscillators sweeping in opposite directions, filtered through a bandpass at ~250 Hz, Q 5, with a scraping noise layer underneath.

```js
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

  // Scraping noise: short burst filtered white noise
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
```

Add `'doorCreak'` to the `play()` switch: `case 'doorCreak': _playDoorCreak(); break;`

Update the JSDoc sound name list at the top of the file.

### Fix B — call `play('doorCreak')` on door traversal

In `src/render/interaction-handler.js`, find `_handleDoor` (the function that calls `enterRoom`). After `enterRoom(targetRoomId)` is called, call `import { play } from '../audio/audio-manager.js'` and `play('doorCreak')`. Keep the existing `play('door')` call for the click at the moment of interaction — the creak follows it to simulate the door opening as you pass through.

## Out of scope

- Room-specific door sounds
- Puzzle object hitbox size tuning (they are already large)

## Risk and rollback

Low. Targeted changes to `_addInteractable` and the audio manager. Rollback: revert.

## Definition of done

- All items registered via `_addInteractable` have a minimum 0.30 m hitbox
- Door creak plays (1.6 s) when the player traverses any door
- All existing tests pass
- Lint: 0 errors
- PR open on branch `fix/sewc-hitboxes-door-creak`

## Pre-approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than main
- [x] Open a pull request
- [x] Comment on a pull request or issue
- [x] Create an issue
