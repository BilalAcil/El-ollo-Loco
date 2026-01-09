/**
 * @file bodyguard.class.js
 * @description
 * Bodyguard-Gegner im Endbossbereich.
 * - Springt einmal in den Boss-Bereich (jumpToEndboss)
 * - Startet danach eine Patrouille/Attacke im Bereich (startAttackLoop)
 * - Kann Schaden nehmen (hit) und sterben (die) inkl. Fall/Todesanimation
 *
 * Abhängigkeiten:
 * - MovableObject, BodyguardStatusBar
 * - World (optional, wird von World gesetzt: bodyguard.world = world)
 */

/**
 * Bodyguard-Gegner (Boss-Chicken), der im Endboss-Areal patrouilliert.
 * @class
 * @extends MovableObject
 */
class Bodyguard extends MovableObject {
  /** @type {number} */ height = 180;
  /** @type {number} */ width = 160;
  /** @type {number} */ y = 150;

  /** @type {number} */ energy = 100;
  /** @type {boolean} */ isDead = false;
  /** @type {boolean} */ isJumping = false;
  /** @type {boolean} */ hasJumped = false;

  /** @type {number|null} */ jumpInterval = null;
  /** @type {number|null} */ attackInterval = null;
  /** @type {number|null} */ fallInterval = null;
  /** @type {number|null} */ deathAnimInterval = null;

  /** @type {number} */ lastSpeedX = 0;
  /** @type {boolean} */ lastDirection = false; // false = rechts, true = links

  /** @type {string} */ IMAGE = 'img/4_enemie_boss_chicken/1_walk/G2.png';

  /** @type {string[]} */ IMAGES_JUMP_START = ['img/4_enemie_boss_chicken/3_attack/G20.png'];
  /** @type {string[]} */ IMAGES_JUMP_UP = ['img/4_enemie_boss_chicken/3_attack/G19.png'];
  /** @type {string[]} */ IMAGES_JUMP_HOVER = ['img/4_enemie_boss_chicken/3_attack/G18.png'];
  /** @type {string[]} */
  IMAGES_LAND = [
    'img/4_enemie_boss_chicken/3_attack/G17.png',
    'img/4_enemie_boss_chicken/3_attack/G16.png',
    'img/4_enemie_boss_chicken/3_attack/G15.png',
    'img/4_enemie_boss_chicken/3_attack/G14.png',
    'img/4_enemie_boss_chicken/3_attack/G13.png'
  ];

  /** @type {string[]} */
  IMAGES_WALK = [
    'img/4_enemie_boss_chicken/1_walk/G1.png',
    'img/4_enemie_boss_chicken/1_walk/G2.png',
    'img/4_enemie_boss_chicken/1_walk/G3.png',
    'img/4_enemie_boss_chicken/1_walk/G4.png'
  ];

  /** @type {string[]} */
  IMAGES_HURT = [
    'img/4_enemie_boss_chicken/4_hurt/G21.png',
    'img/4_enemie_boss_chicken/4_hurt/G22.png',
    'img/4_enemie_boss_chicken/4_hurt/G23.png'
  ];

  /** @type {string[]} */
  IMAGES_DEAD = [
    'img/4_enemie_boss_chicken/5_dead/G24.png',
    'img/4_enemie_boss_chicken/5_dead/G25.png',
    'img/4_enemie_boss_chicken/5_dead/G26.png'
  ];

  /**
   * Erstellt den Bodyguard und lädt Basis-Assets.
   */
  constructor() {
    super();
    this.initPosition();
    this.initPhysics();
    this.preloadAssets();
    this.initSounds();
  }

  /**
   * Initialposition und Startbild.
   * @returns {void}
   */
  initPosition() {
    this.x = 4700;
    this.loadImage(this.IMAGE);
  }

  /**
   * Initialisiert Physik (Gravity).
   * @returns {void}
   */
  initPhysics() {
    this.applyGravity();
  }

