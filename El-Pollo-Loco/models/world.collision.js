// models/world.collision.js
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

  handleCorncobPickup,
  playHealPickupSound,

  handleCoinPickups,
  playCoinSound,

  handleSalsaPickups,
  playSalsaPickupSound,

  handleMaracasPickup,
  startMaracasSequence,
  playMaracasSound,
  freezeWorldForMaracas,
  clearEnemyIntervals,
  resetKeyboardInputs,
  runMaracasChoreo,
  maracasJump,
  playJumpSound,
  startMaracasWalkOff,
  finishMaracasEnding,
});

function checkCollisions() {
  this.collisionInterval = setInterval(() => this.handleCollisionTick(), 50);
}

function handleCollisionTick() {
  if (this.isPaused) return;
  const state = this.createCollisionState();
  this.scanEnemyCollisions(state);
  this.handleNormalEnemyStomps(state);
  this.handleEndbossContactDamage(state);
  this.handleNormalEnemyContactDamage(state);
  this.handleThrowableHits();
  this.handleCorncobPickup();
  this.handleCoinPickups();
  this.handleSalsaPickups();
  this.handleMaracasPickup();
}

function createCollisionState() {
  return { collidedEnemies: [], hitEndbossFromAbove: false, jumpedOnEnemy: false };
}

function scanEnemyCollisions(state) {
  this.level.enemies.forEach((enemy, index) => {
    if (enemy instanceof Endboss) return this.scanEndboss(enemy, state);
    if (enemy instanceof Bodyguard) return this.scanBodyguard(enemy);
    this.collectNormalEnemy(enemy, index, state);
  });
}

function scanEndboss(enemy, state) {
  if (!this.character.isColliding(enemy)) return;
  if (!this.isStompFromAbove(enemy)) return;
  state.hitEndbossFromAbove = true;
  this.applyEndbossStomp(enemy);
}

function isStompFromAbove(enemy) {
  const cBottom = this.character.y + this.character.height;
  const eTop = enemy.y;
  const eMid = enemy.y + enemy.height / 2;
  return this.character.isAboveGround() && this.character.speedY < 0 && cBottom < eMid && cBottom > eTop - 15;
}

function applyEndbossStomp(enemy) {
  enemy.activate();
  enemy.energy = (enemy.energy || 100) - 20;
  this.lastEndbossBounce = Date.now();
  this.endbossBar?.setPercentage(enemy.energy);
  this.knockbackAfterEndbossStomp();
  this.checkEndbossDeath(enemy);
}

function knockbackAfterEndbossStomp() {
  this.character.speedY = 20;
  this.character.speedX = -15;
  this.character.knockbackActive = true;
}

function checkEndbossDeath(enemy) {
  if (enemy.energy > 0 || enemy.isDead) return;
  enemy.isDead = true;
  enemy.onDeath?.();
  enemy.startFallingWhenDead();
}

function scanBodyguard(enemy) {
  if (!this.character.isColliding(enemy) || enemy.isDead) return;
  if (this.isStompFromAbove(enemy)) return this.applyBodyguardStomp(enemy);
  this.applyBodyguardSideHit();
}

function applyBodyguardStomp(enemy) {
  enemy.hit();
  this.applyBodyguardBounce();
  setTimeout(() => this.clampCharacterToViewport(), 20);
}

function applyBodyguardBounce() {
  const dir = Math.random() < 0.5 ? -1 : 1;
  this.character.speedY = 18;
  this.character.speedX = 10 * dir;
  this.character.knockbackActive = true;
}

function clampCharacterToViewport() {
  const viewLeft = -this.camera_x;
  const viewRight = -this.camera_x + this.canvas.width;
  const margin = 30;
  const minX = viewLeft + margin;
  const maxX = viewRight - this.character.width - margin;
  if (this.character.x < minX) this.character.x = minX;
  if (this.character.x > maxX) this.character.x = maxX;
}

function applyBodyguardSideHit() {
  const now = Date.now();
  if (this.lastBodyguardHit && now - this.lastBodyguardHit <= 1000) return;
  this.lastBodyguardHit = now;
  this.damageCharacterOrDie();
}

