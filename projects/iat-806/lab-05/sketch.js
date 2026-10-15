const colors = {
  pink: [255, 182, 193],
  black: [0, 0, 0],
  white: [255, 255, 255]
}

let myBall;

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent("sketch-holder");
  
  myBall = new Ball(); // an instant of a class
}

function draw() {
  background(colors.black);

  myBall.show();
}

class Ball {
  constructor() {
    this.x = 400;
    this.y = 500;
  }

  // methods
  show() {
    fill(colors.pink);
    circle(this.x, this.y, 20);
  }
}
