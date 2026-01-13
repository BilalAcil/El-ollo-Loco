//#region World spawn/utilities system

/**
 * @file models/world.spawn.js
 * @description
 * Spawning + utility functions for the World:
 * - spawn enemies (chickens)
 * - spawn collectibles (coins, salsas)
 * - kill/remove enemies
 * - endGame trigger
 * - pause/play overlay rendering
 * - "shock" effect (small bounce + camera pan)
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

/**
 * Generates all chicken enemies for the level.
 *
 * @this {World}
 * @returns {Array<MovableObject>}
 */
function generateChickens() {
  return [...this.createEnemies(8, Chicken), ...this.createEnemies(4, ChickenSmall)];
}

/**
 * Creates a number of enemies using a constructor.
 *
 * @template T
 * @this {World}
 * @param {number} count
 * @param {Function} Ctor
 * @returns {T[]}
 */
function createEnemies(count, Ctor) {
  return Array.from({ length: count }, () => new Ctor());
}

/**
 * Kills a normal enemy (sets isDead, death image, removes after delay).
 *
 * @this {World}
 * @param {MovableObject} enemy
 * @returns {void}
 */
function killEnemy(enemy) {
  if (!enemy || enemy.isDead) return;
  this.markEnemyDead(enemy);
  this.setDefaultDeathImage(enemy);
  this.removeEnemySoon(enemy, 500);
}

/**
 * Marks an enemy as dead.
 *
 * @this {World}
 * @param {MovableObject} enemy
 * @returns {void}
 */
function markEnemyDead(enemy) {
  enemy.isDead = true;
}

/**
 * Sets default death image for chickens.
 *
 * @this {World}
 * @param {MovableObject} enemy
 * @returns {void}
 */
function setDefaultDeathImage(enemy) {
  if (enemy instanceof Chicken || enemy instanceof ChickenSmall) enemy.loadImage(enemy.IMAGE_DEAD);
}

/**
 * Removes an enemy from enemies array after a delay.
 *
 * @this {World}
 * @param {MovableObject} enemy
 * @param {number} ms
 * @returns {void}
 */
function removeEnemySoon(enemy, ms) {
  setTimeout(() => this.removeEnemy(enemy), ms);
}

/**
 * Removes an enemy immediately from enemies array.
 *
 * @this {World}
 * @param {MovableObject} enemy
 * @returns {void}
 */
function removeEnemy(enemy) {
  const idx = this.level.enemies.indexOf(enemy);
  if (idx > -1) this.level.enemies.splice(idx, 1);
}

/**
 * Generates coin objects in groups (max 10 coins).
 *
 * @this {World}
 * @returns {Coin[]}
 */
function generateCoins() {
  const coins = [];
  while (coins.length < 10) this.addCoinGroup(coins, 10);
  return coins;
}

/**
 * Adds a coin group (1–3 coins) up to the limit.
 *
 * @this {World}
 * @param {Coin[]} coins
 * @param {number} limit
 * @returns {void}
 */
function addCoinGroup(coins, limit) {
  const baseX = this.randomCoinBaseX();
  const groupSize = this.randomCoinGroupSize();
  for (let i = 0; i < groupSize && coins.length < limit; i++) {
    coins.push(this.createCoin(baseX, i));
  }
}

/**
 * Random base X position for coin groups.
 *
 * @this {World}
 * @returns {number}
 */
function randomCoinBaseX() {
  return 300 + Math.random() * 4000;
}

/**
 * Determines group size (1–3).
 *
 * @this {World}
 * @returns {number}
 */
function randomCoinGroupSize() {
  return Math.random() < 0.4 ? 2 + Math.floor(Math.random() * 2) : 1;
}

/**
 * Creates a coin relative to group base.
 *
 * @this {World}
 * @param {number} baseX
 * @param {number} index
 * @returns {Coin}
 */
function createCoin(baseX, index) {
  const x = baseX + index * 50;
  const y = this.randomCoinY();
  return new Coin(x, y);
}

/**
 * Random Y position for coins.
 *
 * @this {World}
 * @returns {number}
 */
function randomCoinY() {
  return 300 + Math.random() * 50;
}

/**
 * Generates salsa pickups (default 5) spread across the level.
 *
 * @this {World}
 * @returns {Salsa[]}
 */
function generateSalsas() {
  const salsas = [];
  for (let i = 0; i < 5; i++) {
    const x = 500 + Math.random() * 3500;
    const y = 370 + Math.random() * 20;
    salsas.push(new Salsa(x, y));
  }
  return salsas;
}

/**
 * Checks if an object counts as a "real enemy" (not UI elements like status bars).
 *
 * NOTE:
 * Bodyguard is handled separately in world.collision.core.js, so we keep this filter
 * limited to normal enemies + endboss.
 *
 * @this {World}
 * @param {*} enemy
 * @returns {boolean}
 */
function isActualEnemy(enemy) {
  return (
    (enemy instanceof Chicken || enemy instanceof ChickenSmall || enemy instanceof Endboss) &&
    !(enemy instanceof EndBossStatusBar)
  );
}

/**
 * Ends the game (win/lose) and shows end screen after a delay.
 * Freezes everything first.
 *
 * @this {World}
 * @param {boolean} [win=false]
 * @returns {void}
 */
function endGame(win = false) {
  this.pauseAllMovements();
  const delay = win ? 1000 : 3000;
  setTimeout(() => showEndScreen(win), delay);
}

