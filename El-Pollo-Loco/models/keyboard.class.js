//#region Keyboard class

/**
 * @file models/keyboard.class.js
 * @description
 * Stores the current input state (pressed / not pressed).
 * Updated by game.js (KeyDown/KeyUp) and read by Character/World.
 */

/**
 * Keyboard state container for control keys.
 * @class
 */
class Keyboard {
  /** Left arrow key pressed. @type {boolean} */
  LEFT = false;

  /** Right arrow key pressed. @type {boolean} */
  RIGHT = false;

  /** Down arrow key pressed. @type {boolean} */
  DOWN = false;

  /** Up arrow key pressed. @type {boolean} */
  UP = false;

  /** Spacebar pressed (jump). @type {boolean} */
  SPACE = false;

  /** D key pressed (throw). @type {boolean} */
  D = false;
}

//#endregion
