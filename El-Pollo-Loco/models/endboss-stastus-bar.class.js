class EndBossStatusBar extends DrawableObject {


  IMAGES = [
    'img/7_statusbars/2_statusbar_endboss/blue/blue0.png',
    'img/7_statusbars/2_statusbar_endboss/blue/blue20.png',
    'img/7_statusbars/2_statusbar_endboss/blue/blue40.png',
    'img/7_statusbars/2_statusbar_endboss/blue/blue60.png',
    'img/7_statusbars/2_statusbar_endboss/blue/blue80.png',
    'img/7_statusbars/2_statusbar_endboss/blue/blue100.png'
  ];

  percentage = 100; // Initial health percentage


  constructor() {
    super();
    this.loadImages(this.IMAGES);
    this.height = 60; // Height of the status bar
    this.width = 200; // Width of the status bar
    this.x = 4500; // Position on the x-axis
    this.y = 10; // Position on the y-axis 
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
}
