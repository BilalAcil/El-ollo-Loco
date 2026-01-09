/**
 * @file models/coin.class.js
 * @description
 * Coin (Sammelobjekt). Wird von der World zufällig platziert und kann eingesammelt werden.
 */

/**
 * Coin (Sammelobjekt).
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
   * Erstellt eine Coin an der gewünschten Position.
   * @param {number} x - X-Position.
   * @param {number} [y=400] - Y-Position (Standard: 400).
   */
  constructor(x, y = 400) {
    super();
    this.loadImage(this.IMAGE);
    this.x = x;
    this.y = y;
  }
}
