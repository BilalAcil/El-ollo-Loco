//#region Game bootstrap (DOM + Window events)

/**
 * @file game.js
 * @description
 * Central game logic outside the World:
 * - Initializes start screen and canvas
 * - Creates / pauses / resumes the World (preload + start)
 * - Connects keyboard and canvas inputs (pause, movement, throw)
 * - Exposes global functions for HTML onclick handlers (start/restart/home)
 *
 * Requirements (available globally):
 * - GameState (e.g. { canvas, world, keyboard, isMuted, gameInitialized })
 * - UI helpers: show(), hide(), display()
 * - Audio: toggleMute(), restoreMuteFromStorage()
 * - Mobile: setupMobileControls()
 * - Asset waiter: waitForGameAssets()
 * - World class: World
 */

window.addEventListener("DOMContentLoaded", init);
window.addEventListener("load", onWindowLoad);

//#endregion

//#region Screen initialization

/**
 * Initializes start screen and canvas once the DOM is ready.
 * @returns {void}
 */
function init() {
  GameState.canvas = document.getElementById('canvas');
  if (!GameState.canvas) return console.error("❌ Canvas not found!");

  show('start-screen');
  hide('end-screen');
  display('canvas', 'none');
  display('game-name', 'none');
}

//#endregion

//#region Preload / Start

/**
 * Creates the World exactly once to preload all assets and immediately pauses it.
 * @returns {void}
 */
function preloadWorld() {
  if (GameState.gameInitialized) return;
  GameState.gameInitialized = true;

  initGameCanvas();
  startGameLogic();
  pauseWorldSilently();
}

/**
 * Starts the game: switches UI, enables mobile controls, and resumes the World.
 * @returns {void}
 */
function startGame() {
  updateScreenForGameStart();
  toggleMobileControlsForStart();
  resumeWorldAfterDelay(200);
}

/**
 * Switches UI from start screen to gameplay view.
 * @returns {void}
 */
function updateScreenForGameStart() {
  display('game-name', 'block');
  hide('start-screen');
  display('canvas', 'block');
  hide('end-screen');
}

/**
 * Enables mobile controls only on smaller screens in landscape mode.
 * @returns {void}
 */
function toggleMobileControlsForStart() {
  const mc = document.querySelector('.mobile-controls');
  if (!mc) return;

  const small = window.innerWidth <= 1366;
  const landscape = window.innerWidth > window.innerHeight;
  mc.classList.toggle('active', small && landscape);
}

/**
 * Resumes the World after a delay (e.g. to wait for UI transitions).
 * @param {number} [delay=200] - Delay in milliseconds.
 * @returns {void}
 */
function resumeWorldAfterDelay(delay = 200) { setTimeout(resumeWorld, delay); }

/**
 * Resumes the World (and allows the pause overlay).
 * @returns {void}
 */
function resumeWorld() {
  const w = GameState.world;
  if (!w) return;

  w.allowPauseOverlay = true;
  if (typeof w.resumeGame === 'function') w.resumeGame();
  else w.isPaused = false;
}

/**
 * Pauses the World without showing the pause/play overlay.
 * @returns {void}
 */
function pauseWorldSilently() {
  const w = GameState.world;
  if (!w) return;

  if (typeof w.pauseGame === 'function') w.pauseGame(false);
  else w.isPaused = true;
}

//#endregion

//#region Start button

/**
 * Makes the start button clickable and assigns the click handler.
 * @returns {void}
 */
function setupStartButton() {
  const btn = document.getElementById('start-btn');
  if (!btn) return;

  btn.classList.remove('loading', 'hidden');
  btn.removeAttribute('disabled');
  btn.textContent = '🎮 Start game';
  btn.onclick = startGame;
}

/**
 * Runs on window load:
 * - restore mute state
 * - prepare mobile controls
 * - preload World
 * - wait for assets
 * - enable start button
 * - expose onclick globals
 * @returns {Promise<void>}
 */
async function onWindowLoad() {
  restoreMuteFromStorage();
  setupMobileControls();
  preloadWorld();
  await waitForGameAssets();
  setupStartButton();
  exposeHtmlGlobals();
}

//#endregion

//#region World creation

/**
 * Creates the World and binds canvas click handlers.
 * @returns {void}
 */
function startGameLogic() {
  createGameWorld();
  bindCanvasClick();
}

/**
 * Reads the canvas element into GameState again.
 * @returns {void}
 */
function initGameCanvas() {
  GameState.canvas = document.getElementById('canvas');
  if (!GameState.canvas) console.error('❌ Canvas not found!');
}

/**
 * Creates a new World instance (if a canvas exists).
 * @returns {void}
 */
function createGameWorld() {
  if (!GameState.canvas) return;
  GameState.world = new World(GameState.canvas, GameState.keyboard);
  syncWorldMute();
}

/**
 * Syncs the mute state from GameState to the World.
 * @returns {void}
 */
function syncWorldMute() {
  if (GameState.world) GameState.world.isMuted = GameState.isMuted;
}

