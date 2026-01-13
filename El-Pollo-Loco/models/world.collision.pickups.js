/**
 * @file models/world.collision.pickups.js
 * @description
 * World Collision PICKUPS:
 * - Corncob (heal)
 * - Coin pickups
 * - Salsa pickups
 * - Maracas pickup + Endsequenz
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
function handleCorncobPickup() {
  if (!this.corncob) return;
  if (!this.character.isColliding(this.corncob)) return;

  this.corncob = null;
  this.playHealPickupSound();

  this.character.energy = 100;
  this.statusBar.setPercentage(this.character.energy);
  this.statusBar.blinkFullHealth();
}

function playHealPickupSound() {
  this.healSound.currentTime = 0;
  this.healSound.playbackRate = 1;
  this.healSound.volume = 0.6;
  this.healSound.play().catch((e) => console.warn(e));
}

// ---------- Coins ----------
function handleCoinPickups() {
  this.coins.forEach((coin, index) => {
    if (!this.character.isColliding(coin)) return;

    this.coins.splice(index, 1);
    this.statusBarCoin.addCoin();
    this.playCoinSound();
  });
}

function playCoinSound() {
  const s = new Audio('audio/coin.mp3');
  s.volume = 0.3;
  s.playbackRate = 1.2;
  s.play().catch((e) => console.warn(e));
}

// ---------- Salsa Pickups ----------
function handleSalsaPickups() {
  this.salsas.forEach((salsa, index) => {
    if (!this.character.isColliding(salsa)) return;

    this.salsas.splice(index, 1);
    this.statusBarSalsa.addSalsa();
    this.playSalsaPickupSound();
  });
}

function playSalsaPickupSound() {
  const s = new Audio('audio/salsa.mp3');
  s.volume = 0.4;
  s.playbackRate = 2.0;
  s.play().catch((e) => console.warn(e));
}

// ---------- Maracas + Ending ----------
function handleMaracasPickup() {
  if (!this.maracas) return;
  if (!this.character.isColliding(this.maracas)) return;
  this.startMaracasSequence();
}

function startMaracasSequence() {
  this.isMaracasSequence = true;
  this.maracas = null;

  this.countdown?.stopCountdown?.();
  this.playMaracasSound();

  this.freezeWorldForMaracas();
  this.resetKeyboardInputs();

  this.runMaracasChoreo();
}

function playMaracasSound() {
  const s = new Audio('audio/maracas.mp3');
  s.volume = 0.6;
  s.play().catch((e) => console.warn('Maracas sound error:', e));
}

function freezeWorldForMaracas() {
  this.level.enemies.forEach((e) => this.clearEnemyIntervals(e));
  this.level.clouds.forEach((c) => clearInterval(c.moveInterval));
}

function clearEnemyIntervals(e) {
  clearInterval(e.moveInterval);
  clearInterval(e.animationInterval);
}

function resetKeyboardInputs() {
  this.keyboard.RIGHT = false;
  this.keyboard.LEFT = false;
  this.keyboard.SPACE = false;
  this.keyboard.D = false;
}

function runMaracasChoreo() {
  const pepe = this.character;

  this.maracasJump(pepe, 'right');
  setTimeout(() => this.maracasJump(pepe, 'left'), 600);
  setTimeout(() => this.maracasJump(pepe, 'right'), 1200);
  setTimeout(() => this.startMaracasWalkOff(pepe), 1800);
}

function maracasJump(pepe, dir) {
  pepe.otherDirection = dir === 'left';
  pepe.speedY = 25;
  pepe.applyGravity();
  this.playJumpSound();
}

function playJumpSound() {
  const s = new Audio('audio/jump.mp3');
  s.volume = 0.5;
  s.play().catch(() => { });
}

function startMaracasWalkOff(pepe) {
  pepe.otherDirection = false;

  const walkInterval = setInterval(() => {
    pepe.moveRight();
    pepe.playAnimation(pepe.IMAGES_WALKING);
  }, 1000 / 60);

  setTimeout(() => this.finishMaracasEnding(walkInterval), 500);
}

function finishMaracasEnding(walkInterval) {
  clearInterval(walkInterval);
  this.endGame(true);
}
