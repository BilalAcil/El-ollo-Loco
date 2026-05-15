//#region Corncob class

/**
 * @file models/corncob.class.js
 * @description
 * Corncob (healing item). Placed by the World and collected on collision.
 * Has its own smaller collision box.
 */

/**
 * Corncob (healing item).
 * @class
 * @extends MovableObject
 */
class Corncob extends MovableObject {
  /** @type {number} */ height = 80;
  /** @type {number} */ width = 60;
  /** @type {number} */ y = 350;

  /** @type {string} */
  IMAGE = 'img/12_corncob/corncob.png';

  /**
   * Creates the corncob, loads the image, and sets its position.
   */
  constructor() {
    super();
    this.loadImage(this.IMAGE);
    this.x = 4000;
  }

  /**
   * Smaller collision box than the sprite (fairer pickup).
   * @returns {{x:number,y:number,width:number,height:number}}
   */
  get collisionBox() {
    return {
      x: this.x + 12,
      y: this.y + 10,
      width: this.width - 20,
      height: this.height - 20
    };
  }
}

//#endregion
