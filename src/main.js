/**
 * Sophie's Escape: The Witch's Castle — main.js (ADR 002)
 *
 * The single orchestration entry point. Wires all layers together.
 * Holds the top-level game loop, load order, and event bus wiring.
 * Carries no game logic of its own.
 *
 * Layer dependency order (strict, per ADR 002):
 *   src/core/   ← pure logic, no browser APIs
 *   src/assets/ ← static data
 *   src/render/ ← Three.js, input bridges
 *   src/ui/     ← HTML overlays
 *   src/audio/  ← Howler.js stub
 *   src/analytics/ ← GoatCounter
 */

import { dispatch, subscribe, loadFromStorage, getState } from './core/state.js';
import { shouldFireWitchEncounter } from './core/reducer.js';

import { initEngine, startLoop, getCamera } from './render/engine.js';
import { initFirstPersonController, updateFirstPersonController } from './render/first-person-controller.js';
import { installKeyboardBridge } from './render/input/keyboard-bridge.js';
import { installMouseBridge } from './render/input/mouse-bridge.js';
import { installTouchBridge } from './render/input/touch-bridge.js';

import { installOverlayController, showMainMenu } from './ui/overlay-controller.js';
import { mountInventoryPanel } from './ui/inventory-panel.js';
import { mountHintPanel } from './ui/hint-panel.js';

import { initAudio, setMasterVolume } from './audio/audio-manager.js';
import { trackPageView, trackEvent } from './analytics/analytics.js';
import { ROOM_DESCRIPTIONS } from './assets/room-data.js';

// ─── Boot sequence ────────────────────────────────────────────────────────────

async function boot() {
  // 1. Show loading bar at 10%.
  _setLoadingProgress(10, 'Initialising engine...');

  // 2. Resolve the canvas.
  const canvas = /** @type {HTMLCanvasElement} */ (
    document.getElementById('game-canvas')
  );

  // 3. Initialise the 3D engine.
  initEngine(canvas);
  _setLoadingProgress(40, 'Engine ready.');

  // 4. Initialise audio (stub in v0.1).
  initAudio();
  _setLoadingProgress(50, 'Audio ready.');

  // 5. Install input bridges.
  installKeyboardBridge();
  installMouseBridge(canvas);
  const joystickBase = /** @type {HTMLElement} */ (document.getElementById('touch-joystick-base'));
  const joystickKnob = /** @type {HTMLElement} */ (document.getElementById('touch-joystick-knob'));
  installTouchBridge(canvas, joystickBase, joystickKnob);
  _setLoadingProgress(70, 'Input ready.');

  // 6. Install UI layers.
  installOverlayController();
  mountInventoryPanel();
  mountHintPanel();
  _setLoadingProgress(90, 'UI ready.');

  // 7. Check for a saved session.
  const hasSave = loadFromStorage();

  // 8. Subscribe to state changes for cross-cutting reactions.
  subscribe(_onStateChange);

  // 9. Wire New Game button.
  document.getElementById('btn-new-game')?.addEventListener('click', _startNewGame);

  // 10. Analytics page view.
  trackPageView();

  // 11. Show loading complete, then show main menu.
  _setLoadingProgress(100, 'Ready.');

  await _pause(300); // brief pause so the "Ready." message reads.

  _hideLoadingScreen();
  showMainMenu();

  // 12. Start the render loop (runs even at main menu to keep canvas alive).
  const camera = getCamera();
  if (camera) initFirstPersonController(camera);
  startLoop(_gameLoop);
}

// ─── Game loop ────────────────────────────────────────────────────────────────

/** @param {number} deltaMs */
function _gameLoop(deltaMs) {
  const state = getState();

  if (state.gameStatus === 'playing' && state.openOverlays.length === 0) {
    // Update first-person controller from held intents.
    updateFirstPersonController(deltaMs);

    // Tick elapsed time.
    dispatch({ type: 'TICK_ELAPSED', payload: { deltaMs } });

    // Witch timer tick (only when on a puzzle — v0.1 always ticks in room 1).
    dispatch({ type: 'WITCH_TIMER_TICK', payload: { deltaMs } });

    // Fire witch encounter if threshold crossed.
    if (shouldFireWitchEncounter(getState())) {
      // v0.1 stub — witch encounter UI not yet implemented. Just reset the timer.
      dispatch({ type: 'WITCH_ENCOUNTER_FIRED', payload: { lineId: 'line-1' } });
      dispatch({ type: 'RESUME' }); // immediately resume for now
    }

    // Settings sync: apply volume to audio manager.
    const { masterVolume } = state.settings;
    setMasterVolume(masterVolume);
  }
}

// ─── State change reactions ───────────────────────────────────────────────────

/** @param {import('./core/state.js').GameState} state */
/** @param {import('./core/state.js').GameState} prev */
function _onStateChange(state, prev) {
  // Room entry narration via ARIA live region.
  if (state.currentRoomId !== prev.currentRoomId) {
    _announce(ROOM_DESCRIPTIONS[state.currentRoomId] ?? `You have entered a new room.`);

    // Track first room entry for analytics.
    if (!prev.roomsVisited.includes(state.currentRoomId)) {
      trackEvent('room-entered', state.currentRoomId);
    }
  }

  // Inventory change narration.
  if (state.inventory.items.length > prev.inventory.items.length) {
    const newItem = state.inventory.items[state.inventory.items.length - 1];
    if (newItem) {
      _announce(`You picked up: ${newItem.itemId.replace(/-/g, ' ')}.`);
    }
  }

  // Win condition.
  if (state.gameStatus === 'won' && prev.gameStatus !== 'won') {
    trackEvent('game-won');
    _announce('Congratulations! You have escaped!');
  }
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

function _startNewGame() {
  dispatch({ type: 'NEW_GAME' });
  trackEvent('game-started');

  // Close main menu, show canvas and HUD.
  const mainMenu = /** @type {HTMLDialogElement | null} */ (
    document.getElementById('overlay-main-menu')
  );
  if (mainMenu?.open) mainMenu.close();

  const canvas = document.getElementById('game-canvas');
  if (canvas) canvas.hidden = false;

  const hud = document.getElementById('hud');
  if (hud) hud.hidden = false;

  // Show joystick on touch devices.
  if (_isTouchDevice()) {
    const joystickArea = document.getElementById('touch-joystick-area');
    if (joystickArea) joystickArea.hidden = false;
  }

  // Announce game start.
  _announce(ROOM_DESCRIPTIONS['dungeon-cell']);
}

function _announce(message) {
  const announcer = document.getElementById('game-announcer');
  if (!announcer) return;
  announcer.textContent = '';
  requestAnimationFrame(() => {
    if (announcer) announcer.textContent = message;
  });
}

function _setLoadingProgress(percent, message) {
  const fill = document.getElementById('loading-bar-fill');
  const text = document.getElementById('loading-text');
  if (fill) fill.style.width = `${percent}%`;
  if (fill) fill.setAttribute('aria-valuenow', String(percent));
  if (text) text.textContent = message;
}

function _hideLoadingScreen() {
  const screen = document.getElementById('loading-screen');
  if (screen) screen.hidden = true;
}

function _isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches;
}

function _pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Kick-off ─────────────────────────────────────────────────────────────────

boot().catch((err) => {
  // If boot throws, show an error accessible to screen readers.
  const loadingText = document.getElementById('loading-text');
  if (loadingText) {
    loadingText.textContent =
      'The game failed to load. Please refresh the page to try again.';
  }
  // Re-throw so the browser console also captures it.
  throw err;
});
