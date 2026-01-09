/**
 * @file models/endboss.class.js
 * @description
 * Endboss (Boss-Chicken) mit Idle/Hurt/Dead Animation, Aktivierung nach Treffer,
 * Fall-Animation nach Tod sowie World-Interaktionen (Bodyguard töten, Maracas spawnen).
 */

/**
 * Endboss-Gegner.
 * @class
 * @extends MovableObject
 */
class Endboss extends MovableObject {
  /** @type {number} */ height = 170;
  /** @type {number} */ width = 130;
  /** @type {number} */ y = 280;

  /**
   * Steuert, ob der Boss kurz in "Hurt/Awake" Animation ist.
   * @type {boolean}
   */
  isActivated = false;

  /** Lebenspunkte des Bosses. @type {number} */
  energy = 100;

  /** Ob der Boss tot ist. @type {boolean} */
  isDead = false;

  /** Ob der Boss bereits pausiert ist. @type {boolean} */
  isPaused = false;

  /** Verhindert doppelte onDeath-Events. @type {boolean} */
  isDeadHandled = false;

  /** Aktuelle Fallgeschwindigkeit (für Fall-Physik). @type {number} */
  fallSpeed = 0;

  /** Interval-Handle für Animation. @type {number|undefined} */
  animationInterval;

  /** Interval-Handle für Fallen. @type {number|undefined} */
  fallInterval;

  /**
   * Bilder für Idle-Animation.
   * @type {string[]}
   */
  IMAGES_IDLE = [
    'img/4_enemie_boss_chicken/6_idle/1_Chicken_Idle.png',
    'img/4_enemie_boss_chicken/6_idle/1_z_Chicken_Idle.png',
    'img/4_enemie_boss_chicken/6_idle/2_z_Chicken_Idle.png',
    'img/4_enemie_boss_chicken/6_idle/3_z_Chicken_Idle.png'
  ];

  /**
   * Bilder für Hurt/Awake-Animation (nach Treffer).
   * @type {string[]}
   */
  IMAGES_HURT = [
    'img/4_enemie_boss_chicken/awake/1_Chicken_awake.png',
    'img/4_enemie_boss_chicken/awake/2_Chicken_awake.png',
    'img/4_enemie_boss_chicken/awake/3_Chicken_awake.png',
    'img/4_enemie_boss_chicken/awake/4_Chicken_awake.png'
  ];

  /**
   * Bilder für Todesanimation.
   * @type {string[]}
   */
  IMAGES_DEAD = [
    'img/4_enemie_boss_chicken/5_dead/G24.png',
    'img/4_enemie_boss_chicken/5_dead/G25.png',
    'img/4_enemie_boss_chicken/5_dead/G26.png'
  ];

  /**
   * Erstellt den Endboss, lädt Assets, setzt Startposition und startet Animation.
   */
  constructor() {
    super().loadImage(this.IMAGES_IDLE[0]);
    this.preloadAssets();
    this.initPosition();
    this.animate();
  }

  /**
   * Lädt alle Animation-Assets (Idle/Hurt/Dead) in den Cache.
   * @returns {void}
   */
  preloadAssets() {
    this.loadImages(this.IMAGES_IDLE);
    this.loadImages(this.IMAGES_HURT);
    this.loadImages(this.IMAGES_DEAD);
  }

  /**
   * Setzt Startposition des Endbosses.
   * @returns {void}
   */
  initPosition() {
    this.x = 4500;
  }

  /**
   * Startet die Animationsschleife.
   * - Dead -> IMAGES_DEAD
   * - Activated -> IMAGES_HURT
   * - sonst -> IMAGES_IDLE
   * @returns {void}
   */
  animate() {
    this.animationInterval = setInterval(() => {
      if (this.isGamePaused()) return;
      this.playCurrentAnimation();
    }, 400);
  }

  /**
   * Prüft, ob Boss oder World pausiert sind.
   * @returns {boolean}
   */
  isGamePaused() {
    return this.isPaused || this.world?.isPaused;
  }

