class ChickenSmall extends MovableObject {

  y = 375;
  height = 50;
  width = 40;
  isDead = false;

  moveInterval = null;
  animationInterval = null;

  IMAGES_WALKING = [
    'img/3_enemies_chicken/chicken_small/1_walk/1_w.png',
    'img/3_enemies_chicken/chicken_small/1_walk/2_w.png',
    'img/3_enemies_chicken/chicken_small/1_walk/3_w.png'
  ];

  IMAGE_DEAD = 'img/3_enemies_chicken/chicken_small/2_dead/dead.png';

  constructor() {
    super().loadImage('img/3_enemies_chicken/chicken_small/1_walk/1_w.png');
    this.loadImages(this.IMAGES_WALKING);

    this.x = 500 + Math.random() * 3500;
    this.speed = 0.15 + Math.random() * 0.2;

    this.animate();
  }

  animate() {
    // 🟢 Bewegung starten und merken
    this.moveInterval = setInterval(() => {
      if (this.isDead) return;
      if (this.isPaused || this.world?.isPaused) return; // ✅ Pause respektieren (falls vorhanden)
      this.moveLeft();
    }, 1000 / 60);

    // 🟣 Animation starten und merken
    this.animationInterval = setInterval(() => {
      if (this.isDead) return;
      if (this.isPaused || this.world?.isPaused) return; // ✅ Pause respektieren (falls vorhanden)
      this.playAnimation(this.IMAGES_WALKING);
    }, 200);
  }

  // ✅ optional, aber sehr hilfreich: Intervalle sauber stoppen
  stop() {
    if (this.moveInterval) {
      clearInterval(this.moveInterval);
      this.moveInterval = null;
    }
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  // ✅ optional: wenn du irgendwo "die" aufrufst, kannst du hier zentral cleanup machen
  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.loadImage(this.IMAGE_DEAD);
    this.stop();
  }
}
