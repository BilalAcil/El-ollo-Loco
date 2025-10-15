class Cloud extends MovableObject {
  y = 20 + Math.random() * 50;
  width = 900;
  height = 300;

  constructor(x = 0) {
    super().loadImage('img/5_background/layers/4_clouds/1.png');
    this.x = x;
    this.speed = 0.2; // Falls noch nicht gesetzt
    this.animate();
  }

  animate() {
    this.moveLeft();
  }

  moveLeft() {
    setInterval(() => {
      this.x -= this.speed;
    }, 1000 / 60); // 60 FPS
  }
}