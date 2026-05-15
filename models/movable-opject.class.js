//#region MovableObject base class

/**
 * @file models/movable-object.class.js
 * @description
 * Base class for all movable objects (physics, collisions, movement, damage, animation).
 * Extends {@link DrawableObject}.
 */

/**
 * Movable object in the game (e.g. character, enemies, items).
 * @class
 * @extends DrawableObject
 */
class MovableObject extends DrawableObject {
  /** Horizontal speed. @type {number} */
  speed = 0.15;

  /** Facing/movement direction (true = left). @type {boolean} */
  otherDirection = false;

  /** Vertical speed (jump/gravity). @type {number} */
  speedY = 0;

  /** Gravity acceleration. @type {number} */
  acceleration = 2.0;

  /** Health energy (0–100). @type {number} */
  energy = 100;

  /** Timestamp of the last hit (ms). @type {number} */
  lastHit = 0;

  /** Jump sound. @type {HTMLAudioElement} */
  jumpSound = new Audio('audio/jump.mp3');

  /** Pain sound. @type {HTMLAudioElement} */
  painSound = new Audio('audio/pain.mp3');

  /** Last time the pain sound was played. @type {number} */
  lastPainSoundTime = 0;

  /** Gravity interval handle. @type {number|null} */
  gravityInterval = null;

  /**
   * Starts the gravity loop.
   * Updates y position and speedY at fixed intervals.
   * @returns {void}
   */
  applyGravity() {
    if (this.gravityInterval) return; // ✅ already running

    this.gravityInterval = setInterval(() => {
      if (this.isPaused) return; // ✅ optional, but very useful
      if (!this.isAboveGround() && this.speedY <= 0) return;

      this.y -= this.speedY;
      this.speedY -= this.acceleration;
    }, 1000 / 25);
  }

  /**
   * Stops the gravity loop.
   * @returns {void}
   */
  stopGravity() {
    clearInterval(this.gravityInterval);
    this.gravityInterval = null;
  }

  /**
   * Checks whether the object is above the ground.
   * @returns {boolean}
   */
  isAboveGround() {
    return this.y < 150;
  }

  /**
   * Checks whether the object is clearly falling (e.g. for stomp checks).
   * @returns {boolean}
   */
  isFalling() {
    return this.speedY < -2;
  }

  /**
   * Checks collision with another {@link MovableObject}.
   * Uses collisionBox (if present), otherwise x/y/width/height.
   * @param {MovableObject} mo - Target object.
   * @returns {boolean}
   */
  isColliding(mo) {
    const a = this.getCollisionBox(this);
    const b = this.getCollisionBox(mo);
    return this.boxesOverlap(a, b);
  }

  /**
   * Returns the collision box for an object.
   * @param {MovableObject} obj - Object with optional collisionBox.
   * @returns {{x:number, y:number, width:number, height:number}}
   */
  getCollisionBox(obj) {
    return obj.collisionBox || { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
  }

  /**
   * Checks whether two axis-aligned bounding boxes overlap.
   * @param {{x:number, y:number, width:number, height:number}} a
   * @param {{x:number, y:number, width:number, height:number}} b
   * @returns {boolean}
   */
  boxesOverlap(a, b) {
    return (
      a.x + a.width > b.x &&
      a.x < b.x + b.width &&
      a.y + a.height > b.y &&
      a.y < b.y + b.height
    );
  }

  /**
   * Applies default damage (20) and triggers pain sound + death handling.
   * @returns {void}
   */
  hit() {
    this.applyDamage(20);
    this.playPainSoundWithCooldown(1300);
    this.stopCountdownIfDead();
  }

  /**
   * Subtracts energy and sets lastHit as long as the object is still alive.
   * @param {number} amount - Damage amount.
   * @returns {void}
   */
  applyDamage(amount) {
    this.energy = Math.max(0, this.energy - amount);
    if (this.energy > 0) this.lastHit = Date.now();
  }

  /**
   * Plays the pain sound with a cooldown to prevent sound spam.
   * @param {number} ms - Cooldown in milliseconds.
   * @returns {void}
   */
  playPainSoundWithCooldown(ms) {
    const now = Date.now();
    if (this.lastPainSoundTime && now - this.lastPainSoundTime < ms) return;

    this.lastPainSoundTime = now;
    this.painSound.currentTime = 0;
    this.painSound.playbackRate = 1.2;
    this.painSound.volume = 0.6;
    this.painSound.play().catch(e => console.warn(e));
  }

  /**
   * Stops the countdown if this object is dead (energy <= 0).
   * @returns {void}
   */
  stopCountdownIfDead() {
    if (this.energy > 0) return;
    this.world?.countdown?.stopCountdown();
  }

  /**
   * Checks whether the object was hit recently (within 1 second).
   * @returns {boolean}
   */
  isHurt() {
    let timePassed = Date.now() - this.lastHit;
    timePassed = timePassed / 1000;
    return timePassed < 1;
  }

  /**
   * Checks whether the object is dead.
   * @returns {boolean}
   */
  isDead() {
    return this.energy <= 0;
  }

  /**
   * Plays a sprite animation based on an image array.
   * @param {string[]} images - Array of image paths.
   * @returns {void}
   */
  playAnimation(images) {
    const i = this.currentImage % images.length;
    const path = images[i];
    this.img = this.imageCache[path];
    this.currentImage++;
  }

  /**
   * Moves the object to the right.
   * @returns {void}
   */
  moveRight() {
    this.x += this.speed;
  }

  /**
   * Moves the object to the left.
   * @returns {void}
   */
  moveLeft() {
    this.x -= this.speed;
  }

  /**
   * Makes the object jump and plays the jump sound.
   * In the endboss area the jump is higher.
   * @returns {void}
   */
  jump() {
    this.speedY = this.atEndboss ? 25 : 20;

    this.jumpSound.currentTime = 0;
    this.jumpSound.playbackRate = 1.5;
    this.jumpSound.volume = 0.6;
    this.jumpSound.play().catch(e => console.warn(e));
  }
}

//#endregion
