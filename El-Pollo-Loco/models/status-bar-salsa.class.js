/**
 * @file models/status-bar-salsa.class.js
 * @description
 * Statusbar für Salsa-Flaschen (Icon + Counter) inkl. Blink-Feedback bei Fehlschlag.
 */

/**
 * Zeigt oben links ein Salsa-Icon und die aktuelle Salsa-Anzahl an.
 * Kann kurz blinken (unsichtbar/sichtbar), z. B. wenn der Spieler werfen will, aber keine Salsa hat.
 * @class
 * @extends DrawableObject
 */
class StatusBarSalsa extends DrawableObject {
  /**
   * Erstellt die Salsa-Statusbar und setzt Standard-Position/Größe sowie Initialwerte.
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
     * Aktuelle Anzahl gesammelter Salsa-Flaschen.
     * @type {number}
     */
    this.salsaCount = 0;

    /**
     * True, wenn gerade eine Blink-Animation läuft.
     * @type {boolean}
     */
    this.isBlinking = false;

    /**
     * Sichtbarkeit der Statusbar (wird beim Blinken umgeschaltet).
     * @type {boolean}
     */
    this.visible = true;
  }

  /**
   * Erhöht die Salsa-Anzahl um 1.
   * @returns {void}
   */
  addSalsa() {
    this.salsaCount++;
  }

  /**
   * Lässt die Statusbar kurz blinken (an/aus), z. B. bei "Wurf fehlgeschlagen".
   * Verhindert, dass mehrere Blink-Intervalle gleichzeitig laufen.
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

      // 3× an/aus => 6 Wechsel
      if (blinkCount >= 6) {
        clearInterval(blinkInterval);
        this.visible = true;
        this.isBlinking = false;
      }
    }, 120);
  }

  /**
   * Zeichnet das Salsa-Icon und den Zähler.
   * Wird beim Blinken ggf. übersprungen (wenn visible=false).
   * @override
   * @param {CanvasRenderingContext2D} ctx - Canvas-2D-Kontext.
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
