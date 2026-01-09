/**
 * @file models/world.collision.js
 * @description
 * Kollisions- und Pickup-Logik der World.
 * Enthält:
 * - Gegner-Kollisionen (Stomp / Kontakt-Schaden)
 * - Treffer durch Wurfobjekte (SalsaThrow)
 * - Pickups (Coin, Salsa, Corncob, Maracas)
 * - Maracas-Endsequenz (kurze Choreo + Level-Ende)
 *
 * Hinweis: Viele Methoden sind bewusst klein gehalten, damit pro Datei < 400 LOC bleibt.
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

/**
 * Startet den Kollisions-Loop der Welt.
 * Ruft alle 50ms {@link handleCollisionTick} auf.
 *
 * @returns {void}
 */
function checkCollisions() {
  this.collisionInterval = setInterval(() => this.handleCollisionTick(), 50);
}

/**
 * Ein einzelner Tick der Kollisions-Logik:
 * - Gegner scannen (Endboss/Bodyguard/Normale Enemies)
 * - Stomps und Kontakt-Schaden
 * - Treffer durch Wurfobjekte
 * - Pickups (Mais, Coins, Salsa, Maracas)
 *
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

  this.handleCorncobPickup();
  this.handleCoinPickups();
  this.handleSalsaPickups();
  this.handleMaracasPickup();
}

/**
 * Erstellt einen temporären State für einen Collision-Tick.
 *
 * @returns {{collidedEnemies: Array<{enemy:any,index:number}>, hitEndbossFromAbove:boolean, jumpedOnEnemy:boolean}}
 */
function createCollisionState() {
  return { collidedEnemies: [], hitEndbossFromAbove: false, jumpedOnEnemy: false };
}

/**
 * Iteriert alle Gegner und sammelt relevante Kollisionen:
 * - Endboss: direkt auswerten (Stomp)
 * - Bodyguard: separat behandeln
 * - Normale Gegner: erstmal nur sammeln, Auswertung später
 *
 * @param {{collidedEnemies:Array, hitEndbossFromAbove:boolean, jumpedOnEnemy:boolean}} state
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
 * Prüft Kollision mit Endboss und wendet Stomp-Schaden an,
 * falls Pepe von oben auf den Boss trifft.
 *
 * @param {Endboss} enemy
 * @param {{hitEndbossFromAbove:boolean}} state
 * @returns {void}
 */
function scanEndboss(enemy, state) {
  if (!this.character.isColliding(enemy)) return;
  if (!this.isStompFromAbove(enemy)) return;

  state.hitEndbossFromAbove = true;
  this.applyEndbossStomp(enemy);
}

/**
 * Prüft, ob Pepe den Gegner von oben "stompt".
 * Diese Heuristik verhindert Side-Hits beim Springen.
 *
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
 * Wendet Endboss-Stomp an:
 * - Aktiviert Hurt-Animation
 * - Zieht Energie ab
 * - Updatet Boss-Statusbar
 * - Knockback für Pepe
 * - Prüft Tod + onDeath Hook
 *
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
 * Knockback/Abpraller nach Endboss-Stomp.
 *
 * @returns {void}
 */
function knockbackAfterEndbossStomp() {
  this.character.speedY = 20;
  this.character.speedX = -15;
  this.character.knockbackActive = true;
}

/**
 * Prüft, ob der Endboss tot ist und triggert Death-Logik.
 *
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
 * Prüft Bodyguard-Kollision:
 * - Stomp => Bodyguard bekommt Hit + Pepe bounce
 * - Side-Hit => Pepe nimmt Schaden (mit Cooldown)
 *
 * @param {Bodyguard} enemy
 * @returns {void}
 */
function scanBodyguard(enemy) {
  if (!this.character.isColliding(enemy) || enemy.isDead) return;
  if (this.isStompFromAbove(enemy)) return this.applyBodyguardStomp(enemy);
  this.applyBodyguardSideHit();
}

/**
 * Stomp auf Bodyguard:
 * - Bodyguard.hit()
 * - Pepe bounce + clamp in Viewport
 *
 * @param {Bodyguard} enemy
 * @returns {void}
 */
function applyBodyguardStomp(enemy) {
  enemy.hit();
  this.applyBodyguardBounce();
  setTimeout(() => this.clampCharacterToViewport(), 20);
}

/**
 * Zufälliger Bounce nach Bodyguard-Stomp (links/rechts).
 *
 * @returns {void}
 */
function applyBodyguardBounce() {
  const dir = Math.random() < 0.5 ? -1 : 1;
  this.character.speedY = 18;
  this.character.speedX = 10 * dir;
  this.character.knockbackActive = true;
}

