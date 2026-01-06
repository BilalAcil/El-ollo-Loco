class SalsaThrow extends MovableObject {
  width = 50;
  height = 50;

  speedX = 8;
  speedY = 10;
  acceleration = 0.45;
  direction;
  hasHit = false;

  IMAGES_ROTATION = [
    'img/6_salsa_bottle/bottle_rotation/1_bottle_rotation.png',
    'img/6_salsa_bottle/bottle_rotation/2_bottle_rotation.png',
    'img/6_salsa_bottle/bottle_rotation/3_bottle_rotation.png',
    'img/6_salsa_bottle/bottle_rotation/4_bottle_rotation.png'
  ];

  IMAGES_SPLASH = [
    'img/6_salsa_bottle/bottle_rotation/bottle_splash/1_bottle_splash.png',
    'img/6_salsa_bottle/bottle_rotation/bottle_splash/2_bottle_splash.png',
    'img/6_salsa_bottle/bottle_rotation/bottle_splash/3_bottle_splash.png',
    'img/6_salsa_bottle/bottle_rotation/bottle_splash/4_bottle_splash.png',
    'img/6_salsa_bottle/bottle_rotation/bottle_splash/5_bottle_splash.png'
  ];

  constructor(x, y, direction) {
    super().loadImage(this.IMAGES_ROTATION[0]);
    this.loadImages(this.IMAGES_ROTATION);
    this.loadImages(this.IMAGES_SPLASH);
    this.setStartPosition(x, y, direction);
    this.initSounds();
    this.throw();
  }

  setStartPosition(x, y, direction) {
    this.x = x;
    this.y = y;
    this.direction = direction;
  }

  initSounds() {
    this.rotationSound = new Audio('audio/throw-sound-2.mp3');
    this.rotationSound.volume = 0.4;
    this.hitSound = new Audio('audio/hit-sound.mp3');
    this.hitSound.volume = 0.5;
  }

  /** 🚀 Startet den Wurf **/
  throw() {
    this.playRotationSound();
    this.startMoveLoop();
    this.startRotationLoop();
  }

  playRotationSound() {
    this.rotationSound.currentTime = 0;
    this.rotationSound.play().catch(e => console.warn('Rotation sound error:', e));
  }

  startMoveLoop() {
    this.moveInterval = setInterval(() => this.tickMove(), 25);
  }

  tickMove() {
    this.moveX();
    this.moveY();
    if (this.isGroundHit()) this.onGroundHit();
  }

  moveX() {
    this.x += this.direction ? -this.speedX : this.speedX;
    this.speedX *= 0.99;
  }

  moveY() {
    this.y -= this.speedY;
    this.speedY -= this.acceleration;
  }

  isGroundHit() {
    return this.y >= 380 && !this.hasHit;
  }

  onGroundHit() {
    this.hasHit = true;
    this.playHitSound();
    this.splashAnimation();
  }

  playHitSound() {
    this.hitSound.currentTime = 0;
    this.hitSound.play().catch(e => console.warn('Hit sound error:', e));
  }

  startRotationLoop() {
    this.rotationInterval = setInterval(() => {
      this.playAnimation(this.IMAGES_ROTATION);
    }, 50);
  }

  stopSound() {
    if (!this.rotationSound) return;
    this.rotationSound.pause();
    this.rotationSound.currentTime = 0;
  }

  /** 💥 Splash-Animation **/
  splashAnimation(callback) {
    this.stopSound();
    this.stopIntervals();
    this.resetSpeeds();
    this.playSplashFrames(callback);
  }

  stopIntervals() {
    clearInterval(this.moveInterval);
    clearInterval(this.rotationInterval);
  }

  resetSpeeds() {
    this.speedY = 0;
    this.speedX = 0;
  }

  playSplashFrames(callback) {
    let i = 0;
    const id = setInterval(() => {
      this.loadImage(this.IMAGES_SPLASH[i++]);
      if (i >= this.IMAGES_SPLASH.length) this.finishSplash(id, callback);
    }, 100);
  }

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
