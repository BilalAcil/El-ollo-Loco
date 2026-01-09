/**
 * @file models/chicken-nest.class.js
 * @description
 * ChickenNest ist ein statisches Objekt im Endbossbereich.
 * Dient als Deko/Objekt und kann von der World ein-/ausgeblendet werden.
 */

/**
 * ChickenNest (Hühnernest) im Endbossbereich.
 * @class
 * @extends MovableObject
 */
class ChickenNest extends MovableObject {
  /** @type {number} */
  height = 100;

  /** @type {number} */
  width = 160;

  /** @type {number} */
  y = 365;

  /** @type {string} */
  IMAGE = 'img/4_enemie_boss_chicken/6_idle/Chicken-Nest.png';

  /**
   * Erstellt das Hühnernest, lädt das Bild und setzt die Position.
   */
  constructor() {
    super();
    this.loadImage(this.IMAGE);
    this.x = 4490;
  }
}
