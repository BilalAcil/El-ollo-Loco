/**
 * @file bodyguard-statusbar.class.js
 * @description
 * Statusbar für den Bodyguard (Lebensanzeige).
 * Kann optional "fixed" gezeichnet werden, d.h. unabhängig von der Kamera.
 */

/**
 * Statusbar (HP) für den Bodyguard.
 * @class
 * @extends DrawableObject
 */
class BodyguardStatusBar extends DrawableObject {
  /**
   * Bildpfade für die Anzeige (0% bis 100%).
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
   * Erstellt eine Bodyguard-Statusbar und verknüpft sie mit der Welt.
   * @param {World} world - Referenz auf die Spielwelt (für Kamera und Entfernen).
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
   * Zeichnet die Statusbar.
   * Wenn `fixed` gesetzt ist, wird sie unabhängig von der Kamera gerendert.
   * @param {CanvasRenderingContext2D} ctx - Canvas-Kontext.
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
   * Setzt den aktuellen Prozentwert und wählt das passende Bild.
   * Entfernt sich aus der Welt, wenn der Wert 0 erreicht.
   * @param {number} percentage - Neuer Prozentwert (0–100).
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
   * Entfernt die Statusbar aus der Welt-Referenz.
   * @returns {void}
   */
  removeFromWorld() {
    this.world.bodyguardStatus = null;
  }

  /**
   * Bestimmt anhand des Prozentwertes den Index im IMAGES-Array.
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
