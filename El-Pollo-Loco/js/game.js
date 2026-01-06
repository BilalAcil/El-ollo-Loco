/**
 * Wird von ui.js aufgerufen, wenn der Spieler „Start“ klickt
 */
function startGameLogic() {
  canvas = document.getElementById('canvas');
  world = new World(canvas, keyboard);

  canvas.onclick = handleCanvasClick;
}

function handleCanvasClick() {
  if (!world) return;
  if (world.isMaracasSequence) return; // ⛔ keine Pause während Sequenz
  togglePause();
}

/**
 * Stoppt das Spiel (z. B. bei Game Over)
 */
function stopGame() {
  if (world && world.stop) {
    world.stop();
  }
  // ❗ world NICHT sofort auf null setzen!
}

// === Tasteneingaben erfassen ===
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

function handleKeyDown(e) {
  // 🎚️ Ton an/aus mit Taste „M“ (immer erlaubt, auch ohne World)
  if (isMuteKey(e) && !e.repeat) {
    toggleMute();
  }

  // 👉 Ohne Welt nichts machen (für Bewegungen etc.)
  if (!world) return;

  // ⛔ Während Maracas-Endsequenz ALLE Eingaben ignorieren
  if (world.isMaracasSequence) return;

  applyKeyDownToKeyboard(e);

  // 🧩 Pause/Play mit Taste „P“
  if (isPauseKey(e) && !e.repeat) {
    togglePause();
  }
}

function handleKeyUp(e) {
  applyKeyUpToKeyboard(e);
}

function togglePause() {
  if (world.isPaused) world.resumeGame();
  else world.pauseGame();
}

function isMuteKey(e) {
  return e.key === 'm' || e.key === 'M';
}

function isPauseKey(e) {
  return e.key === 'p' || e.key === 'P';
}

function applyKeyDownToKeyboard(e) {
  if (e.key === 'ArrowRight') keyboard.RIGHT = true;
  if (e.key === 'ArrowLeft') keyboard.LEFT = true;
  if (e.key === 'ArrowUp') keyboard.UP = true;
  if (e.key === 'ArrowDown') keyboard.DOWN = true;
  if (e.key === ' ') keyboard.SPACE = true;
  if (e.key === 'd' || e.key === 'D') keyboard.D = true;
}

function applyKeyUpToKeyboard(e) {
  if (e.key === 'ArrowRight') keyboard.RIGHT = false;
  if (e.key === 'ArrowLeft') keyboard.LEFT = false;
  if (e.key === 'ArrowUp') keyboard.UP = false;
  if (e.key === 'ArrowDown') keyboard.DOWN = false;
  if (e.key === ' ') keyboard.SPACE = false;
  if (e.key === 'd' || e.key === 'D') keyboard.D = false;
}
