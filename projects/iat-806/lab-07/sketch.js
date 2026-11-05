// an array to put all the balls in.
let balls = [];
// numBalls is written in camelCase.
// you could also write in camel_case
// this is the number of balls that you want to create.
let numBalls = 3000;
// no color variables, no position variables, they are all defined within the class.

let bodySegmentation;
let video;
let segmentation;

let options = {
  maskType: "person",
};

async function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent("sketch-holder");

  for (let i = 0; i < numBalls; i++) {
    balls.push(createRandomBall());
  }

  bodySegmentation = await ml5.bodySegmentation("SelfieSegmentation", options);

  // Create the video
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  bodySegmentation.detectStart(video, gotResults);
}

function draw() {
  background(120);
//   image(video, 0, 0);
  for (let ball of balls) {
    let onBody = segmentation && ball.isOnBody(segmentation.mask);

    let active = ball.contains(mouseX, mouseY) || onBody;

    ball.respond(active);

    ball.update(1);
  }
}

function createRandomBall() {
  let ballX = random(0, width);
  let ballY = random(0, height);
  let ballC = color(140, 0, 140 + random(-100, 100));
  let ballR = 5;

let randomValue = random();
  if (randomValue < 0.2) {
    return new BubblyBall(ballX, ballY, ballC, ballR);
  } else if (randomValue < 0.5) {
    return new FlowerBall(ballX, ballY, ballC, ballR);
  }
  return new Ball(ballX, ballY, ballC, ballR);
}

function gotResults(result) {
  segmentation = result;
}