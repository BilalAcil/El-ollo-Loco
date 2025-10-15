class Coin extends MovableObject {
  height = 40;
  width = 40;
  y = 400;

  IMAGE = 'img/8_coin/coin_1.png';

  constructor(x, y) {
    super();
    this.loadImage(this.IMAGE);
    this.x = x;
    this.y = y || 400; // Standardhöhe, falls keine angegeben
  }
}
