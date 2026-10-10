// 5 dances with 14 frames each
let dances = Array(5).fill(null).map(() => Array(14).fill(""));

let padding = 5;
let imageWidth = 50;
let imageHeight = 90;

let rows = 10;
let cols = 20;
let canvasWidth = (imageWidth + padding) * cols + padding;
let canvasHeight = (imageHeight + padding) * rows + padding;

let colors = [];
// let speeds = [];
let rowHeight;
let colWidth;

async function setup() {
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent("sketch-holder");

  for (let i = 0; i < cols; i++) {
    colors[i] = [];
    // speeds[i] = [];
    for (let j = 0; j < rows; j++) {
      colors[i][j] = [random(1, 255), random(1, 255), random(1, 255)];
      // speeds[i][j] = random(1, 10);
    }
  }

  rowHeight = canvasHeight / rows;

  // Loading the images for the dances, 14 frames each, 5 dances total
  let frameNo = 1;
  for (let i = 0; i < dances.length; i++) {
    for (let j = 0; j < dances[i].length; j++) {
      dances[i][j] = await loadImage(`assets/${frameNo}.jpg`);
      frameNo++;
    }
  }
}

function draw() {
  background("white");

  // use mouse X to control the number of columns (2-20)
  if (mouseX < width) {
    cols = Math.floor(map(mouseX, 0, width, 2, 20));
    colWidth = canvasWidth / cols;
  }

  // use mouse Y to control the number of rows (2-10)
  if (mouseY < height) {
    rows = Math.floor(map(mouseY, 0, height, 2, 10));
    rowHeight = canvasHeight / rows;
  }
  
  // iterate over the grid
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      // show one of the 5 dances
      let d = (i + j) % dances.length;

      // draw the background rectangle
      fill(colors[i][j][0], colors[i][j][1], colors[i][j][2]);
      rect(i * colWidth, j * rowHeight, colWidth, rowHeight);

      // animate the dance frames
      let xPosition = i * colWidth + padding;
      let yPosition = j * rowHeight + padding;
      // substracting padding from both sides to allow the background color to show
      let imageWidth = colWidth - (padding * 2); 
      let imageHeight = rowHeight - (padding * 2);

      animate(d, xPosition, yPosition, imageWidth, imageHeight);
    }
  }
}

function getFrameIndex(i, speed) {
  let slowFrame = floor(frameCount / speed);
  let index = slowFrame % dances[i].length;

  return index;
}

function animate(i, xPosition, yPosition, imageWidth, imageHeight) {
  let distance = dist(mouseX, mouseY, xPosition, yPosition);

  // close to the mouse = 1 (fast), 200px or farther = 10 (slow)
  let speed = map(distance, 0, 1000, 1, 10, true);
  let index = getFrameIndex(i, speed);

  if (dances[i][index]) {
    image(dances[i][index], xPosition, yPosition, imageWidth, imageHeight);
  }
}
