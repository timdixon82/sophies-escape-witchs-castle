/**
 * Sophie's Escape — Audio manager stub (ADR 002)
 *
 * The ONLY file that will import from 'howler'.
 * In v0.1 this is a stub — no audio files are bundled because the
 * BBC Sound Effects Library licence path has not been confirmed
 * (Tad Decision 5 / FR-AUDIO-01, FR-AUDIO-02).
 *
 * All public methods are no-ops in v0.1 so the game runs silently.
 * The interface is defined so the rest of the game can call it
 * without any conditional guards; the audio layer just does nothing
 * until v0.2 when real files can be bundled.
 *
 * TODO(v0.2): Import Howler and populate the audio manifest once
 * Tim confirms the BBC Sound Effects Library licence (Decision 5).
 */

/** @type {number} */
// eslint-disable-next-line no-unused-vars -- stub state; read by Howl.volume() in v0.2 (TODO line 38)
let _masterVolume = 0.8;

/** @type {boolean} */
// eslint-disable-next-line no-unused-vars -- stub state; read by Howl.mute() in v0.2 (TODO line 47)
let _muted = false;

/**
 * Initialises the audio manager.
 * In v0.1 this is a no-op.
 */
export function initAudio() {
  // v0.1 stub — real init happens in v0.2 when howler is imported.
}

/**
 * Sets the master volume.
 * @param {number} volume — 0 to 1
 */
export function setMasterVolume(volume) {
  _masterVolume = Math.max(0, Math.min(1, volume));
  // TODO(v0.2): Howl.volume(_masterVolume)
}

/**
 * Toggles mute.
 * @param {boolean} muted
 */
export function setMuted(muted) {
  _muted = muted;
  // TODO(v0.2): Howl.mute(_muted)
}

/**
 * Plays a named event sound.
 * @param {string} _eventName — e.g. 'item-pickup', 'door-creak'
 */
export function playEventSound(_eventName) {
  // v0.1 stub.
}

/**
 * Sets the ambient loop for the current room.
 * @param {string} _roomId
 */
export function setRoomAmbient(_roomId) {
  // v0.1 stub.
}

/**
 * Stops the currently playing ambient loop.
 */
export function stopAmbient() {
  // v0.1 stub.
}
