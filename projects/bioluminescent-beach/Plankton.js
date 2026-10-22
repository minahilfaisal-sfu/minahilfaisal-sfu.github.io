// A single speck of bioluminescent plankton.
// Instead of a fixed x, each speck remembers how far it sits from the
// shoreline (its "offset"). Its real x is worked out every frame from
// shoreX() in sketch.js, so the glitter rides in and out with the waves.

class Plankton {
  constructor(y, offset, c, r, maxR = 3) {
    this.y = y;
    this.offset = offset;          // negative = in the water, positive = on wet sand
    this.x = shoreX(y) + offset;
    this.color = c;
    this.originalColor = c;
    this.highlightColor = color(140, 255, 235);
    this.r = r;                    // radius of the bright core
    this.maxR = maxR;
    this.twinkle = random(TWO_PI); // each speck flickers on its own rhythm
    this.glow = 0;                 // 0 = resting, 1 = fully lit up
    this.brightness = 1;           // overall dimmer, used by the subclasses
    this.visible = true;
  }

  update(byHowMuch) {
    this.changeSize(byHowMuch * 0.15);
    this.move(byHowMuch);
    this.show();
  }

  // reach lets a fingertip "disturb" plankton a little before touching it
  contains(pointX, pointY, reach = 0) {
    return dist(this.x, this.y, pointX, pointY) < this.r + reach;
  }

  // true if any of the given points (fingertips, the mouse) is close enough
  touchedByAny(points, reach) {
    return points.some((p) => this.contains(p.x, p.y, reach));
  }

  respond(active) {
    if (active) {
      this.highlight();
    } else {
      this.removeHighlight();
    }
  }

  // Real plankton flash when disturbed, then slowly fade
  highlight() {
    this.glow = 1;
  }

  removeHighlight() {
    this.glow = max(0, this.glow - 0.015);
  }

  move(byHowMuch) {
    this.offset += random(-byHowMuch, byHowMuch);
    this.y += random(-byHowMuch, byHowMuch) * 0.5;

    // stay hugging the border: mostly in the shallows, a little on the sand
    this.offset = constrain(this.offset, -45, 12);
    if (this.y < 0) this.y += height;
    if (this.y > height) this.y -= height;

    this.x = shoreX(this.y) + this.offset;
  }

  changeSize(byHowMuch) {
    this.r = constrain(this.r + random(-byHowMuch, byHowMuch), 0.8, this.maxR);
  }

  show() {
    this.twinkle += 0.05;
    if (!this.visible) return;
    let flicker = 0.55 + 0.45 * sin(this.twinkle);
    let c = lerpColor(this.originalColor, this.highlightColor, this.glow);
    let size = this.r * (1 + this.glow * 0.8);

    noStroke();
    // soft halo
    fill(red(c), green(c), blue(c), (25 * flicker + 15 * this.glow) * this.brightness);
    circle(this.x, this.y, size * 6);
    // bright core
    fill(red(c), green(c), blue(c), (140 * flicker + 60 * this.glow) * this.brightness);
    circle(this.x, this.y, size * 2);
  }
}

// ------------------------------------------------------------
// Glitter riding the swells out in the water.
// Same behaviour as Plankton, it just follows one of the wave lines
// instead of the shoreline, and fades in and out with that wave.
// ------------------------------------------------------------
class WaveGlitter extends Plankton {
  constructor(waveIndex, y) {
    let c = color(40, 120 + random(-30, 30), 255);  // deeper blue than the shallows
    super(y, random(-5, 5), c, random(0.7, 1.6), 2);
    this.waveIndex = waveIndex;
    this.highlightColor = color(120, 220, 255);
    this.move(0);
  }

  move(byHowMuch) {
    this.offset = constrain(this.offset + random(-byHowMuch, byHowMuch) * 0.5, -8, 8);
    this.y += random(-byHowMuch, byHowMuch) * 0.5;
    if (this.y < 0) this.y += height;
    if (this.y > height) this.y -= height;

    this.x = waveX(this.waveIndex, this.y) + this.offset;
    this.brightness = waveStrength(this.waveIndex);
  }
}

// ------------------------------------------------------------
// Specks on the sand.
//  "glint":    moonlight catching quartz and shell on the dry sand
//  "stranded": plankton the tide left behind on the wet sand
// Neither drifts much, and both hide when the water covers them.
// ------------------------------------------------------------
class SandGlitter extends Plankton {
  constructor(kind) {
    let y = random(0, height);
    let c, r;
    if (kind === "glint") {
      c = random() < 0.5 ? color(255, 225, 170) : color(215, 222, 240); // warm gold or silver
      r = random(0.5, 1.1);
    } else {
      c = color(60, 230, 170); // green-teal, dimmer than the shallows
      r = random(0.8, 1.6);
    }
    super(y, 0, c, r, kind === "glint" ? 1.3 : 2);
    this.kind = kind;
    this.highlightColor = kind === "glint" ? color(255, 250, 225) : color(150, 255, 210);
    if (kind === "glint") {
      // anywhere from the waterline to the right edge
      this.x = random(shoreX(y) - 20, width);
    } else {
      this.offset = random(4, 34); // a strip just up the beach from the water
    }
    this.twinkle = random(TWO_PI);
  }

  move(byHowMuch) {
    // sand doesn't wander: only the tiniest shimmer
    if (this.kind === "stranded") {
      this.x = shoreX(this.y, -0.3) + this.offset + random(-0.3, 0.3);
      this.brightness = 0.55;
    } else {
      this.brightness = 0.6 + 0.4 * sin(this.twinkle * 0.7); // slow sparkle
    }
    // under the water? then don't draw it
    this.visible = this.x > shoreX(this.y);
  }

  changeSize() {}
}

function createRandomPlankton() {
  let y = random(0, height);
  // more specks right at the waterline, fewer further out
  let offset = -abs(randomGaussian(0, 18)) + random(0, 8);
  let c = color(30, 200 + random(-40, 40), 230 + random(-25, 25));
  let r = random(1, 2.5);
  return new Plankton(y, offset, c, r);
}
