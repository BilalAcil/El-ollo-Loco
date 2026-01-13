//#region World camera mixin

/**
 * @file models/world.camera.js
 * @description
 * Camera and boss-arena logic for the world:
 * - smooth camera panning in the endboss area
 * - camera sound while panning
 * - reaction to bodyguard death (show boss + UI)
 */

/**
 * Mixin: attaches camera functions to {@link World}.
 * @namespace WorldCameraMixin
 */
Object.assign(World.prototype, {
  startEndbossCameraPan,
  playCameraMoveSound,
  stopCameraMoveSound,
  startEndbossCameraPanBack,
  onBodyguardDeath,
});

/**
 * Starts a smooth camera pan in the endboss area to a defined target position.
 * Ignored if already panning or the target position has already been reached.
 *
 * @this {World}
 * @returns {void}
 */
function startEndbossCameraPan() {
  if (this.isCameraPanning || this.endbossCameraX === -3770) return;

  this.cameraTargetX = -3770;
  this.cameraPanSpeed = 2;
  this.isCameraPanning = true;

  this.playCameraMoveSound();
}

/**
 * Starts the camera movement sound (if available).
 * Resets playback to the beginning.
 *
 * @this {World}
 * @returns {void}
 */
function playCameraMoveSound() {
  if (!this.cameraMoveSound) return;

  try {
    this.cameraMoveSound.currentTime = 0;
    this.cameraMoveSound.play();
  } catch (e) {
    console.warn('Could not play camera sound:', e);
  }
}

/**
 * Stops the camera movement sound (if available) and resets it.
 *
 * @this {World}
 * @returns {void}
 */
function stopCameraMoveSound() {
  if (!this.cameraMoveSound) return;

  try {
    this.cameraMoveSound.pause();
    this.cameraMoveSound.currentTime = 0;
  } catch (e) {
    console.warn('Could not stop camera sound:', e);
  }
}

/**
 * Starts a smooth camera pan back to the original endboss camera position.
 * Ignored if a pan is already in progress.
 *
 * @this {World}
 * @returns {void}
 */
function startEndbossCameraPanBack() {
  if (this.isCameraPanning) return;

  // Original endboss camera position: camera_x = -4100 + 100 (= -4000)
  this.cameraTargetX = -4100 + 100;
  this.cameraPanSpeed = 2;
  this.isCameraPanning = true;

  this.playCameraMoveSound();
}

/**
 * Called when the bodyguard dies.
 * Makes endboss, endboss status bar and nest visible and marks
 * that the camera should pan back later.
 *
 * @this {World}
 * @returns {void}
 */
function onBodyguardDeath() {
  if (this.hasBodyguardDied) return;
  this.hasBodyguardDied = true;

  if (this.endboss) this.endboss.visible = true;
  if (this.endbossBar) this.endbossBar.visible = true;
  if (this.chickenNest) this.chickenNest.visible = true;

  this.shouldStartCameraPanBack = true;
}

//#endregion
