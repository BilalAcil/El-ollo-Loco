class Corncob extends MovableObject {
  height = 80;
  width = 60;
  y = 350;

  IMAGE = 'img/12_corncob/corncob.png';

  constructor() {
    super();
    this.loadImage(this.IMAGE);
    this.x = 3800
  }
}