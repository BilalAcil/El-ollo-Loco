/**
 * @file models/countdown.class.js
 * @description
 * Countdown-UI (Icon + Zeit) inkl. Musiksteuerung.
 * - Startet/stoppt einen Countdown (Sekunden)
 * - Spielt Hintergrundmusik und Endboss-Musik
 * - Triggert Blink-Warnung bei 1:00 und 0:07
 * - Kann temporär ausgeblendet werden (Icon + Zeit)
 *
 * Voraussetzungen:
 * - DrawableObject mit draw(ctx), loadImage(path)
 * - World setzt: countdown.world = world
 * - World hat: character, statusBar, endGame()
 */

/**
 * Countdown-Klasse für Timer + Musik + visuelle Anzeige.
 * @class
 * @extends DrawableObject
 */
class Countdown extends DrawableObject {
  /**
   * Erstellt den Countdown, lädt Icon, setzt Layout und initialisiert Audio/State.
   */
  constructor() {
    super();
    this.initView();
    this.initTimerState();
    this.initAudio();
    this.initBlinkState();
    this.initHideState();
    this.initEndbossDelayState();
  }

  /**
   * Initialisiert Icon und Position/Größe.
   * @returns {void}
   */
  initView() {
    this.currentMusic = "normal";
    this.imagePath = 'img/11_countdown/3208749.png';
    this.loadImage(this.imagePath);

    this.height = 30;
    this.width = 30;
    this.x = 320;
    this.y = 22;
  }

  /**
   * Initialisiert Countdown-Zeit und Flags.
   * @returns {void}
   */
  initTimerState() {
    this.countdownTime = 120;
    this.countdownInterval = null;
    this.isStarted = false;
    this.isPaused = false;
  }

  /**
   * Initialisiert alle Audio-Objekte + Default-Einstellungen.
   * @returns {void}
   */
  initAudio() {
    this.bgMusic1 = this.createLoopAudio('audio/background-sound-1.mp3', 0.4);
    this.bgMusic2 = this.createLoopAudio('audio/background-sound-2.mp3', 0.6);

    this.endBossMusic = this.createLoopAudio('audio/endBoss-breich.mp3', 0.7);
    this.slowClockSound = this.createAudio('audio/slow-clock.mp3', 0.7);
  }

  /**
   * Initialisiert Blink-Status (Warnung).
   * @returns {void}
   */
  initBlinkState() {
    this.isBlinking = false;
    this.blinkVisible = true;
    this.blinkInterval = null;
  }

  /**
   * Initialisiert temporäres Ausblenden.
   * @returns {void}
   */
  initHideState() {
    this.isTemporarilyHidden = false;
    this.hideTimeout = null;
  }

  /**
   * Initialisiert Delay-Handle für Endboss-Musik.
   * @returns {void}
   */
  initEndbossDelayState() {
    this.endBossMusicTimeout = null;
  }

  /**
   * Erzeugt ein Audio-Objekt.
   * @param {string} src - Pfad zur Audio-Datei.
   * @param {number} [volume=1] - Lautstärke (0..1).
   * @returns {HTMLAudioElement}
   */
  createAudio(src, volume = 1) {
    const a = new Audio(src);
    a.volume = volume;
    return a;
  }

  /**
   * Erzeugt ein Audio-Objekt, das in Schleife läuft.
   * @param {string} src - Pfad zur Audio-Datei.
   * @param {number} [volume=1] - Lautstärke (0..1).
   * @returns {HTMLAudioElement}
   */
  createLoopAudio(src, volume = 1) {
    const a = this.createAudio(src, volume);
    a.loop = true;
    return a;
  }

  /**
   * Startet Countdown + Musik (nur einmal).
   * @returns {void}
   */
  startCountdown() {
    if (this.isStarted) return;
    this.isStarted = true;
    this.isPaused = false;

    this.playBackgroundMusic();
    this.countdownInterval = setInterval(() => this.tickCountdown(), 1000);
  }

  /**
   * Ein Sekunden-Tick: Zeit runterzählen, Trigger prüfen, ggf. Game Over.
   * @returns {void}
   */
  tickCountdown() {
    if (this.isPaused) return;
    this.countdownTime--;
    this.handleCountdownTriggers();
    if (this.countdownTime <= 0) this.handleTimeOver();
  }

