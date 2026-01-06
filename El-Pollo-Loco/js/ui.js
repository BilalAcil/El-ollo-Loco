let isMuted = false;
let canvas;
let world;
let keyboard = new Keyboard();
let gameInitialized = false;

/**
 * Wird ausgeführt, sobald DOM geladen ist.
 */
window.addEventListener("DOMContentLoaded", init);

/* =========================================================
   ✅ Mini-Helper (minimaler Patch, kein Verhaltens-Change)
   ========================================================= */

function show(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function hide(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function display(id, value) {
  const el = document.getElementById(id);
  if (el) el.style.display = value;
}

function resumeWorldAfterDelay(delay = 200) {
  setTimeout(() => {
    if (!world) return;

    // ✅ Ab jetzt dürfen Pause-/Play-Overlays erscheinen
    world.allowPauseOverlay = true;

    if (typeof world.resumeGame === 'function') {
      world.resumeGame();
    } else {
      world.isPaused = false;
    }
  }, delay);
}

function pauseWorldSilently() {
  if (!world) return;

  // ⏸️ direkt pausieren, damit nichts "losläuft", bevor der Spieler startet
  if (typeof world.pauseGame === 'function') {
    // 🔥 pausieren OHNE Pause-/Play-Symbol
    world.pauseGame(false);
  } else {
    world.isPaused = true;
  }
}

function areImagesLoaded() {
  return [...document.querySelectorAll('img')].every(img => img.complete);
}

function areClassesReady() {
  return (
    typeof World !== 'undefined' &&
    typeof level1 !== 'undefined' &&
    typeof Character !== 'undefined' &&
    typeof StatusBar !== 'undefined' &&
    typeof StatusBarCoin !== 'undefined' &&
    typeof StatusBarSalsa !== 'undefined'
  );
}

function isDrawableReady() {
  return typeof DrawableObject === 'undefined' || DrawableObject.areAllAssetsLoaded();
}

/* ========================================================= */

function init() {
  canvas = document.getElementById('canvas');

  if (!canvas) {
    console.error("❌ Canvas nicht gefunden!");
    return;
  }

  // Startscreen anzeigen, Spielbereich verstecken
  show('start-screen');
  hide('end-screen');
  display('canvas', 'none');
  display('game-name', 'none');
}

/**
 * Erzeugt einmalig die World, damit ALLE Assets (Pepe, Statusbars, Coins, etc.)
 * schon beim Laden der Seite vorgeladen werden.
 */
function preloadWorld() {
  if (gameInitialized) return; // nur einmal ausführen
  gameInitialized = true;

  canvas = document.getElementById('canvas');
  if (!canvas) {
    console.error('❌ Canvas nicht gefunden (preloadWorld)!');
    return;
  }

  // ⬇️ deine bisherige Spiel-Initialisierung
  startGameLogic();            // erstellt world = new World(...)

  // ⏸️ direkt pausieren, damit nichts "losläuft", bevor der Spieler startet
  pauseWorldSilently();
}

/**
 * Startet das Spiel, wenn "Spielen" gedrückt wird.
 */
function updateScreenForGameStart() {
  display('game-name', 'block');
  hide('start-screen');
  display('canvas', 'block');
  hide('end-screen');
}

function toggleMobileControlsForStart() {
  const mobileControls = document.querySelector('.mobile-controls');
  if (!mobileControls) return;

  const isSmallScreen = window.innerWidth <= 1366;
  const isLandscape = window.innerWidth > window.innerHeight;

  mobileControls.classList.toggle('active', isSmallScreen && isLandscape);
}

function startGame() {
  updateScreenForGameStart();
  toggleMobileControlsForStart();
  resumeWorldAfterDelay(200);
}

/**
 * Anleitung öffnen/schließen
 */
function openInstructions() {
  document.getElementById('instructions').classList.remove('hidden');
}
function closeInstructions() {
  document.getElementById('instructions').classList.add('hidden');
}

function updateMuteButtonText(muted) {
  const btn = document.getElementById('mute-btn');
  if (btn) btn.textContent = muted ? '🔈 Ton an' : '🔊 Ton aus';
}

function applyGlobalMuteIfAvailable(muted) {
  if (typeof setGlobalMute === 'function') setGlobalMute(muted);
}

function syncWorldMuteState(muted) {
  if (world) world.isMuted = muted;
}

function saveMuteToStorage(muted) {
  try {
    localStorage.setItem('elPolloMute', muted ? '1' : '0');
  } catch (e) {
    console.warn('Konnte Mute-Status nicht in localStorage speichern:', e);
  }
}

function applyMuteState(muted) {
  isMuted = muted;
  updateMuteButtonText(muted);
  applyGlobalMuteIfAvailable(muted);
  syncWorldMuteState(muted);
  saveMuteToStorage(muted);
}

function restoreMuteFromStorage() {
  try {
    const stored = localStorage.getItem('elPolloMute');
    const muted = stored === '1';   // '1' = stumm, alles andere = nicht stumm
    applyMuteState(muted);          // setzt Button-Text + globales Mute
  } catch (e) {
    console.warn('Konnte Mute-Status nicht aus localStorage lesen:', e);
    applyMuteState(false);          // Fallback: Ton an
  }
}

/**
 * Ton an/aus
 */
function toggleMute() {
  const newState = !isMuted;
  applyMuteState(newState);
}

/**
 * Zeigt den Endscreen an (wird vom Spiel aufgerufen)
 * @param {boolean} win - true = gewonnen, false = verloren
 */
function getEndStats() {
  return {
    coinCount: world?.statusBarCoin?.coinCount ?? 0,
    salsaCount: world?.statusBarSalsa?.salsaCount ?? 0
  };
}

function stopGameIfAvailable() {
  if (typeof stopGame === 'function') stopGame();
}

function getEndScreenRefs() {
  const endScreen = document.getElementById('end-screen');
  const buttonContainer = endScreen?.querySelector('.menu-box');
  return { endScreen, buttonContainer };
}

function ensureStatsBox(buttonContainer) {
  let statsBox = document.getElementById('stats-box');
  if (statsBox) return statsBox;

  statsBox = document.createElement('div');
  statsBox.id = 'stats-box';
  statsBox.classList.add('hidden');
  buttonContainer.appendChild(statsBox);
  return statsBox;
}

function hideGameCanvasAndTitle() {
  const canvasEl = document.getElementById('canvas');
  const titleEl = document.getElementById('game-name');
  if (canvasEl) canvasEl.style.display = 'none';
  if (titleEl) titleEl.style.display = 'none';
}

function renderWinEndScreen(buttonContainer, statsBox, stats) {
  buttonContainer.innerHTML = `
    <h2 id="end-message">🪇 Du hast die Maracas zurückgeholt! 🪇</h2>
    <button onclick="nextLevel()">🎸 Gitarre holen</button>
    <button onclick="returnToHome()">🏠 Zurück zum Start</button>
  `;

  statsBox.innerHTML = `
    <p><span class="stats-coin">🪙 <b>${stats.coinCount}</b>x</span></p>
    <p><span class="stats-salsa">🌶️ <b>${stats.salsaCount}</b>x</span></p>
  `;
  statsBox.classList.remove('hidden');
  buttonContainer.appendChild(statsBox);
}

function renderLoseEndScreen(buttonContainer, statsBox) {
  buttonContainer.innerHTML = `
    <h2 id="end-message">💀 Du hast verloren!</h2>
    <button onclick="restartGame()">🔁 Nochmal spielen</button>
    <button onclick="returnToHome()">🏠 Zurück zum Start</button>
  `;
  statsBox.classList.add('hidden');
}

function showEndScreen(win) {
  const stats = getEndStats();
  stopGameIfAvailable();

  const { endScreen, buttonContainer } = getEndScreenRefs();
  if (!endScreen) return console.error('❌ end-screen nicht gefunden!');
  if (!buttonContainer) return console.error('❌ .menu-box im end-screen nicht gefunden!');

  const statsBox = ensureStatsBox(buttonContainer);
  statsBox.innerHTML = "";
  hideGameCanvasAndTitle();

  if (win) renderWinEndScreen(buttonContainer, statsBox, stats);
  else renderLoseEndScreen(buttonContainer, statsBox);

  endScreen.classList.remove('hidden');
}

/**
 * Spiel neu starten
 */
function resetStatsBox() {
  const oldStatsBox = document.getElementById('stats-box');
  if (!oldStatsBox) return;
  oldStatsBox.innerHTML = '';
  oldStatsBox.classList.add('hidden');
}

function showGameUIForRestart() {
  hide('end-screen');
  display('canvas', 'block');
  display('game-name', 'block');
}

function resetWorldForRestart() {
  if (typeof stopGame === 'function') stopGame();
  world = null;
  gameInitialized = false;
}

function restartGame() {
  canvas = document.getElementById('canvas');
  resetWorldForRestart();
  resetStatsBox();
  showGameUIForRestart();
  preloadWorld();
  resumeWorldAfterDelay(200);
}

function nextLevel() {
  alert("Level 2: Hol dir die Gitarre! (noch in Arbeit 😎)");
}

/**
 * Zurück zum Startscreen
 */
function returnToHome() {
  stopGame();

  // Musik & Timer anhalten (zur Sicherheit)
  if (world && world.countdown) {
    world.countdown.stopCountdown();
  }

  // Endscreen ausblenden (optional – Seite lädt gleich neu)
  hide('end-screen');
  display('canvas', 'none');
  display('game-name', 'none');
  hide('start-screen');

  // 🔄 Seite komplett neu laden
  location.reload();
}

/**
 * Mobile-Touch-Buttons mit der Keyboard-Steuerung verbinden
 */
function getMobileButtons() {
  return {
    left: document.getElementById('btn-left'),
    right: document.getElementById('btn-right'),
    jump: document.getElementById('btn-jump'),
    throw: document.getElementById('btn-throw'),
  };
}

function hasAllMobileButtons(btns) {
  return btns.left && btns.right && btns.jump && btns.throw;
}

function disableButtonContextAndSelection(button) {
  button.addEventListener('contextmenu', (e) => e.preventDefault());
  button.style.userSelect = 'none';
  button.style.webkitUserSelect = 'none';
  button.style.msUserSelect = 'none';
}

function setKeyFlag(keyName, isDown) {
  if (!keyboard) return;
  keyboard[keyName] = isDown;
}

function bindButtonToKey(button, keyName) {
  button.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    setKeyFlag(keyName, true);
  });

  button.addEventListener('pointerup', (e) => {
    e.preventDefault();
    setKeyFlag(keyName, false);
  });

  button.addEventListener('pointerleave', () => setKeyFlag(keyName, false));
  button.addEventListener('pointercancel', () => setKeyFlag(keyName, false));
}

