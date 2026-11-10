// x and y are the center of the star
// r is the radius of its outer points
// speed is how fast it falls, in pixels per second
// isDying stars are dark red, and catching one costs points
class Star {
  constructor(x, y, r, speed, isDying = false) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.speed = speed;
    this.isDying = isDying;
    this.angle = random(TWO_PI);
    this.spin = random(-2, 2); // radians per second
  }

  update() {
    let seconds = deltaTime / 1000;
    this.y += this.speed * seconds;
    this.angle += this.spin * seconds;
  }

  show() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);

    if (this.isDying) {
      // dying stars flicker, like they're about to burn out
      drawingContext.shadowBlur = 15;
      drawingContext.shadowColor = "rgb(190, 20, 45)";
      fill(150, 25, 45, random(140, 255));
    } else {
      // soft glow
      drawingContext.shadowBlur = 20;
      drawingContext.shadowColor = "rgb(255, 225, 120)";
      fill(255, 215, 80);
    }

    noStroke();
    beginShape();
    // a 5 point star has 10 corners, alternating between outer and inner
    for (let i = 0; i < 10; i++) {
      let cornerR = i % 2 === 0 ? this.r : this.r * 0.45;
      let cornerAngle = (TWO_PI / 10) * i - HALF_PI;
      vertex(cos(cornerAngle) * cornerR, sin(cornerAngle) * cornerR);
    }
    endShape(CLOSE);
    pop();
  }

  // padding makes the star easier to catch than it looks
  isTouching(px, py, padding) {
    return dist(this.x, this.y, px, py) < this.r + padding;
  }

  isOffScreen() {
    return this.y - this.r > height;
  }
}