  /**
   * Lädt alle benötigten Bildassets in den Cache.
   * @returns {void}
   */
  preloadAssets() {
    this.loadImages(this.IMAGES_JUMP_START);
    this.loadImages(this.IMAGES_JUMP_UP);
    this.loadImages(this.IMAGES_JUMP_HOVER);
    this.loadImages(this.IMAGES_LAND);
    this.loadImages(this.IMAGES_WALK);
    this.loadImages(this.IMAGES_HURT);
    this.loadImages(this.IMAGES_DEAD);
  }

  /**
   * Initialisiert Sounds für Jump/Impact/Hurt/Death.
   * @returns {void}
   */
  initSounds() {
    this.bodyguardSound = new Audio('audio/bodyguard-sound.mp3');
    this.boomSound = new Audio('audio/Boom.mp3');
    this.hurtSound = new Audio('audio/bodyguard-hurt.mp3');
    this.hurtSound.volume = 0.6;
    this.hurtSound.load();
  }

  // ---------- Jump into Endboss Area ----------
  /**
   * Startet den einmaligen Sprung in den Endbossbereich.
   * @returns {void}
   */
  jumpToEndboss() {
    if (!this.canStartJump()) return;
    this.markJumpStarted();
    this.playJumpStartSound();
    this.startJumpMotion();
    this.startJumpLoop();
  }

  /**
   * Prüft, ob der Jump gestartet werden darf.
   * @returns {boolean} True, wenn noch nicht gesprungen und nicht gerade springend.
   */
  canStartJump() {
    return !this.isJumping && !this.hasJumped;
  }

  /**
   * Markiert den Jump-Start (Flags setzen).
   * @returns {void}
   */
  markJumpStarted() {
    this.isJumping = true;
    this.hasJumped = true;
  }

  /**
   * Spielt den Jump-Start-Sound.
   * @returns {void}
   */
  playJumpStartSound() {
    this.bodyguardSound.currentTime = 0;
    this.bodyguardSound.play().catch(() => { });
  }

  /**
   * Setzt Start-Geschwindigkeiten und Jump-Start-Animation.
   * @returns {void}
   */
  startJumpMotion() {
    this.speedY = 32;
    this.speedX = -12;
    this.playAnimation(this.IMAGES_JUMP_START);
  }

  /**
   * Startet den Jump-Loop (Intervall).
   * @returns {void}
   */
  startJumpLoop() {
    this.jumpInterval = setInterval(() => this.stepJump(), 40);
  }

  /**
   * Ein Jump-Step: Animation, Bewegung, ggf. Landung.
   * @returns {void}
   */
  stepJump() {
    this.updateJumpAnimation();
    this.applyJumpMovement();
    if (this.shouldLandNow()) this.handleLanding();
  }

  /**
   * Wählt Jump-Up oder Hover-Frames je nach speedY.
   * @returns {void}
   */
  updateJumpAnimation() {
    const imgs = this.speedY > 0 ? this.IMAGES_JUMP_UP : this.IMAGES_JUMP_HOVER;
    this.playAnimation(imgs);
  }

  /**
   * Bewegt X beim Sprung (mit leichter Dämpfung).
   * @returns {void}
   */
  applyJumpMovement() {
    this.x += this.speedX;
    this.speedX *= 0.99;
  }

  /**
   * Prüft, ob Landung erreicht wurde.
   * @returns {boolean} True, wenn speedY <= 0 und Boden erreicht.
   */
  shouldLandNow() {
    return this.speedY <= 0 && !this.isAboveGround();
  }

  /**
   * Landelogik: snap, Boom, World-Shock, Statusbar, Attack-Start.
   * @returns {void}
   */
  handleLanding() {
    this.snapToGround();
    this.playBoom();
    this.triggerWorldShock();
    this.ensureStatusBar();
    this.stopJumpLoop();
    this.startLandSequence();
  }

  /**
   * Setzt Bodyguard auf den Boden und stoppt Bewegung.
   * @returns {void}
   */
  snapToGround() {
    this.y = 260;
    this.speedY = 0;
    this.speedX = 0;
  }

  /**
   * Spielt Boom-Sound bei Landung.
   * @returns {void}
   */
  playBoom() {
    this.boomSound.currentTime = 0;
    this.boomSound.play().catch(() => { });
  }

