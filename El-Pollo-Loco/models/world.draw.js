/**
 * @file models/world.draw.js
 * @description
 * Rendering-/Draw-System der World.
 * Verantwortlich für:
 * - Canvas löschen
 * - Kamera-Transformation (camera_x)
 * - Zeichnen von Background, Clouds, Collectibles, Enemies, Player, UI
 * - Objekt-Transforms (FlipX, Rotation, Alpha)
 * - Frame-Loop via requestAnimationFrame
 */

Object.assign(World.prototype, {
  drawCountdown,
  draw,
  clearCanvas,
  drawCameraLayer,
  withCamera,
  drawBackgroundAndClouds,
  drawCollectibles,
  drawWorldObjects,
  drawOptionalWorldObjects,
  drawActorsAndEnemies,
  drawThrowableObjects,
  drawOverlayUI,
  scheduleNextFrame,

  addObjectsToMap,
  addToMap,
  shouldRender,
  applyAlpha,
  applyObjectTransform,
  getRotationRadians,
  translateToCenter,
  translateBack,
  flipX,
  renderObject,
});

/**
 * Setzt Canvas-Schrift und Farbe für den Countdown-Text.
 * (Die eigentliche Ausgabe des Countdowns passiert in {@link Countdown#draw}.)
 *
 * @returns {void}
 */
function drawCountdown() {
  this.ctx.font = "30px Arial";
  this.ctx.fillStyle = "white";
}

/**
 * Haupt-Render-Funktion (Frame).
 * Zeichnet:
 * 1) Camera-Layer (Level + Figuren)
 * 2) Overlay-UI (Statusbars + Countdown)
 * und scheduled das nächste Frame über {@link scheduleNextFrame}.
 *
 * @returns {void}
 */
function draw() {
  this.clearCanvas();
  this.drawCameraLayer();
  this.drawOverlayUI();
  this.scheduleNextFrame();
}

/**
 * Löscht den kompletten Canvas.
 *
 * @returns {void}
 */
function clearCanvas() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

/**
 * Zeichnet alle Objekte, die von der Kamera beeinflusst werden.
 * Die Translation wird in {@link withCamera} gekapselt.
 *
 * @returns {void}
 */
function drawCameraLayer() {
  this.withCamera(() => {
    this.drawBackgroundAndClouds();
    this.drawCollectibles();
    this.drawWorldObjects();
    this.drawActorsAndEnemies();
    this.drawThrowableObjects();
  });
}

/**
 * Führt eine Zeichenfunktion im Kamera-Koordinatensystem aus.
 * Übersetzt den Canvas um {@link World#camera_x}.
 *
 * @param {Function} fn - Callback, der innerhalb der Kamera-Transformation gerendert wird.
 * @returns {void}
 */
function withCamera(fn) {
  this.ctx.save();
  this.ctx.translate(this.camera_x, 0);
  fn();
  this.ctx.restore();
}

/**
 * Zeichnet Hintergrund-Objekte und Wolken.
 *
 * @returns {void}
 */
function drawBackgroundAndClouds() {
  this.addObjectsToMap(this.level.backgroundObjects);
  this.addObjectsToMap(this.level.clouds);
}

/**
 * Zeichnet sammelbare Objekte (Coins + Salsa).
 *
 * @returns {void}
 */
function drawCollectibles() {
  this.addObjectsToMap(this.coins);
  this.addObjectsToMap(this.salsas);
}

/**
 * Zeichnet "World-Objects" (Bodyguard, ChickenNest + optionale Objekte).
 *
 * @returns {void}
 */
function drawWorldObjects() {
  this.addToMap(this.bodyguard);
  this.addToMap(this.chickenNest);
  this.drawOptionalWorldObjects();
}

/**
 * Zeichnet optionale Objekte, die evtl. null sein können.
 * (Maracas erscheinen z.B. erst nach Endboss-Tod.)
 *
 * @returns {void}
 */
function drawOptionalWorldObjects() {
  if (this.maracas) this.addToMap(this.maracas);
  if (this.bodyguardStatus) this.addToMap(this.bodyguardStatus);
  if (this.corncob) this.addToMap(this.corncob);
}

/**
 * Zeichnet Player + Gegner.
 *
 * @returns {void}
 */
function drawActorsAndEnemies() {
  this.addToMap(this.character);
  this.addObjectsToMap(this.level.enemies);
}