  /**
   * Prüft zeitbasierte Trigger (Warnungen).
   * @returns {void}
   */
  handleCountdownTriggers() {
    if (this.countdownTime === 60) this.triggerOneMinuteWarning();
    if (this.countdownTime === 7) this.triggerOneMinuteWarning(true);
  }

  /**
   * Behandelt "Zeit ist abgelaufen": stoppt Countdown, tötet Spieler, Endscreen lose.
   * @returns {void}
   */
  handleTimeOver() {
    this.stopCountdown();
    this.killPlayerIfAlive();
    this.world?.endGame?.(false);
  }

  /**
   * Setzt Pepe auf tot (falls vorhanden und noch nicht am Sterben).
   * @returns {void}
   */
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
   * Startet normale Hintergrundmusik.
   * @returns {void}
   */
  playBackgroundMusic() {
    this.currentMusic = "normal";
    if (this.bgMusic1.paused) this.bgMusic1.currentTime = 0;
    if (this.bgMusic2.paused) this.bgMusic2.currentTime = 0;
    this.safePlay(this.bgMusic1);
    this.safePlay(this.bgMusic2);
  }

  /**
   * Triggert die Warnung (Blinken + Slow-Clock).
   * force=true erlaubt Neustart, auch wenn bereits geblinkt wird.
   * @param {boolean} [force=false]
   * @returns {void}
   */
  triggerOneMinuteWarning(force = false) {
    if (this.isBlinking && !force) return;
    this.resetBlink();
    this.startBlinking();
  }

  /**
   * Stoppt ggf. laufendes Blink-Intervall (ohne Flags zu verändern).
   * @returns {void}
   */
  resetBlink() {
    if (!this.blinkInterval) return;
    clearInterval(this.blinkInterval);
    this.blinkInterval = null;
  }

  /**
   * Startet Blink-Status + Sound + Loop.
   * @returns {void}
   */
  startBlinking() {
    this.isBlinking = true;
    this.blinkVisible = true;
    this.playSlowClockSound();
    this.startBlinkLoop();
  }

  /**
   * Spielt den Slow-Clock-Sound ab.
   * @returns {void}
   */
  playSlowClockSound() {
    this.slowClockSound.currentTime = 0;
    this.safePlay(this.slowClockSound);
  }

  /**
   * Blink-Loop: togglet Sichtbarkeit 14x (ca. 7 Sekunden).
   * @returns {void}
   */
  startBlinkLoop() {
    let blinkCount = 0;
    this.blinkInterval = setInterval(() => {
      this.blinkVisible = !this.blinkVisible;
      if (++blinkCount >= 14) this.finishBlink();
    }, 500);
  }

  /**
   * Beendet das Blinken und setzt Anzeige wieder sichtbar.
   * @returns {void}
   */
  finishBlink() {
    clearInterval(this.blinkInterval);
    this.blinkInterval = null;
    this.isBlinking = false;
    this.blinkVisible = true;
  }

  /**
   * Stoppt Countdown + Musik + Blink/Hide/Delay und setzt State zurück.
   * @returns {void}
   */
  stopCountdown() {
    this.stopMainInterval();
    this.resetTimeState();
    this.stopBlinking();
    this.stopHide();
    this.stopEndbossDelay();
    this.stopAllAudio();
  }

  /**
   * Stoppt den Haupt-Countdown-Interval.
   * @returns {void}
   */
  stopMainInterval() {
    if (!this.countdownInterval) return;
    clearInterval(this.countdownInterval);
    this.countdownInterval = null;
  }

  /**
   * Setzt Zeit und Start-Flag zurück.
   * @returns {void}
   */
  resetTimeState() {
    this.countdownTime = 0;
    this.isStarted = false;
  }

  /**
   * Stoppt Blink vollständig und setzt Blink-State zurück.
   * @returns {void}
   */
  stopBlinking() {
    if (this.blinkInterval) clearInterval(this.blinkInterval);
    this.blinkInterval = null;
    this.isBlinking = false;
    this.blinkVisible = true;
  }

  /**
   * Stoppt ggf. laufendes Hide-Timeout und macht Anzeige wieder sichtbar.
   * @returns {void}
   */
  stopHide() {
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
    this.hideTimeout = null;
    this.isTemporarilyHidden = false;
  }

