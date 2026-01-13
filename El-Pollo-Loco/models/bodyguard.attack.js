//#region Bodyguard attack mixin

/**
 * @file bodyguard.attack.js
 * @description Patrol/attack loop as a mixin.
 */

window.BodyguardAttack = {
  startAttackLoop() {
    if (!this.hasJumped) return;
    this.resetAttackInterval();
    this.restoreAttackState();
    this.attackInterval = setInterval(() => this.stepAttack(), 60);
  },

  resetAttackInterval() {
    if (!this.attackInterval) return;
    clearInterval(this.attackInterval);
    this.attackInterval = null;
  },

  restoreAttackState() {
    this.speedX = this.lastSpeedX !== 0 ? this.lastSpeedX : (this.speedX || -15);
    this.otherDirection = this.lastDirection ?? this.otherDirection ?? false;
  },

  stepAttack() {
    this.playAnimation(this.IMAGES_WALK);
    this.x += this.speedX;
    this.handleAttackBounds();
    this.rememberAttackState();
  },

  handleAttackBounds() {
    if (this.x <= 3780) return this.turnAroundAfterStop(true, +15);
    if (this.x >= 4330) return this.turnAroundAfterStop(false, -15);
  },

  turnAroundAfterStop(direction, speed) {
    this.speedX = 0;

    // Delay the direction switch to create a short "stop" at the boundary.
    setTimeout(() => {
      if (this.isDead) return;
      this.otherDirection = direction;
      this.speedX = speed;
    }, 200);
  },

  rememberAttackState() {
    this.lastSpeedX = this.speedX;
    this.lastDirection = this.otherDirection;
  }
};

//#endregion
