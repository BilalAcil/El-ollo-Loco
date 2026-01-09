/**
 * @file models/world.camera.js
 * @description
 * Kamera- und Boss-Arena-Logik der World:
 * - weiches Kamera-Panning im Endbossbereich
 * - Kamera-Sound beim Panning
 * - Reaktion auf Bodyguard-Tod (Boss + UI einblenden)
 */

/**
 * Mixin: Kamera-Funktionen an {@link World} anhängen.
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
 * Startet ein weiches Kamera-Panning im Endbossbereich auf eine definierte Zielposition.
 * Wird ignoriert, wenn bereits gepannt wird oder die Zielposition schon erreicht ist.
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
 * Startet den Kamera-Bewegungssound (falls vorhanden).
 * Setzt die Wiedergabe auf Anfang zurück.
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
    console.warn('Kamera-Sound konnte nicht abgespielt werden:', e);
  }
}

/**
 * Stoppt den Kamera-Bewegungssound (falls vorhanden) und setzt ihn zurück.
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
    console.warn('Kamera-Sound konnte nicht gestoppt werden:', e);
  }
}

/**
 * Startet ein weiches Kamera-Panning zurück zur ursprünglichen Endboss-Kamera-Position.
 * Wird ignoriert, wenn gerade bereits gepannt wird.
 *
 * @this {World}
 * @returns {void}
 */
function startEndbossCameraPanBack() {
  if (this.isCameraPanning) return;

  // ursprüngliche Endboss-Kameraposition: camera_x = -4100 + 100 (= -4000)
  this.cameraTargetX = -4100 + 100;
  this.cameraPanSpeed = 2;
  this.isCameraPanning = true;

  this.playCameraMoveSound();
}

/**
 * Wird aufgerufen, wenn der Bodyguard stirbt.
 * Macht Endboss, Endboss-Statusbar und Nest sichtbar und markiert,
 * dass die Kamera später wieder zurückfahren soll.
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
