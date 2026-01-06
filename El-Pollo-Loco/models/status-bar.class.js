class StatusBar extends DrawableObject {

  IMAGES = [
    'img/7_statusbars/1_statusbar/2_statusbar_health/blue/0.png',
    'img/7_statusbars/1_statusbar/2_statusbar_health/blue/20.png',
    'img/7_statusbars/1_statusbar/2_statusbar_health/blue/40.png',
    'img/7_statusbars/1_statusbar/2_statusbar_health/blue/60.png',
    'img/7_statusbars/1_statusbar/2_statusbar_health/blue/80.png',
    'img/7_statusbars/1_statusbar/2_statusbar_health/blue/100.png',
    'img/7_statusbars/1_statusbar/2_statusbar_health/green/100.png'
  ];

  percentage = 100; // Initial health percentage
  blinkInterval = null;   // ⬅️ NEU – Referenz zum Interval speichern

  constructor() {
    super();
    this.loadImages(this.IMAGES);
    this.height = 60; // Height of the status bar
    this.width = 200; // Width of the status bar
    this.x = 20; // Position on the x-axis
    this.y = 0; // Position on the y-axis 
    this.setPercentage(100); // Set initial health to 100%
  }

  setPercentage(percentage) {
    this.percentage = percentage; // => 0...5
    let path = this.IMAGES[this.resolveImageIndex()];
    this.img = this.imageCache[path];
  }

  resolveImageIndex() {
    if (this.percentage == 100) {
      return 5;
    } else if (this.percentage >= 80) {
      return 4;
    } else if (this.percentage >= 60) {
      return 3;
    } else if (this.percentage >= 40) {
      return 2;
    } else if (this.percentage >= 20) {
      return 1;
    } else {
      return 0; // => 0...5
    }
  }

  /**
 * Lässt die Statusbar 3x grün blinken, um Heilung anzuzeigen.
 */
  blinkFullHealth() {
    const images = this.getBlinkImages();
    this.resetBlink(images.normal);
    this.startBlinkLoop(images);
  }

  getBlinkImages() {
    return {
      normal: this.imageCache['img/7_statusbars/1_statusbar/2_statusbar_health/blue/100.png'],
      green: this.imageCache['img/7_statusbars/1_statusbar/2_statusbar_health/green/100.png']
    };
  }

  resetBlink(normalImage) {
    if (!this.blinkInterval) return;
    clearInterval(this.blinkInterval);
    this.blinkInterval = null;
    this.img = normalImage;
  }

  startBlinkLoop({ normal, green }) {
    let blinkCount = 0;
    const totalBlinks = 8;

    this.blinkInterval = setInterval(() => {
      this.toggleBlinkImage(normal, green);
      if (this.img === green) blinkCount++;
      if (blinkCount >= totalBlinks) this.finishBlink(normal);
    }, 300);
  }

  toggleBlinkImage(normal, green) {
    this.img = this.img === green ? normal : green;
  }

  finishBlink(normalImage) {
    clearInterval(this.blinkInterval);
    this.blinkInterval = null;
    this.img = normalImage;
  }

  // 🆕 NEU:  SOFORT STOPPEN!
  stopBlink() {
    const normalImage = this.imageCache['img/7_statusbars/1_statusbar/2_statusbar_health/blue/100.png'];

    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
    }

    this.img = normalImage;  // zurück zur normalen Ansicht
  }
}

