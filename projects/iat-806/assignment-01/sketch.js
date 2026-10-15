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
  deadly: false,
};

let blueDoor = {
  x: 455, y: 180, w: 110, h: 230,
  color: [25, 50, 150],
  glow: [70, 110, 230],
  name: "blue",
  deadly: false,
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

/* ---------- mouse / key interactions for the rooms ----------- */
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

  // press space or escape to go back
  if (key === " " || key === ESCAPE) {
    scene = "doors";
    return false;
  }
}

/** -----------------------------------------------------------
 * LIMINAL SPACES
 * ------------------------------------------------------------
*/

let rooms = [
  { name: "The Backrooms, Level 0", draw: drawBackrooms },
  { name: "Office, Everyone Went Home", draw: drawOffice },
  { name: "Empty Pool, After Closing", draw: drawPool },
  { name: "The Hallway That Doesn't End", draw: drawHallway },
  { name: "Playground, 3:07 AM", draw: drawPlayground },
];
let chosenDoor;
let currentRoom;
let survival = 0;
let message = "";
let stars = [];

function drawLiminalSpace() {
  // create the space background and assets here
  currentRoom.draw();

  // the screen/lights flicker randomly
  if (random() < 0.03) {
    noStroke();
    fill(0, 170);
    rect(0, 0, W, H);
  }

  drawInformationPanel();
}

function enterLiminalSpace(door) {
  // set the scene, pick a random liminal space and survival ratings
  chosenDoor = door;
  currentRoom = random(rooms);

  survival = floor(random(0, 101));
  // making a random door deadlier each time
  deadlierDoor = random(["red", "blue"]);
  chosenDoor.deadly = (door.name === deadlierDoor);
  if (chosenDoor.deadly) {
    survival = floor(survival * 0.8);
  }
  pickMessage();

  // pick star positions once, so they don't jump around every frame
  stars = [];
  for (let i = 0; i < 50; i++) {
    stars.push({ x: random(W), y: random(0, 300), size: random(1, 3) });
  }

  scene = "liminal-space";
}

// Creepy messages in the game, depending on the survival rating
// Based on the liminal space content on insta/youtube and general eerie-ness
// from the horror books I've read and the fantasy podcasts I've listened to
let badMessages = [
  "The floor is damp. You don't know why.",
  "Something is humming. It isn't the lights.",
  "You've walked past this spot before. Many times.",
  "Nobody is coming. Except the entity lurking in the walls.",
  "There are no windows. You probably wouldn't want to see what's outside anyway."
];

let okayMessages = [
  "You found a vending machine. It only takes coins you don't have.",
  "The only sound is the dull beating of your own heart. Or were those footsteps?",
  "There's an exit sign. It's very far away.",
  "There's someone behind you. You'll be fine as long as you don't turn to look."
];

let goodMessages = [
  "You hear a door open somewhere. That's probably good.",
  "Honestly... it's kind of peaceful here. You can lay down and sleep.",
  "You brought snacks. You'll be fine. If you run out, you can find a self-serve food truck.",
  "An entity shows you the way home. You thank them by giving them 10% of your soul."
];

function pickMessage() {
  if (survival < 30) {
    message = random(badMessages);
  } else if (survival < 70) {
    message = random(okayMessages);
  } else {
    message = random(goodMessages);
  }
}

function drawInformationPanel() {
  // dark panel at the bottom
  noStroke();
  fill(0, 210);
  rect(0, H - 110, W, 110);

  textAlign(LEFT, TOP);
  fill(255);
  textSize(18);
  text(currentRoom.name, 20, H - 98);

  fill(160);
  textSize(12);

  let deadlyText = chosenDoor.deadly ? " - deadly" : "";
  text("(you came through the " + chosenDoor.name + " door)" + deadlyText, 20, H - 74);

  // survival progess bar - red, yellow, green
  let barX = 520;
  let barY = H - 96;
  let barW = 260;
  fill(60);
  rect(barX, barY, barW, 16);
  if (survival < 30) {
    fill(220, 50, 50); // red
  } else if (survival < 70) {
    fill(230, 190, 50); // yellow
  } else {
    fill(70, 200, 100); // green
  }
  rect(barX, barY, barW * survival / 100, 16);

  fill(255);
  textAlign(RIGHT, TOP);
  textSize(14);
  text("SURVIVAL " + survival + "%", barX + barW, barY + 22);

  textAlign(LEFT, TOP);
  fill(220);
  textSize(14);
  text(message, 20, H - 50);

  fill(120);
  textSize(11);
  text("Press SPACE or ESC to go back", 20, H - 22);
}

