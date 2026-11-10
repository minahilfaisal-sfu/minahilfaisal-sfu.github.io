// this is how we define a class
// attributes
// methods
// this is a blueprint for creating stuff.
// We can create new balls using this.
class Ball {
  // this function is called when an instance of Ball is created.
  // x ix x position
  // y is y position
  // c is color
  // r is radius
  // this is the function that is called when you create a new ball or a new instance of this Class.
  constructor(x, y, fillColor, r) {
    this.x = x;
    this.y = y;

    this.baseR = r;
    this.r = r;
    this.origColor = fillColor;
    this.fillColor = fillColor;
    this.highlightColor = color(100, 100, 100, 50);
  }

  update(byHowMuch) {
    this.move(byHowMuch);
    this.show();
  }

  move(byHowMuch) {
    this.x += random(-byHowMuch, byHowMuch);
    this.y += random(-byHowMuch, byHowMuch);
  }

  changeSize(byHowMuch) {
    this.r = constrain(this.r + random(-byHowMuch, byHowMuch), 2, 30);
  }

  contains(px, py) {
    if (dist(this.x, this.y, px, py) < this.r) {
      return true;
    } else {
      return false;
    }
  }

  respond(active) {
    if (active) this.highlight();
    else this.deHighlight();
  }

  highlight() {
    this.fillColor = this.highlightColor;
  }

  outline(lineColor) {
    this.strokeColor = lineColor;
  }

  deHighlight() {
    this.fillColor = this.origColor;
  }

  isOnBody(mask) {
    let px = mask.get(floor(this.x), floor(this.y)); // [r, g, b, a]
    return px[3] < 128;
  }

  show() {
    fill(this.fillColor);
    if (this.strokeColor) {
      stroke(this.strokeColor);
      strokeWeight(2);
    } else {
      noStroke();
    }
    circle(this.x, this.y, this.r * 2);
    this.strokeColor = null;
  }
}

class BubblyBall extends Ball {
  constructor(x, y, r) {
    const bubblyColors = [
      color(173, 216, 230), // light blue
      color(135, 206, 250), // sky blue
      color(176, 224, 230), // powder blue
      color(100, 149, 237), // cornflower blue
      color(70, 130, 180), // steel blue
    ];

    let randomColor = random(bubblyColors);
    super(x, y, randomColor, r);
  }

  respond(active) {
    super.respond(active);
    this.changeSize(active ? 0.5 : -0.5);
  }
}

class EmojiBall extends Ball {
  constructor(x, y, r, emoji) {
    super(x, y, color(255), r);
    this.emoji = emoji ?? "🫧";
  }

  show() {
    textSize(this.r * 2); // Adjust text size based on radius
    textAlign(CENTER, CENTER);
    fill(this.fillColor);
    noStroke();
    text(this.emoji, this.x, this.y);
  }
}
