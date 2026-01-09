/**
 * @file models/world.class.js
 * @description
 * Zentrale Spielwelt. Hält Referenzen auf Canvas/Context, Level, Spielfiguren,
 * Statusbars, Collectibles und verwaltet Initialisierung (inkl. Pause-Startzustand).
 */
class World {
  /**
   * Der Spieler-Charakter (Pepe).
   * @type {Character}
   */
  character = new Character();

  /**
   * Aktuelles Level-Objekt (z.B. level1).
   * @type {Level}
   */
  level = level1;

  /**
   * Canvas-Element, auf dem gerendert wird.
   * @type {HTMLCanvasElement}
   */
  canvas;

  /**
   * 2D-Render-Kontext der Canvas.
   * @type {CanvasRenderingContext2D}
   */
  ctx;

  /**
   * Eingabe-Controller (Keyboard).
   * @type {Keyboard}
   */
  keyboard;

  /**
   * Countdown-System inkl. Musik.
   * @type {Countdown}
   */
  countdown = new Countdown();

  /**
   * Aktuelle Kamera-Translation auf der X-Achse.
   * @type {number}
   */
  camera_x = 0;

  /**
   * Lebensanzeige des Spielers.
   * @type {StatusBar}
   */
  statusBar = new StatusBar();

  /**
   * Salsa-Statusanzeige.
   * @type {StatusBarSalsa}
   */
  statusBarSalsa = new StatusBarSalsa();

  /**
   * Coin-Statusanzeige.
   * @type {StatusBarCoin}
   */
  statusBarCoin = new StatusBarCoin();

  /**
   * Statusbar für den Bodyguard (wird dynamisch erzeugt).
   * @type {BodyguardStatusBar|null}
   */
  bodyguardStatus = null;

  /**
   * Maracas-Collectible (erscheint nach Boss/Story-Event).
   * @type {Maracas|null}
   */
  maracas = null;

  /**
   * Heil-Item (Maiskolben).
   * @type {Corncob|null}
   */
  corncob = new Corncob();

  /**
   * Deko-/Objekt im Endbossbereich.
   * @type {ChickenNest}
   */
  chickenNest = new ChickenNest();

  /**
   * Bodyguard-Gegner (Gatekeeper vor dem Endboss).
   * @type {Bodyguard}
   */
  bodyguard = new Bodyguard();

  /**
   * Sammelbare Coins im Level.
   * @type {Coin[]}
   */
  coins = [];

  /**
   * Sammelbare Salsa-Flaschen im Level.
   * @type {Salsa[]}
   */
  salsas = [];

  /**
   * Geworfene Objekte (z.B. SalsaThrow).
   * @type {MovableObject[]}
   */
  throwableObjects = [];

