// A stem, a five-petal flower, and a leaf — basic shapes and a bezier curve.
//
// Written in p5 "instance mode" (everything hangs off the "p" argument)
// instead of global setup()/draw(), so this sketch can share a page with
// the turtle sketch below without their functions colliding.

new p5(function (p) {
  p.setup = function () {
    p.createCanvas(800, 600);
  };

  p.draw = function () {
    p.background(135, 206, 235);
    stem();
    flower();
    leaf();
  };

  function flower() {
    p.noStroke();
    p.fill(255, 182, 193);
    p.circle(400, 265, 50);
    p.circle(433, 289, 50);
    p.circle(421, 328, 50);
    p.circle(379, 328, 50);
    p.circle(367, 289, 50);

    p.fill(255, 221, 0);
    p.circle(400, 300, 40);
  }

  function leaf() {
    p.noStroke();
    p.fill(0, 100, 0);
    p.push();
    p.translate(430, 450);
    p.rotate(-45);
    p.ellipse(0, 0, 70, 30);
    p.pop();
  }

  function stem() {
    p.noFill();
    p.stroke(144, 238, 144);
    p.strokeWeight(5);
    p.bezier(400, 340, 380, 420, 420, 500, 400, 580);
  }
}, "shapes-holder");
