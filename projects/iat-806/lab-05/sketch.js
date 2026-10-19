const colors = {
  pink: [255, 182, 193],
  black: [0, 0, 0],
  white: [255, 255, 255],
};

let balls = Array(10);
let gravityOn = false;
// ball sizes
let MIN_RADIUS = 5;
let MAX_RADIUS = 50;

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent("sketch-holder");

  for (let i = 0; i < balls.length; i++) {
    let r = colors.pink[0];
    let g = colors.pink[1] + random(-50, 50);
    let b = colors.pink[2] + random(-50, 50);

    let myBall = new Ball(width / 2, height / 2, 20, [
      r + random(0, 100),
      g + random(0, 100),
      b + random(0, 100),
    ]); // an instance of a class
    balls[i] = myBall;
  }
}

function draw() {
  background(colors.black);

  for (let ball of balls) {
    if (keyIsDown(" ")) { // space bar
      ball.swirl(mouseX, mouseY);
    } else if (gravityOn) { // on click
      ball.fall();
    } else { // wander around randomly
      ball.move();
    }
    ball.show();
    ball.changeSize(MIN_RADIUS, MAX_RADIUS); // jittery balls
  }        
}

// click the canvas to turn gravity on
// the balls jump to the mouse position and fall from there
function mousePressed() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

  gravityOn = true; 

  for (let ball of balls) {
    ball.updatePosition(mouseX + random(-50, 50), mouseY + random(-50, 50));
  }
}

function keyPressed() {
  if (key === "r" || key === "R") { // reset
    // turn off gravity and reset positions and speed
    gravityOn = false;
    for (let ball of balls) {
      ball.updatePosition(width/2, height/2);
    }
  }

  // stop the space bar from scrolling the page
  if (key === " ") {
    return false;
  }
}

class Ball {
  constructor(x, y, r, c) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.color = c;
    this.speedY = 0; // how fast it's falling
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

  changeSize(minR, maxR) {
    this.r += random(-5, 5);
    this.r = constrain(this.r, minR, maxR); // keep the size between minR and maxR
  }

  // put the ball somewhere new / reset speed
  updatePosition(x, y) {
    this.x = x;
    this.y = y;
    this.speedY = 0;
  }

  // circle around the mouse
  swirl(mouseX, mouseY) {
    let distance = dist(this.x, this.y, mouseX, mouseY);
    let angle = atan2(this.y - mouseY, this.x - mouseX);

    angle += 0.05; // move around the circle

    this.x = mouseX + cos(angle) * distance;
    this.y = mouseY + sin(angle) * distance;
  }

  // fall down and bounce off the floor
  fall() {
    this.speedY += 0.5; // gravity speeds it up
    this.y += this.speedY;

    let floor = height - this.r / 2; // where the bottom of the ball touches the edge

    if (this.y > floor) {
      // hit the floor
      this.y = floor;
      this.speedY *= -0.8; // bounce back up, a bit weaker each time
    }
  }
}
