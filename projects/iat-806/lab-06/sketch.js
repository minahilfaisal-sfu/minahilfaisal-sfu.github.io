let balls = [];

let numBalls = 500;

function setup() {
  const canvas = createCanvas(600, 600);
  canvas.parent("sketch-holder");

  for (let i = 0; i < numBalls; i++) {
    let ball = createRandomBall();
    balls.push(ball);
  }
}

// i want to make a bioluminiscent beach
// and i want the edges to light up wherever we hold up a finger

function draw() {
  background(120);

  for (let ball of balls) {
    ball.update(2);
    // for highlighting
    // let active = ball.contains(mouseX, mouseY)
    // ball.respond(active);
  }
}

function mousePressed() {
  balls.forEach((ball) => {
    let active = ball.contains(mouseX, mouseY)
    ball.respond(active);
  })
}