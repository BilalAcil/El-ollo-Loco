class ChickenSmall extends MovableObject {

  y = 375;
  height = 50;
  width = 40;
  isDead = false; // Neue Eigenschaft
  IMAGES_WALKING = [
    'img/3_enemies_chicken/chicken_small/1_walk/1_w.png',
    'img/3_enemies_chicken/chicken_small/1_walk/2_w.png',
    'img/3_enemies_chicken/chicken_small/1_walk/3_w.png'
  ];

  IMAGE_DEAD = 'img/3_enemies_chicken/chicken_small/2_dead/dead.png';

  constructor() {
    super().loadImage('img/3_enemies_chicken/chicken_small/1_walk/1_w.png');
    this.loadImages(this.IMAGES_WALKING);

    this.x = 500 + Math.random() * 4000; // Random x position
    this.speed = 0.15 + Math.random() * 0.2; // Random speed between 0.15 and 0.35
    // this.speed = 0.5 + Math.random() * 0.3; // Faster speed for small chickens

    this.animate();
  }

  animate() {
    // Bewegung nur wenn nicht tot
    setInterval(() => {
      if (!this.isDead) {
        this.moveLeft();
      }
    }, 1000 / 60);

    // Animation nur wenn nicht tot
    setInterval(() => {
      if (!this.isDead) {
        this.playAnimation(this.IMAGES_WALKING);
      }
    }, 200);
  }
}