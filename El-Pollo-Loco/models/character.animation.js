// models/character.animation.js

Object.assign(Character.prototype, {
  startAnimationLoop,
  tickAnimation,
  showFreezeFrame,
  updateStandingAnimation,
  handleDeathAnim,
  playHurtAnim,
  playAirAnim,
  isWalking,
  playWalkAnim,
  playIdleOrLongIdle,
  startLongIdleIfNeeded,
  startIdleIfNeeded,
  handleJumpAnimation,
  showJumpFrame,
  showFallFrame,
  handleMovement,
  startLongIdleAnimation,
  stopLongIdleAnimation,
  playIdleAnimation,
  isInIdleWindow,
  stopIdleInterval,
  showNextIdleFrame,
});

function startAnimationLoop() {
  setInterval(() => this.tickAnimation(), 50);
}

function tickAnimation() {
  if (this.isPaused) return;
  if (!this.world) return;
  if (this.isThrowing) return;

  if (this.freezeForBodyguard) return this.showFreezeFrame();
  this.updateStandingAnimation(Date.now() - this.lastMoveTime);
}

function showFreezeFrame() {
  this.loadImage('img/2_character_pepe/3_jump/J-31.png');
}

function updateStandingAnimation(idleMs) {
  if (this.energy <= 0) return this.handleDeathAnim();
  if (this.isHurt()) return this.playHurtAnim();
  if (this.isAboveGround()) return this.playAirAnim();
  if (this.isWalking()) return this.playWalkAnim();
  this.playIdleOrLongIdle(idleMs);
}

function handleDeathAnim() {
  this.stopLongIdleAnimation();
  this.playDeathAnimation(); // character.combat.js
}

function playHurtAnim() {
  this.stopLongIdleAnimation();
  this.playAnimation(this.IMAGES_HURT);
}

function playAirAnim() {
  this.stopLongIdleAnimation();
  this.handleJumpAnimation();
}

function isWalking() {
  return this.world.keyboard.RIGHT || this.world.keyboard.LEFT;
}

function playWalkAnim() {
  this.stopLongIdleAnimation();
  this.playAnimation(this.IMAGES_WALKING);
}

function playIdleOrLongIdle(idleMs) {
  if (idleMs > 12000) return this.startLongIdleIfNeeded();
  if (idleMs > 10000) return this.startIdleIfNeeded();
  this.stopLongIdleAnimation();
  this.loadImage(this.IMAGES_IDLE[0]);
}

function startLongIdleIfNeeded() {
  if (!this.longIdleActive) this.startLongIdleAnimation();
}

function startIdleIfNeeded() {
  if (!this.idleAnimationStarted) this.playIdleAnimation();
}

function handleJumpAnimation() {
  if (this.speedY > 0) return this.showJumpFrame();
  if (this.speedY < 0) return this.showFallFrame();
  this.loadImage(this.IMAGES_JUMPING[this.IMAGES_JUMPING.length - 1]);
}

function showJumpFrame() {
  const p = Math.min(1, this.speedY / 1);
  const i = Math.floor(p * (this.IMAGES_JUMPING.length - 1));
  this.loadImage(this.IMAGES_JUMPING[i]);
}

function showFallFrame() {
  const p = Math.min(1, Math.abs(this.speedY) / 20);
  const i = Math.floor(p * (this.IMAGES_FALLING.length - 1));
  this.loadImage(this.IMAGES_FALLING[i]);
}

function handleMovement() {
  this.lastMoveTime = Date.now();
  this.idleAnimationStarted = false;
  this.stopLongIdleAnimation();
}

function startLongIdleAnimation() {
  this.longIdleActive = true;
  this.idleAnimationStarted = false;
  let i = 0;

  this.longIdleInterval = setInterval(() => {
    if (this.isPaused || this.world?.isPaused) return;
    if (Date.now() - this.lastMoveTime < 12000) return this.stopLongIdleAnimation();
    this.loadImage(this.IMAGES_LONG_IDLE[i]);
    i = (i + 1) % this.IMAGES_LONG_IDLE.length;
  }, 200);
}

function stopLongIdleAnimation() {
  if (this.longIdleInterval) clearInterval(this.longIdleInterval);
  this.longIdleInterval = null;
  this.longIdleActive = false;
}

function playIdleAnimation() {
  this.idleAnimationStarted = true;
  this.idleFrame = 0;

  const id = setInterval(() => {
    if (!this.isInIdleWindow()) return this.stopIdleInterval(id);
    this.showNextIdleFrame();
  }, 200);
}

function isInIdleWindow() {
  const dt = Date.now() - this.lastMoveTime;
  return dt >= 10000 && dt <= 12000;
}

function stopIdleInterval(id) {
  clearInterval(id);
  this.idleAnimationStarted = false;
}

function showNextIdleFrame() {
  const i = Math.min(this.idleFrame, this.IMAGES_IDLE.length - 1);
  this.loadImage(this.IMAGES_IDLE[i]);
  this.idleFrame++;
}
