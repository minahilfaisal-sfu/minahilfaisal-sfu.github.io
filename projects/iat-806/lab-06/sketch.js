let balls = [];
let bodySegmentation;
let segmentation;
let numBalls = 500;
let video;
let options = {
  maskType: "person",
  // flipped: true,  <- ml5 bug: crashes SelfieSegmentation ("source width is zero").
  // We mirror the picture ourselves in draw() instead.
};

async function setup() {
  const canvas = createCanvas(600, 450);
  canvas.parent("sketch-holder");

  bodySegmentation = await ml5.bodySegmentation("SelfieSegmentation", options);

  // create the video
  video = createCapture(VIDEO); // not flipped, so it lines up with the mask
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

// i want to make a bioluminiscent beach
// and i want the edges to light up wherever we hold up a finger

function draw() {
  background(120);

  if (segmentation) {
    video.mask(segmentation.mask, 0, 0, width, height);
    // draw it mirrored, like a selfie camera
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0);
    pop();
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
