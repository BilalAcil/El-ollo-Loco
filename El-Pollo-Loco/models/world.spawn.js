/**
 * @file models/world.spawn.js
 * @description
 * Spawning-/Erzeugungslogik und "Utility"-Funktionen der World:
 * - Gegner erzeugen (Chickens)
 * - Sammelobjekte erzeugen (Coins, Salsas)
 * - Gegner töten/entfernen
 * - EndGame-Auslöser
 * - Pause-/Play-Overlay Rendering
 * - "Shock"-Effekt (kurzes Hüpfen von Objekten + Kamera-Pan)
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
 * Erzeugt alle Chicken-Enemies für das Level.
 * @returns {Array<MovableObject>} Array mit erzeugten Gegnern.
 */
function generateChickens() {
  return [...this.createEnemies(8, Chicken), ...this.createEnemies(4, ChickenSmall)];
}

/**
 * Erstellt eine definierte Anzahl von Enemies per Konstruktor.
 * @template T
 * @param {number} count - Anzahl der zu erzeugenden Instanzen.
 * @param {new (...args:any[]) => T} Ctor - Klassenkonstruktor (z.B. Chicken).
 * @returns {T[]} Array mit Instanzen.
 */
function createEnemies(count, Ctor) {
  return Array.from({ length: count }, () => new Ctor());
}

/**
 * Tötet einen normalen Gegner (setzt isDead, Death-Image, entfernt ihn nach Delay).
 * @param {MovableObject} enemy - Der zu tötende Gegner.
 * @returns {void}
 */
function killEnemy(enemy) {
  if (!enemy || enemy.isDead) return;
  this.markEnemyDead(enemy);
  this.setDefaultDeathImage(enemy);
  this.removeEnemySoon(enemy, 500);
}

/**
 * Markiert einen Gegner als tot.
 * @param {MovableObject} enemy
 * @returns {void}
 */
function markEnemyDead(enemy) {
  enemy.isDead = true;
}

/**
 * Setzt das Standard-Todesbild für Chickens.
 * @param {MovableObject} enemy
 * @returns {void}
 */
function setDefaultDeathImage(enemy) {
  if (enemy instanceof Chicken || enemy instanceof ChickenSmall) enemy.loadImage(enemy.IMAGE_DEAD);
}

/**
 * Entfernt einen Gegner nach einer Verzögerung aus dem enemies-Array.
 * @param {MovableObject} enemy
 * @param {number} ms - Delay in Millisekunden.
 * @returns {void}
 */
function removeEnemySoon(enemy, ms) {
  setTimeout(() => this.removeEnemy(enemy), ms);
}

/**
 * Entfernt einen Gegner sofort aus dem enemies-Array.
 * @param {MovableObject} enemy
 * @returns {void}
 */
function removeEnemy(enemy) {
  const idx = this.level.enemies.indexOf(enemy);
  if (idx > -1) this.level.enemies.splice(idx, 1);
}

/**
 * Erzeugt Coin-Objekte in Gruppen (max. 10 Coins).
 * @returns {Coin[]} Array der erzeugten Coins.
 */
function generateCoins() {
  const coins = [];
  while (coins.length < 10) this.addCoinGroup(coins, 10);
  return coins;
}

/**
 * Fügt eine Coin-Gruppe hinzu (1–3 Coins) bis zum Limit.
 * @param {Coin[]} coins - Zielarray.
 * @param {number} limit - Maximale Anzahl Coins.
 * @returns {void}
 */
function addCoinGroup(coins, limit) {
  const baseX = this.randomCoinBaseX();
  const groupSize = this.randomCoinGroupSize();
  for (let i = 0; i < groupSize && coins.length < limit; i++) coins.push(this.createCoin(baseX, i));
}

/**
 * Liefert eine zufällige X-Basisposition für Coins.
 * @returns {number}
 */
function randomCoinBaseX() {
  return 300 + Math.random() * 4000;
}

/**
 * Bestimmt, ob Coins einzeln oder als kleine Gruppe spawnen.
 * @returns {number} Gruppengröße (1–3).
 */
function randomCoinGroupSize() {
  return Math.random() < 0.4 ? 2 + Math.floor(Math.random() * 2) : 1;
}

/**
 * Erstellt einen Coin relativ zur Gruppenbasis.
 * @param {number} baseX - Gruppenbasis-X.
 * @param {number} index - Index innerhalb der Gruppe.
 * @returns {Coin}
 */
function createCoin(baseX, index) {
  const x = baseX + index * 50;
  const y = this.randomCoinY();
  return new Coin(x, y);
}

/**
 * Liefert eine zufällige Y-Position für Coins.
 * @returns {number}
 */
function randomCoinY() {
  return 300 + Math.random() * 50;
}

/**
 * Erzeugt Salsa-Pickups (standardmäßig 5 Stück) verteilt im Level.
 * @returns {Salsa[]} Array der erzeugten Salsas.
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
 * Prüft, ob ein Objekt als "echter Gegner" zählt (keine UI-Elemente wie Statusbars).
 * @param {*} enemy - Objekt aus level.enemies.
 * @returns {boolean}
 */
function isActualEnemy(enemy) {
  return (enemy instanceof Chicken || enemy instanceof ChickenSmall || enemy instanceof Endboss) &&
    !(enemy instanceof EndBossStatusBar);
}

