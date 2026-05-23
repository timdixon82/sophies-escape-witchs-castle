/**
 * Sophie's Escape — Persistence backend (ADR 004)
 *
 * The storage location is one swappable line.
 * Pending Tim's answer on Tad Clarification 4 (session scope):
 *   - sessionStorage: save survives page reload, gone when tab closes.
 *   - localStorage: save survives tab close and browser restart.
 *
 * TODO(clarification-4): Switch to sessionStorage when Tim confirms
 * "session" means browser-tab lifetime rather than browser-window lifetime.
 *
 * No browser APIs beyond storage are used. Worker-safe.
 */

/**
 * Returns the configured storage backend.
 *
 * iOS Safari Private Browsing note: accessing window.localStorage in Private
 * Browsing does not throw on access (unlike older iOS), but setItem() throws
 * with a QuotaExceededError. The callers (loadFromStorage, saveToStorage in
 * state.js) already wrap all storage calls in try/catch, so that is handled.
 * This function is kept simple and does not throw; it always returns a Storage
 * object or a no-op fallback if localStorage is genuinely unavailable.
 *
 * @returns {Storage}
 */
export function getPersistence() {
  // Using localStorage as the default per ADR 004 (swap when Clarification 4 is resolved).
  try {
    // Probe: accessing localStorage can throw in some embedded WebView contexts.
    const storage = window.localStorage;
    if (storage) return storage;
  } catch {
    // Fall through to the in-memory no-op fallback.
  }
  // In-memory no-op fallback. Game runs without persistence in this case.
  return _noopStorage();
}

/**
 * Returns a no-op Storage-compatible object for environments where
 * localStorage is not available (some iOS WebView configurations).
 * @returns {Storage}
 */
function _noopStorage() {
  /** @type {Record<string, string>} */
  const _store = {};
  return {
    get length() { return Object.keys(_store).length; },
    key(n) { return Object.keys(_store)[n] ?? null; },
    getItem(k) { return Object.prototype.hasOwnProperty.call(_store, k) ? _store[k] : null; },
    setItem(k, v) { _store[k] = String(v); },
    removeItem(k) { delete _store[k]; },
    clear() { for (const k of Object.keys(_store)) delete _store[k]; },
  };
}
