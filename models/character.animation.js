//#region Character animation mixin

/**
 * @file models/character.animation.js
 * @description
 * Animation and idle system for the character.
 * Attached via Object.assign to Character.prototype.
 *
 * Includes:
 * - Main animation loop (50ms)
 * - Selecting the correct standing animation (hurt/air/walk/idle/long-idle)
 * - Idle and long-idle logic incl. interval handling
 *
 * Requirements:
 * - Character exists globally (class Character)
 * - Character has: world, isPaused, isThrowing, freezeForBodyguard, lastMoveTime,
 *   IMAGES_* arrays, playAnimation(), loadImage(), isAboveGround(), isHurt(), playDeathAnimation()
 */

Object.assign(Character.prototype, {
  startAnimationLoop,
  tickAnimation,
  showFreezeFrame,
  updateStandingAnimation,
  handleDeathAnim,
  playHurtAnim,
  playAirAnim,
  isWalking,
  playWalkAnim,
  playIdleOrLongIdle,
  startLongIdleIfNeeded,
  startIdleIfNeeded,
  handleJumpAnimation,
  showJumpFrame,
  showFallFrame,
  handleMovement,
  startLongIdleAnimation,
  stopLongIdleAnimation,
  playIdleAnimation,
  isInIdleWindow,
  stopIdleInterval,
  showNextIdleFrame,
});

//#endregion

//#region Main animation loop

/**
 * Starts the animation loop for the character (runs every 50ms).
 * @this {Character}
 * @returns {void}
 */
function startAnimationLoop() {
  setInterval(() => this.tickAnimation(), 50);
}

/**
 * One tick of the animation loop.
 * - ignores pause / missing world / active throw animation
 * - shows a freeze frame while the bodyguard sequence is active
 * - otherwise selects the standing animation based on the current state
 * @this {Character}
 * @returns {void}
 */
function tickAnimation() {
  if (this.isPaused) return;
  if (!this.world) return;
  if (this.isThrowing) return;

  if (this.freezeForBodyguard) return this.showFreezeFrame();
  this.updateStandingAnimation(Date.now() - this.lastMoveTime);
}

/**
 * Shows the freeze frame (e.g. during the bodyguard landing).
 * @this {Character}
 * @returns {void}
 */
function showFreezeFrame() {
  this.loadImage('img/2_character_pepe/3_jump/J-31.png');
}

//#endregion

//#region Standing animation selection

/**
 * Decides which standing/loop animation should be shown.
 * Order: death -> hurt -> air -> walk -> idle/long-idle.
 * @this {Character}
 * @param {number} idleMs - Effective idle time in milliseconds.
 * @returns {void}
 */
function updateStandingAnimation(idleMs) {
  if (this.energy <= 0) return this.handleDeathAnim();
  if (this.isHurt()) return this.playHurtAnim();
  if (this.isAboveGround()) return this.playAirAnim();
  if (this.isWalking()) return this.playWalkAnim();
  this.playIdleOrLongIdle(idleMs);
}

/**
 * Death animation handling: stops long-idle and triggers the death animation.
 * @this {Character}
 * @returns {void}
 */
function handleDeathAnim() {
  this.stopLongIdleAnimation();
  this.playDeathAnimation(); // character.combat.js
}

/**
 * Hurt animation: stops long-idle and plays hurt frames.
 * @this {Character}
 * @returns {void}
 */
function playHurtAnim() {
  this.stopLongIdleAnimation();
  this.playAnimation(this.IMAGES_HURT);
}

/**
 * Air animation: stops long-idle and plays jump/fall frames.
 * @this {Character}
 * @returns {void}
 */
function playAirAnim() {
  this.stopLongIdleAnimation();
  this.handleJumpAnimation();
}

/**
 * Checks whether the character is currently walking (left/right pressed).
 * @this {Character}
 * @returns {boolean} True if LEFT or RIGHT is pressed.
 */
function isWalking() {
  return this.world.keyboard.RIGHT || this.world.keyboard.LEFT;
}

/**
 * Walk animation: stops long-idle and plays walking frames.
 * @this {Character}
 * @returns {void}
 */
function playWalkAnim() {
  this.stopLongIdleAnimation();
  this.playAnimation(this.IMAGES_WALKING);
}

/**
 * Chooses between idle, idle animation, or long-idle animation based on idle time.
 * @this {Character}
 * @param {number} idleMs - Effective idle time in milliseconds.
 * @returns {void}
 */
