class Countdown extends DrawableObject {
  constructor() {
    super();
    this.currentMusic = "normal";
    this.imagePath = 'img/11_countdown/3208749.png';
    this.loadImage(this.imagePath);

    this.height = 30;
    this.width = 30;
    this.x = 320;
    this.y = 22;

    this.countdownTime = 120; // Sekunden
    this.countdownInterval = null;
    this.isStarted = false;
    this.isPaused = false;

    // 🎶 Hintergrundmusik
    this.bgMusic1 = new Audio('audio/background-sound-1.mp3');
    this.bgMusic2 = new Audio('audio/background-sound-2.mp3');
    this.bgMusic1.loop = true;
    this.bgMusic2.loop = true;
    this.bgMusic1.volume = 0.4;
    this.bgMusic2.volume = 0.6;

    // 🎶 Endboss-Musik
    this.endBossMusic = new Audio('audio/endBoss-breich.mp3');
    this.endBossMusic.loop = true;
    this.endBossMusic.volume = 0.7;

    // ⏰ Slow-Clock Sound
    this.slowClockSound = new Audio('audio/slow-clock.mp3');
    this.slowClockSound.volume = 0.7;

    // ✨ Blinken
    this.isBlinking = false;
    this.blinkVisible = true;
    this.blinkInterval = null;         // ✅ neu: handle merken

    // ✨ kurz komplett ausblenden (Icon + Zahl)
    this.isTemporarilyHidden = false;
    this.hideTimeout = null;           // ✅ neu: handle merken

    // ⏱️ Timeout-Handle für verzögerten Endboss-Start
    this.endBossMusicTimeout = null;
  }

  /**
   * Startet den Countdown und die Musik – nur einmal
   */
  startCountdown() {
    if (this.isStarted) return;
    this.isStarted = true;
    this.isPaused = false;
    this.playBackgroundMusic();
    this.countdownInterval = setInterval(() => this.tickCountdown(), 1000);
  }

  tickCountdown() {
    if (this.isPaused) return;
    this.countdownTime--;
    this.handleCountdownTriggers();
    if (this.countdownTime <= 0) this.handleTimeOver();
  }

  handleCountdownTriggers() {
    if (this.countdownTime === 60) this.triggerOneMinuteWarning();
    if (this.countdownTime === 7) this.triggerOneMinuteWarning(true);
  }

  handleTimeOver() {
    this.stopCountdown();
    this.killPlayerIfAlive();
    this.world?.endGame?.(false);
  }

  killPlayerIfAlive() {
    const pepe = this.world?.character;
    if (!pepe || pepe.isDying) return;
    pepe.energy = 0;
    this.world?.statusBar?.setPercentage?.(0);
    pepe.isDead = true;
    pepe.playDeathAnimation();
    pepe.startFallingWhenDead();
  }

  /**
   * 🎧 Startet normale Hintergrundmusik
   */
  playBackgroundMusic() {
    this.currentMusic = "normal";

    // Kein Reset mehr – nur wenn wirklich neu starten!
    if (this.bgMusic1.paused) this.bgMusic1.currentTime = 0;
    if (this.bgMusic2.paused) this.bgMusic2.currentTime = 0;

    this.safePlay(this.bgMusic1);
    this.safePlay(this.bgMusic2);
  }

  /**
   * Wird aufgerufen, wenn Countdown bei 1:00 ist (und optional bei 0:07)
   * force=true erlaubt Neustart, falls vorher schon geblinkt wurde (aber nie doppelt gleichzeitig)
   */
  triggerOneMinuteWarning(force = false) {
    if (this.isBlinking && !force) return;
    this.resetBlink();
    this.startBlinking();
  }

  resetBlink() {
    if (!this.blinkInterval) return;
    clearInterval(this.blinkInterval);
    this.blinkInterval = null;
  }

  startBlinking() {
    this.isBlinking = true;
    this.blinkVisible = true;
    this.playSlowClockSound();
    this.startBlinkLoop();
  }

  playSlowClockSound() {
    this.slowClockSound.currentTime = 0;
    this.safePlay(this.slowClockSound);
  }

  startBlinkLoop() {
    let blinkCount = 0;
    this.blinkInterval = setInterval(() => {
      this.blinkVisible = !this.blinkVisible;
      if (++blinkCount >= 14) this.finishBlink();
    }, 500);
  }