/**
 * Klemmt den Charakter in den aktuell sichtbaren Kamera-Bereich,
 * damit Pepe nach Bounce nicht aus dem Viewport rutscht.
 *
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
 * Side-Hit durch Bodyguard: Schaden nur alle 1000ms.
 *
 * @returns {void}
 */
function applyBodyguardSideHit() {
  const now = Date.now();
  if (this.lastBodyguardHit && now - this.lastBodyguardHit <= 1000) return;
  this.lastBodyguardHit = now;
  this.damageCharacterOrDie();
}

/**
 * Sammelt Kollisionen mit "echten" Gegnern (Chickens etc.) für spätere Auswertung.
 *
 * @param {*} enemy - Kandidat aus level.enemies
 * @param {number} index - Index im Enemies-Array (derzeit nur informational)
 * @param {{collidedEnemies:Array}} state
 * @returns {void}
 */
function collectNormalEnemy(enemy, index, state) {
  if (!this.isActualEnemy(enemy)) return;
  if (!this.character.isColliding(enemy) || enemy.isDead) return;
  state.collidedEnemies.push({ enemy, index });
}

/**
 * Verarbeitet Stomps auf normale Gegner.
 * Wenn mindestens ein Stomp passiert, bekommt Pepe einen Bounce.
 *
 * @param {{collidedEnemies:Array<{enemy:any}>, jumpedOnEnemy:boolean}} state
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
 * Prüft, ob Pepe einen Gegner "von oben" trifft (normaler Stomp).
 *
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
 * Liefert eine Hitbox für ein Objekt:
 * nutzt collisionBox falls vorhanden, sonst x/y/width/height.
 *
 * @param {*} obj
 * @returns {{x:number,y:number,width:number,height:number}}
 */
