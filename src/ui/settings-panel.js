/**
 * Sophie's Escape — Settings panel (Issue 4)
 *
 * Manages the "Show item labels" toggle and any future per-user settings.
 *
 * State contract:
 *   - Label visibility is persisted in localStorage under 'sewc-item-labels'.
 *   - Default is off (false) — labels are hidden until the player turns them on.
 *   - The preference is read on mount and applied immediately.
 *
 * Accessibility contracts:
 *   - The checkbox has an explicit <label> associated via for/id.
 *   - Focus management is handled by the shared overlay-controller.js.
 *   - The overlay itself is a <dialog role="dialog" aria-modal="true"> in HTML.
 */

const STORAGE_KEY = 'sewc-item-labels';

/** Whether item labels are currently visible. */
let _labelsVisible = false;

/**
 * Mounts the settings panel: reads the stored preference, applies it, and
 * wires the checkbox toggle. Call once after the DOM is ready.
 */
export function mountSettingsPanel() {
  // Read stored preference.
  _labelsVisible = _readStoredPref();

  // Apply the stored preference to the checkbox in the DOM (if already present).
  _syncCheckbox();

  // Wire the checkbox.
  const checkbox = document.getElementById('settings-item-labels-checkbox');
  if (checkbox) {
    checkbox.addEventListener('change', _onToggle);
  }
}

/**
 * Returns whether item labels should currently be visible.
 * Called by room-manager.js (via updateItemLabels) to decide visibility.
 * @returns {boolean}
 */
export function areItemLabelsVisible() {
  return _labelsVisible;
}

// ─── Private ─────────────────────────────────────────────────────────────────

function _readStoredPref() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    // localStorage may be unavailable in private browsing or restricted contexts.
    return false;
  }
}

function _savePref(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
  } catch {
    // Non-fatal if storage is unavailable.
  }
}

function _syncCheckbox() {
  const checkbox = /** @type {HTMLInputElement | null} */ (
    document.getElementById('settings-item-labels-checkbox')
  );
  if (checkbox) {
    checkbox.checked = _labelsVisible;
  }
}

function _onToggle(event) {
  _labelsVisible = /** @type {HTMLInputElement} */ (event.target).checked;
  _savePref(_labelsVisible);
  // The updateItemLabels loop in main.js reads areItemLabelsVisible() each frame,
  // so no explicit re-render call is needed here.
}
