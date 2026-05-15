//#region ChickenSmall class

/**
 * @file models/chicken-small.class.js
 * @description
 * Small chicken (ChickenSmall) enemy object.
 * - Moves to the left
 * - Plays a walking animation
 * - Respects pause (this.isPaused / world.isPaused)
 */

/**
 * Small chicken (enemy).
 * @class
 * @extends MovableObject
 */
class ChickenSmall extends MovableObject {
  /** @type {number} */ y = 375;
  /** @type {number} */ height = 50;
  /** @type {number} */ width = 40;

  /** @type {boolean} */ isDead = false;

  /** @type {number|null} */ moveInterval = null;
  /** @type {number|null} */ animationInterval = null;

  /** @type {string[]} */
  IMAGES_WALKING = [
    'img/3_enemies_chicken/chicken_small/1_walk/1_w.png',
    'img/3_enemies_chicken/chicken_small/1_walk/2_w.png',
    'img/3_enemies_chicken/chicken_small/1_walk/3_w.png'
  ];

  /** @type {string} */
  IMAGE_DEAD = 'img/3_enemies_chicken/chicken_small/2_dead/dead.png';

  /**
   * Creates a ChickenSmall, sets random position/speed, and starts animation/movement.
   */
  constructor() {
    super().loadImage('img/3_enemies_chicken/chicken_small/1_walk/1_w.png');
    this.loadImages(this.IMAGES_WALKING);

    this.initSpawn();
    this.initMovementSpeed();
    this.animate();
  }

  /**
   * Sets a random X spawn position.
   * @returns {void}
   */
  initSpawn() {
    this.x = 500 + Math.random() * 3500;
  }

  /**
   * Sets a random walking speed.
   * @returns {void}
   */
  initMovementSpeed() {
    this.speed = 0.15 + Math.random() * 0.2;
  }

  /**
   * Starts movement and animation intervals.
   * @returns {void}
   */
  animate() {
    this.startMoveLoop();
    this.startAnimationLoop();
  }

  /**
   * Movement loop (60 FPS): moves left if not dead/paused.
   * @returns {void}
   */
  startMoveLoop() {
    this.moveInterval = setInterval(() => {
      if (this.shouldSkipTick()) return;
      this.moveLeft();
    }, 1000 / 60);
  }

  /**
   * Animation loop: plays walking frames if not dead/paused.
   * @returns {void}
   */
  startAnimationLoop() {
    this.animationInterval = setInterval(() => {
      if (this.shouldSkipTick()) return;
      this.playAnimation(this.IMAGES_WALKING);
    }, 200);
  }

  /**
   * Checks whether movement/animation should be skipped in this tick.
   * @returns {boolean} True if dead or paused.
   */
  shouldSkipTick() {
    if (this.isDead) return true;
    return this.isPaused || this.world?.isPaused;
  }
}

//#endregion
