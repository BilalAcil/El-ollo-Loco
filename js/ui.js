//#region UI helpers + GameState

/**
 * @file ui.js
 * @description
 * UI and DOM helpers for the game:
 * - Global GameState (mute, canvas, world, keyboard, init flag)
 * - DOM utilities (show/hide/display)
 * - Instructions overlay open/close
 * - Global mute incl. localStorage persistence
 * - End screen rendering incl. stats
 * - Mobile controls (touch buttons -> keyboard flags)
 * - Asset waiter (waits until classes/images/DrawableObject are ready)
 *
 * Exposed on window:
 * - show/hide/display
 * - toggleMute/restoreMuteFromStorage
 * - openInstructions/closeInstructions
 * - showEndScreen/setupMobileControls/waitForGameAssets
 */

window.GameState = window.GameState || {
  isMuted: false,
  canvas: null,
  world: null,
  keyboard: new Keyboard(),
  gameInitialized: false,
};

//#endregion

//#region DOM utilities

/**
 * Shortcut: finds an element by ID.
 * @param {string} id - Element ID.
 * @returns {HTMLElement|null} The element or null.
 */
function el(id) { return document.getElementById(id); }

/**
 * Shows an element by removing the "hidden" CSS class.
 * @param {string} id - Element ID.
 * @returns {void}
 */
function show(id) { const n = el(id); if (n) n.classList.remove('hidden'); }

/**
 * Hides an element by adding the "hidden" CSS class.
 * @param {string} id - Element ID.
 * @returns {void}
 */
function hide(id) { const n = el(id); if (n) n.classList.add('hidden'); }

/**
 * Sets the CSS display property of an element.
 * @param {string} id - Element ID.
 * @param {string} value - Display value (e.g. "none", "block").
 * @returns {void}
 */
function display(id, value) { const n = el(id); if (n) n.style.display = value; }

//#endregion

//#region Instructions overlay

/**
 * Opens the instructions overlay.
 * @returns {void}
 */
function openInstructions() { el('instructions')?.classList.remove('hidden'); }

/**
 * Closes the instructions overlay.
 * @returns {void}
 */
function closeInstructions() { el('instructions')?.classList.add('hidden'); }

//#endregion

//#region Mute (global + persistence)

/**
 * Toggles the game's mute state.
 * @returns {void}
 */
function toggleMute() { applyMuteState(!GameState.isMuted); }

/**
 * Restores the mute state from localStorage.
 * Fallback: sound on if reading fails.
 * @returns {void}
 */
function restoreMuteFromStorage() {
  try { applyMuteState(localStorage.getItem('elPolloMute') === '1'); }
  catch (e) { console.warn('Mute restore failed:', e); applyMuteState(false); }
}

/**
 * Applies the mute state everywhere: UI button, global audio, world state, persistence.
 * @param {boolean} muted - True = muted, false = sound on.
 * @returns {void}
 */
function applyMuteState(muted) {
  GameState.isMuted = muted;
  updateMuteButtonText(muted);
  applyGlobalMute(muted);
  syncWorldMute(muted);
  saveMuteToStorage(muted);

  const mb = el('btn-mute');
  if (mb) updateMobileMuteIcon(mb);
}

/**
 * Updates the text of the mute button.
 * @param {boolean} muted - True = muted, false = sound on.
 * @returns {void}
 */
function updateMuteButtonText(muted) {
  const btn = el('mute-btn');
  if (btn) btn.textContent = muted ? '🔈 Sound on' : '🔊 Sound off';
}

/**
 * Sets global mute (if the audio manager exists).
 * @param {boolean} muted - True = muted, false = sound on.
 * @returns {void}
 */
function applyGlobalMute(muted) { if (typeof setGlobalMute === 'function') setGlobalMute(muted); }

/**
 * Syncs the mute state into the World (if it exists).
 * @param {boolean} muted - True = muted, false = sound on.
 * @returns {void}
 */
function syncWorldMute(muted) { if (GameState.world) GameState.world.isMuted = muted; }

/**
 * Saves the mute state to localStorage.
 * @param {boolean} muted - True = muted, false = sound on.
 * @returns {void}
 */
function saveMuteToStorage(muted) {
  try { localStorage.setItem('elPolloMute', muted ? '1' : '0'); }
  catch (e) { console.warn('Mute save failed:', e); }
}

//#endregion

//#region End screen (rendering + stats)

/**
 * Shows the end screen and renders content depending on the result (win/lose).
 * @param {boolean} win - True = won, false = lost.
 * @returns {void}
 */
function showEndScreen(win) {
  stopGameIfAvailable();
  const refs = getEndScreenRefs();
  if (!refs) return;

  const stats = getEndStats();
  const statsBox = ensureStatsBox(refs.buttonContainer);

  hideGameCanvasAndTitle();
  renderEndScreen(refs.buttonContainer, statsBox, stats, win);
  refs.endScreen.classList.remove('hidden');
}

