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
    // Remove any existing item buttons.
    grid.querySelectorAll('.inventory-item-btn').forEach((el) => el.remove());
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
  // Remove buttons that no longer exist.
  const existingBtns = /** @type {NodeListOf<HTMLButtonElement>} */ (
    grid.querySelectorAll('.inventory-item-btn')
  );
  const currentIds = new Set(items.map((i) => i.itemId));
  existingBtns.forEach((btn) => {
    if (!currentIds.has(btn.dataset.itemId ?? '')) btn.remove();
  });

  // Add or update buttons.
  for (const item of items) {
    let btn = /** @type {HTMLButtonElement | null} */ (
      grid.querySelector(`[data-item-id="${item.itemId}"]`)
    );

    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'inventory-item-btn';
      btn.dataset.itemId = item.itemId;
      btn.addEventListener('click', () => _onItemClick(item.itemId));

      const nameEl = document.createElement('span');
      nameEl.className = 'inventory-item-name';
      nameEl.textContent = _formatItemName(item.itemId);
      btn.appendChild(nameEl);

      // Append in collection order (items are ordered by pickedUpAt in state).
      grid.appendChild(btn);
    }

    const isSelected = selected.includes(item.itemId);
    btn.setAttribute('aria-pressed', String(isSelected));
  }
}

function _onItemClick(itemId) {
  const state = getState();
  if (state.inventory.selectedItemIds.includes(itemId)) {
    dispatch({ type: 'DESELECT_ITEM', payload: { itemId } });
  } else {
    dispatch({ type: 'SELECT_ITEM', payload: { itemId } });
  }
}

function _onCombineClick() {
  const state = getState();
  const selected = state.inventory.selectedItemIds;
  if (selected.length < 2) return;

  // v0.1: no valid combinations exist yet. Always report invalid.
  // TODO(v0.2): implement combination rules per item-dependency graph (Clarification 3).
  _showFeedback('That combination did not work. Try something different.', 'error');
  dispatch({ type: 'CLEAR_SELECTION' });
}

/**
 * @param {string} message
 * @param {'error' | 'success'} type
 */
function _showFeedback(message, type) {
  const feedbackEl = document.getElementById('inventory-feedback');
  if (!feedbackEl) return;

  feedbackEl.textContent = message;
  feedbackEl.className = `inventory-feedback inventory-feedback--${type}`;

  // Clear after 4 seconds.
  setTimeout(() => {
    if (feedbackEl) {
      feedbackEl.textContent = '';
      feedbackEl.className = 'inventory-feedback';
    }
  }, 4000);
}

/**
 * Converts an itemId like 'rusty-key' to a readable label 'Rusty key'.
 * @param {string} itemId
 * @returns {string}
 */
function _formatItemName(itemId) {
  return itemId
    .split('-')
    .map((word, i) => (i === 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}
