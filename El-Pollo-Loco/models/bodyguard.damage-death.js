//#region Bodyguard damage/death mixin

/**
 * @file bodyguard.damage-death.js
 * @description Bodyguard hit/damage/death + falling removal (mixin).
 */

window.BodyguardDamageDeath = {
  /**
   * Applies a hit to the bodyguard: stop attack, play hurt, reduce HP, maybe die.
   * @returns {void}
   */
  hit() {
    if (this.isDead) return;

    this.stopAttackForHit();
    this.playHurtSound();

    this.applyDamage(25);
    this.updateStatusBar();

    if (this.energy <= 0) return this.handleDeath();

    this.applyHitFallbackMovement();
    this.playHurtAnimationThenResume();
  },

  /**
   * Stops attack loop and freezes movement briefly.
   * @returns {void}
   */
  stopAttackForHit() {
    this.resetAttackInterval();
    this.saveMotionState();
    this.speedX = 0;
  },

  /**
   * Stores last patrol direction/speed for resume.
   * @returns {void}
   */
  saveMotionState() {
    this.lastDirection = this.otherDirection;
    this.lastSpeedX = this.speedX;
  },

  /**
   * Reduces energy by amount.
   * @param {number} amount
   * @returns {void}
   */
  applyDamage(amount) {
    this.energy -= amount;
  },

  /**
   * Syncs HP to the bodyguard status bar (if present).
   * @returns {void}
   */
  updateStatusBar() {
    this.world?.bodyguardStatus?.setPercentage(this.energy);
  },

  /**
   * Triggers world-side "bodyguard died" event, then kills this bodyguard.
   * @returns {void}
   */
  handleDeath() {
    this.world?.onBodyguardDeath?.();
    this.die();
  },

  /**
   * Small fallback movement away/towards player so the hurt phase feels reactive.
   * @returns {void}
   */
  applyHitFallbackMovement() {
    const player = this.world?.character;
    if (!player) return;

    const playerRight = player.x > this.x;
    this.otherDirection = !playerRight;
    this.speedX = playerRight ? 5 : -5;
  },

  /**
   * Plays hurt animation for a short time, then resumes attack loop.
   * @returns {void}
   */
  playHurtAnimationThenResume() {
    const total = this.IMAGES_HURT.length * 2;
    let frames = 0;

    const intv = setInterval(() => {
      this.playAnimation(this.IMAGES_HURT);
      if (++frames >= total) this.endHurt(intv);
    }, 100);
  },

  /**
   * Ends hurt phase and restarts attack.
   * @param {number} intervalId
   * @returns {void}
   */
  endHurt(intervalId) {
    clearInterval(intervalId);
    this.startAttackLoop();
  },

  /**
   * Marks dead, clears UI, stops loops, plays death sound and starts falling.
   * @returns {void}
   */
  die() {
    if (this.isDead) return;

    this.isDead = true;
    this.clearStatusBar();
    this.stopAllIntervals();

    this.speedX = 0;
    this.playDieSoundDelayed(200);
    this.startFallingWhenDead();
  },

  /**
   * Removes bodyguard status bar reference from the world.
   * @returns {void}
   */
  clearStatusBar() {
    if (this.world?.bodyguardStatus) this.world.bodyguardStatus = null;
  },

  /**
   * Stops all known bodyguard loops (attack/jump/fall/death animation).
   * @returns {void}
   */
  stopAllIntervals() {
    this.resetAttackInterval();
    this.stopJumpIfRunning();
    this.stopFallIfRunning();
    this.stopDeathAnimIfRunning();
  },

  /**
   * Stops jump loop if active.
   * @returns {void}
   */
  stopJumpIfRunning() {
    if (!this.jumpInterval) return;
    clearInterval(this.jumpInterval);
    this.jumpInterval = null;
  },

  /**
   * Stops fall loop if active.
   * @returns {void}
   */
  stopFallIfRunning() {
    if (!this.fallInterval) return;
    clearInterval(this.fallInterval);
    this.fallInterval = null;
  },

  /**
   * Stops death animation loop if active.
   * @returns {void}
   */
  stopDeathAnimIfRunning() {
    if (!this.deathAnimInterval) return;
    clearInterval(this.deathAnimInterval);
    this.deathAnimInterval = null;
  },

  /**
   * Plays die sound after a short delay (smoother transition).
   * @param {number} ms
   * @returns {void}
   */
  playDieSoundDelayed(ms) {
    setTimeout(() => {
      if (this.isDead) this.playDieSound();
    }, ms);
  },

  /**
   * Starts falling + death animation loops once.
   * @returns {void}
   */
  startFallingWhenDead() {
    if (this.fallInterval) return;
    this.startDeathAnimLoop();
    this.startFallLoop();
  },

  /**
   * Loops through dead frames.
   * @returns {void}
   */
  startDeathAnimLoop() {
    this.deathAnimInterval = setInterval(() => {
      this.playAnimation(this.IMAGES_DEAD);
    }, 200);
  },

  /**
   * Applies simple fall physics until off-screen, then removes from world.
   * @returns {void}
   */
  startFallLoop() {
    let fallSpeed = 0;

    this.fallInterval = setInterval(() => {
      if (this.isGamePaused()) return;

      fallSpeed += 0.5;
      this.y += fallSpeed;

      if (this.y > 600) this.finishDeathFall();
    }, 1000 / 30);
  },

  /**
   * True if bodyguard/world are paused.
   * @returns {boolean}
   */
  isGamePaused() {
    return this.isPaused || this.world?.isPaused;
  },

  /**
   * Stops death loops and removes the bodyguard from enemies array.
   * @returns {void}
   */
  finishDeathFall() {
    this.stopFallIfRunning();
    this.stopDeathAnimIfRunning();
    this.removeFromWorld();
  },

  /**
   * Removes this bodyguard from world.level.enemies.
   * @returns {void}
   */
  removeFromWorld() {
    const enemies = this.world?.level?.enemies;
    if (!enemies) return;

    const i = enemies.indexOf(this);
    if (i > -1) enemies.splice(i, 1);
  }
};

//#endregion