  /**
   * Erstellt eine neue World-Instanz, initialisiert Kontext, Sounds, Referenzen und
   * setzt das Spiel initial auf Pause (Startscreen/Play-Symbol).
   *
   * @param {HTMLCanvasElement} canvas - Canvas, auf der das Spiel gezeichnet wird.
   * @param {Keyboard} keyboard - Keyboard-Instanz für Eingaben.
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

  /**
   * Speichert Canvas + Context für das Rendering.
   *
   * @param {HTMLCanvasElement} canvas - Canvas-Element.
   * @returns {void}
   */
  initContext(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  /**
   * Speichert die Keyboard-Referenz und setzt Pause-Overlay initial aus.
   *
   * @param {Keyboard} keyboard - Keyboard-Instanz.
   * @returns {void}
   */
  initInput(keyboard) {
    this.keyboard = keyboard;

    /**
     * Steuert, ob beim Pausieren ein Overlay (⏸/▶) gezeigt werden darf.
     * @type {boolean}
     */
    this.allowPauseOverlay = false;
  }

  /**
   * Initialisiert Laufzeit-Flags und Hit-Timer.
   *
   * @returns {void}
   */
  initFlags() {
    /**
     * Timestamp des letzten Kontaktschadens durch normale Gegner.
     * @type {number}
     */
    this.lastEnemyHit = 0;

    /**
     * Timestamp des letzten Kontaktschadens durch Endboss.
     * @type {number}
     */
    this.lastEndbossHit = 0;

    /**
     * True während der Maracas-Endsequenz (keine Pause/Eingaben).
     * @type {boolean}
     */
    this.isMaracasSequence = false;

    /**
     * True nachdem der Bodyguard tot ist (Boss-Arena wird geöffnet).
     * @type {boolean}
     */
    this.hasBodyguardDied = false;

    /**
     * Flag, ob nach Bodyguard-Tod die Kamera zurückfahren soll.
     * @type {boolean}
     */
    this.shouldStartCameraPanBack = false;
  }

  /**
   * Initialisiert Kamera-Panning-Parameter und den Kamera-Bewegungssound.
   *
   * @returns {void}
   */
  initCamera() {
    /**
     * True während eines soften Kamera-Pans.
     * @type {boolean}
     */
    this.isCameraPanning = false;

    /**
     * Zielwert für {@link World#camera_x} während eines Pans.
     * @type {number|null}
     */
    this.cameraTargetX = null;

    /**
     * Geschwindigkeit des Kamera-Pans.
     * @type {number}
     */
    this.cameraPanSpeed = 2;

    /**
     * Gesperrter Kamera-Wert in der Endboss-Arena (optional gesetzt).
     * @type {number|undefined}
     */
    this.endbossCameraX = undefined;

    /**
     * Sound beim Kamera-Verschieben.
     * @type {HTMLAudioElement}
     */
    this.cameraMoveSound = this.createSound('audio/push-stone.mp3', 0.4, true);
  }

  /**
   * Initialisiert wiederverwendbare Soundeffekte.
   *
   * @returns {void}
   */
  initSounds() {
    /**
     * Heilungssound (Maiskolben).
     * @type {HTMLAudioElement}
     */
    this.healSound = this.createSound('audio/heart-1.mp3', 0.5);

    /**
     * Endboss-Hurt-Sound (für Trefferfeedback).
     * @type {HTMLAudioElement}
     */
    this.endbossHurtSound = this.createSound('audio/endboss-hurt.mp3', 0.6);
  }

  /**
   * Erstellt ein Audio-Objekt mit Standard-Einstellungen.
   *
   * @param {string} src - Pfad zur Audiodatei.
   * @param {number} [volume=1] - Lautstärke (0.0–1.0).
   * @param {boolean} [loop=false] - Ob der Sound geloopt werden soll.
   * @returns {HTMLAudioElement} Fertig initialisiertes Audio-Element.
   */
  createSound(src, volume = 1, loop = false) {
    const sound = new Audio(src);
    sound.volume = volume;
    sound.loop = loop;
    sound.load();
    return sound;
  }

  /**
   * Initialisiert World-Referenzen/Subsysteme:
   * - startet das Rendern
   * - baut die Level-Objekte zusammen
   * - setzt World-Referenzen für Bodyguard/Countdown
   * - startet die Kollisionschecks
   *
   * @returns {void}
   */
  initWorldRefs() {
    this.draw();
    this.setWorld();

    // Gegenseitige Referenzen
    this.bodyguard.world = this;
    this.countdown.world = this;

    this.checkCollisions();
  }

  /**
   * Setzt die World initial auf Pause, damit beim Laden nichts losläuft,
   * bevor der Spieler "Start" klickt.
   *
   * @returns {void}
   */
  initPauseState() {
    /**
     * True wenn die Welt pausiert ist.
     * @type {boolean}
     */
    this.isPaused = true;

    this.pauseAllMovements();
    this.character?.pause?.();
    this.endboss?.pause?.();
    this.pauseCountdownSystem();
  }

  /**
   * Pausiert Countdown + Musik (falls vorhanden).
   *
   * @returns {void}
   */
  pauseCountdownSystem() {
    if (!this.countdown) return;
    this.countdown.pauseAllMusic();
    this.countdown.pauseCountdown();
  }

  /**
   * Baut die World-Inhalte auf:
   * - World-Ref am Character setzen
   * - Coins/Salsas generieren
   * - Gegnerliste neu aufbauen (Chickens + Bodyguard + Endboss/Statusbar)
   * - Endboss + EndbossBar konfigurieren
   * - Bodyguard-Gate anwenden (Boss/Bar/Nest verstecken bis Bodyguard tot)
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
   * Verknüpft World-Referenzen in abhängigen Objekten.
   *
   * @returns {void}
   */
  linkWorldRefs() {
    this.character.world = this;
  }

  /**
   * Erzeugt alle Sammelobjekte (Coins + Salsas).
   *
   * @returns {void}
   */
  generateCollectibles() {
    this.coins = this.generateCoins();
    this.salsas = this.generateSalsas();
  }

  /**
   * Rekonstruiert die Gegnerliste:
   * - erzeugt neue Chickens
   * - behält Endboss + Endboss-Statusbar aus dem Level
   * - setzt Endboss/EndbossBar Referenzen
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
   * Initialisiert den Endboss (World-Ref, Energie, Death-State).
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
   * Initialisiert die Endboss-Statusbar (World-Ref, 100%).
   *
   * @returns {void}
   */
  setupEndbossBar() {
    if (!this.endbossBar) return;
    this.endbossBar.world = this;
    this.endbossBar.setPercentage(100);
  }

  /**
   * Versteckt Endboss, Endboss-Statusbar und Nest solange der Bodyguard lebt.
   *
   * @returns {void}
   */
  applyBodyguardGate() {
    if (this.hasBodyguardDied) return;

    if (this.endboss) this.endboss.visible = false;
    if (this.endbossBar) this.endbossBar.visible = false;
    if (this.chickenNest) this.chickenNest.visible = false;
  }

  // NOTE:
  // generateCoins(), generateSalsas(), generateChickens(), checkCollisions(), draw(),
  // pauseAllMovements(), showPlaySymbol() etc. sind in deinen anderen Dateien/Modulen
  // und werden dort separat per JSDoc dokumentiert.
}