  finishBlink() {
    clearInterval(this.blinkInterval);
    this.blinkInterval = null;
    this.isBlinking = false;
    this.blinkVisible = true;
  }

  /**
   * 🛑 Countdown & Musik stoppen
   */
  stopCountdown() {
    this.stopMainInterval();
    this.resetTimeState();
    this.stopBlinking();
    this.stopHide();
    this.stopEndbossDelay();
    this.stopAllAudio();
  }

  stopMainInterval() {
    if (!this.countdownInterval) return;
    clearInterval(this.countdownInterval);
    this.countdownInterval = null;
  }

  resetTimeState() {
    this.countdownTime = 0;
    this.isStarted = false;
  }

  stopBlinking() {
    if (this.blinkInterval) clearInterval(this.blinkInterval);
    this.blinkInterval = null;
    this.isBlinking = false;
    this.blinkVisible = true;
  }

  stopHide() {
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
    this.hideTimeout = null;
    this.isTemporarilyHidden = false;
  }

  stopEndbossDelay() {
    if (!this.endBossMusicTimeout) return;
    clearTimeout(this.endBossMusicTimeout);
    this.endBossMusicTimeout = null;
  }

  stopAllAudio() {
    [this.bgMusic1, this.bgMusic2, this.endBossMusic, this.slowClockSound].forEach(a => {
      if (!a) return;
      a.pause();
      a.currentTime = 0;
    });
  }

  /**
   * 🔊 Wechselt zur Endboss-Musik (mit Verzögerung)
   */
  playEndBossMusic(delay = 3200) {
    if (this.currentMusic === "endboss") return;
    this.currentMusic = "endboss";
    this.stopBackgroundMusic();
    this.resetEndbossTimeout();
    this.endBossMusicTimeout = setTimeout(() => this.startEndbossMusic(), delay);
  }

  stopBackgroundMusic() {
    this.bgMusic1.pause();
    this.bgMusic2.pause();
  }

  resetEndbossTimeout() {
    if (!this.endBossMusicTimeout) return;
    clearTimeout(this.endBossMusicTimeout);
    this.endBossMusicTimeout = null;
  }

  startEndbossMusic() {
    this.endBossMusic.currentTime = 0;
    this.safePlay(this.endBossMusic);
  }

  /**
   * ⏸ Musik pausieren
   */
  pauseAllMusic() {
    // Verzögerten Start abbrechen, wenn pausiert wird
    if (this.endBossMusicTimeout) {
      clearTimeout(this.endBossMusicTimeout);
      this.endBossMusicTimeout = null;
    }

    [this.bgMusic1, this.bgMusic2, this.endBossMusic, this.slowClockSound].forEach(a => {
      if (a && !a.paused) a.pause();
    });
  }

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
  }

  /**
   * 🕓 Countdown einfrieren
   */
  pauseCountdown() {
    this.isPaused = true;
  }

  /**
   * ▶️ Countdown fortsetzen
   */
  resumeCountdown() {
    if (!this.isStarted) {
      this.startCountdown(); // falls noch nicht gestartet → starten
    }
    this.isPaused = false;
  }

  /**
   * Blendet den Countdown (Icon + Text) für eine bestimmte Zeit aus
   */
  hideTemporarily(duration = 2000) {
    this.isTemporarilyHidden = true;

    // ✅ falls schon ein Hide läuft, ersetzen
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.hideTimeout = setTimeout(() => {
      this.isTemporarilyHidden = false;
      this.hideTimeout = null;
    }, duration);
  }

  /**
   * ⏱ Zeit formatieren
   */
  draw(ctx) {
    // komplett nix zeichnen, wenn temporär versteckt
    if (this.isTemporarilyHidden) return;

    super.draw(ctx);

    // Wenn blinkt → nur manchmal anzeigen
    if (!this.isBlinking || this.blinkVisible) {
      ctx.font = "24px comic sans serif";
      ctx.fillStyle = "black";
      ctx.fillText(this.formatTime(), this.x + this.width - 320, this.y + 2);
    }
  }

  formatTime() {
    const minutes = Math.floor(this.countdownTime / 60);
    const seconds = this.countdownTime % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }

  async safePlay(audio) {
    try {
      if (audio.paused) {
        await audio.play();
      }
    } catch (e) {
      console.warn("Audio-Play-Fehler:", e);
    }
  }
}
