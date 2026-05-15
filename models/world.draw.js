//#region World draw system
/**
 * @file models/world.draw.js
 * World rendering:
 * - clear canvas, apply camera_x, draw layers + UI
 * - per-object transforms (flip/rotate/alpha)
 * - frame loop via requestAnimationFrame
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

//#region Frame
/** Setup font/color used by Countdown#draw text. */
function drawCountdown() {
  this.ctx.font = "30px Arial";
  this.ctx.fillStyle = "white";
}

/** One frame: clear -> camera layer -> UI -> next frame. */
function draw() {
  this.clearCanvas();
  this.drawCameraLayer();
  this.drawOverlayUI();
  this.scheduleNextFrame();
}

/** Clear entire canvas. */
function clearCanvas() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

/** Draw everything affected by camera_x. */
function drawCameraLayer() {
  this.withCamera(() => {
    this.drawBackgroundAndClouds();
    this.drawCollectibles();
    this.drawWorldObjects();
    this.drawActorsAndEnemies();
    this.drawThrowableObjects();
  });
}

/** Run draw callback inside camera translation. */
function withCamera(fn) {
  this.ctx.save();
  this.ctx.translate(this.camera_x, 0);
  fn();
  this.ctx.restore();
}
//#endregion

//#region Layers
/** Background + clouds. */
function drawBackgroundAndClouds() {
  this.addObjectsToMap(this.level.backgroundObjects);
  this.addObjectsToMap(this.level.clouds);
}

/** Collectibles: coins + salsas. */
function drawCollectibles() {
  this.addObjectsToMap(this.coins);
  this.addObjectsToMap(this.salsas);
}

/** World objects: bodyguard + nest + optional objects. */
function drawWorldObjects() {
  this.addToMap(this.bodyguard);
  this.addToMap(this.chickenNest);
  this.drawOptionalWorldObjects();
}

/** Objects that may be null (maracas/status/corncob). */
function drawOptionalWorldObjects() {
  if (this.maracas) this.addToMap(this.maracas);
  if (this.bodyguardStatus) this.addToMap(this.bodyguardStatus);
  if (this.corncob) this.addToMap(this.corncob);
}

/** Player + enemies. */
function drawActorsAndEnemies() {
  this.addToMap(this.character);
  this.addObjectsToMap(this.level.enemies);
}

/** Throwables (e.g. SalsaThrow). */
function drawThrowableObjects() {
  this.addObjectsToMap(this.throwableObjects);
}

/** UI (not camera-affected). */
function drawOverlayUI() {
  this.addToMap(this.statusBar);
  this.addToMap(this.statusBarSalsa);
  this.addToMap(this.statusBarCoin);
  this.addToMap(this.countdown);
  this.drawCountdown();
}
//#endregion

//#region Loop
/** Schedule next frame. */
function scheduleNextFrame() {
  requestAnimationFrame(() => this.draw());
}
//#endregion

//#region Map helpers
/** Draw list via addToMap. */
function addObjectsToMap(objects) {
  objects.forEach(o => this.addToMap(o));
}

/** Draw single object if visible; apply alpha + transforms. */
function addToMap(mo) {
  if (!this.shouldRender(mo)) return;

  this.ctx.save();
  this.applyAlpha(mo);
  this.applyObjectTransform(mo);
  this.renderObject(mo);
  this.ctx.restore();
}

/** Render guard: exists + visible !== false. */
function shouldRender(mo) {
  return !!mo && mo.visible !== false;
}
//#endregion

//#region Transforms
/** Apply global alpha (default 1). */
function applyAlpha(mo) {
  this.ctx.globalAlpha = mo.alpha ?? 1.0;
}

/** Translate->flip/rotate->translate back. */
function applyObjectTransform(mo) {
  const rot = this.getRotationRadians(mo);

  this.translateToCenter(mo);
  if (mo.otherDirection) this.flipX();
  if (rot) this.ctx.rotate(rot);
  this.translateBack(mo);
}

/** Rotation in radians (0 if unset). */
function getRotationRadians(mo) {
  return mo.rotation ? (mo.rotation * Math.PI) / 180 : 0;
}

/** Move origin to object center (for flip/rotation). */
function translateToCenter(mo) {
  this.ctx.translate(mo.x + mo.width / 2, mo.y + mo.height / 2);
}

/** Move origin back to top-left. */
function translateBack(mo) {
  this.ctx.translate(-mo.width / 2, -mo.height / 2);
}

/** Flip horizontally. */
function flipX() {
  this.ctx.scale(-1, 1);
}
//#endregion

//#region Render
/** Draw sprite + optional debug frame. */
function renderObject(mo) {
  mo.draw(this.ctx);
  mo.drawFrame(this.ctx);
}
//#endregion

//#endregion
