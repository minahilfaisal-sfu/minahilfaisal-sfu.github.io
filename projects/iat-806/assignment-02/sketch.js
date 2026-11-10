// These get passed to new Game() in setup().
const GAME_OPTIONS = {
  roundSeconds: 30,
  countdownSeconds: 3,
  catchPadding: 20, // hand tracking jitters, so be forgiving
  starsAtStart: 5, // dropped in with a loop when a round starts
  dyingStarPenalty: 5,
  restartDelaySeconds: 3, // so a finger that's already there doesn't restart the game

  // where the scores are saved in this browser
  highScoreKey: "iat806-star-catcher-high-score",
  sympathyScoreKey: "iat806-star-catcher-sympathy-score",

  // It gets harder every 10 seconds. Add a line here for another level.
  // number, name, startsAt (seconds), secondsBetweenStars, minSpeed, maxSpeed, dyingChance
  levels: [
    new Level(1, "Twinkle", 0, 0.8, 110, 220, 0.2),
    new Level(2, "Shooting Stars", 10, 0.6, 150, 280, 0.3),
    new Level(3, "Supernova", 20, 0.45, 190, 340, 0.4),
  ],
};

// ml5 and the webcam
let handPose;
let video;
let hands = [];
let finger = null; // { x, y } of the index fingertip, null if there's no hand

// the game: scene, timer, level, stars and score all live in here (Game.js)
let game;
let startStar; // the big star to touch which starts the game

// looks
let galaxy; // the marker on the fingertip
let backgroundStars = []; // tiny twinkling dots behind everything

// sounds
let goodSound;
let badSound;
let isSoundOn = false; // browsers only allow sound after a click

function setup() {
  // the canvas and video are the same size, so a fingertip position from ml5
  // can be used as a canvas position without any conversion
  let canvas = createCanvas(640, 480);
  canvas.parent("sketch-holder");
  textFont("Courier New");

  game = new Game(GAME_OPTIONS);
  startStar = new Star(width / 2, height / 2 + 50, 70, 0);
  galaxy = new Galaxy(26);

  for (let i = 0; i < 120; i++) {
    backgroundStars.push({
      x: random(width),
      y: random(height),
      size: random(0.5, 2),
      twinkleSpeed: random(0.5, 2),
      twinkleOffset: random(TWO_PI),
    });
  }

  // the video is hidden and never drawn, but handPose still watches it.
  // flipped: true mirrors the video, so moving the hand right moves it right
  video = createCapture(
    { video: { width: 640, height: 480 }, audio: false },
    { flipped: true },
  );
  video.size(width, height);
  video.hide();

  // not awaited, so draw() can show the loading screen while the model loads
  startHandTracking();

  // the sounds load in the background too. If a file is missing, the game
  // still works, just without that sound.
  loadGoodSound();
  loadBadSound();
}

async function loadGoodSound() {
  try {
    goodSound = await loadSound("sounds/good-star.wav");
  } catch (error) {
    console.warn("Couldn't load sounds/good-star.wav", error);
  }
}

async function loadBadSound() {
  try {
    badSound = await loadSound("sounds/bad-star.wav");
  } catch (error) {
    console.warn("Couldn't load sounds/bad-star.wav", error);
  }
}

// browsers block sound until the player clicks, so a click turns sound on
function mousePressed() {
  userStartAudio();
  isSoundOn = true;
}

function playSound(sound) {
  if (isSoundOn && sound) {
    sound.play();
  }
}

async function startHandTracking() {
  // flipped: true mirrors the fingertip position to match the mirrored video
  handPose = await ml5.handPose({ maxHands: 1, flipped: true });

  // use video.elt here, not video. Once draw() has started, ml5 reads p5's
  // already-mirrored copy of video, which would mirror the fingertip twice.
  handPose.detectStart(video.elt, gotHands);
  game.changeScene("start");
}

// callback function for handPose, runs every time it has a new result
function gotHands(results) {
  hands = results;
}

function draw() {
  drawBackground();
  updateFinger();

  if (game.scene === "loading") {
    drawLoadingScene();
  } else if (game.scene === "start") {
    drawStartScene();
  } else if (game.scene === "countdown") {
    drawCountdownScene();
  } else if (game.scene === "playing") {
    drawPlayingScene();
  } else {
    drawGameOverScene();
  }

  drawFinger();
}

