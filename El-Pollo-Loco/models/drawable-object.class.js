/**
 * @file models/drawable-object.class.js
 * @description
 * Basisklasse für alle Objekte, die auf ein Canvas gezeichnet werden.
 * - Laden von Einzelbildern und Bild-Arrays (mit Cache)
 * - Zeichnen des aktuellen Bildes
 * - Optional: Debug-Frame (transparent) + Kollisionsbox
 * - Globales Asset-Tracking (totalAssets / loadedAssets)
 */

/**
 * DrawableObject ist die Basis für alle renderbaren Objekte im Spiel.
 * @class
 */
class DrawableObject {
  /**
   * Gesamtanzahl aller gestarteten Asset-Ladevorgänge (global).
   * @type {number}
   */
  static totalAssets = 0;

  /**
   * Anzahl erfolgreich geladener Assets (global).
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
   * Lädt ein einzelnes Bild und setzt es als `this.img`.
   * Erhöht globale Asset-Zähler für Preload/Loading-Check.
   * @param {string} path - Pfad zur Bilddatei.
   * @returns {void}
   */
  loadImage(path) {
    this.img = new Image();
    DrawableObject.totalAssets++;

    this.img.onload = () => {
      DrawableObject.loadedAssets++;
    };

    this.img.src = path;
  }

  /**
   * Lädt mehrere Bilder und cached sie in `imageCache`.
   * Erhöht globale Asset-Zähler für jedes Bild.
   * @param {string[]} arr - Liste von Bildpfaden.
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
   * Zeichnet das aktuelle Bild auf das Canvas.
   * Wichtig: World positioniert/transformiert das Canvas vorher (translate/rotate/scale).
   * @param {CanvasRenderingContext2D} ctx
   * @returns {void}
   */
  draw(ctx) {
    if (!this.img) return;
    ctx.drawImage(this.img, 0, 0, this.width, this.height);
  }

  /**
   * Zeichnet einen (transparenten) Debug-Frame um das Objekt bzw. die collisionBox.
   * Wird nur für bestimmte Klassen aktiviert (shouldDrawFrame()).
   * @param {CanvasRenderingContext2D} ctx
   * @returns {void}
   */
  drawFrame(ctx) {
    if (!this.shouldDrawFrame()) return;
    this.beginFrame(ctx);
    this.drawFrameRect(ctx);
    ctx.stroke();
  }

  /**
   * Entscheidet, ob für dieses Objekt ein Debug-Frame gezeichnet wird.
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
   * Initialisiert den Zeichenstil für den Debug-Frame.
   * @param {CanvasRenderingContext2D} ctx
   * @returns {void}
   */
  beginFrame(ctx) {
    ctx.beginPath();
    ctx.lineWidth = "1";
    ctx.strokeStyle = "transparent";
  }

  /**
   * Zeichnet die Frame-Rechteck-Geometrie:
   * - Wenn collisionBox existiert: nutzt collisionBox relativ zum Objekt
   * - Sonst: Standard-Rect (Bodyguard bekommt oben ein Offset)
   * @param {CanvasRenderingContext2D} ctx
   * @returns {void}
   */
  drawFrameRect(ctx) {
    if (this.collisionBox) return this.drawCollisionRect(ctx);
    const offsetY = this instanceof Bodyguard ? 30 : 0;
    ctx.rect(0, offsetY, this.width, this.height - offsetY);
  }

  /**
   * Zeichnet die collisionBox relativ zur Objektposition.
   * @param {CanvasRenderingContext2D} ctx
   * @returns {void}
   */
  drawCollisionRect(ctx) {
    const b = this.collisionBox;
    ctx.rect(b.x - this.x, b.y - this.y, b.width, b.height);
  }

  /**
   * Prüft global, ob alle registrierten Assets geladen wurden.
   * @returns {boolean} True, wenn mindestens 1 Asset existiert und alle geladen sind.
   */
  static areAllAssetsLoaded() {
    return (
      DrawableObject.totalAssets > 0 &&
      DrawableObject.loadedAssets >= DrawableObject.totalAssets
    );
  }
}
