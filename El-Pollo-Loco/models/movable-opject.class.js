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
      if (this.isAboveGround() || this.speedY > 0) {

        // Vorher prüfen, ob wir noch aufsteigen
        const warAmSteigen = this.speedY > 0;

        this.y -= this.speedY;
        this.speedY -= this.acceleration;

        // Übergang von Steigen -> Fallen erkennen (Apex)
        if (warAmSteigen && this.speedY <= 0) {
          console.log("Sprunghöhe erreicht bei Y:", this.y);
        }

      }
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
    return this.speedY < 10;
  }


  /**
   * Prüft, ob dieses Objekt mit einem anderen kollidiert.
   * @param {MovableObject} mo - Das andere Objekt
   * @returns {boolean}
   */
  isColliding(mo) {
    return this.x + this.width > mo.x &&
      this.x < mo.x + mo.width &&
      this.y + this.height > mo.y &&
      this.y < mo.y + mo.height;
  }

  /**
   * Reduziert die Energie des Objekts bei einem Treffer und merkt sich den Zeitpunkt.
   */
  hit() {
    this.energy -= 5;
    if (this.energy < 0) {
      this.energy = 0;
    } else {
      this.lastHit = new Date().getTime(); // Zeitpunkt des Treffers speichern
    }

    // Schmerz-Sound nur abspielen, wenn 2 Sekunden seit dem letzten Abspielen vergangen sind
    const now = new Date().getTime();
    if (!this.lastPainSoundTime || now - this.lastPainSoundTime >= 2000) {
      this.lastPainSoundTime = now;
      this.painSound.currentTime = 0;
      this.painSound.playbackRate = 1.2;
      this.painSound.volume = 0.6;
      this.painSound.play().catch(e => console.warn(e));
    }

    // 👇 Wenn Energie 0 ist → Countdown stoppen
    if (this.energy <= 0 && this.world && this.world.countdown) {
      this.world.countdown.stopCountdown();
    }
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