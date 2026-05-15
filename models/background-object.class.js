//#region BackgroundObject class

/**
 * @file background-object.class.js
 * @description
 * Background object for the level (e.g. landscape or parallax images).
 * By default it is positioned on the ground (y = 480 - height).
 */

/**
 * Background object that loads an image and is placed at a specific X position.
 * @class
 * @extends MovableObject
 */
class BackgroundObject extends MovableObject {

  /** @type {number} */
  width = 720;

  /** @type {number} */
  height = 480;

  /**
   * Creates a BackgroundObject.
   * @param {string} imagePath - Path to the image file.
   * @param {number} x - X position in the level.
   */
  constructor(imagePath, x) {
    super().loadImage(imagePath);
    this.x = x;
    this.y = 480 - this.height;
  }
}

//#endregion
