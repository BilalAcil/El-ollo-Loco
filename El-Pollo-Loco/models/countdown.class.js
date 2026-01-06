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

    this.countdownInterval = setInterval(() => {
      if (this.isPaused) return;

      this.countdownTime--;

      // ⏰ Trigger bei 1:00 (60 Sekunden)
      if (this.countdownTime === 60) {
        this.triggerOneMinuteWarning();
      }

      // ⏰ Trigger bei 0:07 Sekunden
      if (this.countdownTime === 7) {
        this.triggerOneMinuteWarning(true); // ✅ optional "force" für Endphase
      }

      if (this.countdownTime <= 0) {
        this.stopCountdown();

        if (this.world && this.world.character && !this.world.character.isDying) {
          const pepe = this.world.character;
          pepe.energy = 0;
          this.world.statusBar.setPercentage(0);
          pepe.isDead = true;

          pepe.playDeathAnimation();
          pepe.startFallingWhenDead();

          // 👉 Einheitlicher Game-Over-Call
          this.world.endGame(false);
        }
      }
    }, 1000);
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

    // ✅ falls schon ein Blink-Intervall läuft, vorher stoppen (damit es nicht doppelt läuft)
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
    }

    this.isBlinking = true;
    this.blinkVisible = true;

    this.slowClockSound.currentTime = 0;
    this.safePlay(this.slowClockSound);

    let blinkCount = 0;
    this.blinkInterval = setInterval(() => {
      this.blinkVisible = !this.blinkVisible;
      blinkCount++;

      if (blinkCount >= 7 * 2) { // 7 Blinks (an/aus)
        clearInterval(this.blinkInterval);
        this.blinkInterval = null;
        this.isBlinking = false;
        this.blinkVisible = true;
      }
    }, 500);
  }

  /**
   * 🛑 Countdown & Musik stoppen
   */
  stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    this.countdownTime = 0;
    this.isStarted = false;

    // ✅ Blink-Interval sauber stoppen
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
    }
    this.isBlinking = false;
    this.blinkVisible = true;

    // ✅ Hide-Timeout sauber stoppen
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.isTemporarilyHidden = false;

    // ⏱️ Verzögerten Endboss-Start abbrechen
    if (this.endBossMusicTimeout) {
      clearTimeout(this.endBossMusicTimeout);
      this.endBossMusicTimeout = null;
    }

    // 🎵 Alles stoppen
    [this.bgMusic1, this.bgMusic2, this.endBossMusic, this.slowClockSound].forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }

  /**
   * 🔊 Wechselt zur Endboss-Musik (mit Verzögerung)
   */
  playEndBossMusic(delay = 3200) {
    if (this.currentMusic === "endboss") return;

    this.currentMusic = "endboss";

    // Normale Musik sofort stoppen
    this.bgMusic1.pause();
    this.bgMusic2.pause();

    // Falls schon ein Timeout läuft → abbrechen
    if (this.endBossMusicTimeout) {
      clearTimeout(this.endBossMusicTimeout);
      this.endBossMusicTimeout = null;
    }

    // 🎬 Endboss-Musik verzögert starten
    this.endBossMusicTimeout = setTimeout(() => {
      this.endBossMusic.currentTime = 0;
      this.safePlay(this.endBossMusic); // ✅ konsistent
    }, delay);
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