function collectNormalEnemy(enemy, index, state) {
  if (!this.isActualEnemy(enemy)) return;
  if (!this.character.isColliding(enemy) || enemy.isDead) return;
  state.collidedEnemies.push({ enemy, index });
}

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

function getBox(obj) {
  return obj.collisionBox || { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
}

function handleEndbossContactDamage(state) {
  const bounced = this.lastEndbossBounce && Date.now() - this.lastEndbossBounce < 400;
  if (state.hitEndbossFromAbove || bounced) return;
  this.level.enemies.forEach(enemy => this.tryEndbossContactHit(enemy));
}

function tryEndbossContactHit(enemy) {
  if (!(enemy instanceof Endboss)) return;
  if (!this.character.isColliding(enemy) || enemy.isDead) return;
  const now = Date.now();
  if (this.lastEndbossHit && now - this.lastEndbossHit <= 1000) return;
  this.lastEndbossHit = now;
  this.cancelHealing();
  this.damageCharacterOrDie();
}

function handleNormalEnemyContactDamage(state) {
  const bounced = this.lastEnemyBounce && Date.now() - this.lastEnemyBounce < 200;
  if (state.jumpedOnEnemy || bounced) return;
  state.collidedEnemies.forEach(({ enemy }) => this.tryNormalEnemyContactHit(enemy));
}

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

function isGloballyImmune(now) {
  return this.character.lastGlobalHit && now - this.character.lastGlobalHit < 1300;
}

function cancelHealing() {
  this.statusBar?.stopBlink?.();
  if (!this.healSound) return;
  this.healSound.pause();
  this.healSound.currentTime = 0;
}

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

function handleThrowableHits() {
  this.throwableObjects.forEach((salsa, index) => {
    this.level.enemies.forEach(enemy => this.trySalsaHit(salsa, index, enemy));
  });
}

function trySalsaHit(salsa, index, enemy) {
  if (enemy.isDead || salsa.hasHit) return;
  if (!salsa.isColliding(enemy)) return;
  this.markSalsaHit(salsa);
  this.playHitSound();
  this.removeSalsaAfterSplash(salsa, index);
  this.applySalsaDamage(enemy);
}

function markSalsaHit(salsa) {
  salsa.hasHit = true;
  salsa.stopSound();
}

function playHitSound() {
  const hitSound = new Audio('audio/hit-sound.mp3');
  hitSound.volume = 0.5;
  hitSound.play().catch(e => console.warn('Hit sound error:', e));
}

function removeSalsaAfterSplash(salsa, index) {
  salsa.splashAnimation(() => this.throwableObjects.splice(index, 1));
}

function applySalsaDamage(enemy) {
  if (enemy instanceof Bodyguard) return enemy.hit();
  if (enemy instanceof Endboss) return this.damageEndbossBySalsa(enemy);
  if (enemy instanceof Chicken || enemy instanceof ChickenSmall) this.killChickenBySalsa(enemy);
}

function damageEndbossBySalsa(enemy) {
  enemy.activate();
  enemy.energy = (enemy.energy || 100) - 20;
  this.endbossBar?.setPercentage(enemy.energy);
  if (enemy.energy > 0 || enemy.isDead) return;
  enemy.isDead = true;
  enemy.onDeath?.();
  enemy.startFallingWhenDead();
}

function killChickenBySalsa(enemy) {
  if (!enemy || enemy.isDead) return;
  this.markEnemyDead(enemy);
  this.setSalsaDeathImage(enemy);
  this.setAlpha(enemy, 1);
  this.blinkEnemySoft(enemy, 1000);
  this.removeEnemySoon(enemy, 1000);
}

function setSalsaDeathImage(enemy) {
  const path = (enemy instanceof Chicken)
    ? 'img/3_enemies_chicken/chicken_normal/2_dead/salsa-dead/dead-1.png'
    : 'img/3_enemies_chicken/chicken_small/salsa-dead/dead.png';
  enemy.loadImage(path);
}

function setAlpha(enemy, value) {
  enemy.alpha = value;
}

function blinkEnemySoft(enemy, ms) {
  const steps = 20;
  const ticks = Math.max(1, Math.floor(ms / 50));
  let phase = 0;

  const id = setInterval(() => {
    this.applySoftBlink(enemy, phase, steps);
    if (++phase >= ticks) clearInterval(id);
  }, 50);
}

function applySoftBlink(enemy, phase, steps) {
  const t = (phase % steps) / steps;
  this.setAlpha(enemy, 0.3 + Math.abs(Math.sin(t * Math.PI)) * 0.7);
}

function handleCorncobPickup() {
  if (!this.corncob) return;
  if (!this.character.isColliding(this.corncob)) return;
  this.corncob = null;
  this.playHealPickupSound();
  this.character.energy = 100;
  this.statusBar.setPercentage(this.character.energy);
  this.statusBar.blinkFullHealth();
}

function playHealPickupSound() {
  this.healSound.currentTime = 0;
  this.healSound.playbackRate = 1;
  this.healSound.volume = 0.6;
  this.healSound.play().catch(e => console.warn(e));
}

function handleCoinPickups() {
  this.coins.forEach((coin, index) => {
    if (!this.character.isColliding(coin)) return;
    this.coins.splice(index, 1);
    this.statusBarCoin.addCoin();
    this.playCoinSound();
  });
}

function playCoinSound() {
  const s = new Audio('audio/coin.mp3');
  s.volume = 0.3;
  s.playbackRate = 1.2;
  s.play().catch(e => console.warn(e));
}

function handleSalsaPickups() {
  this.salsas.forEach((salsa, index) => {
    if (!this.character.isColliding(salsa)) return;
    this.salsas.splice(index, 1);
    this.statusBarSalsa.addSalsa();
    this.playSalsaPickupSound();
  });
}

function playSalsaPickupSound() {
  const s = new Audio('audio/salsa.mp3');
  s.volume = 0.4;
  s.playbackRate = 2.0;
  s.play().catch(e => console.warn(e));
}

function handleMaracasPickup() {
  if (!this.maracas) return;
  if (!this.character.isColliding(this.maracas)) return;
  this.startMaracasSequence();
}

function startMaracasSequence() {
  this.isMaracasSequence = true;
  this.maracas = null;
  this.countdown?.stopCountdown?.();
  this.playMaracasSound();
  this.freezeWorldForMaracas();
  this.resetKeyboardInputs();
  this.runMaracasChoreo();
}

function playMaracasSound() {
  const s = new Audio('audio/maracas.mp3');
  s.volume = 0.6;
  s.play().catch(e => console.warn('Maracas sound error:', e));
}

function freezeWorldForMaracas() {
  this.level.enemies.forEach(e => this.clearEnemyIntervals(e));
  this.level.clouds.forEach(c => clearInterval(c.moveInterval));
}

function clearEnemyIntervals(e) {
  clearInterval(e.moveInterval);
  clearInterval(e.animationInterval);
}

function resetKeyboardInputs() {
  this.keyboard.RIGHT = false;
  this.keyboard.LEFT = false;
  this.keyboard.SPACE = false;
  this.keyboard.D = false;
}

function runMaracasChoreo() {
  const pepe = this.character;
  this.maracasJump(pepe, 'right');
  setTimeout(() => this.maracasJump(pepe, 'left'), 600);
  setTimeout(() => this.maracasJump(pepe, 'right'), 1200);
  setTimeout(() => this.startMaracasWalkOff(pepe), 1800);
}

function maracasJump(pepe, dir) {
  pepe.otherDirection = dir === 'left';
  pepe.speedY = 25;
  pepe.applyGravity();
  this.playJumpSound();
}

function playJumpSound() {
  const s = new Audio('audio/jump.mp3');
  s.volume = 0.5;
  s.play().catch(() => { });
}

function startMaracasWalkOff(pepe) {
  pepe.otherDirection = false;
  const walkInterval = setInterval(() => {
    pepe.moveRight();
    pepe.playAnimation(pepe.IMAGES_WALKING);
  }, 1000 / 60);
  setTimeout(() => this.finishMaracasEnding(walkInterval), 500);
}

function finishMaracasEnding(walkInterval) {
  clearInterval(walkInterval);
  this.endGame(true);
}
