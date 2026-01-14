//#region World camera mixin
/**
 * @file models/world.camera.js
 * Camera + boss arena helpers:
 * - smooth camera pan into/out of endboss area
 * - play/stop camera move sound
 * - reveal boss UI after bodyguard death
 */

Object.assign(World.prototype, {
  startEndbossCameraPan,
  playCameraMoveSound,
  stopCameraMoveSound,
  startEndbossCameraPanBack,
  onBodyguardDeath,
});

/** Pan camera into endboss area (ignored if already there/panning). */
function startEndbossCameraPan() {
  if (this.isCameraPanning || this.endbossCameraX === -3770) return;

  this.cameraTargetX = -3770;
  this.cameraPanSpeed = 2;
  this.isCameraPanning = true;
  this.playCameraMoveSound();
}

/** Play camera movement sound (safe). */
function playCameraMoveSound() {
  if (!this.cameraMoveSound) return;
  try {
    this.cameraMoveSound.currentTime = 0;
    this.cameraMoveSound.play();
  } catch (e) {
    console.warn('Could not play camera sound:', e);
  }
}

/** Stop camera movement sound (safe). */
function stopCameraMoveSound() {
  if (!this.cameraMoveSound) return;
  try {
    this.cameraMoveSound.pause();
    this.cameraMoveSound.currentTime = 0;
  } catch (e) {
    console.warn('Could not stop camera sound:', e);
  }
}

/** Pan camera back to original endboss camera position. */
function startEndbossCameraPanBack() {
  if (this.isCameraPanning) return;

  // original endboss camera position: camera_x = -4100 + 100 (= -4000)
  this.cameraTargetX = -4100 + 100;
  this.cameraPanSpeed = 2;
  this.isCameraPanning = true;
  this.playCameraMoveSound();
}

/** Bodyguard died -> reveal boss + bar + nest, allow later pan-back. */
function onBodyguardDeath() {
  if (this.hasBodyguardDied) return;
  this.hasBodyguardDied = true;

  if (this.endboss) this.endboss.visible = true;
  if (this.endbossBar) this.endbossBar.visible = true;
  if (this.chickenNest) this.chickenNest.visible = true;

  this.shouldStartCameraPanBack = true;
}
//#endregion
