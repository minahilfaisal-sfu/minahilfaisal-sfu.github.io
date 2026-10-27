const colors = {
  pink: [255, 182, 193],
  black: [0, 0, 0],
  white: [255, 255, 255],
};

class Ball {
  constructor(x, y, c, r, maxR = 10) {
    this.x = x;
    this.y = y;
    this.color = c;
    this.originalColor = c;
    this.highlightColor = colors.pink;
    this.r = r;
    this.maxR = maxR;
  }

  update(byHowMuch) {
    this.changeSize(byHowMuch);
    this.move(byHowMuch);
    this.show();
  }

  contains(pointX, pointY) {
    // distance from the center of the circle to the point
    // should be within the radius length for the point
    // to be inside the ball
    return dist(this.x, this.y, pointX, pointY) < this.r;
  }

  respond(active) {
    if (active) {
      this.highlight();
    } else {
      this.removeHighlight();
    }
  }

  highlight() {
    this.color = this.highlightColor;
  }

  removeHighlight() {
    this.color = this.originalColor;
  }

  move(byHowMuch) {
    this.x += random(-byHowMuch, byHowMuch);
    this.y += random(-byHowMuch, byHowMuch);
  }

  changeSize(byHowMuch) {
    this.r = constrain(this.r + random(-byHowMuch, byHowMuch), 2, this.maxR);
  }

  show() {
    fill(this.color);
    circle(this.x, this.y, this.r * 2);
  }

  isOnBody(mask) {
    let mx = floor((this.x * mask.width) / width);
    let my = floor((this.y * mask.height) / height);
    let pixel = mask.get(mx, my); // returns [r,g,b,a]
    return pixel[3] < 128;
  }
}

function createRandomBall() {
  let ballX = random(0, width);
  let ballY = random(0, height);
  let ballC = color(20, 130, 140 + random(-100, 100), 120);
  let ballR = 10;
  let ball = new Ball(ballX, ballY, ballC, ballR);
  return ball;
}