/**
 * Beendet das Spiel (Win/Lose) und zeigt nach Delay den Endscreen.
 * Friert vorher alles ein.
 *
 * @param {boolean} [win=false] - true = gewonnen, false = verloren.
 * @returns {void}
 */
function endGame(win = false) {
  this.pauseAllMovements();
  const delay = win ? 1000 : 3000;
  setTimeout(() => showEndScreen(win), delay);
}

/**
 * Zeigt kurz ein Pause-Overlay (⏸), blendet es aus und zeigt danach das Play-Symbol (▶).
 * Wird ignoriert, wenn der Startscreen sichtbar ist.
 *
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
 * Zeigt das dauerhafte Play-Symbol (▶) in der Mitte.
 * Wird ignoriert, wenn der Startscreen sichtbar ist oder bereits angezeigt.
 *
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
 * Entfernt das Play-Symbol (▶), falls vorhanden.
 * @returns {void}
 */
function hidePlaySymbol() {
  this.removeOverlay("play-overlay");
}

/**
 * Prüft, ob der Startscreen aktuell sichtbar ist.
 * @returns {boolean}
 */
function isStartScreenVisible() {
  const start = document.getElementById("start-screen");
  return start && !start.classList.contains("hidden");
}

/**
 * Prüft, ob ein Overlay-Element mit bestimmter ID existiert.
 * @param {string} id - DOM id des Overlays.
 * @returns {boolean}
 */
function isOverlayPresent(id) {
  return !!document.getElementById(id);
}

/**
 * Erstellt ein Overlay-DIV mit Symbol.
 * @param {string} id - DOM id.
 * @param {string} symbol - HTML/String Symbol (z.B. ▶).
 * @returns {HTMLDivElement}
 */
function createOverlay(id, symbol) {
  const el = document.createElement("div");
  el.id = id;
  el.innerHTML = symbol;
  return el;
}

/**
 * Wendet Standard-Styles für Overlays an (zentriert, groß, halbtransparent).
 * (Kompakt gehalten, damit dein Datei-/Zeilenlimit passt.)
 *
 * @param {HTMLElement} el - Overlay-Element.
 * @param {number} [opacity=0.4] - Deckkraft.
 * @returns {void}
 */
function applyOverlayStyle(el, opacity = 0.4) {
  el.style.cssText =
    "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);" +
    "font-size:100px;color:white;text-shadow:0 0 10px black;pointer-events:none;" +
    "user-select:none;transition:opacity .5s ease;z-index:9999;opacity:" + opacity + ";";
}

/**
 * Blendet ein Element nach kurzer Wartezeit aus und entfernt es anschließend.
 *
 * @param {HTMLElement} el - Element, das entfernt werden soll.
 * @param {number} waitMs - Wartezeit vor Fade-Out.
 * @param {number} fadeMs - Dauer (ungefähr) des Fade-Outs.
 * @param {Function} [onDone] - Callback nach dem Entfernen.
 * @returns {void}
 */
function fadeOutThenRemove(el, waitMs, fadeMs, onDone) {
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => { el.remove(); onDone?.(); }, fadeMs);
  }, waitMs);
}

/**
 * Entfernt ein Overlay per ID, falls es existiert.
 * @param {string} id
 * @returns {void}
 */
function removeOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

/**
 * "Shock"-Effekt nach dem Bodyguard-Landing:
 * - Character hüpft
 * - Endboss hüpft
 * - Nest und Corncob hüpfen
 * - Kamera-Pan in den Endbossbereich starten
 *
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
 * Lässt den Character kurz nach oben "bouncen".
 * @returns {void}
 */
function bounceCharacter() {
  if (!this.character) return;
  this.bounceY(this.character, 2, 4, 30, 8);
}

/**
 * Lässt den Endboss kurz nach oben "bouncen" und spielt Hurt-Animation.
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
 * Bouncet einen Gegner kurz und setzt ihn danach wieder exakt auf die ursprüngliche Y-Position.
 *
 * @param {MovableObject} enemy
 * @param {number} step - Schrittweite pro Tick (Pixel).
 * @param {number} repeats - Anzahl der Ticks.
 * @param {number} intervalMs - Tick-Intervall.
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
 * Lässt das ChickenNest kurz "bouncen".
 * @returns {void}
 */
function bounceChickenNest() {
  if (!this.chickenNest) return;
  const y = this.chickenNest.y;
  this.chickenNest.y -= 10;
  setTimeout(() => (this.chickenNest.y = y), 150);
}

/**
 * Lässt den Corncob kurz "bouncen".
 * @returns {void}
 */
function bounceCorncob() {
  if (!this.corncob) return;
  this.bounceY(this.corncob, 2, 4, 30, 0);
}

/**
 * Generische Bounce-Utility: Objekt wird mehrere Ticks nach oben bewegt und danach zurückgesetzt.
 *
 * @param {MovableObject} obj - Zielobjekt.
 * @param {number} step - Pixel nach oben pro Tick.
 * @param {number} repeats - Anzahl Ticks.
 * @param {number} intervalMs - Tick-Intervall.
 * @param {number} compensateDown - Zusätzliche Down-Korrektur am Ende (z.B. für Character).
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
