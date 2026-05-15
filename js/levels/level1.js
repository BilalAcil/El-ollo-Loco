//#region Cloud generation

/**
 * Generates clouds across the full level width.
 *
 * @function generateClouds
 * @param {number} levelWidth - Level width in pixels.
 * @param {number} [spacing=500] - Distance between clouds (smaller value = more clouds).
 * @returns {Cloud[]} Array of Cloud objects with a slightly randomized X offset.
 */
function generateClouds(levelWidth, spacing = 500) {
  /** @type {Cloud[]} */
  let clouds = [];

  for (let x = 0; x < levelWidth; x += spacing) {
    // Add a small random offset so clouds don't look perfectly aligned
    let offsetX = x + Math.random() * 200;
    clouds.push(new Cloud(offsetX));
  }

  return clouds;
}

//#endregion

//#region Level 1 setup

/**
 * Level 1 configuration – contains enemies, clouds, and background objects.
 *
 * @type {Level}
 */
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
    new EndBossStatusBar(),
    new Bodyguard()
  ],
  generateClouds(10000),
  [
    new BackgroundObject('img/5_background/layers/air.png', -720),
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
    new BackgroundObject('img/5_background/layers/1_first_layer/1.png', 720 * 6)
  ],
  4550
);

//#endregion
