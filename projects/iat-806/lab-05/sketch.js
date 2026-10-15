const colors = {
  pink: [255, 182, 193],
  black: [0, 0, 0],
  white: [255, 255, 255]
}

let balls = Array(1000);

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent("sketch-holder");

  for (let i = 0; i < balls.length; i++) {
    let r = colors.pink[0];
    let g = colors.pink[1] + random(-50, 50);
    let b = colors.pink[2] + random(-50, 50);

    let myBall = new Ball(width/2, height/2, 20, [r + random(0, 100), g + random(0, 100), b + random(0, 100)]); // an instant of a class
    balls[i] = myBall;
  }
}

function draw() {
  background(colors.black);

  for (let ball of balls) {
    ball.move();
    ball.show();
  }
}

class Ball {
  constructor(x, y, r, c) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.color = c;
  }

  // methods
  show() {
    fill(this.color);
    circle(this.x, this.y, this.r);
  }

  move() {
    this.x += random(-5, 5);
    this.y += random(-5, 5);
  }
}
