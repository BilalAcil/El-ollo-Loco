//#region World class

/**
 * @file models/world.class.js
 * @description
 * Central game world. Holds references to canvas/context, level, characters,
 * status bars, collectibles and manages initialization (including initial pause state).
 */
class World {
  /**
   * The player character (Pepe).
   * @type {Character}
   */
  character = new Character();

  /**
   * Current level object (e.g. level1).
   * @type {Level}
   */
  level = level1;

  /**
   * Canvas element used for rendering.
   * @type {HTMLCanvasElement}
   */
  canvas;

  /**
   * Canvas 2D rendering context.
   * @type {CanvasRenderingContext2D}
   */
  ctx;

  /**
   * Input controller (keyboard).
   * @type {Keyboard}
   */
  keyboard;

  /**
   * Countdown system incl. music.
   * @type {Countdown}
   */
  countdown = new Countdown();

  /**
   * Current camera translation on the X axis.
   * @type {number}
   */
  camera_x = 0;

  /**
   * Player health bar.
   * @type {StatusBar}
   */
  statusBar = new StatusBar();

  /**
   * Salsa status bar.
   * @type {StatusBarSalsa}
   */
  statusBarSalsa = new StatusBarSalsa();

  /**
   * Coin status bar.
   * @type {StatusBarCoin}
   */
  statusBarCoin = new StatusBarCoin();

  /**
   * Status bar for the bodyguard (created dynamically).
   * @type {BodyguardStatusBar|null}
   */
  bodyguardStatus = null;

  /**
   * Maracas collectible (appears after boss/story event).
   * @type {Maracas|null}
   */
  maracas = null;

  /**
   * Healing item (corncob).
   * @type {Corncob|null}
   */
  corncob = new Corncob();

  /**
   * Decoration/object in the endboss area.
   * @type {ChickenNest}
   */
  chickenNest = new ChickenNest();

  /**
   * Bodyguard enemy (gatekeeper before the endboss).
   * @type {Bodyguard}
   */
  bodyguard = new Bodyguard();

  /**
   * Collectible coins in the level.
   * @type {Coin[]}
   */
  coins = [];

  /**
   * Collectible salsa bottles in the level.
   * @type {Salsa[]}
   */
  salsas = [];

  /**
   * Thrown objects (e.g. SalsaThrow).
   * @type {MovableObject[]}
   */
  throwableObjects = [];

  /**
   * Creates a new world instance, initializes context, sounds, references and
   * starts the game in a paused state (start screen / play symbol).
   *
   * @param {HTMLCanvasElement} canvas - Canvas to render the game on.
   * @param {Keyboard} keyboard - Keyboard instance for inputs.
   */
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

  //#region Init

