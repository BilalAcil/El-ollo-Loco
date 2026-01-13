//#region SalsaThrow class

/**
 * @file models/salsa-throw.class.js
 * @description
 * Throw projectile (salsa bottle). Flies with ballistics, rotates in the air and
 * plays a splash animation on impact.
 */

/**
 * Salsa throw projectile.
 * @class
 * @extends MovableObject
 */
class SalsaThrow extends MovableObject {
  /** @type {number} */
  width = 50;

  /** @type {number} */
  height = 50;

  /** Initial horizontal speed. @type {number} */
  speedX = 8;

  /** Initial vertical speed. @type {number} */
  speedY = 10;

  /** Vertical acceleration (gravity for the projectile). @type {number} */
  acceleration = 0.45;

  /**
   * Throw direction: true = left, false = right.
   * @type {boolean}
   */
  direction;

  /** Hit flag (prevents multiple ground hits). @type {boolean} */
  hasHit = false;

  /** Rotation frames. @type {string[]} */
  IMAGES_ROTATION = [
    'img/6_salsa_bottle/bottle_rotation/1_bottle_rotation.png',
    'img/6_salsa_bottle/bottle_rotation/2_bottle_rotation.png',
    'img/6_salsa_bottle/bottle_rotation/3_bottle_rotation.png',
    'img/6_salsa_bottle/bottle_rotation/4_bottle_rotation.png'
  ];

  /** Splash frames after impact. @type {string[]} */
  IMAGES_SPLASH = [
    'img/6_salsa_bottle/bottle_rotation/bottle_splash/1_bottle_splash.png',
    'img/6_salsa_bottle/bottle_rotation/bottle_splash/2_bottle_splash.png',
    'img/6_salsa_bottle/bottle_rotation/bottle_splash/3_bottle_splash.png',
    'img/6_salsa_bottle/bottle_rotation/bottle_splash/4_bottle_splash.png',
    'img/6_salsa_bottle/bottle_rotation/bottle_splash/5_bottle_splash.png'
  ];

  /**
   * @param {number} x - Start X position.
   * @param {number} y - Start Y position.
   * @param {boolean} direction - true = left, false = right.
   */
  constructor(x, y, direction) {
    super().loadImage(this.IMAGES_ROTATION[0]);
    this.loadImages(this.IMAGES_ROTATION);
    this.loadImages(this.IMAGES_SPLASH);

    this.setStartPosition(x, y, direction);
    this.initSounds();
    this.throw();
  }

  //#region Setup

  /**
   * Sets start position and direction.
   * @param {number} x
   * @param {number} y
   * @param {boolean} direction - true = left, false = right.
   * @returns {void}
   */
  setStartPosition(x, y, direction) {
    this.x = x;
    this.y = y;
    this.direction = direction;
  }

  /**
   * Initializes audio elements for rotation and impact.
   * @returns {void}
   */
  initSounds() {
    /** @type {HTMLAudioElement} */
    this.rotationSound = new Audio('audio/throw-sound-2.mp3');
    this.rotationSound.volume = 0.4;

    /** @type {HTMLAudioElement} */
    this.hitSound = new Audio('audio/hit-sound.mp3');
    this.hitSound.volume = 0.5;
  }

  //#endregion

  //#region Throw loop

  /**
   * Starts the throw: sound + movement and rotation loops.
   * @returns {void}
   */
  throw() {
    this.playRotationSound();
    this.startMoveLoop();
    this.startRotationLoop();
  }

  /**
   * Plays the rotation sound.
   * @returns {void}
   */
  playRotationSound() {
    this.rotationSound.currentTime = 0;
    this.rotationSound.play().catch(e => console.warn('Rotation sound error:', e));
  }

  /**
   * Starts the movement loop (ballistics).
   * @returns {void}
   */
  startMoveLoop() {
    this.moveInterval = setInterval(() => this.tickMove(), 25);
  }

  /**
   * One movement tick: update X/Y and check ground contact.
   * @returns {void}
   */
  tickMove() {
    this.moveX();
    this.moveY();
    if (this.isGroundHit()) this.onGroundHit();
  }

  /**
   * Moves the projectile horizontally with slight damping.
   * @returns {void}
   */
  moveX() {
    this.x += this.direction ? -this.speedX : this.speedX;
    this.speedX *= 0.99;
  }

  /**
   * Moves the projectile vertically (parabola).
   * @returns {void}
   */
  moveY() {
    this.y -= this.speedY;
    this.speedY -= this.acceleration;
  }

  //#endregion

  //#region Ground hit + splash

  /**
   * Checks if the ground was reached (and no hit happened yet).
   * @returns {boolean}
   */
  isGroundHit() {
    return this.y >= 380 && !this.hasHit;
  }

  /**
   * Handles ground hit: set flag, play sound, start splash.
   * @returns {void}
   */
  onGroundHit() {
    this.hasHit = true;
    this.playHitSound();
    this.splashAnimation();
  }

  /**
   * Plays the hit sound.
   * @returns {void}
   */
  playHitSound() {
    this.hitSound.currentTime = 0;
    this.hitSound.play().catch(e => console.warn('Hit sound error:', e));
  }

  /**
   * Starts the rotation animation.
   * @returns {void}
   */
  startRotationLoop() {
    this.rotationInterval = setInterval(() => {
      this.playAnimation(this.IMAGES_ROTATION);
    }, 50);
  }

  /**
   * Stops the rotation sound (e.g. on impact).
   * @returns {void}
   */
  stopSound() {
    if (!this.rotationSound) return;
    this.rotationSound.pause();
    this.rotationSound.currentTime = 0;
  }

  /**
   * Starts the splash animation and stops movement/rotation.
   * An optional callback is executed after the splash.
   * @param {Function} [callback] - Called after the splash finishes.
   * @returns {void}
   */
  splashAnimation(callback) {
    this.stopSound();
    this.stopIntervals();
    this.resetSpeeds();
    this.playSplashFrames(callback);
  }

  /**
   * Stops move and rotation intervals.
   * @returns {void}
   */
  stopIntervals() {
    clearInterval(this.moveInterval);
    clearInterval(this.rotationInterval);
  }

  /**
   * Resets speeds to 0 (after impact).
   * @returns {void}
   */
  resetSpeeds() {
    this.speedY = 0;
    this.speedX = 0;
  }

  /**
   * Plays the splash frames sequentially.
   * @param {Function} [callback]
   * @returns {void}
   */
  playSplashFrames(callback) {
    let i = 0;
    const id = setInterval(() => {
      this.loadImage(this.IMAGES_SPLASH[i++]);
      if (i >= this.IMAGES_SPLASH.length) this.finishSplash(id, callback);
    }, 100);
  }

  /**
   * Finishes the splash animation: make invisible and run callback.
   * @param {number} intervalId - Interval id of the splash loop.
   * @param {Function} [callback]
   * @returns {void}
   */
  finishSplash(intervalId, callback) {
    clearInterval(intervalId);
    setTimeout(() => {
      this.loadImage('');
      this.width = 0;
      this.height = 0;
      if (callback) callback();
    }, 200);
  }

  //#endregion
}

//#endregion
