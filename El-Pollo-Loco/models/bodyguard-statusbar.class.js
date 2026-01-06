class BodyguardStatusBar extends DrawableObject {
  IMAGES = [
    'img/7_statusbars/3_statusbar_Bodyguard/orange0.png',
    'img/7_statusbars/3_statusbar_Bodyguard/orange20.png',
    'img/7_statusbars/3_statusbar_Bodyguard/orange40.png',
    'img/7_statusbars/3_statusbar_Bodyguard/orange60.png',
    'img/7_statusbars/3_statusbar_Bodyguard/orange80.png',
    'img/7_statusbars/3_statusbar_Bodyguard/orange100.png'
  ];

  percentage = 100;
  world;

  constructor(world) {
    super();
    this.world = world; // 🔗 Welt-Referenz speichern
    this.loadImages(this.IMAGES);
    this.height = 60;
    this.width = 200;
    this.x = 4260;
    this.y = 10;
    this.setPercentage(100);
  }

  draw(ctx) {
    if (this.fixed) {
      ctx.save();
      ctx.translate(-this.world.camera_x, 0); // Kamerabewegung rückgängig machen
      super.draw(ctx);                        // ✅ JETZT wird auch wirklich gezeichnet
      ctx.restore();
      return;
    }

    super.draw(ctx);
  }

  setPercentage(percentage) {
    this.percentage = Math.max(0, percentage); // niemals negativ
    const path = this.IMAGES[this.resolveImageIndex()];
    this.img = this.imageCache[path];

    // 🧨 Prüfen, ob der Boss tot ist → Statusbar entfernen
    if (this.percentage <= 0) {
      this.removeFromWorld();
      return;
    }
  }

  removeFromWorld() {
    this.world.bodyguardStatus = null; // Ganz sauber
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
      return 0;
    }
  }
}