  /**
   * Spielt die passende Animation basierend auf dem Zustand.
   * @returns {void}
   */
  playCurrentAnimation() {
    if (this.isDead) return this.playAnimation(this.IMAGES_DEAD);
    if (this.isActivated) return this.playAnimation(this.IMAGES_HURT);
    this.playAnimation(this.IMAGES_IDLE);
  }

  /**
   * Startet die Fall-Animation nach dem Tod (nur einmal).
   * @returns {void}
   */
  startFallingWhenDead() {
    if (this.fallInterval) return;
    this.fallSpeed = 0;
    this.fallInterval = setInterval(() => this.tickFall(), 1000 / 30);
  }

  /**
   * Tick für die Fall-Physik.
   * @returns {void}
   */
  tickFall() {
    if (this.isGamePaused()) return;
    if (!this.isDead) return;

    this.applyFallStep();
    if (this.y > 600) this.finishFall();
  }

  /**
   * Wendet eine Fall-Physik-Stufe an.
   * @returns {void}
   */
  applyFallStep() {
    this.fallSpeed += 0.5;
    this.y += this.fallSpeed;
  }

  /**
   * Beendet das Fallen und entfernt den Endboss aus der Welt.
   * @returns {void}
   */
  finishFall() {
    clearInterval(this.fallInterval);
    this.fallInterval = null;
    this.removeFromWorld();
  }

  /**
   * Entfernt den Endboss aus `world.level.enemies`.
   * @returns {void}
   */
  removeFromWorld() {
    const enemies = this.world?.level?.enemies;
    if (!enemies) return;

    const index = enemies.indexOf(this);
    if (index > -1) enemies.splice(index, 1);
  }

  /**
   * Wird beim Tod des Endbosses aufgerufen (nur einmal).
   * - Tötet optional den Bodyguard
   * - Lässt Maracas nach kurzer Verzögerung erscheinen
   * @returns {void}
   */
  onDeath() {
    if (this.isDeadHandled) return;
    this.isDeadHandled = true;

    this.killBodyguardIfAlive();
    this.spawnMaracasIfMissing(800);
  }

  /**
   * Tötet den Bodyguard, falls er existiert und noch lebt.
   * @returns {void}
   */
  killBodyguardIfAlive() {
    const bg = this.world?.bodyguard;
    if (bg && !bg.isDead) bg.die();
  }

  /**
   * Spawnt Maracas, falls noch nicht vorhanden.
   * @param {number} delayMs - Verzögerung in ms bis zum Spawn.
   * @returns {void}
   */
  spawnMaracasIfMissing(delayMs) {
    if (this.world?.maracas) return;
    setTimeout(() => {
      if (this.world && !this.world.maracas) this.world.maracas = new Maracas();
    }, delayMs);
  }

  /**
   * Aktiviert kurz die Hurt-Animation (z. B. nach Treffer).
   * @returns {void}
   */
  activate() {
    if (this.isActivated || this.isDead) return;
    this.isActivated = true;
    setTimeout(() => (this.isActivated = false), 1000);
  }

  /**
   * Kollisionsbox des Endbosses (Hitbox etwas nach unten verschoben).
   * @returns {{x:number,y:number,width:number,height:number}}
   */
  get collisionBox() {
    return {
      x: this.x,
      y: this.y + 30,
      width: this.width,
      height: this.height - 30
    };
  }

  /**
   * Zeichnet optional die Hitbox (hier transparent).
   * @param {CanvasRenderingContext2D} ctx
   * @returns {void}
   */
  drawFrame(ctx) {
    const box = this.collisionBox;
    ctx.beginPath();
    ctx.lineWidth = "1";
    ctx.strokeStyle = "transparent";
    ctx.rect(box.x - this.x, box.y - this.y, box.width, box.height);
    ctx.stroke();
  }

  /**
   * Pausiert den Endboss (Animation/Fall respektieren `isPaused`).
   * @returns {void}
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Setzt Pause zurück.
   * @returns {void}
   */
  resume() {
    this.isPaused = false;
  }
}
