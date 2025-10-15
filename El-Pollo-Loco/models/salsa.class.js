class Salsa extends MovableObject {
  height = 60;
  width = 40;
  y = 400;

  IMAGES = [
    'img/6_salsa_bottle/1_salsa_bottle_on_ground.png',
    'img/6_salsa_bottle/2_salsa_bottle_on_ground.png'
  ];

  constructor(x, y) {
    super();
    this.loadImage(this.IMAGES[0]); // Erstes Bild laden
    this.x = x;
    this.y = y || 400;
  }
}
