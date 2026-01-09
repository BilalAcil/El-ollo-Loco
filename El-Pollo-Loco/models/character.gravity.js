/**
 * @file models/character.gravity.js
 * @description
 * Gravity-/Physik-Loop für den Character.
 * Wird per Object.assign an Character.prototype gehängt.
 *
 * Enthält:
 * - applyGravity(): startet den Gravity-Loop (25 FPS)
 * - shouldSkipGravity(): ignoriert Gravity bei Pause/Tod
 * - applyGravityStep(): Y-Position + speedY aktualisieren
 * - snapToGroundIfNeeded(): auf Boden "snappen" und speedY nullen
 *
 * Voraussetzungen:
 * - Character hat: y, speedY, acceleration, energy, isDying, isPaused, world?.isPaused
 * - Character hat: isAboveGround()
 */

Object.assign(Character.prototype, {
  applyGravity,
  shouldSkipGravity,
  applyGravityStep,
  snapToGroundIfNeeded,
});

/**
 * Startet den Gravity-Loop (25 FPS).
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
 * Prüft, ob Gravity in diesem Tick übersprungen werden soll.
 * @this {Character}
 * @returns {boolean} True, wenn pausiert oder tot/sterbend.
 */
function shouldSkipGravity() {
  if (this.isPaused || this.world?.isPaused) return true;
  return this.energy <= 0 || this.isDying;
}

/**
 * Ein Gravity-Step: Position & Geschwindigkeit aktualisieren.
 * @this {Character}
 * @returns {void}
 */
function applyGravityStep() {
  if (!this.isAboveGround() && this.speedY <= 0) return;
  this.y -= this.speedY;
  this.speedY -= this.acceleration;
}

/**
 * Klemmt den Character auf den Boden, sobald er landet.
 * @this {Character}
 * @returns {void}
 */
function snapToGroundIfNeeded() {
  if (this.isAboveGround() || this.speedY > 0) return;
  this.y = 155;
  this.speedY = 0;
}
