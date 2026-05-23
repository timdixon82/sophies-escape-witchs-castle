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

// ─── Diagnostic: global error instrumentation (iOS Safari bug fix) ────────────
//
// iOS Safari can swallow errors that occur in event handlers or non-awaited
// promises, leaving the loading screen stuck with no visible feedback.
// This handler catches all uncaught errors and surfaces them in the loading
// screen so the user (and Tim's remote diagnostics) can see what went wrong.
// The region uses aria-live="assertive" so VoiceOver announces it immediately.
//
// Also: if boot has not completed within 5 seconds, show a diagnostic message
// so we get actionable information from a remote device with no devtools.

const _bootDiagnosticEl = document.createElement('div');
_bootDiagnosticEl.id = 'boot-diagnostic';
_bootDiagnosticEl.setAttribute('role', 'alert');
_bootDiagnosticEl.setAttribute('aria-live', 'assertive');
_bootDiagnosticEl.setAttribute('aria-atomic', 'true');
// Styled inline so it is visible regardless of CSS load status.
_bootDiagnosticEl.style.cssText =
  'position:fixed;bottom:0;left:0;right:0;background:#1a0000;color:#ffcccc;' +
  'font:1rem/1.5 system-ui,sans-serif;padding:1rem;z-index:9999;display:none;' +
  'word-break:break-word;max-height:50vh;overflow-y:auto;';
document.body.appendChild(_bootDiagnosticEl);

/**
 * Displays an error in the on-screen diagnostic region.
 * Keeps the loading screen visible so the user can read the message.
 * @param {string} message
 */
function _showBootError(message) {
  // Re-show the loading screen if it was hidden.
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) loadingScreen.hidden = false;

  // Update the loading text to indicate failure.
  const loadingText = document.getElementById('loading-text');
  if (loadingText) {
    loadingText.textContent =
      'The game failed to load. See the error details below.';
  }

  // Show the diagnostic region.
  _bootDiagnosticEl.style.display = 'block';
  _bootDiagnosticEl.textContent = `Error: ${message}`;
}

window.addEventListener('error', (event) => {
  _showBootError(
    event.message +
      (event.filename
        ? ` (${event.filename.split('/').pop()}:${event.lineno})`
        : '')
  );
});

window.addEventListener('unhandledrejection', (event) => {
  const msg =
    event.reason instanceof Error
      ? event.reason.message
      : String(event.reason);
  _showBootError(`Unhandled promise rejection: ${msg}`);
});

// 5-second boot timeout: if the game is still on the loading screen,
// update the text so a remote user can tell whether it is hung.
let _bootComplete = false;
setTimeout(() => {
  if (!_bootComplete) {
    const loadingText = document.getElementById('loading-text');
    if (loadingText && loadingText.textContent !== 'The game failed to load. See the error details below.') {
      loadingText.textContent =
        'Loading is taking longer than expected. Check the browser console or error region for diagnostics.';
    }
  }
}, 5000);

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

  // Mark boot as complete so the 5-second diagnostic timeout does not fire.
  _bootComplete = true;

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
  // If boot throws, surface the error in the accessible diagnostic region
  // and keep the loading screen visible so the user can read the message.
  const message =
    err instanceof Error
      ? `${err.message}${err.stack ? '\n' + err.stack : ''}`
      : String(err);
  _showBootError(message);
  // Re-throw so the browser console also captures it.
  throw err;
});
