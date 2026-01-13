//#region Coin class

/**
 * @file models/coin.class.js
 * @description
 * Coin (collectible). Placed randomly by the World and can be collected.
 */

/**
 * Coin (collectible).
 * @class
 * @extends MovableObject
 */
class Coin extends MovableObject {
  /** @type {number} */ height = 40;
  /** @type {number} */ width = 40;
  /** @type {number} */ y = 400;

  /** @type {string} */
  IMAGE = 'img/8_coin/coin_1.png';

  /**
   * Creates a coin at the given position.
   * @param {number} x - X position.
   * @param {number} [y=400] - Y position (default: 400).
   */
  constructor(x, y = 400) {
    super();
    this.loadImage(this.IMAGE);
    this.x = x;
    this.y = y;
  }
}

//#endregion
