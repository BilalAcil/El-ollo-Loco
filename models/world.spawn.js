//#region World spawn/utilities system
/**
 * @file models/world.spawn.js
 * Spawn + Utils: enemies, collectibles, enemy remove, endGame, overlays, shock-bounce.
 */

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

// ---------- Enemies ----------
/** Spawn chickens (normal + small). */
function generateChickens() {
  return [...this.createEnemies(8, Chicken), ...this.createEnemies(4, ChickenSmall)];
}

/** Create N instances via ctor. */
function createEnemies(count, Ctor) {
  return Array.from({ length: count }, () => new Ctor());
}

/** Kill enemy: flag dead, set death img, remove after delay. */
function killEnemy(enemy) {
  if (!enemy || enemy.isDead) return;
  this.markEnemyDead(enemy);
  this.setDefaultDeathImage(enemy);
  this.removeEnemySoon(enemy, 500);
}

/** Mark enemy as dead. */
function markEnemyDead(enemy) { enemy.isDead = true; }

/** Default death image for chickens. */
function setDefaultDeathImage(enemy) {
  if (enemy instanceof Chicken || enemy instanceof ChickenSmall) enemy.loadImage(enemy.IMAGE_DEAD);
}

/** Remove enemy after ms. */
function removeEnemySoon(enemy, ms) { setTimeout(() => this.removeEnemy(enemy), ms); }

/** Remove enemy immediately from level.enemies. */
function removeEnemy(enemy) {
  const i = this.level.enemies.indexOf(enemy);
  if (i > -1) this.level.enemies.splice(i, 1);
}

// ---------- Coins ----------
/** Spawn coin groups until max 10 coins. */
function generateCoins() {
  const coins = [];
  while (coins.length < 10) this.addCoinGroup(coins, 10);
  return coins;
}

/** Add 1–3 coins (clamped to limit). */
function addCoinGroup(coins, limit) {
  const baseX = this.randomCoinBaseX();
  const n = this.randomCoinGroupSize();
  for (let i = 0; i < n && coins.length < limit; i++) coins.push(this.createCoin(baseX, i));
}

/** Random base X for coin group. */
function randomCoinBaseX() { return 300 + Math.random() * 4000; }

/** Group size: mostly 1, sometimes 2–3. */
function randomCoinGroupSize() {
  return Math.random() < 0.4 ? 2 + Math.floor(Math.random() * 2) : 1;
}

/** Create coin in group (x offset + random y). */
function createCoin(baseX, index) {
  return new Coin(baseX + index * 50, this.randomCoinY());
}

/** Random coin Y. */
function randomCoinY() { return 300 + Math.random() * 50; }

// ---------- Salsas ----------
/** Spawn 5 salsa pickups spread across level. */
function generateSalsas() {
  const salsas = [];
  for (let i = 0; i < 5; i++) {
    salsas.push(new Salsa(500 + Math.random() * 3500, 370 + Math.random() * 20));
  }
  return salsas;
}

// ---------- Filters / Endgame ----------
/** True if "real enemy" (no UI like EndBossStatusBar; Bodyguard handled elsewhere). */
function isActualEnemy(enemy) {
  return (
    (enemy instanceof Chicken || enemy instanceof ChickenSmall || enemy instanceof Endboss) &&
    !(enemy instanceof EndBossStatusBar)
  );
}

/** Freeze world and show end screen (win faster than lose). */
function endGame(win = false) {
  this.pauseAllMovements();
  setTimeout(() => showEndScreen(win), win ? 1000 : 3000);
}

// ---------- Overlays ----------
/** Show ⏸ briefly then ▶ (ignored on start screen). */
function showPauseThenPlaySymbol() {
  if (this.isStartScreenVisible()) return;
  const overlay = this.createOverlay("pause-overlay", "⏸");
  this.applyOverlayStyle(overlay, 0.4);
  document.body.appendChild(overlay);
  this.fadeOutThenRemove(overlay, 200, 500, () => this.showPlaySymbol());
}

/** Show persistent ▶ (ignored on start screen / if already present). */
function showPlaySymbol() {
  if (this.isStartScreenVisible() || this.isOverlayPresent("play-overlay")) return;
  const overlay = this.createOverlay("play-overlay", "▶");
  this.applyOverlayStyle(overlay, 0.4);
  document.body.appendChild(overlay);
}

/** Remove ▶ overlay. */
function hidePlaySymbol() { this.removeOverlay("play-overlay"); }

/** Start screen visible? */
function isStartScreenVisible() {
  const start = document.getElementById("start-screen");
  return start && !start.classList.contains("hidden");
}

/** Overlay exists by id? */
function isOverlayPresent(id) { return !!document.getElementById(id); }

/** Build overlay element. */
function createOverlay(id, symbol) {
  const el = document.createElement("div");
  el.id = id;
  el.innerHTML = symbol;
  return el;
}

/** Apply standard overlay styles. */
function applyOverlayStyle(el, opacity = 0.4) {
  el.style.cssText =
    "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);" +
    "font-size:100px;color:white;text-shadow:0 0 10px black;pointer-events:none;" +
    "user-select:none;transition:opacity .5s ease;z-index:9999;opacity:" + opacity + ";";
}

/** Wait -> fade -> remove -> optional callback. */
function fadeOutThenRemove(el, waitMs, fadeMs, onDone) {
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => { el.remove(); onDone?.(); }, fadeMs);
  }, waitMs);
}

/** Remove overlay by id. */
function removeOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ---------- Shock / Bounce ----------
/** Shock effect: bounce actors/objects + pan camera into arena. */
function jumpFromShock() {
  this.bounceCharacter();
  this.bounceEndboss();
  this.bounceChickenNest();
  this.bounceCorncob();
  this.startEndbossCameraPan();
}

/** Bounce Pepe (extra compensateDown keeps your original look). */
function bounceCharacter() {
  if (this.character) this.bounceY(this.character, 2, 4, 30, 8);
}

/** Bounce endboss + show hurt frames. */
function bounceEndboss() {
  this.level?.enemies?.forEach((e) => {
    if (!(e instanceof Endboss)) return;
    e.playAnimation(e.IMAGES_HURT);
    this.bounceEnemyToOriginalY(e, 3, 4, 30);
  });
}

/** Bounce enemy and snap back to original Y (no drift). */
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

/** Quick nest bounce (simple up + reset). */
function bounceChickenNest() {
  if (!this.chickenNest) return;
  const y = this.chickenNest.y;
  this.chickenNest.y -= 10;
  setTimeout(() => (this.chickenNest.y = y), 150);
}

/** Bounce corncob. */
function bounceCorncob() {
  if (this.corncob) this.bounceY(this.corncob, 2, 4, 30, 0);
}

/** Generic bounce (moves up N ticks, then pushes down by same amount + compensateDown). */
function bounceY(obj, step, repeats, intervalMs, compensateDown) {
  let count = 0;
  const id = setInterval(() => {
    obj.y -= step;
    if (++count < repeats) return;
    clearInterval(id);
    obj.y += step * repeats + compensateDown;
  }, intervalMs);
}
//#endregion
