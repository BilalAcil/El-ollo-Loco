/**
 * @file models/countdown.logic.js
 * @description Countdown-Logik (Timer, Audio, Blink, Hide, Endboss-Delay) als Mixin.
 *
 * Voraussetzung:
 * - Countdown.class.js hängt dieses Mixin an Countdown.prototype
 */

window.CountdownLogic = {
  // ---------- Init ----------
  initView() {
    this.currentMusic = "normal";
    this.imagePath = 'img/11_countdown/3208749.png';
    this.loadImage(this.imagePath);

    this.height = 30;
    this.width = 30;
    this.x = 320;
    this.y = 22;
  },

  initTimerState() {
    this.countdownTime = 120;
    this.countdownInterval = null;
    this.isStarted = false;
    this.isPaused = false;
  },

  initAudio() {
    this.bgMusic1 = this.createLoopAudio('audio/background-sound-1.mp3', 0.4);
    this.bgMusic2 = this.createLoopAudio('audio/background-sound-2.mp3', 0.6);

    this.endBossMusic = this.createLoopAudio('audio/endBoss-breich.mp3', 0.7);
    this.slowClockSound = this.createAudio('audio/slow-clock.mp3', 0.7);
  },

  initBlinkState() {
    this.isBlinking = false;
    this.blinkVisible = true;
    this.blinkInterval = null;
  },

  initHideState() {
    this.isTemporarilyHidden = false;
    this.hideTimeout = null;
  },

  initEndbossDelayState() {
    this.endBossMusicTimeout = null;
  },

  // ---------- Audio helpers ----------
  createAudio(src, volume = 1) {
    const a = new Audio(src);
    a.volume = volume;
    return a;
  },

  createLoopAudio(src, volume = 1) {
    const a = this.createAudio(src, volume);
    a.loop = true;
    return a;
  },

  async safePlay(audio) {
    try {
      if (audio && audio.paused) await audio.play();
    } catch (e) {
      console.warn("Audio-Play-Fehler:", e);
    }
  },

  // ---------- Countdown ----------
  startCountdown() {
    if (this.isStarted) return;
    this.isStarted = true;
    this.isPaused = false;

    this.playBackgroundMusic();
    this.countdownInterval = setInterval(() => this.tickCountdown(), 1000);
  },

  tickCountdown() {
    if (this.isPaused) return;
    this.countdownTime--;
    this.handleCountdownTriggers();
    if (this.countdownTime <= 0) this.handleTimeOver();
  },

  handleCountdownTriggers() {
    if (this.countdownTime === 60) this.triggerOneMinuteWarning();
    if (this.countdownTime === 7) this.triggerOneMinuteWarning(true);
  },

  handleTimeOver() {
    this.stopCountdown();
    this.killPlayerIfAlive();
    this.world?.endGame?.(false);
  },

  killPlayerIfAlive() {
    const pepe = this.world?.character;
    if (!pepe || pepe.isDying) return;

    pepe.energy = 0;
    this.world?.statusBar?.setPercentage?.(0);
    pepe.isDead = true;
    pepe.playDeathAnimation();
    pepe.startFallingWhenDead();
  },

  // ---------- Music switching ----------
  playBackgroundMusic() {
    this.currentMusic = "normal";
    if (this.bgMusic1?.paused) this.bgMusic1.currentTime = 0;
    if (this.bgMusic2?.paused) this.bgMusic2.currentTime = 0;

    this.safePlay(this.bgMusic1);
    this.safePlay(this.bgMusic2);
  },

  playEndBossMusic(delay = 3200) {
    if (this.currentMusic === "endboss") return;
    this.currentMusic = "endboss";

    this.stopBackgroundMusic();
    this.resetEndbossTimeout();
    this.endBossMusicTimeout = setTimeout(() => this.startEndbossMusic(), delay);
  },

  stopBackgroundMusic() {
    this.bgMusic1?.pause();
    this.bgMusic2?.pause();
  },

  resetEndbossTimeout() {
    if (!this.endBossMusicTimeout) return;
    clearTimeout(this.endBossMusicTimeout);
    this.endBossMusicTimeout = null;
  },

  startEndbossMusic() {
    if (!this.endBossMusic) return;
    this.endBossMusic.currentTime = 0;
    this.safePlay(this.endBossMusic);
  },

  pauseAllMusic() {
    if (this.endBossMusicTimeout) {
      clearTimeout(this.endBossMusicTimeout);
      this.endBossMusicTimeout = null;
    }

    [this.bgMusic1, this.bgMusic2, this.endBossMusic, this.slowClockSound].forEach(a => {
      if (a && !a.paused) a.pause();
    });
  },

  async resumeAllMusic() {
    if (this.currentMusic === "endboss") {
      await this.safePlay(this.endBossMusic);
      return;
    }

    await this.safePlay(this.bgMusic1);
    await this.safePlay(this.bgMusic2);

    if (this.isBlinking) {
      await this.safePlay(this.slowClockSound);
    }
  },

  // ---------- Blink warning ----------
  triggerOneMinuteWarning(force = false) {
    if (this.isBlinking && !force) return;
    this.resetBlink();
    this.startBlinking();
  },

  resetBlink() {
    if (!this.blinkInterval) return;
    clearInterval(this.blinkInterval);
    this.blinkInterval = null;
  },

  startBlinking() {
    this.isBlinking = true;
    this.blinkVisible = true;
    this.playSlowClockSound();
    this.startBlinkLoop();
  },

  playSlowClockSound() {
    if (!this.slowClockSound) return;
    this.slowClockSound.currentTime = 0;
    this.safePlay(this.slowClockSound);
  },

  startBlinkLoop() {
    let blinkCount = 0;
    this.blinkInterval = setInterval(() => {
      this.blinkVisible = !this.blinkVisible;
      if (++blinkCount >= 14) this.finishBlink();
    }, 500);
  },

  finishBlink() {
    clearInterval(this.blinkInterval);
    this.blinkInterval = null;
    this.isBlinking = false;
    this.blinkVisible = true;
  },

  // ---------- Stop / reset ----------
  stopCountdown() {
    this.stopMainInterval();
    this.resetTimeState();
    this.stopBlinking();
    this.stopHide();
    this.stopEndbossDelay();
    this.stopAllAudio();
  },

  stopMainInterval() {
    if (!this.countdownInterval) return;
    clearInterval(this.countdownInterval);
    this.countdownInterval = null;
  },

  resetTimeState() {
    this.countdownTime = 0;
    this.isStarted = false;
  },

  stopBlinking() {
    if (this.blinkInterval) clearInterval(this.blinkInterval);
    this.blinkInterval = null;
    this.isBlinking = false;
    this.blinkVisible = true;
  },

  stopHide() {
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
    this.hideTimeout = null;
    this.isTemporarilyHidden = false;
  },

  stopEndbossDelay() {
    if (!this.endBossMusicTimeout) return;
    clearTimeout(this.endBossMusicTimeout);
    this.endBossMusicTimeout = null;
  },

  stopAllAudio() {
    [this.bgMusic1, this.bgMusic2, this.endBossMusic, this.slowClockSound].forEach(a => {
      if (!a) return;
      a.pause();
      a.currentTime = 0;
    });
  },

  // ---------- Pause / resume timer ----------
  pauseCountdown() {
    this.isPaused = true;
  },

  resumeCountdown() {
    if (!this.isStarted) this.startCountdown();
    this.isPaused = false;
  },

  // ---------- Hide ----------
  hideTemporarily(duration = 2000) {
    this.isTemporarilyHidden = true;

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.hideTimeout = setTimeout(() => {
      this.isTemporarilyHidden = false;
      this.hideTimeout = null;
    }, duration);
  }
};
