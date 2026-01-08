// models/world.pause.js
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

function pauseAllMovements() {
  this.stopCloudIntervals();
  this.stopAllEnemyIntervals();
  this.pauseBodyguard();
  this.stopCollisionChecks();
  this.resetKeyboardInputsAll();
  this.setPaused(true);
}

function resumeAllMovements() {
  this.setPaused(false);
  this.startCloudAnimations();
  this.startEnemyAnimations();
  this.resumeBodyguard();
  this.restartCollisionChecks();
}

function setPaused(value) {
  this.isPaused = value;
}

function stopCloudIntervals() {
  this.level.clouds.forEach(c => clearInterval(c.moveInterval));
}

function startCloudAnimations() {
  this.level.clouds.forEach(c => c.animate?.());
}

function stopAllEnemyIntervals() {
  this.level.enemies.forEach(e => this.stopEnemyIntervals(e));
}

function stopEnemyIntervals(e) {
  if (e.moveInterval) clearInterval(e.moveInterval);
  if (e.animationInterval) clearInterval(e.animationInterval);
  if (e.fallInterval) clearInterval(e.fallInterval);
}

function startEnemyAnimations() {
  this.level.enemies.forEach(e => e.animate?.());
}

function pauseBodyguard() {
  this.bodyguard?.pause?.();
}

function resumeBodyguard() {
  this.bodyguard?.resume?.();
}

function stopCollisionChecks() {
  clearInterval(this.collisionInterval);
}

function restartCollisionChecks() {
  this.checkCollisions();
}

function resetKeyboardInputsAll() {
  Object.keys(this.keyboard).forEach(k => (this.keyboard[k] = false));
}

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

function resumeGame() {
  if (!this.isPaused) return;
  this.isPaused = false;

  this.runFirstStartLandingAnimation();
  this.resumeAllMovements();
  this.resumeActors();
  this.resumeCountdownSystem();
  this.hidePlaySymbol();
}

function shouldBlockPause() {
  return (
    (this.bodyguard && this.bodyguard.isJumping) ||
    (this.character && this.character.freezeForBodyguard) ||
    (this.endboss && this.endboss.isDead) ||
    this.isMaracasSequence
  );
}

function pauseActors() {
  this.character?.pause?.();
  this.endboss?.pause?.();
  this.bodyguard?.pause?.();
}

function resumeActors() {
  this.character?.resume?.();
  this.endboss?.resume?.();
  this.bodyguard?.resume?.();
}

function shouldShowPauseOverlay(showOverlay) {
  return showOverlay && this.allowPauseOverlay;
}

function resumeCountdownSystem() {
  if (!this.countdown) return;
  if (!this.countdown.isStarted) this.countdown.startCountdown();
  this.countdown.resumeAllMusic();
  this.countdown.resumeCountdown();
}

function runFirstStartLandingAnimation() {
  if (this.hasStartedOnce) return;
  this.hasStartedOnce = true;
  if (!this.character) return;

  this.setStartFallFrame();
  this.waitForLandingThenIdle();
}

function setStartFallFrame() {
  this.character.loadImage('img/2_character_pepe/3_jump/J-37.png');
}

function waitForLandingThenIdle() {
  const check = setInterval(() => {
    if (this.character.isAboveGround()) return;
    clearInterval(check);
    this.playLandingThenIdle();
  }, 50);
}

function playLandingThenIdle() {
  this.character.loadImage('img/2_character_pepe/3_jump/J-38.png');
  setTimeout(() => this.startIdleAfterLanding(), 300);
}

function startIdleAfterLanding() {
  if (this.character.playIdleAnimation) this.character.playIdleAnimation();
  else this.character.loadImage(this.character.IMAGES_STANDING[0]);
}

function stop() {
  this.pauseAllMovements();
}
