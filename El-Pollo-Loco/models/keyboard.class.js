/**
 * @file models/keyboard.class.js
 * @description
 * Speichert den aktuellen Zustand der Eingaben (gedrückt / nicht gedrückt).
 * Wird von game.js (KeyDown/KeyUp) gesetzt und von Character/World ausgelesen.
 */

/**
 * Keyboard-State-Container für Steuerungstasten.
 * @class
 */
class Keyboard {
  /** Pfeiltaste links gedrückt. @type {boolean} */
  LEFT = false;

  /** Pfeiltaste rechts gedrückt. @type {boolean} */
  RIGHT = false;

  /** Pfeiltaste runter gedrückt. @type {boolean} */
  DOWN = false;

  /** Pfeiltaste hoch gedrückt. @type {boolean} */
  UP = false;

  /** Leertaste gedrückt (Springen). @type {boolean} */
  SPACE = false;

  /** Taste D gedrückt (Werfen). @type {boolean} */
  D = false;
}
