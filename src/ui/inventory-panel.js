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

      const nameEl = document.createElement('span');
      nameEl.className = 'inventory-item-name';
      nameEl.textContent = _formatItemName(item.itemId);
      btn.appendChild(nameEl);

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
