/**
 * @file models/chicken.class.js
 * @description
 * Normales Chicken (Gegner).
 * - Läuft nach links
 * - Walking-Animation
 * - Kann "dead" sein (dann stoppt Bewegung/Animation)
 *
 * Hinweis:
 * ChickenSmall respektiert Pause (this.isPaused/world.isPaused).
 * Hier ziehen wir das gleich, damit Verhalten konsistent ist.
 */

/**
 * Normales Chicken (Gegner).
 * @class
 * @extends MovableObject
 */
class Chicken extends MovableObject {
  /** @type {number} */ y = 355;
  /** @type {number} */ height = 70;
  /** @type {number} */ width = 60;

  /** @type {boolean} */ isDead = false;

  /** @type {number|null} */ moveInterval = null;
  /** @type {number|null} */ animationInterval = null;

  /** @type {string[]} */
  IMAGES_WALKING = [
    'img/3_enemies_chicken/chicken_normal/1_walk/1_w.png',
    'img/3_enemies_chicken/chicken_normal/1_walk/2_w.png',
    'img/3_enemies_chicken/chicken_normal/1_walk/3_w.png'
  ];

  /** @type {string} */
  IMAGE_DEAD = 'img/3_enemies_chicken/chicken_normal/2_dead/dead.png';

  /**
   * Erstellt ein Chicken, setzt random Position/Speed und startet Animation/Movement.
   */
  constructor() {
    super().loadImage('img/3_enemies_chicken/chicken_normal/1_walk/1_w.png');
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
