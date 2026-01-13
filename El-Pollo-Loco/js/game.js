/**
 * @file game.js
 * @description
 * Zentrale Spiel-Logik außerhalb der World:
 * - Initialisiert Startscreen und Canvas
 * - Erstellt/pausiert/fortsetzt die World (Preload + Start)
 * - Verbindet Keyboard- und Canvas-Inputs (Pause, Movement, Throw)
 * - Stellt globale Funktionen für HTML onclick-Handler bereit (start/restart/home)
 *
 * Voraussetzungen (global vorhanden):
 * - GameState (z.B. { canvas, world, keyboard, isMuted, gameInitialized })
 * - UI-Helpers: show(), hide(), display()
 * - Audio: toggleMute(), restoreMuteFromStorage()
 * - Mobile: setupMobileControls()
 * - Asset-Waiter: waitForGameAssets()
 * - World-Klasse: World
 */

window.addEventListener("DOMContentLoaded", init);
window.addEventListener("load", onWindowLoad);

// ---------- Screen Init ----------
/**
 * Initialisiert Startscreen/Canvas sobald das DOM bereit ist.
 * @returns {void}
 */
function init() {
  GameState.canvas = document.getElementById('canvas');
  if (!GameState.canvas) return console.error("❌ Canvas nicht gefunden!");

  show('start-screen');
  hide('end-screen');
  display('canvas', 'none');
  display('game-name', 'none');
}

// ---------- Preload / Start ----------
/**
 * Erzeugt die World genau einmal zum Vorladen aller Assets und pausiert sie sofort.
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
 * Startet das Spiel: UI umschalten, Mobile-Controls aktivieren und World fortsetzen.
 * @returns {void}
 */
function startGame() {
  updateScreenForGameStart();
  toggleMobileControlsForStart();
  resumeWorldAfterDelay(200);
}

/**
 * Schaltet UI von Startscreen auf Spielansicht um.
 * @returns {void}
 */
function updateScreenForGameStart() {
  display('game-name', 'block');
  hide('start-screen');
  display('canvas', 'block');
  hide('end-screen');
}

/**
 * Aktiviert Mobile-Controls nur auf kleineren Screens im Landscape-Modus.
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
 * Setzt das Fortsetzen der World zeitverzögert ab (z.B. um UI-Transitionen abzuwarten).
 * @param {number} [delay=200] - Verzögerung in Millisekunden.
 * @returns {void}
 */
function resumeWorldAfterDelay(delay = 200) { setTimeout(resumeWorld, delay); }

/**
 * Setzt die World fort (inkl. Pause-Overlay-Erlaubnis).
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
 * Pausiert die World ohne visuelles Pause/Play-Overlay.
 * @returns {void}
 */
function pauseWorldSilently() {
  const w = GameState.world;
  if (!w) return;

  if (typeof w.pauseGame === 'function') w.pauseGame(false);
  else w.isPaused = true;
}

// ---------- Start Button ----------
/**
 * Macht den Start-Button klickbar und weist den Handler zu.
 * @returns {void}
 */
function setupStartButton() {
  const btn = document.getElementById('start-btn');
  if (!btn) return;

  btn.classList.remove('loading', 'hidden');
  btn.removeAttribute('disabled');
  btn.textContent = '🎮 Spiel starten';
  btn.onclick = startGame;
}

/**
 * Wird beim Window-Load ausgeführt:
 * - Mute-Status wiederherstellen
 * - Mobile-Controls vorbereiten
 * - World vorladen
 * - Auf Assets warten
 * - Start-Button aktivieren
 * - onclick-Globals exportieren
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

// ---------- World Creation ----------
/**
 * Erzeugt die World und verbindet Canvas-Click-Handler.
 * @returns {void}
 */
function startGameLogic() {
  createGameWorld();
  bindCanvasClick();
}

/**
 * (Re-)liest das Canvas-Element in den GameState ein.
 * @returns {void}
 */
function initGameCanvas() {
  GameState.canvas = document.getElementById('canvas');
  if (!GameState.canvas) console.error('❌ Canvas nicht gefunden!');
}

/**
 * Erstellt eine neue World-Instanz (falls Canvas vorhanden).
 * @returns {void}
 */
function createGameWorld() {
  if (!GameState.canvas) return;
  GameState.world = new World(GameState.canvas, GameState.keyboard);
  syncWorldMute();
}

/**
 * Synchronisiert Mute-Status vom GameState in die World.
 * @returns {void}
 */
