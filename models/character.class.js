//#region Character class

/**
 * @file models/character.class.js
 * @description
 * Base class for the player character (Pepe).
 * Contains only the "core state" + initialization.
 *
 * Split logic lives in:
 * - models/character.assets.js (applyAssetsToCharacter)
 * - models/character.movement.js (startMovementLoop, tickMovement, etc.)
 * - models/character.animation.js (startAnimationLoop, tickAnimation, etc.)
 * - models/character.gravity.js (applyGravity, etc.)
 * - models/character.combat.js (hit, playDeathAnimation, throwAnimation, etc.)
 */

/**
 * Player character (Pepe).
 * @class
 * @extends MovableObject
 */
class Character extends MovableObject {
  /** @type {World} */
  world;

  /** @type {boolean} */
  isDying = false;

  /** @type {string} */
  currentAnimation = 'idle';

  /** @type {boolean} */
  animationFinished = true;

  /** @type {boolean} */
  isThrowing = false;

  /** @type {number} */
  lastActionTime = 0;

  /** @type {number} */
  actionCooldown = 500;

  /** @type {number} */
  pauseStartTime = 0;

  /** @type {number} */
  totalPausedTime = 0;

  /**
   * Creates the character and initializes assets, physics, state, sounds, and the idle system.
   */
  constructor() {
    super().loadImage('img/2_character_pepe/1_idle/idle/I-1.png');
    applyAssetsToCharacter(this);

    this.initImages();
    this.initPhysics();
    this.initState();
    this.initSounds();
    this.initIdleSystem();
    this.animate();
  }

  /**
   * Loads all required sprite assets (idle/walk/jump/throw/hurt/dead/long-idle).
   * @returns {void}
   */
  initImages() {
    this.loadImages(this.IMAGES_IDLE);
    this.loadImages(this.IMAGES_THROW);
    this.loadImages(this.IMAGES_WALKING);
    this.loadImages(this.IMAGES_JUMPING);
    this.loadImages(this.IMAGES_FALLING);
    this.loadImages(this.IMAGES_DEAD);
    this.loadImages(this.IMAGES_HURT);
    this.loadImages(this.IMAGES_LONG_IDLE);
  }

  /**
   * Initializes physics (gravity comes from character.gravity.js).
   * @returns {void}
   */
  initPhysics() {
    this.applyGravity();
  }

  /**
   * Initializes game state/flags.
   * @returns {void}
   */
  initState() {
    this.atEndboss = false;
    this.lastGlobalHit = 0;
  }

  /**
   * Initializes character sounds (e.g. throw sound).
   * @returns {void}
   */
  initSounds() {
    this.throwSound = new Audio('audio/throw-sound-1.mp3');
    this.throwSound.volume = 0.4;
  }

  /**
   * Initializes the idle system (timers + flags for idle/long-idle).
   * @returns {void}
   */
  initIdleSystem() {
    this.showIdle = false;
    this.lastMoveTime = Date.now();
    this.idleAnimationStarted = false;
    this.longIdleActive = false;
    this.longIdleInterval = null;
  }

  /**
   * Character collision box (smaller than the sprite).
   * @returns {{x:number,y:number,width:number,height:number}}
   */
  get collisionBox() {
    return {
      x: this.x + 25,
      y: this.y + 95,
      width: this.width - 60,
      height: this.height - 110
    };
  }

  /**
   * Checks whether the character is above the ground.
   * @returns {boolean} True if y is smaller than the ground level.
   */
  isAboveGround() {
    return this.y < 155;
  }

  /**
   * Optionally draws the hitbox (currently transparent).
   * @param {CanvasRenderingContext2D} ctx - Canvas context.
   * @returns {void}
   */
  drawFrame(ctx) {
    const box = this.collisionBox;
    ctx.beginPath();
    ctx.lineWidth = "1";
    ctx.strokeStyle = "transparent";
    ctx.rect(box.x - this.x, box.y - this.y, box.width, box.height);
    ctx.stroke();
  }

  /**
   * Starts movement and animation loops.
   * Implementations live in character.movement.js / character.animation.js.
   * @returns {void}
   */
  animate() {
    this.startMovementLoop();
    this.startAnimationLoop();
  }

  /**
   * Pauses the character (loops react via isPaused).
   * @returns {void}
   */
  pause() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.pauseStartTime = Date.now();
  }

  /**
   * Resumes the character and compensates pause time for idle timers.
   * @returns {void}
   */
  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.applyPauseTimeCompensation();
  }

  /**
   * Shifts lastMoveTime by the pause duration so idle/long-idle stays accurate.
   * @returns {void}
   */
  applyPauseTimeCompensation() {
    if (!this.pauseStartTime) return;
    this.lastMoveTime += Date.now() - this.pauseStartTime;
  }
}

//#endregion
