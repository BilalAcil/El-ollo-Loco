// models/world.spawn.js
Object.assign(World.prototype, {
  generateChickens,
  createEnemies,

  killEnemy,
  markEnemyDead,
  setDefaultDeathImage,
  removeEnemySoon,
  removeEnemy,

  generateCoins,
  addCoinGroup,
  randomCoinBaseX,
  randomCoinGroupSize,
  createCoin,
  randomCoinY,

  generateSalsas,

  isActualEnemy,

  endGame,

  showPauseThenPlaySymbol,
  showPlaySymbol,
  hidePlaySymbol,
  isStartScreenVisible,
  isOverlayPresent,
  createOverlay,
  applyOverlayStyle,
  fadeOutThenRemove,
  removeOverlay,

  jumpFromShock,
  bounceCharacter,
  bounceEndboss,
  bounceEnemyToOriginalY,
  bounceChickenNest,
  bounceCorncob,
  bounceY,
});

function generateChickens() {
  return [...this.createEnemies(8, Chicken), ...this.createEnemies(4, ChickenSmall)];
}

function createEnemies(count, Ctor) {
  return Array.from({ length: count }, () => new Ctor());
}

function killEnemy(enemy) {
  if (!enemy || enemy.isDead) return;
  this.markEnemyDead(enemy);
  this.setDefaultDeathImage(enemy);
  this.removeEnemySoon(enemy, 500);
}

function markEnemyDead(enemy) {
  enemy.isDead = true;
}

function setDefaultDeathImage(enemy) {
  if (enemy instanceof Chicken || enemy instanceof ChickenSmall) enemy.loadImage(enemy.IMAGE_DEAD);
}

function removeEnemySoon(enemy, ms) {
  setTimeout(() => this.removeEnemy(enemy), ms);
}

function removeEnemy(enemy) {
  const idx = this.level.enemies.indexOf(enemy);
  if (idx > -1) this.level.enemies.splice(idx, 1);
}

function generateCoins() {
  const coins = [];
  while (coins.length < 10) this.addCoinGroup(coins, 10);
  return coins;
}

function addCoinGroup(coins, limit) {
  const baseX = this.randomCoinBaseX();
  const groupSize = this.randomCoinGroupSize();
  for (let i = 0; i < groupSize && coins.length < limit; i++) coins.push(this.createCoin(baseX, i));
}

function randomCoinBaseX() {
  return 300 + Math.random() * 4000;
}

function randomCoinGroupSize() {
  return Math.random() < 0.4 ? 2 + Math.floor(Math.random() * 2) : 1;
}

function createCoin(baseX, index) {
  const x = baseX + index * 50;
  const y = this.randomCoinY();
  return new Coin(x, y);
}

function randomCoinY() {
  return 300 + Math.random() * 50;
}

function generateSalsas() {
  const salsas = [];
  for (let i = 0; i < 5; i++) {
    const x = 500 + Math.random() * 3500;
    const y = 370 + Math.random() * 20;
    salsas.push(new Salsa(x, y));
  }
  return salsas;
}

function isActualEnemy(enemy) {
  return (enemy instanceof Chicken || enemy instanceof ChickenSmall || enemy instanceof Endboss) &&
    !(enemy instanceof EndBossStatusBar);
}

function endGame(win = false) {
  this.pauseAllMovements();
  const delay = win ? 1000 : 3000;
  setTimeout(() => showEndScreen(win), delay);
}

function showPauseThenPlaySymbol() {
  if (this.isStartScreenVisible()) return;
  const overlay = this.createOverlay("pause-overlay", "⏸");
  this.applyOverlayStyle(overlay, 0.4);
  document.body.appendChild(overlay);
  this.fadeOutThenRemove(overlay, 200, 500, () => this.showPlaySymbol());
}

function showPlaySymbol() {
  if (this.isStartScreenVisible()) return;
  if (this.isOverlayPresent("play-overlay")) return;
  const overlay = this.createOverlay("play-overlay", "▶");
  this.applyOverlayStyle(overlay, 0.4);
  document.body.appendChild(overlay);
}

function hidePlaySymbol() {
  this.removeOverlay("play-overlay");
}

function isStartScreenVisible() {
  const start = document.getElementById('start-screen');
  return start && !start.classList.contains('hidden');
}

function isOverlayPresent(id) {
  return !!document.getElementById(id);
}

function createOverlay(id, symbol) {
  const el = document.createElement("div");
  el.id = id;
  el.innerHTML = symbol;
  return el;
}

// (kompakt, damit <= 14 Zeilen)
function applyOverlayStyle(el, opacity = 0.4) {
  el.style.cssText =
    "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);" +
    "font-size:100px;color:white;text-shadow:0 0 10px black;pointer-events:none;" +
    "user-select:none;transition:opacity .5s ease;z-index:9999;opacity:" + opacity + ";";
}

function fadeOutThenRemove(el, waitMs, fadeMs, onDone) {
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => { el.remove(); onDone?.(); }, fadeMs);
  }, waitMs);
}

function removeOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function jumpFromShock() {
  this.bounceCharacter();
  this.bounceEndboss();
  this.bounceChickenNest();
  this.bounceCorncob();
  this.startEndbossCameraPan();
}

function bounceCharacter() {
  if (!this.character) return;
  this.bounceY(this.character, 2, 4, 30, 8);
}

function bounceEndboss() {
  if (!this.level?.enemies) return;
  this.level.enemies.forEach(enemy => {
    if (!(enemy instanceof Endboss)) return;
    enemy.playAnimation(enemy.IMAGES_HURT);
    this.bounceEnemyToOriginalY(enemy, 3, 4, 30);
  });
}

function bounceEnemyToOriginalY(enemy, step, repeats, intervalMs) {
  const originalY = enemy.y;
  let count = 0;
  const id = setInterval(() => {
    enemy.y -= step;
    if (++count < repeats) return;
    clearInterval(id);
    enemy.y = originalY;
  }, intervalMs);
}

function bounceChickenNest() {
  if (!this.chickenNest) return;
  const y = this.chickenNest.y;
  this.chickenNest.y -= 10;
  setTimeout(() => (this.chickenNest.y = y), 150);
}

function bounceCorncob() {
  if (!this.corncob) return;
  this.bounceY(this.corncob, 2, 4, 30, 0);
}

function bounceY(obj, step, repeats, intervalMs, compensateDown) {
  let count = 0;
  const id = setInterval(() => {
    obj.y -= step;
    if (++count < repeats) return;
    clearInterval(id);
    obj.y += step * repeats + compensateDown;
  }, intervalMs);
}
