class DrawableObject {
  // 🔥 NEU: globale Zähler für alle Grafiken
  static totalAssets = 0;
  static loadedAssets = 0;

  x = 120;
  y = 275;
  height = 150;
  width = 100;
  img;
  imageCache = {};
  currentImage = 0;

  loadImage(path) {
    this.img = new Image();
    DrawableObject.totalAssets++;

    this.img.onload = () => {
      DrawableObject.loadedAssets++;
    };

    this.img.src = path;
  }

  loadImages(arr) {
    arr.forEach((path) => {
      let img = new Image();

      DrawableObject.totalAssets++;

      img.onload = () => {
        DrawableObject.loadedAssets++;
      };

      img.src = path;
      this.imageCache[path] = img;
    });
  }

  draw(ctx) {
    ctx.drawImage(this.img, 0, 0, this.width, this.height);
  }

  drawFrame(ctx) {
    if (!this.shouldDrawFrame()) return;
    this.beginFrame(ctx);
    this.drawFrameRect(ctx);
    ctx.stroke();
  }

  shouldDrawFrame() {
    return this instanceof Character || this instanceof Chicken || this instanceof Endboss ||
      this instanceof ChickenSmall || this instanceof Corncob || this instanceof Coin ||
      this instanceof Salsa || this instanceof Maracas || this instanceof Bodyguard;
  }

  beginFrame(ctx) {
    ctx.beginPath();
    ctx.lineWidth = "1";
    ctx.strokeStyle = "transparent";
  }

  drawFrameRect(ctx) {
    if (this.collisionBox) return this.drawCollisionRect(ctx);
    const offsetY = this instanceof Bodyguard ? 30 : 0;
    ctx.rect(0, offsetY, this.width, this.height - offsetY);
  }

  drawCollisionRect(ctx) {
    const b = this.collisionBox;
    ctx.rect(b.x - this.x, b.y - this.y, b.width, b.height);
  }


  // 🔥 NEU: Helper, ob aus Sicht aller DrawableObjects alles geladen ist
  static areAllAssetsLoaded() {
    return (
      DrawableObject.totalAssets > 0 &&
      DrawableObject.loadedAssets >= DrawableObject.totalAssets
    );
  }
}
