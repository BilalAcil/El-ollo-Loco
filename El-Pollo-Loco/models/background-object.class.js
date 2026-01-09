/**
 * @file background-object.class.js
 * @description
 * Hintergrund-Objekt für das Level (z.B. Landschafts- oder Parallax-Bilder).
 * Positioniert sich standardmäßig auf dem Boden (y = 480 - height).
 */

/**
 * Hintergrund-Objekt, das ein Bild lädt und an einer X-Position platziert wird.
 * @class
 * @extends MovableObject
 */
class BackgroundObject extends MovableObject {

  /** @type {number} */
  width = 720;

  /** @type {number} */
  height = 480;

  /**
   * Erstellt ein BackgroundObject.
   * @param {string} imagePath - Pfad zur Bilddatei.
   * @param {number} x - X-Position im Level.
   */
  constructor(imagePath, x) {
    super().loadImage(imagePath);
    this.x = x;
    this.y = 480 - this.height;
  }
}
