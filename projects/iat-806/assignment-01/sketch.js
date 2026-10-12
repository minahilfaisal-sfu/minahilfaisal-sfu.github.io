let W = 800, H = 500;

let scene = "doors"; // can be "doors" or "liminal-space"

function setup() {
  let canvas = createCanvas(W, H);
  canvas.parent("sketch-holder");
  textFont("Courier New");
}

function draw() {
  if (scene === "doors") {
    drawDoorsRoom();
  } else {
    drawLiminalSpace();
  }
}

/** ----------------------------------------------
 *   DOORS ROOM AND HALL VARIABLES AND FUNCTIONS
 * main room with two doors, red and blue.
 * user can hover over the doors
 * click on them to enter a random liminal space
 * or they can use keys to enter
 * -----------------------------------------------
*/

let hallWall = { x: 150, y: 70, w: 500, h: 340 };
let hallColors = {
  ceiling: [20, 18, 24],
  left: [38, 34, 42],
  right: [38, 34, 42],
  floor: [30, 26, 30],
  back: [55, 50, 60],
}

let redDoor = {
  x: 235, y: 180, w: 110, h: 230,
  color: [150, 25, 35],   // normal color
  glow: [220, 60, 70],  // color when the mouse is over it
  name: "red",
};

let blueDoor = {
  x: 455, y: 180, w: 110, h: 230,
  color: [25, 50, 150],
  glow: [70, 110, 230],
  name: "blue",
};

function isMouseOverDoor(door) {
  return mouseX > door.x && mouseX < door.x + door.w &&
          mouseY > door.y && mouseY < door.y + door.h;
}

function drawDoor(door) {
  let isHovering = isMouseOverDoor(door);
  let bottom = door.y + door.h;

  // apply hovering affects, the door glows
  // light spilling affect shows on floor
  if (isHovering) {
    noStroke();
    fill(door.glow[0], door.glow[1], door.glow[2], 60);
    quad(door.x, bottom, door.x + door.w, bottom, door.x + door.w + 80, H, door.x - 80, H);
  }

  // draw the door
  stroke(10);
  strokeWeight(3);
  if (isHovering) {
    fill(door.glow);
  } else {
    fill(door.color);
  }
  rect(door.x, door.y, door.w, door.h);

  // draw the door panels
  strokeWeight(2);
  noFill();
  rect(door.x + 15, door.y + 15, door.w - 30, door.h * 0.35);
  rect(door.x + 15, door.y + door.h * 0.52, door.w - 30, door.h * 0.4);

  // draw the doorknob
  fill(200, 170, 80); // yellow
  circle(door.x + door.w - 22, door.y + door.h * 0.46, 12);
  strokeWeight(1);
}

function drawDoorsRoom() {
  background(0);
  drawRoomBackground(hallWall, hallColors.ceiling, hallColors.left, hallColors.right, hallColors.floor, hallColors.back);

  drawDoor(redDoor);
  drawDoor(blueDoor);

  noStroke();
  textAlign(CENTER, CENTER);
  fill(230);
  textSize(22);
  text("PICK A DOOR", W / 2, 115);
  fill(150);
  textSize(13);
  text("click one or press R / B", W / 2, 142);
}

// Draws a room with a back wall, ceiling, floor and side walls.
function drawRoomBackground(room, ceilingColor, leftColor, rightColor, floorColor, backColor) {
  let left = room.x;
  let right = room.x + room.w;
  let top = room.y;
  let bottom = room.y + room.h;

  stroke(0, 60);
  strokeWeight(1);
  // ceiling
  fill(ceilingColor);
  // quad(1st point's x, 1st y, 2nd x, 2nd y, 3rd x, 3rd y, 4th x, 4th y)
  quad(0, 0, W, 0, right, top, left, top);
  // floor
  fill(floorColor);
  quad(0, H, W, H, right, bottom, left, bottom);
  // left wall
  fill(leftColor);
  quad(0, 0, left, top, left, bottom, 0, H);
  // right wall
  fill(rightColor);
  quad(W, 0, W, H, right, bottom, right, top);
  // back wall
  fill(backColor);
  rect(left, top, room.w, room.h);
}

/* ---------- mouse interactions for the door room ----------- */

function mousePressed() {
  if (scene === "doors") {
    if (isMouseOverDoor(redDoor)) {
      enterLiminalSpace(redDoor);
    } else if (isMouseOverDoor(blueDoor)) {
      enterLiminalSpace(blueDoor);
    }
  }
}

function keyPressed() {
  if (scene === "doors") {
    if (key === "r" || key === "R") {
      enterLiminalSpace(redDoor);
    } else if (key === "b" || key === "B") {
      enterLiminalSpace(blueDoor);
    }
  }

  // press space to go back
  if (key === " ") {
    scene = "doors";
    return false;
  }
}

/** -----------------------------------------------------------
 * LIMINAL SPACES
 * ------------------------------------------------------------
*/

function drawLiminalSpace() {
  // create the space background and assets here
}


function enterLiminalSpace(doorUsed) {
  // set the scene, pick a random liminal space and survival ratings
  scene = "liminal-space";



  fill("black")
  rect(0, 0, W, H);
  text("You entered through the", doorUsed.name, "door.")
}