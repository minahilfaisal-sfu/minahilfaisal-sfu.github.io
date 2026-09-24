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
let circleY = 400;
let size = 50;
let radius = size / 2;
let speedX = 5;
let speedY = 5;
let increment = 1;

/* Directions 
* top-right = x + 1, y - 1
* top-left = x - 1, y - 1
* bottom-right = x + 1, y + 1
* bottom-left = x - 1, y + 1
*/

function generateRandomColor() {
  let r = random(0, 255);
  let g = random(0, 255);
  let b = random(0, 255);
  return [r, g, b];
}

function draw() { // -> runs forever, infinite loop
  background(colors.black);
  stroke(colors.white);

  // circleY = height / 2; // height is a variable created by p5
  circleX += speedX; // move the circle to the right faster
  circleY += speedY; // move the circle down faster

  size += increment; // increase the size of the circle
  radius = size / 2;

  // horizontal border
  if (circleX + radius >= width || circleX - radius < 0) {
    speedX = speedX * -1; // reset the circle to the left side of the canvas
    increment = increment * -1;
    // changes color on border hit
    [r, g, b] = generateRandomColor();
    fill(r, g, b);
  }

  // vertical border
  if (circleY + radius >= height || circleY - radius < 0) {
    speedY = speedY * -1;
    increment = increment * -1;
    // changes color on border hit
    [r, g, b] = generateRandomColor();
    fill(r, g, b);
  }

  circle(circleX, circleY, size); // draw the circle
}

function mousePressed() {
  circleX = 0; // reset the circle to the left side of the canvas
}
