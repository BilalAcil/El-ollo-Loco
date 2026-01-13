/**
 * @file bodyguard.sounds.js
 * @description Sounds + Helper für Bodyguard.
 */

window.BodyguardSounds = {
  initSounds() {
    this.bodyguardSound = new Audio('audio/bodyguard-sound.mp3');
    this.boomSound = new Audio('audio/Boom.mp3');

    this.hurtSound = new Audio('audio/bodyguard-hurt.mp3');
    this.hurtSound.volume = 0.6;
    this.hurtSound.load();

    // dieSound lazy per ensureDieSound()
    this.dieSound = null;
  },

  playSafe(audio) {
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => { });
  },

  playJumpStartSound() {
    this.playSafe(this.bodyguardSound);
  },

  playBoomSound() {
    this.playSafe(this.boomSound);
  },

  playHurtSound() {
    if (!this.hurtSound) return;
    this.hurtSound.currentTime = 0;
    this.hurtSound.play().catch(e => console.warn('Soundfehler:', e));
  },

  ensureDieSound() {
    if (this.dieSound) return;
    this.dieSound = new Audio('audio/bodyguard-die.mp3');
    this.dieSound.volume = 0.5;
  },

  playDieSound() {
    this.ensureDieSound();
    this.playSafe(this.dieSound);
  }
};
