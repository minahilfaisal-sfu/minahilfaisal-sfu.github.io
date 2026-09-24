// KardunTurtle — give the turtle instructions and watch it draw.
//
// Everything you need to change is in this file.
//
// Written in p5 "instance mode" (everything hangs off the "p" argument)
// instead of global setup()/draw(), so this sketch can share a page with
// the shapes sketch above without their functions colliding.

new p5(function (p) {
  let turtle;

  p.setup = async function () {
    p.createCanvas(800, 600);

    // The turtle's face. Drop any image into this folder and point at it here —
    // it gets scaled and cropped into a circle, so anything roughly square works.
    const face = await p.loadImage("my-image.png");

    // Make a turtle near the bottom left, facing up.
    turtle = new KardunTurtle(p, 200, 420, face);

    giveInstructions();
  };

  // ---------------------------------------------------------------
  // YOUR INSTRUCTIONS GO HERE
  // ---------------------------------------------------------------

  function drawStarPoint(length) {
    turtle.left(70);
    turtle.forward(length);
    turtle.right(160);
    turtle.forward(length);
  }

  function giveInstructions() {
    turtle.penColor("yellow");
    turtle.penWidth(4);

    turtle.penUp();
    turtle.forward(140);

    turtle.left(10);
    turtle.penDown();

    let shortEdge = 100;
    let longEdge = 140;

    // Press a face onto the canvas, so we can see where we started.
    turtle.stamp();

    // left point
    drawStarPoint(shortEdge);
    // top point
    drawStarPoint(longEdge);
    // right point
    drawStarPoint(shortEdge);
    // bottom point
    drawStarPoint(longEdge);

    // next smaller star
    turtle.penUp();

    turtle.right(40);
    turtle.forward(160);
    turtle.left(40);

    let shortEdge2 = 40;
    let longEdge2 = 60;

    turtle.penDown();

    // Press a face onto the canvas, so we can see where we started.
    turtle.stamp();

    // left point
    drawStarPoint(shortEdge2);
    // top point
    drawStarPoint(longEdge2);
    // right point
    drawStarPoint(shortEdge2);
    // bottom point
    drawStarPoint(longEdge2);
  }

  p.draw = function () {
    p.background("#14161a");
    turtle.update(); // runs the next bit of the instructions and draws everything
  };

  // Press R to start over.
  p.keyPressed = function () {
    if (p.key === "r" || p.key === "R") {
      turtle.reset();
      giveInstructions();
    }
  };
}, "turtle-holder");

// ---------------------------------------------------------------
// Everything the turtle understands
// ---------------------------------------------------------------
//
//   turtle.forward(100)        walk forward, drawing if the pen is down
//   turtle.backward(100)       walk backward
//   turtle.right(90)           turn clockwise, in degrees
//   turtle.left(90)            turn counter-clockwise
//
//   turtle.penUp()             stop drawing
//   turtle.penDown()           start drawing again
//   turtle.penColor("red")     any p5 color
//   turtle.penWidth(8)         line thickness
//
//   turtle.goTo(100, 200)      jump to a point
//   turtle.setHeading(0)       0 = right, 90 = down, -90 = up
//   turtle.home()              back to the start, facing up
//   turtle.stamp()             print the turtle's face onto the drawing
//   turtle.erase()             wipe the drawing, keep the turtle
//   turtle.repeat(4, fn)       do a set of instructions n times
//
//   turtle.setSpeed(4)         pixels per frame — bigger is faster
//   turtle.instant()           no animation, draw it all at once
//   turtle.setSize(80)         how big the turtle is drawn
//   turtle.hide() / .show()    show or hide the turtle itself
//   turtle.reset()             clear everything
