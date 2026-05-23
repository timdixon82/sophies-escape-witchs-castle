/**
 * Sophie's Escape — Analytics (ADR 006)
 *
 * GoatCounter through the team's central endpoint.
 * count.js is self-hosted at public/scripts/goatcounter-count.js,
 * closing ICCC's Subresource Integrity gap.
 *
 * Three milestone events only (ADR 006):
 *   game-started   — player presses New Game
 *   room-entered   — first entry to each room (not re-entry)
 *   game-won       — escape cutscene triggered
 *
 * All errors are silently swallowed — analytics failure must never
 * affect gameplay.
 *
 * The GoatCounter endpoint is allow-listed in the CSP
 * connect-src directive (ADR 007).
 */

const ENDPOINT = 'https://timdixon82.goatcounter.com/count';

/**
 * Tracks the initial page view. Call once on first load.
 * The count.js script handles the page view when present.
 */
export function trackPageView() {
  _send({ p: window.location.pathname });
}

/**
 * Tracks a named milestone event.
 * @param {'game-started' | 'room-entered' | 'game-won'} eventName
 * @param {string} [detail] — optional room ID for room-entered
 */
export function trackEvent(eventName, detail) {
  const path = detail ? `/${eventName}/${detail}` : `/${eventName}`;
  _send({ p: path, t: eventName });
}

// ─── Private ─────────────────────────────────────────────────────────────────

function _send(params) {
  try {
    const url = new URL(ENDPOINT);
    url.searchParams.set('p', params.p);
    if (params.t) url.searchParams.set('t', params.t);

    // Use sendBeacon if available (fires even on page unload).
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(url.toString());
    } else {
      fetch(url.toString(), { method: 'GET', keepalive: true }).catch(() => {
        // Silently swallow network errors.
      });
    }
  } catch {
    // Silently swallow all analytics errors. Never throw into game loop.
  }
}
