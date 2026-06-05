/**
 * Sophie's Escape — Settings panel
 *
 * Manages user preferences for:
 *   - Show item labels (checkbox)       localStorage: sewc-item-labels
 *   - Brightness (slider 0.2–2.0)       localStorage: sewc-brightness
 *   - Volume (slider 0–100)             localStorage: sewc-volume
 *   - Read aloud / speech (checkbox)    localStorage: sewc-speech
 *   - Show captions (checkbox)          localStorage: sewc-captions
 *
 * Accessibility contracts:
 *   - All controls have explicit <label> elements via for/id in index.html.
 *   - Focus management is handled by the shared overlay-controller.js.
 *   - The overlay itself is a <dialog role="dialog" aria-modal="true">.
 *
 * Brightness changes are forwarded immediately to room-manager.js via
 * applyBrightness(). Volume changes are forwarded to audio-manager.js via
 * setVolume(). Speech and captions changes are forwarded to speech-manager.js.
 */

import { applyBrightness } from '../render/room-manager.js';
import { setVolume } from '../audio/audio-manager.js';
import { setEnabled as setSpeechEnabled } from './speech-manager.js';

const STORAGE_LABELS   = 'sewc-item-labels';
const STORAGE_BRIGHTNESS = 'sewc-brightness';
const STORAGE_VOLUME   = 'sewc-volume';
const STORAGE_SPEECH   = 'sewc-speech';
const STORAGE_CAPTIONS = 'sewc-captions';

/** Whether item labels are currently visible. */
let _labelsVisible = false;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Mounts the settings panel: reads stored preferences, applies them,
 * and wires all controls. Call once after the DOM is ready.
 */
export function mountSettingsPanel() {
  // Labels toggle.
  _labelsVisible = _readBool(STORAGE_LABELS, false);
  _syncCheckbox('settings-item-labels-checkbox', _labelsVisible);
  _wire('settings-item-labels-checkbox', 'change', _onLabelsToggle);

  // Brightness slider.
  const brightness = _readFloat(STORAGE_BRIGHTNESS, 0.8, 0.2, 2.0);
  _syncSlider('settings-brightness-slider', brightness);
  _syncOutput('settings-brightness-output', brightness.toFixed(1));
  applyBrightness(brightness);
  _wire('settings-brightness-slider', 'input', _onBrightnessChange);

  // Volume slider.
  const volume = _readFloat(STORAGE_VOLUME, 70, 0, 100);
  _syncSlider('settings-volume-slider', volume);
  _syncOutput('settings-volume-output', Math.round(volume).toString());
  setVolume(volume / 100);
  _wire('settings-volume-slider', 'input', _onVolumeChange);

  // Speech toggle.
  const speechOn = _readBool(STORAGE_SPEECH, false);
  _syncCheckbox('settings-speech-checkbox', speechOn);
  setSpeechEnabled(speechOn);
  _wire('settings-speech-checkbox', 'change', _onSpeechToggle);

  // Captions toggle.
  const captionsOn = _readBool(STORAGE_CAPTIONS, false);
  _syncCheckbox('settings-captions-checkbox', captionsOn);
  _wire('settings-captions-checkbox', 'change', _onCaptionsToggle);
}

/**
 * Returns whether item labels should currently be visible.
 * Called by room-manager.js (via updateItemLabels) each frame.
 * @returns {boolean}
 */
export function areItemLabelsVisible() {
  return _labelsVisible;
}

// ─── Private: event handlers ──────────────────────────────────────────────────

function _onLabelsToggle(event) {
  _labelsVisible = /** @type {HTMLInputElement} */ (event.target).checked;
  _savePref(STORAGE_LABELS, _labelsVisible ? 'true' : 'false');
}

function _onBrightnessChange(event) {
  const value = parseFloat(/** @type {HTMLInputElement} */ (event.target).value);
  _savePref(STORAGE_BRIGHTNESS, value.toString());
  _syncOutput('settings-brightness-output', value.toFixed(1));
  applyBrightness(value);
}

function _onVolumeChange(event) {
  const raw = parseFloat(/** @type {HTMLInputElement} */ (event.target).value);
  const rounded = Math.round(raw);
  _savePref(STORAGE_VOLUME, rounded.toString());
  _syncOutput('settings-volume-output', rounded.toString());
  setVolume(raw / 100);
}

function _onSpeechToggle(event) {
  const enabled = /** @type {HTMLInputElement} */ (event.target).checked;
  _savePref(STORAGE_SPEECH, enabled ? 'true' : 'false');
  setSpeechEnabled(enabled);
}

function _onCaptionsToggle(event) {
  const enabled = /** @type {HTMLInputElement} */ (event.target).checked;
  _savePref(STORAGE_CAPTIONS, enabled ? 'true' : 'false');
  // If captions turned off, clear any visible caption immediately.
  if (!enabled) {
    const overlay = document.getElementById('caption-overlay');
    if (overlay) {
      overlay.textContent = '';
      overlay.style.display = 'none';
    }
  }
}

// ─── Private: DOM helpers ─────────────────────────────────────────────────────

function _wire(id, event, handler) {
  document.getElementById(id)?.addEventListener(event, handler);
}

function _syncCheckbox(id, value) {
  const el = /** @type {HTMLInputElement | null} */ (document.getElementById(id));
  if (el) el.checked = value;
}

function _syncSlider(id, value) {
  const el = /** @type {HTMLInputElement | null} */ (document.getElementById(id));
  if (el) el.value = value.toString();
}

function _syncOutput(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ─── Private: storage helpers ─────────────────────────────────────────────────

function _readBool(key, defaultValue) {
  try {
    const v = localStorage.getItem(key);
    if (v !== null) return v === 'true';
  } catch { /* unavailable */ }
  return defaultValue;
}

function _readFloat(key, defaultValue, min, max) {
  try {
    const v = localStorage.getItem(key);
    if (v !== null) {
      const n = parseFloat(v);
      if (!isNaN(n)) return Math.max(min, Math.min(max, n));
    }
  } catch { /* unavailable */ }
  return defaultValue;
}

function _savePref(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch { /* Non-fatal */ }
}
