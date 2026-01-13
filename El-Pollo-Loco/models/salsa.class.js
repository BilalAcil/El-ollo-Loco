//#region Salsa class

/**
 * @file models/salsa.class.js
 * @description
 * Collectible "Salsa" (bottle on the ground). Can be collected by the character
 * and increases the salsa amount (throw ammo).
 */

/**
 * Salsa collectible object.
 * @class
 * @extends MovableObject
 */
class Salsa extends MovableObject {
  /** @type {number} */
  height = 60;

  /** @type {number} */
  width = 40;

  /** Default Y position in the level. @type {number} */
  y = 400;

  /** Image paths for the salsa bottle (static frames). @type {string[]} */
  IMAGES = [
    'img/6_salsa_bottle/1_salsa_bottle_on_ground.png',
    'img/6_salsa_bottle/2_salsa_bottle_on_ground.png'
  ];

  /**
   * @param {number} x - X position of the salsa in the level.
   * @param {number} [y=400] - Y position (optional, default = 400).
   */
  constructor(x, y) {
    super();
    this.loadImage(this.IMAGES[0]); // load first frame
    this.x = x;
    this.y = (typeof y === 'number') ? y : 400;
  }

  /**
   * Salsa collision box (smaller than the sprite for fairer collisions).
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

//#endregion
