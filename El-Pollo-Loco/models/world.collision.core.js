//#region World collision core

/**
 * @file models/world.collision.core.js
 * @description
 * World collision CORE:
 * - collision loop (checkCollisions / handleCollisionTick)
 * - enemy collisions (endboss / bodyguard / regular enemies)
 * - contact damage (endboss + regular enemies)
 * - throwable hits (SalsaThrow)
 */

Object.assign(World.prototype, {
  checkCollisions,
  handleCollisionTick,
  createCollisionState,

  scanEnemyCollisions,
  scanEndboss,
  isStompFromAbove,
  applyEndbossStomp,
  knockbackAfterEndbossStomp,
  checkEndbossDeath,

  scanBodyguard,
  applyBodyguardStomp,
  applyBodyguardBounce,
  clampCharacterToViewport,
  applyBodyguardSideHit,

  collectNormalEnemy,
  handleNormalEnemyStomps,
  isJumpedOnEnemy,
  getBox,

  handleEndbossContactDamage,
  tryEndbossContactHit,

  handleNormalEnemyContactDamage,
  tryNormalEnemyContactHit,
  isGloballyImmune,

  cancelHealing,
  damageCharacterOrDie,

  handleThrowableHits,
  trySalsaHit,
  markSalsaHit,
  playHitSound,
  removeSalsaAfterSplash,
  applySalsaDamage,
  damageEndbossBySalsa,

  killChickenBySalsa,
  setSalsaDeathImage,
  setAlpha,
  blinkEnemySoft,
  applySoftBlink,
});

/**
 * Starts the world's collision loop.
 * Calls handleCollisionTick every 50ms.
 *
 * @this {World}
 * @returns {void}
 */
function checkCollisions() {
  this.collisionInterval = setInterval(() => this.handleCollisionTick(), 50);
}

/**
 * One tick:
 * - scan enemies + stomps + contact damage
 * - throwable hits (salsa)
 * - pickups are handled in world.collision.pickups.js
 *
 * @this {World}
 * @returns {void}
 */
function handleCollisionTick() {
  if (this.isPaused) return;

  const state = this.createCollisionState();
  this.scanEnemyCollisions(state);

  this.handleNormalEnemyStomps(state);
  this.handleEndbossContactDamage(state);
  this.handleNormalEnemyContactDamage(state);

  this.handleThrowableHits();

  // Pickups come from the second file
  this.handleCorncobPickup?.();
  this.handleCoinPickups?.();
  this.handleSalsaPickups?.();
  this.handleMaracasPickup?.();
}

/**
 * Creates a small state object for this collision tick.
 *
 * @this {World}
 * @returns {{ collidedEnemies: Array<{enemy:any,index:number}>, hitEndbossFromAbove: boolean, jumpedOnEnemy: boolean }}
 */
function createCollisionState() {
  return { collidedEnemies: [], hitEndbossFromAbove: false, jumpedOnEnemy: false };
}

/**
 * Scans all enemies and delegates to endboss/bodyguard/regular enemy handlers.
 *
 * @this {World}
 * @param {ReturnType<typeof createCollisionState>} state
 * @returns {void}
 */
function scanEnemyCollisions(state) {
  this.level.enemies.forEach((enemy, index) => {
    if (enemy instanceof Endboss) return this.scanEndboss(enemy, state);
    if (enemy instanceof Bodyguard) return this.scanBodyguard(enemy);
    this.collectNormalEnemy(enemy, index, state);
  });
}

/**
 * Checks collision with the endboss and detects a stomp from above.
 *
 * @this {World}
 * @param {Endboss} enemy
 * @param {ReturnType<typeof createCollisionState>} state
 * @returns {void}
 */
function scanEndboss(enemy, state) {
  if (!this.character.isColliding(enemy)) return;
  if (!this.isStompFromAbove(enemy)) return;

  state.hitEndbossFromAbove = true;
  this.applyEndbossStomp(enemy);
}

/**
 * Returns true if the character is stomping the enemy from above.
 *
 * @this {World}
 * @param {MovableObject} enemy
 * @returns {boolean}
 */
function isStompFromAbove(enemy) {
  const cBottom = this.character.y + this.character.height;
  const eTop = enemy.y;
  const eMid = enemy.y + enemy.height / 2;

  return (
    this.character.isAboveGround() &&
    this.character.speedY < 0 &&
    cBottom < eMid &&
    cBottom > eTop - 15
  );
}