/**
 * Stops the game if stopGame is available globally.
 * @returns {void}
 */
function stopGameIfAvailable() { if (typeof stopGame === 'function') stopGame(); }

/**
 * Reads the current end stats from the World.
 * @returns {{coinCount:number, salsaCount:number}} Stats object.
 */
function getEndStats() {
  return {
    coinCount: GameState.world?.statusBarCoin?.coinCount ?? 0,
    salsaCount: GameState.world?.statusBarSalsa?.salsaCount ?? 0,
  };
}

/**
 * Gets references to the end screen and button container.
 * @returns {{endScreen: HTMLElement, buttonContainer: Element}|undefined} References or undefined on error.
 */
function getEndScreenRefs() {
  const endScreen = el('end-screen');
  const buttonContainer = endScreen?.querySelector('.menu-box');
  if (!endScreen) return console.error('❌ end-screen not found!');
  if (!buttonContainer) return console.error('❌ .menu-box not found!');
  return { endScreen, buttonContainer };
}

/**
 * Ensures the stats box exists (creates it if needed).
 * @param {Element} buttonContainer - Container inside the end screen.
 * @returns {HTMLElement} Stats box element.
 */
function ensureStatsBox(buttonContainer) {
  let box = el('stats-box');
  if (box) return box;

  box = document.createElement('div');
  box.id = 'stats-box';
  box.classList.add('hidden');
  buttonContainer.appendChild(box);
  return box;
}

/**
 * Hides the canvas and title (needed when showing the end screen).
 * @returns {void}
 */
function hideGameCanvasAndTitle() {
  const c = el('canvas');
  const t = el('game-name');
  if (c) c.style.display = 'none';
  if (t) t.style.display = 'none';
}

/**
 * Renders the end screen (buttons + stats).
 * @param {Element} container - Button container inside the end screen.
 * @param {HTMLElement} statsBox - Stats box element.
 * @param {{coinCount:number, salsaCount:number}} stats - Stats.
 * @param {boolean} win - True = won.
 * @returns {void}
 */
function renderEndScreen(container, statsBox, stats, win) {
  container.innerHTML = win ? winHtml() : loseHtml();
  statsBox.innerHTML = win ? statsHtml(stats) : '';
  statsBox.classList.toggle('hidden', !win);
  container.appendChild(statsBox);
}

/**
 * HTML for the win end screen.
 * @returns {string} HTML string.
 */
function winHtml() {
  return `<h2 id="end-message">🪇 You got the maracas back! 🪇</h2>
  <button onclick="returnToHome()">🏠 Back to home</button>`;
}

/**
 * HTML for the lose end screen.
 * @returns {string} HTML string.
 */
function loseHtml() {
  return `<h2 id="end-message">💀 You lost!</h2>
  <button onclick="restartGame()">🔁 Play again</button>
  <button onclick="returnToHome()">🏠 Back to home</button>`;
}

/**
 * HTML for the stats box.
 * @param {{coinCount:number, salsaCount:number}} stats - Stats.
 * @returns {string} HTML string.
 */
function statsHtml(stats) {
  return `<p><span class="stats-coin">🪙 <b>${stats.coinCount}</b>x</span></p>
  <p><span class="stats-salsa">🌶️ <b>${stats.salsaCount}</b>x</span></p>`;
}

//#endregion

//#region Mobile controls (touch -> keyboard flags)

/**
 * Gets references to the mobile touch buttons.
 * @returns {{left:(HTMLElement|null), right:(HTMLElement|null), jump:(HTMLElement|null), throw:(HTMLElement|null), mute:(HTMLElement|null)}}
 */
function getMobileButtons() {
  return {
    left: el('btn-left'),
    right: el('btn-right'),
    jump: el('btn-jump'),
    throw: el('btn-throw'),
    mute: el('btn-mute'),
  };
}

/**
 * Checks whether all required buttons exist.
 * @param {{left:HTMLElement=, right:HTMLElement=, jump:HTMLElement=, throw:HTMLElement=}} b - Button refs.
 * @returns {boolean} True if all exist.
 */
function hasAllMobileButtons(b) { return b.left && b.right && b.jump && b.throw; }

/**
 * Returns all buttons as an array.
 * @param {{left:HTMLElement=, right:HTMLElement=, jump:HTMLElement=, throw:HTMLElement=}} b - Button refs.
 * @returns {HTMLElement[]} Array of all buttons.
 */
function getAllButtons(b) {
  return [b.left, b.right, b.jump, b.throw, b.mute].filter(Boolean);
}

/**
 * Disables context menu and text selection on a button.
 * @param {HTMLElement} button - Button element.
 * @returns {void}
 */
