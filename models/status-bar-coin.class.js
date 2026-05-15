//#region StatusBarCoin class

/**
 * @file models/status-bar-coin.class.js
 * @description
 * Status bar for collected coins (icon + counter).
 */

/**
 * Displays a coin icon and the current coin count in the top-left corner.
 * @class
 * @extends DrawableObject
 */
class StatusBarCoin extends DrawableObject {
  /**
   * Creates the coin status bar and sets default position/size.
   */
  constructor() {
    super();

    /** @type {string} */
    this.imagePath = 'img/8_coin/coin_2.png';
    this.loadImage(this.imagePath);

    /** @type {number} */
    this.height = 110;

    /** @type {number} */
    this.width = 110;

    /** @type {number} */
    this.x = -5;

    /** @type {number} */
    this.y = 10;

    /**
     * Current number of collected coins.
     * @type {number}
     */
    this.coinCount = 0;
  }

  /**
   * Increases the coin count by 1.
   * @returns {void}
   */
  addCoin() {
    this.coinCount++;
  }

  /**
   * Draws the coin icon and the counter.
   * @override
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context.
   * @returns {void}
   */
  draw(ctx) {
    // Coin image
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);

    // Counter text
    ctx.font = '30px "Comic Sans MS"';
    ctx.fillStyle = '#ffcc03';
    ctx.fillText(` ${this.coinCount}`, this.x + 70, this.y + 65);
  }
}

//#endregion
