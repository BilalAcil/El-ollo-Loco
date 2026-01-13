//#region Character movement + camera mixin

/**
 * @file models/character.movement.js
 * @description
 * Movement/input loop for the character + camera logic.
 * Attached via Object.assign to Character.prototype.
 *
 * Includes:
 * - Movement loop (60 FPS): tickMovement()
 * - Input handling (LEFT/RIGHT/SPACE/D)
 * - Camera behavior incl. soft panning in the endboss area
 * - Knockback physics
 * - Endboss trigger + bodyguard jump
 * - Return to idle after action cooldown
 *
 * Requirements:
 * - Character has: world, x, y, width, speedX, speedY, knockbackActive,
 *   atEndboss, freezeForBodyguard, lastActionTime, actionCooldown, lastMoveTime,
 *   currentAnimation, animationFinished
 * - Methods from other files: throwAnimation(), handleMovement(), isHurt(), isDead(),
 *   isAboveGround(), jump(), moveRight(), moveLeft()
 * - World has: keyboard, canvas, camera_x, isPaused, countdown, bodyguard,
 *   startEndbossCameraPanBack(), stopCameraMoveSound()
 */

Object.assign(Character.prototype, {
  startMovementLoop,
  tickMovement,
  shouldSkipMovementTick,
  processMovementInputs,
  getRunBounds,
  moveRightIfNeeded,
  moveLeftIfNeeded,
  jumpIfNeeded,
  throwIfNeeded,
  updateCamera,
  shouldStartPanBackNow,
  startPanBackOnce,
  handleSoftPanning,
  finishSoftPanning,
  lockEndbossCamera,
  followCharacterCamera,
  applyKnockback,
  checkEndbossTrigger,
  activateEndbossArea,
  triggerBodyguardJump,
  switchToIdleIfNeeded,
});

//#endregion

//#region Movement loop (60 FPS)

/**
 * Starts the movement loop (60 FPS).
 * @this {Character}
 * @returns {void}
 */
function startMovementLoop() {
  setInterval(() => this.tickMovement(), 1000 / 60);
}

/**
 * One tick of the movement loop:
 * - update camera
 * - apply knockback
 * - process inputs (unless frozen)
 * - check endboss trigger
 * - optionally switch back to idle
 * @this {Character}
 * @returns {void}
 */
function tickMovement() {
  if (this.shouldSkipMovementTick()) return;
  this.updateCamera();
  this.applyKnockback();
  if (this.freezeForBodyguard) return;
  this.processMovementInputs();
  this.checkEndbossTrigger();
  this.switchToIdleIfNeeded();
}

/**
 * Checks whether the movement tick should be skipped (pause/missing world).
 * @this {Character}
 * @returns {boolean} True if the tick should be skipped.
 */
function shouldSkipMovementTick() {
  if (this.isPaused) return true;
  if (!this.world) return true;
  return this.world.isPaused;
}

/**
 * Reads key states and performs movement/actions.
 * @this {Character}
 * @returns {void}
 */
function processMovementInputs() {
  const { minX, maxX } = this.getRunBounds();
  this.moveRightIfNeeded(maxX);
  this.moveLeftIfNeeded(minX);
  this.jumpIfNeeded();
  this.throwIfNeeded();
}

//#endregion

//#region Movement bounds

/**
 * Calculates the allowed X bounds.
 * In the endboss area, movement is limited to the current viewport.
 * @this {Character}
 * @returns {{minX:number,maxX:number}}
 */
function getRunBounds() {
  let minX = 0;
  let maxX = this.world.level.level_end_x;

  if (this.atEndboss && this.world.canvas) {
    const viewLeft = -this.world.camera_x;
    const viewRight = viewLeft + this.world.canvas.width;
    const margin = 10;
    minX = viewLeft + margin;
    maxX = viewRight - this.width - margin;
  }
  return { minX, maxX };
}

//#endregion

//#region Input handling

/**
 * Moves right if RIGHT is pressed and within bounds.
 * @this {Character}
 * @param {number} maxX - Maximum X position.
 * @returns {void}
 */
function moveRightIfNeeded(maxX) {
  if (this.world.keyboard.RIGHT && this.x < maxX) {
    this.moveRight();
    this.otherDirection = false;
    this.handleMovement();
  }
}

/**
 * Moves left if LEFT is pressed and within bounds.
 * @this {Character}
 * @param {number} minX - Minimum X position.
 * @returns {void}
 */
function moveLeftIfNeeded(minX) {
  if (this.world.keyboard.LEFT && this.x > minX) {
    this.moveLeft();
    this.otherDirection = true;
    this.handleMovement();
  }
}

/**
 * Jumps if SPACE is pressed and the character is on the ground.
 * @this {Character}
 * @returns {void}
 */
function jumpIfNeeded() {
  if (this.world.keyboard.SPACE && !this.isAboveGround()) {
    this.jump();
    this.handleMovement();
  }
}

