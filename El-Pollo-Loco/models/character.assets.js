//#region Character assets + configuration

/**
 * @file models/character.assets.js
 * @description
 * Central asset/config file for the character (Pepe).
 * - Contains sprite paths for all animations
 * - Contains base size/speed configuration
 * - Provides a helper function to apply assets to a Character instance
 *
 * Exposed on window:
 * - window.CHARACTER_ASSETS
 * - window.applyAssetsToCharacter(character)
 */

window.CHARACTER_ASSETS = {
  /**
   * Base values for size, initial Y position, and walking speed.
   * @type {{height:number,width:number,y:number,speed:number}}
   */
  size: { height: 280, width: 120, y: 0, speed: 10 },

  /** @type {string[]} */ IMAGES_IDLE: [
    'img/2_character_pepe/1_idle/idle/I-1.png',
    'img/2_character_pepe/1_idle/idle/I-2.png',
    'img/2_character_pepe/1_idle/idle/I-3.png',
    'img/2_character_pepe/1_idle/idle/I-4.png',
    'img/2_character_pepe/1_idle/idle/I-5.png',
    'img/2_character_pepe/1_idle/idle/I-6.png',
    'img/2_character_pepe/1_idle/idle/I-7.png',
    'img/2_character_pepe/1_idle/idle/I-8.png',
    'img/2_character_pepe/1_idle/idle/I-9.png',
    'img/2_character_pepe/1_idle/idle/I-10.png'
  ],

  /** @type {string[]} */ IMAGES_LONG_IDLE: [
    'img/2_character_pepe/1_idle/long_idle/I-11.png',
    'img/2_character_pepe/1_idle/long_idle/I-12.png',
    'img/2_character_pepe/1_idle/long_idle/I-13.png',
    'img/2_character_pepe/1_idle/long_idle/I-14.png',
    'img/2_character_pepe/1_idle/long_idle/I-15.png',
    'img/2_character_pepe/1_idle/long_idle/I-16.png',
    'img/2_character_pepe/1_idle/long_idle/I-17.png',
    'img/2_character_pepe/1_idle/long_idle/I-18.png',
    'img/2_character_pepe/1_idle/long_idle/I-19.png',
    'img/2_character_pepe/1_idle/long_idle/I-20.png'
  ],

  /** @type {string[]} */ IMAGES_WALKING: [
    'img/2_character_pepe/2_walk/W-21.png',
    'img/2_character_pepe/2_walk/W-22.png',
    'img/2_character_pepe/2_walk/W-23.png',
    'img/2_character_pepe/2_walk/W-24.png',
    'img/2_character_pepe/2_walk/W-25.png',
    'img/2_character_pepe/2_walk/W-26.png'
  ],

  /** @type {string[]} */ IMAGES_JUMPING: [
    'img/2_character_pepe/3_jump/J-31.png',
    'img/2_character_pepe/3_jump/J-32.png',
    'img/2_character_pepe/3_jump/J-33.png',
    'img/2_character_pepe/3_jump/J-34.png',
    'img/2_character_pepe/3_jump/J-35.png'
  ],

  /** @type {string[]} */ IMAGES_FALLING: [
    'img/2_character_pepe/3_jump/J-36.png',
    'img/2_character_pepe/3_jump/J-37.png',
    'img/2_character_pepe/3_jump/J-38.png',
    'img/2_character_pepe/3_jump/J-39.png'
  ],

  /** @type {string[]} */ IMAGES_DEAD: [
    'img/2_character_pepe/5_dead/D-51.png',
    'img/2_character_pepe/5_dead/D-53.png',
    'img/2_character_pepe/5_dead/D-54.png'
  ],

  /** @type {string[]} */ IMAGES_HURT: [
    'img/2_character_pepe/4_hurt/H-41.png',
    'img/2_character_pepe/4_hurt/H-42.png',
    'img/2_character_pepe/4_hurt/H-43.png'
  ],

  /** @type {string[]} */ IMAGES_THROW: [
    'img/2_character_pepe/2_walk/W-21.png',
    'img/2_character_pepe/2_walk/W-22.png',
    'img/2_character_pepe/2_walk/W-23.png'
  ],
};

/**
 * Applies the centrally defined character assets to a Character instance.
 * @param {Character} c - Character instance to configure.
 * @returns {void}
 */
window.applyAssetsToCharacter = function (c) {
  const A = window.CHARACTER_ASSETS;

  c.height = A.size.height;
  c.width = A.size.width;
  c.y = A.size.y;
  c.speed = A.size.speed;

  c.IMAGES_IDLE = A.IMAGES_IDLE;
  c.IMAGES_LONG_IDLE = A.IMAGES_LONG_IDLE;
  c.IMAGES_WALKING = A.IMAGES_WALKING;
  c.IMAGES_JUMPING = A.IMAGES_JUMPING;
  c.IMAGES_FALLING = A.IMAGES_FALLING;
  c.IMAGES_DEAD = A.IMAGES_DEAD;
  c.IMAGES_HURT = A.IMAGES_HURT;
  c.IMAGES_THROW = A.IMAGES_THROW;
};

//#endregion