function playIdleOrLongIdle(idleMs) {
  if (idleMs > 12000) return this.startLongIdleIfNeeded();
  if (idleMs > 10000) return this.startIdleIfNeeded();
  this.stopLongIdleAnimation();
  this.loadImage(this.IMAGES_IDLE[0]);
}

/**
 * Starts long-idle only if it is not already active.
 * @this {Character}
 * @returns {void}
 */
function startLongIdleIfNeeded() {
  if (!this.longIdleActive) this.startLongIdleAnimation();
}

/**
 * Starts idle animation only if it has not been started yet.
 * @this {Character}
 * @returns {void}
 */
function startIdleIfNeeded() {
  if (!this.idleAnimationStarted) this.playIdleAnimation();
}

//#endregion

//#region Jump / fall frames

/**
 * Selects the jump/fall frame based on speedY (up/down) or highest point.
 * @this {Character}
 * @returns {void}
 */
function handleJumpAnimation() {
  if (this.speedY > 0) return this.showJumpFrame();
  if (this.speedY < 0) return this.showFallFrame();
  this.loadImage(this.IMAGES_JUMPING[this.IMAGES_JUMPING.length - 1]);
}

/**
 * Shows a jump frame based on the current jump speed progress.
 * @this {Character}
 * @returns {void}
 */
function showJumpFrame() {
  const p = Math.min(1, this.speedY / 1);
  const i = Math.floor(p * (this.IMAGES_JUMPING.length - 1));
  this.loadImage(this.IMAGES_JUMPING[i]);
}

/**
 * Shows a fall frame based on the fall speed.
 * @this {Character}
 * @returns {void}
 */
function showFallFrame() {
  const p = Math.min(1, Math.abs(this.speedY) / 20);
  const i = Math.floor(p * (this.IMAGES_FALLING.length - 1));
  this.loadImage(this.IMAGES_FALLING[i]);
}

//#endregion

//#region Movement + idle handling

/**
 * Called when movement occurred:
 * - resets the idle timer
 * - stops long-idle
 * @this {Character}
 * @returns {void}
 */
function handleMovement() {
  this.lastMoveTime = Date.now();
  this.idleAnimationStarted = false;
  this.stopLongIdleAnimation();
}

/**
 * Starts the long-idle animation (loop every 200ms).
 * Automatically stops as soon as movement is detected again.
 * @this {Character}
 * @returns {void}
 */
function startLongIdleAnimation() {
  this.longIdleActive = true;
  this.idleAnimationStarted = false;
  let i = 0;

  this.longIdleInterval = setInterval(() => {
    if (this.isPaused || this.world?.isPaused) return;
    if (Date.now() - this.lastMoveTime < 12000) return this.stopLongIdleAnimation();
    this.loadImage(this.IMAGES_LONG_IDLE[i]);
    i = (i + 1) % this.IMAGES_LONG_IDLE.length;
  }, 200);
}

/**
 * Stops the long-idle animation and resets flags.
 * @this {Character}
 * @returns {void}
 */
function stopLongIdleAnimation() {
  if (this.longIdleInterval) clearInterval(this.longIdleInterval);
  this.longIdleInterval = null;
  this.longIdleActive = false;
}

/**
 * Starts the normal idle animation (only within the idle time window 10–12s).
 * @this {Character}
 * @returns {void}
 */
function playIdleAnimation() {
  this.idleAnimationStarted = true;
  this.idleFrame = 0;

  const id = setInterval(() => {
    if (!this.isInIdleWindow()) return this.stopIdleInterval(id);
    this.showNextIdleFrame();
  }, 200);
}

/**
 * Checks whether the current time is within the idle time window (10–12 seconds).
 * @this {Character}
 * @returns {boolean} True if within the idle window.
 */
function isInIdleWindow() {
  const dt = Date.now() - this.lastMoveTime;
  return dt >= 10000 && dt <= 12000;
}

/**
 * Stops the idle interval and resets the flag.
 * @this {Character}
 * @param {number} id - Interval ID.
 * @returns {void}
 */
function stopIdleInterval(id) {
  clearInterval(id);
  this.idleAnimationStarted = false;
}

/**
 * Shows the next idle frame (clamped to the last image).
 * @this {Character}
 * @returns {void}
 */
function showNextIdleFrame() {
  const i = Math.min(this.idleFrame, this.IMAGES_IDLE.length - 1);
  this.loadImage(this.IMAGES_IDLE[i]);
  this.idleFrame++;
}

//#endregion