/**
 * Applies stomp damage to the endboss and triggers knockback + death check.
 *
 * @this {World}
 * @param {Endboss} enemy
 * @returns {void}
 */
function applyEndbossStomp(enemy) {
  enemy.activate();
  enemy.energy = (enemy.energy || 100) - 20;

  this.lastEndbossBounce = Date.now();
  this.endbossBar?.setPercentage(enemy.energy);

  this.knockbackAfterEndbossStomp();
  this.checkEndbossDeath(enemy);
}

/**
 * Applies knockback to the character after an endboss stomp.
 *
 * @this {World}
 * @returns {void}
 */
function knockbackAfterEndbossStomp() {
  this.character.speedY = 20;
  this.character.speedX = -15;
  this.character.knockbackActive = true;
}

/**
 * Checks if the endboss died and triggers death handling.
 *
 * @this {World}
 * @param {Endboss} enemy
 * @returns {void}
 */
function checkEndbossDeath(enemy) {
  if (enemy.energy > 0 || enemy.isDead) return;
  enemy.isDead = true;
  enemy.onDeath?.();
  enemy.startFallingWhenDead();
}

/**
 * Handles collision with the bodyguard: stomp or side-hit.
 *
 * @this {World}
 * @param {Bodyguard} enemy
 * @returns {void}
 */
function scanBodyguard(enemy) {
  if (!this.character.isColliding(enemy) || enemy.isDead) return;
  if (this.isStompFromAbove(enemy)) return this.applyBodyguardStomp(enemy);
  this.applyBodyguardSideHit();
}

/**
 * Applies a stomp hit to the bodyguard and bounces the character.
 *
 * @this {World}
 * @param {Bodyguard} enemy
 * @returns {void}
 */
function applyBodyguardStomp(enemy) {
  enemy.hit();
  this.applyBodyguardBounce();
  setTimeout(() => this.clampCharacterToViewport(), 20);
}

/**
 * Bounces the character away after stomping the bodyguard.
 *
 * @this {World}
 * @returns {void}
 */
function applyBodyguardBounce() {
  const dir = Math.random() < 0.5 ? -1 : 1;
  this.character.speedY = 18;
  this.character.speedX = 10 * dir;
  this.character.knockbackActive = true;
}

/**
 * Clamps the character position into the current viewport while in the boss area.
 *
 * @this {World}
 * @returns {void}
 */
function clampCharacterToViewport() {
  const viewLeft = -this.camera_x;
  const viewRight = -this.camera_x + this.canvas.width;
  const margin = 30;

  const minX = viewLeft + margin;
  const maxX = viewRight - this.character.width - margin;

  if (this.character.x < minX) this.character.x = minX;
  if (this.character.x > maxX) this.character.x = maxX;
}

/**
 * Applies contact damage when the character hits the bodyguard from the side.
 * Uses a short cooldown to prevent damage spam.
 *
 * @this {World}
 * @returns {void}
 */
function applyBodyguardSideHit() {
  const now = Date.now();
  if (this.lastBodyguardHit && now - this.lastBodyguardHit <= 1000) return;
  this.lastBodyguardHit = now;
  this.damageCharacterOrDie();
}

/**
 * Collects normal enemies that are actually enemies and currently colliding.
 *
 * @this {World}
 * @param {any} enemy
 * @param {number} index
 * @param {ReturnType<typeof createCollisionState>} state
 * @returns {void}
 */
function collectNormalEnemy(enemy, index, state) {
  if (!this.isActualEnemy(enemy)) return;
  if (!this.character.isColliding(enemy) || enemy.isDead) return;
  state.collidedEnemies.push({ enemy, index });
}

/**
 * Handles stomps on normal enemies (chickens) and applies bounce.
 *
 * @this {World}
 * @param {ReturnType<typeof createCollisionState>} state
 * @returns {void}
 */
function handleNormalEnemyStomps(state) {
  state.collidedEnemies.forEach(({ enemy }) => {
    if (!this.isJumpedOnEnemy(enemy) || enemy.isDead) return;

    this.killEnemy(enemy);
    this.character.speedY = 15;
    this.lastEnemyBounce = Date.now();
    state.jumpedOnEnemy = true;
  });

  if (state.jumpedOnEnemy) this.character.speedY = 15;
}

/**
 * Returns true if the character jumped on top of an enemy.
 *
 * @this {World}
 * @param {MovableObject} enemy
 * @returns {boolean}
 */
