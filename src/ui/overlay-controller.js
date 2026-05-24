/**
 * Sophie's Escape — Overlay controller (ADR 002, ADR 005)
 *
 * Handles opening, closing, and focus-trapping of all overlay dialogs.
 * Consumes TOGGLE_INVENTORY, TOGGLE_HINTS, OPEN_PAUSE, CLOSE_OVERLAY
 * intents from the intent bus.
 *
 * Accessibility contracts (WCAG 2.2 AAA, S-12 regression check):
 *   - On open: focus moves into the dialog.
 *   - On close: focus returns to the element that triggered the open.
 *   - Focus trapped inside dialog while open (Tab wraps).
 *   - Escape closes the topmost open overlay.
 *   - role="dialog" aria-modal="true" on all overlays (set in HTML).
 *
 * Screen-reader contract:
 *   - aria-expanded on HUD buttons reflects open/closed state.
 *   - OVERLAY_OPENED / OVERLAY_CLOSED dispatched to core state.
 */

import { on } from '../render/input/intent-bus.js';
import { dispatch, getState } from '../core/state.js';

/** Stack of currently open overlay IDs (topmost last). */
const _openStack = [];

/** Map from overlayId → the element that was focused before the overlay opened. */
const _returnFocusMap = new Map();

/** @type {(() => void)[]} — cleanup functions */
const _unsubs = [];

/**
 * Installs the overlay controller. Call once on game init.
 */
export function installOverlayController() {
  _unsubs.push(on('TOGGLE_INVENTORY', () => _toggle('overlay-inventory', 'hud-inventory-btn')));
  _unsubs.push(on('TOGGLE_HINTS', () => _toggle('overlay-hint', 'hud-hint-btn')));
  _unsubs.push(on('OPEN_PAUSE', () => _open('overlay-pause', 'hud-pause-btn')));
  _unsubs.push(on('CLOSE_OVERLAY', () => _closeTop()));

  // Focus trap: NEXT_FOCUSABLE / PREV_FOCUSABLE (WCAG 2.1.2).
  // Required when showModal()'s native focus trap is unavailable
  // (iOS Safari 15.3 and below, or attribute-open fallback).
  _unsubs.push(on('NEXT_FOCUSABLE', () => _moveFocusByStep(1)));
  _unsubs.push(on('PREV_FOCUSABLE', () => _moveFocusByStep(-1)));

  // Close button clicks (data-overlay-close attribute on buttons in HTML).
  document.addEventListener('click', (e) => {
    const btn = /** @type {HTMLElement} */ (e.target)?.closest('[data-overlay-close]');
    if (btn) {
      const overlayId = btn.getAttribute('data-overlay-close');
      if (overlayId) _close(overlayId);
    }
  });

  // Pause screen Resume button.
  document.getElementById('btn-resume')?.addEventListener('click', () => {
    _close('overlay-pause');
    dispatch({ type: 'RESUME' });
  });

  // Pause screen Quit to Menu button.
  document.getElementById('btn-quit-to-menu')?.addEventListener('click', () => {
    _closeAll();
    dispatch({ type: 'PAUSE' }); // keep state paused while at main menu
    _showMainMenu();
  });

  // Pause screen Hint button.
  document.getElementById('btn-pause-hint')?.addEventListener('click', () => {
    _close('overlay-pause');
    _open('overlay-hint', 'hud-hint-btn');
  });

  // HUD button click listeners (complement the keyboard intent path).
  document.getElementById('hud-inventory-btn')?.addEventListener('click', () => {
    _toggle('overlay-inventory', 'hud-inventory-btn');
  });
  document.getElementById('hud-hint-btn')?.addEventListener('click', () => {
    _toggle('overlay-hint', 'hud-hint-btn');
  });
  document.getElementById('hud-pause-btn')?.addEventListener('click', () => {
    _open('overlay-pause', 'hud-pause-btn');
  });
}

/**
 * Disposes overlay controller listeners.
 */
export function disposeOverlayController() {
  for (const u of _unsubs) u();
  _unsubs.length = 0;
}

/**
 * Opens the main-menu overlay. Called by game init.
 */
export function showMainMenu() {
  _showMainMenu();
}

// ─── Private ─────────────────────────────────────────────────────────────────

function _showMainMenu() {
  // Hide HUD and canvas; show main menu.
  _setHudVisible(false);
  _setCanvasVisible(false);
  _open('overlay-main-menu', null);
}

