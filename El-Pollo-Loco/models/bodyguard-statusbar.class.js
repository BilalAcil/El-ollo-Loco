//#region BodyguardStatusBar class

/**
 * @file bodyguard-statusbar.class.js
 * @description
 * Status bar for the bodyguard (health display).
 * Can optionally be drawn as "fixed", meaning independent from the camera.
 */

/**
 * Bodyguard HP status bar.
 * @class
 * @extends DrawableObject
 */
class BodyguardStatusBar extends DrawableObject {
  /**
   * Image paths for the display (0% to 100%).
   * @type {string[]}
   */
  IMAGES = [
    'img/7_statusbars/3_statusbar_Bodyguard/orange0.png',
    'img/7_statusbars/3_statusbar_Bodyguard/orange20.png',
    'img/7_statusbars/3_statusbar_Bodyguard/orange40.png',
    'img/7_statusbars/3_statusbar_Bodyguard/orange60.png',
    'img/7_statusbars/3_statusbar_Bodyguard/orange80.png',
    'img/7_statusbars/3_statusbar_Bodyguard/orange100.png'
  ];

  /** @type {number} */
  percentage = 100;

  /** @type {World} */
  world;

  /**
   * Creates a bodyguard status bar and links it to the world.
   * @param {World} world - Reference to the game world (camera + removal).
   */
  constructor(world) {
    super();
    this.world = world;
    this.loadImages(this.IMAGES);
    this.height = 60;
    this.width = 200;
    this.x = 4260;
    this.y = 10;
    this.setPercentage(100);
  }

  /**
   * Draws the status bar.
   * If `fixed` is set, it is rendered independent from the camera.
   * @param {CanvasRenderingContext2D} ctx - Canvas context.
   * @returns {void}
   */
  draw(ctx) {
    if (this.fixed) {
      ctx.save();
      ctx.translate(-this.world.camera_x, 0);
      super.draw(ctx);
      ctx.restore();
      return;
    }
    super.draw(ctx);
  }

  /**
   * Sets the current percentage value and selects the matching image.
   * Removes itself from the world once the value reaches 0.
   * @param {number} percentage - New percentage value (0–100).
   * @returns {void}
   */
  setPercentage(percentage) {
    this.percentage = Math.max(0, percentage);
    const path = this.IMAGES[this.resolveImageIndex()];
    this.img = this.imageCache[path];

    if (this.percentage <= 0) {
      this.removeFromWorld();
    }
  }

  /**
   * Removes the status bar from the world reference.
   * @returns {void}
   */
  removeFromWorld() {
    this.world.bodyguardStatus = null;
  }

  /**
   * Resolves the image index based on the current percentage value.
   * @returns {number} Index (0–5).
   */
  resolveImageIndex() {
    if (this.percentage === 100) return 5;
    if (this.percentage >= 80) return 4;
    if (this.percentage >= 60) return 3;
    if (this.percentage >= 40) return 2;
    if (this.percentage >= 20) return 1;
    return 0;
  }
}

//#endregion
