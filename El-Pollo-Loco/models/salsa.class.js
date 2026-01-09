/**
 * @file models/salsa.class.js
 * @description
 * Sammelobjekt "Salsa" (Flasche am Boden). Kann vom Character eingesammelt werden
 * und erhöht die Salsa-Anzahl (Wurfmunition).
 */

/**
 * Salsa-Sammelobjekt.
 * @class
 * @extends MovableObject
 */
class Salsa extends MovableObject {
  /** @type {number} */
  height = 60;

  /** @type {number} */
  width = 40;

  /** Standard-Y Position im Level. @type {number} */
  y = 400;

  /** Bildpfade der Salsa-Flasche (Standbilder). @type {string[]} */
  IMAGES = [
    'img/6_salsa_bottle/1_salsa_bottle_on_ground.png',
    'img/6_salsa_bottle/2_salsa_bottle_on_ground.png'
  ];

  /**
   * @param {number} x - X-Position der Salsa im Level.
   * @param {number} [y=400] - Y-Position (optional, Standard = 400).
   */
  constructor(x, y) {
    super();
    this.loadImage(this.IMAGES[0]); // erstes Bild laden
    this.x = x;
    this.y = (typeof y === 'number') ? y : 400;
  }

  /**
   * Kollisionsbox der Salsa (kleiner als das Sprite für fairere Kollisionen).
   * @returns {{x:number,y:number,width:number,height:number}}
   */
  get collisionBox() {
    return {
      x: this.x + 15,
      y: this.y + 7,
      width: this.width - 22,
      height: this.height - 15
    };
  }
}
