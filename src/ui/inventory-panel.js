/**
 * Sophie's Escape — Inventory panel UI (ADR 002, FR-INV-01 to FR-INV-04)
 *
 * Renders the inventory grid and handles item selection and combining.
 * Subscribes to state changes and updates the DOM.
 *
 * Accessibility:
 *   - Item cards are <button> with aria-pressed for selection state.
 *   - Combine button uses disabled attribute (not just aria-disabled).
 *   - Results and errors announced via aria-live="polite" region.
 *   - Empty inventory: text fallback visible to screen readers.
 */

import { getState, subscribe, dispatch } from '../core/state.js';
import { ITEMS, ITEM_COMBINATIONS } from '../assets/room-data.js';

/**
 * Updates the selected-item HUD indicator (Issue 3).
 * @param {string | null} itemId
 */
function _updateSelectedItemHud(itemId) {
  const hud = document.getElementById('selected-item-hud');
  if (!hud) return;
  if (itemId) {
    const label = ITEMS[itemId]?.label ?? itemId;
    hud.textContent = `Using: ${label}`;
    hud.hidden = false;
  } else {
    hud.textContent = '';
    hud.hidden = true;
  }
}

/** @type {(() => void) | null} */
let _unsubscribe = null;

/**
 * Mounts the inventory panel listeners and subscribes to state.
 */
export function mountInventoryPanel() {
  // Button listeners.
  document.getElementById('btn-combine')?.addEventListener('click', _onCombineClick);

  // Subscribe to state changes.
  _unsubscribe = subscribe((state, prev) => {
    const inventoryChanged =
      state.inventory !== prev.inventory;
    if (inventoryChanged) _render(state);
  });

  // Initial render.
  _render(getState());
}

/**
 * Unmounts the inventory panel.
 */
export function unmountInventoryPanel() {
  if (_unsubscribe) {
    _unsubscribe();
    _unsubscribe = null;
  }
}

// ─── Private ─────────────────────────────────────────────────────────────────

function _render(state) {
  const grid = document.getElementById('inventory-grid');
  const emptyMsg = document.getElementById('inventory-empty-msg');
  const combineBtn = document.getElementById('btn-combine');

  if (!grid) return;

  const items = state.inventory.items.filter((i) => !i.consumed);
  const selected = state.inventory.selectedItemIds;

  if (items.length === 0) {
    if (emptyMsg) emptyMsg.hidden = false;
    // Remove any existing item list rows.
    grid.querySelectorAll('li').forEach((li) => li.remove());
  } else {
    if (emptyMsg) emptyMsg.hidden = true;
    _renderItems(grid, items, selected);
  }

  // Combine button is enabled when two or more items are selected.
  if (combineBtn) {
    combineBtn.disabled = selected.length < 2;
  }
}

/**
 * @param {HTMLElement} grid
 * @param {import('../core/state.js').InventoryItem[]} items
 * @param {string[]} selected
 */
function _renderItems(grid, items, selected) {
  // Remove <li> wrappers whose item is no longer in the inventory.
  const existingBtns = /** @type {NodeListOf<HTMLButtonElement>} */ (
    grid.querySelectorAll('.item-btn')
  );
  const currentIds = new Set(items.map((i) => i.itemId));
  existingBtns.forEach((btn) => {
    if (!currentIds.has(btn.dataset.itemId ?? '')) {
      // Remove the parent <li>, else the button itself.
      const wrapper = btn.closest('li');
      (wrapper ?? btn).remove();
    }
  });

  // Add or update buttons.
  for (const item of items) {
    let btn = /** @type {HTMLButtonElement | null} */ (
      grid.querySelector(`[data-item-id="${item.itemId}"]`)
    );

    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'item-btn';
      btn.dataset.itemId = item.itemId;
      btn.addEventListener('click', () => _onItemClick(item.itemId));

      // SVG icon (48×48, decorative — aria-hidden on the wrapper).
      // Security note: getItemIcon() returns only hardcoded SVG strings from a
      // static lookup table. No user-supplied data is ever interpolated into the
      // returned string, so innerHTML is safe here (OWASP A03 — no injection vector).
      const iconEl = document.createElement('div');
      iconEl.className = 'item-icon';
      iconEl.setAttribute('aria-hidden', 'true');
      iconEl.innerHTML = getItemIcon(item.itemId); // safe: hardcoded SVG only
      btn.appendChild(iconEl);

      // Name + description block.
      const infoEl = document.createElement('div');
      infoEl.className = 'item-info';

      const nameEl = document.createElement('strong');
      nameEl.className = 'item-name';
      nameEl.textContent = ITEMS[item.itemId]?.label ?? _formatItemName(item.itemId);
      infoEl.appendChild(nameEl);

      const descEl = document.createElement('p');
      descEl.className = 'item-desc';
      descEl.textContent = ITEMS[item.itemId]?.description ?? '';
      infoEl.appendChild(descEl);

      btn.appendChild(infoEl);

      // Wrap in a <li> so the native ul/li list relationship is valid
      // (WCAG 1.3.1, 4.1.2).
      const listItem = document.createElement('li');
      listItem.appendChild(btn);

      // Append in collection order (items are ordered by pickedUpAt in state).
      grid.appendChild(listItem);
    }

    const isSelected = selected.includes(item.itemId);
    btn.setAttribute('aria-pressed', String(isSelected));
  }
}

