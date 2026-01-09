/**
 * @file models/character.animation.js
 * @description
 * Animation- und Idle-System für den Character.
 * Wird per Object.assign an Character.prototype gehängt.
 *
 * Enthält:
 * - Haupt-Animation-Loop (50ms)
 * - Auswahl der richtigen Standing-Animation (hurt/air/walk/idle/long-idle)
 * - Idle- und Long-Idle-Logik inkl. Intervall-Handling
 *
 * Voraussetzungen:
 * - Character existiert global (class Character)
 * - Character hat u.a.: world, isPaused, isThrowing, freezeForBodyguard, lastMoveTime,
 *   IMAGES_* Arrays, playAnimation(), loadImage(), isAboveGround(), isHurt(), playDeathAnimation()
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

/**
 * Startet den Animation-Loop für den Character (läuft alle 50ms).
 * @this {Character}
 * @returns {void}
 */
function startAnimationLoop() {
  setInterval(() => this.tickAnimation(), 50);
}

/**
 * Ein Tick des Animation-Loops.
 * - ignoriert Pause / fehlende World / aktive Wurfanimation
 * - zeigt Freeze-Frame, wenn Bodyguard-Sequenz aktiv ist
 * - ansonsten wählt Standing-Animation anhand Zustand
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
 * Zeigt das Freeze-Frame (z.B. während Bodyguard-Landung).
 * @this {Character}
 * @returns {void}
 */
function showFreezeFrame() {
  this.loadImage('img/2_character_pepe/3_jump/J-31.png');
}

/**
 * Entscheidet, welche Animation im Stand/Loop gezeigt wird.
 * Reihenfolge: death -> hurt -> air -> walk -> idle/long-idle.
 * @this {Character}
 * @param {number} idleMs - Effektive Idle-Zeit in Millisekunden.
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
 * Death-Animation Handling: stoppt Long-Idle und triggert Death-Animation.
 * @this {Character}
 * @returns {void}
 */
function handleDeathAnim() {
  this.stopLongIdleAnimation();
  this.playDeathAnimation(); // character.combat.js
}

/**
 * Hurt-Animation: stoppt Long-Idle und spielt Hurt-Frames.
 * @this {Character}
 * @returns {void}
 */
function playHurtAnim() {
  this.stopLongIdleAnimation();
  this.playAnimation(this.IMAGES_HURT);
}

/**
 * Air-Animation: stoppt Long-Idle und spielt Jump/Fall-Frames.
 * @this {Character}
 * @returns {void}
 */
function playAirAnim() {
  this.stopLongIdleAnimation();
  this.handleJumpAnimation();
}

/**
 * Prüft, ob Character aktuell läuft (Links/Rechts gedrückt).
 * @this {Character}
 * @returns {boolean} True, wenn LEFT oder RIGHT gedrückt ist.
 */
function isWalking() {
  return this.world.keyboard.RIGHT || this.world.keyboard.LEFT;
}

/**
 * Walk-Animation: stoppt Long-Idle und spielt Walking-Frames.
 * @this {Character}
 * @returns {void}
 */
function playWalkAnim() {
  this.stopLongIdleAnimation();
  this.playAnimation(this.IMAGES_WALKING);
}

/**
 * Entscheidet zwischen Idle, Idle-Animation oder Long-Idle-Animation anhand Idle-Zeit.
 * @this {Character}
 * @param {number} idleMs - Effektive Idle-Zeit in Millisekunden.
 * @returns {void}
 */
function playIdleOrLongIdle(idleMs) {
  if (idleMs > 12000) return this.startLongIdleIfNeeded();
  if (idleMs > 10000) return this.startIdleIfNeeded();
  this.stopLongIdleAnimation();
  this.loadImage(this.IMAGES_IDLE[0]);
}

/**
 * Startet Long-Idle nur, wenn nicht bereits aktiv.
 * @this {Character}
 * @returns {void}
 */
function startLongIdleIfNeeded() {
  if (!this.longIdleActive) this.startLongIdleAnimation();
}

/**
 * Startet Idle-Animation nur, wenn noch nicht gestartet.
 * @this {Character}
 * @returns {void}
 */
function startIdleIfNeeded() {
  if (!this.idleAnimationStarted) this.playIdleAnimation();
}

/**
 * Wählt Jump-/Fall-Frame je nach speedY (oben/unten) oder Highest-Point.
 * @this {Character}
 * @returns {void}
 */
function handleJumpAnimation() {
  if (this.speedY > 0) return this.showJumpFrame();
  if (this.speedY < 0) return this.showFallFrame();
  this.loadImage(this.IMAGES_JUMPING[this.IMAGES_JUMPING.length - 1]);
}

/**
 * Zeigt ein Jump-Frame anhand des Fortschritts der Sprunggeschwindigkeit.
 * @this {Character}
 * @returns {void}
 */
function showJumpFrame() {
  const p = Math.min(1, this.speedY / 1);
  const i = Math.floor(p * (this.IMAGES_JUMPING.length - 1));
  this.loadImage(this.IMAGES_JUMPING[i]);
}

/**
 * Zeigt ein Fall-Frame anhand der Fallgeschwindigkeit.
 * @this {Character}
 * @returns {void}
 */
function showFallFrame() {
  const p = Math.min(1, Math.abs(this.speedY) / 20);
  const i = Math.floor(p * (this.IMAGES_FALLING.length - 1));
  this.loadImage(this.IMAGES_FALLING[i]);
}

/**
 * Wird aufgerufen, wenn Bewegung stattgefunden hat:
 * - setzt Idle-Timer zurück
 * - stoppt Long-Idle
 * @this {Character}
 * @returns {void}
 */
function handleMovement() {
  this.lastMoveTime = Date.now();
  this.idleAnimationStarted = false;
  this.stopLongIdleAnimation();
}

/**
 * Startet die Long-Idle-Animation (Loop alle 200ms).
 * Stoppt automatisch, sobald wieder Bewegung erkannt wird.
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
 * Stoppt die Long-Idle-Animation und setzt Flags zurück.
 * @this {Character}
 * @returns {void}
 */
function stopLongIdleAnimation() {
  if (this.longIdleInterval) clearInterval(this.longIdleInterval);
  this.longIdleInterval = null;
  this.longIdleActive = false;
}

/**
 * Startet die normale Idle-Animation (nur im Idle-Zeitfenster 10–12s).
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
 * Prüft, ob die aktuelle Zeit im Idle-Zeitfenster liegt (10–12 Sekunden).
 * @this {Character}
 * @returns {boolean} True, wenn im Idle-Fenster.
 */
function isInIdleWindow() {
  const dt = Date.now() - this.lastMoveTime;
  return dt >= 10000 && dt <= 12000;
}

/**
 * Stoppt das Idle-Intervall und setzt Flag zurück.
 * @this {Character}
 * @param {number} id - Intervall-ID.
 * @returns {void}
 */
function stopIdleInterval(id) {
  clearInterval(id);
  this.idleAnimationStarted = false;
}

/**
 * Zeigt das nächste Idle-Frame (clamped auf letztes Bild).
 * @this {Character}
 * @returns {void}
 */
function showNextIdleFrame() {
  const i = Math.min(this.idleFrame, this.IMAGES_IDLE.length - 1);
  this.loadImage(this.IMAGES_IDLE[i]);
  this.idleFrame++;
}
