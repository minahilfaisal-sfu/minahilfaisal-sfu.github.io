function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent("sketch-holder");
}

const colors = {
  pink: [255, 182, 193],
  teal: [35, 132, 135],
  black: [0, 0, 0],
  white: [255, 255, 255]
}

let circleX = 50;
let circleY = 50;
let size = 50;
let radius = size / 2;
let speedX = 5;
let increment = 1;

function draw() { // -> runs forever, infinite loop
  background(colors.black);
  fill(colors.pink);
  stroke(colors.white);

  circleY = height / 2; // height is a variable created by p5
  circleX += speedX; // move the circle to the right faster

  size += increment; // increase the size of the circle
  radius = size / 2;

  // horizontal border
  if (circleX + radius >= width || circleX <= radius) {
    speedX = speedX * -1; // reset the circle to the left side of the canvas
    increment = increment * -1;
  }

  // vertical border
  if (circleY + radius >= height || circleY <= radius) {
    increment = increment * -1;
  }

  if (circleX >= width / 2) {
    fill(colors.teal);
  }

  circle(circleX, circleY, size); // draw the circle
}

function mousePressed() {
  circleX = 0; // reset the circle to the left side of the canvas
}
