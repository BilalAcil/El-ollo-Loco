// game.js
window.addEventListener("DOMContentLoaded", init);
window.addEventListener("load", onWindowLoad);

// ---------- Screen Init ----------
function init() {
  GameState.canvas = document.getElementById('canvas');
  if (!GameState.canvas) return console.error("❌ Canvas nicht gefunden!");

  show('start-screen');
  hide('end-screen');
  display('canvas', 'none');
  display('game-name', 'none');
}

// ---------- Preload / Start ----------
function preloadWorld() {
  if (GameState.gameInitialized) return;
  GameState.gameInitialized = true;

  initGameCanvas();
  startGameLogic();
  pauseWorldSilently();
}

function startGame() {
  updateScreenForGameStart();
  toggleMobileControlsForStart();
  resumeWorldAfterDelay(200);
}

function updateScreenForGameStart() {
  display('game-name', 'block');
  hide('start-screen');
  display('canvas', 'block');
  hide('end-screen');
}

function toggleMobileControlsForStart() {
  const mc = document.querySelector('.mobile-controls');
  if (!mc) return;

  const small = window.innerWidth <= 1366;
  const landscape = window.innerWidth > window.innerHeight;
  mc.classList.toggle('active', small && landscape);
}

function resumeWorldAfterDelay(delay = 200) { setTimeout(resumeWorld, delay); }

function resumeWorld() {
  const w = GameState.world;
  if (!w) return;

  w.allowPauseOverlay = true;
  if (typeof w.resumeGame === 'function') w.resumeGame();
  else w.isPaused = false;
}

function pauseWorldSilently() {
  const w = GameState.world;
  if (!w) return;

  if (typeof w.pauseGame === 'function') w.pauseGame(false);
  else w.isPaused = true;
}

// ---------- Start Button ----------
function setupStartButton() {
  const btn = document.getElementById('start-btn');
  if (!btn) return;

  btn.classList.remove('loading', 'hidden');
  btn.removeAttribute('disabled');
  btn.textContent = '🎮 Spiel starten';
  btn.onclick = startGame;
}

async function onWindowLoad() {
  restoreMuteFromStorage();
  setupMobileControls();
  preloadWorld();
  await waitForGameAssets();
  setupStartButton();
  exposeHtmlGlobals();
}

// ---------- World Creation ----------
function startGameLogic() {
  createGameWorld();
  bindCanvasClick();
}

function initGameCanvas() {
  GameState.canvas = document.getElementById('canvas');
  if (!GameState.canvas) console.error('❌ Canvas nicht gefunden!');
}

function createGameWorld() {
  if (!GameState.canvas) return;
  GameState.world = new World(GameState.canvas, GameState.keyboard);
  syncWorldMute();
}

function syncWorldMute() {
  if (GameState.world) GameState.world.isMuted = GameState.isMuted;
}

function bindCanvasClick() {
  if (!GameState.canvas) return;
  GameState.canvas.onclick = handleCanvasClick;
}

function handleCanvasClick() {
  if (shouldIgnoreCanvasClick()) return;
  togglePause();
}

function shouldIgnoreCanvasClick() {
  const w = GameState.world;
  return !w || w.isMaracasSequence;
}

// ---------- Stop ----------
function stopGame() {
  const w = GameState.world;
  if (w?.stop) w.stop();
}

// ---------- Keyboard ----------
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

const KEY_MAP = {
  ArrowRight: 'RIGHT',
  ArrowLeft: 'LEFT',
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ' ': 'SPACE',
  d: 'D',
  D: 'D',
};

function handleKeyDown(e) {
  if (isMuteKey(e) && !e.repeat) toggleMute();
  const w = GameState.world;
  if (!w || w.isMaracasSequence) return;

  applyKeyFlag(e, true);
  if (isPauseKey(e) && !e.repeat) togglePause();
}

function handleKeyUp(e) { applyKeyFlag(e, false); }

function togglePause() {
  const w = GameState.world;
  if (!w || w.isMaracasSequence) return;
  w.isPaused ? w.resumeGame() : w.pauseGame();
}

function applyKeyFlag(e, isDown) {
  const key = KEY_MAP[e.key];
  if (!key) return;
  GameState.keyboard[key] = isDown;
}

function isMuteKey(e) { return e.key === 'm' || e.key === 'M'; }

function isPauseKey(e) { return e.key === 'p' || e.key === 'P'; }

// ---------- Restart / Home ----------
function restartGame() {
  resetWorldForRestart();
  resetStatsBox();
  showGameUIForRestart();
  preloadWorld();
  resumeWorldAfterDelay(200);
}

function resetWorldForRestart() {
  stopGame?.();
  GameState.world = null;
  GameState.gameInitialized = false;
}

function resetStatsBox() {
  const box = document.getElementById('stats-box');
  if (!box) return;
  box.innerHTML = '';
  box.classList.add('hidden');
}

function showGameUIForRestart() {
  hide('end-screen');
  display('canvas', 'block');
  display('game-name', 'block');
}

function nextLevel() {
  alert("Level 2: Hol dir die Gitarre! (noch in Arbeit 😎)");
}

function returnToHome() {
  stopGame?.();
  GameState.world?.countdown?.stopCountdown?.();

  hide('end-screen');
  display('canvas', 'none');
  display('game-name', 'none');
  hide('start-screen');

  location.reload();
}

// ---------- Expose for HTML onclick ----------
function exposeHtmlGlobals() {
  window.startGame = startGame;
  window.restartGame = restartGame;
  window.nextLevel = nextLevel;
  window.returnToHome = returnToHome;
  window.stopGame = stopGame;
}
// ---------- End Screen ----------