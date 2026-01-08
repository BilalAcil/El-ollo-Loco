class World {
  character = new Character();
  level = level1;
  canvas;
  ctx;
  keyboard;
  countdown = new Countdown();
  camera_x = 0;
  statusBar = new StatusBar();
  statusBarSalsa = new StatusBarSalsa();
  statusBarCoin = new StatusBarCoin();
  bodyguardStatus = null;
  maracas = null;
  corncob = new Corncob();
  chickenNest = new ChickenNest();
  bodyguard = new Bodyguard();
  coins = [];
  salsas = [];
  throwableObjects = [];

  constructor(canvas, keyboard) {
    this.initContext(canvas);
    this.initInput(keyboard);
    this.initFlags();
    this.initCamera();
    this.initSounds();
    this.initWorldRefs();
    this.initPauseState();
    this.showPlaySymbol();
  }

  initContext(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  initInput(keyboard) {
    this.keyboard = keyboard;
    this.allowPauseOverlay = false;
  }

  initFlags() {
    this.lastEnemyHit = 0;
    this.lastEndbossHit = 0;
    this.isMaracasSequence = false;
    this.hasBodyguardDied = false;
    this.shouldStartCameraPanBack = false;
  }

  initCamera() {
    this.isCameraPanning = false;
    this.cameraTargetX = null;
    this.cameraPanSpeed = 2;
    this.endbossCameraX = undefined;
    this.cameraMoveSound = this.createSound('audio/push-stone.mp3', 0.4, true);
  }

  initSounds() {
    this.healSound = this.createSound('audio/heart-1.mp3', 0.5);
    this.endbossHurtSound = this.createSound('audio/endboss-hurt.mp3', 0.6);
  }

  createSound(src, volume = 1, loop = false) {
    const sound = new Audio(src);
    sound.volume = volume;
    sound.loop = loop;
    sound.load();
    return sound;
  }

  initWorldRefs() {
    this.draw();
    this.setWorld();
    this.bodyguard.world = this;
    this.countdown.world = this;
    this.checkCollisions();
  }

  initPauseState() {
    this.isPaused = true;
    this.pauseAllMovements();
    this.character?.pause?.();
    this.endboss?.pause?.();
    this.pauseCountdownSystem();
  }

  pauseCountdownSystem() {
    if (!this.countdown) return;
    this.countdown.pauseAllMusic();
    this.countdown.pauseCountdown();
  }

  setWorld() {
    this.linkWorldRefs();
    this.generateCollectibles();
    this.rebuildEnemyList();
    this.setupEndboss();
    this.setupEndbossBar();
    this.applyBodyguardGate();
  }

  linkWorldRefs() {
    this.character.world = this;
  }

  generateCollectibles() {
    this.coins = this.generateCoins();
    this.salsas = this.generateSalsas();
  }

  rebuildEnemyList() {
    const chickens = this.generateChickens();
    const keep = this.level.enemies.filter(e => e instanceof Endboss || e instanceof EndBossStatusBar);
    this.level.enemies = [...chickens, this.bodyguard, ...keep];
    this.endboss = this.level.enemies.find(e => e instanceof Endboss);
    this.endbossBar = this.level.enemies.find(e => e instanceof EndBossStatusBar);
  }

  setupEndboss() {
    if (!this.endboss) return;
    this.endboss.world = this;
    this.endboss.energy = 100;
    this.endboss.isDead = false;
  }

  setupEndbossBar() {
    if (!this.endbossBar) return;
    this.endbossBar.world = this;
    this.endbossBar.setPercentage(100);
  }

  applyBodyguardGate() {
    if (this.hasBodyguardDied) return;
    if (this.endboss) this.endboss.visible = false;
    if (this.endbossBar) this.endbossBar.visible = false;
    if (this.chickenNest) this.chickenNest.visible = false;
  }

  generateChickens() {
    return [
      ...this.createEnemies(8, Chicken),
      ...this.createEnemies(4, ChickenSmall)
    ];
  }

  createEnemies(count, Ctor) {
    return Array.from({ length: count }, () => new Ctor());
  }

  checkCollisions() {
    this.collisionInterval = setInterval(() => {
      this.handleCollisionTick();
    }, 50);
  }

  handleCollisionTick() {
    if (this.isPaused) return;
    const state = this.createCollisionState();
    this.scanEnemyCollisions(state);
    this.handleNormalEnemyStomps(state);
    this.handleEndbossContactDamage(state);
    this.handleNormalEnemyContactDamage(state);
    this.handleThrowableHits();
    this.handleCorncobPickup();
    this.handleCoinPickups();
    this.handleSalsaPickups();
    this.handleMaracasPickup();
  }

  createCollisionState() {
    return {
      collidedEnemies: [],
      hitEndbossFromAbove: false,
      jumpedOnEnemy: false
    };
  }

  scanEnemyCollisions(state) {
    this.level.enemies.forEach((enemy, index) => {
      if (enemy instanceof Endboss) return this.scanEndboss(enemy, state);
      if (enemy instanceof Bodyguard) return this.scanBodyguard(enemy);
      this.collectNormalEnemy(enemy, index, state);
    });
  }

  scanEndboss(enemy, state) {
    if (!this.character.isColliding(enemy)) return;
    if (!this.isStompFromAbove(enemy)) return;
    state.hitEndbossFromAbove = true;
    this.applyEndbossStomp(enemy);
  }

  isStompFromAbove(enemy) {
    const cBottom = this.character.y + this.character.height;
    const eTop = enemy.y;
    const eMid = enemy.y + enemy.height / 2;
    return this.character.isAboveGround() &&
      this.character.speedY < 0 &&
      cBottom < eMid &&
      cBottom > eTop - 15;
  }

  applyEndbossStomp(enemy) {
    enemy.activate();
    enemy.energy = (enemy.energy || 100) - 20;
    this.lastEndbossBounce = Date.now();
    this.endbossBar?.setPercentage(enemy.energy);
    this.knockbackAfterEndbossStomp();
    this.checkEndbossDeath(enemy);
  }

  knockbackAfterEndbossStomp() {
    this.character.speedY = 20;
    this.character.speedX = -15;
    this.character.knockbackActive = true;
  }

  checkEndbossDeath(enemy) {
    if (enemy.energy > 0 || enemy.isDead) return;
    enemy.isDead = true;
    enemy.onDeath?.();
    enemy.startFallingWhenDead();
  }

  scanBodyguard(enemy) {
    if (!this.character.isColliding(enemy) || enemy.isDead) return;
    if (this.isStompFromAbove(enemy)) return this.applyBodyguardStomp(enemy);
    this.applyBodyguardSideHit();
  }

  applyBodyguardStomp(enemy) {
    enemy.hit();
    this.applyBodyguardBounce();
    setTimeout(() => this.clampCharacterToViewport(), 20);
  }

  applyBodyguardBounce() {
    const dir = Math.random() < 0.5 ? -1 : 1;
    this.character.speedY = 18;
    this.character.speedX = 10 * dir;
    this.character.knockbackActive = true;
  }

  clampCharacterToViewport() {
    const viewLeft = -this.camera_x;
    const viewRight = -this.camera_x + this.canvas.width;
    const margin = 30;
    const minX = viewLeft + margin;
    const maxX = viewRight - this.character.width - margin;
    if (this.character.x < minX) this.character.x = minX;
    if (this.character.x > maxX) this.character.x = maxX;
  }

  applyBodyguardSideHit() {
    const now = Date.now();
    if (this.lastBodyguardHit && now - this.lastBodyguardHit <= 1000) return;
    this.lastBodyguardHit = now;
    this.damageCharacterOrDie();
  }

  collectNormalEnemy(enemy, index, state) {
    if (!this.isActualEnemy(enemy)) return;
    if (!this.character.isColliding(enemy) || enemy.isDead) return;
    state.collidedEnemies.push({ enemy, index });
  }

  handleNormalEnemyStomps(state) {
    state.collidedEnemies.forEach(({ enemy, index }) => {
      if (!this.isJumpedOnEnemy(enemy) || enemy.isDead) return;
      this.killEnemy(enemy);
      this.character.speedY = 15;
      this.lastEnemyBounce = Date.now();
      state.jumpedOnEnemy = true;
    });
    if (state.jumpedOnEnemy) this.character.speedY = 15;
  }

  isJumpedOnEnemy(enemy) {
    const charBox = this.getBox(this.character);
    const enemyBox = this.getBox(enemy);
    const falling = this.character.speedY < 0;
    const charBottom = charBox.y + charBox.height;
    const charMid = charBox.y + charBox.height / 2;
    const enemyTop = enemyBox.y;
    const enemyMid = enemyBox.y + enemyBox.height / 2;
    const verticalDiff = charBottom - enemyTop;
    return falling && verticalDiff > -30 && verticalDiff < 30 && charMid < enemyMid;
  }

  getBox(obj) {
    return obj.collisionBox || { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
  }

  handleEndbossContactDamage(state) {
    const recentlyBounced = this.lastEndbossBounce && Date.now() - this.lastEndbossBounce < 400;
    if (state.hitEndbossFromAbove || recentlyBounced) return;
    this.level.enemies.forEach(enemy => this.tryEndbossContactHit(enemy));
  }

  tryEndbossContactHit(enemy) {
    if (!(enemy instanceof Endboss)) return;
    if (!this.character.isColliding(enemy) || enemy.isDead) return;
    const now = Date.now();
    if (this.lastEndbossHit && now - this.lastEndbossHit <= 1000) return;
    this.lastEndbossHit = now;
    this.cancelHealing();
    this.damageCharacterOrDie();
  }

  handleNormalEnemyContactDamage(state) {
    const recentlyBounced = this.lastEnemyBounce && Date.now() - this.lastEnemyBounce < 200;
    if (state.jumpedOnEnemy || recentlyBounced) return;
    state.collidedEnemies.forEach(({ enemy }) => this.tryNormalEnemyContactHit(enemy));
  }

  tryNormalEnemyContactHit(enemy) {
    if (enemy.isDead) return;
    const now = Date.now();
    if (this.isGloballyImmune(now)) return;
    if (this.lastEnemyHit && now - this.lastEnemyHit <= 800) return;
    this.lastEnemyHit = now;
    this.character.lastGlobalHit = now;
    this.cancelHealing();
    this.damageCharacterOrDie();
  }

  isGloballyImmune(now) {
    return this.character.lastGlobalHit && now - this.character.lastGlobalHit < 1300;
  }

  cancelHealing() {
    this.statusBar?.stopBlink?.();
    if (!this.healSound) return;
    this.healSound.pause();
    this.healSound.currentTime = 0;
  }

  damageCharacterOrDie() {
    this.character.hit();
    this.statusBar.setPercentage(this.character.energy);
    if (this.character.energy > 0) return;
    this.character.isDead = true;
    this.statusBar.setPercentage(0);
    this.character.playDeathAnimation();
    this.character.startFallingWhenDead();
    this.endGame(false);
  }

  handleThrowableHits() {
    this.throwableObjects.forEach((salsa, index) => {
      this.level.enemies.forEach(enemy => this.trySalsaHit(salsa, index, enemy));
    });
  }

  trySalsaHit(salsa, index, enemy) {
    if (enemy.isDead || salsa.hasHit) return;
    if (!salsa.isColliding(enemy)) return;
    this.markSalsaHit(salsa);
    this.playHitSound();
    this.removeSalsaAfterSplash(salsa, index);
    this.applySalsaDamage(enemy);
  }

  markSalsaHit(salsa) {
    salsa.hasHit = true;
    salsa.stopSound();
  }

  playHitSound() {
    const hitSound = new Audio('audio/hit-sound.mp3');
    hitSound.volume = 0.5;
    hitSound.play().catch(e => console.warn('Hit sound error:', e));
  }

  removeSalsaAfterSplash(salsa, index) {
    salsa.splashAnimation(() => {
      this.throwableObjects.splice(index, 1);
    });
  }

  applySalsaDamage(enemy) {
    if (enemy instanceof Bodyguard) return enemy.hit();
    if (enemy instanceof Endboss) return this.damageEndbossBySalsa(enemy);
    if (enemy instanceof Chicken || enemy instanceof ChickenSmall) this.killChickenBySalsa(enemy);
  }

  damageEndbossBySalsa(enemy) {
    enemy.activate();
    enemy.energy = (enemy.energy || 100) - 20;
    this.endbossBar?.setPercentage(enemy.energy);
    if (enemy.energy > 0 || enemy.isDead) return;
    enemy.isDead = true;
    enemy.onDeath?.();
    enemy.startFallingWhenDead();
  }

  killChickenBySalsa(enemy) {
    if (!enemy || enemy.isDead) return;
    this.markEnemyDead(enemy);
    this.setSalsaDeathImage(enemy);
    this.setAlpha(enemy, 1);
    this.blinkEnemySoft(enemy, 1000);
    this.removeEnemySoon(enemy, 1000);
  }

  setSalsaDeathImage(enemy) {
    const path = (enemy instanceof Chicken)
      ? 'img/3_enemies_chicken/chicken_normal/2_dead/salsa-dead/dead-1.png'
      : 'img/3_enemies_chicken/chicken_small/salsa-dead/dead.png';
    enemy.loadImage(path);
  }

  setAlpha(enemy, value) {
    enemy.alpha = value;
  }

  blinkEnemySoft(enemy, ms) {
    const steps = 20;
    const ticks = Math.max(1, Math.floor(ms / 50));
    let phase = 0;
    const id = setInterval(() => {
      this.applySoftBlink(enemy, phase, steps);
      if (++phase >= ticks) clearInterval(id);
    }, 50);
  }

  applySoftBlink(enemy, phase, steps) {
    const t = (phase % steps) / steps;
    this.setAlpha(enemy, 0.3 + Math.abs(Math.sin(t * Math.PI)) * 0.7);
  }

  removeEnemyAfterDelay(enemy, blinkInterval, ms) {
    setTimeout(() => {
      clearInterval(blinkInterval);
      const idx = this.level.enemies.indexOf(enemy);
      if (idx > -1) this.level.enemies.splice(idx, 1);
    }, ms);
  }

  handleCorncobPickup() {
    if (!this.corncob) return;
    if (!this.character.isColliding(this.corncob)) return;
    this.corncob = null;
    this.playHealPickupSound();
    this.character.energy = 100;
    this.statusBar.setPercentage(this.character.energy);
    this.statusBar.blinkFullHealth();
  }

  playHealPickupSound() {
    this.healSound.currentTime = 0;
    this.healSound.playbackRate = 1;
    this.healSound.volume = 0.6;
    this.healSound.play().catch(e => console.warn(e));
  }

  handleCoinPickups() {
    this.coins.forEach((coin, index) => {
      if (!this.character.isColliding(coin)) return;
      this.coins.splice(index, 1);
      this.statusBarCoin.addCoin();
      this.playCoinSound();
    });
  }

  playCoinSound() {
    const s = new Audio('audio/coin.mp3');
    s.volume = 0.3;
    s.playbackRate = 1.2;
    s.play().catch(e => console.warn(e));
  }

  handleSalsaPickups() {
    this.salsas.forEach((salsa, index) => {
      if (!this.character.isColliding(salsa)) return;
      this.salsas.splice(index, 1);
      this.statusBarSalsa.addSalsa();
      this.playSalsaPickupSound();
    });
  }

  playSalsaPickupSound() {
    const s = new Audio('audio/salsa.mp3');
    s.volume = 0.4;
    s.playbackRate = 2.0;
    s.play().catch(e => console.warn(e));
  }

  handleMaracasPickup() {
    if (!this.maracas) return;
    if (!this.character.isColliding(this.maracas)) return;
    this.startMaracasSequence();
  }

  startMaracasSequence() {
    this.isMaracasSequence = true;
    this.maracas = null;
    this.countdown?.stopCountdown?.();
    this.playMaracasSound();
    this.freezeWorldForMaracas();
    this.resetKeyboardInputs();
    this.runMaracasChoreo();
  }

  playMaracasSound() {
    const s = new Audio('audio/maracas.mp3');
    s.volume = 0.6;
    s.play().catch(e => console.warn('Maracas sound error:', e));
  }

  freezeWorldForMaracas() {
    this.level.enemies.forEach(e => this.clearEnemyIntervals(e));
    this.level.clouds.forEach(c => clearInterval(c.moveInterval));
  }

  clearEnemyIntervals(e) {
    clearInterval(e.moveInterval);
    clearInterval(e.animationInterval);
  }

  resetKeyboardInputs() {
    this.keyboard.RIGHT = false;
    this.keyboard.LEFT = false;
    this.keyboard.SPACE = false;
    this.keyboard.D = false;
  }

  runMaracasChoreo() {
    const pepe = this.character;
    this.maracasJump(pepe, 'right');
    setTimeout(() => this.maracasJump(pepe, 'left'), 600);
    setTimeout(() => this.maracasJump(pepe, 'right'), 1200);
    setTimeout(() => this.startMaracasWalkOff(pepe), 1800);
  }

  maracasJump(pepe, dir) {
    pepe.otherDirection = dir === 'left';
    pepe.speedY = 25;
    pepe.applyGravity();
    this.playJumpSound();
  }

  playJumpSound() {
    const s = new Audio('audio/jump.mp3');
    s.volume = 0.5;
    s.play().catch(() => { });
  }

  startMaracasWalkOff(pepe) {
    pepe.otherDirection = false;
    const walkInterval = setInterval(() => {
      pepe.moveRight();
      pepe.playAnimation(pepe.IMAGES_WALKING);
    }, 1000 / 60);
    setTimeout(() => this.finishMaracasEnding(walkInterval), 500);
  }

  finishMaracasEnding(walkInterval) {
    clearInterval(walkInterval);
    this.endGame(true);
  }

  killEnemy(enemy) {
    if (!enemy || enemy.isDead) return;
    this.markEnemyDead(enemy);
    this.setDefaultDeathImage(enemy);
    this.removeEnemySoon(enemy, 500);
  }

  markEnemyDead(enemy) {
    enemy.isDead = true;
  }

  setDefaultDeathImage(enemy) {
    if (enemy instanceof Chicken || enemy instanceof ChickenSmall) {
      enemy.loadImage(enemy.IMAGE_DEAD);
    }
  }

  removeEnemySoon(enemy, ms) {
    setTimeout(() => this.removeEnemy(enemy), ms);
  }

  removeEnemy(enemy) {
    const idx = this.level.enemies.indexOf(enemy);
    if (idx > -1) this.level.enemies.splice(idx, 1);
  }

  /**
   * Spielt den Heilungssound beim Einsammeln eines Maiskolbens ab.
   */
  playHealSound() {
    const healSound = new Audio('audio/heart-1.mp3');
    healSound.volume = 0.5; // Lautstärke (0.0–1.0)
    healSound.playbackRate = 1.2;    // Geschwindigkeit: 1.0 = normal, >1 = schneller, <1 = langsamer
    healSound.play().catch((e) => {
      console.warn('Heilungssound konnte nicht abgespielt werden:', e);
    });
  }

  drawCountdown() {
    this.ctx.font = "30px Arial";
    this.ctx.fillStyle = "white";
  }

  draw() {
    this.clearCanvas();
    this.drawCameraLayer();
    this.drawOverlayUI();
    this.scheduleNextFrame();
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawCameraLayer() {
    this.withCamera(() => {
      this.drawBackgroundAndClouds();
      this.drawCollectibles();
      this.drawWorldObjects();
      this.drawActorsAndEnemies();
      this.drawThrowableObjects();
    });
  }

  withCamera(fn) {
    this.ctx.save();
    this.ctx.translate(this.camera_x, 0);
    fn();
    this.ctx.restore();
  }

  drawBackgroundAndClouds() {
    this.addObjectsToMap(this.level.backgroundObjects);
    this.addObjectsToMap(this.level.clouds);
  }

  drawCollectibles() {
    this.addObjectsToMap(this.coins);
    this.addObjectsToMap(this.salsas);
  }

  drawWorldObjects() {
    this.addToMap(this.bodyguard);
    this.addToMap(this.chickenNest);
    this.drawOptionalWorldObjects();
  }

  drawOptionalWorldObjects() {
    if (this.maracas) this.addToMap(this.maracas);
    if (this.bodyguardStatus) this.addToMap(this.bodyguardStatus);
    if (this.corncob) this.addToMap(this.corncob);
  }

  drawActorsAndEnemies() {
    this.addToMap(this.character);
    this.addObjectsToMap(this.level.enemies);
  }

  drawThrowableObjects() {
    this.addObjectsToMap(this.throwableObjects);
  }

  drawOverlayUI() {
    this.addToMap(this.statusBar);
    this.addToMap(this.statusBarSalsa);
    this.addToMap(this.statusBarCoin);
    this.addToMap(this.countdown);
    this.drawCountdown();
  }

  scheduleNextFrame() {
    requestAnimationFrame(() => this.draw());
  }

  /**
 * Stoppt alle Bewegungen und Animationen in der Welt
 * (z. B. wenn Pepe stirbt).
 */
  pauseAllMovements() {
    this.stopCloudIntervals();
    this.stopAllEnemyIntervals();
    this.pauseBodyguard();
    this.stopCollisionChecks();
    this.resetKeyboardInputsAll();
    this.setPaused(true);
  }

  resumeAllMovements() {
    this.setPaused(false);
    this.startCloudAnimations();
    this.startEnemyAnimations();
    this.resumeBodyguard();
    this.restartCollisionChecks();
  }

  setPaused(value) {
    this.isPaused = value;
  }

  stopCloudIntervals() {
    this.level.clouds.forEach(c => clearInterval(c.moveInterval));
  }

  startCloudAnimations() {
    this.level.clouds.forEach(c => c.animate?.());
  }

  stopAllEnemyIntervals() {
    this.level.enemies.forEach(e => this.stopEnemyIntervals(e));
  }

  stopEnemyIntervals(e) {
    if (e.moveInterval) clearInterval(e.moveInterval);
    if (e.animationInterval) clearInterval(e.animationInterval);
    if (e.fallInterval) clearInterval(e.fallInterval);
  }

  startEnemyAnimations() {
    this.level.enemies.forEach(e => e.animate?.());
  }

  pauseBodyguard() {
    this.bodyguard?.pause?.();
  }

  resumeBodyguard() {
    this.bodyguard?.resume?.();
  }

  stopCollisionChecks() {
    clearInterval(this.collisionInterval);
  }

  restartCollisionChecks() {
    this.checkCollisions();
  }

  resetKeyboardInputsAll() {
    Object.keys(this.keyboard).forEach(k => (this.keyboard[k] = false));
  }

  // 🎥 Weiches Kamera-Panning im Endbossbereich (4000–4600 → 3850–4450)
  startEndbossCameraPan() {
    // Wenn schon gepannt wird oder schon auf der Zielposition → nichts tun
    if (this.isCameraPanning || this.endbossCameraX === -3770) return;

    // Zielkamera-Wert:
    // Aktuell: camera_x = -4000  → sichtbarer Bereich: 4000–4600
    // Ziel:    camera_x = -3850  → sichtbarer Bereich: 3770–4370
    this.cameraTargetX = -3770;
    this.cameraPanSpeed = 2;      // kannst du anpassen (1 = sehr langsam, 3 = schneller)
    this.isCameraPanning = true;

    // 🔊 Sound starten
    this.playCameraMoveSound();
  }

  playCameraMoveSound() {
    if (!this.cameraMoveSound) return;
    try {
      this.cameraMoveSound.currentTime = 0;
      this.cameraMoveSound.play();
    } catch (e) {
      console.warn('Kamera-Sound konnte nicht abgespielt werden:', e);
    }
  }

  stopCameraMoveSound() {
    if (!this.cameraMoveSound) return;
    try {
      this.cameraMoveSound.pause();
      this.cameraMoveSound.currentTime = 0;
    } catch (e) {
      console.warn('Kamera-Sound konnte nicht gestoppt werden:', e);
    }
  }

  // 🎥 Kamera wieder in ursprüngliche Endboss-Position (4000–4600) fahren
  startEndbossCameraPanBack() {
    if (this.isCameraPanning) return; // nicht doppelt
    // ursprüngliche Endboss-Kameraposition:
    // camera_x = -4100 + 100 = -4000
    this.cameraTargetX = -4100 + 100;  // = -4000
    this.cameraPanSpeed = 2;           // ggf. anpassen (1 langsamer, 3 schneller)
    this.isCameraPanning = true;

    // 🔊 Sound starten
    this.playCameraMoveSound();
  }

  // Wird aufgerufen, wenn der Bodyguard stirbt
  onBodyguardDeath() {
    if (this.hasBodyguardDied) return;   // nur einmal reagieren
    this.hasBodyguardDied = true;

    // 🎭 Endboss, HP-Bar & Nest sichtbar machen
    if (this.endboss) this.endboss.visible = true;
    if (this.endbossBar) this.endbossBar.visible = true;
    if (this.chickenNest) this.chickenNest.visible = true;

    // Kamera später zurückfahren (deine bestehende Logik)
    this.shouldStartCameraPanBack = true;
  }

  /**
   * Stoppt das Spiel komplett (z. B. bei Game Over).
   */
  stop() {
    this.pauseAllMovements();
  }

  addObjectsToMap(objects) {
    objects.forEach(o => {
      this.addToMap(o);
    });
  }

  addToMap(mo) {
    if (!this.shouldRender(mo)) return;

    this.ctx.save();
    this.applyAlpha(mo);
    this.applyObjectTransform(mo);
    this.renderObject(mo);
    this.ctx.restore();
  }

  shouldRender(mo) {
    return !!mo && mo.visible !== false;
  }

  applyAlpha(mo) {
    this.ctx.globalAlpha = mo.alpha ?? 1.0;
  }

  applyObjectTransform(mo) {
    const rot = this.getRotationRadians(mo);
    this.translateToCenter(mo);
    if (mo.otherDirection) this.flipX();
    if (rot) this.ctx.rotate(rot);
    this.translateBack(mo);
  }

  getRotationRadians(mo) {
    return mo.rotation ? (mo.rotation * Math.PI) / 180 : 0;
  }

  translateToCenter(mo) {
    this.ctx.translate(mo.x + mo.width / 2, mo.y + mo.height / 2);
  }

  translateBack(mo) {
    this.ctx.translate(-mo.width / 2, -mo.height / 2);
  }

  flipX() {
    this.ctx.scale(-1, 1);
  }

  renderObject(mo) {
    mo.draw(this.ctx);
    mo.drawFrame(this.ctx);
  }

  generateCoins() {
    const coins = [];
    while (coins.length < 10) {
      this.addCoinGroup(coins, 10);
    }
    return coins;
  }

  addCoinGroup(coins, limit) {
    const baseX = this.randomCoinBaseX();
    const groupSize = this.randomCoinGroupSize();
    for (let i = 0; i < groupSize && coins.length < limit; i++) {
      coins.push(this.createCoin(baseX, i));
    }
  }

  randomCoinBaseX() {
    return 300 + Math.random() * 4000;
  }

  randomCoinGroupSize() {
    const isGroup = Math.random() < 0.4;
    return isGroup ? 2 + Math.floor(Math.random() * 2) : 1;
  }

  createCoin(baseX, index) {
    const x = baseX + index * 50;
    const y = this.randomCoinY();
    return new Coin(x, y);
  }

  randomCoinY() {
    return 300 + Math.random() * 50;
  }

  generateSalsas() {
    const salsas = [];

    for (let i = 0; i < 5; i++) {
      let salsaX = 500 + Math.random() * 3500; // zufällige Position im Level
      let salsaY = 370 + Math.random() * 20;   // leicht variierende Höhe
      salsas.push(new Salsa(salsaX, salsaY));
    }

    return salsas;
  }

  /**
 * Prüft, ob es sich um einen echten Gegner handelt (keine StatusBars etc.)
 * @param {MovableObject} enemy 
 * @returns {boolean}
 */
  isActualEnemy(enemy) {
    return (enemy instanceof Chicken ||
      enemy instanceof ChickenSmall ||
      enemy instanceof Endboss) &&
      !(enemy instanceof EndBossStatusBar);
  }

  // 🧩 SPIEL PAUSIEREN
  pauseGame(showOverlay = true) {
    if (this.shouldBlockPause()) return;
    if (this.isPaused) return;

    this.isPaused = true;
    this.pauseAllMovements();
    this.pauseActors();
    this.pauseCountdownSystem();

    if (this.shouldShowPauseOverlay(showOverlay)) {
      this.showPauseThenPlaySymbol();
    }
  }

  resumeGame() {
    if (!this.isPaused) return;
    this.isPaused = false;

    this.runFirstStartLandingAnimation();
    this.resumeAllMovements();
    this.resumeActors();
    this.resumeCountdownSystem();
    this.hidePlaySymbol();
  }

  shouldBlockPause() {
    return (
      (this.bodyguard && this.bodyguard.isJumping) ||
      (this.character && this.character.freezeForBodyguard) ||
      (this.endboss && this.endboss.isDead) ||
      this.isMaracasSequence
    );
  }

  pauseActors() {
    this.character?.pause?.();
    this.endboss?.pause?.();
    this.bodyguard?.pause?.();
  }

  resumeActors() {
    this.character?.resume?.();
    this.endboss?.resume?.();
    this.bodyguard?.resume?.();
  }

  shouldShowPauseOverlay(showOverlay) {
    return showOverlay && this.allowPauseOverlay;
  }

  resumeCountdownSystem() {
    if (!this.countdown) return;
    if (!this.countdown.isStarted) this.countdown.startCountdown();
    this.countdown.resumeAllMusic();
    this.countdown.resumeCountdown();
  }

  runFirstStartLandingAnimation() {
    if (this.hasStartedOnce) return;
    this.hasStartedOnce = true;
    if (!this.character) return;

    this.setStartFallFrame();
    this.waitForLandingThenIdle();
  }

  setStartFallFrame() {
    this.character.loadImage('img/2_character_pepe/3_jump/J-37.png');
  }

  waitForLandingThenIdle() {
    const check = setInterval(() => {
      if (this.character.isAboveGround()) return;
      clearInterval(check);
      this.playLandingThenIdle();
    }, 50);
  }

  playLandingThenIdle() {
    this.character.loadImage('img/2_character_pepe/3_jump/J-38.png');
    setTimeout(() => this.startIdleAfterLanding(), 300);
  }

  startIdleAfterLanding() {
    if (this.character.playIdleAnimation) {
      this.character.playIdleAnimation();
    } else {
      this.character.loadImage(this.character.IMAGES_STANDING[0]);
    }
  }

  endGame(win = false) {
    // 🛑 Alles einfrieren
    this.pauseAllMovements();

    // ⏱️ Unterschiedliche Verzögerung je nach Ausgang
    const delay = win ? 1000 : 3000; // 1 Sekunde bei Sieg, 3 bei Niederlage

    setTimeout(() => {
      showEndScreen(win); // false = verloren, true = gewonnen
    }, delay);
  }

  // 🧩 ZEIGE PAUSE, DANN PLAY SYMBOL
  showPauseThenPlaySymbol() {
    if (this.isStartScreenVisible()) return;

    const pauseOverlay = this.createOverlay("pause-overlay", "⏸");
    this.applyOverlayStyle(pauseOverlay, 0.4);
    document.body.appendChild(pauseOverlay);

    this.fadeOutThenRemove(pauseOverlay, 200, 500, () => {
      this.showPlaySymbol();
    });
  }

  // 🧩 DAUERHAFTES PLAY-SYMBOL ZEIGEN
  showPlaySymbol() {
    if (this.isStartScreenVisible()) return;
    if (this.isOverlayPresent("play-overlay")) return;

    const playOverlay = this.createOverlay("play-overlay", "▶");
    this.applyOverlayStyle(playOverlay, 0.4);
    document.body.appendChild(playOverlay);
  }

  // 🧩 PLAY-SYMBOL ENTFERNEN
  hidePlaySymbol() {
    this.removeOverlay("play-overlay");
  }

  isStartScreenVisible() {
    const start = document.getElementById('start-screen');
    return start && !start.classList.contains('hidden');
  }

  isOverlayPresent(id) {
    return !!document.getElementById(id);
  }

  createOverlay(id, symbol) {
    const el = document.createElement("div");
    el.id = id;
    el.innerHTML = symbol;
    return el;
  }

  applyOverlayStyle(el, opacity = 0.4) {
    el.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 100px;
    color: white;
    text-shadow: 0 0 10px black;
    pointer-events: none;
    user-select: none;
    opacity: ${opacity};
    transition: opacity 0.5s ease;
    z-index: 9999;
  `;
  }

  fadeOutThenRemove(el, waitMs, fadeMs, onDone) {
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => {
        el.remove();
        onDone?.();
      }, fadeMs);
    }, waitMs);
  }

  removeOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  // ⚡ ALLE Figuren kurz hüpfen lassen (Bodyguard landet)
  jumpFromShock() {
    this.bounceCharacter();
    this.bounceEndboss();
    this.bounceChickenNest();
    this.bounceCorncob();
    this.startEndbossCameraPan();
  }

  bounceCharacter() {
    if (!this.character) return;
    this.bounceY(this.character, 2, 4, 30, 8);
  }

  bounceEndboss() {
    if (!this.level?.enemies) return;
    this.level.enemies.forEach(enemy => {
      if (!(enemy instanceof Endboss)) return;
      enemy.playAnimation(enemy.IMAGES_HURT);
      this.bounceEnemyToOriginalY(enemy, 3, 4, 30);
    });
  }

  bounceEnemyToOriginalY(enemy, step, repeats, intervalMs) {
    const originalY = enemy.y;
    let count = 0;
    const id = setInterval(() => {
      enemy.y -= step;
      if (++count < repeats) return;
      clearInterval(id);
      enemy.y = originalY;
    }, intervalMs);
  }

  bounceChickenNest() {
    if (!this.chickenNest) return;
    const originalY = this.chickenNest.y;
    this.chickenNest.y -= 10;
    setTimeout(() => (this.chickenNest.y = originalY), 150);
  }

  bounceCorncob() {
    if (!this.corncob) return;
    this.bounceY(this.corncob, 2, 4, 30, 0);
  }

  bounceY(obj, step, repeats, intervalMs, compensateDown) {
    let count = 0;
    const id = setInterval(() => {
      obj.y -= step;
      if (++count < repeats) return;
      clearInterval(id);
      obj.y += step * repeats + compensateDown;
    }, intervalMs);
  }
}