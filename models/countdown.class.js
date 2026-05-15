//#region Countdown class (orchestrator)

/**
 * @file models/countdown.class.js
 * @description Countdown UI (orchestrator) – logic lives in the CountdownLogic mixin.
 *
 * Requirements:
 * - DrawableObject
 * - window.CountdownLogic was loaded before this file
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
   * Draws icon + time. If temporarily hidden, draws nothing.
   * If blinking, the time is only shown during blinkVisible phases.
   * @override
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context.
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
   * Formats countdownTime as "m:ss".
   * @returns {string}
   */
  formatTime() {
    const minutes = Math.floor(this.countdownTime / 60);
    const seconds = this.countdownTime % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }
}

//#endregion

//#region Attach mixin

// Attach mixin
Object.assign(Countdown.prototype, window.CountdownLogic);

//#endregion
