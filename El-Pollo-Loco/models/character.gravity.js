// models/character.gravity.js

Object.assign(Character.prototype, {
  applyGravity,
  shouldSkipGravity,
  applyGravityStep,
  snapToGroundIfNeeded,
});

function applyGravity() {
  setInterval(() => {
    if (this.shouldSkipGravity()) return;
    this.applyGravityStep();
    this.snapToGroundIfNeeded();
  }, 1000 / 25);
}

function shouldSkipGravity() {
  if (this.isPaused || this.world?.isPaused) return true;
  return this.energy <= 0 || this.isDying;
}

function applyGravityStep() {
  if (!this.isAboveGround() && this.speedY <= 0) return;
  this.y -= this.speedY;
  this.speedY -= this.acceleration;
}

function snapToGroundIfNeeded() {
  if (this.isAboveGround() || this.speedY > 0) return;
  this.y = 155;
  this.speedY = 0;
}
