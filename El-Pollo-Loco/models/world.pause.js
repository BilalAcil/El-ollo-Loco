/**
 * @file models/world.pause.js
 * @description
 * Pause-/Resume-System der World.
 * Verantwortlich für:
 * - Anhalten/fortsetzen von Bewegungen, Gegner- und Wolken-Intervallen
 * - Kollisionschecks stoppen/starten
 * - Actor-Pause (Character/Endboss/Bodyguard)
 * - Countdown/Musik pausieren/fortsetzen
 * - Optionales Pause-Overlay (Play/Pause Symbol)
 * - Einmalige "Start-Landeanimation" beim ersten Resume
 */

Object.assign(World.prototype, {
  pauseAllMovements,
  resumeAllMovements,
  setPaused,

  stopCloudIntervals,
  startCloudAnimations,

  stopAllEnemyIntervals,
  stopEnemyIntervals,
  startEnemyAnimations,

  pauseBodyguard,
  resumeBodyguard,

  stopCollisionChecks,
  restartCollisionChecks,

  resetKeyboardInputsAll,

  pauseGame,
  resumeGame,
  shouldBlockPause,
  pauseActors,
  resumeActors,
  shouldShowPauseOverlay,
  resumeCountdownSystem,

  runFirstStartLandingAnimation,
  setStartFallFrame,
  waitForLandingThenIdle,
  playLandingThenIdle,
  startIdleAfterLanding,

  stop,
});

/**
 * Stoppt (friert) die komplette Welt ein:
 * - Wolkenbewegung
 * - Gegnerbewegung/-animation
 * - Bodyguard (falls eigene Loops)
 * - Kollisionschecks
 * - Keyboard-Inputs zurücksetzen
 * - isPaused setzen
 *
 * @returns {void}
 */
function pauseAllMovements() {
  this.stopCloudIntervals();
  this.stopAllEnemyIntervals();
  this.pauseBodyguard();
  this.stopCollisionChecks();
  this.resetKeyboardInputsAll();
  this.setPaused(true);
}

/**
 * Setzt die Welt fort:
 * - Wolken animieren
 * - Gegner animieren
 * - Bodyguard fortsetzen
 * - Kollisionschecks neu starten
 *
 * @returns {void}
 */
function resumeAllMovements() {
  this.setPaused(false);
  this.startCloudAnimations();
  this.startEnemyAnimations();
  this.resumeBodyguard();
  this.restartCollisionChecks();
}

/**
 * Setzt den Pause-Status der Welt.
 *
 * @param {boolean} value - true = pausiert, false = läuft.
 * @returns {void}
 */
function setPaused(value) {
  this.isPaused = value;
}

/**
 * Stoppt die Wolken-Intervalle (moveInterval).
 *
 * @returns {void}
 */
function stopCloudIntervals() {
  this.level.clouds.forEach((c) => clearInterval(c.moveInterval));
}

/**
 * Startet die Wolken-Animationen erneut (falls animate() vorhanden).
 *
 * @returns {void}
 */
function startCloudAnimations() {
  this.level.clouds.forEach((c) => c.animate?.());
}

/**
 * Stoppt alle Gegner-Intervalle (Move/Animation/Fall).
 *
 * @returns {void}
 */
function stopAllEnemyIntervals() {
  this.level.enemies.forEach((e) => this.stopEnemyIntervals(e));
}

/**
 * Stoppt die bekannten Interval-Handles eines Gegners.
 *
 * @param {*} e - Enemy-Objekt (z.B. Chicken, Endboss, Bodyguard, etc.)
 * @returns {void}
 */
function stopEnemyIntervals(e) {
  if (e.moveInterval) clearInterval(e.moveInterval);
  if (e.animationInterval) clearInterval(e.animationInterval);
  if (e.fallInterval) clearInterval(e.fallInterval);
}

/**
 * Startet die Enemy-Animationen erneut (falls animate() vorhanden).
 *
 * @returns {void}
 */
function startEnemyAnimations() {
  this.level.enemies.forEach((e) => e.animate?.());
}

/**
 * Pausiert den Bodyguard (falls pause() existiert).
 *
 * @returns {void}
 */
function pauseBodyguard() {
  this.bodyguard?.pause?.();
}

/**
 * Setzt den Bodyguard fort (falls resume() existiert).
 *
 * @returns {void}
 */
function resumeBodyguard() {
  this.bodyguard?.resume?.();
}

/**
 * Stoppt den Kollisions-Check-Loop.
 *
 * @returns {void}
 */
function stopCollisionChecks() {
  clearInterval(this.collisionInterval);
}

/**
 * Startet Kollisionschecks neu (setzt ein neues Interval über checkCollisions()).
 *
 * @returns {void}
 */
function restartCollisionChecks() {
  this.checkCollisions();
}

/**
 * Setzt alle Keyboard-Flags auf false (z.B. LEFT/RIGHT/SPACE/D).
 *
 * @returns {void}
 */
function resetKeyboardInputsAll() {
  Object.keys(this.keyboard).forEach((k) => (this.keyboard[k] = false));
}

