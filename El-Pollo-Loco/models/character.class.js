/**
 * @file models/character.class.js
 * @description
 * Basisklasse für den Spieler-Charakter (Pepe).
 * Enthält nur "Kernzustand" + Initialisierung.
 *
 * Aufgeteilte Logik liegt in:
 * - models/character.assets.js (applyAssetsToCharacter)
 * - models/character.movement.js (startMovementLoop, tickMovement, etc.)
 * - models/character.animation.js (startAnimationLoop, tickAnimation, etc.)
 * - models/character.gravity.js (applyGravity, etc.)
 * - models/character.combat.js (hit, playDeathAnimation, throwAnimation, etc.)
 */

/**
 * Spieler-Character (Pepe).
 * @class
 * @extends MovableObject
 */
class Character extends MovableObject {
  /** @type {World} */
  world;

  /** @type {boolean} */
  isDying = false;

  /** @type {string} */
  currentAnimation = 'idle';

  /** @type {boolean} */
  animationFinished = true;

  /** @type {boolean} */
  isThrowing = false;

  /** @type {number} */
  lastActionTime = 0;

  /** @type {number} */
  actionCooldown = 500;

  /** @type {number} */
  pauseStartTime = 0;

  /** @type {number} */
  totalPausedTime = 0;

  /**
   * Erstellt den Character und initialisiert Assets, Physik, State, Sounds und Idle-System.
   */
  constructor() {
    super().loadImage('img/2_character_pepe/1_idle/idle/I-1.png');
    applyAssetsToCharacter(this);

    this.initImages();
    this.initPhysics();
    this.initState();
    this.initSounds();
    this.initIdleSystem();
    this.animate();
  }

  /**
   * Lädt alle benötigten Sprite-Assets (Idle/Walk/Jump/Throw/Hurt/Dead/LongIdle).
   * @returns {void}
   */
  initImages() {
    this.loadImages(this.IMAGES_IDLE);
    this.loadImages(this.IMAGES_THROW);
    this.loadImages(this.IMAGES_WALKING);
    this.loadImages(this.IMAGES_JUMPING);
    this.loadImages(this.IMAGES_DEAD);
    this.loadImages(this.IMAGES_HURT);
    this.loadImages(this.IMAGES_LONG_IDLE);
  }

  /**
   * Initialisiert die Physik (Gravity kommt aus character.gravity.js).
   * @returns {void}
   */
  initPhysics() {
    this.applyGravity();
  }

  /**
   * Initialisiert Spielzustände/Flags.
   * @returns {void}
   */
  initState() {
    this.atEndboss = false;
    this.lastGlobalHit = 0;
  }

  /**
   * Initialisiert Character-Sounds (z.B. Wurf-Sound).
   * @returns {void}
   */
  initSounds() {
    this.throwSound = new Audio('audio/throw-sound-1.mp3');
    this.throwSound.volume = 0.4;
  }

  /**
   * Initialisiert Idle-System (Timer & Flags für Idle/LongIdle).
   * @returns {void}
   */
  initIdleSystem() {
    this.showIdle = false;
    this.lastMoveTime = Date.now();
    this.idleAnimationStarted = false;
    this.longIdleActive = false;
    this.longIdleInterval = null;
  }

  /**
   * Kollisionsbox des Characters (kleiner als Sprite).
   * @returns {{x:number,y:number,width:number,height:number}}
   */
  get collisionBox() {
    return {
      x: this.x + 25,
      y: this.y + 95,
      width: this.width - 60,
      height: this.height - 110
    };
  }

  /**
   * Prüft, ob der Character über dem Boden ist.
   * @returns {boolean} True, wenn y kleiner als Ground-Level.
   */
  isAboveGround() {
    return this.y < 155;
  }

  /**
   * Zeichnet optional die Hitbox (aktuell transparent).
   * @param {CanvasRenderingContext2D} ctx - Canvas-Kontext.
   * @returns {void}
   */
  drawFrame(ctx) {
    const box = this.collisionBox;
    ctx.beginPath();
    ctx.lineWidth = "1";
    ctx.strokeStyle = "transparent";
    ctx.rect(box.x - this.x, box.y - this.y, box.width, box.height);
    ctx.stroke();
  }

  /**
   * Startet Movement- und Animation-Loops.
   * Implementierungen liegen in character.movement.js / character.animation.js
   * @returns {void}
   */
  animate() {
    this.startMovementLoop();
    this.startAnimationLoop();
  }

  /**
   * Pausiert den Character (beeinflusst Loops über isPaused).
   * @returns {void}
   */
  pause() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.pauseStartTime = Date.now();
  }

  /**
   * Setzt den Character fort und kompensiert Pausenzeit für Idle-Timer.
   * @returns {void}
   */
  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.applyPauseTimeCompensation();
  }

  /**
   * Verschiebt lastMoveTime um die Pausenzeit, damit Idle/LongIdle korrekt bleiben.
   * @returns {void}
   */
  applyPauseTimeCompensation() {
    if (!this.pauseStartTime) return;
    this.lastMoveTime += Date.now() - this.pauseStartTime;
  }
}
