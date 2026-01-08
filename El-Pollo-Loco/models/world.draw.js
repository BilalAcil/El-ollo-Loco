// models/world.draw.js
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

function drawCountdown() {
  this.ctx.font = "30px Arial";
  this.ctx.fillStyle = "white";
}

function draw() {
  this.clearCanvas();
  this.drawCameraLayer();
  this.drawOverlayUI();
  this.scheduleNextFrame();
}

function clearCanvas() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

function drawCameraLayer() {
  this.withCamera(() => {
    this.drawBackgroundAndClouds();
    this.drawCollectibles();
    this.drawWorldObjects();
    this.drawActorsAndEnemies();
    this.drawThrowableObjects();
  });
}

function withCamera(fn) {
  this.ctx.save();
  this.ctx.translate(this.camera_x, 0);
  fn();
  this.ctx.restore();
}

function drawBackgroundAndClouds() {
  this.addObjectsToMap(this.level.backgroundObjects);
  this.addObjectsToMap(this.level.clouds);
}

function drawCollectibles() {
  this.addObjectsToMap(this.coins);
  this.addObjectsToMap(this.salsas);
}

function drawWorldObjects() {
  this.addToMap(this.bodyguard);
  this.addToMap(this.chickenNest);
  this.drawOptionalWorldObjects();
}

function drawOptionalWorldObjects() {
  if (this.maracas) this.addToMap(this.maracas);
  if (this.bodyguardStatus) this.addToMap(this.bodyguardStatus);
  if (this.corncob) this.addToMap(this.corncob);
}

function drawActorsAndEnemies() {
  this.addToMap(this.character);
  this.addObjectsToMap(this.level.enemies);
}

function drawThrowableObjects() {
  this.addObjectsToMap(this.throwableObjects);
}

function drawOverlayUI() {
  this.addToMap(this.statusBar);
  this.addToMap(this.statusBarSalsa);
  this.addToMap(this.statusBarCoin);
  this.addToMap(this.countdown);
  this.drawCountdown();
}

function scheduleNextFrame() {
  requestAnimationFrame(() => this.draw());
}

function addObjectsToMap(objects) {
  objects.forEach(o => this.addToMap(o));
}

function addToMap(mo) {
  if (!this.shouldRender(mo)) return;
  this.ctx.save();
  this.applyAlpha(mo);
  this.applyObjectTransform(mo);
  this.renderObject(mo);
  this.ctx.restore();
}

function shouldRender(mo) {
  return !!mo && mo.visible !== false;
}

function applyAlpha(mo) {
  this.ctx.globalAlpha = mo.alpha ?? 1.0;
}

function applyObjectTransform(mo) {
  const rot = this.getRotationRadians(mo);
  this.translateToCenter(mo);
  if (mo.otherDirection) this.flipX();
  if (rot) this.ctx.rotate(rot);
  this.translateBack(mo);
}

function getRotationRadians(mo) {
  return mo.rotation ? (mo.rotation * Math.PI) / 180 : 0;
}

function translateToCenter(mo) {
  this.ctx.translate(mo.x + mo.width / 2, mo.y + mo.height / 2);
}

function translateBack(mo) {
  this.ctx.translate(-mo.width / 2, -mo.height / 2);
}

function flipX() {
  this.ctx.scale(-1, 1);
}

function renderObject(mo) {
  mo.draw(this.ctx);
  mo.drawFrame(this.ctx);
}