// ─── SVG icon helpers ─────────────────────────────────────────────────────────

/**
 * Returns an inline SVG string for the given item ID.
 * Each SVG is 48×48 with aria-hidden and focusable="false" set on the root
 * element so screen readers skip the decorative graphic.
 * @param {string} itemId
 * @returns {string}
 */
function getItemIcon(itemId) {
  const icons = {
    'bent-spoon': `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
      <ellipse cx="24" cy="10" rx="8" ry="5" fill="#a8a8a8"/>
      <rect x="22" y="14" width="4" height="22" rx="2" fill="#a8a8a8" transform="rotate(5 24 24)"/>
    </svg>`,

    'candle-stub': `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
      <rect x="18" y="22" width="12" height="18" rx="2" fill="#f0ead8"/>
      <ellipse cx="24" cy="19" rx="5" ry="7" fill="#ffa040"/>
    </svg>`,

    'moonflower-petal': `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
      <ellipse cx="24" cy="24" rx="10" ry="16" fill="#e8eeff" transform="rotate(-20 24 24)"/>
    </svg>`,

    'oil-soaked-rag': `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
      <rect x="8" y="16" width="32" height="16" rx="6" fill="#8b6914"/>
      <rect x="10" y="18" width="28" height="12" rx="4" fill="#6b4a08" opacity="0.5"/>
    </svg>`,

    'pinch-of-salt': `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
      <rect x="16" y="16" width="16" height="16" rx="3" fill="#e0e0e0"/>
      <circle cx="20" cy="20" r="2" fill="#fff"/>
      <circle cx="26" cy="22" r="1.5" fill="#fff"/>
      <circle cx="22" cy="27" r="1.5" fill="#fff"/>
    </svg>`,

    'dried-mushroom': `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
      <ellipse cx="24" cy="22" rx="14" ry="8" fill="#8b5e3c"/>
      <rect x="20" y="22" width="8" height="12" rx="2" fill="#a0724a"/>
    </svg>`,

    'small-iron-key': `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
      <circle cx="16" cy="20" r="7" fill="none" stroke="#606060" stroke-width="3"/>
      <rect x="22" y="18" width="18" height="4" rx="1" fill="#606060"/>
      <rect x="36" y="22" width="4" height="5" rx="1" fill="#606060"/>
      <rect x="30" y="22" width="4" height="4" rx="1" fill="#606060"/>
    </svg>`,

    'symbol-order-scroll': `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
      <rect x="10" y="12" width="28" height="24" rx="4" fill="#d4b483"/>
      <rect x="14" y="18" width="20" height="2" rx="1" fill="#8b6914" opacity="0.6"/>
      <rect x="14" y="23" width="16" height="2" rx="1" fill="#8b6914" opacity="0.6"/>
      <rect x="14" y="28" width="18" height="2" rx="1" fill="#8b6914" opacity="0.6"/>
    </svg>`,

    'torn-spell-book-page': `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
      <path d="M10,10 L36,10 L34,14 L38,18 L32,22 L36,26 L38,38 L10,38 Z" fill="#d4b483"/>
      <rect x="14" y="16" width="14" height="2" rx="1" fill="#8b6914" opacity="0.6"/>
      <rect x="14" y="21" width="10" height="2" rx="1" fill="#8b6914" opacity="0.6"/>
    </svg>`,

    'armoury-chest-key': `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
      <circle cx="14" cy="20" r="8" fill="none" stroke="#7a6030" stroke-width="3"/>
      <rect x="21" y="17" width="20" height="5" rx="1" fill="#7a6030"/>
      <rect x="37" y="22" width="4" height="6" rx="1" fill="#7a6030"/>
      <rect x="31" y="22" width="4" height="5" rx="1" fill="#7a6030"/>
    </svg>`,

    'portrait-clue': `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
      <rect x="8" y="8" width="32" height="32" rx="2" fill="#8b4513"/>
      <rect x="12" y="12" width="24" height="24" rx="1" fill="#c8a060"/>
    </svg>`,

    'chapel-sigil': `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="16" fill="none" stroke="#9060a0" stroke-width="3"/>
      <line x1="24" y1="10" x2="24" y2="38" stroke="#9060a0" stroke-width="2.5"/>
      <line x1="14" y1="24" x2="34" y2="24" stroke="#9060a0" stroke-width="2.5"/>
    </svg>`,

    'iron-gate-key': `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
      <circle cx="13" cy="18" r="9" fill="none" stroke="#404040" stroke-width="4"/>
      <rect x="20" y="14" width="22" height="6" rx="1" fill="#404040"/>
      <rect x="38" y="20" width="4" height="7" rx="1" fill="#404040"/>
      <rect x="32" y="20" width="4" height="6" rx="1" fill="#404040"/>
    </svg>`,

    'brass-star-chart': `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="17" fill="none" stroke="#c8a020" stroke-width="2"/>
      <polygon points="24,8 27,20 39,20 29,27 33,39 24,32 15,39 19,27 9,20 21,20" fill="#c8a020"/>
    </svg>`,

    'lit-torch': `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
      <rect x="21" y="24" width="6" height="18" rx="2" fill="#8b5e3c"/>
      <ellipse cx="24" cy="18" rx="6" ry="9" fill="#ffa040"/>
    </svg>`,

    'charged-binding-crystal': `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
      <polygon points="24,6 38,24 24,42 10,24" fill="#60c0ff"/>
      <polygon points="24,12 34,24 24,36 14,24" fill="#a0e0ff" opacity="0.6"/>
    </svg>`,
  };

  return icons[itemId] ?? `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
    <circle cx="24" cy="24" r="16" fill="#888888"/>
  </svg>`;
}

