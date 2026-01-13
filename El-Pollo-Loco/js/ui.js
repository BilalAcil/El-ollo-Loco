/**
 * @file ui.js
 * @description
 * UI- und DOM-Helfer für das Spiel:
 * - Globaler GameState (Mute, Canvas, World, Keyboard, Init-Flag)
 * - DOM Utilities (show/hide/display)
 * - Anleitung (Instructions) öffnen/schließen
 * - Globales Mute inkl. localStorage Persistenz
 * - Endscreen Rendering inkl. Stats
 * - Mobile Controls (Touch-Buttons -> Keyboard Flags)
 * - Asset-Waiter (wartet bis Klassen/Images/DrawableObject bereit sind)
 *
 * Exporte nach window:
 * - show/hide/display
 * - toggleMute/restoreMuteFromStorage
 * - openInstructions/closeInstructions
 * - showEndScreen/setupMobileControls/waitForGameAssets
 */

window.GameState = window.GameState || {
  isMuted: false,
  canvas: null,
  world: null,
  keyboard: new Keyboard(),
  gameInitialized: false,
};

// ---------- DOM ----------
/**
 * Shortcut: findet ein Element per ID.
 * @param {string} id - Element-ID.
 * @returns {HTMLElement|null} Das Element oder null.
 */
function el(id) { return document.getElementById(id); }

/**
 * Zeigt ein Element, indem die CSS-Klasse "hidden" entfernt wird.
 * @param {string} id - Element-ID.
 * @returns {void}
 */
function show(id) { const n = el(id); if (n) n.classList.remove('hidden'); }

/**
 * Versteckt ein Element, indem die CSS-Klasse "hidden" hinzugefügt wird.
 * @param {string} id - Element-ID.
 * @returns {void}
 */
function hide(id) { const n = el(id); if (n) n.classList.add('hidden'); }

/**
 * Setzt die CSS-display-Eigenschaft eines Elements.
 * @param {string} id - Element-ID.
 * @param {string} value - Display-Wert (z.B. "none", "block").
 * @returns {void}
 */
function display(id, value) { const n = el(id); if (n) n.style.display = value; }

// ---------- Instructions ----------
/**
 * Öffnet das Instructions-Overlay.
 * @returns {void}
 */
function openInstructions() { el('instructions')?.classList.remove('hidden'); }

/**
 * Schließt das Instructions-Overlay.
 * @returns {void}
 */
function closeInstructions() { el('instructions')?.classList.add('hidden'); }

// ---------- Mute ----------
/**
 * Toggelt den Mute-Status des Spiels.
 * @returns {void}
 */
function toggleMute() { applyMuteState(!GameState.isMuted); }

/**
 * Stellt den Mute-Status aus localStorage wieder her.
 * Fallback: Ton an, wenn Lesen fehlschlägt.
 * @returns {void}
 */
function restoreMuteFromStorage() {
  try { applyMuteState(localStorage.getItem('elPolloMute') === '1'); }
  catch (e) { console.warn('Mute restore failed:', e); applyMuteState(false); }
}

/**
 * Wendet den Mute-Status überall an: UI-Button, globales Audio, World-State, Persistenz.
 * @param {boolean} muted - True = stumm, false = Ton an.
 * @returns {void}
 */
function applyMuteState(muted) {
  GameState.isMuted = muted;
  updateMuteButtonText(muted);
  applyGlobalMute(muted);
  syncWorldMute(muted);
  saveMuteToStorage(muted);
  const mb = el('btn-mute');
  if (mb) updateMobileMuteIcon(mb);
}

/**
 * Aktualisiert den Text des Mute-Buttons.
 * @param {boolean} muted - True = stumm, false = Ton an.
 * @returns {void}
 */
function updateMuteButtonText(muted) {
  const btn = el('mute-btn');
  if (btn) btn.textContent = muted ? '🔈 Ton an' : '🔊 Ton aus';
}

/**
 * Setzt globalen Mute (falls Audio-Manager vorhanden).
 * @param {boolean} muted - True = stumm, false = Ton an.
 * @returns {void}
 */
function applyGlobalMute(muted) { if (typeof setGlobalMute === 'function') setGlobalMute(muted); }

/**
 * Synchronisiert Mute-Status in die World, falls vorhanden.
 * @param {boolean} muted - True = stumm, false = Ton an.
 * @returns {void}
 */
function syncWorldMute(muted) { if (GameState.world) GameState.world.isMuted = muted; }

/**
 * Speichert den Mute-Status in localStorage.
 * @param {boolean} muted - True = stumm, false = Ton an.
 * @returns {void}
 */
function saveMuteToStorage(muted) {
  try { localStorage.setItem('elPolloMute', muted ? '1' : '0'); }
  catch (e) { console.warn('Mute save failed:', e); }
}

// ---------- Endscreen ----------
/**
 * Zeigt den Endscreen an und rendert je nach Ergebnis (win/lose).
 * @param {boolean} win - True = gewonnen, false = verloren.
 * @returns {void}
 */
