//#region World collision pickups

/**
 * @file models/world.collision.pickups.js
 * @description
 * World collision PICKUPS:
 * - Corncob (heal)
 * - Coin pickups
 * - Salsa pickups
 * - Maracas pickup + ending sequence
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

// ---------- Corncob ----------

/**
 * Checks and handles corncob pickup:
 * - removes corncob
 * - plays heal sound
 * - restores character energy to 100
 * - updates statusbar + triggers heal blink
 *
 * @this {World}
 * @returns {void}
 */
function handleCorncobPickup() {
  if (!this.corncob) return;
  if (!this.character.isColliding(this.corncob)) return;

  this.corncob = null;
  this.playHealPickupSound();

  this.character.energy = 100;
  this.statusBar.setPercentage(this.character.energy);
  this.statusBar.blinkFullHealth();
}

/**
 * Plays the heal pickup sound (safe fallback).
 *
 * @this {World}
 * @returns {void}
 */
function playHealPickupSound() {
  if (!this.healSound) return;
  this.healSound.currentTime = 0;
  this.healSound.playbackRate = 1;
  this.healSound.volume = 0.6;
  this.healSound.play().catch((e) => console.warn(e));
}

// ---------- Coins ----------

/**
 * Checks and handles coin pickups:
 * - removes collected coin from this.coins
 * - increases coin counter
 * - plays coin sound
 *
 * @this {World}
 * @returns {void}
 */
function handleCoinPickups() {
  this.coins.forEach((coin, index) => {
    if (!this.character.isColliding(coin)) return;

    this.coins.splice(index, 1);
    this.statusBarCoin.addCoin();
    this.playCoinSound();
  });
}

/**
 * Plays the coin pickup sound (safe fallback).
 *
 * @returns {void}
 */
function playCoinSound() {
  const s = new Audio('audio/coin.mp3');
  s.volume = 0.3;
  s.playbackRate = 1.2;
  s.play().catch((e) => console.warn(e));
}

// ---------- Salsa Pickups ----------

/**
 * Checks and handles salsa pickups:
 * - removes collected salsa from this.salsas
 * - increases salsa counter
 * - plays salsa pickup sound
 *
 * @this {World}
 * @returns {void}
 */
function handleSalsaPickups() {
  this.salsas.forEach((salsa, index) => {
    if (!this.character.isColliding(salsa)) return;

    this.salsas.splice(index, 1);
    this.statusBarSalsa.addSalsa();
    this.playSalsaPickupSound();
  });
}

/**
 * Plays the salsa pickup sound (safe fallback).
 *
 * @returns {void}
 */
function playSalsaPickupSound() {
  const s = new Audio('audio/salsa.mp3');
  s.volume = 0.4;
  s.playbackRate = 2.0;
  s.play().catch((e) => console.warn(e));
}

// ---------- Maracas + Ending ----------

/**
 * Checks and handles maracas pickup, triggering the ending sequence.
 *
 * @this {World}
 * @returns {void}
 */
function handleMaracasPickup() {
  if (!this.maracas) return;
  if (!this.character.isColliding(this.maracas)) return;
  this.startMaracasSequence();
}

/**
 * Starts the maracas ending sequence:
 * - blocks pause/inputs via isMaracasSequence
 * - removes maracas collectible
 * - stops countdown
 * - plays maracas sound
 * - freezes enemies + clouds
 * - resets keyboard flags
 * - runs a short choreography and then ends the game (win)
 *
 * @this {World}
 * @returns {void}
 */
function startMaracasSequence() {
  this.isMaracasSequence = true;
  this.maracas = null;

  this.countdown?.stopCountdown?.();
  this.playMaracasSound();

  this.freezeWorldForMaracas();
  this.resetKeyboardInputs();

  this.runMaracasChoreo();
}

/**
 * Plays the maracas pickup sound (safe fallback).
 *
 * @returns {void}
 */
function playMaracasSound() {
  const s = new Audio('audio/maracas.mp3');
  s.volume = 0.6;
  s.play().catch((e) => console.warn('Maracas sound error:', e));
}

/**
 * Freezes world motion for the ending:
 * - clears enemy movement/animation intervals (where present)
 * - stops cloud movement intervals
 *
 * @this {World}
 * @returns {void}
 */
function freezeWorldForMaracas() {
  this.level.enemies.forEach((e) => this.clearEnemyIntervals(e));
  this.level.clouds.forEach((c) => clearInterval(c.moveInterval));
}

/**
 * Clears common enemy intervals (move/animation) if present.
 *
 * @param {any} e
 * @returns {void}
 */
function clearEnemyIntervals(e) {
  clearInterval(e.moveInterval);
  clearInterval(e.animationInterval);
}

/**
 * Resets active keyboard inputs to avoid stuck movement/actions.
 *
 * @this {World}
 * @returns {void}
 */
function resetKeyboardInputs() {
  this.keyboard.RIGHT = false;
  this.keyboard.LEFT = false;
  this.keyboard.SPACE = false;
  this.keyboard.D = false;
}

/**
 * Runs a short maracas choreography:
 * - a few jumps alternating direction
 * - then a short walk-off to the right
 *
 * @this {World}
 * @returns {void}
 */
function runMaracasChoreo() {
  const pepe = this.character;

  this.maracasJump(pepe, 'right');
  setTimeout(() => this.maracasJump(pepe, 'left'), 600);
  setTimeout(() => this.maracasJump(pepe, 'right'), 1200);
  setTimeout(() => this.startMaracasWalkOff(pepe), 1800);
}

/**
 * Makes the character jump in a direction for the ending.
 * Note: relies on gravity handling of the character implementation.
 *
 * @this {World}
 * @param {Character} pepe
 * @param {'left'|'right'} dir
 * @returns {void}
 */
function maracasJump(pepe, dir) {
  pepe.otherDirection = dir === 'left';
  pepe.speedY = 25;
  pepe.applyGravity();
  this.playJumpSound();
}

/**
 * Plays a jump sound (safe fallback).
 *
 * @returns {void}
 */
function playJumpSound() {
  const s = new Audio('audio/jump.mp3');
  s.volume = 0.5;
  s.play().catch(() => { });
}

/**
 * Starts a short walk-off animation to the right and then finishes the ending.
 *
 * @this {World}
 * @param {Character} pepe
 * @returns {void}
 */
function startMaracasWalkOff(pepe) {
  pepe.otherDirection = false;

  const walkInterval = setInterval(() => {
    pepe.moveRight();
    pepe.playAnimation(pepe.IMAGES_WALKING);
  }, 1000 / 60);

  setTimeout(() => this.finishMaracasEnding(walkInterval), 500);
}

/**
 * Finishes the ending sequence and ends the game as win.
 *
 * @this {World}
 * @param {number} walkInterval
 * @returns {void}
 */
function finishMaracasEnding(walkInterval) {
  clearInterval(walkInterval);
  this.endGame(true);
}

//#endregion