function _onItemClick(itemId) {
  const state = getState();
  if (state.inventory.selectedItemIds.includes(itemId)) {
    dispatch({ type: 'DESELECT_ITEM', payload: { itemId } });
    // If this was the primary (first) selected item, clear the HUD.
    if (state.inventory.selectedItemIds[0] === itemId) {
      _updateSelectedItemHud(null);
    }
  } else {
    dispatch({ type: 'SELECT_ITEM', payload: { itemId } });
    // Update HUD to show the newly selected item (first selected item is the "using" item).
    const newState = getState();
    _updateSelectedItemHud(newState.inventory.selectedItemIds[0] ?? null);
  }
}

function _onCombineClick() {
  const state = getState();
  const selected = state.inventory.selectedItemIds;
  if (selected.length < 2) return;

  // v0.2: look up the combination in the combination table.
  const sortedPair = [...selected].sort();
  const combo = ITEM_COMBINATIONS.find(
    (c) => c.inputs[0] === sortedPair[0] && c.inputs[1] === sortedPair[1]
  );

  if (!combo) {
    _showFeedback('That combination did not work. Try something different.', 'error');
    dispatch({ type: 'CLEAR_SELECTION' });
    return;
  }

  dispatch({ type: 'COMBINE_ITEMS', payload: { itemIds: selected } });

  const outputLabel = ITEMS[combo.output]?.label ?? combo.output;
  _showFeedback(`Combined! You made: ${outputLabel}.`, 'success');
}

/**
 * @param {string} message
 * @param {'error' | 'success'} type
 */
function _showFeedback(message, type) {
  const feedbackEl = document.getElementById('inventory-feedback');
  if (!feedbackEl) return;

  feedbackEl.textContent = message;
  feedbackEl.className = `inventory-feedback inventory-feedback-${type}`;

  // Clear after 4 seconds.
  setTimeout(() => {
    if (feedbackEl) {
      feedbackEl.textContent = '';
      feedbackEl.className = 'inventory-feedback';
    }
  }, 4000);
}

/**
 * Returns the display label for an item.
 * Uses ITEMS data if available; falls back to splitting the id.
 * @param {string} itemId
 * @returns {string}
 */
function _formatItemName(itemId) {
  if (ITEMS[itemId]?.label) return ITEMS[itemId].label;
  return itemId
    .split('-')
    .map((word, i) => (i === 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}
