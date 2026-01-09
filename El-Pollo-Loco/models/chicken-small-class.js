/**
 * @file models/chicken-small.class.js
 * @description
 * Kleines Chicken (ChickenSmall) Gegner-Objekt.
 * - Läuft nach links
 * - Spielt Walking-Animation
 * - Respektiert Pause (this.isPaused / world.isPaused)
 */

/**
 * Kleines Chicken (Gegner).
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
   * Erstellt ein ChickenSmall, setzt random Position/Speed und startet Animation/Movement.
   */
  constructor() {
    super().loadImage('img/3_enemies_chicken/chicken_small/1_walk/1_w.png');
    this.loadImages(this.IMAGES_WALKING);

    this.initSpawn();
    this.initMovementSpeed();
    this.animate();
  }

  /**
   * Setzt eine zufällige X-Spawnposition.
   * @returns {void}
   */
  initSpawn() {
    this.x = 500 + Math.random() * 3500;
  }

  /**
   * Setzt zufällige Laufgeschwindigkeit.
   * @returns {void}
   */
  initMovementSpeed() {
    this.speed = 0.15 + Math.random() * 0.2;
  }

  /**
   * Startet Movement- und Animations-Intervalle.
   * @returns {void}
   */
  animate() {
    this.startMoveLoop();
    this.startAnimationLoop();
  }

  /**
   * Movement-Loop (60 FPS): läuft nach links, wenn nicht tot/pausiert.
   * @returns {void}
   */
  startMoveLoop() {
    this.moveInterval = setInterval(() => {
      if (this.shouldSkipTick()) return;
      this.moveLeft();
    }, 1000 / 60);
  }

  /**
   * Animations-Loop: spielt Walking-Frames, wenn nicht tot/pausiert.
   * @returns {void}
   */
  startAnimationLoop() {
    this.animationInterval = setInterval(() => {
      if (this.shouldSkipTick()) return;
      this.playAnimation(this.IMAGES_WALKING);
    }, 200);
  }

  /**
   * Prüft, ob Movement/Animation in diesem Tick übersprungen werden soll.
   * @returns {boolean} True, wenn tot oder pausiert.
   */
  shouldSkipTick() {
    if (this.isDead) return true;
    return this.isPaused || this.world?.isPaused;
  }
}
