//#region DrawableObject base class

/**
 * @file models/drawable-object.class.js
 * @description
 * Base class for all objects that are drawn on a canvas.
 * - Load single images and image arrays (with caching)
 * - Draw the current image
 * - Optional: debug frame (transparent) + collision box
 * - Global asset tracking (totalAssets / loadedAssets)
 */

/**
 * DrawableObject is the base for all renderable objects in the game.
 * @class
 */
class DrawableObject {
  /**
   * Total number of started asset load operations (global).
   * @type {number}
   */
  static totalAssets = 0;

  /**
   * Number of successfully loaded assets (global).
   * @type {number}
   */
  static loadedAssets = 0;

  /** @type {number} */ x = 120;
  /** @type {number} */ y = 275;
  /** @type {number} */ height = 150;
  /** @type {number} */ width = 100;

  /** @type {HTMLImageElement|undefined} */ img;
  /** @type {Record<string, HTMLImageElement>} */ imageCache = {};
  /** @type {number} */ currentImage = 0;

  /**
   * Loads a single image and assigns it to `this.img`.
   * Increments global asset counters for preload/loading checks.
   * @param {string} path - Path to the image file.
   * @returns {void}
   */
  loadImage(path) {
    // ✅ If it was already preloaded, just reuse it (do not create a new Image).
    if (this.imageCache[path]) {
      this.img = this.imageCache[path];
      return;
    }

    // Otherwise, load once and store it in the cache.
    const img = new Image();
    DrawableObject.totalAssets++;

    img.onload = () => {
      DrawableObject.loadedAssets++;
    };

    img.src = path;
    this.imageCache[path] = img;
    this.img = img;
  }

  /**
   * Loads multiple images and caches them in `imageCache`.
   * Increments global asset counters for each image.
   * @param {string[]} arr - List of image paths.
   * @returns {void}
   */
  loadImages(arr) {
    arr.forEach((path) => {
      const img = new Image();
      DrawableObject.totalAssets++;

      img.onload = () => {
        DrawableObject.loadedAssets++;
      };

      img.src = path;
      this.imageCache[path] = img;
    });
  }

  /**
   * Draws the current image to the canvas.
   * Note: World sets up canvas transforms beforehand (translate/rotate/scale).
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context.
   * @returns {void}
   */
  draw(ctx) {
    if (!this.img) return;
    ctx.drawImage(this.img, 0, 0, this.width, this.height);
  }

  /**
   * Draws a (transparent) debug frame around the object or its collisionBox.
   * Only active for certain classes (see shouldDrawFrame()).
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context.
   * @returns {void}
   */
  drawFrame(ctx) {
    if (!this.shouldDrawFrame()) return;
    this.beginFrame(ctx);
    this.drawFrameRect(ctx);
    ctx.stroke();
  }

  /**
   * Decides whether a debug frame should be drawn for this object.
   * @returns {boolean}
   */
  shouldDrawFrame() {
    return this instanceof Character ||
      this instanceof Chicken ||
      this instanceof Endboss ||
      this instanceof ChickenSmall ||
      this instanceof Corncob ||
      this instanceof Coin ||
      this instanceof Salsa ||
      this instanceof Maracas ||
      this instanceof Bodyguard;
  }

  /**
   * Initializes the drawing style for the debug frame.
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context.
   * @returns {void}
   */
  beginFrame(ctx) {
    ctx.beginPath();
    ctx.lineWidth = "1";
    ctx.strokeStyle = "transparent";
  }

  /**
   * Draws the frame rectangle geometry:
   * - If collisionBox exists: uses collisionBox relative to the object
   * - Otherwise: standard rect (Bodyguard gets a top offset)
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context.
   * @returns {void}
   */
  drawFrameRect(ctx) {
    if (this.collisionBox) return this.drawCollisionRect(ctx);
    const offsetY = this instanceof Bodyguard ? 30 : 0;
    ctx.rect(0, offsetY, this.width, this.height - offsetY);
  }

  /**
   * Draws the collisionBox relative to the object position.
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context.
   * @returns {void}
   */
  drawCollisionRect(ctx) {
    const b = this.collisionBox;
    ctx.rect(b.x - this.x, b.y - this.y, b.width, b.height);
  }

  /**
   * Checks globally whether all registered assets have been loaded.
   * @returns {boolean} True if at least 1 asset exists and all are loaded.
   */
  static areAllAssetsLoaded() {
    return (
      DrawableObject.totalAssets > 0 &&
      DrawableObject.loadedAssets >= DrawableObject.totalAssets
    );
  }
}

//#endregion
