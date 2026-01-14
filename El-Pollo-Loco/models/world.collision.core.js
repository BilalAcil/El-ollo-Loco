//#region World collision core
/**
 * @file models/world.collision.core.js
 * Collision core:
 * - main loop (tick)
 * - enemy/bodyguard/endboss collisions
 * - contact damage + stomp logic
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

/** Start collision loop (50ms). */
function checkCollisions() {
  this.collisionInterval = setInterval(() => this.handleCollisionTick(), 50);
}

/** One tick: enemies, contact dmg, throwables + optional pickups. */
function handleCollisionTick() {
  if (this.isPaused) return;

  const state = this.createCollisionState();
  this.scanEnemyCollisions(state);

  this.handleNormalEnemyStomps(state);
  this.handleEndbossContactDamage(state);
  this.handleNormalEnemyContactDamage(state);

  this.handleThrowableHits();

  // pickups live in world.collision.pickups.js
  this.handleCorncobPickup?.();
  this.handleCoinPickups?.();
  this.handleSalsaPickups?.();
  this.handleMaracasPickup?.();
}

/** Small per-tick state. */
function createCollisionState() {
  return { collidedEnemies: [], hitEndbossFromAbove: false, jumpedOnEnemy: false };
}

/** Scan all enemies (endboss/bodyguard/regular). */
function scanEnemyCollisions(state) {
  this.level.enemies.forEach((enemy, index) => {
    if (enemy instanceof Endboss) return this.scanEndboss(enemy, state);
    if (enemy instanceof Bodyguard) return this.scanBodyguard(enemy);
    this.collectNormalEnemy(enemy, index, state);
  });
}

//#region Endboss
/** Endboss: only react on stomp from above. */
function scanEndboss(enemy, state) {
  if (!this.character.isColliding(enemy)) return;
  if (!this.isStompFromAbove(enemy)) return;

  state.hitEndbossFromAbove = true;
  this.applyEndbossStomp(enemy);
}

/** True if character is falling onto the enemy top half. */
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

/** Apply stomp dmg, bounce + death check. */
function applyEndbossStomp(enemy) {
  enemy.activate();
  enemy.energy = (enemy.energy || 100) - 20;

  this.lastEndbossBounce = Date.now();
  this.endbossBar?.setPercentage(enemy.energy);

  this.knockbackAfterEndbossStomp();
  this.checkEndbossDeath(enemy);
}

/** Character knockback after stomping boss. */
function knockbackAfterEndbossStomp() {
  this.character.speedY = 20;
  this.character.speedX = -15;
  this.character.knockbackActive = true;
}

/** Boss death handling. */
function checkEndbossDeath(enemy) {
  if (enemy.energy > 0 || enemy.isDead) return;
  enemy.isDead = true;
  enemy.onDeath?.();
  enemy.startFallingWhenDead();
}
//#endregion

//#region Bodyguard
/** Bodyguard: stomp or side-hit. */
function scanBodyguard(enemy) {
  if (!this.character.isColliding(enemy) || enemy.isDead) return;
  if (this.isStompFromAbove(enemy)) return this.applyBodyguardStomp(enemy);
  this.applyBodyguardSideHit();
}

/** Stomp bodyguard + bounce. */
function applyBodyguardStomp(enemy) {
  enemy.hit();
  this.applyBodyguardBounce();
  setTimeout(() => this.clampCharacterToViewport(), 20);
}

/** Bounce away with random x-direction. */
function applyBodyguardBounce() {
  const dir = Math.random() < 0.5 ? -1 : 1;
  this.character.speedY = 18;
  this.character.speedX = 10 * dir;
  this.character.knockbackActive = true;
}

/** Keep player inside current viewport (boss area). */
function clampCharacterToViewport() {
  const viewLeft = -this.camera_x;
  const viewRight = -this.camera_x + this.canvas.width;
  const margin = 30;

  const minX = viewLeft + margin;
  const maxX = viewRight - this.character.width - margin;

  if (this.character.x < minX) this.character.x = minX;
  if (this.character.x > maxX) this.character.x = maxX;
}

/** Side-hit dmg with cooldown. */
function applyBodyguardSideHit() {
  const now = Date.now();
  if (this.lastBodyguardHit && now - this.lastBodyguardHit <= 1000) return;
  this.lastBodyguardHit = now;
  this.damageCharacterOrDie();
}
//#endregion

//#region Normal enemies
/** Collect regular enemies that are colliding this tick. */
function collectNormalEnemy(enemy, index, state) {
  if (!this.isActualEnemy(enemy)) return;
  if (!this.character.isColliding(enemy) || enemy.isDead) return;
  state.collidedEnemies.push({ enemy, index });
}

/** Handle stomps on regular enemies. */
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

/** True if character landed on enemy from above (AABB-based). */
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

