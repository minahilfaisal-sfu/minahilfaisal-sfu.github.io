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

let popSound;

async function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent("sketch-holder");

  for (let i = 0; i < numBalls; i++) {
    balls.push(createRandomBall());
  }

  popSound = await loadSound("assets/pop.wav");

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

    let active = onBody;
    ball.respond(active);
    
    if (ball.contains(mouseX, mouseY)) {
      ball.outline("black")
    }

    ball.update(1);
  }
}

function createRandomBall() {
  let ballX = random(0, width);
  let ballY = random(0, height);
  // let ballC = color(140, 0, 140 + random(-100, 100));
  let ballR = 10;

  let randomValue = random();
  if (randomValue < 0.5) {
    return new BubblyBall(ballX, ballY, ballR);
  }
  return new EmojiBall(ballX, ballY, ballR, "🫧");
}

function gotResults(result) {
  segmentation = result;
}

function mousePressed() {
  for (let i = balls.length - 1; i >= 0; i--) {
    if (balls[i].contains(mouseX, mouseY)) {
      balls.splice(i, 1);
      popSound.play();
      break;
    }
  }
}
