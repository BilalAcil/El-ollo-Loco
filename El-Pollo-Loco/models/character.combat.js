// models/character.combat.js

Object.assign(Character.prototype, {
  throwAnimation,
  canStartThrow,
  hasSalsa,
  handleNoSalsa,
  beginThrow,
  playThrowFrames,
  finishThrowFrames,
  spawnSalsaAndFinish,
  spawnSalsaThrow,
  finishThrow,

  playDeathAnimation,
  startDeathState,
  scheduleDeathSounds,
  playDeathSounds,
  startDeathFallAnim,
  stepDeathFallAnim,
  stepDeathFrames,
  stepDeathFallPhysics,
  shouldFinishDeathAnim,
  finishDeathAnim,

  startFallingWhenDead,
  removeFromWorld,
});

function throwAnimation() {
  if (!this.canStartThrow()) return;
  if (!this.hasSalsa()) return this.handleNoSalsa();
  this.beginThrow();
  this.playThrowFrames();
}

function canStartThrow() {
  return this.animationFinished && !this.isThrowing;
}

function hasSalsa() {
  return this.world?.statusBarSalsa && this.world.statusBarSalsa.salsaCount > 0;
}

function handleNoSalsa() {
  const s = new Audio('audio/Fail.mp3');
  s.volume = 0.4;
  s.playbackRate = 2;
  s.play().catch(() => { });
  this.world?.statusBarSalsa?.blinkOnFail();
}

function beginThrow() {
  this.animationFinished = false;
  this.isThrowing = true;
  this.lastActionTime = Date.now();
  this.throwSound.currentTime = 0;
  this.throwSound.play().catch(() => { });
}

function playThrowFrames() {
  const imgs = this.IMAGES_THROW;
  let i = 0;

  const id = setInterval(() => {
    this.loadImage(imgs[i++]);
    if (i >= imgs.length) this.finishThrowFrames(id);
  }, 50);
}

function finishThrowFrames(id) {
  clearInterval(id);
  setTimeout(() => this.spawnSalsaAndFinish(), 50);
}

function spawnSalsaAndFinish() {
  if (!this.world?.statusBarSalsa) return;
  this.world.statusBarSalsa.salsaCount--;
  this.spawnSalsaThrow();
  this.finishThrow();
}

function spawnSalsaThrow() {
  const offsetX = this.otherDirection ? -50 : 100;
  const salsa = new SalsaThrow(
    this.x + offsetX,
    this.y + this.height / 2 + 20,
    this.otherDirection
  );
  this.world?.throwableObjects?.push(salsa);
}

function finishThrow() {
  this.loadImage(this.IMAGES_IDLE[0]);
  this.animationFinished = true;
  this.isThrowing = false;
}

function playDeathAnimation() {
  if (this.isDying) return;
  this.startDeathState();
  this.scheduleDeathSounds(500);
  this.startDeathFallAnim();
}

function startDeathState() {
  this.isDying = true;
  this.world?.pauseAllMovements?.();
  this.animationFinished = false;
  this.deathFrameIndex = 0;
  this.deathFallVelocity = 0;
}

function scheduleDeathSounds(ms) {
  setTimeout(() => this.playDeathSounds(), ms);
}

function playDeathSounds() {
  this.deathSound = new Audio('audio/dead-sound.mp3');
  this.deathSound.volume = 0.6;
  this.deathSound.play().catch(() => { });

  this.failSound = new Audio('audio/Fail-2.mp3');
  this.failSound.volume = 0.2;
  this.failSound.playbackRate = 0.7;
  this.failSound.play().catch(() => { });
}

function startDeathFallAnim() {
  this.deathInterval = setInterval(() => this.stepDeathFallAnim(), 250);
}

function stepDeathFallAnim() {
  this.stepDeathFrames();
  this.stepDeathFallPhysics();
  if (this.shouldFinishDeathAnim()) this.finishDeathAnim();
}

function stepDeathFrames() {
  if (this.deathFrameIndex >= this.IMAGES_DEAD.length) return;
  this.loadImage(this.IMAGES_DEAD[this.deathFrameIndex++]);
}

function stepDeathFallPhysics() {
  this.deathFallVelocity += 0.5;
  this.y += this.deathFallVelocity;
}

function shouldFinishDeathAnim() {
  return this.y > 480 || this.deathFrameIndex >= this.IMAGES_DEAD.length;
}

function finishDeathAnim() {
  clearInterval(this.deathInterval);
  this.animationFinished = true;
  this.loadImage(this.IMAGES_DEAD[this.IMAGES_DEAD.length - 1]);
}

function startFallingWhenDead() {
  if (this.fallingInterval) return;

  this.fallingInterval = setInterval(() => {
    if (this.isDead || this.isDying) this.y += 3;
    if (this.y <= 600) return;
    clearInterval(this.fallingInterval);
    this.removeFromWorld();
  }, 1000 / 30);
}

function removeFromWorld() {
  const enemies = this.world?.level?.enemies;
  if (!enemies) return;

  const idx = enemies.indexOf(this);
  if (idx > -1) enemies.splice(idx, 1);
}
