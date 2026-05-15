//#region StatusBar class

/**
 * @file models/status-bar.class.js
 * @description
 * Player health bar (HP status bar). Supports health percentage display
 * and a green blink feedback when healing.
 */

/**
 * Status bar for the player's health energy.
 * Displays a matching image depending on the percentage value and can blink green on healing.
 *
 * @class
 * @extends DrawableObject
 */
class StatusBar extends DrawableObject {
  /**
   * Image paths for the health bar (blue 0–100 + green 100 as heal feedback).
   * Index mapping is handled by {@link resolveImageIndex}.
   * @type {string[]}
   */
  IMAGES = [
    'img/7_statusbars/1_statusbar/2_statusbar_health/blue/0.png',
    'img/7_statusbars/1_statusbar/2_statusbar_health/blue/20.png',
    'img/7_statusbars/1_statusbar/2_statusbar_health/blue/40.png',
    'img/7_statusbars/1_statusbar/2_statusbar_health/blue/60.png',
    'img/7_statusbars/1_statusbar/2_statusbar_health/blue/80.png',
    'img/7_statusbars/1_statusbar/2_statusbar_health/blue/100.png',
    'img/7_statusbars/1_statusbar/2_statusbar_health/green/100.png'
  ];

  /**
   * Current health value in percent (0–100).
   * @type {number}
   */
  percentage = 100;

  /**
   * Reference to the current blink interval (if active).
   * @type {number|null}
   */
  blinkInterval = null;

  /**
   * Creates the status bar, loads images and sets default position/size.
   */
  constructor() {
    super();

    this.loadImages(this.IMAGES);

    /** @type {number} */
    this.height = 60;

    /** @type {number} */
    this.width = 200;

    /** @type {number} */
    this.x = 20;

    /** @type {number} */
    this.y = 0;

    this.setPercentage(100);
  }

  /**
   * Sets the health percentage and updates the displayed image.
   * Note: this does NOT clamp; callers should already pass 0–100.
   *
   * @param {number} percentage - New health percentage (0–100).
   * @returns {void}
   */
  setPercentage(percentage) {
    this.percentage = percentage;
    const path = this.IMAGES[this.resolveImageIndex()];
    this.img = this.imageCache[path];
  }

  /**
   * Resolves the matching image index for the current {@link percentage}.
   *
   * @returns {number} Index in {@link IMAGES} (0–5).
   */
  resolveImageIndex() {
    if (this.percentage == 100) return 5;
    if (this.percentage >= 80) return 4;
    if (this.percentage >= 60) return 3;
    if (this.percentage >= 40) return 2;
    if (this.percentage >= 20) return 1;
    return 0;
  }

  /**
   * Makes the status bar blink green to indicate healing.
   * Restarts the blink loop if one is already running.
   *
   * @returns {void}
   */
  blinkFullHealth() {
    const images = this.getBlinkImages();
    this.resetBlink(images.normal);
    this.startBlinkLoop(images);
  }

  /**
   * Returns cached image objects for "normal" (blue 100) and "green" (green 100).
   *
   * @returns {{ normal: HTMLImageElement, green: HTMLImageElement }}
   */
  getBlinkImages() {
    return {
      normal: this.imageCache['img/7_statusbars/1_statusbar/2_statusbar_health/blue/100.png'],
      green: this.imageCache['img/7_statusbars/1_statusbar/2_statusbar_health/green/100.png']
    };
  }

  /**
   * Stops a running blink interval (if any) and resets the image to the normal view.
   *
   * @param {HTMLImageElement} normalImage - The "normal" image (blue 100).
   * @returns {void}
   */
  resetBlink(normalImage) {
    if (!this.blinkInterval) return;

    clearInterval(this.blinkInterval);
    this.blinkInterval = null;
    this.img = normalImage;
  }

  /**
   * Starts the blink loop between normal/green.
   * Blinks for a defined amount of toggles.
   *
   * @param {{ normal: HTMLImageElement, green: HTMLImageElement }} images - Normal and green images.
   * @returns {void}
   */
  startBlinkLoop({ normal, green }) {
    let blinkCount = 0;
    const totalBlinks = 8;

    this.blinkInterval = setInterval(() => {
      this.toggleBlinkImage(normal, green);

      // Count only when "green" is visible => one "blink" per green phase
      if (this.img === green) blinkCount++;
      if (blinkCount >= totalBlinks) this.finishBlink(normal);
    }, 300);
  }

  /**
   * Toggles the current image between normal and green.
   *
   * @param {HTMLImageElement} normal - Normal image (blue 100).
   * @param {HTMLImageElement} green - Green image (green 100).
   * @returns {void}
   */
  toggleBlinkImage(normal, green) {
    this.img = this.img === green ? normal : green;
  }

  /**
   * Finishes the blink animation and restores the normal view.
   *
   * @param {HTMLImageElement} normalImage - Normal image (blue 100).
   * @returns {void}
   */
  finishBlink(normalImage) {
    clearInterval(this.blinkInterval);
    this.blinkInterval = null;
    this.img = normalImage;
  }

  /**
   * Stops blinking immediately and resets the status bar to the normal view.
   *
   * @returns {void}
   */
  stopBlink() {
    const normalImage =
      this.imageCache['img/7_statusbars/1_statusbar/2_statusbar_health/blue/100.png'];

    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
    }

    this.img = normalImage;
  }
}

//#endregion
