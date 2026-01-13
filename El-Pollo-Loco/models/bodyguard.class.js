//#region Bodyguard class (orchestrator)

/**
 * @file bodyguard.class.js
 * @description Bodyguard class (orchestrator). The actual logic lives in mixins.
 */

class Bodyguard extends MovableObject {
  height = 180;
  width = 160;
  y = 150;

  energy = 100;
  isDead = false;
  isJumping = false;
  hasJumped = false;

  jumpInterval = null;
  attackInterval = null;
  fallInterval = null;
  deathAnimInterval = null;

  lastSpeedX = 0;
  lastDirection = false; // false = right, true = left

  constructor() {
    super();

    // Assets (from bodyguard.assets.js)
    Object.assign(this, window.BodyguardAssets);

    this.initPosition();
    this.initPhysics();
    this.preloadAssets();

    // Sounds (from bodyguard.sounds.js)
    this.initSounds();
  }

  initPosition() {
    this.x = 4700;
    this.loadImage(this.IMAGE);
  }

  initPhysics() {
    this.applyGravity();
  }

  preloadAssets() {
    this.loadImages(this.IMAGES_JUMP_START);
    this.loadImages(this.IMAGES_JUMP_UP);
    this.loadImages(this.IMAGES_JUMP_HOVER);
    this.loadImages(this.IMAGES_LAND);
    this.loadImages(this.IMAGES_WALK);
    this.loadImages(this.IMAGES_HURT);
    this.loadImages(this.IMAGES_DEAD);
  }

  get collisionBox() {
    return {
      x: this.x + 15,
      y: this.y + 30,
      width: this.width - 25,
      height: this.height - 40
    };
  }

  pause() {
    this.stopAllIntervals();
  }

  resume() {
    if (this.isDead || this.isJumping) return;
    this.speedX = this.lastSpeedX;
    this.otherDirection = this.lastDirection;
    this.startAttackLoop();
  }
}

//#endregion

//#region Attach mixins

// Attach mixins (order does not matter as long as the methods exist)
Object.assign(Bodyguard.prototype, window.BodyguardSounds);
Object.assign(Bodyguard.prototype, window.BodyguardJump);
Object.assign(Bodyguard.prototype, window.BodyguardAttack);
Object.assign(Bodyguard.prototype, window.BodyguardDamageDeath);

//#endregion
