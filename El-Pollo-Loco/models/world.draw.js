//#region World draw system

/**
 * @file models/world.draw.js
 * @description
 * World rendering/draw system.
 * Responsible for:
 * - clearing the canvas
 * - camera transformation (camera_x)
 * - drawing background, clouds, collectibles, enemies, player, and UI
 * - per-object transforms (flipX, rotation, alpha)
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

/**
 * Sets canvas font and color for countdown text.
 * (The actual countdown rendering is done in {@link Countdown#draw}.)
 *
 * @this {World}
 * @returns {void}
 */
function drawCountdown() {
  this.ctx.font = "30px Arial";
  this.ctx.fillStyle = "white";
}

/**
 * Main render function (one frame).
 * Draws:
 * 1) camera layer (level + actors)
 * 2) overlay UI (status bars + countdown)
 * Then schedules the next frame via {@link scheduleNextFrame}.
 *
 * @this {World}
 * @returns {void}
 */
function draw() {
  this.clearCanvas();
  this.drawCameraLayer();
  this.drawOverlayUI();
  this.scheduleNextFrame();
}

/**
 * Clears the entire canvas.
 *
 * @this {World}
 * @returns {void}
 */
function clearCanvas() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

/**
 * Draws all objects affected by the camera.
 * The translation is wrapped by {@link withCamera}.
 *
 * @this {World}
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
 * Executes a draw callback inside the camera coordinate system.
 * Translates the canvas by {@link World#camera_x}.
 *
 * @this {World}
 * @param {Function} fn - Callback rendered inside the camera transformation.
 * @returns {void}
 */
function withCamera(fn) {
  this.ctx.save();
  this.ctx.translate(this.camera_x, 0);
  fn();
  this.ctx.restore();
}

/**
 * Draws background objects and clouds.
 *
 * @this {World}
 * @returns {void}
 */
function drawBackgroundAndClouds() {
  this.addObjectsToMap(this.level.backgroundObjects);
  this.addObjectsToMap(this.level.clouds);
}

/**
 * Draws collectibles (coins + salsa bottles).
 *
 * @this {World}
 * @returns {void}
 */
function drawCollectibles() {
  this.addObjectsToMap(this.coins);
  this.addObjectsToMap(this.salsas);
}

/**
 * Draws "world objects" (bodyguard, chicken nest + optional objects).
 *
 * @this {World}
 * @returns {void}
 */
function drawWorldObjects() {
  this.addToMap(this.bodyguard);
  this.addToMap(this.chickenNest);
  this.drawOptionalWorldObjects();
}

/**
 * Draws optional objects that may be null.
 * (Maracas appear only after the endboss dies, for example.)
 *
 * @this {World}
 * @returns {void}
 */
function drawOptionalWorldObjects() {
  if (this.maracas) this.addToMap(this.maracas);
  if (this.bodyguardStatus) this.addToMap(this.bodyguardStatus);
  if (this.corncob) this.addToMap(this.corncob);
}

/**
 * Draws the player and all enemies.
 *
 * @this {World}
 * @returns {void}
 */
function drawActorsAndEnemies() {
  this.addToMap(this.character);
  this.addObjectsToMap(this.level.enemies);
}

/**
 * Draws all throwable objects (e.g. SalsaThrow).
 *
 * @this {World}
 * @returns {void}
 */
function drawThrowableObjects() {
  this.addObjectsToMap(this.throwableObjects);
}

/**
 * Draws overlay UI (not affected by the camera):
 * - health bar
 * - salsa bar
 * - coin bar
 * - countdown icon/text
 *
 * @this {World}
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
 * Schedules the next frame using requestAnimationFrame.
 *
 * @this {World}
 * @returns {void}
 */
function scheduleNextFrame() {
  requestAnimationFrame(() => this.draw());
}

/**
 * Draws multiple objects by calling {@link addToMap}.
 *
 * @this {World}
 * @param {Array<*>} objects - List of drawable/movable objects.
 * @returns {void}
 */
function addObjectsToMap(objects) {
  objects.forEach((o) => this.addToMap(o));
}

/**
 * Draws a single object if it should be rendered.
 * Handles alpha + transforms and then calls {@link renderObject}.
 *
 * @this {World}
 * @param {*} mo - Drawable/movable object (must support draw(ctx)).
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
 * Decides whether an object should be rendered:
 * - object exists
 * - object is not hidden (visible !== false)
 *
 * @param {*} mo
 * @returns {boolean}
 */
function shouldRender(mo) {
  return !!mo && mo.visible !== false;
}

/**
 * Applies global transparency for the object (mo.alpha) or 1.0 by default.
 *
 * @this {World}
 * @param {*} mo
 * @returns {void}
 */
function applyAlpha(mo) {
  this.ctx.globalAlpha = mo.alpha ?? 1.0;
}

/**
 * Applies transforms to the object:
 * - translate to object center
 * - optional: flip horizontally when otherDirection is true
 * - optional: rotate
 * - translate back to top-left of the object
 *
 * @this {World}
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
 * Returns rotation in radians (if mo.rotation is set).
 *
 * @param {*} mo
 * @returns {number} Radians
 */
function getRotationRadians(mo) {
  return mo.rotation ? (mo.rotation * Math.PI) / 180 : 0;
}

/**
 * Translates the canvas origin to the object's center.
 * This allows flip/rotation around the center.
 *
 * @this {World}
 * @param {{x:number,y:number,width:number,height:number}} mo
 * @returns {void}
 */
function translateToCenter(mo) {
  this.ctx.translate(mo.x + mo.width / 2, mo.y + mo.height / 2);
}

/**
 * Translates the origin back to the object's top-left corner.
 *
 * @this {World}
 * @param {{width:number,height:number}} mo
 * @returns {void}
 */
function translateBack(mo) {
  this.ctx.translate(-mo.width / 2, -mo.height / 2);
}

/**
 * Flips the current coordinate system horizontally.
 *
 * @this {World}
 * @returns {void}
 */
function flipX() {
  this.ctx.scale(-1, 1);
}

/**
 * Renders the object and (optionally) its debug frame.
 *
 * @param {*} mo
 * @returns {void}
 */
function renderObject(mo) {
  mo.draw(this.ctx);
  mo.drawFrame(this.ctx);
}

//#endregion
