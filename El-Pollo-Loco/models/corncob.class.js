/**
 * @file models/corncob.class.js
 * @description
 * Corncob (Heil-Item). Wird von der World platziert und bei Kollision eingesammelt.
 * Besitzt eine eigene kleinere Kollisionsbox.
 */

/**
 * Corncob (Heil-Item).
 * @class
 * @extends MovableObject
 */
class Corncob extends MovableObject {
  /** @type {number} */ height = 80;
  /** @type {number} */ width = 60;
  /** @type {number} */ y = 350;

  /** @type {string} */
  IMAGE = 'img/12_corncob/corncob.png';

  /**
   * Erstellt den Corncob, lädt das Bild und setzt die Position.
   */
  constructor() {
    super();
    this.loadImage(this.IMAGE);
    this.x = 4000;
  }

  /**
   * Kleinere Kollisionsbox als das Sprite (faireres Einsammeln).
   * @returns {{x:number,y:number,width:number,height:number}}
   */
  get collisionBox() {
    return {
      x: this.x + 12,
      y: this.y + 10,
      width: this.width - 20,
      height: this.height - 20
    };
  }
}
