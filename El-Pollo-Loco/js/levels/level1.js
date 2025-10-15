function generateClouds(levelWidth, spacing = 500) {
  let clouds = [];
  for (let x = 0; x < levelWidth; x += spacing) {
    let offsetX = x + Math.random() * 200; // Etwas zufälliger
    clouds.push(new Cloud(offsetX));
  }
  return clouds;
}


const level1 = new Level(
  [
    new Chicken(),
    new Chicken(),
    new Chicken(),
    new Chicken(),
    new Chicken(),
    new Chicken(),
    new Chicken(),
    new Chicken(),
    new ChickenSmall(),
    new ChickenSmall(),
    new ChickenSmall(),
    new ChickenSmall(),
    new Endboss(),
    new EndBossStatusBar()
  ],
  generateClouds(10000),

  [new BackgroundObject('img/5_background/layers/air.png', -720),
  new BackgroundObject('img/5_background/layers/3_third_layer/2.png', -720),
  new BackgroundObject('img/5_background/layers/2_second_layer/2.png', -720),
  new BackgroundObject('img/5_background/layers/1_first_layer/2.png', -720),

  new BackgroundObject('img/5_background/layers/air.png', 0),
  new BackgroundObject('img/5_background/layers/3_third_layer/1.png', 0),
  new BackgroundObject('img/5_background/layers/2_second_layer/1.png', 0),
  new BackgroundObject('img/5_background/layers/1_first_layer/1.png', 0),

  new BackgroundObject('img/5_background/layers/air.png', 720),
  new BackgroundObject('img/5_background/layers/3_third_layer/2.png', 720),
  new BackgroundObject('img/5_background/layers/2_second_layer/2.png', 720),
  new BackgroundObject('img/5_background/layers/1_first_layer/2.png', 720),

  new BackgroundObject('img/5_background/layers/air.png', 720 * 2),
  new BackgroundObject('img/5_background/layers/3_third_layer/1.png', 720 * 2),
  new BackgroundObject('img/5_background/layers/2_second_layer/1.png', 720 * 2),
  new BackgroundObject('img/5_background/layers/1_first_layer/1.png', 720 * 2),

  new BackgroundObject('img/5_background/layers/air.png', 720 * 3),
  new BackgroundObject('img/5_background/layers/3_third_layer/2.png', 720 * 3),
  new BackgroundObject('img/5_background/layers/2_second_layer/2.png', 720 * 3),
  new BackgroundObject('img/5_background/layers/1_first_layer/2.png', 720 * 3),

  new BackgroundObject('img/5_background/layers/air.png', 720 * 4),
  new BackgroundObject('img/5_background/layers/3_third_layer/1.png', 720 * 4),
  new BackgroundObject('img/5_background/layers/2_second_layer/1.png', 720 * 4),
  new BackgroundObject('img/5_background/layers/1_first_layer/1.png', 720 * 4),

  new BackgroundObject('img/5_background/layers/air.png', 720 * 5),
  new BackgroundObject('img/5_background/layers/3_third_layer/2.png', 720 * 5),
  new BackgroundObject('img/5_background/layers/2_second_layer/2.png', 720 * 5),
  new BackgroundObject('img/5_background/layers/1_first_layer/2.png', 720 * 5),

  new BackgroundObject('img/5_background/layers/air.png', 720 * 6),
  new BackgroundObject('img/5_background/layers/3_third_layer/1.png', 720 * 6),
  new BackgroundObject('img/5_background/layers/2_second_layer/1.png', 720 * 6),
  new BackgroundObject('img/5_background/layers/1_first_layer/1.png', 720 * 6)],
  4550
);