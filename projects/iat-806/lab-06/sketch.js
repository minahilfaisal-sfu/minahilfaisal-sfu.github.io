const colors = {
  pink: [255, 182, 193],
  black: [0, 0, 0],
  white: [255, 255, 255]
}

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent("sketch-holder");
}

function draw() {
  background(colors.black);
  fill(colors.pink);
  stroke(colors.white);
  circle(400, 265, 50);
}