function _open(overlayId, triggerElementId) {
  if (_openStack.includes(overlayId)) return;

  const dialog = /** @type {HTMLDialogElement | null} */ (
    document.getElementById(overlayId)
  );
  if (!dialog) return;

  // Store the element to return focus to on close.
  const trigger = triggerElementId
    ? document.getElementById(triggerElementId)
    : null;
  _returnFocusMap.set(overlayId, trigger ?? document.activeElement);

  // Update HUD button aria-expanded if this is an inventory-like overlay.
  if (triggerElementId) {
    const triggerEl = document.getElementById(triggerElementId);
    if (triggerEl) triggerEl.setAttribute('aria-expanded', 'true');
  }

  // Open the dialog.
  // Guard showModal(): it is not available on iOS Safari 15.3 and below.
  // On those browsers, fall back to the attribute-based open pattern.
  if (!dialog.open) {
    if (typeof dialog.showModal === 'function') {
      try {
        dialog.showModal();
      } catch (err) {
        // showModal can throw if the element is not connected or is already
        // in the top layer. Fall through to the attribute fallback.
        dialog.setAttribute('open', '');
      }
    } else {
      // Fallback for browsers without native <dialog> support.
      dialog.setAttribute('open', '');
      dialog.style.display = '';
    }
  }

  // Intercept the browser's native cancel event (fired by showModal() on
  // Escape) so the keyboard bridge remains the sole close path. Without this,
  // the dialog closes before _close() removes it from _openStack, which
  // desynchronises overlay state (implementation defect, Fix 5).
  dialog.addEventListener('cancel', (e) => e.preventDefault(), { once: false });

  _openStack.push(overlayId);

  // Move focus inside the overlay.
  _moveFocusInto(dialog);

  // Notify core state.
  dispatch({ type: 'OVERLAY_OPENED', payload: { overlayName: overlayId } });
}

function _close(overlayId) {
  const dialog = /** @type {HTMLDialogElement | null} */ (
    document.getElementById(overlayId)
  );
  if (!dialog || !dialog.open) return;

  // Guard dialog.close() the same way as showModal().
  if (typeof dialog.close === 'function') {
    try {
      dialog.close();
    } catch {
      dialog.removeAttribute('open');
      dialog.style.display = 'none';
    }
  } else {
    dialog.removeAttribute('open');
    dialog.style.display = 'none';
  }
  const idx = _openStack.indexOf(overlayId);
  if (idx !== -1) _openStack.splice(idx, 1);

  // Restore focus.
  const returnEl = _returnFocusMap.get(overlayId);
  _returnFocusMap.delete(overlayId);
  if (returnEl && typeof returnEl.focus === 'function') {
    returnEl.focus();
  }

  // Update HUD button aria-expanded.
  const triggerMap = {
    'overlay-inventory': 'hud-inventory-btn',
    'overlay-hint': 'hud-hint-btn',
    'overlay-pause': 'hud-pause-btn',
  };
  const triggerElId = triggerMap[overlayId];
  if (triggerElId) {
    const el = document.getElementById(triggerElId);
    if (el) el.setAttribute('aria-expanded', 'false');
  }

  // Notify core state.
  dispatch({ type: 'OVERLAY_CLOSED', payload: { overlayName: overlayId } });
}

function _closeTop() {
  if (_openStack.length === 0) return;
  _close(_openStack[_openStack.length - 1]);
}

function _closeAll() {
  for (const id of [..._openStack]) _close(id);
}

function _toggle(overlayId, triggerElementId) {
  const dialog = document.getElementById(overlayId);
  if (dialog?.open) {
    _close(overlayId);
  } else {
    _open(overlayId, triggerElementId);
  }
}

/**
 * Advances focus by `step` (+1 or -1) within the topmost open dialog,
 * wrapping at the boundaries. Used for manual focus trapping when the
 * browser's native showModal() trap is not in effect.
 * @param {number} step  +1 for forward (Tab), -1 for backward (Shift+Tab)
 */
function _moveFocusByStep(step) {
  if (_openStack.length === 0) return;
  const topId = _openStack[_openStack.length - 1];
  const dialog = document.getElementById(topId);
  if (!dialog) return;

  const focusable = _getFocusableElements(dialog);
  if (focusable.length === 0) return;

  const current = document.activeElement;
  const idx = focusable.indexOf(/** @type {HTMLElement} */ (current));
  let next;
  if (idx === -1) {
    // Focus is not inside the dialog — move to first or last.
    next = step > 0 ? focusable[0] : focusable[focusable.length - 1];
  } else {
    next = focusable[(idx + step + focusable.length) % focusable.length];
  }
  next.focus();
}

/**
 * Moves focus to the first focusable element inside the dialog.
 * @param {HTMLElement} container
 */
function _moveFocusInto(container) {
  const focusable = _getFocusableElements(container);
  if (focusable.length > 0) {
    focusable[0].focus();
  } else {
    // Fallback: focus the container itself if it has tabindex.
    if (container.tabIndex >= 0) container.focus();
  }
}

/**
 * Returns all focusable elements inside a container, in DOM order.
 * @param {HTMLElement} container
 * @returns {HTMLElement[]}
 */
function _getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
    )
  ).filter((el) => !el.closest('[aria-hidden="true"]'));
}

function _setHudVisible(visible) {
  const hud = document.getElementById('hud');
  if (hud) {
    hud.hidden = !visible;
  }
}

function _setCanvasVisible(visible) {
  const canvas = document.getElementById('game-canvas');
  if (canvas) {
    canvas.hidden = !visible;
  }
}