  /**
   * Stores canvas and context for rendering.
   *
   * @param {HTMLCanvasElement} canvas - Canvas element.
   * @returns {void}
   */
  initContext(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  /**
   * Stores the keyboard reference and disables pause overlay initially.
   *
   * @param {Keyboard} keyboard - Keyboard instance.
   * @returns {void}
   */
  initInput(keyboard) {
    this.keyboard = keyboard;

    /**
     * Controls whether a pause overlay (⏸/▶) may be shown when pausing.
     * @type {boolean}
     */
    this.allowPauseOverlay = false;
  }

  /**
   * Initializes runtime flags and hit timers.
   *
   * @returns {void}
   */
  initFlags() {
    /**
     * Timestamp of the last contact-damage hit by normal enemies.
     * @type {number}
     */
    this.lastEnemyHit = 0;

    /**
     * Timestamp of the last contact-damage hit by the endboss.
     * @type {number}
     */
    this.lastEndbossHit = 0;

    /**
     * True while the maracas end sequence is running (no pause/inputs).
     * @type {boolean}
     */
    this.isMaracasSequence = false;

    /**
     * True after the bodyguard has died (boss arena opens).
     * @type {boolean}
     */
    this.hasBodyguardDied = false;

    /**
     * Flag that the camera should pan back after bodyguard death.
     * @type {boolean}
     */
    this.shouldStartCameraPanBack = false;
  }

  /**
   * Initializes camera panning parameters and the camera movement sound.
   *
   * @returns {void}
   */
  initCamera() {
    /**
     * True while a smooth camera pan is active.
     * @type {boolean}
     */
    this.isCameraPanning = false;

    /**
     * Target value for {@link World#camera_x} during a pan.
     * @type {number|null}
     */
    this.cameraTargetX = null;

    /**
     * Camera pan speed.
     * @type {number}
     */
    this.cameraPanSpeed = 2;

    /**
     * Locked camera value inside the endboss arena (optionally set).
     * @type {number|undefined}
     */
    this.endbossCameraX = undefined;

    /**
     * Sound played while the camera is moving.
     * @type {HTMLAudioElement}
     */
    this.cameraMoveSound = this.createSound('audio/push-stone.mp3', 0.4, true);
  }

  /**
   * Initializes reusable sound effects.
   *
   * @returns {void}
   */
  initSounds() {
    /**
     * Healing sound (corncob).
     * @type {HTMLAudioElement}
     */
    this.healSound = this.createSound('audio/heart-1.mp3', 0.5);

    /**
     * Endboss hurt sound (hit feedback).
     * @type {HTMLAudioElement}
     */
    this.endbossHurtSound = this.createSound('audio/endboss-hurt.mp3', 0.6);
  }

  /**
   * Creates an audio object with default settings.
   *
   * @param {string} src - Path to the audio file.
   * @param {number} [volume=1] - Volume (0.0–1.0).
   * @param {boolean} [loop=false] - Whether the sound should loop.
   * @returns {HTMLAudioElement} Initialized audio element.
   */
  createSound(src, volume = 1, loop = false) {
    const sound = new Audio(src);
    sound.volume = volume;
    sound.loop = loop;
    sound.load();
    return sound;
  }

  /**
   * Initializes world references/subsystems:
   * - starts rendering
   * - builds the level objects
   * - sets world references for bodyguard/countdown
   * - starts collision checks
   *
   * @returns {void}
   */
  initWorldRefs() {
    this.draw();
    this.setWorld();

    // Cross references
    this.bodyguard.world = this;
    this.countdown.world = this;

    this.checkCollisions();
  }

  /**
   * Sets the world to an initial paused state so nothing moves
   * before the player clicks "Start".
   *
   * @returns {void}
   */
  initPauseState() {
    /**
     * True if the world is paused.
     * @type {boolean}
     */
    this.isPaused = true;

    this.pauseAllMovements();
    this.character?.pause?.();
    this.endboss?.pause?.();
    this.pauseCountdownSystem();
  }

  /**
   * Pauses countdown + music (if available).
   *
   * @returns {void}
   */
  pauseCountdownSystem() {
    if (!this.countdown) return;
    this.countdown.pauseAllMusic();
    this.countdown.pauseCountdown();
  }

  //#endregion

  //#region World setup

  /**
   * Builds the world content:
   * - links world ref on the character
   * - generates coins/salsas
   * - rebuilds enemy list (chickens + bodyguard + endboss/statusbar)
   * - configures endboss + endboss bar
   * - applies the bodyguard gate (hide boss/bar/nest until bodyguard is dead)
   *
   * @returns {void}
   */
  setWorld() {
    this.linkWorldRefs();
    this.generateCollectibles();
    this.rebuildEnemyList();
    this.setupEndboss();
    this.setupEndbossBar();
    this.applyBodyguardGate();
  }

  /**
   * Links world references into dependent objects.
   *
   * @returns {void}
   */
  linkWorldRefs() {
    this.character.world = this;
  }

  /**
   * Generates all collectibles (coins + salsa bottles).
   *
   * @returns {void}
   */
  generateCollectibles() {
    this.coins = this.generateCoins();
    this.salsas = this.generateSalsas();
  }

  /**
   * Rebuilds the enemy list:
   * - generates new chickens
   * - keeps endboss + endboss status bar from the level
   * - sets endboss/endbossBar references
   *
   * @returns {void}
   */
  rebuildEnemyList() {
    const chickens = this.generateChickens();
    const keep = this.level.enemies.filter(
      (e) => e instanceof Endboss || e instanceof EndBossStatusBar
    );

    this.level.enemies = [...chickens, this.bodyguard, ...keep];
    this.endboss = this.level.enemies.find((e) => e instanceof Endboss);
    this.endbossBar = this.level.enemies.find((e) => e instanceof EndBossStatusBar);
  }

  /**
   * Initializes the endboss (world ref, energy, death state).
   *
   * @returns {void}
   */
  setupEndboss() {
    if (!this.endboss) return;
    this.endboss.world = this;
    this.endboss.energy = 100;
    this.endboss.isDead = false;
  }

  /**
   * Initializes the endboss status bar (world ref, 100%).
   *
   * @returns {void}
   */
  setupEndbossBar() {
    if (!this.endbossBar) return;
    this.endbossBar.world = this;
    this.endbossBar.setPercentage(100);
  }

  /**
   * Hides endboss, endboss status bar and nest while the bodyguard is alive.
   *
   * @returns {void}
   */
  applyBodyguardGate() {
    if (this.hasBodyguardDied) return;

    if (this.endboss) this.endboss.visible = false;
    if (this.endbossBar) this.endbossBar.visible = false;
    if (this.chickenNest) this.chickenNest.visible = false;
  }

  //#endregion

  // NOTE:
  // generateCoins(), generateSalsas(), generateChickens(), checkCollisions(), draw(),
  // pauseAllMovements(), showPlaySymbol(), etc. are implemented in your other files/modules
  // and are documented there via JSDoc.
}

//#endregion
