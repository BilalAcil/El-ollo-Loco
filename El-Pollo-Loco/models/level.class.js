class Level {
  enemies;
  clouds;
  backgroundObjects;
  corncobs;
  level_end_x;

  constructor(enemies, clouds, backgroundObjects, corncobs = [], level_end_x = 4400) {
    this.enemies = enemies;
    this.clouds = clouds;
    this.backgroundObjects = backgroundObjects;
    this.corncobs = corncobs;
    this.level_end_x = level_end_x;
  }
}
