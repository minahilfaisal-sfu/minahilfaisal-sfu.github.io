let frames = Array(69).fill("");
let music = "";
let speed = 4;
let isMusicPlaying = false;
let startFrame = 0;
let isAnimationPlaying = true;

const colors = {
  pink: [255, 182, 193],
  black: [0, 0, 0],
  white: [255, 255, 255],
  darkBlue: [0, 0, 139],
}

let [r, g, b] = colors.darkBlue;

function generateRandomColor() {
  let r = random(0, 255);
  let g = random(0, 255);
  let b = random(0, 255);
  return [r, g, b];
}

async function setup() {
  let canvas = createCanvas(400, 709);
  canvas.parent("sketch-holder");

  music = await loadSound("assets/trimmed-audio.mp3");

  // runs when the song finishes
  music.onended(() => {
    isMusicPlaying = false;
    [r, g, b] = colors.darkBlue; // reset background when it ends
  });

  for (let i = 0; i < frames.length; i++) {
    frames[i] = await loadImage(`assets/${i + 1}.jpg`);
  }
}

function draw() {
  // randomize the background color for each frame
  background(r, g, b);

  let index = floor((frameCount - startFrame) / speed) % frames.length;
  if (frames[index]) {
    if (isMusicPlaying) {
      [r, g, b] = generateRandomColor();
    }
    image(frames[index], 10, 10, 380, 689);
  }
}

function mousePressed() {
  music.stop();
  music.play();
  isMusicPlaying = true;
  startFrame = frameCount;
}

function keyPressed() {
  if (key === " ") {
    if (isMusicPlaying) {
      // stop animation and music
      noLoop();
      music.pause();
      isMusicPlaying = false;
    } else {
      // start animation and music from where it was paused
      loop();
      music.play();
      isMusicPlaying = true;
    }
    return false; // stop Space from scrolling the page
  }

  // Press X to pause the animation only
  if (key === "x" || key === "X") {
    if (isAnimationPlaying) {
      // stop animation only
      noLoop();
      isAnimationPlaying = false;
    } else {
      // start animation from where it was paused
      loop();
      isAnimationPlaying = true;
    }
  }
}


