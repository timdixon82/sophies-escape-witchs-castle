/**
 * Sophie's Escape — Speech Manager (Issue 5)
 *
 * Wraps window.speechSynthesis to provide controlled read-aloud.
 * Also updates the caption overlay (Issue 6) when captions are enabled.
 *
 * State is persisted in localStorage:
 *   sewc-speech   — boolean ('true'/'false')
 *   sewc-captions — boolean ('true'/'false')
 *
 * The module is intentionally browser-API-only. It has no dependency on the
 * Three.js render layer or the core state module, keeping the layer boundary clean.
 */

/** @type {boolean} */
let _speechEnabled = false;

/** @type {ReturnType<typeof setTimeout> | null} */
let _captionClearTimer = null;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Enables or disables speech synthesis.
 * @param {boolean} enabled
 */
export function setEnabled(enabled) {
  _speechEnabled = enabled;
  if (!enabled) cancel();
}

/**
 * Speaks the given text using the Web Speech API if speech is enabled.
 * Also updates the caption overlay if captions are enabled, regardless
 * of speech state (captions work independently).
 * Cancels any in-progress utterance before starting a new one.
 * @param {string} text
 */
export function speak(text) {
  if (!text) return;

  // Update captions regardless of speech toggle.
  if (_areCaptionsEnabled()) {
    _showCaption(text);
  }

  if (!_speechEnabled) return;

  if (!window.speechSynthesis) return;

  // Cancel any in-progress utterance to avoid queuing.
  cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.onend = () => {
    // Caption clears on speech end (unless already cleared by the 4-second timeout).
    if (_areCaptionsEnabled()) {
      _clearCaption();
    }
  };
  utterance.onerror = () => {
    if (_areCaptionsEnabled()) {
      _clearCaption();
    }
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Cancels any in-progress speech utterance.
 */
export function cancel() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// ─── Private: captions ────────────────────────────────────────────────────────

function _areCaptionsEnabled() {
  try {
    return localStorage.getItem('sewc-captions') === 'true';
  } catch {
    return false;
  }
}

/**
 * Shows text in the caption overlay and sets a 4-second auto-clear timer.
 * @param {string} text
 */
function _showCaption(text) {
  const overlay = document.getElementById('caption-overlay');
  if (!overlay) return;

  overlay.textContent = text;
  overlay.style.display = 'block';

  // Clear any pending auto-clear timer and restart it.
  if (_captionClearTimer !== null) {
    clearTimeout(_captionClearTimer);
  }
  _captionClearTimer = setTimeout(() => {
    _clearCaption();
    _captionClearTimer = null;
  }, 4000);
}

function _clearCaption() {
  const overlay = document.getElementById('caption-overlay');
  if (overlay) {
    overlay.textContent = '';
    overlay.style.display = 'none';
  }
  if (_captionClearTimer !== null) {
    clearTimeout(_captionClearTimer);
    _captionClearTimer = null;
  }
}