  /**
   * Löst den "Shock"-Effekt in der Welt aus (z.B. Bounce + Kamera-Pan).
   * @returns {void}
   */
  triggerWorldShock() {
    if (this.world) this.world.jumpFromShock();
  }

  /**
   * Erstellt die Bodyguard-Statusbar in der World, falls nicht vorhanden.
   * @returns {void}
   */
  ensureStatusBar() {
    if (!this.world || this.world.bodyguardStatus) return;
    this.world.bodyguardStatus = new BodyguardStatusBar(this.world);
    this.world.addToMap(this.world.bodyguardStatus);
  }

  /**
   * Stoppt den Jump-Intervall.
   * @returns {void}
   */
  stopJumpLoop() {
    clearInterval(this.jumpInterval);
    this.jumpInterval = null;
    this.isJumping = false;
  }

  /**
   * Startet die Landesequenz-Animation und plant finishLanding.
   * @returns {void}
   */
  startLandSequence() {
    this.playAnimation(this.IMAGES_LAND);
    const ms = this.IMAGES_LAND.length * 100;
    setTimeout(() => this.finishLanding(), ms);
  }

  /**
   * Abschluss der Landung: Standbild, Spieler unfreezen, Attacke starten.
   * @returns {void}
   */
  finishLanding() {
    this.loadImage('img/4_enemie_boss_chicken/3_attack/G13.png');
    this.unfreezePlayer();
    this.startAttackAfterDelay(1000);
  }

  /**
   * Gibt den Spieler nach Bodyguard-Landung wieder frei.
   * @returns {void}
   */
  unfreezePlayer() {
    if (this.world?.character) this.world.character.freezeForBodyguard = false;
  }

  /**
   * Plant den Start des Attack-Loops nach einer Verzögerung.
   * @param {number} ms - Delay in ms.
   * @returns {void}
   */
  startAttackAfterDelay(ms) {
    setTimeout(() => {
      if (this.isDead) return;
      this.startAttackLoop();
    }, ms);
  }

  // ---------- Attack / Patrol ----------
  /**
   * Startet den Attack-/Patrouillen-Loop, falls der Jump schon passiert ist.
   * @returns {void}
   */
  startAttackLoop() {
    if (!this.hasJumped) return;
    this.resetAttackInterval();
    this.restoreAttackState();
    this.attackInterval = setInterval(() => this.stepAttack(), 60);
  }

  /**
   * Stoppt den Attack-Intervall, falls er läuft.
   * @returns {void}
   */
  resetAttackInterval() {
    if (!this.attackInterval) return;
    clearInterval(this.attackInterval);
    this.attackInterval = null;
  }

  /**
   * Stellt Bewegungszustand nach Pause/Hurt wieder her.
   * @returns {void}
   */
  restoreAttackState() {
    this.speedX = this.lastSpeedX !== 0 ? this.lastSpeedX : (this.speedX || -15);
    this.otherDirection = this.lastDirection ?? this.otherDirection ?? false;
  }

  /**
   * Ein Attack-Step: Walk-Animation, X-Bewegung, Bounds, Zustand merken.
   * @returns {void}
   */
  stepAttack() {
    this.playAnimation(this.IMAGES_WALK);
    this.x += this.speedX;
    this.handleAttackBounds();
    this.rememberAttackState();
  }

  /**
   * Dreht an den Grenzen des Endbossbereichs um.
   * @returns {void}
   */
  handleAttackBounds() {
    if (this.x <= 3780) return this.turnAroundAfterStop(true, +15);
    if (this.x >= 4330) return this.turnAroundAfterStop(false, -15);
  }

  /**
   * Stoppt kurz und dreht dann um.
   * @param {boolean} direction - True = links schauen, false = rechts schauen.
   * @param {number} speed - Neue speedX nach dem Umdrehen.
   * @returns {void}
   */
  turnAroundAfterStop(direction, speed) {
    this.speedX = 0;
    setTimeout(() => {
      if (this.isDead) return;
      this.otherDirection = direction;
      this.speedX = speed;
    }, 200);
  }

