/**
 * @file models/character.combat.js
 * @description
 * Combat- und Death-Logik für den Character.
 * Wird per Object.assign an Character.prototype gehängt.
 *
 * Enthält:
 * - Wurfanimation (SalsaThrow) inkl. "keine Salsa" Feedback
 * - Todesanimation (Frames + Fallphysik + Sounds)
 * - Entfernen aus der World nach "FallingWhenDead"
 *
 * Voraussetzungen:
 * - Character existiert global
 * - World liefert: statusBarSalsa, throwableObjects, level.enemies, pauseAllMovements()
 * - SalsaThrow existiert global
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

/**
 * Startet die Wurfanimation, wenn möglich und Salsa vorhanden ist.
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
 * Prüft, ob ein Wurf gestartet werden darf.
 * @this {Character}
 * @returns {boolean} True, wenn keine laufende Wurfanimation und Animation fertig.
 */
function canStartThrow() {
  return this.animationFinished && !this.isThrowing;
}

/**
 * Prüft, ob der Character noch Salsa im Inventar hat.
 * @this {Character}
 * @returns {boolean} True, wenn salsaCount > 0.
 */
function hasSalsa() {
  return this.world?.statusBarSalsa && this.world.statusBarSalsa.salsaCount > 0;
}

/**
 * Feedback, wenn keine Salsa vorhanden ist (Sound + Blink).
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
 * Setzt Flags und startet den Wurf-Sound.
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
 * Spielt die Wurf-Frames ab und beendet danach die Sequenz.
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
 * Beendet das Frame-Intervall und spawnt anschließend das Wurfobjekt.
 * @this {Character}
 * @param {number} id - Intervall-ID.
 * @returns {void}
 */
function finishThrowFrames(id) {
  clearInterval(id);
  setTimeout(() => this.spawnSalsaAndFinish(), 50);
}

/**
 * Zieht Salsa ab, erstellt das Wurfobjekt und setzt Status zurück.
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
 * Erstellt ein SalsaThrow-Objekt und fügt es der Welt hinzu.
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
 * Setzt Wurfstatus zurück und zeigt Idle-Frame.
 * @this {Character}
 * @returns {void}
 */
function finishThrow() {
  this.loadImage(this.IMAGES_IDLE[0]);
  this.animationFinished = true;
  this.isThrowing = false;
}

/**
 * Startet die Todesanimation (einmalig) inkl. Sounds + Fallanimation.
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
 * Setzt Startwerte für die Todesanimation und pausiert die Welt.
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
 * Plant das Abspielen der Todes-Sounds.
 * @this {Character}
 * @param {number} ms - Delay in ms.
 * @returns {void}
 */
function scheduleDeathSounds(ms) {
  setTimeout(() => this.playDeathSounds(), ms);
}

/**
 * Spielt Todes- und Fail-Sound.
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
 * Startet das Intervall, das Frames + Fallphysik der Todesanimation steuert.
 * @this {Character}
 * @returns {void}
 */
function startDeathFallAnim() {
  this.deathInterval = setInterval(() => this.stepDeathFallAnim(), 250);
}

/**
 * Ein Step der Todesanimation (Frame + Physik + ggf. Ende).
 * @this {Character}
 * @returns {void}
 */
function stepDeathFallAnim() {
  this.stepDeathFrames();
  this.stepDeathFallPhysics();
  if (this.shouldFinishDeathAnim()) this.finishDeathAnim();
}

/**
 * Zeigt den nächsten Dead-Frame (bis Ende des Arrays).
 * @this {Character}
 * @returns {void}
 */
function stepDeathFrames() {
  if (this.deathFrameIndex >= this.IMAGES_DEAD.length) return;
  this.loadImage(this.IMAGES_DEAD[this.deathFrameIndex++]);
}

/**
 * Aktualisiert Fallphysik während Death-Anim.
 * @this {Character}
 * @returns {void}
 */
function stepDeathFallPhysics() {
  this.deathFallVelocity += 0.5;
  this.y += this.deathFallVelocity;
}

/**
 * Prüft, ob die Death-Animation beendet werden soll.
 * @this {Character}
 * @returns {boolean} True, wenn außerhalb des Bildes oder alle Frames durch sind.
 */
function shouldFinishDeathAnim() {
  return this.y > 480 || this.deathFrameIndex >= this.IMAGES_DEAD.length;
}

/**
 * Beendet die Death-Animation und setzt finalen Dead-Frame.
 * @this {Character}
 * @returns {void}
 */
function finishDeathAnim() {
  clearInterval(this.deathInterval);
  this.animationFinished = true;
  this.loadImage(this.IMAGES_DEAD[this.IMAGES_DEAD.length - 1]);
}

/**
 * Lässt den Character nach dem Tod weiter nach unten fallen und entfernt ihn dann aus der World.
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
 * Entfernt den Character aus der Gegnerliste (World.level.enemies), falls vorhanden.
 * @this {Character}
 * @returns {void}
 */
function removeFromWorld() {
  const enemies = this.world?.level?.enemies;
  if (!enemies) return;

  const idx = enemies.indexOf(this);
  if (idx > -1) enemies.splice(idx, 1);
}
