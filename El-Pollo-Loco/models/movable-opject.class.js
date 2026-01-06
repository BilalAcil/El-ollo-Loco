class MovableObject extends DrawableObject {
  // Geschwindigkeit des Objekts (für horizontale Bewegung)
  speed = 0.15;
  // Gibt an, ob sich das Objekt in die andere Richtung bewegt
  otherDirection = false;
  // Vertikale Geschwindigkeit (für Sprünge und Schwerkraft)
  speedY = 0;
  // Beschleunigung durch Schwerkraft
  acceleration = 2.0;
  // Lebensenergie des Objekts
  energy = 100;
  // Zeitpunkt des letzten Treffers (in Millisekunden)
  lastHit = 0;
  // Sprung-Sound vorbereiten
  jumpSound = new Audio('audio/jump.mp3');
  // Schmerz-Sound vorbereiten
  painSound = new Audio('audio/pain.mp3');


  /**
   * Wendet die Schwerkraft auf das Objekt an, indem die y-Position und die vertikale Geschwindigkeit regelmäßig angepasst werden.
   */
  applyGravity() {
    setInterval(() => {
      if (!this.isAboveGround() && this.speedY <= 0) return;
      this.y -= this.speedY;
      this.speedY -= this.acceleration;
    }, 1000 / 25);
  }

  /**
   * Prüft, ob das Objekt sich über dem Boden befindet.
   * @returns {boolean}
   */
  isAboveGround() {
    return this.y < 150;
  }

  isFalling() {
    return this.speedY < -2;
  }

  /**
   * Prüft, ob dieses Objekt mit einem anderen kollidiert.
   * @param {MovableObject} mo - Das andere Objekt
   * @returns {boolean}
   */
  isColliding(mo) {
    const a = this.getCollisionBox(this);
    const b = this.getCollisionBox(mo);
    return this.boxesOverlap(a, b);
  }

  getCollisionBox(obj) {
    return obj.collisionBox || { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
  }

  boxesOverlap(a, b) {
    return a.x + a.width > b.x &&
      a.x < b.x + b.width &&
      a.y + a.height > b.y &&
      a.y < b.y + b.height;
  }

  /**
   * Reduziert die Energie des Objekts bei einem Treffer und merkt sich den Zeitpunkt.
   */
  hit() {
    this.applyDamage(20);
    this.playPainSoundWithCooldown(1300);
    this.stopCountdownIfDead();
  }

  applyDamage(amount) {
    this.energy = Math.max(0, this.energy - amount);
    if (this.energy > 0) this.lastHit = Date.now();
  }

  playPainSoundWithCooldown(ms) {
    const now = Date.now();
    if (this.lastPainSoundTime && now - this.lastPainSoundTime < ms) return;
    this.lastPainSoundTime = now;
    this.painSound.currentTime = 0;
    this.painSound.playbackRate = 1.2;
    this.painSound.volume = 0.6;
    this.painSound.play().catch(e => console.warn(e));
  }

  stopCountdownIfDead() {
    if (this.energy > 0) return;
    this.world?.countdown?.stopCountdown();
  }

  /**
   * Prüft, ob das Objekt kürzlich getroffen wurde (innerhalb der letzten 1 Sekunde).
   * @returns {boolean}
   */
  isHurt() {
    let timePassed = new Date().getTime() - this.lastHit;
    timePassed = timePassed / 1000;
    return timePassed < 1;
  }

  /**
   * Prüft, ob das Objekt keine Energie mehr hat.
   * @returns {boolean}
   */
  isDead() {
    return this.energy <= 0;
  }

  /**
   * Spielt eine Animation ab, indem das nächste Bild aus dem Array geladen wird.
   * @param {string[]} images - Array mit Bildpfaden
   */
  playAnimation(images) {
    let i = this.currentImage % images.length;
    let path = images[i];
    this.img = this.imageCache[path];
    this.currentImage++;
  }

  /**
   * Bewegt das Objekt nach rechts.
   */
  moveRight() {
    this.x += this.speed;
  }

  /**
   * Bewegt das Objekt nach links.
   */
  moveLeft() {
    this.x -= this.speed;
  }

  /**
   * Lässt das Objekt springen, indem die vertikale Geschwindigkeit gesetzt wird.
   */
  jump() {
    if (this.atEndboss) {
      this.speedY = 25; // Höherer Sprung im Endboss-Bereich
    } else {
      this.speedY = 20; // Normaler Sprung außerhalb
    }

    // Sprung-Sound sofort abspielen
    this.jumpSound.currentTime = 0;
    this.jumpSound.playbackRate = 1.5;
    this.jumpSound.volume = 0.6;
    this.jumpSound.play().catch(e => console.warn(e));
  }
}