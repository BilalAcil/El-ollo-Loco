class Bodyguard extends MovableObject {
  height = 180;
  width = 160;
  y = 150;

  energy = 100;
  isDead = false;
  isJumping = false;
  hasJumped = false;

  jumpInterval = null;
  attackInterval = null;
  fallInterval = null;
  deathAnimInterval = null;

  lastSpeedX = 0;
  lastDirection = false; // false=rechts, true=links

  IMAGE = 'img/4_enemie_boss_chicken/1_walk/G2.png';

  IMAGES_JUMP_START = ['img/4_enemie_boss_chicken/3_attack/G20.png'];
  IMAGES_JUMP_UP = ['img/4_enemie_boss_chicken/3_attack/G19.png'];
  IMAGES_JUMP_HOVER = ['img/4_enemie_boss_chicken/3_attack/G18.png'];
  IMAGES_LAND = [
    'img/4_enemie_boss_chicken/3_attack/G17.png',
    'img/4_enemie_boss_chicken/3_attack/G16.png',
    'img/4_enemie_boss_chicken/3_attack/G15.png',
    'img/4_enemie_boss_chicken/3_attack/G14.png',
    'img/4_enemie_boss_chicken/3_attack/G13.png'
  ];
  IMAGES_WALK = [
    'img/4_enemie_boss_chicken/1_walk/G1.png',
    'img/4_enemie_boss_chicken/1_walk/G2.png',
    'img/4_enemie_boss_chicken/1_walk/G3.png',
    'img/4_enemie_boss_chicken/1_walk/G4.png'
  ];
  IMAGES_HURT = [
    'img/4_enemie_boss_chicken/4_hurt/G21.png',
    'img/4_enemie_boss_chicken/4_hurt/G22.png',
    'img/4_enemie_boss_chicken/4_hurt/G23.png'
  ];
  IMAGES_DEAD = [
    'img/4_enemie_boss_chicken/5_dead/G24.png',
    'img/4_enemie_boss_chicken/5_dead/G25.png',
    'img/4_enemie_boss_chicken/5_dead/G26.png'
  ];

  constructor() {
    super();
    this.initPosition();
    this.initPhysics();
    this.preloadAssets();
    this.initSounds();
  }

  initPosition() {
    this.x = 4700;
    this.loadImage(this.IMAGE);
  }

  initPhysics() {
    this.applyGravity();
  }

  preloadAssets() {
    this.loadImages(this.IMAGES_JUMP_START);
    this.loadImages(this.IMAGES_JUMP_UP);
    this.loadImages(this.IMAGES_JUMP_HOVER);
    this.loadImages(this.IMAGES_LAND);
    this.loadImages(this.IMAGES_WALK);
    this.loadImages(this.IMAGES_HURT);
    this.loadImages(this.IMAGES_DEAD);
  }

  initSounds() {
    this.bodyguardSound = new Audio('audio/bodyguard-sound.mp3');
    this.boomSound = new Audio('audio/Boom.mp3');
    this.hurtSound = new Audio('audio/bodyguard-hurt.mp3');
    this.hurtSound.volume = 0.6;
    this.hurtSound.load();
  }

  jumpToEndboss() {
    if (!this.canStartJump()) return;
    this.markJumpStarted();
    this.playJumpStartSound();
    this.startJumpMotion();
    this.startJumpLoop();
  }

  canStartJump() {
    return !this.isJumping && !this.hasJumped;
  }

  markJumpStarted() {
    this.isJumping = true;
    this.hasJumped = true;
  }

  playJumpStartSound() {
    this.bodyguardSound.currentTime = 0;
    this.bodyguardSound.play().catch(() => { });
  }

  startJumpMotion() {
    this.speedY = 32;
    this.speedX = -12;
    this.playAnimation(this.IMAGES_JUMP_START);
  }

  startJumpLoop() {
    this.jumpInterval = setInterval(() => this.stepJump(), 40);
  }

  stepJump() {
    this.updateJumpAnimation();
    this.applyJumpMovement();
    if (this.shouldLandNow()) this.handleLanding();
  }

  updateJumpAnimation() {
    const imgs = this.speedY > 0 ? this.IMAGES_JUMP_UP : this.IMAGES_JUMP_HOVER;
    this.playAnimation(imgs);
  }

  applyJumpMovement() {
    this.x += this.speedX;
    this.speedX *= 0.99;
  }

  shouldLandNow() {
    return this.speedY <= 0 && !this.isAboveGround();
  }

  handleLanding() {
    this.snapToGround();
    this.playBoom();
    this.triggerWorldShock();
    this.ensureStatusBar();
    this.stopJumpLoop();
    this.startLandSequence();
  }

  snapToGround() {
    this.y = 260;
    this.speedY = 0;
    this.speedX = 0;
  }

  playBoom() {
    this.boomSound.currentTime = 0;
    this.boomSound.play().catch(() => { });
  }

  triggerWorldShock() {
    if (this.world) this.world.jumpFromShock();
  }

  ensureStatusBar() {
    if (!this.world || this.world.bodyguardStatus) return;
    this.world.bodyguardStatus = new BodyguardStatusBar(this.world);
    this.world.addToMap(this.world.bodyguardStatus);
  }

  stopJumpLoop() {
    clearInterval(this.jumpInterval);
    this.jumpInterval = null;
    this.isJumping = false;
  }

  startLandSequence() {
    this.playAnimation(this.IMAGES_LAND);
    const ms = this.IMAGES_LAND.length * 100;
    setTimeout(() => this.finishLanding(), ms);
  }

  finishLanding() {
    this.loadImage('img/4_enemie_boss_chicken/3_attack/G13.png');
    this.unfreezePlayer();
    this.startAttackAfterDelay(1000);
  }

  unfreezePlayer() {
    if (this.world?.character) this.world.character.freezeForBodyguard = false;
  }

  startAttackAfterDelay(ms) {
    setTimeout(() => {
      if (this.isDead) return;
      this.startAttackLoop();
    }, ms);
  }

  startAttackLoop() {
    if (!this.hasJumped) return;
    this.resetAttackInterval();
    this.restoreAttackState();
    this.attackInterval = setInterval(() => this.stepAttack(), 60);
  }

  resetAttackInterval() {
    if (!this.attackInterval) return;
    clearInterval(this.attackInterval);
    this.attackInterval = null;
  }

  restoreAttackState() {
    this.speedX = this.lastSpeedX !== 0 ? this.lastSpeedX : (this.speedX || -15);
    this.otherDirection = this.lastDirection ?? this.otherDirection ?? false;
  }

  stepAttack() {
    this.playAnimation(this.IMAGES_WALK);
    this.x += this.speedX;
    this.handleAttackBounds();
    this.rememberAttackState();
  }

  handleAttackBounds() {
    if (this.x <= 3780) return this.turnAroundAfterStop(true, +15);
    if (this.x >= 4330) return this.turnAroundAfterStop(false, -15);
  }

  turnAroundAfterStop(direction, speed) {
    this.speedX = 0;
    setTimeout(() => {
      if (this.isDead) return;
      this.otherDirection = direction;
      this.speedX = speed;
    }, 200);
  }

  rememberAttackState() {
    this.lastSpeedX = this.speedX;
    this.lastDirection = this.otherDirection;
  }

  get collisionBox() {
    return {
      x: this.x + 15,
      y: this.y + 30,
      width: this.width - 25,
      height: this.height - 40
    };
  }

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

  stopAttackForHit() {
    this.resetAttackInterval();
    this.saveMotionState();
    this.speedX = 0;
  }

  saveMotionState() {
    this.lastDirection = this.otherDirection;
    this.lastSpeedX = this.speedX;
  }

  playHurtSound() {
    this.hurtSound.currentTime = 0;
    this.hurtSound.play().catch(e => console.warn('Soundfehler:', e));
  }

  applyDamage(amount) {
    this.energy -= amount;
  }

  updateStatusBar() {
    this.world?.bodyguardStatus?.setPercentage(this.energy);
  }

  handleDeath() {
    this.world?.onBodyguardDeath?.();
    this.die();
  }

  applyHitFallbackMovement() {
    const player = this.world?.character;
    if (!player) return;
    const playerRight = player.x > this.x;
    this.otherDirection = !playerRight;
    this.speedX = playerRight ? 5 : -5;
  }

  playHurtAnimationThenResume() {
    const total = this.IMAGES_HURT.length * 2;
    let frames = 0;
    const intv = setInterval(() => {
      this.playAnimation(this.IMAGES_HURT);
      if (++frames >= total) return this.endHurt(intv);
    }, 100);
  }

  endHurt(intervalId) {
    clearInterval(intervalId);
    this.startAttackLoop();
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.clearStatusBar();
    this.stopAllIntervals();
    this.speedX = 0;
    this.playDieSoundDelayed(200);
    this.startFallingWhenDead();
  }

  clearStatusBar() {
    if (this.world?.bodyguardStatus) this.world.bodyguardStatus = null;
  }

  stopAllIntervals() {
    this.resetAttackInterval();
    this.stopJumpIfRunning();
    this.stopFallIfRunning();
    this.stopDeathAnimIfRunning();
  }

  stopJumpIfRunning() {
    if (!this.jumpInterval) return;
    clearInterval(this.jumpInterval);
    this.jumpInterval = null;
  }

  stopFallIfRunning() {
    if (!this.fallInterval) return;
    clearInterval(this.fallInterval);
    this.fallInterval = null;
  }

  stopDeathAnimIfRunning() {
    if (!this.deathAnimInterval) return;
    clearInterval(this.deathAnimInterval);
    this.deathAnimInterval = null;
  }

  playDieSoundDelayed(ms) {
    this.ensureDieSound();
    setTimeout(() => {
      if (this.isDead) this.playDieSound();
    }, ms);
  }

  ensureDieSound() {
    if (this.dieSound) return;
    this.dieSound = new Audio('audio/bodyguard-die.mp3');
    this.dieSound.volume = 0.5;
  }

  playDieSound() {
    this.dieSound.currentTime = 0;
    this.dieSound.play().catch(() => { });
  }

  startFallingWhenDead() {
    if (this.fallInterval) return;
    this.startDeathAnimLoop();
    this.startFallLoop();
  }

  startDeathAnimLoop() {
    this.deathAnimInterval = setInterval(() => {
      this.playAnimation(this.IMAGES_DEAD);
    }, 200);
  }

  startFallLoop() {
    let fallSpeed = 0;
    this.fallInterval = setInterval(() => {
      if (this.isGamePaused()) return;
      fallSpeed += 0.5;
      this.y += fallSpeed;
      if (this.y > 600) this.finishDeathFall();
    }, 1000 / 30);
  }

  isGamePaused() {
    return this.isPaused || this.world?.isPaused;
  }

  finishDeathFall() {
    this.stopFallIfRunning();
    this.stopDeathAnimIfRunning();
    this.removeFromWorld();
  }

  removeFromWorld() {
    const enemies = this.world?.level?.enemies;
    if (!enemies) return;
    const i = enemies.indexOf(this);
    if (i > -1) enemies.splice(i, 1);
  }

  pause() {
    this.stopAllIntervals();
  }

  resume() {
    if (this.isDead || this.isJumping) return;
    this.speedX = this.lastSpeedX;
    this.otherDirection = this.lastDirection;
    this.startAttackLoop();
  }
}
