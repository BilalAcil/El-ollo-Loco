//#region Maracas class

/**
 * @file models/maracas.class.js
 * @description
 * Collectible: maracas. Appears after the endboss dies and triggers the end sequence.
 */

/**
 * Maracas collectible (triggers end sequence on collision).
 * @class
 * @extends MovableObject
 */
class Maracas extends MovableObject {
  /** Object height. @type {number} */
  height = 40;

  /** Object width. @type {number} */
  width = 60;

  /** Y position in the world. @type {number} */
  y = 380;

  /** Rotation angle in degrees (for rendering). @type {number} */
  rotation = -50;

  /** Image path for the maracas. @type {string} */
  IMAGE = 'img/14_maracas/maracas.png';

  /**
   * Creates a maracas collectible at the intended position.
   */
  constructor() {
    super();
    this.loadImage(this.IMAGE);
    this.x = 4545;
  }
}

//#endregion
