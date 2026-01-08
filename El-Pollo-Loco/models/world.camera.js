// models/world.camera.js
Object.assign(World.prototype, {
  startEndbossCameraPan,
  playCameraMoveSound,
  stopCameraMoveSound,
  startEndbossCameraPanBack,
  onBodyguardDeath,
});

function startEndbossCameraPan() {
  if (this.isCameraPanning || this.endbossCameraX === -3770) return;
  this.cameraTargetX = -3770;
  this.cameraPanSpeed = 2;
  this.isCameraPanning = true;
  this.playCameraMoveSound();
}

function playCameraMoveSound() {
  if (!this.cameraMoveSound) return;
  try { this.cameraMoveSound.currentTime = 0; this.cameraMoveSound.play(); }
  catch (e) { console.warn('Kamera-Sound konnte nicht abgespielt werden:', e); }
}

function stopCameraMoveSound() {
  if (!this.cameraMoveSound) return;
  try { this.cameraMoveSound.pause(); this.cameraMoveSound.currentTime = 0; }
  catch (e) { console.warn('Kamera-Sound konnte nicht gestoppt werden:', e); }
}

function startEndbossCameraPanBack() {
  if (this.isCameraPanning) return;
  this.cameraTargetX = -4100 + 100;
  this.cameraPanSpeed = 2;
  this.isCameraPanning = true;
  this.playCameraMoveSound();
}

function onBodyguardDeath() {
  if (this.hasBodyguardDied) return;
  this.hasBodyguardDied = true;

  if (this.endboss) this.endboss.visible = true;
  if (this.endbossBar) this.endbossBar.visible = true;
  if (this.chickenNest) this.chickenNest.visible = true;

  this.shouldStartCameraPanBack = true;
}
