//#region Bodyguard sounds mixin

/**
 * @file bodyguard.sounds.js
 * @description Bodyguard sound setup + safe play helpers (mixin).
 */

window.BodyguardSounds = {
  /**
   * Creates audio instances and sets volumes.
   * @returns {void}
   */
  initSounds() {
    this.bodyguardSound = new Audio('audio/bodyguard-sound.mp3');
    this.boomSound = new Audio('audio/Boom.mp3');

    this.hurtSound = new Audio('audio/bodyguard-hurt.mp3');
    this.hurtSound.volume = 0.6;
    this.hurtSound.load();

    // created lazily in ensureDieSound()
    this.dieSound = null;
  },

  /**
   * Plays an audio safely (resets time, ignores autoplay errors).
   * @param {HTMLAudioElement|null|undefined} audio
   * @returns {void}
   */
  playSafe(audio) {
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => { });
  },

  /**
   * Plays the jump-start sound.
   * @returns {void}
   */
  playJumpStartSound() {
    this.playSafe(this.bodyguardSound);
  },

  /**
   * Plays the landing "boom" sound.
   * @returns {void}
   */
  playBoomSound() {
    this.playSafe(this.boomSound);
  },

  /**
   * Plays the hurt sound (with warning on error).
   * @returns {void}
   */
  playHurtSound() {
    if (!this.hurtSound) return;
    this.hurtSound.currentTime = 0;
    this.hurtSound.play().catch((e) => console.warn('Sound error:', e));
  },

  /**
   * Ensures die sound is created once (lazy init).
   * @returns {void}
   */
  ensureDieSound() {
    if (this.dieSound) return;
    this.dieSound = new Audio('audio/bodyguard-die.mp3');
    this.dieSound.volume = 0.5;
  },

  /**
   * Plays the die sound (lazy init).
   * @returns {void}
   */
  playDieSound() {
    this.ensureDieSound();
    this.playSafe(this.dieSound);
  }
};

//#endregion