/**
 * Binds a click handler to the canvas (pause/resume).
 * @returns {void}
 */
function bindCanvasClick() {
  if (!GameState.canvas) return;
  GameState.canvas.onclick = handleCanvasClick;
}

/**
 * Canvas click: toggles pause, except during the maracas end sequence.
 * @returns {void}
 */
function handleCanvasClick() {
  if (shouldIgnoreCanvasClick()) return;
  togglePause();
}

/**
 * Checks whether the canvas click should be ignored.
 * @returns {boolean} True if no World exists or the maracas sequence is running.
 */
function shouldIgnoreCanvasClick() {
  const w = GameState.world;
  return !w || w.isMaracasSequence;
}

//#endregion

//#region Stop game

/**
 * Stops the game via the World API (e.g. on game over).
 * @returns {void}
 */
function stopGame() {
  const w = GameState.world;
  if (w?.stop) w.stop();
}

//#endregion

//#region Keyboard input

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

/**
 * Maps browser keys to properties of the Keyboard object in GameState.
 * @type {Record<string, string>}
 */
const KEY_MAP = {
  ArrowRight: 'RIGHT',
  ArrowLeft: 'LEFT',
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ' ': 'SPACE',
  d: 'D',
  D: 'D',
};

/**
 * KeyDown handler:
 * - toggles mute on "M"
 * - binds movement/throw/pause to keyboard flags
 * - pause only if no maracas sequence is running
 * @param {KeyboardEvent} e - Keyboard event.
 * @returns {void}
 */
function handleKeyDown(e) {
  if (isMuteKey(e) && !e.repeat) toggleMute();
  const w = GameState.world;
  if (!w || w.isMaracasSequence) return;

  applyKeyFlag(e, true);
  if (isPauseKey(e) && !e.repeat) togglePause();
}

/**
 * KeyUp handler: resets keyboard flags.
 * @param {KeyboardEvent} e - Keyboard event.
 * @returns {void}
 */
function handleKeyUp(e) { applyKeyFlag(e, false); }

/**
 * Toggles between pause and resume (if possible).
 * @returns {void}
 */
function togglePause() {
  const w = GameState.world;
  if (!w || w.isMaracasSequence) return;
  w.isPaused ? w.resumeGame() : w.pauseGame();
}

/**
 * Sets a keyboard flag in GameState according to the pressed key.
 * @param {KeyboardEvent} e - Keyboard event.
 * @param {boolean} isDown - True on keydown, false on keyup.
 * @returns {void}
 */
function applyKeyFlag(e, isDown) {
  const key = KEY_MAP[e.key];
  if (!key) return;
  GameState.keyboard[key] = isDown;
}

/**
 * Checks if the pressed key is a mute key.
 * @param {KeyboardEvent} e - Keyboard event.
 * @returns {boolean} True for "m" or "M".
 */
function isMuteKey(e) { return e.key === 'm' || e.key === 'M'; }

/**
 * Checks if the pressed key is a pause key.
 * @param {KeyboardEvent} e - Keyboard event.
 * @returns {boolean} True for "p" or "P".
 */
function isPauseKey(e) { return e.key === 'p' || e.key === 'P'; }

//#endregion

//#region Restart / Home

/**
 * Restarts the game: resets the World, resets UI, preload + resume.
 * @returns {void}
 */
function restartGame() {
  resetWorldForRestart();
  resetStatsBox();
  showGameUIForRestart();
  preloadWorld();
  resumeWorldAfterDelay(200);
}

/**
 * Resets the World so it can be created again.
 * @returns {void}
 */
function resetWorldForRestart() {
  stopGame?.();
  GameState.world = null;
  GameState.gameInitialized = false;
}

/**
 * Resets the stats box on the end screen.
 * @returns {void}
 */
function resetStatsBox() {
  const box = document.getElementById('stats-box');
  if (!box) return;
  box.innerHTML = '';
  box.classList.add('hidden');
}

/**
 * Hides the end screen and shows canvas + title again.
 * @returns {void}
 */
function showGameUIForRestart() {
  hide('end-screen');
  display('canvas', 'block');
  display('game-name', 'block');
}

/**
 * Placeholder for level 2.
 * @returns {void}
 */

/**
 * Returns to the start screen, stops music/timers, and reloads the page.
 * @returns {void}
 */
function returnToHome() {
  stopGame?.();
  GameState.world?.countdown?.stopCountdown?.();

  hide('end-screen');
  display('canvas', 'none');
  display('game-name', 'none');
  hide('start-screen');

  location.reload();
}

//#endregion

//#region Expose functions for HTML onclick

/**
 * Exposes functions on window so they can be used in HTML onclick handlers.
 * @returns {void}
 */
function exposeHtmlGlobals() {
  window.startGame = startGame;
  window.restartGame = restartGame;
  window.returnToHome = returnToHome;
  window.stopGame = stopGame;
}

//#endregion

//#region End screen
// (Intentionally left as a section marker for end screen related code)
//#endregion
