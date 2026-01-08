// models/character.class.js

class Character extends MovableObject {
  world;
  isDying = false;

  currentAnimation = 'idle';
  animationFinished = true;
  isThrowing = false;

  lastActionTime = 0;
  actionCooldown = 500;

  pauseStartTime = 0;
  totalPausedTime = 0;

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

  initImages() {
    this.loadImages(this.IMAGES_IDLE);
    this.loadImages(this.IMAGES_THROW);
    this.loadImages(this.IMAGES_WALKING);
    this.loadImages(this.IMAGES_JUMPING);
    this.loadImages(this.IMAGES_DEAD);
    this.loadImages(this.IMAGES_HURT);
    this.loadImages(this.IMAGES_LONG_IDLE);
  }

  initPhysics() {
    this.applyGravity(); // kommt aus character.gravity.js
  }

  initState() {
    this.atEndboss = false;
    this.lastGlobalHit = 0;
  }

  initSounds() {
    this.throwSound = new Audio('audio/throw-sound-1.mp3');
    this.throwSound.volume = 0.4;
  }

  initIdleSystem() {
    this.showIdle = false;
    this.lastMoveTime = Date.now();
    this.idleAnimationStarted = false;
    this.longIdleActive = false;
    this.longIdleInterval = null;
  }

  get collisionBox() {
    return {
      x: this.x + 25,
      y: this.y + 95,
      width: this.width - 60,
      height: this.height - 110
    };
  }

  isAboveGround() {
    return this.y < 155;
  }

  drawFrame(ctx) {
    const box = this.collisionBox;
    ctx.beginPath();
    ctx.lineWidth = "1";
    ctx.strokeStyle = "transparent";
    ctx.rect(box.x - this.x, box.y - this.y, box.width, box.height);
    ctx.stroke();
  }

  animate() {
    this.startMovementLoop();   // character.movement.js
    this.startAnimationLoop();  // character.animation.js
  }

  pause() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.pauseStartTime = Date.now();
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.applyPauseTimeCompensation();
  }

  applyPauseTimeCompensation() {
    if (!this.pauseStartTime) return;
    this.lastMoveTime += Date.now() - this.pauseStartTime;
  }
}
