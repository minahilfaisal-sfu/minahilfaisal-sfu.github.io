// ===========================================================
// Decorative vine border, drawn in the empty margins on wide
// screens. Two p5.js sketches in "instance mode" so they never
// collide with a sketch.js that uses global setup()/draw().
//
// The pattern is seeded, so it looks the same on every visit.
// Hover your mouse over a vine and it sways gently.
//
// Safe to ignore or delete — nothing else on the site depends
// on this file.
// ===========================================================

const VINE_SEED = 806;

function vineSketch(side) {
  return function (p) {
    const containerId = side === "left" ? "vine-left" : "vine-right";
    let railWidth = 80;
    let points = [];
    let decorations = [];
    let hovering = false;

    function buildPattern(h) {
      points = [];
      decorations = [];
      p.noiseSeed(VINE_SEED + (side === "right" ? 100 : 0));

      const step = 10;
      const amp = railWidth * 0.28;
      const midX = railWidth / 2;

      for (let y = -step; y <= h + step; y += step) {
        const n = p.noise(y * 0.006);
        const x = midX + p.map(n, 0, 1, -amp, amp);
        points.push({ x, y });
      }

      let y = 40;
      let i = 0;
      while (y < h - 20) {
        const idx = Math.min(Math.round((y + step) / step), points.length - 1);
        const base = points[idx] || { x: midX, y };
        decorations.push({
          x: base.x,
          y: base.y,
          dir: i % 2 === 0 ? 1 : -1,
          kind: i % 3 === 0 ? "flower" : "leaf",
          phase: i,
        });
        y += 70 + p.noise(i * 3.1) * 60;
        i++;
      }
    }

    function drawLeaf(x, y, dir, angle) {
      p.push();
      p.translate(x, y);
      p.rotate(angle);
      p.noFill();
      p.stroke(79, 122, 92, 130);
      p.strokeWeight(1);
      p.bezier(0, 0, dir * 14, -4, dir * 16, 6, dir * 2, 10);
      p.bezier(dir * 2, 10, dir * 8, 4, dir * 6, -2, 0, 0);
      p.stroke(79, 122, 92, 90);
      p.line(0, 0, dir * 10, 5);
      p.pop();
    }

    function drawFlower(x, y, angle) {
      p.push();
      p.translate(x, y);
      p.rotate(angle);
      p.noFill();
      p.stroke(201, 88, 125, 140);
      p.strokeWeight(1);
      const petals = 5;
      const r = 6;
      for (let k = 0; k < petals; k++) {
        p.push();
        p.rotate((p.TWO_PI / petals) * k);
        p.ellipse(0, -r, r * 1.3, r * 2);
        p.pop();
      }
      p.stroke(201, 88, 125, 160);
      p.strokeWeight(2.5);
      p.point(0, 0);
      p.pop();
    }

    function render(swayAmount) {
      p.clear();
      p.noFill();
      p.stroke(79, 122, 92, 100);
      p.strokeWeight(1.2);
      p.beginShape();
      points.forEach((pt, idx) => {
        const wobble = swayAmount
          ? Math.sin(p.frameCount * 0.045 + idx * 0.25) * swayAmount
          : 0;
        p.vertex(pt.x + wobble, pt.y);
      });
      p.endShape();

      decorations.forEach((d) => {
        const idx = Math.min(Math.round(d.y / 10) + 1, points.length - 1);
        const wobble = swayAmount
          ? Math.sin(p.frameCount * 0.045 + idx * 0.25) * swayAmount
          : 0;
        const angle = swayAmount
          ? Math.sin(p.frameCount * 0.03 + d.phase) * 0.12
          : 0;
        const x = d.x + wobble;
        if (d.kind === "flower") drawFlower(x, d.y, angle);
        else drawLeaf(x, d.y, d.dir, angle);
      });
    }

    p.setup = function () {
      const container = document.getElementById(containerId);
      railWidth = (container && container.clientWidth) || railWidth;
      const cnv = p.createCanvas(railWidth, window.innerHeight);
      cnv.parent(container);

      buildPattern(window.innerHeight);
      render(0);
      p.noLoop();

      cnv.mouseOver(() => {
        hovering = true;
        p.loop();
      });
      cnv.mouseOut(() => {
        hovering = false;
        p.redraw();
      });
    };

    p.draw = function () {
      render(hovering ? 4 : 0);
      if (!hovering) p.noLoop();
    };

    p.windowResized = function () {
      const container = document.getElementById(containerId);
      railWidth = (container && container.clientWidth) || railWidth;
      p.resizeCanvas(railWidth, window.innerHeight);
      buildPattern(window.innerHeight);
      render(0);
    };
  };
}

document.addEventListener("DOMContentLoaded", () => {
  new p5(vineSketch("left"));
  new p5(vineSketch("right"));
});