function disableButtonContextAndSelection(button) {
  button.addEventListener('contextmenu', e => e.preventDefault());
  button.style.userSelect = 'none';
  button.style.webkitUserSelect = 'none';
  button.style.msUserSelect = 'none';
}

/**
 * Binds pointer events of a button to a keyboard flag.
 * @param {HTMLElement} button - Button element.
 * @param {string} keyName - Keyboard flag (e.g. "LEFT", "SPACE").
 * @returns {void}
 */
function bindButtonToKey(button, keyName) {
  button.addEventListener('pointerdown', e => setKeyFlag(e, keyName, true));
  button.addEventListener('pointerup', e => setKeyFlag(e, keyName, false));
  button.addEventListener('pointerleave', () => (GameState.keyboard[keyName] = false));
  button.addEventListener('pointercancel', () => (GameState.keyboard[keyName] = false));
}

/**
 * Sets up mobile touch controls (buttons set keyboard flags).
 * @returns {void}
 */
function setupMobileControls() {
  const btns = getMobileButtons();
  if (!hasAllMobileButtons(btns)) return;

  getAllButtons(btns).forEach(disableButtonContextAndSelection);

  bindButtonToKey(btns.left, 'LEFT');
  bindButtonToKey(btns.right, 'RIGHT');
  bindButtonToKey(btns.jump, 'SPACE');
  bindButtonToKey(btns.throw, 'D');

  // NEW: Mute toggle (click is enough)
  if (btns.mute) {
    updateMobileMuteIcon(btns.mute);
    btns.mute.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMute();
      updateMobileMuteIcon(btns.mute);
    });
  }
}

/**
 * Updates the mute icon for the mobile mute button.
 * @param {HTMLElement} btn - Mute button element.
 * @returns {void}
 */
function updateMobileMuteIcon(btn) {
  btn.textContent = GameState.isMuted ? '🔇' : '🔊';
  btn.setAttribute('aria-pressed', String(GameState.isMuted));
  btn.title = GameState.isMuted ? 'Sound on' : 'Sound off';
}

/**
 * Sets a keyboard flag in GameState.
 * @param {PointerEvent} e - Pointer event.
 * @param {string} keyName - Keyboard flag.
 * @param {boolean} isDown - True = pressed, false = released.
 * @returns {void}
 */
function setKeyFlag(e, keyName, isDown) {
  e.preventDefault();
  GameState.keyboard[keyName] = isDown;
}

//#endregion

//#region Assets (readiness polling)

/**
 * Waits until game assets are loaded (or until timeout).
 * @returns {Promise<void>} Resolves when ready or when the timeout is reached.
 */
function waitForGameAssets() {
  const start = Date.now();
  return new Promise(resolve => pollAssets(resolve, start, 20000));
}

/**
 * Polls in intervals whether assets are ready.
 * @param {() => void} resolve - Promise resolve function.
 * @param {number} start - Start time (ms).
 * @param {number} timeout - Timeout (ms).
 * @returns {void}
 */
function pollAssets(resolve, start, timeout) {
  const id = setInterval(() => {
    if (assetsReadyNow() || Date.now() - start > timeout) { clearInterval(id); resolve(); }
  }, 200);
}

/**
 * Combined readiness check for assets.
 * @returns {boolean} True if ready.
 */
function assetsReadyNow() { return classesReady() && imagesLoaded() && drawableReady(); }

/**
 * Checks whether all <img> tags are fully loaded.
 * @returns {boolean} True if all are complete.
 */
function imagesLoaded() { return [...document.querySelectorAll('img')].every(img => img.complete); }

/**
 * Checks whether core classes/globals exist.
 * @returns {boolean} True if everything exists.
 */
function classesReady() {
  return typeof World !== 'undefined' &&
    typeof level1 !== 'undefined' &&
    typeof Character !== 'undefined' &&
    typeof StatusBar !== 'undefined' &&
    typeof StatusBarCoin !== 'undefined' &&
    typeof StatusBarSalsa !== 'undefined';
}

/**
 * Checks whether DrawableObject assets are loaded (if the class exists).
 * @returns {boolean} True if ready.
 */
function drawableReady() {
  return typeof DrawableObject === 'undefined' || DrawableObject.areAllAssetsLoaded();
}

//#endregion

//#region Expose helpers (for HTML + game.js)

window.show = show;
window.hide = hide;
window.display = display;

window.toggleMute = toggleMute;
window.restoreMuteFromStorage = restoreMuteFromStorage;

window.openInstructions = openInstructions;
window.closeInstructions = closeInstructions;

window.showEndScreen = showEndScreen;
window.setupMobileControls = setupMobileControls;
window.waitForGameAssets = waitForGameAssets;

//#endregion
