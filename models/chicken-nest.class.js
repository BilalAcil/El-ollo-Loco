//#region ChickenNest class

/**
 * @file models/chicken-nest.class.js
 * @description
 * ChickenNest is a static object in the endboss area.
 * It is used as decoration and can be shown/hidden by the World.
 */

/**
 * ChickenNest (nest) in the endboss area.
 * @class
 * @extends MovableObject
 */
class ChickenNest extends MovableObject {
  /** @type {number} */
  height = 100;

  /** @type {number} */
  width = 160;

  /** @type {number} */
  y = 365;

  /** @type {string} */
  IMAGE = 'img/4_enemie_boss_chicken/6_idle/Chicken-Nest.png';

  /**
   * Creates the chicken nest, loads the image, and sets its position.
   */
  constructor() {
    super();
    this.loadImage(this.IMAGE);
    this.x = 4490;
  }
}

//#endregion
