class StatusBarSalsa extends DrawableObject {
  constructor() {
    super();
    this.imagePath = 'img/6_salsa_bottle/salsa_bottle.png';
    this.loadImage(this.imagePath);

    this.height = 50;
    this.width = 80;
    this.x = 55;
    this.y = 25;
    this.salsaCount = 0; // Besserer Name
  }

  addSalsa() {
    this.salsaCount++;
  }

  draw(ctx) {
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);

    ctx.font = '30px "Comic Sans MS"';
    ctx.fillStyle = '#bf0000';
    ctx.fillText(` ${this.salsaCount}`, this.x + 45, this.y + 35);
  }
}
