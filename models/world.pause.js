//#region World pause/resume system
/**
 * @file models/world.pause.js
 * Pause/Resume: intervals, collisions, actors, countdown/music, overlay, first-resume landing.
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

//#region Freeze / Resume
/** Freeze world: clouds/enemies/bodyguard/collisions + reset inputs + paused=true. */
function pauseAllMovements() {
  this.stopCloudIntervals();
  this.stopAllEnemyIntervals();
  this.pauseBodyguard();
  this.stopCollisionChecks();
  this.resetKeyboardInputsAll();
  this.setPaused(true);
}

/** Resume world: clouds/enemies/bodyguard/collisions + paused=false. */
function resumeAllMovements() {
  this.setPaused(false);
  this.startCloudAnimations();
  this.startEnemyAnimations();
  this.resumeBodyguard();
  this.restartCollisionChecks();
}

/** Set pause flag. */
function setPaused(value) {
  this.isPaused = value;
}
//#endregion

//#region Clouds
/** Stop cloud move intervals. */
function stopCloudIntervals() {
  this.level.clouds.forEach(c => clearInterval(c.moveInterval));
}

/** Restart cloud animation (if animate exists). */
function startCloudAnimations() {
  this.level.clouds.forEach(c => c.animate?.());
}
//#endregion

//#region Enemies
/** Stop all enemy intervals (move/anim/fall). */
function stopAllEnemyIntervals() {
  this.level.enemies.forEach(e => this.stopEnemyIntervals(e));
}

/** Stop known interval handles on one enemy. */
function stopEnemyIntervals(e) {
  if (e.moveInterval) clearInterval(e.moveInterval);
  if (e.animationInterval) clearInterval(e.animationInterval);
  if (e.fallInterval) clearInterval(e.fallInterval);
}

/** Restart enemy animation (if animate exists). */
function startEnemyAnimations() {
  this.level.enemies.forEach(e => e.animate?.());
}
//#endregion

//#region Bodyguard
/** Pause bodyguard (if supported). */
function pauseBodyguard() {
  this.bodyguard?.pause?.();
}

/** Resume bodyguard (if supported). */
function resumeBodyguard() {
  this.bodyguard?.resume?.();
}
//#endregion

//#region Collisions
/** Stop collision loop. */
function stopCollisionChecks() {
  clearInterval(this.collisionInterval);
}

/** Restart collision loop. */
function restartCollisionChecks() {
  this.checkCollisions();
}
//#endregion

//#region Input
/** Reset all keyboard flags. */
function resetKeyboardInputsAll() {
  Object.keys(this.keyboard).forEach(k => (this.keyboard[k] = false));
}
//#endregion

//#region Pause / Resume game
/** Pause game (blocked during special states). Optional overlay. */
function pauseGame(showOverlay = true) {
  if (this.shouldBlockPause() || this.isPaused) return;

  this.isPaused = true;
  this.pauseAllMovements();
  this.pauseActors();
  this.pauseCountdownSystem?.();

  if (this.shouldShowPauseOverlay(showOverlay)) this.showPauseThenPlaySymbol?.();
}

/** Resume game + one-time landing anim + countdown/music. */
function resumeGame() {
  if (!this.isPaused) return;
  this.isPaused = false;

  this.runFirstStartLandingAnimation();
  this.resumeAllMovements();
  this.resumeActors();
  this.resumeCountdownSystem();
  this.hidePlaySymbol?.();
}

/** Block pause during special sequences (jump/freeze/boss dead/maracas). */
function shouldBlockPause() {
  return (
    (this.bodyguard && this.bodyguard.isJumping) ||
    (this.character && this.character.freezeForBodyguard) ||
    (this.endboss && this.endboss.isDead) ||
    this.isMaracasSequence
  );
}

/** Pause key actors (if supported). */
function pauseActors() {
  this.character?.pause?.();
  this.endboss?.pause?.();
  this.bodyguard?.pause?.();
}

/** Resume key actors (if supported). */
function resumeActors() {
  this.character?.resume?.();
  this.endboss?.resume?.();
  this.bodyguard?.resume?.();
}

/** Overlay allowed? */
function shouldShowPauseOverlay(showOverlay) {
  return showOverlay && this.allowPauseOverlay;
}

/** Resume countdown system (start if needed). */
function resumeCountdownSystem() {
  if (!this.countdown) return;
  if (!this.countdown.isStarted) this.countdown.startCountdown();
  this.countdown.resumeAllMusic();
  this.countdown.resumeCountdown();
}
//#endregion

//#region First resume landing
/** First resume only: show fall->land->idle. */
function runFirstStartLandingAnimation() {
  if (this.hasStartedOnce) return;
  this.hasStartedOnce = true;
  if (!this.character) return;

  this.setStartFallFrame();
  this.waitForLandingThenIdle();
}

/** Set initial falling frame. */
function setStartFallFrame() {
  this.character.loadImage("img/2_character_pepe/3_jump/J-37.png");
}

/** Wait until grounded, then land->idle. */
function waitForLandingThenIdle() {
  const check = setInterval(() => {
    if (this.character.isAboveGround()) return;
    clearInterval(check);
    this.playLandingThenIdle();
  }, 50);
}

/** Landing frame, then idle. */
function playLandingThenIdle() {
  this.character.loadImage("img/2_character_pepe/3_jump/J-38.png");
  setTimeout(() => this.startIdleAfterLanding(), 300);
}

/** Go idle; fallback to standing/idle frame. */
function startIdleAfterLanding() {
  if (this.character.playIdleAnimation) return this.character.playIdleAnimation();
  const fallback =
    this.character.IMAGES_STANDING?.[0] ||
    this.character.IMAGES_IDLE?.[0] ||
    "";
  this.character.loadImage(fallback);
}
//#endregion

//#region Stop
/** Hard-stop (currently same as pauseAllMovements). */
function stop() {
  this.pauseAllMovements();
}
//#endregion

//#endregion
