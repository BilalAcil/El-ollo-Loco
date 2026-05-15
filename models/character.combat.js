//#region Character combat + death mixin

/**
 * @file models/character.combat.js
 * @description
 * Combat and death logic for the character.
 * Attached via Object.assign to Character.prototype.
 *
 * Includes:
 * - Throw animation (SalsaThrow) incl. "no salsa" feedback
 * - Death animation (frames + falling physics + sounds)
 * - Removing the character from the world after "FallingWhenDead"
 *
 * Requirements:
 * - Character exists globally
 * - World provides: statusBarSalsa, throwableObjects, level.enemies, pauseAllMovements()
 * - SalsaThrow exists globally
 */

Object.assign(Character.prototype, {
  throwAnimation,
  canStartThrow,
  hasSalsa,
  handleNoSalsa,
  beginThrow,
  playThrowFrames,
  finishThrowFrames,
  spawnSalsaAndFinish,
  spawnSalsaThrow,
  finishThrow,

  playDeathAnimation,
  startDeathState,
  scheduleDeathSounds,
  playDeathSounds,
  startDeathFallAnim,
  stepDeathFallAnim,
  stepDeathFrames,
  stepDeathFallPhysics,
  shouldFinishDeathAnim,
  finishDeathAnim,

  startFallingWhenDead,
  removeFromWorld,
});

//#endregion

//#region Throw animation (SalsaThrow)

/**
 * Starts the throw animation if possible and salsa is available.
 * @this {Character}
 * @returns {void}
 */
function throwAnimation() {
  if (!this.canStartThrow()) return;
  if (!this.hasSalsa()) return this.handleNoSalsa();
  this.beginThrow();
  this.playThrowFrames();
}

/**
 * Checks whether a throw can be started.
 * @this {Character}
 * @returns {boolean} True if no throw animation is running and the animation is finished.
 */
function canStartThrow() {
  return this.animationFinished && !this.isThrowing;
}

/**
 * Checks whether the character still has salsa in the inventory.
 * @this {Character}
 * @returns {boolean} True if salsaCount > 0.
 */
function hasSalsa() {
  return this.world?.statusBarSalsa && this.world.statusBarSalsa.salsaCount > 0;
}

/**
 * Feedback when no salsa is available (sound + blink).
 * @this {Character}
 * @returns {void}
 */
function handleNoSalsa() {
  const s = new Audio('audio/Fail.mp3');
  s.volume = 0.4;
  s.playbackRate = 2;
  s.play().catch(() => { });
  this.world?.statusBarSalsa?.blinkOnFail();
}

/**
 * Sets flags and starts the throw sound.
 * @this {Character}
 * @returns {void}
 */
function beginThrow() {
  this.animationFinished = false;
  this.isThrowing = true;
  this.lastActionTime = Date.now();
  this.throwSound.currentTime = 0;
  this.throwSound.play().catch(() => { });
}

/**
 * Plays the throw frames and finishes the sequence afterwards.
 * @this {Character}
 * @returns {void}
 */
function playThrowFrames() {
  const imgs = this.IMAGES_THROW;
  let i = 0;

  const id = setInterval(() => {
    this.loadImage(imgs[i++]);
    if (i >= imgs.length) this.finishThrowFrames(id);
  }, 50);
}

/**
 * Stops the frame interval and spawns the throwable object afterwards.
 * @this {Character}
 * @param {number} id - Interval ID.
 * @returns {void}
 */
function finishThrowFrames(id) {
  clearInterval(id);
  setTimeout(() => this.spawnSalsaAndFinish(), 50);
}

/**
 * Decreases salsa, creates the throwable object, and resets the state.
 * @this {Character}
 * @returns {void}
 */
function spawnSalsaAndFinish() {
  if (!this.world?.statusBarSalsa) return;
  this.world.statusBarSalsa.salsaCount--;
  this.spawnSalsaThrow();
  this.finishThrow();
}

/**
 * Creates a SalsaThrow object and adds it to the world.
 * @this {Character}
 * @returns {void}
 */
function spawnSalsaThrow() {
  const offsetX = this.otherDirection ? -50 : 100;
  const salsa = new SalsaThrow(
    this.x + offsetX,
    this.y + this.height / 2 + 20,
    this.otherDirection
  );
  this.world?.throwableObjects?.push(salsa);
}

