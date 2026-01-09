/**
 * @file models/maracas.class.js
 * @description
 * Sammelobjekt: Maracas. Erscheint nach dem Endboss-Tod und triggert die Endsequenz.
 */

/**
 * Maracas-Collectible (triggert Endsequenz bei Kollision).
 * @class
 * @extends MovableObject
 */
class Maracas extends MovableObject {
  /** Höhe des Objekts. @type {number} */
  height = 40;

  /** Breite des Objekts. @type {number} */
  width = 60;

  /** Y-Position in der Welt. @type {number} */
  y = 380;

  /** Drehwinkel in Grad (für Rendering). @type {number} */
  rotation = -50;

  /** Bildpfad für die Maracas. @type {string} */
  IMAGE = 'img/14_maracas/maracas.png';

  /**
   * Erstellt eine Maracas an der vorgesehenen Position.
   */
  constructor() {
    super();
    this.loadImage(this.IMAGE);
    this.x = 4545;
  }
}
