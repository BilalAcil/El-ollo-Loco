/**
 * @file models/character.movement.js
 * @description
 * Movement-/Input-Loop für den Character + Kamera-Logik.
 * Wird per Object.assign an Character.prototype gehängt.
 *
 * Enthält:
 * - Movement-Loop (60 FPS): tickMovement()
 * - Input-Verarbeitung (LEFT/RIGHT/SPACE/D)
 * - Kamera-Verhalten inkl. Soft-Panning im Endbossbereich
 * - Knockback-Physik
 * - Endboss-Trigger + Bodyguard-Jump
 * - Idle-Rückkehr nach Action-Cooldown
 *
 * Voraussetzungen:
 * - Character hat u.a.: world, x, y, width, speedX, speedY, knockbackActive,
 *   atEndboss, freezeForBodyguard, lastActionTime, actionCooldown, lastMoveTime,
 *   currentAnimation, animationFinished
 * - Methoden aus anderen Dateien: throwAnimation(), handleMovement(), isHurt(), isDead(),
 *   isAboveGround(), jump(), moveRight(), moveLeft()
 * - World hat: keyboard, canvas, camera_x, isPaused, countdown, bodyguard,
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

/**
 * Startet den Movement-Loop (60 FPS).
 * @this {Character}
 * @returns {void}
 */
function startMovementLoop() {
  setInterval(() => this.tickMovement(), 1000 / 60);
}

/**
 * Ein Tick des Movement-Loops:
 * - Kamera updaten
 * - Knockback anwenden
 * - Inputs verarbeiten (außer Freeze)
 * - Endboss-Trigger prüfen
 * - ggf. auf Idle zurückschalten
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
 * Prüft, ob Movement-Tick übersprungen werden soll (Pause/fehlende World).
 * @this {Character}
 * @returns {boolean} True, wenn Tick übersprungen werden soll.
 */
function shouldSkipMovementTick() {
  if (this.isPaused) return true;
  if (!this.world) return true;
  return this.world.isPaused;
}

/**
 * Liest Tastenzustände und führt Bewegung/Action aus.
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

/**
 * Berechnet die erlaubten X-Grenzen.
 * Im Endbossbereich wird die Bewegung auf den Viewport begrenzt.
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

/**
 * Bewegt nach rechts, falls RIGHT gedrückt und innerhalb Grenze.
 * @this {Character}
 * @param {number} maxX - Maximale X-Position.
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
 * Bewegt nach links, falls LEFT gedrückt und innerhalb Grenze.
 * @this {Character}
 * @param {number} minX - Minimale X-Position.
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
 * Springt, falls SPACE gedrückt und Character am Boden ist.
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
 * Wirft Salsa, falls D gedrückt und Animationen es erlauben.
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

/**
 * Aktualisiert die Kamera:
 * - ggf. Pan-Back starten
 * - Soft-Panning ausführen
 * - Endboss-Kamera locken oder normal folgen
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
 * Prüft, ob das Zurück-Panning gestartet werden soll (Bodyguard tot etc.).
 * @this {Character}
 * @returns {boolean} True, wenn Pan-Back jetzt starten soll.
 */
function shouldStartPanBackNow() {
  return this.atEndboss &&
    this.world.hasBodyguardDied &&
    this.world.shouldStartCameraPanBack &&
    !this.world.isCameraPanning &&
    this.x >= 4000;
}

/**
 * Startet das Zurück-Panning genau einmal.
 * @this {Character}
 * @returns {void}
 */
function startPanBackOnce() {
  this.world.startEndbossCameraPanBack();
  this.world.shouldStartCameraPanBack = false;
}

/**
 * Führt Soft-Panning aus, wenn aktiv.
 * @this {Character}
 * @returns {boolean} True, wenn Soft-Panning verarbeitet wurde.
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
 * Beendet Soft-Panning und speichert die Endboss-Kameraposition.
 * @this {Character}
 * @param {number} target - Zielwert der Kamera.
 * @returns {void}
 */
function finishSoftPanning(target) {
  this.world.camera_x = target;
  this.world.isCameraPanning = false;
  this.world.endbossCameraX = target;
  this.world.stopCameraMoveSound?.();
}

/**
 * Fixiert die Kamera im Endbossbereich auf endbossCameraX.
 * @this {Character}
 * @returns {void}
 */
function lockEndbossCamera() {
  this.world.camera_x = (typeof this.world.endbossCameraX === 'number')
    ? this.world.endbossCameraX
    : (-4100 + 100);
}

/**
 * Standardkamera: folgt dem Character.
 * @this {Character}
 * @returns {void}
 */
function followCharacterCamera() {
  this.world.camera_x = -this.x + 100;
}

/**
 * Wendet Knockback an und lässt ihn auslaufen.
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

/**
 * Prüft, ob der Endbossbereich betreten wird.
 * @this {Character}
 * @returns {void}
 */
function checkEndbossTrigger() {
  if (this.x < 4100 || this.atEndboss) return;
  this.activateEndbossArea();
}

/**
 * Aktiviert Endbossbereich:
 * - Bossmusik starten
 * - Countdown ggf. kurz verstecken
 * - Spieler einfrieren für Bodyguard-Sprung
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
 * Löst den Bodyguard-Jump aus (nur einmal).
 * @this {Character}
 * @returns {void}
 */
function triggerBodyguardJump() {
  if (!this.world?.bodyguard || this.world.bodyguard.hasJumped) return;
  this.world.bodyguard.jumpToEndboss();
  this.world.bodyguard.hasJumped = true;
}

/**
 * Schaltet nach Action-Cooldown zurück auf Idle (wenn erlaubt).
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