/**
 * Zeichnet alle Wurfobjekte (z.B. SalsaThrow).
 *
 * @returns {void}
 */
function drawThrowableObjects() {
  this.addObjectsToMap(this.throwableObjects);
}

/**
 * Zeichnet Overlay-UI (nicht von der Kamera beeinflusst):
 * - Health-Bar
 * - Salsa-Bar
 * - Coin-Bar
 * - Countdown Icon/Text
 *
 * @returns {void}
 */
function drawOverlayUI() {
  this.addToMap(this.statusBar);
  this.addToMap(this.statusBarSalsa);
  this.addToMap(this.statusBarCoin);
  this.addToMap(this.countdown);
  this.drawCountdown();
}

/**
 * Plant das nächste Frame über requestAnimationFrame.
 *
 * @returns {void}
 */
function scheduleNextFrame() {
  requestAnimationFrame(() => this.draw());
}

/**
 * Zeichnet mehrere Objekte nacheinander via {@link addToMap}.
 *
 * @param {Array<*>} objects - Liste von Drawable-/Movable-Objekten.
 * @returns {void}
 */
function addObjectsToMap(objects) {
  objects.forEach((o) => this.addToMap(o));
}

/**
 * Zeichnet ein einzelnes Objekt, falls es gerendert werden soll.
 * Behandelt Alpha + Transformationen und ruft dann {@link renderObject} auf.
 *
 * @param {*} mo - Drawable-/Movable-Objekt (muss draw(ctx) unterstützen).
 * @returns {void}
 */
function addToMap(mo) {
  if (!this.shouldRender(mo)) return;

  this.ctx.save();
  this.applyAlpha(mo);
  this.applyObjectTransform(mo);
  this.renderObject(mo);
  this.ctx.restore();
}

/**
 * Entscheidet, ob ein Objekt gerendert werden darf:
 * - Objekt existiert
 * - Objekt ist nicht unsichtbar (visible !== false)
 *
 * @param {*} mo
 * @returns {boolean}
 */
function shouldRender(mo) {
  return !!mo && mo.visible !== false;
}

/**
 * Setzt die globale Transparenz für das Objekt (mo.alpha) oder 1.0 als Default.
 *
 * @param {*} mo
 * @returns {void}
 */
function applyAlpha(mo) {
  this.ctx.globalAlpha = mo.alpha ?? 1.0;
}

/**
 * Wendet Transformations auf das Objekt an:
 * - Translate zum Mittelpunkt
 * - Optional: Spiegeln bei otherDirection
 * - Optional: Rotation
 * - Translate zurück
 *
 * @param {*} mo
 * @returns {void}
 */
function applyObjectTransform(mo) {
  const rot = this.getRotationRadians(mo);

  this.translateToCenter(mo);

  if (mo.otherDirection) this.flipX();
  if (rot) this.ctx.rotate(rot);

  this.translateBack(mo);
}

/**
 * Liefert Rotation in Radiant (falls mo.rotation gesetzt ist).
 *
 * @param {*} mo
 * @returns {number} Radiant
 */
function getRotationRadians(mo) {
  return mo.rotation ? (mo.rotation * Math.PI) / 180 : 0;
}

/**
 * Übersetzt den Canvas-Ursprung auf die Objektmitte.
 * Damit können Flip/Rotation um die Mitte erfolgen.
 *
 * @param {{x:number,y:number,width:number,height:number}} mo
 * @returns {void}
 */
function translateToCenter(mo) {
  this.ctx.translate(mo.x + mo.width / 2, mo.y + mo.height / 2);
}

/**
 * Übersetzt den Ursprung zurück in die linke obere Ecke des Objekts.
 *
 * @param {{width:number,height:number}} mo
 * @returns {void}
 */
function translateBack(mo) {
  this.ctx.translate(-mo.width / 2, -mo.height / 2);
}

/**
 * Spiegelt das aktuelle Koordinatensystem horizontal.
 *
 * @returns {void}
 */
function flipX() {
  this.ctx.scale(-1, 1);
}

/**
 * Rendert das Objekt und (optional) dessen Debug-Frame.
 *
 * @param {*} mo
 * @returns {void}
 */
function renderObject(mo) {
  mo.draw(this.ctx);
  mo.drawFrame(this.ctx);
}