function setupMobileControls() {
  const btns = getMobileButtons();
  if (!hasAllMobileButtons(btns)) return;

  [btns.left, btns.right, btns.jump, btns.throw].forEach(disableButtonContextAndSelection);

  bindButtonToKey(btns.left, 'LEFT');
  bindButtonToKey(btns.right, 'RIGHT');
  bindButtonToKey(btns.jump, 'SPACE');
  bindButtonToKey(btns.throw, 'D');
}

/**
 * Warten, bis Browser + Spiel intern vollständig geladen sind
 */
function setupStartButton() {
  const startBtn = document.getElementById('start-btn');
  if (!startBtn) return;

  startBtn.classList.remove('loading', 'hidden');
  startBtn.removeAttribute('disabled');
  startBtn.textContent = '🎮 Spiel starten';
  startBtn.onclick = startGame;
}

async function onWindowLoad() {
  restoreMuteFromStorage();
  setupMobileControls();
  preloadWorld();
  await waitForGameAssets();
  setupStartButton();
}

window.addEventListener('load', onWindowLoad);

/**
 * Prüft in Intervallen, ob Spielressourcen geladen sind
 */
function areAssetsReadyNow() {
  return areClassesReady() && areImagesLoaded() && isDrawableReady();
}

async function waitForGameAssets() {
  const startTime = Date.now();
  const timeout = 20000;

  return new Promise(resolve => {
    const check = setInterval(() => {
      if (areAssetsReadyNow() || Date.now() - startTime > timeout) {
        clearInterval(check);
        resolve();
      }
    }, 200);
  });
}
