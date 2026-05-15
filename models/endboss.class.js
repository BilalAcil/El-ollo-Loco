//#region Endboss class

/**
 * @file models/endboss.class.js
 * @description
 * Endboss (boss chicken) with idle/hurt/dead animations, activation on hit,
 * falling animation after death, and world interactions (kill bodyguard, spawn maracas).
 */

/**
 * Endboss enemy.
 * @class
 * @extends MovableObject
 */
class Endboss extends MovableObject {
  /** @type {number} */ height = 170;
  /** @type {number} */ width = 130;
  /** @type {number} */ y = 280;

  /**
   * Controls whether the boss is briefly in a "hurt/awake" animation state.
   * @type {boolean}
   */
  isActivated = false;

  /** Boss health points. @type {number} */
  energy = 100;

  /** Whether the boss is dead. @type {boolean} */
  isDead = false;

  /** Whether the boss is paused. @type {boolean} */
  isPaused = false;

  /** Prevents duplicate onDeath events. @type {boolean} */
  isDeadHandled = false;

  /** Current falling speed (for falling physics). @type {number} */
  fallSpeed = 0;

  /** Interval handle for animation. @type {number|undefined} */
  animationInterval;

  /** Interval handle for falling. @type {number|undefined} */
  fallInterval;

  /**
   * Images for idle animation.
   * @type {string[]}
   */
  IMAGES_IDLE = [
    'img/4_enemie_boss_chicken/6_idle/1_Chicken_Idle.png',
    'img/4_enemie_boss_chicken/6_idle/1_z_Chicken_Idle.png',
    'img/4_enemie_boss_chicken/6_idle/2_z_Chicken_Idle.png',
    'img/4_enemie_boss_chicken/6_idle/3_z_Chicken_Idle.png'
  ];

  /**
   * Images for hurt/awake animation (after being hit).
   * @type {string[]}
   */
  IMAGES_HURT = [
    'img/4_enemie_boss_chicken/awake/1_Chicken_awake.png',
    'img/4_enemie_boss_chicken/awake/2_Chicken_awake.png',
    'img/4_enemie_boss_chicken/awake/3_Chicken_awake.png',
    'img/4_enemie_boss_chicken/awake/4_Chicken_awake.png'
  ];

  /**
   * Images for death animation.
   * @type {string[]}
   */
  IMAGES_DEAD = [
    'img/4_enemie_boss_chicken/5_dead/G24.png',
    'img/4_enemie_boss_chicken/5_dead/G25.png',
    'img/4_enemie_boss_chicken/5_dead/G26.png'
  ];

  /**
   * Creates the endboss, preloads assets, sets the start position, and starts animation.
   */
  constructor() {
    super().loadImage(this.IMAGES_IDLE[0]);
    this.preloadAssets();
    this.initPosition();
    this.animate();
  }

  /**
   * Preloads all animation assets (idle/hurt/dead) into the cache.
   * @returns {void}
   */
  preloadAssets() {
    this.loadImages(this.IMAGES_IDLE);
    this.loadImages(this.IMAGES_HURT);
    this.loadImages(this.IMAGES_DEAD);
  }

  /**
   * Sets the endboss start position.
   * @returns {void}
   */
  initPosition() {
    this.x = 4500;
  }

  /**
   * Starts the animation loop.
   * - Dead -> IMAGES_DEAD
   * - Activated -> IMAGES_HURT
   * - Otherwise -> IMAGES_IDLE
   * @returns {void}
   */
  animate() {
    this.animationInterval = setInterval(() => {
      if (this.isGamePaused()) return;
      this.playCurrentAnimation();
    }, 400);
  }

  /**
   * Checks whether the boss or the world is paused.
   * @returns {boolean}
   */
  isGamePaused() {
    return this.isPaused || this.world?.isPaused;
  }

  /**
   * Plays the correct animation based on the current state.
   * @returns {void}
   */
  playCurrentAnimation() {
    if (this.isDead) return this.playAnimation(this.IMAGES_DEAD);
    if (this.isActivated) return this.playAnimation(this.IMAGES_HURT);
    this.playAnimation(this.IMAGES_IDLE);
  }

  /**
   * Starts the falling animation after death (only once).
   * @returns {void}
   */
  startFallingWhenDead() {
    if (this.fallInterval) return;
    this.fallSpeed = 0;
    this.fallInterval = setInterval(() => this.tickFall(), 1000 / 30);
  }

  /**
   * Tick for falling physics.
   * @returns {void}
   */
  tickFall() {
    if (this.isGamePaused()) return;
    if (!this.isDead) return;

    this.applyFallStep();
    if (this.y > 600) this.finishFall();
  }

  /**
   * Applies one falling physics step.
   * @returns {void}
   */
  applyFallStep() {
    this.fallSpeed += 0.5;
    this.y += this.fallSpeed;
  }

  /**
   * Finishes falling and removes the endboss from the world.
   * @returns {void}
   */
  finishFall() {
    clearInterval(this.fallInterval);
    this.fallInterval = null;
    this.removeFromWorld();
  }

  /**
   * Removes the endboss from `world.level.enemies`.
   * @returns {void}
   */
  removeFromWorld() {
    const enemies = this.world?.level?.enemies;
    if (!enemies) return;

    const index = enemies.indexOf(this);
    if (index > -1) enemies.splice(index, 1);
  }

  /**
   * Called when the endboss dies (only once).
   * - Optionally kills the bodyguard
   * - Spawns maracas after a short delay
   * @returns {void}
   */
  onDeath() {
    if (this.isDeadHandled) return;
    this.isDeadHandled = true;

    this.killBodyguardIfAlive();
    this.spawnMaracasIfMissing(800);
  }

  /**
   * Kills the bodyguard if it exists and is still alive.
   * @returns {void}
   */
  killBodyguardIfAlive() {
    const bg = this.world?.bodyguard;
    if (bg && !bg.isDead) bg.die();
  }

  /**
   * Spawns maracas if they do not exist yet.
   * @param {number} delayMs - Delay in ms until spawn.
   * @returns {void}
   */
  spawnMaracasIfMissing(delayMs) {
    if (this.world?.maracas) return;
    setTimeout(() => {
      if (this.world && !this.world.maracas) this.world.maracas = new Maracas();
    }, delayMs);
  }

  /**
   * Briefly activates the hurt animation (e.g. after being hit).
   * @returns {void}
   */
  activate() {
    if (this.isActivated || this.isDead) return;
    this.isActivated = true;
    setTimeout(() => (this.isActivated = false), 1000);
  }

  /**
   * Endboss collision box (hitbox slightly shifted down).
   * @returns {{x:number,y:number,width:number,height:number}}
   */
  get collisionBox() {
    return {
      x: this.x,
      y: this.y + 30,
      width: this.width,
      height: this.height - 30
    };
  }

  /**
   * Optionally draws the hitbox (transparent here).
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context.
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
   * Pauses the endboss (animation/fall respect `isPaused`).
   * @returns {void}
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Clears the paused state.
   * @returns {void}
   */
  resume() {
    this.isPaused = false;
  }
}

//#endregion
