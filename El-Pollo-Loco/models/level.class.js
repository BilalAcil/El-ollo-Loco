/**
 * @file models/level.class.js
 * @description
 * Datencontainer für ein Level (Gegner, Wolken, Hintergrundobjekte, Items und Level-Ende).
 */

/**
 * Repräsentiert ein Spiellevel mit allen relevanten Objektsammlungen.
 * @class
 */
class Level {
  /** Liste der Gegner im Level. @type {MovableObject[]} */
  enemies;

  /** Liste der Wolken im Level. @type {MovableObject[]} */
  clouds;

  /** Hintergrundobjekte (Layer, Deko, etc.). @type {DrawableObject[]} */
  backgroundObjects;

  /** Optionale Maiskolben im Level. @type {Corncob[]} */
  corncobs;

  /** X-Koordinate, an der das Level endet. @type {number} */
  level_end_x;

  /**
   * Erstellt ein neues Level.
   * @param {MovableObject[]} enemies - Gegner im Level.
   * @param {MovableObject[]} clouds - Wolken/Parallax-Objekte.
   * @param {DrawableObject[]} backgroundObjects - Hintergrundobjekte (z.B. Layer).
   * @param {Corncob[]} [corncobs=[]] - Sammelitems (Maiskolben).
   * @param {number} [level_end_x=4500] - X-Position des Level-Endes.
   */
  constructor(enemies, clouds, backgroundObjects, corncobs = [], level_end_x = 4500) {
    this.enemies = enemies;
    this.clouds = clouds;
    this.backgroundObjects = backgroundObjects;
    this.corncobs = corncobs;
    this.level_end_x = level_end_x;
  }
}
