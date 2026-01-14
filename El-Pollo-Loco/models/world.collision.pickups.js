//#region World collision pickups
/**
 * @file models/world.collision.pickups.js
 * Pickup collisions:
 * - corncob (heal)
 * - coins
 * - salsa
 * - maracas -> ending sequence
 */

Object.assign(World.prototype, {
  handleCorncobPickup,
  playHealPickupSound,
  handleCoinPickups,
  playCoinSound,
  handleSalsaPickups,
  playSalsaPickupSound,
  handleMaracasPickup,
  startMaracasSequence,
  playMaracasSound,
  freezeWorldForMaracas,
  clearEnemyIntervals,
  resetKeyboardInputs,
  runMaracasChoreo,
  maracasJump,
  playJumpSound,
  startMaracasWalkOff,
  finishMaracasEnding,
});

//#region Corncob
/** Heal pickup: remove corncob, heal to 100, update UI + blink. */
function handleCorncobPickup() {
  if (!this.corncob) return;
  if (!this.character.isColliding(this.corncob)) return;

  this.corncob = null;
  this.playHealPickupSound();

  this.character.energy = 100;
  this.statusBar.setPercentage(this.character.energy);
  this.statusBar.blinkFullHealth();
}

/** Play heal sound (safe). */
function playHealPickupSound() {
  if (!this.healSound) return;
  this.healSound.currentTime = 0;
  this.healSound.playbackRate = 1;
  this.healSound.volume = 0.6;
  this.healSound.play().catch(e => console.warn(e));
}
//#endregion

//#region Coins
/** Coin pickups: remove coin, increment counter, sound. */
function handleCoinPickups() {
  this.coins.forEach((coin, index) => {
    if (!this.character.isColliding(coin)) return;
    this.coins.splice(index, 1);
    this.statusBarCoin.addCoin();
    this.playCoinSound();
  });
}

/** Play coin sound (safe). */
function playCoinSound() {
  const s = new Audio('audio/coin.mp3');
  s.volume = 0.3;
  s.playbackRate = 1.2;
  s.play().catch(e => console.warn(e));
}
//#endregion

//#region Salsa
/** Salsa pickups: remove salsa, increment counter, sound. */
function handleSalsaPickups() {
  this.salsas.forEach((salsa, index) => {
    if (!this.character.isColliding(salsa)) return;
    this.salsas.splice(index, 1);
    this.statusBarSalsa.addSalsa();
    this.playSalsaPickupSound();
  });
}

/** Play salsa pickup sound (safe). */
function playSalsaPickupSound() {
  const s = new Audio('audio/salsa.mp3');
  s.volume = 0.4;
  s.playbackRate = 2.0;
  s.play().catch(e => console.warn(e));
}
//#endregion

//#region Maracas ending
/** Maracas pickup -> start ending. */
function handleMaracasPickup() {
  if (!this.maracas) return;
  if (!this.character.isColliding(this.maracas)) return;
  this.startMaracasSequence();
}

/** Ending: freeze world, stop countdown, choreo, win. */
function startMaracasSequence() {
  this.isMaracasSequence = true;
  this.maracas = null;

  this.countdown?.stopCountdown?.();
  this.playMaracasSound();

  this.freezeWorldForMaracas();
  this.resetKeyboardInputs();
  this.runMaracasChoreo();
}

/** Play maracas sound (safe). */
function playMaracasSound() {
  const s = new Audio('audio/maracas.mp3');
  s.volume = 0.6;
  s.play().catch(e => console.warn('Maracas sound error:', e));
}

/** Freeze enemies + clouds for ending. */
function freezeWorldForMaracas() {
  this.level.enemies.forEach(e => this.clearEnemyIntervals(e));
  this.level.clouds.forEach(c => clearInterval(c.moveInterval));
}

/** Clear common enemy intervals (if present). */
function clearEnemyIntervals(e) {
  clearInterval(e.moveInterval);
  clearInterval(e.animationInterval);
}

/** Reset inputs to avoid stuck movement. */
function resetKeyboardInputs() {
  this.keyboard.RIGHT = false;
  this.keyboard.LEFT = false;
  this.keyboard.SPACE = false;
  this.keyboard.D = false;
}

/** Simple choreo: jump L/R, then walk off. */
function runMaracasChoreo() {
  const pepe = this.character;
  this.maracasJump(pepe, 'right');
  setTimeout(() => this.maracasJump(pepe, 'left'), 600);
  setTimeout(() => this.maracasJump(pepe, 'right'), 1200);
  setTimeout(() => this.startMaracasWalkOff(pepe), 1800);
}

/** Jump helper for ending (uses character gravity). */
function maracasJump(pepe, dir) {
  pepe.otherDirection = dir === 'left';
  pepe.speedY = 25;
  pepe.applyGravity();
  this.playJumpSound();
}

/** Play jump sound (safe). */
function playJumpSound() {
  const s = new Audio('audio/jump.mp3');
  s.volume = 0.5;
  s.play().catch(() => { });
}

/** Walk a bit to the right, then finish. */
function startMaracasWalkOff(pepe) {
  pepe.otherDirection = false;

  const walkInterval = setInterval(() => {
    pepe.moveRight();
    pepe.playAnimation(pepe.IMAGES_WALKING);
  }, 1000 / 60);

  setTimeout(() => this.finishMaracasEnding(walkInterval), 500);
}

/** End as win. */
function finishMaracasEnding(walkInterval) {
  clearInterval(walkInterval);
  this.endGame(true);
}
//#endregion

//#endregion