function showEndScreen(win) {
  stopGameIfAvailable();
  const refs = getEndScreenRefs();
  if (!refs) return;

  const stats = getEndStats();
  const statsBox = ensureStatsBox(refs.buttonContainer);

  hideGameCanvasAndTitle();
  renderEndScreen(refs.buttonContainer, statsBox, stats, win);
  refs.endScreen.classList.remove('hidden');
}

/**
 * Stoppt das Spiel, falls stopGame global verfügbar ist.
 * @returns {void}
 */
function stopGameIfAvailable() { if (typeof stopGame === 'function') stopGame(); }

/**
 * Liest aktuelle End-Statistiken aus der World.
 * @returns {{coinCount:number, salsaCount:number}} Stats-Objekt.
 */
function getEndStats() {
  return {
    coinCount: GameState.world?.statusBarCoin?.coinCount ?? 0,
    salsaCount: GameState.world?.statusBarSalsa?.salsaCount ?? 0,
  };
}

/**
 * Holt Referenzen auf Endscreen und Button-Container.
 * @returns {{endScreen: HTMLElement, buttonContainer: Element}|undefined} Referenzen oder undefined bei Fehler.
 */
function getEndScreenRefs() {
  const endScreen = el('end-screen');
  const buttonContainer = endScreen?.querySelector('.menu-box');
  if (!endScreen) return console.error('❌ end-screen nicht gefunden!');
  if (!buttonContainer) return console.error('❌ .menu-box nicht gefunden!');
  return { endScreen, buttonContainer };
}

/**
 * Stellt sicher, dass die Stats-Box existiert (erstellt sie wenn nötig).
 * @param {Element} buttonContainer - Container im Endscreen.
 * @returns {HTMLElement} Stats-Box Element.
 */
function ensureStatsBox(buttonContainer) {
  let box = el('stats-box');
  if (box) return box;

  box = document.createElement('div');
  box.id = 'stats-box';
  box.classList.add('hidden');
  buttonContainer.appendChild(box);
  return box;
}

/**
 * Blendet Canvas und Titel aus (wird im Endscreen benötigt).
 * @returns {void}
 */
function hideGameCanvasAndTitle() {
  const c = el('canvas');
  const t = el('game-name');
  if (c) c.style.display = 'none';
  if (t) t.style.display = 'none';
}

/**
 * Rendert den Endscreen (Buttons + Stats).
 * @param {Element} container - Button-Container im Endscreen.
 * @param {HTMLElement} statsBox - Stats-Box Element.
 * @param {{coinCount:number, salsaCount:number}} stats - Stats.
 * @param {boolean} win - True = gewonnen.
 * @returns {void}
 */
function renderEndScreen(container, statsBox, stats, win) {
  container.innerHTML = win ? winHtml() : loseHtml();
  statsBox.innerHTML = win ? statsHtml(stats) : '';
  statsBox.classList.toggle('hidden', !win);
  container.appendChild(statsBox);
}

/**
 * HTML für Sieg-Endscreen.
 * @returns {string} HTML-String.
 */
function winHtml() {
  return `<h2 id="end-message">🪇 Du hast die Maracas zurückgeholt! 🪇</h2>
  <button onclick="nextLevel()">🎸 Gitarre holen</button>
  <button onclick="returnToHome()">🏠 Zurück zum Start</button>`;
}

/**
 * HTML für Niederlage-Endscreen.
 * @returns {string} HTML-String.
 */
function loseHtml() {
  return `<h2 id="end-message">💀 Du hast verloren!</h2>
  <button onclick="restartGame()">🔁 Nochmal spielen</button>
  <button onclick="returnToHome()">🏠 Zurück zum Start</button>`;
}

/**
 * HTML für Stats-Box.
 * @param {{coinCount:number, salsaCount:number}} stats - Stats.
 * @returns {string} HTML-String.
 */
function statsHtml(stats) {
  return `<p><span class="stats-coin">🪙 <b>${stats.coinCount}</b>x</span></p>
  <p><span class="stats-salsa">🌶️ <b>${stats.salsaCount}</b>x</span></p>`;
}

// ---------- Mobile Controls ----------
/**
 * Richtet Mobile Touch Controls ein (Buttons setzen Keyboard-Flags).
 * @returns {void}
 */
function getMobileButtons() {
  return {
    left: el('btn-left'),
    right: el('btn-right'),
    jump: el('btn-jump'),
    throw: el('btn-throw'),
    mute: el('btn-mute'),
  };
}

/**
 * Holt Referenzen auf alle Mobile-Buttons.
 * @returns {{left:(HTMLElement|null), right:(HTMLElement|null), jump:(HTMLElement|null), throw:(HTMLElement|null)}}
 */

/**
 * Prüft, ob alle Buttons vorhanden sind.
 * @param {{left:HTMLElement=, right:HTMLElement=, jump:HTMLElement=, throw:HTMLElement=}} b - Button-Refs.
 * @returns {boolean} True, wenn alle existieren.
 */
function hasAllMobileButtons(b) { return b.left && b.right && b.jump && b.throw; }

/**
 * Gibt alle Buttons als Array zurück.
 * @param {{left:HTMLElement=, right:HTMLElement=, jump:HTMLElement=, throw:HTMLElement=}} b - Button-Refs.
 * @returns {HTMLElement[]} Array aller Buttons.
 */