/**
 * Shows a short pause overlay (⏸), fades it out, then shows the play symbol (▶).
 * Ignored if start screen is visible.
 *
 * @this {World}
 * @returns {void}
 */
function showPauseThenPlaySymbol() {
  if (this.isStartScreenVisible()) return;
  const overlay = this.createOverlay("pause-overlay", "⏸");
  this.applyOverlayStyle(overlay, 0.4);
  document.body.appendChild(overlay);
  this.fadeOutThenRemove(overlay, 200, 500, () => this.showPlaySymbol());
}

/**
 * Shows the persistent play symbol (▶) centered.
 * Ignored if start screen is visible or already present.
 *
 * @this {World}
 * @returns {void}
 */
function showPlaySymbol() {
  if (this.isStartScreenVisible()) return;
  if (this.isOverlayPresent("play-overlay")) return;
  const overlay = this.createOverlay("play-overlay", "▶");
  this.applyOverlayStyle(overlay, 0.4);
  document.body.appendChild(overlay);
}

/**
 * Removes the play symbol (▶) if present.
 *
 * @this {World}
 * @returns {void}
 */
function hidePlaySymbol() {
  this.removeOverlay("play-overlay");
}

/**
 * Returns true if start screen is currently visible.
 *
 * @this {World}
 * @returns {boolean}
 */
function isStartScreenVisible() {
  const start = document.getElementById("start-screen");
  return start && !start.classList.contains("hidden");
}

/**
 * Returns true if an overlay element exists by id.
 *
 * @this {World}
 * @param {string} id
 * @returns {boolean}
 */
function isOverlayPresent(id) {
  return !!document.getElementById(id);
}

/**
 * Creates an overlay DIV with a symbol.
 *
 * @this {World}
 * @param {string} id
 * @param {string} symbol
 * @returns {HTMLDivElement}
 */
function createOverlay(id, symbol) {
  const el = document.createElement("div");
  el.id = id;
  el.innerHTML = symbol;
  return el;
}

/**
 * Applies default styles for overlays (centered, big, semi-transparent).
 *
 * @this {World}
 * @param {HTMLElement} el
 * @param {number} [opacity=0.4]
 * @returns {void}
 */
function applyOverlayStyle(el, opacity = 0.4) {
  el.style.cssText =
    "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);" +
    "font-size:100px;color:white;text-shadow:0 0 10px black;pointer-events:none;" +
    "user-select:none;transition:opacity .5s ease;z-index:9999;opacity:" + opacity + ";";
}

/**
 * Fades an element out after a short wait, then removes it.
 *
 * @this {World}
 * @param {HTMLElement} el
 * @param {number} waitMs
 * @param {number} fadeMs
 * @param {Function} [onDone]
 * @returns {void}
 */
function fadeOutThenRemove(el, waitMs, fadeMs, onDone) {
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => {
      el.remove();
      onDone?.();
    }, fadeMs);
  }, waitMs);
}

/**
 * Removes an overlay by id if it exists.
 *
 * @this {World}
 * @param {string} id
 * @returns {void}
 */
function removeOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

/**
 * Shock effect after the bodyguard landing:
 * - bounce character
 * - bounce endboss
 * - bounce nest + corncob
 * - start camera pan into endboss arena
 *
 * @this {World}
 * @returns {void}
 */
function jumpFromShock() {
  this.bounceCharacter();
  this.bounceEndboss();
  this.bounceChickenNest();
  this.bounceCorncob();
  this.startEndbossCameraPan();
}

/**
 * Bounces the character up briefly.
 *
 * @this {World}
 * @returns {void}
 */
function bounceCharacter() {
  if (!this.character) return;
  this.bounceY(this.character, 2, 4, 30, 8);
}

/**
 * Bounces the endboss up briefly and plays its hurt frames.
 *
 * @this {World}
 * @returns {void}
 */
function bounceEndboss() {
  if (!this.level?.enemies) return;
  this.level.enemies.forEach((enemy) => {
    if (!(enemy instanceof Endboss)) return;
    enemy.playAnimation(enemy.IMAGES_HURT);
    this.bounceEnemyToOriginalY(enemy, 3, 4, 30);
  });
}

/**
 * Bounces an enemy and then snaps it back exactly to its original Y.
 *
 * @this {World}
 * @param {MovableObject} enemy
 * @param {number} step
 * @param {number} repeats
 * @param {number} intervalMs
 * @returns {void}
 */
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

/**
 * Bounces the chicken nest briefly.
 *
 * @this {World}
 * @returns {void}
 */
function bounceChickenNest() {
  if (!this.chickenNest) return;
  const y = this.chickenNest.y;
  this.chickenNest.y -= 10;
  setTimeout(() => (this.chickenNest.y = y), 150);
}

/**
 * Bounces the corncob briefly.
 *
 * @this {World}
 * @returns {void}
 */
function bounceCorncob() {
  if (!this.corncob) return;
  this.bounceY(this.corncob, 2, 4, 30, 0);
}

/**
 * Generic bounce helper: moves an object up for several ticks and then pushes it back down.
 *
 * NOTE:
 * This uses "add back" at the end (step * repeats + compensateDown). That matches your
 * original behavior, but if you ever see drift with repeated calls, prefer "snap back"
 * to originalY (like bounceEnemyToOriginalY does).
 *
 * @this {World}
 * @param {MovableObject} obj
 * @param {number} step
 * @param {number} repeats
 * @param {number} intervalMs
 * @param {number} compensateDown
 * @returns {void}
 */
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
