class Endboss extends MovableObject {

  height = 170;
  width = 130;
  y = 260;

  IMAGES_WALKING = [
    'img/4_enemie_boss_chicken/2_alert/G5.png',
    'img/4_enemie_boss_chicken/2_alert/G6.png',
    'img/4_enemie_boss_chicken/2_alert/G7.png',
    'img/4_enemie_boss_chicken/2_alert/G8.png',
    'img/4_enemie_boss_chicken/2_alert/G9.png',
    'img/4_enemie_boss_chicken/2_alert/G10.png',
    'img/4_enemie_boss_chicken/2_alert/G11.png',
    'img/4_enemie_boss_chicken/2_alert/G12.png'
  ];

  constructor() {
    super().loadImage(this.IMAGES_WALKING[0]);
    this.loadImages(this.IMAGES_WALKING);
    this.x = 4500; // Initial x position
    this.animate();
  }

  animate() {
    setInterval(() => {
      this.playAnimation(this.IMAGES_WALKING);
    }, 200);
  }

  // HIER kommt die Kollisionsbox für den Endboss
  get collisionBox() {
    return {
      x: this.x,
      y: this.y + 30, // Hitbox 30 Pixel nach unten verschieben
      width: this.width,
      height: this.height - 30 // Höhe um 30 Pixel reduzieren
    };
  }

  // Und die drawFrame Methode anpassen
  drawFrame(ctx) {
    if (this instanceof Endboss) {
      const box = this.collisionBox;
      ctx.beginPath();
      ctx.lineWidth = "1";
      ctx.strokeStyle = "red";
      // Relative Position zur Hitbox zeichnen
      ctx.rect(box.x - this.x, box.y - this.y, box.width, box.height);
      ctx.stroke();
    }
  }
}