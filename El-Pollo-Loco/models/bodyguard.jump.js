//#region Bodyguard jump mixin

/**
 * @file bodyguard.jump.js
 * @description Bodyguard jump-into-boss-arena + landing sequence (mixin).
 */

window.BodyguardJump = {
  /**
   * Starts the one-time jump into the endboss area.
   * @returns {void}
   */
  jumpToEndboss() {
    if (!this.canStartJump()) return;
    this.markJumpStarted();
    this.playJumpStartSound();
    this.startJumpMotion();
    this.startJumpLoop();
  },

  /**
   * True if jump is allowed (not already jumping and not done before).
   * @returns {boolean}
   */
  canStartJump() {
    return !this.isJumping && !this.hasJumped;
  },

  /**
   * Sets flags for jump start.
   * @returns {void}
   */
  markJumpStarted() {
    this.isJumping = true;
    this.hasJumped = true;
  },

  /**
   * Initializes jump speeds and shows start frame.
   * @returns {void}
   */
  startJumpMotion() {
    this.speedY = 32;
    this.speedX = -12;
    this.playAnimation(this.IMAGES_JUMP_START);
  },

  /**
   * Starts the jump loop.
   * @returns {void}
   */
  startJumpLoop() {
    this.jumpInterval = setInterval(() => this.stepJump(), 40);
  },

  /**
   * One jump tick: animate, move, and check landing.
   * @returns {void}
   */
  stepJump() {
    this.updateJumpAnimation();
    this.applyJumpMovement();
    if (this.shouldLandNow()) this.handleLanding();
  },

  /**
   * Switches jump sprites depending on vertical speed.
   * @returns {void}
   */
  updateJumpAnimation() {
    const imgs = this.speedY > 0 ? this.IMAGES_JUMP_UP : this.IMAGES_JUMP_HOVER;
    this.playAnimation(imgs);
  },

  /**
   * Applies horizontal movement with slight damping.
   * @returns {void}
   */
  applyJumpMovement() {
    this.x += this.speedX;
    this.speedX *= 0.99;
  },

  /**
   * True if the bodyguard should snap/land now.
   * @returns {boolean}
   */
  shouldLandNow() {
    return this.speedY <= 0 && !this.isAboveGround();
  },

  /**
   * Handles landing: snap, boom/shock, status bar, then landing sequence.
   * @returns {void}
   */
  handleLanding() {
    this.snapToGround();
    this.playBoomSound();
    this.triggerWorldShock();
    this.ensureStatusBar();
    this.stopJumpLoop();
    this.startLandSequence();
  },

  /**
   * Snaps to ground position and stops movement.
   * @returns {void}
   */
  snapToGround() {
    this.y = 260;
    this.speedY = 0;
    this.speedX = 0;
  },

  /**
   * Triggers the world's shock effect (bounce + camera pan).
   * @returns {void}
   */
  triggerWorldShock() {
    if (this.world) this.world.jumpFromShock();
  },

  /**
   * Creates the bodyguard status bar once (if missing).
   * @returns {void}
   */
  ensureStatusBar() {
    if (!this.world || this.world.bodyguardStatus) return;
    this.world.bodyguardStatus = new BodyguardStatusBar(this.world);
    this.world.addToMap(this.world.bodyguardStatus);
  },

  /**
   * Stops the jump loop and clears jumping flag.
   * @returns {void}
   */
  stopJumpLoop() {
    clearInterval(this.jumpInterval);
    this.jumpInterval = null;
    this.isJumping = false;
  },

  /**
   * Plays the landing animation sequence and schedules finish.
   * @returns {void}
   */
  startLandSequence() {
    this.playAnimation(this.IMAGES_LAND);
    const ms = this.IMAGES_LAND.length * 100;
    setTimeout(() => this.finishLanding(), ms);
  },

  /**
   * Sets the final landing frame and resumes gameplay flow.
   * @returns {void}
   */
  finishLanding() {
    this.loadImage(this.LAND_STILL);
    this.unfreezePlayer();
    this.startAttackAfterDelay(1000);
  },

  /**
   * Unfreezes the player after landing (if used by your bodyguard gate).
   * @returns {void}
   */
  unfreezePlayer() {
    if (this.world?.character) this.world.character.freezeForBodyguard = false;
  },

  /**
   * Starts the attack loop after a short delay (if still alive).
   * @param {number} ms
   * @returns {void}
   */
  startAttackAfterDelay(ms) {
    setTimeout(() => {
      if (this.isDead) return;
      this.startAttackLoop();
    }, ms);
  }
};

//#endregion
