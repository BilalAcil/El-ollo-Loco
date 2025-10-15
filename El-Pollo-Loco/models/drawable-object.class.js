class DrawableObject {
  x = 120;
  y = 275;
  height = 150;
  width = 100;
  img;
  imageCache = {};
  currentImage = 0;


  loadImage(path) {
    this.img = new Image();
    this.img.src = path;
  }


  draw(ctx) {
    ctx.drawImage(this.img, 0, 0, this.width, this.height);
  }


  drawFrame(ctx) {
    if (this instanceof Character || this instanceof Chicken || this instanceof Endboss || this instanceof ChickenSmall || this instanceof Corncob || this instanceof Coin || this instanceof Salsa) {
      ctx.beginPath();
      ctx.lineWidth = "1";
      ctx.strokeStyle = "red";
      ctx.rect(0, 0, this.width, this.height);
      ctx.stroke();
    }
  }


  loadImages(arr) {
    arr.forEach((path) => {
      let img = new Image();
      img.src = path;
      this.imageCache[path] = img;
    });
  }

}