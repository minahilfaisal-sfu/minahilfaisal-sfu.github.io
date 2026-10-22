let plankton = [];
let numPlankton = 1200;
let waveGlitter = [];
let sandGlitter = [];
const NUM_WAVES = 4;

// ml5 hand tracking
let handPose;
let video;
let hands = [];
let status = "Loading hand tracking…";

// which landmarks count as "touching the water"
const FINGERTIPS = [
  "thumb_tip",
  "index_finger_tip",
  "middle_finger_tip",
  "ring_finger_tip",
  "pinky_finger_tip",
];
const REACH = 30; // how close (px) a fingertip has to be to wake a speck up

function setup() {
  const canvas = createCanvas(640, 480);
  canvas.parent("sketch-holder");

  for (let i = 0; i < numPlankton; i++) {
    plankton.push(createRandomPlankton());
  }
  for (let w = 1; w <= NUM_WAVES; w++) {
    for (let i = 0; i < 90; i++) waveGlitter.push(new WaveGlitter(w, random(height)));
  }
  for (let i = 0; i < 350; i++) sandGlitter.push(new SandGlitter("glint"));
  for (let i = 0; i < 180; i++) sandGlitter.push(new SandGlitter("stranded"));

  // The camera picture is never drawn, only used for tracking.
  // Not flipped here: we mirror the fingertip positions ourselves in
  // getFingertips(), so moving your hand right moves the glow right.
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // Not awaited, so the beach starts drawing while the model downloads
  loadHandTracking();
}

// ml5 1.x hands back a Promise when it's used with p5 2, so we await it
// (the same reason Lab 06 uses `await ml5.bodySegmentation(...)`).
async function loadHandTracking() {
  try {
    handPose = await ml5.handPose({ maxHands: 2 });
    handPose.detectStart(video, gotHands);
    status = "";
  } catch (err) {
    console.error(err);
    status = "Hand tracking couldn't start. Your mouse still works.";
  }
}

// callback: ml5 sends a fresh list of hands every time it finishes a frame
function gotHands(results) {
  hands = results;
}

// Where the water meets the sand at height y.
// A fixed wiggly coastline + a slow tide that pushes it in and out.
function shoreX(y, extra = 0) {
  let coast = width * 0.62 + 40 * sin(y * 0.012) + 18 * sin(y * 0.031 + 1.3);
  let tide = 22 * sin(frameCount * 0.02 + y * 0.004 + extra);
  return coast + tide;
}

// Every fingertip of every tracked hand, in canvas coordinates
function getFingertips() {
  let tips = [];
  for (let hand of hands) {
    for (let name of FINGERTIPS) {
      let kp = hand[name];
      if (!kp) continue;
      // scale from camera pixels to canvas pixels, then mirror like a selfie
      let x = width - kp.x * (width / video.width);
      let y = kp.y * (height / video.height);
      tips.push({ x, y });
    }
  }
  return tips;
}

function draw() {
  background(4, 12, 30); // night ocean

  drawOffshoreWaves();
  drawBeach();

  // Fingertips do the stirring. The mouse works too, as a fallback
  // for when there's no camera or no hand in view.
  let touches = getFingertips();
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    touches.push({ x: mouseX, y: mouseY });
  }

  blendMode(ADD); // overlapping glows add up, like real light
  drawFoam();
  for (let g of sandGlitter) {
    g.respond(g.touchedByAny(touches, REACH));
    g.update(0);
  }
  for (let g of waveGlitter) {
    g.respond(g.touchedByAny(touches, REACH));
    g.update(0.8);
  }
  for (let p of plankton) {
    p.respond(p.touchedByAny(touches, REACH));
    p.update(1.2);
  }
  drawFingertips();
  blendMode(BLEND);

  drawStatus();
}

// Faint markers so you can see where your fingers are over the scene
function drawFingertips() {
  noStroke();
  for (let tip of getFingertips()) {
    fill(140, 255, 235, 18);
    circle(tip.x, tip.y, REACH * 2);
    fill(200, 255, 245, 120);
    circle(tip.x, tip.y, 5);
  }
}

function drawStatus() {
  if (!status) return;
  noStroke();
  fill(200, 230, 240, 180);
  textAlign(LEFT, BOTTOM);
  textSize(13);
  text(status, 12, height - 12);
}

// Sand on the right, with a darker wet strip next to the water
function drawBeach() {
  noStroke();

  fill(58, 50, 44); // moonlit dry sand
  beginShape();
  for (let y = 0; y <= height; y += 6) vertex(shoreX(y, -0.6) + 35, y);
  vertex(width, height);
  vertex(width, 0);
  endShape(CLOSE);

  fill(32, 30, 34, 200); // wet sand the waves just left
  beginShape();
  for (let y = 0; y <= height; y += 6) vertex(shoreX(y), y);
  for (let y = height; y >= 0; y -= 6) vertex(shoreX(y, -0.6) + 35, y);
  endShape(CLOSE);
}

// Glowing line where each wave breaks
function drawFoam() {
  noFill();
  for (let w = 10; w >= 2; w -= 4) {
    stroke(40, 180, 220, 30);
    strokeWeight(w);
    beginShape();
    for (let y = -10; y <= height + 10; y += 6) vertex(shoreX(y), y);
    endShape();
  }
}

// How far wave i has rolled in, from 0 (far out) to 280 (at the shore)
function waveDrift(i) {
  return (frameCount * 0.4 + i * 70) % 280;
}

// x position of wave i at height y
function waveX(i, y) {
  return shoreX(y, i) - 280 + waveDrift(i);
}

// 0..1: each swell fades in out at sea and fades out as it reaches the shore,
// so nothing pops when it loops back
function waveStrength(i) {
  return sin(PI * waveDrift(i) / 280);
}

// Faint swells rolling in from the left
function drawOffshoreWaves() {
  noFill();
  strokeWeight(1.5);
  for (let i = 1; i <= NUM_WAVES; i++) {
    stroke(30, 90, 130, 10 + 50 * waveStrength(i));
    beginShape();
    for (let y = -10; y <= height + 10; y += 8) vertex(waveX(i, y), y);
    endShape();
  }
}
