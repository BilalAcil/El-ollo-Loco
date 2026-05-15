//#region Cloud class

/**
 * @file models/cloud.class.js
 * @description
 * Cloud is a background object that constantly drifts to the left.
 * Respects pause (this.isPaused / world.isPaused), if available.
 */

/**
 * Background cloud.
 * @class
 * @extends MovableObject
 */
class Cloud extends MovableObject {
  /** @type {number} */ y = 20 + Math.random() * 50;
  /** @type {number} */ width = 900;
  /** @type {number} */ height = 300;

  /** @type {number|null} */ moveInterval = null;

  /**
   * Creates a Cloud at position x and starts movement.
   * @param {number} [x=0] - Starting X position.
   */
  constructor(x = 0) {
    super().loadImage('img/5_background/layers/4_clouds/1.png');
    this.x = x;
    this.speed = 0.2;
    this.animate();
  }

  /**
   * Starts the cloud movement.
   * @returns {void}
   */
  animate() {
    this.startMoveLoop();
  }

  /**
   * Starts the interval that moves the cloud to the left (60 FPS).
   * @returns {void}
   */
  startMoveLoop() {
    this.moveInterval = setInterval(() => {
      if (this.shouldSkipTick()) return;
      this.x -= this.speed;
    }, 1000 / 60);
  }

  /**
   * Checks whether movement should be skipped in this tick.
   * @returns {boolean} True if paused.
   */
  shouldSkipTick() {
    return this.isPaused || this.world?.isPaused;
  }
}

//#endregion