/**
 * -------------------------------
 * draw the individual rooms
 * -------------------------------
*/

// BACKROOMS
let roomWall = { x: 260, y: 150, w: 280, h: 180 };
let roomColors = { // shades of yellow for the backrooms
  ceiling: [210, 200, 140],
  left: [205, 190, 105],
  right: [205, 190, 105],
  floor: [140, 125, 75],
  back: [220, 205, 115],
}
function drawBackrooms() {
  drawRoomBackground(roomWall, roomColors.ceiling, roomColors.left, roomColors.right, roomColors.floor, roomColors.back);

  // add some wallpaper stripes on the back
  stroke(185, 170, 95);
  strokeWeight(1);
  for (let x = roomWall.x + 14; x < roomWall.x + roomWall.w; x += 14) {
    line(x, roomWall.y, x, roomWall.y + roomWall.h);
  }

  // add a door at the back wall
  noStroke();
  fill(70, 60, 25);
  rect(roomWall.x + 170, roomWall.y + 60, 50, 120);

  // draw some ceiling lights, smaller the further away using map
  noStroke();
  fill(255, 255, 225);
  for (let i = 0; i < 4; i++) {
    let y = map(i, 0, 4, 15, roomWall.y - 8);
    let w = map(i, 0, 4, 220, roomWall.w / 4);
    let h = map(i, 0, 4, 28, 6);
    rect(W / 2 - w / 2, y, w, h);
  }
}

// ABANDONED OFFICE
let officeWall = { x: 300, y: 110, w: 200, h: 130 };
let officeColors = { // grays
  ceiling: [200, 200, 195],
  left: [170, 170, 165],
  right: [170, 170, 165],
  floor: [80, 90, 105],
  back: [185, 185, 180],
}
function drawOffice() {
  drawRoomBackground(officeWall, officeColors.ceiling, officeColors.left, officeColors.right, officeColors.floor, officeColors.back);

  // draw rows of cubicle walls
  stroke(60);
  strokeWeight(1);
  for (let i = 3; i >= 0; i--) {
    let bottom = map(i, 0, 4, 385, officeWall.y + officeWall.h + 10);
    let w = map(i, 0, 4, 420, 220);
    let h = map(i, 0, 4, 45, 15);
    fill(120, 125, 140);
    rect(W / 2 - w / 2, bottom - h, w, h);

    // dividers between cubicles
    for (let j = 1; j < 4; j++) {
      let x = W / 2 - w / 2 + (w / 4) * j;
      line(x, bottom - h, x, bottom);
    }

    // one computer
    if (i === 2) {
      noStroke();
      fill(120, 200, 255);
      rect(W / 2 + w / 4 + 8, bottom - h - 14, 22, 14);
      stroke(60);
    }
  }

  // draw some ceiling lights, smaller the further away using map
  noStroke();
  fill(255, 255, 225);
  for (let i = 0; i < 4; i++) {
    let y = map(i, 0, 4, 15, officeWall.y - 8);
    let w = map(i, 0, 4, 220, officeWall.w / 4);
    let h = map(i, 0, 4, 28, 6);
    rect(W / 2 - w / 2, y, w, h);
  }
}