// a black sky with tiny twinkling stars
function drawBackground() {
  background(0);
  noStroke();
  for (let s of backgroundStars) {
    let brightness = 140 + 100 * sin(millis() * 0.002 * s.twinkleSpeed + s.twinkleOffset);
    fill(255, brightness);
    circle(s.x, s.y, s.size);
  }
}

function updateFinger() {
  if (hands.length === 0) {
    finger = null;
    return;
  }

  let tip = hands[0].index_finger_tip;
  if (finger === null) {
    finger = { x: tip.x, y: tip.y };
  } else {
    // move most of the way to the new position to smooth out the jitter
    finger.x = lerp(finger.x, tip.x, 0.6);
    finger.y = lerp(finger.y, tip.y, 0.6);
  }
}

function drawFinger() {
  if (finger === null) return;

  galaxy.show(finger.x, finger.y);
}

/** ----------------------------------------------
 *   SCENES
 * -----------------------------------------------
 */

function drawLoadingScene() {
  drawMessage("Loading...", 40, height / 2);
  drawMessage("Allow camera access if you're asked", 20, height / 2 + 45);
}

function drawStartScene() {
  drawMessage("STAR CATCHER", 48, 90);
  drawMessage("Touch the star with your index finger", 22, 140);
  drawMessage(`Dying red stars cost you ${game.dyingStarPenalty} points`, 18, 172);
  if (finger === null) {
    drawMessage("Hold one hand up to the camera", 16, 200);
  }

  if (game.sympathyScore < 0) {
    drawMessage(`High score: ${game.highScore}   Sympathy: ${game.sympathyScore}`, 18, height - 70);
  } else {
    drawMessage(`High score: ${game.highScore}`, 22, height - 70);
  }
  if (!isSoundOn) {
    drawMessage("Click anywhere to turn on sound", 16, height - 35);
  }
  drawStartStar(height / 2 + 50);
}

function drawCountdownScene() {
  if (game.countdownLeft() <= 0) {
    game.startRound();
    return;
  }

  drawMessage(ceil(game.countdownLeft()), 120, height / 2);
}

function drawPlayingScene() {
  if (game.secondsLeft() <= 0) {
    game.endRound();
    return;
  }

  game.updateLevel();
  game.spawnStars();
  game.updateStars(finger);

  // red flash after catching a dying star
  if (game.isFlashing()) {
    noStroke();
    fill(160, 0, 30, 90);
    rect(0, 0, width, height);
  }

  drawScoreBar();

  if (game.isNewLevel()) {
    drawMessage(`LEVEL ${game.level.number}`, 56, height / 2 - 20);
    drawMessage(game.level.name, 24, height / 2 + 30);
  }

  if (finger === null) {
    drawMessage("Your hand is out of frame!", 24, height - 40);
  }
}

function drawGameOverScene() {
  drawMessage("TIME'S UP", 48, 80);

  if (game.score < 0) {
    // they caught more dying stars than good ones
    drawMessage("You sympathise with the dying stars.", 22, 135);
    drawMessage("Here's your high score for favouring them:", 18, 170);
    drawMessage(game.score, 48, 220);
    if (game.isNewSympathyScore) {
      drawMessage("The most sympathetic yet!", 18, 262);
    }
  } else {
    drawMessage(`You caught ${game.score} stars`, 30, 140);
    if (game.isNewHighScore) {
      drawMessage("New high score!", 24, 185);
    } else {
      drawMessage(`High score: ${game.highScore}`, 24, 185);
    }
  }

  // wait a moment so a finger that's already there doesn't restart the game
  if (game.canRestart()) {
    drawMessage("Touch the star to play again", 20, height - 25);
    drawStartStar(height - 115);
  }
}

function drawStartStar(y) {
  startStar.y = y;
  startStar.update();
  startStar.show();

  if (
    finger !== null &&
    startStar.isTouching(finger.x, finger.y, game.catchPadding)
  ) {
    game.changeScene("countdown");
  }
}

/** ----------------------------------------------
 *   TEXT
 * -----------------------------------------------
 */

function drawScoreBar() {
  noStroke();
  fill(255);
  textSize(28);

  textAlign(LEFT, TOP);
  text(`Stars: ${game.score}`, 20, 20);

  textAlign(RIGHT, TOP);
  text(`Time: ${ceil(game.secondsLeft())}`, width - 20, 20);

  textSize(20);
  textAlign(CENTER, TOP);
  text(`Level ${game.level.number}`, width / 2, 26);
}

function drawMessage(message, size, y) {
  noStroke();
  fill(255);
  textSize(size);
  textAlign(CENTER, CENTER);
  text(message, width / 2, y);
}
