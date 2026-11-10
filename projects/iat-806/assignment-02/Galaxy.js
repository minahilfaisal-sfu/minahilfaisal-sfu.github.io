// The marker on the fingertip: a small spinning spiral galaxy.
// radius is how far its arms reach from the center.
class Galaxy {
  constructor(radius) {
    this.radius = radius;
    this.particles = [];

    // scatter little dots along two spiral arms
    let arms = 2;
    for (let i = 0; i < 140; i++) {
      let arm = i % arms;
      let distance = pow(random(), 0.8) * radius; // how far from the center
      // each arm curls further around the further out it goes
      let angle =
        (TWO_PI / arms) * arm + distance * 0.18 + random(-0.35, 0.35);
      this.particles.push({ angle: angle, distance: distance, size: random(1.2, 2.8) });
    }
  }

  show(x, y) {
    push();
    translate(x, y);
    rotate(millis() * 0.0015); // slowly spins

    // bright glowing core
    noStroke();
    drawingContext.shadowBlur = 25;
    drawingContext.shadowColor = "rgb(170, 120, 255)";
    fill(255, 240, 255);
    circle(0, 0, this.radius * 0.35);
    drawingContext.shadowBlur = 0;

    // ADD makes overlapping dots glow brighter, like real starlight
    blendMode(ADD);
    for (let p of this.particles) {
      let t = p.distance / this.radius; // 0 at the center, 1 at the edge
      // white-pink near the center, blue-purple at the edge
      fill(lerp(255, 90, t), lerp(200, 120, t), 255, lerp(230, 90, t));
      circle(cos(p.angle) * p.distance, sin(p.angle) * p.distance, p.size);
    }
    blendMode(BLEND);
    pop();
  }
}