function syncWorldMute() {
  if (GameState.world) GameState.world.isMuted = GameState.isMuted;
}

/**
 * Bindet Click auf dem Canvas (Pause/Resume).
 * @returns {void}
 */
function bindCanvasClick() {
  if (!GameState.canvas) return;
  GameState.canvas.onclick = handleCanvasClick;
}

/**
 * Canvas-Click: toggelt Pause, außer während der Maracas-Endsequenz.
 * @returns {void}
 */
function handleCanvasClick() {
  if (shouldIgnoreCanvasClick()) return;
  togglePause();
}

/**
 * Prüft, ob Canvas-Klick ignoriert werden soll.
 * @returns {boolean} True, wenn keine World existiert oder Maracas-Sequenz läuft.
 */
function shouldIgnoreCanvasClick() {
  const w = GameState.world;
  return !w || w.isMaracasSequence;
}

// ---------- Stop ----------
/**
 * Stoppt das Spiel über die World-API (z.B. bei Game Over).
 * @returns {void}
 */
function stopGame() {
  const w = GameState.world;
  if (w?.stop) w.stop();
}

// ---------- Keyboard ----------
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

/**
 * Mappt Browser-Tasten auf Properties des Keyboard-Objekts im GameState.
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
 * KeyDown-Handler:
 * - Mute auf "M"
 * - Bewegungen/Wurf/Pause an Keyboard-Flags binden
 * - Pause nur wenn keine Maracas-Sequenz läuft
 * @param {KeyboardEvent} e - Tastatur-Event.
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
 * KeyUp-Handler: setzt Keyboard-Flags zurück.
 * @param {KeyboardEvent} e - Tastatur-Event.
 * @returns {void}
 */
function handleKeyUp(e) { applyKeyFlag(e, false); }

/**
 * Schaltet zwischen Pause und Resume (wenn möglich).
 * @returns {void}
 */
function togglePause() {
  const w = GameState.world;
  if (!w || w.isMaracasSequence) return;
  w.isPaused ? w.resumeGame() : w.pauseGame();
}

/**
 * Setzt einen Keyboard-Flag im GameState passend zur gedrückten Taste.
 * @param {KeyboardEvent} e - Tastatur-Event.
 * @param {boolean} isDown - True bei KeyDown, False bei KeyUp.
 * @returns {void}
 */
function applyKeyFlag(e, isDown) {
  const key = KEY_MAP[e.key];
  if (!key) return;
  GameState.keyboard[key] = isDown;
}

/**
 * Prüft, ob die Taste eine Mute-Taste ist.
 * @param {KeyboardEvent} e - Tastatur-Event.
 * @returns {boolean} True bei "m" oder "M".
 */
function isMuteKey(e) { return e.key === 'm' || e.key === 'M'; }

/**
 * Prüft, ob die Taste eine Pause-Taste ist.
 * @param {KeyboardEvent} e - Tastatur-Event.
 * @returns {boolean} True bei "p" oder "P".
 */
function isPauseKey(e) { return e.key === 'p' || e.key === 'P'; }

// ---------- Restart / Home ----------
/**
 * Startet das Spiel neu: World resetten, UI zurücksetzen, preload + resume.
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
 * Setzt die World zurück, sodass sie neu erstellt werden kann.
 * @returns {void}
 */
function resetWorldForRestart() {
  stopGame?.();
  GameState.world = null;
  GameState.gameInitialized = false;
}

/**
 * Setzt die Stats-Box im Endscreen zurück.
 * @returns {void}
 */
function resetStatsBox() {
  const box = document.getElementById('stats-box');
  if (!box) return;
  box.innerHTML = '';
  box.classList.add('hidden');
}

/**
 * Blendet Endscreen aus und zeigt Canvas + Titel wieder an.
 * @returns {void}
 */
function showGameUIForRestart() {
  hide('end-screen');
  display('canvas', 'block');
  display('game-name', 'block');
}

/**
 * Placeholder für Level 2.
 * @returns {void}
 */

/**
 * Kehrt zum Start zurück, stoppt Musik/Timer und lädt die Seite neu.
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

// ---------- Expose for HTML onclick ----------
/**
 * Exportiert Funktionen nach window, damit sie in HTML onclick-Handlern nutzbar sind.
 * @returns {void}
 */
function exposeHtmlGlobals() {
  window.startGame = startGame;
  window.restartGame = restartGame;
  window.returnToHome = returnToHome;
  window.stopGame = stopGame;
}
// ---------- End Screen ----------