/**
 * Throws salsa if D is pressed and animations allow it.
 * @this {Character}
 * @returns {void}
 */
function throwIfNeeded() {
  if (this.world.keyboard.D && this.animationFinished) {
    this.throwAnimation();
    this.lastActionTime = Date.now();
    this.lastMoveTime = Date.now();
  }
}

//#endregion

//#region Camera behavior

/**
 * Updates the camera:
 * - starts pan-back if needed
 * - runs soft panning
 * - locks endboss camera or follows normally
 * @this {Character}
 * @returns {void}
 */
function updateCamera() {
  if (this.shouldStartPanBackNow()) this.startPanBackOnce();
  if (this.handleSoftPanning()) return;
  if (this.atEndboss) return this.lockEndbossCamera();
  this.followCharacterCamera();
}

/**
 * Checks whether camera pan-back should start now (bodyguard dead, etc.).
 * @this {Character}
 * @returns {boolean} True if pan-back should start now.
 */
function shouldStartPanBackNow() {
  return this.atEndboss &&
    this.world.hasBodyguardDied &&
    this.world.shouldStartCameraPanBack &&
    !this.world.isCameraPanning &&
    this.x >= 4000;
}

/**
 * Starts the pan-back exactly once.
 * @this {Character}
 * @returns {void}
 */
function startPanBackOnce() {
  this.world.startEndbossCameraPanBack();
  this.world.shouldStartCameraPanBack = false;
}

/**
 * Handles soft panning if active.
 * @this {Character}
 * @returns {boolean} True if soft panning was processed.
 */
function handleSoftPanning() {
  if (!this.world.isCameraPanning) return false;
  if (typeof this.world.cameraTargetX !== 'number') return false;

  const target = this.world.cameraTargetX;
  const speed = this.world.cameraPanSpeed || 2;

  this.world.camera_x += this.world.camera_x < target ? speed : -speed;
  if (Math.abs(this.world.camera_x - target) < 1) this.finishSoftPanning(target);
  return true;
}

/**
 * Finishes soft panning and stores the endboss camera position.
 * @this {Character}
 * @param {number} target - Camera target X value.
 * @returns {void}
 */
function finishSoftPanning(target) {
  this.world.camera_x = target;
  this.world.isCameraPanning = false;
  this.world.endbossCameraX = target;
  this.world.stopCameraMoveSound?.();
}

/**
 * Locks the camera in the endboss area to endbossCameraX.
 * @this {Character}
 * @returns {void}
 */
function lockEndbossCamera() {
  this.world.camera_x = (typeof this.world.endbossCameraX === 'number')
    ? this.world.endbossCameraX
    : (-4100 + 100);
}

/**
 * Default camera: follows the character.
 * @this {Character}
 * @returns {void}
 */
function followCharacterCamera() {
  this.world.camera_x = -this.x + 100;
}

//#endregion

//#region Knockback physics

/**
 * Applies knockback and lets it decay over time.
 * @this {Character}
 * @returns {void}
 */
function applyKnockback() {
  if (!this.knockbackActive) return;
  this.x += this.speedX;
  this.speedX *= 0.9;
  if (Math.abs(this.speedX) >= 1) return;
  this.knockbackActive = false;
  this.speedX = 0;
}

//#endregion

//#region Endboss trigger + bodyguard jump

/**
 * Checks whether the endboss area is entered.
 * @this {Character}
 * @returns {void}
 */
function checkEndbossTrigger() {
  if (this.x < 4100 || this.atEndboss) return;
  this.activateEndbossArea();
}

/**
 * Activates the endboss area:
 * - start boss music
 * - optionally hide the countdown briefly
 * - freeze the player for the bodyguard jump
 * @this {Character}
 * @returns {void}
 */
function activateEndbossArea() {
  this.atEndboss = true;
  this.world?.countdown?.playEndBossMusic();

  if (typeof this.world?.countdown?.hideTemporarily === 'function') {
    this.world.countdown.hideTemporarily(3000);
  }

  this.freezeForBodyguard = true;
  this.triggerBodyguardJump();
}

/**
 * Triggers the bodyguard jump (only once).
 * @this {Character}
 * @returns {void}
 */
function triggerBodyguardJump() {
  if (!this.world?.bodyguard || this.world.bodyguard.hasJumped) return;
  this.world.bodyguard.jumpToEndboss();
  this.world.bodyguard.hasJumped = true;
}

//#endregion

//#region Return to idle after actions

/**
 * Switches back to idle after the action cooldown (if allowed).
 * @this {Character}
 * @returns {void}
 */
function switchToIdleIfNeeded() {
  const idleAllowed =
    Date.now() - this.lastActionTime > this.actionCooldown &&
    !this.isAboveGround() &&
    !this.isHurt() &&
    !this.isDead() &&
    this.currentAnimation !== 'idle';

  if (idleAllowed) this.currentAnimation = 'idle';
}

//#endregion
