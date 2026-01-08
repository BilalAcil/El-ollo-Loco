// models/world.class.js
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
}
