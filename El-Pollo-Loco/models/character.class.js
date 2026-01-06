class Character extends MovableObject {

  height = 280;
  width = 120;
  y = 0;
  speed = 10;
  isDying = false; // Neue Variable, um mehrfaches Auslösen zu verhindern

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
    'img/2_character_pepe/3_jump/J-35.png'
  ];

  IMAGES_FALLING = [
    'img/2_character_pepe/3_jump/J-36.png',
    'img/2_character_pepe/3_jump/J-37.png',
    'img/2_character_pepe/3_jump/J-38.png',
    'img/2_character_pepe/3_jump/J-39.png'
  ];

  IMAGES_DEAD = [
    'img/2_character_pepe/5_dead/D-51.png',
    'img/2_character_pepe/5_dead/D-53.png',
    'img/2_character_pepe/5_dead/D-54.png'
  ];

  IMAGES_HURT = [
    'img/2_character_pepe/4_hurt/H-41.png',
    'img/2_character_pepe/4_hurt/H-42.png',
    'img/2_character_pepe/4_hurt/H-43.png'
  ];

  IMAGES_THROW = [
    'img/2_character_pepe/2_walk/W-21.png',
    'img/2_character_pepe/2_walk/W-22.png',
    'img/2_character_pepe/2_walk/W-23.png'
  ];

  world;
  currentAnimation = 'idle';
  animationFinished = true;
  isThrowing = false;         // <<< NEU: Flag während Wurfanimation
  lastActionTime = 0;
  actionCooldown = 500; // Zeit in ms nach der zum Idle gewechselt wird

  constructor() {
    super().loadImage('img/2_character_pepe/1_idle/idle/I-1.png');
    this.loadImages(this.IMAGES_IDLE);
    this.loadImages(this.IMAGES_THROW);
    this.loadImages(this.IMAGES_WALKING);
    this.loadImages(this.IMAGES_JUMPING);
    this.loadImages(this.IMAGES_DEAD);
    this.loadImages(this.IMAGES_HURT);
    this.loadImages(this.IMAGES_LONG_IDLE); // Long Idle Bilder laden
    this.applyGravity();
    this.atEndboss = false;
    this.animate();
    this.lastGlobalHit = 0;
    this.throwSound = new Audio('audio/throw-sound-1.mp3');
    this.throwSound.volume = 0.4; // etwas leiser
    this.showIdle = false;
    this.lastMoveTime = Date.now();
    this.idleAnimationStarted = false;
    this.longIdleActive = false; // Neue Eigenschaft für Long Idle
    this.longIdleInterval = null; // Für die Long Idle Animation
  }

  pauseStartTime = 0;  // Wann die Pause begonnen hat
  totalPausedTime = 0; // Wie viel Zeit insgesamt pausiert war

  // Kollisionsbox Character
  get collisionBox() {
    return {
      x: this.x + 25, // Etwas von links verschieben
      y: this.y + 95, // Hitbox nach unten verschieben (Kopfbereich ausschließen)
      width: this.width - 60, // Breite reduzieren für schmalere Hitbox
      height: this.height - 110 // Höhe reduzieren (Kopf und Füße ausschließen)
    };
  }

  isAboveGround() {
    // Hier muss der "Boden" definiert werden
    // Wenn du unterschiedliche Bodenhöhen hast, musst du das hier anpassen
    const groundLevel = 155; // oder 156 - je nachdem wo dein Boden ist

    return this.y < groundLevel;
  }

  drawFrame(ctx) {
    if (this instanceof Character) {
      const box = this.collisionBox;
      ctx.beginPath();
      ctx.lineWidth = "1";
      ctx.strokeStyle = "transparent";
      // Relative Position zur Hitbox zeichnen
      ctx.rect(box.x - this.x, box.y - this.y, box.width, box.height);
      ctx.stroke();
    }
  }

  animate() {
    this.startMovementLoop();
    this.startAnimationLoop();
  }

  startMovementLoop() {
    setInterval(() => this.tickMovement(), 1000 / 60);
  }

  tickMovement() {
    if (this.shouldSkipMovementTick()) return;
    this.updateCamera();
    this.applyKnockback();
    if (this.freezeForBodyguard) return;
    this.processMovementInputs();
    this.checkEndbossTrigger();
    this.switchToIdleIfNeeded();
  }

  shouldSkipMovementTick() {
    if (this.isPaused) return true;
    if (!this.world) return true;
    return this.world.isPaused;
  }

  processMovementInputs() {
    const { minX, maxX } = this.getRunBounds();
    this.moveRightIfNeeded(maxX);
    this.moveLeftIfNeeded(minX);
    this.jumpIfNeeded();
    this.throwIfNeeded();
  }

  getRunBounds() {
    let minX = 0;
    let maxX = this.world.level.level_end_x;

    if (this.atEndboss && this.world.canvas) {
      const viewLeft = -this.world.camera_x;
      const viewRight = viewLeft + this.world.canvas.width;
      const margin = 10;
      minX = viewLeft + margin;
      maxX = viewRight - this.width - margin;
    }
    return { minX, maxX };
  }

  moveRightIfNeeded(maxX) {
    if (this.world.keyboard.RIGHT && this.x < maxX) {
      this.moveRight();
      this.otherDirection = false;
      this.handleMovement();
    }
  }

  moveLeftIfNeeded(minX) {
    if (this.world.keyboard.LEFT && this.x > minX) {
      this.moveLeft();
      this.otherDirection = true;
      this.handleMovement();
    }
  }

  jumpIfNeeded() {
    if (this.world.keyboard.SPACE && !this.isAboveGround()) {
      this.jump();
      this.handleMovement();
    }
  }

  throwIfNeeded() {
    if (this.world.keyboard.D && this.animationFinished) {
      this.throwAnimation();
      this.lastActionTime = Date.now();
      this.lastMoveTime = Date.now();
    }
  }

  updateCamera() {
    if (this.shouldStartPanBackNow()) this.startPanBackOnce();
    if (this.handleSoftPanning()) return;
    if (this.atEndboss) return this.lockEndbossCamera();
    this.followCharacterCamera();
  }

  shouldStartPanBackNow() {
    return (
      this.atEndboss &&
      this.world.hasBodyguardDied &&
      this.world.shouldStartCameraPanBack &&
      !this.world.isCameraPanning &&
      this.x >= 4000
    );
  }

  startPanBackOnce() {
    this.world.startEndbossCameraPanBack();
    this.world.shouldStartCameraPanBack = false;
  }

  handleSoftPanning() {
    if (!this.world.isCameraPanning) return false;
    if (typeof this.world.cameraTargetX !== 'number') return false;

    const target = this.world.cameraTargetX;
    const speed = this.world.cameraPanSpeed || 2;

    this.world.camera_x += this.world.camera_x < target ? speed : -speed;
    if (Math.abs(this.world.camera_x - target) < 1) this.finishSoftPanning(target);
    return true;
  }

  finishSoftPanning(target) {
    this.world.camera_x = target;
    this.world.isCameraPanning = false;
    this.world.endbossCameraX = target;
    this.world.stopCameraMoveSound?.();
  }

  lockEndbossCamera() {
    if (typeof this.world.endbossCameraX === 'number') {
      this.world.camera_x = this.world.endbossCameraX;
    } else {
      this.world.camera_x = -4100 + 100; // = -4000
    }
  }

  followCharacterCamera() {
    this.world.camera_x = -this.x + 100;
  }

  applyKnockback() {
    if (!this.knockbackActive) return;
    this.x += this.speedX;
    this.speedX *= 0.9;
    if (Math.abs(this.speedX) < 1) {
      this.knockbackActive = false;
      this.speedX = 0;
    }
  }

  checkEndbossTrigger() {
    if (this.x < 4100 || this.atEndboss) return;
    this.activateEndbossArea();
  }

  activateEndbossArea() {
    this.atEndboss = true;
    this.world?.countdown?.playEndBossMusic();

    if (typeof this.world?.countdown?.hideTemporarily === 'function') {
      this.world.countdown.hideTemporarily(3000);
    }

    this.freezeForBodyguard = true;
    this.triggerBodyguardJump();
  }

  triggerBodyguardJump() {
    if (!this.world?.bodyguard || this.world.bodyguard.hasJumped) return;
    this.world.bodyguard.jumpToEndboss();
    this.world.bodyguard.hasJumped = true;
  }

  switchToIdleIfNeeded() {
    const idleAllowed =
      Date.now() - this.lastActionTime > this.actionCooldown &&
      !this.isAboveGround() &&
      !this.isHurt() &&
      !this.isDead() &&
      this.currentAnimation !== 'idle';

    if (idleAllowed) this.currentAnimation = 'idle';
  }


  startAnimationLoop() {
    setInterval(() => this.tickAnimation(), 50);
  }

  tickAnimation() {
    if (this.isPaused) return;
    if (!this.world) return;
    if (this.isThrowing) return;

    if (this.freezeForBodyguard) return this.showFreezeFrame();
    this.updateStandingAnimation(Date.now() - this.lastMoveTime);
  }

  showFreezeFrame() {
    this.loadImage('img/2_character_pepe/3_jump/J-31.png');
  }

  updateStandingAnimation(effectiveIdleTime) {
    if (this.energy <= 0) return this.handleDeathAnim();
    if (this.isHurt()) return this.playHurtAnim();
    if (this.isAboveGround()) return this.playAirAnim();
    if (this.isWalking()) return this.playWalkAnim();
    this.playIdleOrLongIdle(effectiveIdleTime);
  }

  handleDeathAnim() {
    this.stopLongIdleAnimation();
    this.playDeathAnimation();
  }

  playHurtAnim() {
    this.stopLongIdleAnimation();
    this.playAnimation(this.IMAGES_HURT);
  }

  playAirAnim() {
    this.stopLongIdleAnimation();
    this.handleJumpAnimation();
  }

  isWalking() {
    return this.world.keyboard.RIGHT || this.world.keyboard.LEFT;
  }

  playWalkAnim() {
    this.stopLongIdleAnimation();
    this.playAnimation(this.IMAGES_WALKING);
  }

  playIdleOrLongIdle(effectiveIdleTime) {
    if (effectiveIdleTime > 12000) return this.startLongIdleIfNeeded();
    if (effectiveIdleTime > 10000) return this.startIdleIfNeeded();
    this.stopLongIdleAnimation();
    this.loadImage(this.IMAGES_IDLE[0]);
  }

  startLongIdleIfNeeded() {
    if (!this.longIdleActive) this.startLongIdleAnimation();
  }

  startIdleIfNeeded() {
    if (!this.idleAnimationStarted) this.playIdleAnimation();
  }

  // 🧩 Alles pausieren (Animation + Bewegung)
  pause() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.pauseStartTime = Date.now();
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;

    // Zeitausgleich, damit Idle-Timer korrekt bleibt
    if (this.pauseStartTime) {
      const pausedDuration = Date.now() - this.pauseStartTime;
      this.lastMoveTime += pausedDuration;
    }
  }

  handleJumpAnimation() {
    if (this.speedY > 0) {
      // Springen - zeige Bilder basierend auf Fortschritt
      const progress = Math.min(1, this.speedY / 1); // Angepasst für realistischere Progression
      const frameIndex = Math.floor(progress * (this.IMAGES_JUMPING.length - 1));
      this.loadImage(this.IMAGES_JUMPING[frameIndex]);
    } else if (this.speedY < 0) {
      // Fallen - zeige Bilder basierend auf Fallgeschwindigkeit
      const progress = Math.min(1, Math.abs(this.speedY) / 20);
      const frameIndex = Math.floor(progress * (this.IMAGES_FALLING.length - 1));
      this.loadImage(this.IMAGES_FALLING[frameIndex]);
    } else {
      // Höchster Punkt
      this.loadImage(this.IMAGES_JUMPING[this.IMAGES_JUMPING.length - 1]);
    }
  }

  handleMovement() {
    this.lastMoveTime = Date.now();
    this.idleAnimationStarted = false;
    this.stopLongIdleAnimation();
  }

  throwAnimation() {
    if (!this.canStartThrow()) return;
    if (!this.hasSalsa()) return this.handleNoSalsa();
    this.beginThrow();
    this.playThrowFrames();
  }

  canStartThrow() {
    return this.animationFinished && !this.isThrowing;
  }

  hasSalsa() {
    return this.world?.statusBarSalsa && this.world.statusBarSalsa.salsaCount > 0;
  }

  handleNoSalsa() {
    const failSound = new Audio('audio/Fail.mp3');
    failSound.volume = 0.4;
    failSound.playbackRate = 2;
    failSound.play().catch(() => { });
    this.world?.statusBarSalsa?.blinkOnFail();
  }

  beginThrow() {
    this.animationFinished = false;
    this.isThrowing = true;
    this.lastActionTime = Date.now();
    this.throwSound.currentTime = 0;
    this.throwSound.play().catch(() => { });
  }

  playThrowFrames() {
    const throwImages = this.IMAGES_THROW;
    let current = 0;

    const interval = setInterval(() => {
      this.loadImage(throwImages[current++]);
      if (current >= throwImages.length) this.finishThrowFrames(interval);
    }, 50);
  }

  finishThrowFrames(intervalId) {
    clearInterval(intervalId);
    setTimeout(() => this.spawnSalsaAndFinish(), 50);
  }

  spawnSalsaAndFinish() {
    if (!this.world?.statusBarSalsa) return;

    this.world.statusBarSalsa.salsaCount--;
    this.spawnSalsaThrow();
    this.finishThrow();
  }

  spawnSalsaThrow() {
    const offsetX = this.otherDirection ? -50 : 100;
    const salsa = new SalsaThrow(
      this.x + offsetX,
      this.y + this.height / 2 + 20,
      this.otherDirection
    );
    this.world?.throwableObjects?.push(salsa);
  }

  finishThrow() {
    this.loadImage(this.IMAGES_IDLE[0]);
    this.animationFinished = true;
    this.isThrowing = false;
  }

  startLongIdleAnimation() {
    this.longIdleActive = true;
    this.idleAnimationStarted = false;
    let currentImageIndex = 0;

    this.longIdleInterval = setInterval(() => {
      // ➡️ Wenn das Spiel oder der Charakter pausiert ist, einfach warten
      if (this.isPaused || (this.world && this.world.isPaused)) return;

      // Prüfen ob Bewegung stattfindet
      if (Date.now() - this.lastMoveTime < 12000) {
        this.stopLongIdleAnimation();
        return;
      }

      // Long Idle Animation in Schleife abspielen
      this.loadImage(this.IMAGES_LONG_IDLE[currentImageIndex]);
      currentImageIndex = (currentImageIndex + 1) % this.IMAGES_LONG_IDLE.length;
    }, 200);
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
    this.idleFrame = 0;

    const id = setInterval(() => {
      if (!this.isInIdleWindow()) return this.stopIdleInterval(id);
      this.showNextIdleFrame();
    }, 200);
  }

  isInIdleWindow() {
    const dt = Date.now() - this.lastMoveTime;
    return dt >= 10000 && dt <= 12000;
  }

  stopIdleInterval(id) {
    clearInterval(id);
    this.idleAnimationStarted = false;
  }

  showNextIdleFrame() {
    const i = Math.min(this.idleFrame, this.IMAGES_IDLE.length - 1);
    this.loadImage(this.IMAGES_IDLE[i]);
    this.idleFrame++;
  }


  // 🧩 NEU: Todesanimation (Pepe rutscht aus dem Bild)
  playDeathAnimation() {
    if (this.isDying) return;
    this.startDeathState();
    this.scheduleDeathSounds(500);
    this.startDeathFallAnim();
  }

  startDeathState() {
    this.isDying = true;
    this.world?.pauseAllMovements?.();
    this.animationFinished = false;

    this.deathFrameIndex = 0;
    this.deathFallVelocity = 0;
  }

  scheduleDeathSounds(delayMs) {
    setTimeout(() => this.playDeathSounds(), delayMs);
  }

  playDeathSounds() {
    this.deathSound = new Audio('audio/dead-sound.mp3');
    this.deathSound.volume = 0.6;
    this.deathSound.play().catch(() => { });

    this.failSound = new Audio('audio/Fail-2.mp3');
    this.failSound.volume = 0.2;
    this.failSound.playbackRate = 0.7;
    this.failSound.play().catch(() => { });
  }

  startDeathFallAnim() {
    this.deathInterval = setInterval(() => this.stepDeathFallAnim(), 250);
  }

  stepDeathFallAnim() {
    this.stepDeathFrames();
    this.stepDeathFallPhysics();
    if (this.shouldFinishDeathAnim()) this.finishDeathAnim();
  }

  stepDeathFrames() {
    if (this.deathFrameIndex >= this.IMAGES_DEAD.length) return;
    this.loadImage(this.IMAGES_DEAD[this.deathFrameIndex++]);
  }

  stepDeathFallPhysics() {
    this.deathFallVelocity += 0.5;
    this.y += this.deathFallVelocity;
  }

  shouldFinishDeathAnim() {
    return this.y > 480 || this.deathFrameIndex >= this.IMAGES_DEAD.length;
  }

  finishDeathAnim() {
    clearInterval(this.deathInterval);
    this.animationFinished = true;
    this.loadImage(this.IMAGES_DEAD[this.IMAGES_DEAD.length - 1]);
  }

  // ★★★ NEUE METHODE: Pepe soll fallen, wenn er tot ist ★★★
  startFallingWhenDead() {
    if (this.fallingInterval) return;  // Verhindert, dass mehrere Intervalle gleichzeitig laufen

    this.fallingInterval = setInterval(() => {   // Intervall starten (30 Mal pro Sekunde)
      if (this.isDead || this.isDying) {   // Wenn Pepe tot oder im Sterben ist …
        this.y += 3; // Geschwindigkeit des Fallens

        if (this.y > 600) {    // Sobald Pepe komplett außerhalb des Bildschirms ist …
          clearInterval(this.fallingInterval); // Intervall stoppen
          this.removeFromWorld(); // Aus der Spielwelt entfernen
        }
      }
    }, 1000 / 30); // 30 FPS (Bilder pro Sekunde)
  }

  // ★★★ NEUE METHODE: Aus der Spielwelt entfernen ★★★
  removeFromWorld() {
    if (this.world) {
      // Index des Gegners im Array finden
      const index = this.world.level.enemies.indexOf(this);

      // Wenn Pepe existiert, entferne ihn aus dem Array
      if (index > -1) {
        this.world.level.enemies.splice(index, 1);
      }
    }
  }

  applyGravity() {
    setInterval(() => {
      if (this.shouldSkipGravity()) return;
      this.applyGravityStep();
      this.snapToGroundIfNeeded();
    }, 1000 / 25);
  }

  shouldSkipGravity() {
    if (this.isPaused || this.world?.isPaused) return true;
    return this.energy <= 0 || this.isDying;
  }

  applyGravityStep() {
    if (!this.isAboveGround() && this.speedY <= 0) return;
    this.y -= this.speedY;
    this.speedY -= this.acceleration;
  }

  snapToGroundIfNeeded() {
    if (this.isAboveGround() || this.speedY > 0) return;
    this.y = 155;
    this.speedY = 0;
  }
}
