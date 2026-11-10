// One difficulty level. The game moves up a level as the round goes on.
// number and name are shown on screen when the level starts
// startsAt is how many seconds into the round this level begins
// secondsBetweenStars is how often a new star falls
// minSpeed and maxSpeed are how fast stars fall, in pixels per second
// dyingChance is from 0 to 1: how likely each new star is a dying one
class Level {
  constructor(number, name, startsAt, secondsBetweenStars, minSpeed, maxSpeed, dyingChance) {
    this.number = number;
    this.name = name;
    this.startsAt = startsAt;
    this.secondsBetweenStars = secondsBetweenStars;
    this.minSpeed = minSpeed;
    this.maxSpeed = maxSpeed;
    this.dyingChance = dyingChance;
  }

  // a new star just above the canvas, using this level's settings
  createRandomStar() {
    let r = random(20, 34);
    let x = random(r, width - r);
    let y = -r;
    let speed = random(this.minSpeed, this.maxSpeed);
    let isDying = random() < this.dyingChance;
    return new Star(x, y, r, speed, isDying);
  }
}