function getBox(obj) {
  return obj.collisionBox || { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
}

/**
 * Kontakt-Schaden durch Endboss:
 * Wird blockiert, wenn Pepe gerade gebounced ist oder den Boss stompt.
 *
 * @param {{hitEndbossFromAbove:boolean}} state
 * @returns {void}
 */
function handleEndbossContactDamage(state) {
  const bounced = this.lastEndbossBounce && Date.now() - this.lastEndbossBounce < 400;
  if (state.hitEndbossFromAbove || bounced) return;

  this.level.enemies.forEach((enemy) => this.tryEndbossContactHit(enemy));
}

/**
 * Wendet Endboss-Kontaktschaden an (Cooldown 1000ms).
 *
 * @param {*} enemy
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
 * Kontakt-Schaden durch normale Gegner:
 * Wird blockiert, wenn Pepe gerade gebounced ist oder einen Gegner gestompt hat.
 *
 * @param {{collidedEnemies:Array<{enemy:any}>, jumpedOnEnemy:boolean}} state
 * @returns {void}
 */
function handleNormalEnemyContactDamage(state) {
  const bounced = this.lastEnemyBounce && Date.now() - this.lastEnemyBounce < 200;
  if (state.jumpedOnEnemy || bounced) return;

  state.collidedEnemies.forEach(({ enemy }) => this.tryNormalEnemyContactHit(enemy));
}

/**
 * Wendet Kontakt-Schaden durch normale Gegner an (mit globaler Immunität + Cooldown).
 *
 * @param {MovableObject} enemy
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
 * Prüft, ob der Charakter global immun ist (nach einem Hit).
 *
 * @param {number} now - Current timestamp (ms)
 * @returns {boolean}
 */
function isGloballyImmune(now) {
  return this.character.lastGlobalHit && now - this.character.lastGlobalHit < 1300;
}

/**
 * Bricht Heilung/Healing-Feedback ab (Statusbar-Blink + Sound reset).
 *
 * @returns {void}
 */
function cancelHealing() {
  this.statusBar?.stopBlink?.();
  if (!this.healSound) return;

  this.healSound.pause();
  this.healSound.currentTime = 0;
}

/**
 * Zieht dem Charakter Leben ab und beendet das Spiel, falls Energie 0 erreicht.
 *
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
 * Prüft Treffer von geworfenen Objekten (SalsaThrow) auf Gegner.
 *
 * @returns {void}
 */
function handleThrowableHits() {
  this.throwableObjects.forEach((salsa, index) => {
    this.level.enemies.forEach((enemy) => this.trySalsaHit(salsa, index, enemy));
  });
}

/**
 * Verarbeitet einen möglichen Salsa-Hit:
 * - nur wenn Salsa nicht schon getroffen hat
 * - markiert Hit, Sound, Splash, entfernt Projectile
 * - wendet Schaden am getroffenen Ziel an
 *
 * @param {SalsaThrow} salsa
 * @param {number} index
 * @param {*} enemy
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
 * Markiert Salsa als getroffen und stoppt Rotationssound.
 *
 * @param {SalsaThrow} salsa
 * @returns {void}
 */
function markSalsaHit(salsa) {
  salsa.hasHit = true;
  salsa.stopSound();
}

/**
 * Spielt den Treffer-Sound ab.
 *
 * @returns {void}
 */
function playHitSound() {
  const hitSound = new Audio('audio/hit-sound.mp3');
  hitSound.volume = 0.5;
  hitSound.play().catch((e) => console.warn('Hit sound error:', e));
}

/**
 * Entfernt Salsa erst nach Splash-Animation aus throwableObjects.
 *
 * @param {SalsaThrow} salsa
 * @param {number} index
 * @returns {void}
 */
function removeSalsaAfterSplash(salsa, index) {
  salsa.splashAnimation(() => this.throwableObjects.splice(index, 1));
}

/**
 * Wendet Salsa-Schaden abhängig vom Gegner-Typ an.
 *
 * @param {*} enemy
 * @returns {void}
 */
function applySalsaDamage(enemy) {
  if (enemy instanceof Bodyguard) return enemy.hit();
  if (enemy instanceof Endboss) return this.damageEndbossBySalsa(enemy);
  if (enemy instanceof Chicken || enemy instanceof ChickenSmall) this.killChickenBySalsa(enemy);
}

/**
 * Salsa-Schaden am Endboss (20 dmg), Statusbar update, Todescheck.
 *
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
 * Tötet ein Chicken durch Salsa (Spezial-Death-Bild + Soft-Blink + später entfernen).
 *
 * @param {Chicken|ChickenSmall} enemy
 * @returns {void}
 */
function killChickenBySalsa(enemy) {
  if (!enemy || enemy.isDead) return;

  this.markEnemyDead(enemy);
  this.setSalsaDeathImage(enemy);

  this.setAlpha(enemy, 1);
  this.blinkEnemySoft(enemy, 1000);
  this.removeEnemySoon(enemy, 1000);
}

/**
 * Setzt das passende Salsa-Death-Bild (normal vs small chicken).
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
 * Setzt Transparenz (Alpha) eines Objekts.
 *
 * @param {*} enemy
 * @param {number} value - 0.0 (transparent) bis 1.0 (sichtbar)
 * @returns {void}
 */
function setAlpha(enemy, value) {
  enemy.alpha = value;
}

/**
 * Lässt ein Objekt weich blinken (Alpha-Puls) für eine bestimmte Dauer.
 *
 * @param {*} enemy
 * @param {number} ms - Gesamtdauer in Millisekunden
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
 * Berechnet den Alpha-Wert eines weichen Blink-Effekts und setzt ihn.
 *
 * @param {*} enemy
 * @param {number} phase
 * @param {number} steps
 * @returns {void}
 */
function applySoftBlink(enemy, phase, steps) {
  const t = (phase % steps) / steps;
  this.setAlpha(enemy, 0.3 + Math.abs(Math.sin(t * Math.PI)) * 0.7);
}

/**
 * Pickup: Maiskolben.
 * Setzt Energie auf 100, updated Statusbar und triggert Heal-Blink.
 *
 * @returns {void}
 */
function handleCorncobPickup() {
  if (!this.corncob) return;
  if (!this.character.isColliding(this.corncob)) return;

  this.corncob = null;
  this.playHealPickupSound();

  this.character.energy = 100;
  this.statusBar.setPercentage(this.character.energy);
  this.statusBar.blinkFullHealth();
}

/**
 * Spielt den Heal-Pickup Sound ab (wiederverwendetes Audio in World).
 *
 * @returns {void}
 */
function playHealPickupSound() {
  this.healSound.currentTime = 0;
  this.healSound.playbackRate = 1;
  this.healSound.volume = 0.6;
  this.healSound.play().catch((e) => console.warn(e));
}

/**
 * Pickup: Coins.
 * Entfernt Coin aus Liste, erhöht Counter, spielt Sound.
 *
 * @returns {void}
 */
function handleCoinPickups() {
  this.coins.forEach((coin, index) => {
    if (!this.character.isColliding(coin)) return;

    this.coins.splice(index, 1);
    this.statusBarCoin.addCoin();
    this.playCoinSound();
  });
}

/**
 * Spielt Coin-Sound ab.
 *
 * @returns {void}
 */
function playCoinSound() {
  const s = new Audio('audio/coin.mp3');
  s.volume = 0.3;
  s.playbackRate = 1.2;
  s.play().catch((e) => console.warn(e));
}

/**
 * Pickup: Salsa-Flaschen.
 * Entfernt Salsa aus Liste, erhöht Counter, spielt Sound.
 *
 * @returns {void}
 */
function handleSalsaPickups() {
  this.salsas.forEach((salsa, index) => {
    if (!this.character.isColliding(salsa)) return;

    this.salsas.splice(index, 1);
    this.statusBarSalsa.addSalsa();
    this.playSalsaPickupSound();
  });
}

/**
 * Spielt Salsa-Pickup Sound ab.
 *
 * @returns {void}
 */
function playSalsaPickupSound() {
  const s = new Audio('audio/salsa.mp3');
  s.volume = 0.4;
  s.playbackRate = 2.0;
  s.play().catch((e) => console.warn(e));
}

/**
 * Pickup: Maracas.
 * Triggert die Endsequenz, wenn Pepe kollidiert.
 *
 * @returns {void}
 */
function handleMaracasPickup() {
  if (!this.maracas) return;
  if (!this.character.isColliding(this.maracas)) return;
  this.startMaracasSequence();
}

/**
 * Startet die Maracas-Endsequenz:
 * - blockiert Inputs/Pause
 * - stoppt Countdown
 * - friert Welt-Intervalle ein
 * - startet Choreo
 *
 * @returns {void}
 */
function startMaracasSequence() {
  this.isMaracasSequence = true;
  this.maracas = null;

  this.countdown?.stopCountdown?.();
  this.playMaracasSound();

  this.freezeWorldForMaracas();
  this.resetKeyboardInputs();

  this.runMaracasChoreo();
}

/**
 * Spielt Maracas-Sound ab.
 *
 * @returns {void}
 */
function playMaracasSound() {
  const s = new Audio('audio/maracas.mp3');
  s.volume = 0.6;
  s.play().catch((e) => console.warn('Maracas sound error:', e));
}

/**
 * Stoppt alle Bewegungs-/Animations-Intervalle von Enemies und Clouds,
 * damit während der Sequenz nichts weiterläuft.
 *
 * @returns {void}
 */
function freezeWorldForMaracas() {
  this.level.enemies.forEach((e) => this.clearEnemyIntervals(e));
  this.level.clouds.forEach((c) => clearInterval(c.moveInterval));
}

/**
 * Stoppt die typischen Intervalle eines Gegners (move + animation).
 *
 * @param {*} e
 * @returns {void}
 */
function clearEnemyIntervals(e) {
  clearInterval(e.moveInterval);
  clearInterval(e.animationInterval);
}

/**
 * Setzt relevante Keyboard-Flags zurück.
 *
 * @returns {void}
 */
function resetKeyboardInputs() {
  this.keyboard.RIGHT = false;
  this.keyboard.LEFT = false;
  this.keyboard.SPACE = false;
  this.keyboard.D = false;
}

/**
 * Führt eine kurze Choreo aus:
 * - 3 Sprünge (rechts/links/rechts)
 * - anschließend "walk off" und Ende (win)
 *
 * @returns {void}
 */
function runMaracasChoreo() {
  const pepe = this.character;

  this.maracasJump(pepe, 'right');
  setTimeout(() => this.maracasJump(pepe, 'left'), 600);
  setTimeout(() => this.maracasJump(pepe, 'right'), 1200);
  setTimeout(() => this.startMaracasWalkOff(pepe), 1800);
}

/**
 * Lässt Pepe für die Choreo springen und spielt Sprungsound.
 *
 * @param {Character} pepe
 * @param {'left'|'right'} dir
 * @returns {void}
 */
function maracasJump(pepe, dir) {
  pepe.otherDirection = dir === 'left';
  pepe.speedY = 25;
  pepe.applyGravity();
  this.playJumpSound();
}

/**
 * Spielt den Sprungsound ab (kurzer SFX).
 *
 * @returns {void}
 */
function playJumpSound() {
  const s = new Audio('audio/jump.mp3');
  s.volume = 0.5;
  s.play().catch(() => { });
}

/**
 * Lässt Pepe kurz nach rechts aus dem Bild laufen.
 *
 * @param {Character} pepe
 * @returns {void}
 */
function startMaracasWalkOff(pepe) {
  pepe.otherDirection = false;

  const walkInterval = setInterval(() => {
    pepe.moveRight();
    pepe.playAnimation(pepe.IMAGES_WALKING);
  }, 1000 / 60);

  setTimeout(() => this.finishMaracasEnding(walkInterval), 500);
}

/**
 * Beendet die Choreo und beendet das Spiel als Sieg.
 *
 * @param {number} walkInterval - Interval-ID von setInterval
 * @returns {void}
 */
function finishMaracasEnding(walkInterval) {
  clearInterval(walkInterval);
  this.endGame(true);
}
