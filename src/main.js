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

// ─── Boot error reporter ──────────────────────────────────────────────────────
//
// The pre-module diagnostic (window.onerror, window.onunhandledrejection, the
// 5-second timeout, and the "Script executing" canary) lives in a classic
// <script> block in index.html, placed before this module tag. That block runs
// even if the module loader fails entirely on iOS Safari. See the comment in
// index.html for the rationale.
//
// This function is the module-layer fallback: if boot() itself throws (rather
// than failing at import time), the .catch() below surfaces the error into the
// same diagnostic panel the inline script created.

/**
 * Appends a boot error to the on-screen diagnostic panel.
 * The panel and toggle button are created by the pre-module inline script in
 * index.html. This function shows the toggle button, expands the panel, and
 * also copies the message to the visually-hidden live region so screen readers
 * hear the error immediately even if the panel was previously collapsed.
 * @param {string} message
 */
function _showBootError(message) {
  // Re-show the loading screen if it was hidden.
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.hidden = false;
    loadingScreen.removeAttribute('aria-hidden');
  }

  // Update the loading text to indicate failure.
  const loadingText = document.getElementById('loading-text');
  if (loadingText) {
    loadingText.textContent =
      'The game failed to load. See the error details below.';
  }

  // Show the toggle button and expand the panel.
  const diagToggle = document.getElementById('diag-toggle');
  if (diagToggle) {
    diagToggle.style.display = 'block';
    diagToggle.setAttribute('aria-expanded', 'true');
  }

  // Append to the diagnostic panel created by the inline script.
  const diagEl = document.getElementById('boot-diagnostic');
  if (diagEl) {
    diagEl.style.display = 'block';
    const line = document.createElement('p');
    line.style.margin = '0.25rem 0 0';
    line.textContent = 'Module error: ' + message;
    diagEl.appendChild(line);
  }

  // Announce to the visually-hidden live region so screen readers hear it
  // immediately even when the panel was collapsed.
  const diagLive = document.getElementById('diag-live');
  if (diagLive) {
    diagLive.textContent = '';
    diagLive.textContent = 'Module error: ' + message;
  }
}

/**
 * Appends a named boot step to the diagnostic panel so Tim can see exactly
 * where the boot sequence reached on his iPhone, even without developer tools.
 * Each call also logs to the browser console.
 * This helper is lightweight: it only touches the DOM and console; it does not
 * alter game state or control flow.
 * @param {string} step - Short description of the step just completed.
 */
function _logStep(step) {
  console.log('[boot]', step);
  // Append silently to the collapsed diagnostic panel. The panel starts hidden
  // so boot step messages do not obstruct gameplay on a clean run. The toggle
  // button (created by the inline script) lets Tim expand the panel if needed.
  const diagEl = document.getElementById('boot-diagnostic');
  if (diagEl) {
    const line = document.createElement('p');
    line.style.cssText = 'margin:0.2rem 0 0;color:#aaffaa;font-size:0.85rem;';
    line.textContent = '[boot] ' + step;
    diagEl.appendChild(line);
  }
}

/**
 * Called when boot completes successfully. Hides the diagnostics toggle button
 * so a clean boot leaves no diagnostic UI visible.
 */
function _hideDiagnostics() {
  const diagToggle = document.getElementById('diag-toggle');
  if (diagToggle) diagToggle.style.display = 'none';
}

import { dispatch, subscribe, loadFromStorage, getState } from './core/state.js';
import { shouldFireWitchEncounter } from './core/reducer.js';

import { initEngine, startLoop, getCamera, getScene, getRenderer } from './render/engine.js';
import { initFirstPersonController, updateFirstPersonController } from './render/first-person-controller.js';
import { installKeyboardBridge } from './render/input/keyboard-bridge.js';
import { installMouseBridge } from './render/input/mouse-bridge.js';
import { installTouchBridge } from './render/input/touch-bridge.js';
import { initRoomManager, enterRoom, rebuildCurrentRoom, updateItemLabels } from './render/room-manager.js';
import { installInteractionHandler, refreshInteractionList, tickHighlight } from './render/interaction-handler.js';

import { installOverlayController, showMainMenu, closeOverlayById } from './ui/overlay-controller.js';
import { mountInventoryPanel } from './ui/inventory-panel.js';
import { mountHintPanel } from './ui/hint-panel.js';
import { mountSettingsPanel } from './ui/settings-panel.js';

