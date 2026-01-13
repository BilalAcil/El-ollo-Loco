//#region Character gravity mixin

/**
 * @file models/character.gravity.js
 * @description
 * Gravity/physics loop for the character.
 * Attached via Object.assign to Character.prototype.
 *
 * Includes:
 * - applyGravity(): starts the gravity loop (25 FPS)
 * - shouldSkipGravity(): skips gravity while paused/dead
 * - applyGravityStep(): updates Y position + speedY
 * - snapToGroundIfNeeded(): snaps to ground and resets speedY
 *
 * Requirements:
 * - Character has: y, speedY, acceleration, energy, isDying, isPaused, world?.isPaused
 * - Character has: isAboveGround()
 */

Object.assign(Character.prototype, {
  applyGravity,
  shouldSkipGravity,
  applyGravityStep,
  snapToGroundIfNeeded,
});

//#endregion

//#region Gravity loop

/**
 * Starts the gravity loop (25 FPS).
 * @this {Character}
 * @returns {void}
 */
function applyGravity() {
  setInterval(() => {
    if (this.shouldSkipGravity()) return;
    this.applyGravityStep();
    this.snapToGroundIfNeeded();
  }, 1000 / 25);
}

/**
 * Checks whether gravity should be skipped in this tick.
 * @this {Character}
 * @returns {boolean} True if paused or dead/dying.
 */
function shouldSkipGravity() {
  if (this.isPaused || this.world?.isPaused) return true;
  return this.energy <= 0 || this.isDying;
}

/**
 * One gravity step: updates position and velocity.
 * @this {Character}
 * @returns {void}
 */
function applyGravityStep() {
  if (!this.isAboveGround() && this.speedY <= 0) return;
  this.y -= this.speedY;
  this.speedY -= this.acceleration;
}

/**
 * Snaps the character to the ground once it lands.
 * @this {Character}
 * @returns {void}
 */
function snapToGroundIfNeeded() {
  if (this.isAboveGround() || this.speedY > 0) return;
  this.y = 155;
  this.speedY = 0;
}

//#endregion
