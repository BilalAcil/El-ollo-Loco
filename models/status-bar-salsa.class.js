//#region StatusBarSalsa class

/**
 * @file models/status-bar-salsa.class.js
 * @description
 * Status bar for salsa bottles (icon + counter) including blink feedback on failure.
 */

/**
 * Displays a salsa icon and the current salsa count in the top-left corner.
 * Can blink briefly (hidden/visible), e.g. when the player tries to throw but has no salsa.
 * @class
 * @extends DrawableObject
 */
class StatusBarSalsa extends DrawableObject {
  /**
   * Creates the salsa status bar and sets default position/size and initial values.
   */
  constructor() {
    super();

    /** @type {string} */
    this.imagePath = 'img/6_salsa_bottle/salsa_bottle.png';
    this.loadImage(this.imagePath);

    /** @type {number} */
    this.height = 50;

    /** @type {number} */
    this.width = 80;

    /** @type {number} */
    this.x = 55;

    /** @type {number} */
    this.y = 25;

    /**
     * Current number of collected salsa bottles.
     * @type {number}
     */
    this.salsaCount = 0;

    /**
     * True while a blink animation is running.
     * @type {boolean}
     */
    this.isBlinking = false;

    /**
     * Visibility of the status bar (toggled during blinking).
     * @type {boolean}
     */
    this.visible = true;
  }

  /**
   * Increases the salsa count by 1.
   * @returns {void}
   */
  addSalsa() {
    this.salsaCount++;
  }

  /**
   * Makes the status bar blink briefly (on/off), e.g. on "throw failed".
   * Prevents multiple blink intervals from running at the same time.
   * @returns {void}
   */
  blinkOnFail() {
    if (this.isBlinking) return;

    this.isBlinking = true;

    /** @type {number} */
    let blinkCount = 0;

    const blinkInterval = setInterval(() => {
      this.visible = !this.visible;
      blinkCount++;

      // 3× on/off => 6 toggles
      if (blinkCount >= 6) {
        clearInterval(blinkInterval);
        this.visible = true;
        this.isBlinking = false;
      }
    }, 120);
  }

  /**
   * Draws the salsa icon and the counter.
   * During blinking this may be skipped (when visible=false).
   * @override
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context.
   * @returns {void}
   */
  draw(ctx) {
    if (!this.visible) return;

    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);

    ctx.font = '30px "Comic Sans MS"';
    ctx.fillStyle = '#bf0000';
    ctx.fillText(` ${this.salsaCount}`, this.x + 45, this.y + 35);
  }
}

//#endregion