import { initAudio } from './audio/audio-manager.js';
import { speak } from './ui/speech-manager.js';
import { trackPageView, trackEvent } from './analytics/analytics.js';
import { ROOM_DESCRIPTIONS } from './assets/room-data.js';

// ─── Boot sequence ────────────────────────────────────────────────────────────

async function boot() {
  _logStep('boot() entered — module loaded successfully');

  // 1. Boot entered — show initial progress.
  _setLoadingProgress(5, 'Starting...');

  // 2. Resolve the canvas.
  const canvas = /** @type {HTMLCanvasElement} */ (
    document.getElementById('game-canvas')
  );
  _logStep('canvas element resolved: ' + (canvas ? 'found' : 'NOT FOUND'));
  _setLoadingProgress(10, 'Canvas ready.');

  // 3. Initialise the 3D engine.
  _logStep('Three.js loading (initEngine call)');
  _setLoadingProgress(15, 'Initialising engine...');
  initEngine(canvas);
  _logStep('Three.js loaded — engine initialised');
  _setLoadingProgress(35, 'Engine ready.');

  // 4. Audio init is deferred until first user gesture (browser autoplay policy).
  // The _initAudioOnGesture listener registered in step 5 calls initAudio().
  _logStep('audio: deferred until first gesture');
  _setLoadingProgress(45, 'Audio ready.');

  // 5. Install input bridges.
  _logStep('installing input bridges');
  installKeyboardBridge();
  installMouseBridge(canvas);
  const joystickBase = /** @type {HTMLElement} */ (document.getElementById('touch-joystick-base'));
  const joystickKnob = /** @type {HTMLElement} */ (document.getElementById('touch-joystick-knob'));
  installTouchBridge(canvas, joystickBase, joystickKnob);
  _logStep('input bridges installed');
  _setLoadingProgress(55, 'Input ready.');

  // Wire audio context init to first user gesture (browser autoplay policy).
  // Both keydown and click/touchstart cover keyboard-only and pointer users.
  const _initAudioOnGesture = () => {
    initAudio();
    window.removeEventListener('keydown', _initAudioOnGesture);
    window.removeEventListener('click', _initAudioOnGesture);
    window.removeEventListener('touchstart', _initAudioOnGesture);
  };
  window.addEventListener('keydown', _initAudioOnGesture, { once: false });
  window.addEventListener('click', _initAudioOnGesture, { once: false });
  window.addEventListener('touchstart', _initAudioOnGesture, { once: false });

  // 6. Install UI layers.
  _logStep('installing UI layers');
  installOverlayController();
  mountInventoryPanel();
  mountHintPanel();
  mountSettingsPanel();
  _logStep('UI layers installed');
  _setLoadingProgress(65, 'UI ready.');

  // 6b. Initialise room manager and interaction handler.
  _logStep('initialising room manager');
  const scene = getScene();
  if (scene) {
    initRoomManager(scene);
    installInteractionHandler(_announce);
    // Build the initial room (dungeon-cell) before the render loop starts.
    enterRoom('dungeon-cell');
  }
  _logStep('room manager initialised');
  _setLoadingProgress(80, 'Rooms ready.');

  // 7. Check for a saved session.
  _logStep('loading from storage');
  const hasSave = loadFromStorage();
  _logStep('storage load complete (hasSave=' + !!hasSave + ')');
  _setLoadingProgress(88, 'Save data loaded.');

  // 8. Subscribe to state changes for cross-cutting reactions.
  subscribe(_onStateChange);

  // 9. Wire New Game button.
  document.getElementById('btn-new-game')?.addEventListener('click', _startNewGame);

  // 10. Analytics page view.
  _logStep('firing analytics page view');
  trackPageView();
  _setLoadingProgress(92, 'Almost ready...');

  // 11. Show loading complete, then show main menu.
  _setLoadingProgress(100, 'Ready.');
  _logStep('loading complete — pausing 300 ms before showing menu');

  await _pause(300); // brief pause so the "Ready." message reads.

  _logStep('hiding loading screen');
  _hideLoadingScreen();
  _logStep('showing main menu');
  showMainMenu();
  _logStep('main menu shown');

  // Mark boot as complete so the pre-module 5-second diagnostic timeout does not fire.
  // window.__bootComplete is read by the classic-script block in index.html.
  window.__bootComplete = true;
  _logStep('boot complete — window.__bootComplete set');

  // Hide the diagnostics toggle button. On a clean boot there are no errors,
  // so there is no reason to show the diagnostic UI.
  _hideDiagnostics();

  // 12. Start the render loop (runs even at main menu to keep canvas alive).
  const camera = getCamera();
  if (camera) initFirstPersonController(camera);
  _logStep('starting render loop');
  startLoop(_gameLoop);
  _logStep('render loop started — first frame drawn');
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

    // Volume is managed via the settings-panel slider (sewc-volume in localStorage).
    // No per-frame sync needed here.
  }

  // Per-frame hover highlight and floating label repositioning run every frame
  // (not only while playing) so the scene responds during room transitions.
  const camera = getCamera();
  const renderer = getRenderer();
  if (camera) {
    tickHighlight(camera, _announce);
  }
  if (camera && renderer) {
    updateItemLabels(camera, renderer);
  }
}

