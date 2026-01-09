/**
 * @file models/salsa-throw.class.js
 * @description
 * Wurfprojektil (Salsa-Flasche). Fliegt mit Ballistik, rotiert in der Luft und
 * spielt beim Aufprall eine Splash-Animation ab.
 */

/**
 * Salsa-Wurf-Projektil.
 * @class
 * @extends MovableObject
 */
class SalsaThrow extends MovableObject {
  /** @type {number} */
  width = 50;

  /** @type {number} */
  height = 50;

  /** Horizontale Startgeschwindigkeit. @type {number} */
  speedX = 8;

  /** Vertikale Startgeschwindigkeit. @type {number} */
  speedY = 10;

  /** Vertikale Beschleunigung (Schwerkraft für das Projektil). @type {number} */
  acceleration = 0.45;

  /**
   * Wurfrichtung: true = links, false = rechts.
   * @type {boolean}
   */
  direction;

  /** Treffer-Flag (verhindert mehrfachen Ground-Hit). @type {boolean} */
  hasHit = false;

  /** Rotations-Frames. @type {string[]} */
  IMAGES_ROTATION = [
    'img/6_salsa_bottle/bottle_rotation/1_bottle_rotation.png',
    'img/6_salsa_bottle/bottle_rotation/2_bottle_rotation.png',
    'img/6_salsa_bottle/bottle_rotation/3_bottle_rotation.png',
    'img/6_salsa_bottle/bottle_rotation/4_bottle_rotation.png'
  ];

  /** Splash-Frames nach Aufprall. @type {string[]} */
  IMAGES_SPLASH = [
    'img/6_salsa_bottle/bottle_rotation/bottle_splash/1_bottle_splash.png',
    'img/6_salsa_bottle/bottle_rotation/bottle_splash/2_bottle_splash.png',
    'img/6_salsa_bottle/bottle_rotation/bottle_splash/3_bottle_splash.png',
    'img/6_salsa_bottle/bottle_rotation/bottle_splash/4_bottle_splash.png',
    'img/6_salsa_bottle/bottle_rotation/bottle_splash/5_bottle_splash.png'
  ];

  /**
   * @param {number} x - Start-X Position.
   * @param {number} y - Start-Y Position.
   * @param {boolean} direction - true = links, false = rechts.
   */
  constructor(x, y, direction) {
    super().loadImage(this.IMAGES_ROTATION[0]);
    this.loadImages(this.IMAGES_ROTATION);
    this.loadImages(this.IMAGES_SPLASH);

    this.setStartPosition(x, y, direction);
    this.initSounds();
    this.throw();
  }

  /**
   * Setzt Startposition und Richtung.
   * @param {number} x
   * @param {number} y
   * @param {boolean} direction - true = links, false = rechts.
   * @returns {void}
   */
  setStartPosition(x, y, direction) {
    this.x = x;
    this.y = y;
    this.direction = direction;
  }

  /**
   * Initialisiert Audio-Elemente für Rotation und Treffer.
   * @returns {void}
   */
  initSounds() {
    /** @type {HTMLAudioElement} */
    this.rotationSound = new Audio('audio/throw-sound-2.mp3');
    this.rotationSound.volume = 0.4;

    /** @type {HTMLAudioElement} */
    this.hitSound = new Audio('audio/hit-sound.mp3');
    this.hitSound.volume = 0.5;
  }

  /**
   * Startet den Wurf: Sound + Bewegungs- und Rotations-Loop.
   * @returns {void}
   */
  throw() {
    this.playRotationSound();
    this.startMoveLoop();
    this.startRotationLoop();
  }

  /**
   * Spielt den Rotationssound ab.
   * @returns {void}
   */
  playRotationSound() {
    this.rotationSound.currentTime = 0;
    this.rotationSound.play().catch(e => console.warn('Rotation sound error:', e));
  }

  /**
   * Startet den Bewegungs-Loop (Ballistik).
   * @returns {void}
   */
  startMoveLoop() {
    this.moveInterval = setInterval(() => this.tickMove(), 25);
  }

  /**
   * Ein Tick der Bewegung: X/Y anpassen und Bodenkontakt prüfen.
   * @returns {void}
   */
  tickMove() {
    this.moveX();
    this.moveY();
    if (this.isGroundHit()) this.onGroundHit();
  }

  /**
   * Bewegt das Projektil horizontal inkl. leichter Abbremsung.
   * @returns {void}
   */
  moveX() {
    this.x += this.direction ? -this.speedX : this.speedX;
    this.speedX *= 0.99;
  }

  /**
   * Bewegt das Projektil vertikal (Parabel).
   * @returns {void}
   */
  moveY() {
    this.y -= this.speedY;
    this.speedY -= this.acceleration;
  }

  /**
   * Prüft, ob der Boden erreicht wurde (und noch kein Hit passiert ist).
   * @returns {boolean}
   */
  isGroundHit() {
    return this.y >= 380 && !this.hasHit;
  }

  /**
   * Behandelt den Bodentreffer: Flag setzen, Sound, Splash starten.
   * @returns {void}
   */
  onGroundHit() {
    this.hasHit = true;
    this.playHitSound();
    this.splashAnimation();
  }

  /**
   * Spielt den Hit-Sound ab.
   * @returns {void}
   */
  playHitSound() {
    this.hitSound.currentTime = 0;
    this.hitSound.play().catch(e => console.warn('Hit sound error:', e));
  }

  /**
   * Startet die Rotations-Animation.
   * @returns {void}
   */
  startRotationLoop() {
    this.rotationInterval = setInterval(() => {
      this.playAnimation(this.IMAGES_ROTATION);
    }, 50);
  }

  /**
   * Stoppt den Rotationssound (z.B. beim Treffer).
   * @returns {void}
   */
  stopSound() {
    if (!this.rotationSound) return;
    this.rotationSound.pause();
    this.rotationSound.currentTime = 0;
  }

  /**
   * Startet die Splash-Animation und stoppt Bewegung/Rotation.
   * Optionaler Callback wird nach dem Splash ausgeführt.
   * @param {Function} [callback] - Wird nach dem Splash aufgerufen.
   * @returns {void}
   */
  splashAnimation(callback) {
    this.stopSound();
    this.stopIntervals();
    this.resetSpeeds();
    this.playSplashFrames(callback);
  }

  /**
   * Stoppt Move- und Rotation-Intervalle.
   * @returns {void}
   */
  stopIntervals() {
    clearInterval(this.moveInterval);
    clearInterval(this.rotationInterval);
  }

  /**
   * Setzt Geschwindigkeiten auf 0 (nach Treffer).
   * @returns {void}
   */
  resetSpeeds() {
    this.speedY = 0;
    this.speedX = 0;
  }

  /**
   * Spielt die Splash-Frames nacheinander ab.
   * @param {Function} [callback]
   * @returns {void}
   */
  playSplashFrames(callback) {
    let i = 0;
    const id = setInterval(() => {
      this.loadImage(this.IMAGES_SPLASH[i++]);
      if (i >= this.IMAGES_SPLASH.length) this.finishSplash(id, callback);
    }, 100);
  }

  /**
   * Beendet die Splash-Animation: unsichtbar machen und Callback ausführen.
   * @param {number} intervalId - Interval-ID des Splash-Loops.
   * @param {Function} [callback]
   * @returns {void}
   */
  finishSplash(intervalId, callback) {
    clearInterval(intervalId);
    setTimeout(() => {
      this.loadImage('');
      this.width = 0;
      this.height = 0;
      if (callback) callback();
    }, 200);
  }
}
