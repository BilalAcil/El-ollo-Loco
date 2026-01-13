//#region World pause/resume system

/**
 * @file models/world.pause.js
 * @description
 * World pause/resume system.
 * Responsible for:
 * - stopping/resuming movement, enemy/cloud intervals
 * - stopping/restarting collision checks
 * - actor pause (Character/Endboss/Bodyguard)
 * - pausing/resuming countdown + music
 * - optional pause overlay (play/pause symbol)
 * - one-time "start landing animation" on first resume
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
 * Freezes the whole world:
 * - cloud movement
 * - enemy movement/animation
 * - bodyguard (if it has own loops)
 * - collision checks
 * - reset keyboard inputs
 * - set isPaused
 *
 * @this {World}
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
 * Resumes the world:
 * - restart cloud animations
 * - restart enemy animations
 * - resume bodyguard
 * - restart collision checks
 *
 * @this {World}
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
 * Sets the world's pause state.
 *
 * @this {World}
 * @param {boolean} value - true = paused, false = running.
 * @returns {void}
 */
function setPaused(value) {
  this.isPaused = value;
}

/**
 * Stops cloud intervals (moveInterval).
 *
 * @this {World}
 * @returns {void}
 */
function stopCloudIntervals() {
  this.level.clouds.forEach((c) => clearInterval(c.moveInterval));
}

/**
 * Restarts cloud animations (if animate() exists).
 *
 * @this {World}
 * @returns {void}
 */
function startCloudAnimations() {
  this.level.clouds.forEach((c) => c.animate?.());
}

/**
 * Stops all enemy intervals (move/animation/fall).
 *
 * @this {World}
 * @returns {void}
 */
function stopAllEnemyIntervals() {
  this.level.enemies.forEach((e) => this.stopEnemyIntervals(e));
}

/**
 * Stops known interval handles on an enemy object.
 *
 * @this {World}
 * @param {*} e - Enemy object (Chicken, Endboss, Bodyguard, etc.)
 * @returns {void}
 */
function stopEnemyIntervals(e) {
  if (e.moveInterval) clearInterval(e.moveInterval);
  if (e.animationInterval) clearInterval(e.animationInterval);
  if (e.fallInterval) clearInterval(e.fallInterval);
}

/**
 * Restarts enemy animations (if animate() exists).
 *
 * @this {World}
 * @returns {void}
 */
function startEnemyAnimations() {
  this.level.enemies.forEach((e) => e.animate?.());
}

/**
 * Pauses the bodyguard (if pause() exists).
 *
 * @this {World}
 * @returns {void}
 */
function pauseBodyguard() {
  this.bodyguard?.pause?.();
}

/**
 * Resumes the bodyguard (if resume() exists).
 *
 * @this {World}
 * @returns {void}
 */
function resumeBodyguard() {
  this.bodyguard?.resume?.();
}

/**
 * Stops the collision check loop.
 *
 * @this {World}
 * @returns {void}
 */
function stopCollisionChecks() {
  clearInterval(this.collisionInterval);
}

/**
 * Restarts collision checks (creates a new interval via checkCollisions()).
 *
 * @this {World}
 * @returns {void}
 */
function restartCollisionChecks() {
  this.checkCollisions();
}

/**
 * Resets all keyboard flags to false (LEFT/RIGHT/SPACE/D, etc.).
 *
 * @this {World}
 * @returns {void}
 */
function resetKeyboardInputsAll() {
  Object.keys(this.keyboard).forEach((k) => (this.keyboard[k] = false));
}

/**
 * Officially pauses the game:
 * - blocks pause in certain states (bodyguard jump, freeze, endboss dead, maracas sequence)
 * - pauses movements + actors + countdown/music
 * - optionally shows a pause overlay, then play symbol
 *
 * @this {World}
 * @param {boolean} [showOverlay=true] - Whether to show a pause overlay visually.
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
    // NOTE: expected to exist elsewhere (world.ui / world.overlay)
    this.showPauseThenPlaySymbol?.();
  }
}

/**
 * Resumes the game:
 * - one-time start landing animation (only on the very first resume)
 * - resumes movements + actors + countdown/music
 * - hides play symbol
 *
 * @this {World}
 * @returns {void}
 */
function resumeGame() {
  if (!this.isPaused) return;
  this.isPaused = false;

  this.runFirstStartLandingAnimation();
  this.resumeAllMovements();
  this.resumeActors();
  this.resumeCountdownSystem();
  this.hidePlaySymbol?.();
}

/**
 * Checks if pausing is currently blocked (during special sequences).
 *
 * @this {World}
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
 * Pauses the key actors (Character, Endboss, Bodyguard) if methods exist.
 *
 * @this {World}
 * @returns {void}
 */
function pauseActors() {
  this.character?.pause?.();
  this.endboss?.pause?.();
  this.bodyguard?.pause?.();
}

/**
 * Resumes the key actors (Character, Endboss, Bodyguard) if methods exist.
 *
 * @this {World}
 * @returns {void}
 */
function resumeActors() {
  this.character?.resume?.();
  this.endboss?.resume?.();
  this.bodyguard?.resume?.();
}

/**
 * Whether a pause overlay should be shown.
 *
 * @this {World}
 * @param {boolean} showOverlay
 * @returns {boolean}
 */
function shouldShowPauseOverlay(showOverlay) {
  return showOverlay && this.allowPauseOverlay;
}

/**
 * Resumes the countdown system:
 * - starts countdown if not started
 * - resumes music + timer
 *
 * @this {World}
 * @returns {void}
 */
function resumeCountdownSystem() {
  if (!this.countdown) return;
  if (!this.countdown.isStarted) this.countdown.startCountdown();
  this.countdown.resumeAllMusic();
  this.countdown.resumeCountdown();
}

/**
 * Runs a small "Pepe landing" animation on the very first resume.
 * Runs only once per World instance (guarded via hasStartedOnce).
 *
 * @this {World}
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
 * Sets the initial "falling" frame (start fall look).
 *
 * @this {World}
 * @returns {void}
 */
function setStartFallFrame() {
  this.character.loadImage("img/2_character_pepe/3_jump/J-37.png");
}

/**
 * Waits until the character is on the ground (not above ground anymore).
 * Then triggers {@link playLandingThenIdle}.
 *
 * @this {World}
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
 * Shows a short landing frame and then transitions to idle after a small delay.
 *
 * @this {World}
 * @returns {void}
 */
function playLandingThenIdle() {
  this.character.loadImage("img/2_character_pepe/3_jump/J-38.png");
  setTimeout(() => this.startIdleAfterLanding(), 300);
}

/**
 * Starts idle after landing animation.
 * Fallback: if playIdleAnimation doesn't exist, uses a standing frame.
 *
 * @this {World}
 * @returns {void}
 */
function startIdleAfterLanding() {
  if (this.character.playIdleAnimation) this.character.playIdleAnimation();
  else this.character.loadImage(this.character.IMAGES_STANDING?.[0] || this.character.IMAGES_IDLE?.[0] || "");
}

/**
 * Stops the game completely (currently: identical to pauseAllMovements()).
 *
 * @this {World}
 * @returns {void}
 */
function stop() {
  this.pauseAllMovements();
}

//#endregion