/**
 * Resets the throw state and shows the idle frame.
 * @this {Character}
 * @returns {void}
 */
function finishThrow() {
  this.loadImage(this.IMAGES_IDLE[0]);
  this.animationFinished = true;
  this.isThrowing = false;
}

//#endregion

//#region Death animation

/**
 * Starts the death animation (once) incl. sounds + falling animation.
 * @this {Character}
 * @returns {void}
 */
function playDeathAnimation() {
  if (this.isDying) return;
  this.startDeathState();
  this.scheduleDeathSounds(500);
  this.startDeathFallAnim();
}

/**
 * Sets initial values for the death animation and pauses world movement.
 * @this {Character}
 * @returns {void}
 */
function startDeathState() {
  this.isDying = true;
  this.world?.pauseAllMovements?.();
  this.animationFinished = false;
  this.deathFrameIndex = 0;
  this.deathFallVelocity = 0;
}

/**
 * Schedules playing the death sounds.
 * @this {Character}
 * @param {number} ms - Delay in ms.
 * @returns {void}
 */
function scheduleDeathSounds(ms) {
  setTimeout(() => this.playDeathSounds(), ms);
}

/**
 * Plays death and fail sounds.
 * @this {Character}
 * @returns {void}
 */
function playDeathSounds() {
  this.deathSound = new Audio('audio/dead-sound.mp3');
  this.deathSound.volume = 0.6;
  this.deathSound.play().catch(() => { });

  this.failSound = new Audio('audio/Fail-2.mp3');
  this.failSound.volume = 0.2;
  this.failSound.playbackRate = 0.7;
  this.failSound.play().catch(() => { });
}

/**
 * Starts the interval that drives death frames + falling physics.
 * @this {Character}
 * @returns {void}
 */
function startDeathFallAnim() {
  this.deathInterval = setInterval(() => this.stepDeathFallAnim(), 250);
}

/**
 * One step of the death animation (frame + physics + optional finish).
 * @this {Character}
 * @returns {void}
 */
function stepDeathFallAnim() {
  this.stepDeathFrames();
  this.stepDeathFallPhysics();
  if (this.shouldFinishDeathAnim()) this.finishDeathAnim();
}

/**
 * Shows the next dead frame (until the end of the array).
 * @this {Character}
 * @returns {void}
 */
function stepDeathFrames() {
  if (this.deathFrameIndex >= this.IMAGES_DEAD.length) return;
  this.loadImage(this.IMAGES_DEAD[this.deathFrameIndex++]);
}

/**
 * Updates falling physics during the death animation.
 * @this {Character}
 * @returns {void}
 */
function stepDeathFallPhysics() {
  this.deathFallVelocity += 0.5;
  this.y += this.deathFallVelocity;
}

/**
 * Checks whether the death animation should finish.
 * @this {Character}
 * @returns {boolean} True if off-screen or all frames are done.
 */
function shouldFinishDeathAnim() {
  return this.y > 480 || this.deathFrameIndex >= this.IMAGES_DEAD.length;
}

/**
 * Finishes the death animation and sets the final dead frame.
 * @this {Character}
 * @returns {void}
 */
function finishDeathAnim() {
  clearInterval(this.deathInterval);
  this.animationFinished = true;
  this.loadImage(this.IMAGES_DEAD[this.IMAGES_DEAD.length - 1]);
}

//#endregion

//#region Falling after death + removal

/**
 * Lets the character keep falling after death and removes it from the world afterwards.
 * @this {Character}
 * @returns {void}
 */
function startFallingWhenDead() {
  if (this.fallingInterval) return;

  this.fallingInterval = setInterval(() => {
    if (this.isDead || this.isDying) this.y += 3;
    if (this.y <= 600) return;
    clearInterval(this.fallingInterval);
    this.removeFromWorld();
  }, 1000 / 30);
}

/**
 * Removes the character from the enemies list (World.level.enemies), if present.
 * @this {Character}
 * @returns {void}
 */
function removeFromWorld() {
  const enemies = this.world?.level?.enemies;
  if (!enemies) return;

  const idx = enemies.indexOf(this);
  if (idx > -1) enemies.splice(idx, 1);
}

//#endregion
