/**
 * @file models/cloud.class.js
 * @description
 * Cloud ist ein Hintergrund-Objekt, das konstant nach links driftet.
 * Respektiert Pause (this.isPaused / world.isPaused), falls vorhanden.
 */

/**
 * Wolke im Hintergrund.
 * @class
 * @extends MovableObject
 */
class Cloud extends MovableObject {
  /** @type {number} */ y = 20 + Math.random() * 50;
  /** @type {number} */ width = 900;
  /** @type {number} */ height = 300;

  /** @type {number|null} */ moveInterval = null;

  /**
   * Erstellt eine Cloud an Position x und startet die Bewegung.
   * @param {number} [x=0] - Start-X-Position.
   */
  constructor(x = 0) {
    super().loadImage('img/5_background/layers/4_clouds/1.png');
    this.x = x;
    this.speed = 0.2;
    this.animate();
  }

  /**
   * Startet die Cloud-Bewegung.
   * @returns {void}
   */
  animate() {
    this.startMoveLoop();
  }

  /**
   * Startet das Intervall, das die Cloud nach links bewegt (60 FPS).
   * @returns {void}
   */
  startMoveLoop() {
    this.moveInterval = setInterval(() => {
      if (this.shouldSkipTick()) return;
      this.x -= this.speed;
    }, 1000 / 60);
  }

  /**
   * Prüft, ob Bewegung in diesem Tick übersprungen werden soll.
   * @returns {boolean} True, wenn pausiert.
   */
  shouldSkipTick() {
    return this.isPaused || this.world?.isPaused;
  }
}
