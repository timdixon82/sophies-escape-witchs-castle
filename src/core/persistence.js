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
 * @returns {Storage}
 */
export function getPersistence() {
  // Using localStorage as the default per ADR 004 (swap when Clarification 4 is resolved).
  return window.localStorage;
}
