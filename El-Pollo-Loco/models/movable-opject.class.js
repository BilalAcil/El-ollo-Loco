/**
 * @file models/movable-object.class.js
 * @description
 * Basisklasse für alle beweglichen Objekte (Physik, Kollisionen, Bewegung, Schaden, Animation).
 * Erweitert {@link DrawableObject}.
 */

/**
 * Bewegliches Objekt im Spiel (z.B. Character, Enemies, Items).
 * @class
 * @extends DrawableObject
 */
class MovableObject extends DrawableObject {
  /** Horizontale Geschwindigkeit. @type {number} */
  speed = 0.15;

  /** Blick-/Bewegungsrichtung (true = links). @type {boolean} */
  otherDirection = false;

  /** Vertikale Geschwindigkeit (Sprung/Schwerkraft). @type {number} */
  speedY = 0;

  /** Beschleunigung durch Schwerkraft. @type {number} */
  acceleration = 2.0;

  /** Lebensenergie (0–100). @type {number} */
  energy = 100;

  /** Timestamp des letzten Treffers (ms). @type {number} */
  lastHit = 0;

  /** Jump-Sound. @type {HTMLAudioElement} */
  jumpSound = new Audio('audio/jump.mp3');

  /** Schmerz-Sound. @type {HTMLAudioElement} */
  painSound = new Audio('audio/pain.mp3');

  /** Letzter Zeitpunkt, an dem Pain-Sound gespielt wurde. @type {number} */
  lastPainSoundTime = 0;

  gravityInterval = null;

  /**
   * Startet die Schwerkraft-Schleife.
   * Aktualisiert y-Position und speedY in festen Intervallen.
   * @returns {void}
   */
  applyGravity() {
    if (this.gravityInterval) return; // ✅ schon aktiv

    this.gravityInterval = setInterval(() => {
      if (this.isPaused) return; // ✅ optional, aber sehr sinnvoll
      if (!this.isAboveGround() && this.speedY <= 0) return;

      this.y -= this.speedY;
      this.speedY -= this.acceleration;
    }, 1000 / 25);
  }

  stopGravity() {
    clearInterval(this.gravityInterval);
    this.gravityInterval = null;
  }

  /**
   * Prüft, ob das Objekt über dem Boden ist.
   * @returns {boolean}
   */
  isAboveGround() {
    return this.y < 150;
  }

  /**
   * Prüft, ob das Objekt deutlich fällt (für z.B. Stomp-Checks).
   * @returns {boolean}
   */
  isFalling() {
    return this.speedY < -2;
  }

  /**
   * Prüft Kollision mit einem anderen {@link MovableObject}.
   * Nutzt collisionBox (falls vorhanden), sonst x/y/width/height.
   * @param {MovableObject} mo - Zielobjekt.
   * @returns {boolean}
   */
  isColliding(mo) {
    const a = this.getCollisionBox(this);
    const b = this.getCollisionBox(mo);
    return this.boxesOverlap(a, b);
  }

  /**
   * Liefert die Kollisionsbox für ein Objekt.
   * @param {MovableObject} obj - Objekt mit optionaler collisionBox.
   * @returns {{x:number, y:number, width:number, height:number}}
   */
  getCollisionBox(obj) {
    return obj.collisionBox || { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
  }

  /**
   * Prüft, ob zwei Axis-Aligned Bounding Boxes überlappen.
   * @param {{x:number, y:number, width:number, height:number}} a
   * @param {{x:number, y:number, width:number, height:number}} b
   * @returns {boolean}
   */
  boxesOverlap(a, b) {
    return (
      a.x + a.width > b.x &&
      a.x < b.x + b.width &&
      a.y + a.height > b.y &&
      a.y < b.y + b.height
    );
  }

  /**
   * Wendet Standardschaden an (20) und triggert Schmerzsound + Death-Handling.
   * @returns {void}
   */
  hit() {
    this.applyDamage(20);
    this.playPainSoundWithCooldown(1300);
    this.stopCountdownIfDead();
  }

  /**
   * Zieht Energie ab und setzt lastHit, solange das Objekt noch lebt.
   * @param {number} amount - Schadenswert.
   * @returns {void}
   */
  applyDamage(amount) {
    this.energy = Math.max(0, this.energy - amount);
    if (this.energy > 0) this.lastHit = Date.now();
  }

  /**
   * Spielt den Schmerzsound mit Cooldown, um Sound-Spam zu vermeiden.
   * @param {number} ms - Cooldown in Millisekunden.
   * @returns {void}
   */
  playPainSoundWithCooldown(ms) {
    const now = Date.now();
    if (this.lastPainSoundTime && now - this.lastPainSoundTime < ms) return;

    this.lastPainSoundTime = now;
    this.painSound.currentTime = 0;
    this.painSound.playbackRate = 1.2;
    this.painSound.volume = 0.6;
    this.painSound.play().catch(e => console.warn(e));
  }

  /**
   * Stoppt den Countdown, falls dieses Objekt tot ist (energy <= 0).
   * @returns {void}
   */
  stopCountdownIfDead() {
    if (this.energy > 0) return;
    this.world?.countdown?.stopCountdown();
  }

  /**
   * Prüft, ob das Objekt kürzlich getroffen wurde (unter 1 Sekunde).
   * @returns {boolean}
   */
  isHurt() {
    let timePassed = Date.now() - this.lastHit;
    timePassed = timePassed / 1000;
    return timePassed < 1;
  }

  /**
   * Prüft, ob das Objekt tot ist.
   * @returns {boolean}
   */
  isDead() {
    return this.energy <= 0;
  }

  /**
   * Spielt eine Sprite-Animation anhand eines Bildarrays ab.
   * @param {string[]} images - Array mit Bildpfaden.
   * @returns {void}
   */
  playAnimation(images) {
    const i = this.currentImage % images.length;
    const path = images[i];
    this.img = this.imageCache[path];
    this.currentImage++;
  }

  /**
   * Bewegt das Objekt nach rechts.
   * @returns {void}
   */
  moveRight() {
    this.x += this.speed;
  }

  /**
   * Bewegt das Objekt nach links.
   * @returns {void}
   */
  moveLeft() {
    this.x -= this.speed;
  }

  /**
   * Lässt das Objekt springen und spielt den Jump-Sound ab.
   * Im Endboss-Bereich ist der Sprung höher.
   * @returns {void}
   */
  jump() {
    this.speedY = this.atEndboss ? 25 : 20;

    this.jumpSound.currentTime = 0;
    this.jumpSound.playbackRate = 1.5;
    this.jumpSound.volume = 0.6;
    this.jumpSound.play().catch(e => console.warn(e));
  }
}
