//#region Level class

/**
 * @file models/level.class.js
 * @description
 * Data container for a level (enemies, clouds, background objects, items, and level end).
 */

/**
 * Represents a game level with all relevant object collections.
 * @class
 */
class Level {
  /** List of enemies in the level. @type {MovableObject[]} */
  enemies;

  /** List of clouds in the level. @type {MovableObject[]} */
  clouds;

  /** Background objects (layers, decoration, etc.). @type {DrawableObject[]} */
  backgroundObjects;

  /** Optional corncobs in the level. @type {Corncob[]} */
  corncobs;

  /** X coordinate where the level ends. @type {number} */
  level_end_x;

  /**
   * Creates a new level.
   * @param {MovableObject[]} enemies - Enemies in the level.
   * @param {MovableObject[]} clouds - Clouds/parallax objects.
   * @param {DrawableObject[]} backgroundObjects - Background objects (e.g. layers).
   * @param {Corncob[]} [corncobs=[]] - Collectibles (corncobs).
   * @param {number} [level_end_x=4500] - X position of the level end.
   */
  constructor(enemies, clouds, backgroundObjects, corncobs = [], level_end_x = 4500) {
    this.enemies = enemies;
    this.clouds = clouds;
    this.backgroundObjects = backgroundObjects;
    this.corncobs = corncobs;
    this.level_end_x = level_end_x;
  }
}

//#endregion
