// Everything that changes during gameplay: the scene, the timer, the level,
// the stars and the score. Game keeps track of it, sketch.js draws it.
// options holds the settings, see GAME_OPTIONS in sketch.js
class Game {
  constructor(options) {
    // settings
    this.roundSeconds = options.roundSeconds;
    this.countdownSeconds = options.countdownSeconds;
    this.catchPadding = options.catchPadding;
    this.starsAtStart = options.starsAtStart;
    this.dyingStarPenalty = options.dyingStarPenalty;
    this.restartDelaySeconds = options.restartDelaySeconds;
    this.highScoreKey = options.highScoreKey;
    this.sympathyScoreKey = options.sympathyScoreKey;
    this.levels = options.levels;

    this.level = this.levels[0];
    this.levelStartedAt = 0;

    // "loading" -> "start" -> "countdown" -> "playing" -> "gameOver" -> "countdown"
    this.scene = "loading";
    this.sceneStartedAt = 0;

    this.stars = [];
    this.lastStarAt = 0;
    this.score = 0;
    this.flashUntil = 0; // the screen flashes red until this time after a dying star

    // saved in this browser between visits
    this.highScore = getItem(this.highScoreKey) || 0;
    this.isNewHighScore = false;
    // the lowest score ever: a "high score" for favouring the dying stars
    this.sympathyScore = getItem(this.sympathyScoreKey) || 0;
    this.isNewSympathyScore = false;
  }

  changeScene(newScene) {
    this.scene = newScene;
    this.sceneStartedAt = millis();
  }

  secondsInScene() {
    return (millis() - this.sceneStartedAt) / 1000;
  }

  secondsLeft() {
    return this.roundSeconds - this.secondsInScene();
  }

  countdownLeft() {
    return this.countdownSeconds - this.secondsInScene();
  }

  // on the game over screen, wait a moment before the play again star shows up
  canRestart() {
    return this.secondsInScene() > this.restartDelaySeconds;
  }

  startRound() {
    this.level = this.levels[0];
    this.levelStartedAt = millis();
    this.stars = [];

    // drop in the first few stars with a loop, spread out above the canvas
    for (let i = 0; i < this.starsAtStart; i++) {
      let star = this.level.createRandomStar();
      star.y = random(-height, -star.r);
      this.stars.push(star);
    }

    this.score = 0;
    this.isNewHighScore = false;
    this.isNewSympathyScore = false;
    this.lastStarAt = millis();
    this.changeScene("playing");
  }

  // move up a level once enough of the round has gone by
  updateLevel() {
    for (let level of this.levels) {
      if (level.number > this.level.number && this.secondsInScene() >= level.startsAt) {
        this.level = level;
        this.levelStartedAt = millis();
      }
    }
  }

  // true for a moment after moving up a level, to show "LEVEL 2"
  isNewLevel() {
    return this.level.number > 1 && millis() - this.levelStartedAt < 1500;
  }

  spawnStars() {
    if (millis() - this.lastStarAt > this.level.secondsBetweenStars * 1000) {
      this.stars.push(this.level.createRandomStar());
      this.lastStarAt = millis();
    }
  }

  // move and draw every star, and catch the ones the finger touches
  updateStars(finger) {
    // go backwards because we remove stars while looping
    for (let i = this.stars.length - 1; i >= 0; i--) {
      let star = this.stars[i];
      star.update();
      star.show();

      if (finger !== null && star.isTouching(finger.x, finger.y, this.catchPadding)) {
        this.catchStar(star);
        this.stars.splice(i, 1);
      } else if (star.isOffScreen()) {
        this.stars.splice(i, 1);
      }
    }
  }

  catchStar(star) {
    if (star.isDying) {
      this.score -= this.dyingStarPenalty; // yes, it can go below 0
      this.flashUntil = millis() + 150;
      playSound(badSound);
    } else {
      this.score++;
      playSound(goodSound);
    }
  }

  isFlashing() {
    return millis() < this.flashUntil;
  }

  endRound() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.isNewHighScore = true;
      storeItem(this.highScoreKey, this.highScore);
    }
    if (this.score < this.sympathyScore) {
      this.sympathyScore = this.score;
      this.isNewSympathyScore = true;
      storeItem(this.sympathyScoreKey, this.sympathyScore);
    }
    this.changeScene("gameOver");
  }
}
