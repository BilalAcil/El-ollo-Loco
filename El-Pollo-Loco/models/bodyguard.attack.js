//#region Bodyguard attack mixin

/**
 * @file bodyguard.attack.js
 * @description Patrol/attack loop as a mixin.
 * Adds movement + turn-around behavior for the Bodyguard after the first jump.
 */

window.BodyguardAttack = {
  /**
   * Starts the patrol/attack loop (only after the first jump happened).
   * Resets any previous interval and restores speed/direction before starting.
   * @returns {void}
   */
  startAttackLoop() {
    if (!this.hasJumped) return;
    this.resetAttackInterval();
    this.restoreAttackState();
    this.attackInterval = setInterval(() => this.stepAttack(), 60);
  },

  /**
   * Stops the active attack interval (if any).
   * @returns {void}
   */
  resetAttackInterval() {
    if (!this.attackInterval) return;
    clearInterval(this.attackInterval);
    this.attackInterval = null;
  },

  /**
   * Restores speed/direction from last known values (fallbacks included).
   * @returns {void}
   */
  restoreAttackState() {
    this.speedX = this.lastSpeedX !== 0 ? this.lastSpeedX : (this.speedX || -15);
    this.otherDirection = this.lastDirection ?? this.otherDirection ?? false;
  },

  /**
   * One attack tick: animate walking, move, handle bounds, remember state.
   * @returns {void}
   */
  stepAttack() {
    this.playAnimation(this.IMAGES_WALK);
    this.x += this.speedX;
    this.handleAttackBounds();
    this.rememberAttackState();
  },

  /**
   * Checks patrol bounds and triggers a turn-around with a short stop.
   * @returns {void}
   */
  handleAttackBounds() {
    if (this.x <= 3780) return this.turnAroundAfterStop(true, +15);
    if (this.x >= 4330) return this.turnAroundAfterStop(false, -15);
  },

  /**
   * Stops briefly, then flips direction and sets new speed (unless dead).
   * @param {boolean} direction - true = left, false = right
   * @param {number} speed - new horizontal speed after the stop
   * @returns {void}
   */
  turnAroundAfterStop(direction, speed) {
    this.speedX = 0;

    // short "stop" at the boundary
    setTimeout(() => {
      if (this.isDead) return;
      this.otherDirection = direction;
      this.speedX = speed;
    }, 200);
  },

  /**
   * Remembers current movement values so resume/restore can continue smoothly.
   * @returns {void}
   */
  rememberAttackState() {
    this.lastSpeedX = this.speedX;
    this.lastDirection = this.otherDirection;
  }
};

//#endregion
