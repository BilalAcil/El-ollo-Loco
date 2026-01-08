// models/character.movement.js

Object.assign(Character.prototype, {
  startMovementLoop,
  tickMovement,
  shouldSkipMovementTick,
  processMovementInputs,
  getRunBounds,
  moveRightIfNeeded,
  moveLeftIfNeeded,
  jumpIfNeeded,
  throwIfNeeded,
  updateCamera,
  shouldStartPanBackNow,
  startPanBackOnce,
  handleSoftPanning,
  finishSoftPanning,
  lockEndbossCamera,
  followCharacterCamera,
  applyKnockback,
  checkEndbossTrigger,
  activateEndbossArea,
  triggerBodyguardJump,
  switchToIdleIfNeeded,
});

function startMovementLoop() {
  setInterval(() => this.tickMovement(), 1000 / 60);
}

function tickMovement() {
  if (this.shouldSkipMovementTick()) return;
  this.updateCamera();
  this.applyKnockback();
  if (this.freezeForBodyguard) return;
  this.processMovementInputs();
  this.checkEndbossTrigger();
  this.switchToIdleIfNeeded();
}

function shouldSkipMovementTick() {
  if (this.isPaused) return true;
  if (!this.world) return true;
  return this.world.isPaused;
}

function processMovementInputs() {
  const { minX, maxX } = this.getRunBounds();
  this.moveRightIfNeeded(maxX);
  this.moveLeftIfNeeded(minX);
  this.jumpIfNeeded();
  this.throwIfNeeded();
}

function getRunBounds() {
  let minX = 0;
  let maxX = this.world.level.level_end_x;

  if (this.atEndboss && this.world.canvas) {
    const viewLeft = -this.world.camera_x;
    const viewRight = viewLeft + this.world.canvas.width;
    const margin = 10;
    minX = viewLeft + margin;
    maxX = viewRight - this.width - margin;
  }
  return { minX, maxX };
}

function moveRightIfNeeded(maxX) {
  if (this.world.keyboard.RIGHT && this.x < maxX) {
    this.moveRight();
    this.otherDirection = false;
    this.handleMovement();
  }
}

function moveLeftIfNeeded(minX) {
  if (this.world.keyboard.LEFT && this.x > minX) {
    this.moveLeft();
    this.otherDirection = true;
    this.handleMovement();
  }
}

function jumpIfNeeded() {
  if (this.world.keyboard.SPACE && !this.isAboveGround()) {
    this.jump();
    this.handleMovement();
  }
}

function throwIfNeeded() {
  if (this.world.keyboard.D && this.animationFinished) {
    this.throwAnimation(); // character.combat.js
    this.lastActionTime = Date.now();
    this.lastMoveTime = Date.now();
  }
}

function updateCamera() {
  if (this.shouldStartPanBackNow()) this.startPanBackOnce();
  if (this.handleSoftPanning()) return;
  if (this.atEndboss) return this.lockEndbossCamera();
  this.followCharacterCamera();
}

function shouldStartPanBackNow() {
  return this.atEndboss &&
    this.world.hasBodyguardDied &&
    this.world.shouldStartCameraPanBack &&
    !this.world.isCameraPanning &&
    this.x >= 4000;
}

function startPanBackOnce() {
  this.world.startEndbossCameraPanBack();
  this.world.shouldStartCameraPanBack = false;
}

function handleSoftPanning() {
  if (!this.world.isCameraPanning) return false;
  if (typeof this.world.cameraTargetX !== 'number') return false;

  const target = this.world.cameraTargetX;
  const speed = this.world.cameraPanSpeed || 2;

  this.world.camera_x += this.world.camera_x < target ? speed : -speed;
  if (Math.abs(this.world.camera_x - target) < 1) this.finishSoftPanning(target);
  return true;
}

function finishSoftPanning(target) {
  this.world.camera_x = target;
  this.world.isCameraPanning = false;
  this.world.endbossCameraX = target;
  this.world.stopCameraMoveSound?.();
}

function lockEndbossCamera() {
  this.world.camera_x = (typeof this.world.endbossCameraX === 'number')
    ? this.world.endbossCameraX
    : (-4100 + 100);
}

function followCharacterCamera() {
  this.world.camera_x = -this.x + 100;
}

function applyKnockback() {
  if (!this.knockbackActive) return;
  this.x += this.speedX;
  this.speedX *= 0.9;
  if (Math.abs(this.speedX) >= 1) return;
  this.knockbackActive = false;
  this.speedX = 0;
}

function checkEndbossTrigger() {
  if (this.x < 4100 || this.atEndboss) return;
  this.activateEndbossArea();
}

function activateEndbossArea() {
  this.atEndboss = true;
  this.world?.countdown?.playEndBossMusic();

  if (typeof this.world?.countdown?.hideTemporarily === 'function') {
    this.world.countdown.hideTemporarily(3000);
  }

  this.freezeForBodyguard = true;
  this.triggerBodyguardJump();
}

function triggerBodyguardJump() {
  if (!this.world?.bodyguard || this.world.bodyguard.hasJumped) return;
  this.world.bodyguard.jumpToEndboss();
  this.world.bodyguard.hasJumped = true;
}

function switchToIdleIfNeeded() {
  const idleAllowed =
    Date.now() - this.lastActionTime > this.actionCooldown &&
    !this.isAboveGround() &&
    !this.isHurt() &&
    !this.isDead() &&
    this.currentAnimation !== 'idle';

  if (idleAllowed) this.currentAnimation = 'idle';
}