  /**
   * Merkt Bewegungszustand (für Resume).
   * @returns {void}
   */
  rememberAttackState() {
    this.lastSpeedX = this.speedX;
    this.lastDirection = this.otherDirection;
  }

  /**
   * Hitbox des Bodyguards (reduziert gegenüber Sprite).
   * @returns {{x:number,y:number,width:number,height:number}}
   */
  get collisionBox() {
    return {
      x: this.x + 15,
      y: this.y + 30,
      width: this.width - 25,
      height: this.height - 40
    };
  }

  // ---------- Damage / Death ----------
  /**
   * Verarbeitet einen Treffer auf den Bodyguard.
   * - stoppt Attacke kurz
   * - spielt Hurt-Sound + Animation
   * - zieht Energie ab und aktualisiert Statusbar
   * @returns {void}
   */
  hit() {
    if (this.isDead) return;
    this.stopAttackForHit();
    this.playHurtSound();
    this.applyDamage(25);
    this.updateStatusBar();
    if (this.energy <= 0) return this.handleDeath();
    this.applyHitFallbackMovement();
    this.playHurtAnimationThenResume();
  }

  /**
   * Stoppt Attacke für den Hit-Moment.
   * @returns {void}
   */
  stopAttackForHit() {
    this.resetAttackInterval();
    this.saveMotionState();
    this.speedX = 0;
  }

  /**
   * Speichert Bewegungszustand vor dem Stoppen.
   * @returns {void}
   */
  saveMotionState() {
    this.lastDirection = this.otherDirection;
    this.lastSpeedX = this.speedX;
  }

  /**
   * Spielt den Hurt-Sound.
   * @returns {void}
   */
  playHurtSound() {
    this.hurtSound.currentTime = 0;
    this.hurtSound.play().catch(e => console.warn('Soundfehler:', e));
  }

  /**
   * Zieht Energie ab.
   * @param {number} amount - Schadensmenge.
   * @returns {void}
   */
  applyDamage(amount) {
    this.energy -= amount;
  }

  /**
   * Aktualisiert die Bodyguard-Statusbar in der World.
   * @returns {void}
   */
  updateStatusBar() {
    this.world?.bodyguardStatus?.setPercentage(this.energy);
  }

  /**
   * Reagiert auf Tod: informiert World und startet die Todesroutine.
   * @returns {void}
   */
  handleDeath() {
    this.world?.onBodyguardDeath?.();
    this.die();
  }

  /**
   * Setzt eine kurze Rückstoßbewegung weg vom Spieler.
   * @returns {void}
   */
  applyHitFallbackMovement() {
    const player = this.world?.character;
    if (!player) return;
    const playerRight = player.x > this.x;
    this.otherDirection = !playerRight;
    this.speedX = playerRight ? 5 : -5;
  }

  /**
   * Spielt Hurt-Animation und startet danach die Attacke neu.
   * @returns {void}
   */
  playHurtAnimationThenResume() {
    const total = this.IMAGES_HURT.length * 2;
    let frames = 0;
    const intv = setInterval(() => {
      this.playAnimation(this.IMAGES_HURT);
      if (++frames >= total) return this.endHurt(intv);
    }, 100);
  }

  /**
   * Beendet Hurt-Intervall und setzt Attacke fort.
   * @param {number} intervalId - Intervall-ID.
   * @returns {void}
   */
  endHurt(intervalId) {
    clearInterval(intervalId);
    this.startAttackLoop();
  }