/**
 * Pausiert das Spiel "offiziell":
 * - Blockiert Pause in bestimmten Zuständen (Bodyguard-Jump, Freeze, Endboss tot, Maracas-Sequenz)
 * - Pausiert Bewegungen + Actors + Countdown/Musik
 * - Optional: zeigt Pause-Overlay, danach Play-Symbol
 *
 * @param {boolean} [showOverlay=true] - Ob ein Pause-Overlay visuell gezeigt werden soll.
 * @returns {void}
 */
function pauseGame(showOverlay = true) {
  if (this.shouldBlockPause()) return;
  if (this.isPaused) return;

  this.isPaused = true;
  this.pauseAllMovements();
  this.pauseActors();
  this.pauseCountdownSystem();

  if (this.shouldShowPauseOverlay(showOverlay)) {
    this.showPauseThenPlaySymbol();
  }
}

/**
 * Setzt das Spiel fort:
 * - Einmalige Start-Landeanimation (nur beim allerersten Resume)
 * - Bewegungen + Actors + Countdown/Musik fortsetzen
 * - Play-Symbol ausblenden
 *
 * @returns {void}
 */
function resumeGame() {
  if (!this.isPaused) return;
  this.isPaused = false;

  this.runFirstStartLandingAnimation();
  this.resumeAllMovements();
  this.resumeActors();
  this.resumeCountdownSystem();
  this.hidePlaySymbol();
}

/**
 * Prüft, ob Pause aktuell gesperrt ist (z.B. während spezieller Sequenzen).
 *
 * @returns {boolean}
 */
function shouldBlockPause() {
  return (
    (this.bodyguard && this.bodyguard.isJumping) ||
    (this.character && this.character.freezeForBodyguard) ||
    (this.endboss && this.endboss.isDead) ||
    this.isMaracasSequence
  );
}

/**
 * Pausiert die wichtigsten Actors (Character, Endboss, Bodyguard) – falls Methoden existieren.
 *
 * @returns {void}
 */
function pauseActors() {
  this.character?.pause?.();
  this.endboss?.pause?.();
  this.bodyguard?.pause?.();
}

/**
 * Setzt die wichtigsten Actors fort (Character, Endboss, Bodyguard) – falls Methoden existieren.
 *
 * @returns {void}
 */
function resumeActors() {
  this.character?.resume?.();
  this.endboss?.resume?.();
  this.bodyguard?.resume?.();
}

/**
 * Prüft, ob ein Pause-Overlay gezeigt werden soll.
 *
 * @param {boolean} showOverlay
 * @returns {boolean}
 */
function shouldShowPauseOverlay(showOverlay) {
  return showOverlay && this.allowPauseOverlay;
}

/**
 * Setzt Countdown-System fort:
 * - Startet Countdown, falls noch nicht gestartet
 * - Musik + Timer wieder laufen lassen
 *
 * @returns {void}
 */
function resumeCountdownSystem() {
  if (!this.countdown) return;
  if (!this.countdown.isStarted) this.countdown.startCountdown();
  this.countdown.resumeAllMusic();
  this.countdown.resumeCountdown();
}

/**
 * Führt beim allerersten Resume eine kleine "Pepe landet" Animation aus.
 * Läuft nur einmal pro World (guarded via hasStartedOnce).
 *
 * @returns {void}
 */
function runFirstStartLandingAnimation() {
  if (this.hasStartedOnce) return;
  this.hasStartedOnce = true;
  if (!this.character) return;

  this.setStartFallFrame();
  this.waitForLandingThenIdle();
}

/**
 * Setzt das initiale "Falling"-Frame (Start-Fall-Optik).
 *
 * @returns {void}
 */
function setStartFallFrame() {
  this.character.loadImage("img/2_character_pepe/3_jump/J-37.png");
}

/**
 * Wartet, bis der Character den Boden erreicht (nicht mehr isAboveGround()).
 * Danach wird {@link playLandingThenIdle} ausgelöst.
 *
 * @returns {void}
 */
function waitForLandingThenIdle() {
  const check = setInterval(() => {
    if (this.character.isAboveGround()) return;
    clearInterval(check);
    this.playLandingThenIdle();
  }, 50);
}

/**
 * Zeigt ein kurzes Landing-Frame und geht dann nach kurzer Verzögerung in Idle über.
 *
 * @returns {void}
 */
function playLandingThenIdle() {
  this.character.loadImage("img/2_character_pepe/3_jump/J-38.png");
  setTimeout(() => this.startIdleAfterLanding(), 300);
}

/**
 * Startet Idle nach der Landing-Animation.
 * Fallback: falls playIdleAnimation nicht existiert, wird ein Standing-Frame verwendet.
 *
 * @returns {void}
 */
function startIdleAfterLanding() {
  if (this.character.playIdleAnimation) this.character.playIdleAnimation();
  else this.character.loadImage(this.character.IMAGES_STANDING[0]);
}

/**
 * Stoppt das Spiel vollständig (aktuell: identisch zu pauseAllMovements()).
 *
 * @returns {void}
 */
function stop() {
  this.pauseAllMovements();
}
