let isMuted = false;
let canvas;
let world;
let keyboard = new Keyboard();
let gameInitialized = false;

/**
 * Wird ausgeführt, sobald DOM geladen ist.
 */
window.addEventListener("DOMContentLoaded", init);

/* =========================================================
   ✅ Mini-Helper (minimaler Patch, kein Verhaltens-Change)
   ========================================================= */

function show(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function hide(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function display(id, value) {
  const el = document.getElementById(id);
  if (el) el.style.display = value;
}

function resumeWorldAfterDelay(delay = 200) {
  setTimeout(() => {
    if (!world) return;

    // ✅ Ab jetzt dürfen Pause-/Play-Overlays erscheinen
    world.allowPauseOverlay = true;

    if (typeof world.resumeGame === 'function') {
      world.resumeGame();
    } else {
      world.isPaused = false;
    }
  }, delay);
}

function pauseWorldSilently() {
  if (!world) return;

  // ⏸️ direkt pausieren, damit nichts "losläuft", bevor der Spieler startet
  if (typeof world.pauseGame === 'function') {
    // 🔥 pausieren OHNE Pause-/Play-Symbol
    world.pauseGame(false);
  } else {
    world.isPaused = true;
  }
}

function areImagesLoaded() {
  return [...document.querySelectorAll('img')].every(img => img.complete);
}

function areClassesReady() {
  return (
    typeof World !== 'undefined' &&
    typeof level1 !== 'undefined' &&
    typeof Character !== 'undefined' &&
    typeof StatusBar !== 'undefined' &&
    typeof StatusBarCoin !== 'undefined' &&
    typeof StatusBarSalsa !== 'undefined'
  );
}

function isDrawableReady() {
  return typeof DrawableObject === 'undefined' || DrawableObject.areAllAssetsLoaded();
}

/* ========================================================= */

function init() {
  canvas = document.getElementById('canvas');

  if (!canvas) {
    console.error("❌ Canvas nicht gefunden!");
    return;
  }

  // Startscreen anzeigen, Spielbereich verstecken
  show('start-screen');
  hide('end-screen');
  display('canvas', 'none');
  display('game-name', 'none');
}

/**
 * Erzeugt einmalig die World, damit ALLE Assets (Pepe, Statusbars, Coins, etc.)
 * schon beim Laden der Seite vorgeladen werden.
 */
function preloadWorld() {
  if (gameInitialized) return; // nur einmal ausführen
  gameInitialized = true;

  canvas = document.getElementById('canvas');
  if (!canvas) {
    console.error('❌ Canvas nicht gefunden (preloadWorld)!');
    return;
  }

  // ⬇️ deine bisherige Spiel-Initialisierung
  startGameLogic();            // erstellt world = new World(...)

  // ⏸️ direkt pausieren, damit nichts "losläuft", bevor der Spieler startet
  pauseWorldSilently();
}

/**
 * Startet das Spiel, wenn "Spielen" gedrückt wird.
 */
function startGame() {
  display('game-name', 'block');
  hide('start-screen');
  display('canvas', 'block');
  hide('end-screen');

  // 📱 Mobile-Controls NUR auf kleinen Bildschirmen im Querformat aktivieren
  const mobileControls = document.querySelector('.mobile-controls');
  if (mobileControls) {
    const isSmallScreen = window.innerWidth <= 1366;
    const isLandscape = window.innerWidth > window.innerHeight;

    if (isSmallScreen && isLandscape) {
      mobileControls.classList.add('active');
    } else {
      mobileControls.classList.remove('active');
    }
  }

  resumeWorldAfterDelay(200);
}

/**
 * Anleitung öffnen/schließen
 */
function openInstructions() {
  document.getElementById('instructions').classList.remove('hidden');
}
function closeInstructions() {
  document.getElementById('instructions').classList.add('hidden');
}

function applyMuteState(muted) {
  // globale Variable updaten
  isMuted = muted;

  // Button-Text setzen
  const btn = document.getElementById('mute-btn');
  if (btn) {
    btn.textContent = muted ? '🔈 Ton an' : '🔊 Ton aus';
  }

  // global alle Audio-Objekte muten / entmuten
  if (typeof setGlobalMute === 'function') {
    setGlobalMute(muted);
  }

  // optional den Zustand auch in der World merken
  if (world) {
    world.isMuted = muted;
  }

  // 💾 Zustand im Local Storage speichern
  try {
    localStorage.setItem('elPolloMute', muted ? '1' : '0');
  } catch (e) {
    console.warn('Konnte Mute-Status nicht in localStorage speichern:', e);
  }
}

function restoreMuteFromStorage() {
  try {
    const stored = localStorage.getItem('elPolloMute');
    const muted = stored === '1';   // '1' = stumm, alles andere = nicht stumm
    applyMuteState(muted);          // setzt Button-Text + globales Mute
  } catch (e) {
    console.warn('Konnte Mute-Status nicht aus localStorage lesen:', e);
    applyMuteState(false);          // Fallback: Ton an
  }
}

/**
 * Ton an/aus
 */
function toggleMute() {
  const newState = !isMuted;
  applyMuteState(newState);
}

/**
 * Zeigt den Endscreen an (wird vom Spiel aufgerufen)
 * @param {boolean} win - true = gewonnen, false = verloren
 */
function showEndScreen(win) {
  // ❗ Daten zuerst retten, bevor die Welt zerstört / gestoppt wird
  const coinCount = world?.statusBarCoin?.coinCount ?? 0;
  const salsaCount = world?.statusBarSalsa?.salsaCount ?? 0;

  // Spiel stoppen (Bewegungen/Intervalle etc.)
  if (typeof stopGame === 'function') {
    stopGame();
  }

  const endScreen = document.getElementById('end-screen');
  if (!endScreen) {
    console.error('❌ end-screen nicht gefunden!');
    return;
  }

  const buttonContainer = endScreen.querySelector('.menu-box');
  if (!buttonContainer) {
    console.error('❌ .menu-box im end-screen nicht gefunden!');
    return;
  }

  // 🧩 Sicherstellen, dass stats-box existiert
  let statsBox = document.getElementById('stats-box');
  if (!statsBox) {
    statsBox = document.createElement('div');
    statsBox.id = 'stats-box';
    statsBox.classList.add('hidden');
    buttonContainer.appendChild(statsBox);
  }

  // 🧹 StatsBox am Anfang immer leeren
  statsBox.innerHTML = "";

  // Canvas + Titel ausblenden
  const canvasEl = document.getElementById('canvas');
  const titleEl = document.getElementById('game-name');
  if (canvasEl) canvasEl.style.display = 'none';
  if (titleEl) titleEl.style.display = 'none';

  if (win) {
    // 🏆 Gewinnscreen
    buttonContainer.innerHTML = `
      <h2 id="end-message">🪇 Du hast die Maracas zurückgeholt! 🪇</h2>
      <button onclick="nextLevel()">🎸 Gitarre holen</button>
      <button onclick="returnToHome()">🏠 Zurück zum Start</button>
    `;

    // statsBox wieder anhängen + füllen
    statsBox.innerHTML = `
      <p><span class="stats-coin">🪙 <b>${coinCount}</b>x</span></p>
      <p><span class="stats-salsa">🌶️ <b>${salsaCount}</b>x</span></p>
    `;
    statsBox.classList.remove('hidden');
    buttonContainer.appendChild(statsBox);

  } else {
    // 💀 Verloren-Screen
    buttonContainer.innerHTML = `
      <h2 id="end-message">💀 Du hast verloren!</h2>
      <button onclick="restartGame()">🔁 Nochmal spielen</button>
      <button onclick="returnToHome()">🏠 Zurück zum Start</button>
    `;

    statsBox.classList.add('hidden'); // hier keine Stats anzeigen
  }

  endScreen.classList.remove('hidden');
}

/**
 * Spiel neu starten
 */
function restartGame() {
  // 🔧 Sicherstellen, dass Canvas-Referenz stimmt
  canvas = document.getElementById('canvas');

  // 🛑 Alte Welt stoppen (falls stopGame existiert)
  if (typeof stopGame === 'function') {
    stopGame(); // ruft intern vermutlich world.stop()/pauseAllMovements()
  }

  // Referenz auf alte World löschen
  world = null;

  // 🧼 Preload-Flag zurücksetzen, damit preloadWorld erneut eine neue World erzeugt
  gameInitialized = false;

  // 🧠 stats-box aufräumen / neu initialisieren
  const oldStatsBox = document.getElementById('stats-box');
  if (oldStatsBox) {
    oldStatsBox.innerHTML = '';
    oldStatsBox.classList.add('hidden');
  }

  // ENDSCREEN ausblenden, Canvas & Titel wieder zeigen
  hide('end-screen');
  display('canvas', 'block');
  display('game-name', 'block');

  // 🌍 Neue World erzeugen (wie beim ersten Laden)
  preloadWorld(); // erstellt world = new World(canvas, keyboard) und pausiert sie

  // ⏯️ Kurz warten, dann Spiel wirklich starten
  resumeWorldAfterDelay(200);
}

function nextLevel() {
  alert("Level 2: Hol dir die Gitarre! (noch in Arbeit 😎)");
}

/**
 * Zurück zum Startscreen
 */
function returnToHome() {
  stopGame();

  // Musik & Timer anhalten (zur Sicherheit)
  if (world && world.countdown) {
    world.countdown.stopCountdown();
  }

  // Endscreen ausblenden (optional – Seite lädt gleich neu)
  hide('end-screen');
  display('canvas', 'none');
  display('game-name', 'none');
  hide('start-screen');

  // 🔄 Seite komplett neu laden
  location.reload();
}

/**
 * Mobile-Touch-Buttons mit der Keyboard-Steuerung verbinden
 */
function setupMobileControls() {
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnJump = document.getElementById('btn-jump');
  const btnThrow = document.getElementById('btn-throw');

  // Falls wir z.B. am Desktop oder im HTML noch keine Buttons haben → einfach abbrechen
  if (!btnLeft || !btnRight || !btnJump || !btnThrow) {
    return;
  }

  // 👉 HIER: Kontextmenü & Textauswahl auf den Buttons deaktivieren
  [btnLeft, btnRight, btnJump, btnThrow].forEach(btn => {
    // Rechtsklick / Long-Press Kontextmenü verhindern
    btn.addEventListener('contextmenu', (e) => e.preventDefault());

    // optional: keine Text-Selektion (falls Browser das zulässt)
    btn.style.userSelect = 'none';
    btn.style.webkitUserSelect = 'none';
    btn.style.msUserSelect = 'none';
  });

  /**
   * Hilfsfunktion: setzt ein bestimmtes Keyboard-Flag
   */
  const pressKey = (keyName) => {
    if (!keyboard) return;
    keyboard[keyName] = true;
  };

  const releaseKey = (keyName) => {
    if (!keyboard) return;
    keyboard[keyName] = false;
  };

  /**
   * Pointer-Events für ein Button-Element registrieren
   * keyName ist z.B. "LEFT", "RIGHT", "SPACE", "D"
   */
  const bindButtonToKey = (button, keyName) => {
    // gedrückt halten = Bewegung dauerhaft
    button.addEventListener('pointerdown', (e) => {
      e.preventDefault();          // verhindert ungewolltes Scrollen / Fokus
      pressKey(keyName);
    });

    // loslassen → Bewegung stoppen
    button.addEventListener('pointerup', (e) => {
      e.preventDefault();
      releaseKey(keyName);
    });

    // Finger vom Button runterziehen → auch stoppen
    button.addEventListener('pointerleave', () => {
      releaseKey(keyName);
    });

    button.addEventListener('pointercancel', () => {
      releaseKey(keyName);
    });
  };

  // Zuordnungen
  bindButtonToKey(btnLeft, 'LEFT');
  bindButtonToKey(btnRight, 'RIGHT');
  bindButtonToKey(btnJump, 'SPACE');
  bindButtonToKey(btnThrow, 'D');
}

/**
 * Warten, bis Browser + Spiel intern vollständig geladen sind
 */
window.addEventListener('load', async () => {
  // 🔊 1. Mute-Status aus Local Storage holen und anwenden
  restoreMuteFromStorage();

  // 📱 Mobile-Touch-Buttons mit Keyboard koppeln
  setupMobileControls();

  // 🔥 Welt + alle Objekte (Pepe, Statusbars, Coins, etc.) ERZEUGEN
  preloadWorld();

  // 🔥 jetzt lädt DrawableObject alle Bilder dieser Objekte
  await waitForGameAssets();

  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.classList.remove('loading', 'hidden');
    startBtn.removeAttribute('disabled');
    startBtn.textContent = '🎮 Spiel starten';
    startBtn.onclick = startGame;
  }
});

/**
 * Prüft in Intervallen, ob Spielressourcen geladen sind
 */
async function waitForGameAssets() {
  const startTime = Date.now();
  const timeout = 20000; // maximal 20 Sekunden warten

  return new Promise(resolve => {
    const check = setInterval(() => {
      const assetsReady =
        areClassesReady() &&
        areImagesLoaded() &&
        isDrawableReady();

      if (assetsReady || Date.now() - startTime > timeout) {
        clearInterval(check);
        resolve();
      }
    }, 200);
  });
}