function getAllButtons(b) {
  return [b.left, b.right, b.jump, b.throw, b.mute].filter(Boolean);
}

/**
 * Deaktiviert Contextmenu und Text-Selektion auf einem Button.
 * @param {HTMLElement} button - Button Element.
 * @returns {void}
 */
function disableButtonContextAndSelection(button) {
  button.addEventListener('contextmenu', e => e.preventDefault());
  button.style.userSelect = 'none';
  button.style.webkitUserSelect = 'none';
  button.style.msUserSelect = 'none';
}

/**
 * Bindet Pointer-Events eines Buttons an ein Keyboard-Flag.
 * @param {HTMLElement} button - Button Element.
 * @param {string} keyName - Keyboard-Flag (z.B. "LEFT", "SPACE").
 * @returns {void}
 */
function bindButtonToKey(button, keyName) {
  button.addEventListener('pointerdown', e => setKeyFlag(e, keyName, true));
  button.addEventListener('pointerup', e => setKeyFlag(e, keyName, false));
  button.addEventListener('pointerleave', () => (GameState.keyboard[keyName] = false));
  button.addEventListener('pointercancel', () => (GameState.keyboard[keyName] = false));
}

function setupMobileControls() {
  const btns = getMobileButtons();
  if (!hasAllMobileButtons(btns)) return;

  getAllButtons(btns).forEach(disableButtonContextAndSelection);

  bindButtonToKey(btns.left, 'LEFT');
  bindButtonToKey(btns.right, 'RIGHT');
  bindButtonToKey(btns.jump, 'SPACE');
  bindButtonToKey(btns.throw, 'D');

  // NEU: Mute Toggle (Click reicht)
  if (btns.mute) {
    updateMobileMuteIcon(btns.mute);
    btns.mute.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMute();
      updateMobileMuteIcon(btns.mute);
    });
  }
}

function updateMobileMuteIcon(btn) {
  btn.textContent = GameState.isMuted ? '🔇' : '🔊';
  btn.setAttribute('aria-pressed', String(GameState.isMuted));
  btn.title = GameState.isMuted ? 'Ton an' : 'Ton aus';
}

/**
 * Setzt ein Keyboard-Flag im GameState.
 * @param {PointerEvent} e - Pointer-Event.
 * @param {string} keyName - Keyboard-Flag.
 * @param {boolean} isDown - True = gedrückt, false = losgelassen.
 * @returns {void}
 */
function setKeyFlag(e, keyName, isDown) {
  e.preventDefault();
  GameState.keyboard[keyName] = isDown;
}

// ---------- Assets ----------
/**
 * Wartet, bis Spiel-Assets geladen sind (oder Timeout).
 * @returns {Promise<void>} Promise resolved, wenn bereit oder Timeout erreicht.
 */
function waitForGameAssets() {
  const start = Date.now();
  return new Promise(resolve => pollAssets(resolve, start, 20000));
}

/**
 * Pollt in Intervallen, ob Assets bereit sind.
 * @param {function(): void} resolve - Promise-Resolve.
 * @param {number} start - Startzeit (ms).
 * @param {number} timeout - Timeout (ms).
 * @returns {void}
 */
function pollAssets(resolve, start, timeout) {
  const id = setInterval(() => {
    if (assetsReadyNow() || Date.now() - start > timeout) { clearInterval(id); resolve(); }
  }, 200);
}

/**
 * Kombinierte Prüfung, ob Assets bereit sind.
 * @returns {boolean} True, wenn ready.
 */
function assetsReadyNow() { return classesReady() && imagesLoaded() && drawableReady(); }

/**
 * Prüft, ob alle <img> Tags vollständig geladen sind.
 * @returns {boolean} True, wenn alle complete sind.
 */
function imagesLoaded() { return [...document.querySelectorAll('img')].every(img => img.complete); }

/**
 * Prüft, ob Kern-Klassen/Globals existieren.
 * @returns {boolean} True, wenn alles vorhanden ist.
 */
function classesReady() {
  return typeof World !== 'undefined' &&
    typeof level1 !== 'undefined' &&
    typeof Character !== 'undefined' &&
    typeof StatusBar !== 'undefined' &&
    typeof StatusBarCoin !== 'undefined' &&
    typeof StatusBarSalsa !== 'undefined';
}

/**
 * Prüft, ob DrawableObject-Assets geladen sind (falls Klasse vorhanden).
 * @returns {boolean} True, wenn bereit.
 */
function drawableReady() {
  return typeof DrawableObject === 'undefined' || DrawableObject.areAllAssetsLoaded();
}

// ---------- Expose (for HTML + game.js) ----------
window.show = show;
window.hide = hide;
window.display = display;

window.toggleMute = toggleMute;
window.restoreMuteFromStorage = restoreMuteFromStorage;

window.openInstructions = openInstructions;
window.closeInstructions = closeInstructions;

window.showEndScreen = showEndScreen;
window.setupMobileControls = setupMobileControls;
window.waitForGameAssets = waitForGameAssets;
