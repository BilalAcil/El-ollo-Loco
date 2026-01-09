/**
 * @file models/status-bar-coin.class.js
 * @description
 * Statusbar für gesammelte Coins (Icon + Counter).
 */

/**
 * Zeigt oben links ein Coin-Icon und die aktuelle Coin-Anzahl an.
 * @class
 * @extends DrawableObject
 */
class StatusBarCoin extends DrawableObject {
  /**
   * Erstellt die Coin-Statusbar und setzt Standard-Position/Größe.
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
     * Aktuelle Anzahl gesammelter Coins.
     * @type {number}
     */
    this.coinCount = 0;
  }

  /**
   * Erhöht die Coin-Anzahl um 1.
   * @returns {void}
   */
  addCoin() {
    this.coinCount++;
  }

  /**
   * Zeichnet das Coin-Icon und den Zähler.
   * @override
   * @param {CanvasRenderingContext2D} ctx - Canvas-2D-Kontext.
   * @returns {void}
   */
  draw(ctx) {
    // Coin-Bild
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);

    // Zahl daneben
    ctx.font = '30px "Comic Sans MS"';
    ctx.fillStyle = '#ffcc03';
    ctx.fillText(` ${this.coinCount}`, this.x + 70, this.y + 65);
  }
}
