let balls = [];
let bodySegmentation;
let segmentation;
let numBalls = 5000;
let video;
let options = {
  maskType: "person",
};

async function setup() {
  const canvas = createCanvas(600, 450);
  canvas.parent("sketch-holder");

  bodySegmentation = await ml5.bodySegmentation("SelfieSegmentation", options);

  // create the video
  video = createCapture(VIDEO);
  video.size(600, 450);
  video.hide();

  bodySegmentation.detectStart(video, gotResults);

  for (let i = 0; i < numBalls; i++) {
    let ball = createRandomBall();
    balls.push(ball);
  }
}

// callback function for body segmentation
function gotResults(result) {
  segmentation = result;
}

function draw() {
  background(120);

  if (segmentation) {
    video.mask(segmentation.mask);
  }

  for (let ball of balls) {
    ball.update(2);
    // for highlighting
    // segmentation is empty until ml5 sends its first result
    let active = segmentation ? ball.isOnBody(segmentation.mask) : false;
    ball.respond(active);
  }
}

function mousePressed() {
  balls.forEach((ball) => {
    let active = ball.contains(mouseX, mouseY);
    ball.respond(active);
  });
}
