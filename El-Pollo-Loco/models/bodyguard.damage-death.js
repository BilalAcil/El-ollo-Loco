/**
 * @file bodyguard.damage-death.js
 * @description Hit/Death/Fall/Remove als Mixin.
 */

window.BodyguardDamageDeath = {
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

  stopAttackForHit() {
    this.resetAttackInterval();
    this.saveMotionState();
    this.speedX = 0;
  },

  saveMotionState() {
    this.lastDirection = this.otherDirection;
    this.lastSpeedX = this.speedX;
  },

  applyDamage(amount) {
    this.energy -= amount;
  },

  updateStatusBar() {
    this.world?.bodyguardStatus?.setPercentage(this.energy);
  },

  handleDeath() {
    this.world?.onBodyguardDeath?.();
    this.die();
  },

  applyHitFallbackMovement() {
    const player = this.world?.character;
    if (!player) return;

    const playerRight = player.x > this.x;
    this.otherDirection = !playerRight;
    this.speedX = playerRight ? 5 : -5;
  },

  playHurtAnimationThenResume() {
    const total = this.IMAGES_HURT.length * 2;
    let frames = 0;

    const intv = setInterval(() => {
      this.playAnimation(this.IMAGES_HURT);
      if (++frames >= total) return this.endHurt(intv);
    }, 100);
  },

  endHurt(intervalId) {
    clearInterval(intervalId);
    this.startAttackLoop();
  },

  die() {
    if (this.isDead) return;

    this.isDead = true;
    this.clearStatusBar();
    this.stopAllIntervals();

    this.speedX = 0;
    this.playDieSoundDelayed(200);
    this.startFallingWhenDead();
  },

  clearStatusBar() {
    if (this.world?.bodyguardStatus) this.world.bodyguardStatus = null;
  },

  stopAllIntervals() {
    this.resetAttackInterval();
    this.stopJumpIfRunning();
    this.stopFallIfRunning();
    this.stopDeathAnimIfRunning();
  },

  stopJumpIfRunning() {
    if (!this.jumpInterval) return;
    clearInterval(this.jumpInterval);
    this.jumpInterval = null;
  },

  stopFallIfRunning() {
    if (!this.fallInterval) return;
    clearInterval(this.fallInterval);
    this.fallInterval = null;
  },

  stopDeathAnimIfRunning() {
    if (!this.deathAnimInterval) return;
    clearInterval(this.deathAnimInterval);
    this.deathAnimInterval = null;
  },

  playDieSoundDelayed(ms) {
    setTimeout(() => {
      if (this.isDead) this.playDieSound();
    }, ms);
  },

  startFallingWhenDead() {
    if (this.fallInterval) return;
    this.startDeathAnimLoop();
    this.startFallLoop();
  },

  startDeathAnimLoop() {
    this.deathAnimInterval = setInterval(() => {
      this.playAnimation(this.IMAGES_DEAD);
    }, 200);
  },

  startFallLoop() {
    let fallSpeed = 0;

    this.fallInterval = setInterval(() => {
      if (this.isGamePaused()) return;

      fallSpeed += 0.5;
      this.y += fallSpeed;

      if (this.y > 600) this.finishDeathFall();
    }, 1000 / 30);
  },

  isGamePaused() {
    return this.isPaused || this.world?.isPaused;
  },

  finishDeathFall() {
    this.stopFallIfRunning();
    this.stopDeathAnimIfRunning();
    this.removeFromWorld();
  },

  removeFromWorld() {
    const enemies = this.world?.level?.enemies;
    if (!enemies) return;

    const i = enemies.indexOf(this);
    if (i > -1) enemies.splice(i, 1);
  }
};