  /**
   * Markiert den Bodyguard als tot und startet Fall-/Todesanimation.
   * @returns {void}
   */
  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.clearStatusBar();
    this.stopAllIntervals();
    this.speedX = 0;
    this.playDieSoundDelayed(200);
    this.startFallingWhenDead();
  }

  /**
   * Entfernt die Statusbar aus der World.
   * @returns {void}
   */
  clearStatusBar() {
    if (this.world?.bodyguardStatus) this.world.bodyguardStatus = null;
  }

  /**
   * Stoppt alle Intervall-Loops des Bodyguards.
   * @returns {void}
   */
  stopAllIntervals() {
    this.resetAttackInterval();
    this.stopJumpIfRunning();
    this.stopFallIfRunning();
    this.stopDeathAnimIfRunning();
  }

  /**
   * Stoppt Jump-Intervall.
   * @returns {void}
   */
  stopJumpIfRunning() {
    if (!this.jumpInterval) return;
    clearInterval(this.jumpInterval);
    this.jumpInterval = null;
  }

  /**
   * Stoppt Fall-Intervall.
   * @returns {void}
   */
  stopFallIfRunning() {
    if (!this.fallInterval) return;
    clearInterval(this.fallInterval);
    this.fallInterval = null;
  }

  /**
   * Stoppt Todesanimations-Intervall.
   * @returns {void}
   */
  stopDeathAnimIfRunning() {
    if (!this.deathAnimInterval) return;
    clearInterval(this.deathAnimInterval);
    this.deathAnimInterval = null;
  }

  /**
   * Plant das Abspielen des Death-Sounds.
   * @param {number} ms - Verzögerung in ms.
   * @returns {void}
   */
  playDieSoundDelayed(ms) {
    this.ensureDieSound();
    setTimeout(() => {
      if (this.isDead) this.playDieSound();
    }, ms);
  }

  /**
   * Initialisiert den Death-Sound, falls noch nicht vorhanden.
   * @returns {void}
   */
  ensureDieSound() {
    if (this.dieSound) return;
    this.dieSound = new Audio('audio/bodyguard-die.mp3');
    this.dieSound.volume = 0.5;
  }

  /**
   * Spielt den Death-Sound.
   * @returns {void}
   */
  playDieSound() {
    this.dieSound.currentTime = 0;
    this.dieSound.play().catch(() => { });
  }

  /**
   * Startet Fall- und Todesanimations-Loops.
   * @returns {void}
   */
  startFallingWhenDead() {
    if (this.fallInterval) return;
    this.startDeathAnimLoop();
    this.startFallLoop();
  }

  /**
   * Spielt Dead-Frames in Schleife.
   * @returns {void}
   */
  startDeathAnimLoop() {
    this.deathAnimInterval = setInterval(() => {
      this.playAnimation(this.IMAGES_DEAD);
    }, 200);
  }

  /**
   * Lässt den Bodyguard aus dem Bild fallen und entfernt ihn dann.
   * @returns {void}
   */
  startFallLoop() {
    let fallSpeed = 0;
    this.fallInterval = setInterval(() => {
      if (this.isGamePaused()) return;
      fallSpeed += 0.5;
      this.y += fallSpeed;
      if (this.y > 600) this.finishDeathFall();
    }, 1000 / 30);
  }

  /**
   * Prüft, ob Spiel oder Bodyguard pausiert sind.
   * @returns {boolean} True, wenn pausiert.
   */
  isGamePaused() {
    return this.isPaused || this.world?.isPaused;
  }

  /**
   * Beendet den Todesfall und entfernt den Bodyguard aus der World.
   * @returns {void}
   */
  finishDeathFall() {
    this.stopFallIfRunning();
    this.stopDeathAnimIfRunning();
    this.removeFromWorld();
  }

  /**
   * Entfernt den Bodyguard aus der Gegnerliste der World.
   * @returns {void}
   */
  removeFromWorld() {
    const enemies = this.world?.level?.enemies;
    if (!enemies) return;
    const i = enemies.indexOf(this);
    if (i > -1) enemies.splice(i, 1);
  }

  // ---------- Pause / Resume ----------
  /**
   * Pausiert den Bodyguard, indem alle Loops gestoppt werden.
   * @returns {void}
   */
  pause() {
    this.stopAllIntervals();
  }

  /**
   * Setzt den Bodyguard fort (Attacke), falls er lebt und nicht gerade springt.
   * @returns {void}
   */
  resume() {
    if (this.isDead || this.isJumping) return;
    this.speedX = this.lastSpeedX;
    this.otherDirection = this.lastDirection;
    this.startAttackLoop();
  }
}