/** Collision box helper (uses collisionBox if present). */
function getBox(obj) {
  return obj.collisionBox || { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
}
//#endregion

//#region Contact damage
/** Boss contact damage (unless stomp/bounce recently). */
function handleEndbossContactDamage(state) {
  const bounced = this.lastEndbossBounce && Date.now() - this.lastEndbossBounce < 400;
  if (state.hitEndbossFromAbove || bounced) return;

  this.level.enemies.forEach((enemy) => this.tryEndbossContactHit(enemy));
}

/** Apply boss contact hit with cooldown. */
function tryEndbossContactHit(enemy) {
  if (!(enemy instanceof Endboss)) return;
  if (!this.character.isColliding(enemy) || enemy.isDead) return;

  const now = Date.now();
  if (this.lastEndbossHit && now - this.lastEndbossHit <= 1000) return;

  this.lastEndbossHit = now;
  this.cancelHealing();
  this.damageCharacterOrDie();
}

/** Regular enemy contact damage (unless stomp/bounce recently). */
function handleNormalEnemyContactDamage(state) {
  const bounced = this.lastEnemyBounce && Date.now() - this.lastEnemyBounce < 200;
  if (state.jumpedOnEnemy || bounced) return;

  state.collidedEnemies.forEach(({ enemy }) => this.tryNormalEnemyContactHit(enemy));
}

/** Apply normal contact hit with global + per-enemy cooldown. */
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

/** Short invulnerability after any contact hit. */
function isGloballyImmune(now) {
  return this.character.lastGlobalHit && now - this.character.lastGlobalHit < 1300;
}

/** Stop heal blink + sound on taking damage. */
function cancelHealing() {
  this.statusBar?.stopBlink?.();
  if (!this.healSound) return;
  this.healSound.pause();
  this.healSound.currentTime = 0;
}

/** Deal dmg to player; if dead -> animations + endGame(false). */
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
//#endregion

//#region Throwables (SalsaThrow)
/** Check throwables against enemies. */
function handleThrowableHits() {
  this.throwableObjects.forEach((salsa, index) => {
    this.level.enemies.forEach((enemy) => this.trySalsaHit(salsa, index, enemy));
  });
}

/** Salsa hit -> splash + remove + apply damage by type. */
function trySalsaHit(salsa, index, enemy) {
  if (enemy.isDead || salsa.hasHit) return;
  if (!salsa.isColliding(enemy)) return;

  this.markSalsaHit(salsa);
  this.playHitSound();
  this.removeSalsaAfterSplash(salsa, index);
  this.applySalsaDamage(enemy);
}

/** Mark salsa as hit + stop rotation sound. */
function markSalsaHit(salsa) {
  salsa.hasHit = true;
  salsa.stopSound();
}

/** Play hit sound (safe). */
function playHitSound() {
  const hitSound = new Audio('audio/hit-sound.mp3');
  hitSound.volume = 0.5;
  hitSound.play().catch((e) => console.warn('Hit sound error:', e));
}

/** Remove salsa after splash ends. */
function removeSalsaAfterSplash(salsa, index) {
  salsa.splashAnimation(() => this.throwableObjects.splice(index, 1));
}

/** Apply salsa damage by enemy type. */
function applySalsaDamage(enemy) {
  if (enemy instanceof Bodyguard) return enemy.hit();
  if (enemy instanceof Endboss) return this.damageEndbossBySalsa(enemy);
  if (enemy instanceof Chicken || enemy instanceof ChickenSmall) this.killChickenBySalsa(enemy);
}

/** Boss salsa dmg + death handling. */
function damageEndbossBySalsa(enemy) {
  enemy.activate();
  enemy.energy = (enemy.energy || 100) - 20;

  this.endbossBar?.setPercentage(enemy.energy);

  if (enemy.energy > 0 || enemy.isDead) return;

  enemy.isDead = true;
  enemy.onDeath?.();
  enemy.startFallingWhenDead();
}
//#endregion

//#region Chicken salsa-death blink
/** Chicken death via salsa: image swap + soft blink + delayed removal. */
function killChickenBySalsa(enemy) {
  if (!enemy || enemy.isDead) return;

  this.markEnemyDead(enemy);
  this.setSalsaDeathImage(enemy);

  this.setAlpha(enemy, 1);
  this.blinkEnemySoft(enemy, 1000);
  this.removeEnemySoon(enemy, 1000);
}

/** Pick correct salsa-death sprite. */
function setSalsaDeathImage(enemy) {
  const path =
    enemy instanceof Chicken
      ? 'img/3_enemies_chicken/chicken_normal/2_dead/salsa-dead/dead-1.png'
      : 'img/3_enemies_chicken/chicken_small/salsa-dead/dead.png';

  enemy.loadImage(path);
}

/** Set alpha (used by draw pipeline). */
function setAlpha(enemy, value) {
  enemy.alpha = value;
}

/** Soft blink by modulating alpha over time. */
function blinkEnemySoft(enemy, ms) {
  const steps = 20;
  const ticks = Math.max(1, Math.floor(ms / 50));
  let phase = 0;

  const id = setInterval(() => {
    this.applySoftBlink(enemy, phase, steps);
    if (++phase >= ticks) clearInterval(id);
  }, 50);
}

/** Alpha curve for blink. */
function applySoftBlink(enemy, phase, steps) {
  const t = (phase % steps) / steps;
  this.setAlpha(enemy, 0.3 + Math.abs(Math.sin(t * Math.PI)) * 0.7);
}
//#endregion

//#endregion
