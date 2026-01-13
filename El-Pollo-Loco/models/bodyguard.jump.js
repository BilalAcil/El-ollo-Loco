/**
 * @file bodyguard.jump.js
 * @description Jump-Into-Endboss Logik als Mixin.
 */

window.BodyguardJump = {
  jumpToEndboss() {
    if (!this.canStartJump()) return;
    this.markJumpStarted();
    this.playJumpStartSound();
    this.startJumpMotion();
    this.startJumpLoop();
  },

  canStartJump() {
    return !this.isJumping && !this.hasJumped;
  },

  markJumpStarted() {
    this.isJumping = true;
    this.hasJumped = true;
  },

  startJumpMotion() {
    this.speedY = 32;
    this.speedX = -12;
    this.playAnimation(this.IMAGES_JUMP_START);
  },

  startJumpLoop() {
    this.jumpInterval = setInterval(() => this.stepJump(), 40);
  },

  stepJump() {
    this.updateJumpAnimation();
    this.applyJumpMovement();
    if (this.shouldLandNow()) this.handleLanding();
  },

  updateJumpAnimation() {
    const imgs = this.speedY > 0 ? this.IMAGES_JUMP_UP : this.IMAGES_JUMP_HOVER;
    this.playAnimation(imgs);
  },

  applyJumpMovement() {
    this.x += this.speedX;
    this.speedX *= 0.99;
  },

  shouldLandNow() {
    return this.speedY <= 0 && !this.isAboveGround();
  },

  handleLanding() {
    this.snapToGround();
    this.playBoomSound();
    this.triggerWorldShock();
    this.ensureStatusBar();
    this.stopJumpLoop();
    this.startLandSequence();
  },

  snapToGround() {
    this.y = 260;
    this.speedY = 0;
    this.speedX = 0;
  },

  triggerWorldShock() {
    if (this.world) this.world.jumpFromShock();
  },

  ensureStatusBar() {
    if (!this.world || this.world.bodyguardStatus) return;
    this.world.bodyguardStatus = new BodyguardStatusBar(this.world);
    this.world.addToMap(this.world.bodyguardStatus);
  },

  stopJumpLoop() {
    clearInterval(this.jumpInterval);
    this.jumpInterval = null;
    this.isJumping = false;
  },

  startLandSequence() {
    this.playAnimation(this.IMAGES_LAND);
    const ms = this.IMAGES_LAND.length * 100;
    setTimeout(() => this.finishLanding(), ms);
  },

  finishLanding() {
    this.loadImage(this.LAND_STILL);
    this.unfreezePlayer();
    this.startAttackAfterDelay(1000);
  },

  unfreezePlayer() {
    if (this.world?.character) this.world.character.freezeForBodyguard = false;
  },

  startAttackAfterDelay(ms) {
    setTimeout(() => {
      if (this.isDead) return;
      this.startAttackLoop();
    }, ms);
  }
};
