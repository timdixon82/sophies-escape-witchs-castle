/**
 * Sophie's Escape — Intent bus (ADR 005)
 *
 * A minimal publish-subscribe channel for game intents.
 * Three input bridges (keyboard, mouse, touch) publish intents here.
 * Two consumers (FirstPersonController, OverlayController) subscribe.
 *
 * Intent event reference — documented here as the canonical list.
 *
 * Movement intents (held while active):
 *   MOVE_FORWARD      — W key, Up arrow, joystick forward
 *   MOVE_BACKWARD     — S key, Down arrow, joystick back
 *
 * Look intents (value-based — deltaX, deltaY in degrees or pixels):
 *   LOOK_LEFT         — A key, Left arrow, mouse/touch drag left
 *   LOOK_RIGHT        — D key, Right arrow, mouse/touch drag right
 *   LOOK_UP           — mouse/touch drag up
 *   LOOK_DOWN         — mouse/touch drag down
 *   LOOK_DELTA        — { dx, dy } from mouse/touch continuous movement
 *
 * Action intents (one-shot):
 *   INTERACT          — E key, Enter (on interactable), tap object
 *
 * Overlay intents (one-shot):
 *   TOGGLE_INVENTORY  — I key, inventory button
 *   TOGGLE_HINTS      — H key, hint button
 *   OPEN_PAUSE        — Escape key (when no overlay open), pause button
 *   CLOSE_OVERLAY     — Escape key (when overlay is open), close button
 *   NEXT_FOCUSABLE    — Tab key (when overlay open)
 *   PREV_FOCUSABLE    — Shift+Tab key (when overlay open)
 *   ACTIVATE_FOCUSED  — Enter/Space key (when overlay item focused)
 *   COMBINE_ITEMS     — Enter on Combine button
 */

/** @type {Map<string, Set<(payload: unknown) => void>>} */
const _listeners = new Map();

/**
 * Publishes an intent to all subscribers.
 * @param {string} intent
 * @param {unknown} [payload]
 */
export function emit(intent, payload) {
  const set = _listeners.get(intent);
  if (!set) return;
  for (const fn of set) {
    fn(payload);
  }
}

/**
 * Subscribes to a specific intent.
 * @param {string} intent
 * @param {(payload: unknown) => void} fn
 * @returns {() => void} unsubscribe
 */
export function on(intent, fn) {
  if (!_listeners.has(intent)) _listeners.set(intent, new Set());
  _listeners.get(intent).add(fn);
  return () => _listeners.get(intent)?.delete(fn);
}

/**
 * Subscribes to multiple intents with the same handler.
 * @param {string[]} intents
 * @param {(payload: unknown) => void} fn
 * @returns {() => void} unsubscribe all
 */
export function onMany(intents, fn) {
  const unsubs = intents.map((i) => on(i, fn));
  return () => unsubs.forEach((u) => u());
}
