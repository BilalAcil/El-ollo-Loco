class StatusBarCoin extends DrawableObject {
  constructor() {
    super();
    this.imagePath = 'img/8_coin/coin_2.png';
    this.loadImage(this.imagePath);

    this.height = 110;      // Größe des Coins
    this.width = 110;
    this.x = -5;           // Position auf dem Bildschirm
    this.y = 10;

    this.coinCount = 0;    // Startwert
  }

  addCoin() {
    this.coinCount++;
  }

  draw(ctx) {
    // Zeichne das Coin-Bild
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);

    // Zeichne die Zahl daneben
    ctx.font = '30px "Comic Sans MS"';
    ctx.fillStyle = '#ffcc03';
    ctx.fillText(` ${this.coinCount}`, this.x + 70, this.y + 65);
  }
}
