//#region EndBossStatusBar class

/**
 * @file models/endboss-status-bar.class.js
 * @description
 * Status bar for the endboss (HP display).
 * - Loads HP images (0..100)
 * - Plays a hurt sound when HP decreases
 * - Removes itself from the world when HP <= 0
 */

/**
 * EndBossStatusBar displays the endboss' health points.
 * @class
 * @extends DrawableObject
 */
class EndBossStatusBar extends DrawableObject {
  /**
   * Image paths for the different HP levels.
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
   * Creates the endboss status bar and sets position/size.
   * @param {World} world - Reference to the world (removal/camera info).
   */
  constructor(world) {
    super();
    this.world = world;
    this.initView();
    this.initAudio();
    this.setPercentage(100);
  }

  /**
   * Initializes assets, size, and position.
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
   * Initializes the hurt sound.
   * @returns {void}
   */
  initAudio() {
    this.hurtSound = new Audio('audio/endboss-hurt.mp3');
    this.hurtSound.volume = 0.6;
  }

  /**
   * Sets the HP percentage value and updates the displayed image.
   * Plays a hurt sound when HP decreases.
   * Removes the status bar at 0%.
   * @param {number} percentage - New HP in percent (0..100).
   * @returns {void}
   */
  setPercentage(percentage) {
    if (percentage < this.percentage) this.playHurtSound();

    this.percentage = Math.max(0, percentage);
    this.updateImageByPercentage();

    if (this.percentage <= 0) this.removeFromWorld();
  }

  /**
   * Plays the hurt sound (with a safe fallback).
   * @returns {void}
   */
  playHurtSound() {
    if (!this.hurtSound) return;
    this.hurtSound.currentTime = 0;
    this.hurtSound.play().catch(e => console.warn('Endboss hurt sound:', e));
  }

  /**
   * Selects the matching image from the cache based on the percentage level.
   * @returns {void}
   */
  updateImageByPercentage() {
    const path = this.IMAGES[this.resolveImageIndex()];
    this.img = this.imageCache[path];
  }

  /**
   * Removes the status bar from `world.level.enemies`.
   * @returns {void}
   */
  removeFromWorld() {
    const enemies = this.world?.level?.enemies;
    if (!enemies) return;

    const index = enemies.indexOf(this);
    if (index > -1) enemies.splice(index, 1);
  }

  /**
   * Maps percentage to the image index (0..5).
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

//#endregion
