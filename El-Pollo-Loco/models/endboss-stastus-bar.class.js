/**
 * @file models/endboss-status-bar.class.js
 * @description
 * Statusbar für den Endboss (HP-Anzeige).
 * - Lädt HP-Bilder (0..100)
 * - Spielt Hurt-Sound bei HP-Verlust
 * - Entfernt sich aus der World, wenn HP <= 0
 */

/**
 * EndBossStatusBar zeigt die Lebenspunkte des Endbosses an.
 * @class
 * @extends DrawableObject
 */
class EndBossStatusBar extends DrawableObject {
  /**
   * Bildpfade für die unterschiedlichen HP-Stufen.
   * Index 0 = 0%, 5 = 100%.
   * @type {string[]}
   */
  IMAGES = [
    'img/7_statusbars/2_statusbar_endboss/blue/blue0.png',
    'img/7_statusbars/2_statusbar_endboss/blue/blue20.png',
    'img/7_statusbars/2_statusbar_endboss/blue/blue40.png',
    'img/7_statusbars/2_statusbar_endboss/blue/blue60.png',
    'img/7_statusbars/2_statusbar_endboss/blue/blue80.png',
    'img/7_statusbars/2_statusbar_endboss/blue/blue100.png'
  ];

  /** @type {number} */ percentage = 100;

  /** @type {World|undefined} */
  world;

  /** @type {HTMLAudioElement|undefined} */
  hurtSound;

  /**
   * Erstellt die Endboss-Statusbar und setzt Position/Größe.
   * @param {World} world - Referenz auf die World (für Entfernen/Camera-Infos).
   */
  constructor(world) {
    super();
    this.world = world;
    this.initView();
    this.initAudio();
    this.setPercentage(100);
  }

  /**
   * Initialisiert Assets, Größe und Position.
   * @returns {void}
   */
  initView() {
    this.loadImages(this.IMAGES);
    this.height = 60;
    this.width = 200;
    this.x = 4500;
    this.y = 10;
  }

  /**
   * Initialisiert den Hurt-Sound.
   * @returns {void}
   */
  initAudio() {
    this.hurtSound = new Audio('audio/endboss-hurt.mp3');
    this.hurtSound.volume = 0.6;
  }

  /**
   * Setzt den HP-Prozentwert und aktualisiert das angezeigte Bild.
   * Spielt Hurt-Sound, wenn die HP sinken.
   * Entfernt die Statusbar bei 0%.
   * @param {number} percentage - Neue HP in Prozent (0..100).
   * @returns {void}
   */
  setPercentage(percentage) {
    if (percentage < this.percentage) this.playHurtSound();

    this.percentage = Math.max(0, percentage);
    this.updateImageByPercentage();

    if (this.percentage <= 0) this.removeFromWorld();
  }

  /**
   * Spielt den Hurt-Sound (mit safe fallback).
   * @returns {void}
   */
  playHurtSound() {
    if (!this.hurtSound) return;
    this.hurtSound.currentTime = 0;
    this.hurtSound.play().catch(e => console.warn('Endboss Hurt Sound:', e));
  }

  /**
   * Wählt das passende Bild aus dem Cache anhand der Prozentstufe.
   * @returns {void}
   */
  updateImageByPercentage() {
    const path = this.IMAGES[this.resolveImageIndex()];
    this.img = this.imageCache[path];
  }

  /**
   * Entfernt die Statusbar aus `world.level.enemies`.
   * @returns {void}
   */
  removeFromWorld() {
    const enemies = this.world?.level?.enemies;
    if (!enemies) return;

    const index = enemies.indexOf(this);
    if (index > -1) enemies.splice(index, 1);
  }

  /**
   * Mappt percentage auf den Bildindex (0..5).
   * @returns {number}
   */
  resolveImageIndex() {
    if (this.percentage === 100) return 5;
    if (this.percentage >= 80) return 4;
    if (this.percentage >= 60) return 3;
    if (this.percentage >= 40) return 2;
    if (this.percentage >= 20) return 1;
    return 0;
  }
}
