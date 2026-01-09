/**
 * @file models/status-bar.class.js
 * @description
 * Lebensanzeige (HP-Statusbar) für den Spieler. Unterstützt Health-Prozentanzeige
 * und ein grünes Blink-Feedback bei Heilung.
 */

/**
 * Statusbar für die Lebensenergie (Health) des Spielers.
 * Zeigt abhängig vom Prozentwert ein passendes Bild an und kann bei Heilung grün blinken.
 *
 * @class
 * @extends DrawableObject
 */
class StatusBar extends DrawableObject {
  /**
   * Bildpfade für die Health-Statusbar (blau 0–100 + grün 100 als Heal-Feedback).
   * Index-Zuordnung erfolgt über {@link resolveImageIndex}.
   * @type {string[]}
   */
  IMAGES = [
    'img/7_statusbars/1_statusbar/2_statusbar_health/blue/0.png',
    'img/7_statusbars/1_statusbar/2_statusbar_health/blue/20.png',
    'img/7_statusbars/1_statusbar/2_statusbar_health/blue/40.png',
    'img/7_statusbars/1_statusbar/2_statusbar_health/blue/60.png',
    'img/7_statusbars/1_statusbar/2_statusbar_health/blue/80.png',
    'img/7_statusbars/1_statusbar/2_statusbar_health/blue/100.png',
    'img/7_statusbars/1_statusbar/2_statusbar_health/green/100.png'
  ];

  /**
   * Aktueller Health-Wert in Prozent (0–100).
   * @type {number}
   */
  percentage = 100;

  /**
   * Referenz auf das aktuelle Blink-Interval (falls aktiv).
   * @type {number|null}
   */
  blinkInterval = null;

  /**
   * Erstellt die Statusbar, lädt die Images und setzt Standard-Position/Größe.
   */
  constructor() {
    super();

    this.loadImages(this.IMAGES);

    /** @type {number} */
    this.height = 60;

    /** @type {number} */
    this.width = 200;

    /** @type {number} */
    this.x = 20;

    /** @type {number} */
    this.y = 0;

    this.setPercentage(100);
  }

  /**
   * Setzt den Health-Prozentwert und aktualisiert das angezeigte Bild.
   * Hinweis: hier wird NICHT geklammert; der Aufrufer sollte bereits 0–100 liefern.
   *
   * @param {number} percentage - Neuer Health-Prozentwert (0–100).
   * @returns {void}
   */
  setPercentage(percentage) {
    this.percentage = percentage;
    const path = this.IMAGES[this.resolveImageIndex()];
    this.img = this.imageCache[path];
  }

  /**
   * Bestimmt den passenden Image-Index für den aktuellen {@link percentage}-Wert.
   *
   * @returns {number} Index in {@link IMAGES} (0–5).
   */
  resolveImageIndex() {
    if (this.percentage == 100) return 5;
    if (this.percentage >= 80) return 4;
    if (this.percentage >= 60) return 3;
    if (this.percentage >= 40) return 2;
    if (this.percentage >= 20) return 1;
    return 0;
  }

  /**
   * Lässt die Statusbar grün blinken, um Heilung anzuzeigen.
   * Startet den Blink-Loop neu, falls bereits einer läuft.
   *
   * @returns {void}
   */
  blinkFullHealth() {
    const images = this.getBlinkImages();
    this.resetBlink(images.normal);
    this.startBlinkLoop(images);
  }

  /**
   * Liefert die gecachten Image-Objekte für "normal" (blau 100) und "green" (grün 100).
   *
   * @returns {{ normal: HTMLImageElement, green: HTMLImageElement }}
   */
  getBlinkImages() {
    return {
      normal: this.imageCache['img/7_statusbars/1_statusbar/2_statusbar_health/blue/100.png'],
      green: this.imageCache['img/7_statusbars/1_statusbar/2_statusbar_health/green/100.png']
    };
  }

  /**
   * Stoppt ein ggf. laufendes Blink-Interval und setzt das Bild auf die normale Ansicht.
   *
   * @param {HTMLImageElement} normalImage - Das "normale" Image (blau 100).
   * @returns {void}
   */
  resetBlink(normalImage) {
    if (!this.blinkInterval) return;

    clearInterval(this.blinkInterval);
    this.blinkInterval = null;
    this.img = normalImage;
  }

  /**
   * Startet den Blink-Loop zwischen normal/grün.
   * Blinkt für eine definierte Anzahl an Umschaltungen.
   *
   * @param {{ normal: HTMLImageElement, green: HTMLImageElement }} images - Normal- und Grün-Image.
   * @returns {void}
   */
  startBlinkLoop({ normal, green }) {
    let blinkCount = 0;
    const totalBlinks = 8;

    this.blinkInterval = setInterval(() => {
      this.toggleBlinkImage(normal, green);

      // Wir zählen nur, wenn "grün" sichtbar ist => ein "Blink" pro Grün-Phase
      if (this.img === green) blinkCount++;
      if (blinkCount >= totalBlinks) this.finishBlink(normal);
    }, 300);
  }

  /**
   * Wechselt das aktuell angezeigte Bild zwischen normal und grün.
   *
   * @param {HTMLImageElement} normal - Normales Image (blau 100).
   * @param {HTMLImageElement} green - Grünes Image (grün 100).
   * @returns {void}
   */
  toggleBlinkImage(normal, green) {
    this.img = this.img === green ? normal : green;
  }

  /**
   * Beendet die Blink-Animation und stellt die normale Ansicht wieder her.
   *
   * @param {HTMLImageElement} normalImage - Normales Image (blau 100).
   * @returns {void}
   */
  finishBlink(normalImage) {
    clearInterval(this.blinkInterval);
    this.blinkInterval = null;
    this.img = normalImage;
  }

  /**
   * Stoppt ein laufendes Blinken sofort und setzt die Statusbar auf die normale Ansicht zurück.
   *
   * @returns {void}
   */
  stopBlink() {
    const normalImage =
      this.imageCache['img/7_statusbars/1_statusbar/2_statusbar_health/blue/100.png'];

    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
    }

    this.img = normalImage;
  }
}
