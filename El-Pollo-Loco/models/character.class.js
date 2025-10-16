class Character extends MovableObject {

  height = 280;
  width = 120;
  y = 0;
  speed = 10;

  IMAGES_IDLE = [
    'img/2_character_pepe/1_idle/idle/I-1.png',
    'img/2_character_pepe/1_idle/idle/I-2.png',
    'img/2_character_pepe/1_idle/idle/I-3.png',
    'img/2_character_pepe/1_idle/idle/I-4.png',
    'img/2_character_pepe/1_idle/idle/I-5.png',
    'img/2_character_pepe/1_idle/idle/I-6.png',
    'img/2_character_pepe/1_idle/idle/I-7.png',
    'img/2_character_pepe/1_idle/idle/I-8.png',
    'img/2_character_pepe/1_idle/idle/I-9.png',
    'img/2_character_pepe/1_idle/idle/I-10.png'
  ];

  IMAGES_LONG_IDLE = [
    'img/2_character_pepe/1_idle/long_idle/I-11.png',
    'img/2_character_pepe/1_idle/long_idle/I-12.png',
    'img/2_character_pepe/1_idle/long_idle/I-13.png',
    'img/2_character_pepe/1_idle/long_idle/I-14.png',
    'img/2_character_pepe/1_idle/long_idle/I-15.png',
    'img/2_character_pepe/1_idle/long_idle/I-16.png',
    'img/2_character_pepe/1_idle/long_idle/I-17.png',
    'img/2_character_pepe/1_idle/long_idle/I-18.png',
    'img/2_character_pepe/1_idle/long_idle/I-19.png',
    'img/2_character_pepe/1_idle/long_idle/I-20.png'
  ];

  IMAGES_WALKING = [
    'img/2_character_pepe/2_walk/W-21.png',
    'img/2_character_pepe/2_walk/W-22.png',
    'img/2_character_pepe/2_walk/W-23.png',
    'img/2_character_pepe/2_walk/W-24.png',
    'img/2_character_pepe/2_walk/W-25.png',
    'img/2_character_pepe/2_walk/W-26.png',
  ];

  IMAGES_JUMPING = [
    'img/2_character_pepe/3_jump/J-31.png',
    'img/2_character_pepe/3_jump/J-32.png',
    'img/2_character_pepe/3_jump/J-33.png',
    'img/2_character_pepe/3_jump/J-34.png',
    'img/2_character_pepe/3_jump/J-35.png',
    'img/2_character_pepe/3_jump/J-36.png',
    'img/2_character_pepe/3_jump/J-37.png',
    'img/2_character_pepe/3_jump/J-38.png',
    'img/2_character_pepe/3_jump/J-39.png',
  ];

  IMAGES_DEAD = [
    'img/2_character_pepe/5_dead/D-51.png',
    'img/2_character_pepe/5_dead/D-52.png',
    'img/2_character_pepe/5_dead/D-53.png',
    'img/2_character_pepe/5_dead/D-54.png',
    'img/2_character_pepe/5_dead/D-55.png',
    'img/2_character_pepe/5_dead/D-56.png',
    'img/2_character_pepe/5_dead/D-57.png'
  ];

  IMAGES_HURT = [
    'img/2_character_pepe/4_hurt/H-41.png',
    'img/2_character_pepe/4_hurt/H-42.png',
    'img/2_character_pepe/4_hurt/H-43.png'
  ];

  world;
  currentAnimation = 'idle';
  animationFinished = true;
  lastActionTime = 0;
  actionCooldown = 500; // Zeit in ms nach der zum Idle gewechselt wird

  constructor() {
    super().loadImage('img/2_character_pepe/1_idle/idle/I-1.png');
    this.loadImages(this.IMAGES_IDLE);
    this.loadImages(this.IMAGES_WALKING);
    this.loadImages(this.IMAGES_JUMPING);
    this.loadImages(this.IMAGES_DEAD);
    this.loadImages(this.IMAGES_HURT);
    this.loadImages(this.IMAGES_LONG_IDLE); // Long Idle Bilder laden
    this.applyGravity();
    this.atEndboss = false;
    this.animate();
    this.idleImage = 'img/2_character_pepe/1_idle/idle/I-1.png';
    this.showIdle = false;
    this.lastMoveTime = Date.now();
    this.idleAnimationStarted = false;
    this.longIdleActive = false; // Neue Eigenschaft für Long Idle
    this.longIdleInterval = null; // Für die Long Idle Animation
  }


  // HIER kommt die Kollisionsbox für den Character
  get collisionBox() {
    return {
      x: this.x + 10, // Etwas von links verschieben
      y: this.y + 100, // Hitbox nach unten verschieben (Kopfbereich ausschließen)
      width: this.width - 20, // Breite reduzieren für schmalere Hitbox
      height: this.height - 110 // Höhe reduzieren (Kopf und Füße ausschließen)
    };
  }


  // Und die drawFrame Methode anpassen
  drawFrame(ctx) {
    if (this instanceof Character) {
      const box = this.collisionBox;
      ctx.beginPath();
      ctx.lineWidth = "1";
      ctx.stokeStyle = "blue"; // Andere Farbe für Character
      // Relative Position zur Hitbox zeichnen
      ctx.rect(box.x - this.x, box.y - this.y, box.width, box.height);
      ctx.stroke();
    }
  }


  animate() {
    // Bewegung und Kamera
    setInterval(() => {
      if (this.atEndboss) {
        this.world.camera_x = -4100 + 100;
      } else {
        this.world.camera_x = -this.x + 100;
      }

      // Bewegung
      if (this.world.keyboard.RIGHT && this.x < this.world.level.level_end_x) {
        this.moveRight();
        this.otherDirection = false;
        this.handleMovement();
      }
      if (
        this.world.keyboard.LEFT &&
        this.x > 0 &&
        (!this.atEndboss || this.x > 3980)
      ) {
        this.moveLeft();
        this.otherDirection = true;
        this.handleMovement();
      }

      if (this.world.keyboard.SPACE && !this.isAboveGround()) {
        this.jump();
        this.handleMovement();
      }

      // Endboss-Bereich aktivieren
      if (this.x >= 4100) {
        this.atEndboss = true;
      }

      // Zur Idle-Animation wechseln nach Inaktivität
      if (Date.now() - this.lastActionTime > this.actionCooldown &&
        !this.isAboveGround() &&
        !this.isHurt() &&
        !this.isDead() &&
        this.currentAnimation !== 'idle') {
        this.currentAnimation = 'idle';
      }
    }, 1000 / 60);

    // Animation
    setInterval(() => {
      const idleTime = Date.now() - this.lastMoveTime;

      if (this.isDead()) {
        this.stopLongIdleAnimation();
        this.playAnimation(this.IMAGES_DEAD);
      } else if (this.isHurt()) {
        this.stopLongIdleAnimation();
        this.playAnimation(this.IMAGES_HURT);
      } else if (this.isAboveGround()) {
        this.stopLongIdleAnimation();
        this.playAnimation(this.IMAGES_JUMPING);
      } else if (this.world.keyboard.RIGHT || this.world.keyboard.LEFT) {
        this.stopLongIdleAnimation();
        this.playAnimation(this.IMAGES_WALKING);
      } else if (idleTime > 12000) { // Nach 12 Sekunden zu Long Idle wechseln
        if (!this.longIdleActive) {
          this.startLongIdleAnimation();
        }
      } else if (idleTime > 10000) { // Nach 10 Sekunden normale Idle
        if (!this.idleAnimationStarted) {
          this.playIdleAnimation();
        }
      } else {
        // Einzelnes Idle-Bild anzeigen
        this.stopLongIdleAnimation();
        this.loadImage(this.IMAGES_IDLE[0]);
      }
    }, 50);
  }

  handleMovement() {
    this.lastMoveTime = Date.now();
    this.idleAnimationStarted = false;
    this.stopLongIdleAnimation();
  }

  startLongIdleAnimation() {
    this.longIdleActive = true;
    this.idleAnimationStarted = false;
    let currentImageIndex = 0;

    this.longIdleInterval = setInterval(() => {
      // Prüfen ob Bewegung stattfindet
      if (Date.now() - this.lastMoveTime < 12000) {
        this.stopLongIdleAnimation();
        return;
      }

      // Long Idle Animation in Schleife abspielen
      this.loadImage(this.IMAGES_LONG_IDLE[currentImageIndex]);
      currentImageIndex = (currentImageIndex + 1) % this.IMAGES_LONG_IDLE.length;
    }, 200); // Geschwindigkeit der Long Idle Animation anpassen
  }

  stopLongIdleAnimation() {
    if (this.longIdleInterval) {
      clearInterval(this.longIdleInterval);
      this.longIdleInterval = null;
    }
    this.longIdleActive = false;
  }

  playIdleAnimation() {
    this.idleAnimationStarted = true;
    let currentImage = 0;

    const idleInterval = setInterval(() => {
      // Prüfen ob Bewegung stattfindet oder Long Idle beginnen sollte
      if (Date.now() - this.lastMoveTime < 10000 || Date.now() - this.lastMoveTime > 12000) {
        clearInterval(idleInterval);
        this.idleAnimationStarted = false;
        return;
      }

      if (currentImage < this.IMAGES_IDLE.length) {
        this.loadImage(this.IMAGES_IDLE[currentImage]);
        currentImage++;
      } else {
        // Bei letztem Bild stehen bleiben
        this.loadImage(this.IMAGES_IDLE[this.IMAGES_IDLE.length - 1]);
      }
    }, 200);
  }
}