// POOL
let poolColors = {
  ceiling: [30, 35, 45],
  left: [150, 200, 215],
  right: [150, 200, 215],
  floor: [110, 180, 210],
  back: [170, 215, 225],
}
function drawPool() {
  drawRoomBackground(roomWall, poolColors.ceiling, poolColors.left, poolColors.right, poolColors.floor, poolColors.back);

  // draw tile grid on the back wall
  stroke(120, 170, 190);
  strokeWeight(1);
  for (let x = roomWall.x; x <= roomWall.x + roomWall.w; x += 20) {
    line(x, roomWall.y, x, roomWall.y + roomWall.h);
  }
  for (let y = roomWall.y; y <= roomWall.y + roomWall.h; y += 20) {
    line(roomWall.x, y, roomWall.x + roomWall.w, y);
  }

  // draw a lane line on the bottom of the empty pool
  stroke(30, 60, 120);
  strokeWeight(6);
  line(W / 2, H, W / 2, roomWall.y + roomWall.h);

  // draw a beach ball
  noStroke();
  fill(220, 50, 50);
  arc(520, 352, 44, 44, PI, TWO_PI);
  fill(245);
  arc(520, 352, 44, 44, 0, PI);
  strokeWeight(1);

  // draw a pink pool ring
  noStroke()
  fill(255, 105, 180);
  ellipse(280, 352, 80, 40);
  // pool ring hole
  fill(poolColors.floor);
  ellipse(280, 352, 60, 20);

  // draw a adder on the back wall
  stroke(210);
  strokeWeight(4);
  let lx = roomWall.x + 40;
  line(lx, roomWall.y + 10, lx, roomWall.y + 120);
  line(lx + 30, roomWall.y + 10, lx + 30, roomWall.y + 120);
  for (let y = roomWall.y + 30; y < roomWall.y + 120; y += 25) {
    line(lx, y, lx + 30, y);
  }
}

function drawHallway() {
  background(0);
  stroke(0, 90);
  strokeWeight(2);
  rectMode(CENTER);
 
  // frames inside frames, smaller and darker the further they go
  for (let i = 0; i < 14; i++) {
    let w = map(i, 0, 14, W + 100, 20);
    let h = map(i, 0, 14, H + 100, 14);
    let shade = map(i, 0, 14, 200, 25);
    if (i % 2 === 0) {
      fill(shade, shade * 0.95, shade * 0.8);
    } else {
      fill(shade * 0.85, shade * 0.8, shade * 0.65);
    }
    rect(W / 2, 190, w, h);
  }
 
  // an exit sign at the very end
  noStroke();
  fill(40, 255, 120);
  rect(W / 2, 176, 14, 5);
  rectMode(CORNER);
}
 
function drawPlayground() {
  background(10, 12, 35);
 
  // stars (their positions were picked in enterRoom)
  noStroke();
  fill(255);
  for (let s of stars) {
    circle(s.x, s.y, s.size);
  }
 
  // crescent moon: a light circle with a sky-colored circle on top
  fill(240, 235, 200);
  circle(650, 80, 60);
  fill(10, 12, 35);
  circle(665, 72, 50);
 
  // ground
  fill(35, 40, 30);
  rect(0, 330, W, H - 330);
 
  // slide: ladder, platform and slope
  stroke(170);
  strokeWeight(3);
  line(150, 330, 150, 220);
  line(175, 330, 175, 220);
  for (let y = 240; y < 330; y += 20) {
    line(150, y, 175, y);
  }
  fill(160, 60, 60);
  rect(145, 214, 35, 8);
  triangle(178, 222, 310, 330, 178, 240);
 
  // swing set frame
  stroke(150);
  strokeWeight(4);
  line(450, 330, 490, 200);
  line(650, 330, 610, 200);
  line(490, 200, 610, 200);
 
  // one swing is moving on its own. sin() swings back and forth.
  let sway = sin(frameCount * 0.04) * 25;
  strokeWeight(2);
  fill(90);
  line(520, 200, 520 + sway, 290);
  line(545, 200, 545 + sway, 290);
  rect(515 + sway, 288, 35, 6);
 
  // the other one is perfectly still
  line(565, 200, 565, 290);
  line(590, 200, 590, 290);
  rect(560, 288, 35, 6);
}