  /**
   * Stoppt ggf. verzögerten Start der Endboss-Musik.
   * @returns {void}
   */
  stopEndbossDelay() {
    if (!this.endBossMusicTimeout) return;
    clearTimeout(this.endBossMusicTimeout);
    this.endBossMusicTimeout = null;
  }

  /**
   * Stoppt und resettet alle Audio-Quellen.
   * @returns {void}
   */
  stopAllAudio() {
    [this.bgMusic1, this.bgMusic2, this.endBossMusic, this.slowClockSound].forEach(a => {
      if (!a) return;
      a.pause();
      a.currentTime = 0;
    });
  }

  /**
   * Wechselt zur Endboss-Musik mit Verzögerung.
   * @param {number} [delay=3200] - Verzögerung in ms.
   * @returns {void}
   */
  playEndBossMusic(delay = 3200) {
    if (this.currentMusic === "endboss") return;
    this.currentMusic = "endboss";

    this.stopBackgroundMusic();
    this.resetEndbossTimeout();
    this.endBossMusicTimeout = setTimeout(() => this.startEndbossMusic(), delay);
  }

  /**
   * Stoppt Background-Musik sofort (ohne currentTime Reset).
   * @returns {void}
   */
  stopBackgroundMusic() {
    this.bgMusic1.pause();
    this.bgMusic2.pause();
  }

  /**
   * Stoppt ggf. laufendes Endboss-Timeout.
   * @returns {void}
   */
  resetEndbossTimeout() {
    if (!this.endBossMusicTimeout) return;
    clearTimeout(this.endBossMusicTimeout);
    this.endBossMusicTimeout = null;
  }

  /**
   * Startet Endboss-Musik sofort (mit safePlay).
   * @returns {void}
   */
  startEndbossMusic() {
    this.endBossMusic.currentTime = 0;
    this.safePlay(this.endBossMusic);
  }

  /**
   * Pausiert alle Musik/Sounds (ohne Resets).
   * Bricht ggf. verzögerten Endboss-Start ab.
   * @returns {void}
   */
  pauseAllMusic() {
    if (this.endBossMusicTimeout) {
      clearTimeout(this.endBossMusicTimeout);
      this.endBossMusicTimeout = null;
    }

    [this.bgMusic1, this.bgMusic2, this.endBossMusic, this.slowClockSound].forEach(a => {
      if (a && !a.paused) a.pause();
    });
  }

  /**
   * Setzt Musik abhängig vom currentMusic-State fort.
   * @returns {Promise<void>}
   */
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
   * Pausiert den Countdown (Zeit bleibt stehen).
   * @returns {void}
   */
  pauseCountdown() {
    this.isPaused = true;
  }

  /**
   * Setzt den Countdown fort (startet ihn, falls noch nicht gestartet).
   * @returns {void}
   */
  resumeCountdown() {
    if (!this.isStarted) this.startCountdown();
    this.isPaused = false;
  }

  /**
   * Blendet die Anzeige (Icon + Zahl) temporär aus.
   * Falls bereits ein Hide läuft, wird es ersetzt.
   * @param {number} [duration=2000] - Dauer in ms.
   * @returns {void}
   */
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

  /**
   * Zeichnet Icon + Zeit. Wenn temporär versteckt, zeichnet es nichts.
   * Wenn blinkend, wird die Zeit nur in blinkVisible-Phasen angezeigt.
   * @override
   * @param {CanvasRenderingContext2D} ctx
   * @returns {void}
   */
  draw(ctx) {
    if (this.isTemporarilyHidden) return;
    super.draw(ctx);

    if (!this.isBlinking || this.blinkVisible) {
      ctx.font = "24px comic sans serif";
      ctx.fillStyle = "black";
      ctx.fillText(this.formatTime(), this.x + this.width - 320, this.y + 2);
    }
  }

  /**
   * Formatiert countdownTime als "m:ss".
   * @returns {string}
   */
  formatTime() {
    const minutes = Math.floor(this.countdownTime / 60);
    const seconds = this.countdownTime % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }

  /**
   * Spielt Audio sicher ab (ignoriert Browser-Autoplay Errors).
   * Spielt nur, wenn audio.paused ist.
   * @param {HTMLAudioElement} audio
   * @returns {Promise<void>}
   */
  async safePlay(audio) {
    try {
      if (audio.paused) await audio.play();
    } catch (e) {
      console.warn("Audio-Play-Fehler:", e);
    }
  }
}
