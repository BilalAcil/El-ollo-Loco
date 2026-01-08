// ui.js
window.GameState = window.GameState || {
  isMuted: false,
  canvas: null,
  world: null,
  keyboard: new Keyboard(),
  gameInitialized: false,
};

// ---------- DOM ----------
function el(id) { return document.getElementById(id); }

function show(id) { const n = el(id); if (n) n.classList.remove('hidden'); }

function hide(id) { const n = el(id); if (n) n.classList.add('hidden'); }

function display(id, value) { const n = el(id); if (n) n.style.display = value; }

// ---------- Instructions ----------
function openInstructions() { el('instructions')?.classList.remove('hidden'); }

function closeInstructions() { el('instructions')?.classList.add('hidden'); }

// ---------- Mute ----------
function toggleMute() { applyMuteState(!GameState.isMuted); }

function restoreMuteFromStorage() {
  try { applyMuteState(localStorage.getItem('elPolloMute') === '1'); }
  catch (e) { console.warn('Mute restore failed:', e); applyMuteState(false); }
}

function applyMuteState(muted) {
  GameState.isMuted = muted;
  updateMuteButtonText(muted);
  applyGlobalMute(muted);
  syncWorldMute(muted);
  saveMuteToStorage(muted);
}

function updateMuteButtonText(muted) {
  const btn = el('mute-btn');
  if (btn) btn.textContent = muted ? '🔈 Ton an' : '🔊 Ton aus';
}

function applyGlobalMute(muted) { if (typeof setGlobalMute === 'function') setGlobalMute(muted); }

function syncWorldMute(muted) { if (GameState.world) GameState.world.isMuted = muted; }

function saveMuteToStorage(muted) {
  try { localStorage.setItem('elPolloMute', muted ? '1' : '0'); }
  catch (e) { console.warn('Mute save failed:', e); }
}

// ---------- Endscreen ----------
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

function stopGameIfAvailable() { if (typeof stopGame === 'function') stopGame(); }

function getEndStats() {
  return {
    coinCount: GameState.world?.statusBarCoin?.coinCount ?? 0,
    salsaCount: GameState.world?.statusBarSalsa?.salsaCount ?? 0,
  };
}

function getEndScreenRefs() {
  const endScreen = el('end-screen');
  const buttonContainer = endScreen?.querySelector('.menu-box');
  if (!endScreen) return console.error('❌ end-screen nicht gefunden!');
  if (!buttonContainer) return console.error('❌ .menu-box nicht gefunden!');
  return { endScreen, buttonContainer };
}

function ensureStatsBox(buttonContainer) {
  let box = el('stats-box');
  if (box) return box;

  box = document.createElement('div');
  box.id = 'stats-box';
  box.classList.add('hidden');
  buttonContainer.appendChild(box);
  return box;
}

function hideGameCanvasAndTitle() {
  const c = el('canvas');
  const t = el('game-name');
  if (c) c.style.display = 'none';
  if (t) t.style.display = 'none';
}

function renderEndScreen(container, statsBox, stats, win) {
  container.innerHTML = win ? winHtml() : loseHtml();
  statsBox.innerHTML = win ? statsHtml(stats) : '';
  statsBox.classList.toggle('hidden', !win);
  container.appendChild(statsBox);
}

function winHtml() {
  return `<h2 id="end-message">🪇 Du hast die Maracas zurückgeholt! 🪇</h2>
  <button onclick="nextLevel()">🎸 Gitarre holen</button>
  <button onclick="returnToHome()">🏠 Zurück zum Start</button>`;
}

function loseHtml() {
  return `<h2 id="end-message">💀 Du hast verloren!</h2>
  <button onclick="restartGame()">🔁 Nochmal spielen</button>
  <button onclick="returnToHome()">🏠 Zurück zum Start</button>`;
}

function statsHtml(stats) {
  return `<p><span class="stats-coin">🪙 <b>${stats.coinCount}</b>x</span></p>
  <p><span class="stats-salsa">🌶️ <b>${stats.salsaCount}</b>x</span></p>`;
}

// ---------- Mobile Controls ----------
function setupMobileControls() {
  const btns = getMobileButtons();
  if (!hasAllMobileButtons(btns)) return;

  getAllButtons(btns).forEach(disableButtonContextAndSelection);
  bindButtonToKey(btns.left, 'LEFT');
  bindButtonToKey(btns.right, 'RIGHT');
  bindButtonToKey(btns.jump, 'SPACE');
  bindButtonToKey(btns.throw, 'D');
}

function getMobileButtons() {
  return {
    left: el('btn-left'),
    right: el('btn-right'),
    jump: el('btn-jump'),
    throw: el('btn-throw'),
  };
}

function hasAllMobileButtons(b) { return b.left && b.right && b.jump && b.throw; }

function getAllButtons(b) { return [b.left, b.right, b.jump, b.throw]; }

function disableButtonContextAndSelection(button) {
  button.addEventListener('contextmenu', e => e.preventDefault());
  button.style.userSelect = 'none';
  button.style.webkitUserSelect = 'none';
  button.style.msUserSelect = 'none';
}

function bindButtonToKey(button, keyName) {
  button.addEventListener('pointerdown', e => setKeyFlag(e, keyName, true));
  button.addEventListener('pointerup', e => setKeyFlag(e, keyName, false));
  button.addEventListener('pointerleave', () => (GameState.keyboard[keyName] = false));
  button.addEventListener('pointercancel', () => (GameState.keyboard[keyName] = false));
}

function setKeyFlag(e, keyName, isDown) {
  e.preventDefault();
  GameState.keyboard[keyName] = isDown;
}

// ---------- Assets ----------
function waitForGameAssets() {
  const start = Date.now();
  return new Promise(resolve => pollAssets(resolve, start, 20000));
}

function pollAssets(resolve, start, timeout) {
  const id = setInterval(() => {
    if (assetsReadyNow() || Date.now() - start > timeout) { clearInterval(id); resolve(); }
  }, 200);
}

function assetsReadyNow() { return classesReady() && imagesLoaded() && drawableReady(); }

function imagesLoaded() { return [...document.querySelectorAll('img')].every(img => img.complete); }

function classesReady() {
  return typeof World !== 'undefined' &&
    typeof level1 !== 'undefined' &&
    typeof Character !== 'undefined' &&
    typeof StatusBar !== 'undefined' &&
    typeof StatusBarCoin !== 'undefined' &&
    typeof StatusBarSalsa !== 'undefined';
}

function drawableReady() {
  return typeof DrawableObject === 'undefined' || DrawableObject.areAllAssetsLoaded();
}

// ---------- Expose (for HTML + game.js) ----------
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
