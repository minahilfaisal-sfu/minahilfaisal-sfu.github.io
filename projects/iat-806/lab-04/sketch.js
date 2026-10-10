let dances = Array(5).fill(null).map(() => Array(14).fill("")); // 5 dances with 14 frames each
let speed = 4;

const colors = {
  pink: [255, 182, 193],
  black: [0, 0, 0],
  white: [255, 255, 255],
  darkBlue: [0, 0, 139],
}

async function setup() {
  let canvas = createCanvas(1000, 709);
  canvas.parent("sketch-holder");

  let frameNo = 1;
  for (let i = 0; i < dances.length; i++) {
    for (let j = 0; j < dances[i].length; j++) {
      dances[i][j] = await loadImage(`assets/${frameNo}.jpg`);
      frameNo++;
    }
  }
}

function draw() {
  // randomize the background color for each frame
  background(colors.black);

  let xOffset = 10;
  let yOffset = 10;
  let width = 100;
  let height = 181;
  for (let i = 0; i < dances.length; i++) {
    animate(i, speed, xOffset, yOffset, width, height);
    xOffset += 110;
  }
}

function getFrameIndex(i, speed) {
  let slowFrame = floor(frameCount / speed);
  let index = slowFrame % dances[i].length;

  return index;
}

function animate(i, speed, xPosition, yPosition, width, height) {
  let index = getFrameIndex(i, speed);
  if (dances[i][index]) {
    image(dances[i][index], xPosition, yPosition, width, height);
  }
}