// ─── State change reactions ───────────────────────────────────────────────────

/** @param {import('./core/state.js').GameState} state */
/** @param {import('./core/state.js').GameState} prev */
function _onStateChange(state, prev) {
  // Room entry narration via ARIA live region.
  if (state.currentRoomId !== prev.currentRoomId) {
    const roomDesc = ROOM_DESCRIPTIONS[state.currentRoomId] ?? 'You have entered a new room.';
    _announce(roomDesc);
    speak(roomDesc);

    // Track first room entry for analytics.
    if (!prev.roomsVisited.includes(state.currentRoomId)) {
      trackEvent('room-entered', state.currentRoomId);
    }

    // NOTE: refreshInteractionList is NOT called here. It is called at the end
    // of _handleDoor (in interaction-handler.js) AFTER enterRoom() has finished
    // building the new room's interactables. Calling it here (synchronously
    // inside dispatch, before enterRoom runs) would populate the list with the
    // departing room's objects. See work folder 032.
  }

  // Puzzle solved — rebuild room to show newly-accessible items/objects.
  const prevSolvedCount = Object.values(prev.puzzles).filter((p) => p.state === 'solved').length;
  const newSolvedCount = Object.values(state.puzzles).filter((p) => p.state === 'solved').length;
  if (newSolvedCount > prevSolvedCount) {
    // Rebuild geometry for the current room with the updated puzzle state.
    rebuildCurrentRoom();
    refreshInteractionList(_announce);
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

  // Close main menu through the overlay controller so _openStack, focus
  // management, aria-expanded, and OVERLAY_CLOSED are all handled correctly.
  closeOverlayById('overlay-main-menu');

  const canvas = document.getElementById('game-canvas');
  if (canvas) canvas.hidden = false;

  const hud = document.getElementById('hud');
  if (hud) hud.hidden = false;

  // Show joystick on touch devices.
  if (_isTouchDevice()) {
    const joystickArea = document.getElementById('touch-joystick-area');
    if (joystickArea) joystickArea.hidden = false;
  }

  // Rebuild Room 1 for the new game session (clears any prior play state
  // that might have changed the room geometry).
  rebuildCurrentRoom();
  refreshInteractionList(_announce);

  // Move focus to the canvas after layout update so VoiceOver has a clear
  // landing point after the main menu dialog closes. Deferring by one task
  // (setTimeout 0) ensures the browser has completed layout before focus() is
  // called — a silent no-op otherwise on mobile Safari (canvas has
  // tabindex="0" in index.html).
  setTimeout(function () {
    document.getElementById('game-canvas')?.focus();
  }, 0);

  // Announce game start.
  const startDesc = ROOM_DESCRIPTIONS['dungeon-cell'];
  _announce(startDesc);
  speak(startDesc);
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
  const bar = document.getElementById('loading-bar');
  const fill = document.getElementById('loading-bar-fill');
  const text = document.getElementById('loading-text');
  // Update aria-valuenow on the progressbar element (not the fill div).
  if (bar) bar.setAttribute('aria-valuenow', String(percent));
  if (fill) fill.style.width = `${percent}%`;
  if (text) text.textContent = message;
}

function _hideLoadingScreen() {
  const screen = document.getElementById('loading-screen');
  if (screen) {
    screen.hidden = true;
    screen.setAttribute('aria-hidden', 'true');
  }
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