function isJumpedOnEnemy(enemy) {
  const charBox = this.getBox(this.character);
  const enemyBox = this.getBox(enemy);

  const falling = this.character.speedY < 0;
  const charBottom = charBox.y + charBox.height;
  const charMid = charBox.y + charBox.height / 2;

  const enemyTop = enemyBox.y;
  const enemyMid = enemyBox.y + enemyBox.height / 2;

  const verticalDiff = charBottom - enemyTop;
  return falling && verticalDiff > -30 && verticalDiff < 30 && charMid < enemyMid;
}

/**
 * Returns collision box for an object, falling back to x/y/width/height.
 *
 * @param {any} obj
 * @returns {{x:number,y:number,width:number,height:number}}
 */
function getBox(obj) {
  return obj.collisionBox || { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
}

/**
 * Handles endboss contact damage if there was no stomp/bounce recently.
 *
 * @this {World}
 * @param {ReturnType<typeof createCollisionState>} state
 * @returns {void}
 */
function handleEndbossContactDamage(state) {
  const bounced = this.lastEndbossBounce && Date.now() - this.lastEndbossBounce < 400;
  if (state.hitEndbossFromAbove || bounced) return;

  this.level.enemies.forEach((enemy) => this.tryEndbossContactHit(enemy));
}

/**
 * Tries to apply contact damage from the endboss to the character.
 *
 * @this {World}
 * @param {any} enemy
 * @returns {void}
 */
function tryEndbossContactHit(enemy) {
  if (!(enemy instanceof Endboss)) return;
  if (!this.character.isColliding(enemy) || enemy.isDead) return;

  const now = Date.now();
  if (this.lastEndbossHit && now - this.lastEndbossHit <= 1000) return;

  this.lastEndbossHit = now;
  this.cancelHealing();
  this.damageCharacterOrDie();
}

/**
 * Handles contact damage from normal enemies (if no stomp/bounce happened).
 *
 * @this {World}
 * @param {ReturnType<typeof createCollisionState>} state
 * @returns {void}
 */
function handleNormalEnemyContactDamage(state) {
  const bounced = this.lastEnemyBounce && Date.now() - this.lastEnemyBounce < 200;
  if (state.jumpedOnEnemy || bounced) return;

  state.collidedEnemies.forEach(({ enemy }) => this.tryNormalEnemyContactHit(enemy));
}

/**
 * Tries to apply contact damage from a normal enemy.
 *
 * @this {World}
 * @param {any} enemy
 * @returns {void}
 */
function tryNormalEnemyContactHit(enemy) {
  if (enemy.isDead) return;

  const now = Date.now();
  if (this.isGloballyImmune(now)) return;

  if (this.lastEnemyHit && now - this.lastEnemyHit <= 800) return;
  this.lastEnemyHit = now;

  this.character.lastGlobalHit = now;
  this.cancelHealing();
  this.damageCharacterOrDie();
}

/**
 * Returns true if the character is globally immune to contact damage (short invulnerability).
 *
 * @this {World}
 * @param {number} now
 * @returns {boolean}
 */
function isGloballyImmune(now) {
  return this.character.lastGlobalHit && now - this.character.lastGlobalHit < 1300;
}

/**
 * Cancels heal feedback (blink + sound) when taking damage.
 *
 * @this {World}
 * @returns {void}
 */
function cancelHealing() {
  this.statusBar?.stopBlink?.();
  if (!this.healSound) return;

  this.healSound.pause();
  this.healSound.currentTime = 0;
}

/**
 * Damages the character and triggers death/end-game if health reaches 0.
 *
 * @this {World}
 * @returns {void}
 */
function damageCharacterOrDie() {
  this.character.hit();
  this.statusBar.setPercentage(this.character.energy);

  if (this.character.energy > 0) return;

  this.character.isDead = true;
  this.statusBar.setPercentage(0);

  this.character.playDeathAnimation();
  this.character.startFallingWhenDead();
  this.endGame(false);
}

/**
 * Checks all throwable objects against all enemies.
 *
 * @this {World}
 * @returns {void}
 */
function handleThrowableHits() {
  this.throwableObjects.forEach((salsa, index) => {
    this.level.enemies.forEach((enemy) => this.trySalsaHit(salsa, index, enemy));
  });
}

/**
 * Tries to apply a salsa hit to an enemy.
 *
 * @this {World}
 * @param {SalsaThrow} salsa
 * @param {number} index
 * @param {any} enemy
 * @returns {void}
 */
function trySalsaHit(salsa, index, enemy) {
  if (enemy.isDead || salsa.hasHit) return;
  if (!salsa.isColliding(enemy)) return;

  this.markSalsaHit(salsa);
  this.playHitSound();
  this.removeSalsaAfterSplash(salsa, index);
  this.applySalsaDamage(enemy);
}

/**
 * Marks salsa as "hit" and stops its rotation sound.
 *
 * @param {SalsaThrow} salsa
 * @returns {void}
 */
function markSalsaHit(salsa) {
  salsa.hasHit = true;
  salsa.stopSound();
}

/**
 * Plays the hit sound (safe fallback).
 *
 * @returns {void}
 */
function playHitSound() {
  const hitSound = new Audio('audio/hit-sound.mp3');
  hitSound.volume = 0.5;
  hitSound.play().catch((e) => console.warn('Hit sound error:', e));
}

/**
 * Removes the salsa after the splash animation finished.
 *
 * @this {World}
 * @param {SalsaThrow} salsa
 * @param {number} index
 * @returns {void}
 */
function removeSalsaAfterSplash(salsa, index) {
  salsa.splashAnimation(() => this.throwableObjects.splice(index, 1));
}

/**
 * Applies salsa damage depending on the enemy type.
 *
 * @this {World}
 * @param {any} enemy
 * @returns {void}
 */
function applySalsaDamage(enemy) {
  if (enemy instanceof Bodyguard) return enemy.hit();
  if (enemy instanceof Endboss) return this.damageEndbossBySalsa(enemy);
  if (enemy instanceof Chicken || enemy instanceof ChickenSmall) this.killChickenBySalsa(enemy);
}

/**
 * Damages the endboss by salsa and handles death if needed.
 *
 * @this {World}
 * @param {Endboss} enemy
 * @returns {void}
 */
function damageEndbossBySalsa(enemy) {
  enemy.activate();
  enemy.energy = (enemy.energy || 100) - 20;

  this.endbossBar?.setPercentage(enemy.energy);

  if (enemy.energy > 0 || enemy.isDead) return;

  enemy.isDead = true;
  enemy.onDeath?.();
  enemy.startFallingWhenDead();
}

/**
 * Kills a chicken by salsa hit and applies a soft blink + delayed removal.
 *
 * @this {World}
 * @param {Chicken|ChickenSmall} enemy
 * @returns {void}
 */
function killChickenBySalsa(enemy) {
  if (!enemy || enemy.isDead) return;

  this.markEnemyDead(enemy); // exists in your World already
  this.setSalsaDeathImage(enemy);

  this.setAlpha(enemy, 1);
  this.blinkEnemySoft(enemy, 1000);
  this.removeEnemySoon(enemy, 1000); // exists in your World already
}

/**
 * Sets the correct salsa-death image for chicken types.
 *
 * @param {Chicken|ChickenSmall} enemy
 * @returns {void}
 */
function setSalsaDeathImage(enemy) {
  const path =
    enemy instanceof Chicken
      ? 'img/3_enemies_chicken/chicken_normal/2_dead/salsa-dead/dead-1.png'
      : 'img/3_enemies_chicken/chicken_small/salsa-dead/dead.png';

  enemy.loadImage(path);
}

/**
 * Sets a custom alpha value (used by your draw pipeline).
 *
 * @param {any} enemy
 * @param {number} value
 * @returns {void}
 */
function setAlpha(enemy, value) {
  enemy.alpha = value;
}

/**
 * Applies a soft blink effect by modulating alpha over time.
 *
 * @this {World}
 * @param {any} enemy
 * @param {number} ms
 * @returns {void}
 */
function blinkEnemySoft(enemy, ms) {
  const steps = 20;
  const ticks = Math.max(1, Math.floor(ms / 50));
  let phase = 0;

  const id = setInterval(() => {
    this.applySoftBlink(enemy, phase, steps);
    if (++phase >= ticks) clearInterval(id);
  }, 50);
}

/**
 * Computes and applies the alpha value for the soft blink.
 *
 * @this {World}
 * @param {any} enemy
 * @param {number} phase
 * @param {number} steps
 * @returns {void}
 */
function applySoftBlink(enemy, phase, steps) {
  const t = (phase % steps) / steps;
  this.setAlpha(enemy, 0.3 + Math.abs(Math.sin(t * Math.PI)) * 0.7);
}

//#endregion
