//#region Bodyguard class (orchestrator)

/**
 * @file bodyguard.class.js
 * @description Bodyguard orchestrator. Core setup + delegates behavior to mixins.
 */

/**
 * Bodyguard enemy (gatekeeper before the endboss).
 * Mixins provide: sounds, jump logic, attack patrol, damage/death handling.
 * @class
 * @extends MovableObject
 */
class Bodyguard extends MovableObject {
  /** @type {number} */ height = 180;
  /** @type {number} */ width = 160;
  /** @type {number} */ y = 150;

  /** @type {number} */ energy = 100;
  /** @type {boolean} */ isDead = false;
  /** @type {boolean} */ isJumping = false;
  /** @type {boolean} */ hasJumped = false;

  /** @type {number|null} */ jumpInterval = null;
  /** @type {number|null} */ attackInterval = null;
  /** @type {number|null} */ fallInterval = null;
  /** @type {number|null} */ deathAnimInterval = null;

  /** @type {number} */ lastSpeedX = 0;
  /** @type {boolean} */ lastDirection = false; // false=right, true=left

  /**
   * Creates the bodyguard, attaches assets, preloads images and initializes physics/sounds.
   */
  constructor() {
    super();

    // asset constants (bodyguard.assets.js)
    Object.assign(this, window.BodyguardAssets);

    this.initPosition();
    this.initPhysics();
    this.preloadAssets();

    // sounds (bodyguard.sounds.js)
    this.initSounds();
  }

  /**
   * Sets start position and initial sprite.
   * @returns {void}
   */
  initPosition() {
    this.x = 4700;
    this.loadImage(this.IMAGE);
  }

  /**
   * Starts gravity handling for the bodyguard.
   * @returns {void}
   */
  initPhysics() {
    this.applyGravity();
  }

  /**
   * Preloads all animation image arrays into cache.
   * @returns {void}
   */
  preloadAssets() {
    this.loadImages(this.IMAGES_JUMP_START);
    this.loadImages(this.IMAGES_JUMP_UP);
    this.loadImages(this.IMAGES_JUMP_HOVER);
    this.loadImages(this.IMAGES_LAND);
    this.loadImages(this.IMAGES_WALK);
    this.loadImages(this.IMAGES_HURT);
    this.loadImages(this.IMAGES_DEAD);
  }

  /**
   * Reduced hitbox for fair collisions.
   * @returns {{x:number,y:number,width:number,height:number}}
   */
  get collisionBox() {
    return {
      x: this.x + 15,
      y: this.y + 30,
      width: this.width - 25,
      height: this.height - 40
    };
  }

  /**
   * Pauses all bodyguard-related loops (provided by mixins).
   * @returns {void}
   */
  pause() {
    this.stopAllIntervals();
  }

  /**
   * Resumes patrol/attack if possible (not dead, not mid-jump).
   * Restores last speed/direction and restarts attack loop.
   * @returns {void}
   */
  resume() {
    if (this.isDead || this.isJumping) return;
    this.speedX = this.lastSpeedX;
    this.otherDirection = this.lastDirection;
    this.startAttackLoop();
  }
}

//#endregion

//#region Attach mixins

/**
 * Attaches mixins to the Bodyguard prototype.
 * Order does not matter as long as required methods exist.
 */
Object.assign(Bodyguard.prototype, window.BodyguardSounds);
Object.assign(Bodyguard.prototype, window.BodyguardJump);
Object.assign(Bodyguard.prototype, window.BodyguardAttack);
Object.assign(Bodyguard.prototype, window.BodyguardDamageDeath);

//#endregion
