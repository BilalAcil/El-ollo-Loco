/**
 * @file models/countdown.class.js
 * @description Countdown-UI (Orchestrator) – Logik steckt in CountdownLogic-Mixin.
 *
 * Voraussetzungen:
 * - DrawableObject
 * - window.CountdownLogic wurde vorher geladen
 */

class Countdown extends DrawableObject {
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
   * Zeichnet Icon + Zeit. Wenn temporär versteckt, zeichnet es nichts.
   * Wenn blinkend, wird die Zeit nur in blinkVisible-Phasen angezeigt.
   * @override
   * @param {CanvasRenderingContext2D} ctx
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
}

// Mixin anhängen
Object.assign(Countdown.prototype, window.CountdownLogic);
