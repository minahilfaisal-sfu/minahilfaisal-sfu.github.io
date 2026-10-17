// Task Queue — a to-do queue drawn with p5.js.
//
// Two views of the same tasks:
//   Queue — tasks line up; the front one is "next up". Use your own order
//           (FIFO, drag cards to rearrange), or sort by priority or deadline.
//   Week  — Monday to Sunday plus a Backlog, for planning which day to work
//           on each task. Dragging a card sets its planned day and never
//           touches the deadline. Unplanned tasks sit on their deadline day.
//           If a planned day passes, the card stays there with a LATE tag.
//   Calendar — a month grid. Arrows move between months. Shows tasks either
//           by deadline or by planned day; dragging a chip changes whichever
//           of the two you're looking at.

// Same palette as style.css, as RGB arrays for p5
const colors = {
  paper: [250, 246, 239],
  raised: [255, 253, 249],
  line: [230, 221, 208],
  ink: [43, 36, 32],
  muted: [138, 127, 114],
  pink: [201, 88, 125],
  pinkSoft: [244, 221, 229],
  green: [79, 122, 92],
  greenSoft: [223, 232, 222],
  amber: [176, 120, 40],
  amberSoft: [245, 230, 205]
};

// How each priority looks, and how it sorts (lower rank = more urgent)
const PRIORITIES = {
  high: { label: "High", rank: 0, color: colors.pink, soft: colors.pinkSoft },
  medium: { label: "Medium", rank: 1, color: colors.amber, soft: colors.amberSoft },
  low: { label: "Low", rank: 2, color: colors.green, soft: colors.greenSoft }
};

// The hardcoded set behind "Load sample tasks". Edit freely.
// dueInDays is counted from today (0 = today, -1 = yesterday, null = no deadline).
const SAMPLE_TASKS = [
  { text: "Reply to unread emails", priority: "medium", dueInDays: 0 },
  { text: "Read one paper for course", priority: "high", dueInDays: 2 },
  { text: "Finish this week's coding lab", priority: "high", dueInDays: 4 },
  { text: "Push lab code to GitHub", priority: "medium", dueInDays: 4 },
  { text: "Draft research notes for thesis", priority: "high", dueInDays: -1 },
  { text: "Return library books", priority: "medium", dueInDays: -6 },
  { text: "Groceries", priority: "low", dueInDays: 1 },
  { text: "30-minute walk", priority: "low", dueInDays: null },
  { text: "Plan tomorrow", priority: "medium", dueInDays: null }
];

// --- Layout: shared ---
const CANVAS_W = 800;
const MARGIN_X = 60;
const CONTENT_W = 680;

// --- Layout: queue view ---
const QUEUE_MIN_H = 460; // the queue canvas grows past this as tasks are added
const CARD_W = CONTENT_W;
const CARD_H = 60;
const GAP = 10;
const LIST_TOP = 120;
const BTN_D = 30;       // round ✓ / edit buttons on queue cards

// --- Layout: week view ---
const WEEK_TOP = 110;
const BOX_GAP = 14;
const BOX_W = (CONTENT_W - BOX_GAP) / 2;
const BOX_HEAD = 40;
const BOX_PAD = 10;
const WCARD_H = 50;
const WCARD_GAP = 8;
const WCARD_W = BOX_W - BOX_PAD * 2;
const CHECK_X = 22; // check circle position inside a week card
const BACKLOG = 7;  // box index of the backlog (0–6 are Monday–Sunday)

// --- Layout: calendar view ---
const CAL_TOP = 130;      // where the weekday names row starts
const CAL_HEAD = 24;      // height of the weekday names row
const CELL_W = CONTENT_W / 7;
const CELL_DATE_H = 26;   // space for the date number at the top of a cell
const CHIP_H = 22;
const CHIP_GAP = 4;
const CHIP_W = CELL_W - 8;
const MIN_CHIP_SLOTS = 2; // every row has room for at least this many chips
const TRAY_CHIP_W = 150;

const STORAGE_KEY = "task-queue-v1";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

let queue = [];     // tasks still waiting, in the order they arrived
let leaving = [];   // completed tasks animating away
let doneCount = 0;
let nextId = 1;
let barProgress = 0; // smoothed progress for the bar
let orderBy = "manual"; // "manual" | "priority" | "deadline"
let view = "queue";      // "queue" | "week" | "calendar"

let weekBoxes = [];  // the week layout from the last frame, for hit-testing
let dragging = null; // { task, dx, dy, fromBox } while a card is being dragged
let pressed = null;  // queue view: a card that's been pressed but not yet dragged

let calMonth = null;  // first day of the month the calendar is showing
let calMode = "deadline"; // "deadline" | "planned" — what the calendar is laid out by
let calCells = [];    // the calendar layout from the last frame
let tray = null;      // the Undated tray under the calendar
let calButtons = [];  // the ‹ Today › buttons

class Task {
  // due: the deadline, a "YYYY-MM-DD" string or null.
  // planned: the day you plan to work on it (week view only) — a
  // "YYYY-MM-DD" string, "backlog" if moved to the backlog, or null if
  // never planned (then the week view uses the deadline instead).
  constructor(text, priority, due, startX, startY, planned = null) {
    this.id = nextId++;
    this.text = text;
    this.priority = PRIORITIES[priority] ? priority : "medium";
    this.due = due || null;
    this.planned = planned || null;
    this.x = startX;
    this.y = startY;
    this.w = CARD_W;  // current size, eased between views
    this.h = CARD_H;
    this.alpha = 0;
    this.doneTimer = -1; // -1 = still waiting; counts frames once done
  }

  // Whole days from today until the deadline (negative = overdue), or null
  daysLeft() {
    if (!this.due) return null;
    return Math.round((parseDate(this.due) - today()) / 86400000);
  }

  isOverdue() {
    const days = this.daysLeft();
    return days !== null && days < 0;
  }

  // The day this task sits on in the week view: its planned day, or its
  // deadline if it hasn't been planned. null = backlog.
  weekDate() {
    if (this.planned === "backlog") return null;
    return this.planned || this.due;
  }

  // Has its day in the week view already passed?
  isPlanLate() {
    const key = this.weekDate();
    return key !== null && parseDate(key) < today();
  }

  // Ease toward a spot on the canvas and fade in
  update(targetX, targetY, targetW, targetH) {
    this.x = lerp(this.x, targetX, 0.18);
    this.y = lerp(this.y, targetY, 0.18);
    this.w = lerp(this.w, targetW, 0.25);
    this.h = lerp(this.h, targetH, 0.25);
    this.alpha = lerp(this.alpha, 255, 0.15);
  }

  // After completion: flash green for a moment, then leave
  updateLeaving() {
    this.doneTimer++;
    if (this.doneTimer > 18) {
      if (view === "queue") this.x += (this.doneTimer - 18) * 1.6; // slide off
      this.alpha -= view === "queue" ? 10 : 14;
    }
  }

  isGone() {
    return this.alpha <= 0 || this.x > width;
  }

  contains(px, py) {
    return px > this.x && px < this.x + this.w && py > this.y && py < this.y + this.h;
  }

  // Is the point on the little check circle? (week and calendar views)
  onCheck(px, py) {
    if (view === "calendar") return dist(px, py, this.x + 12, this.y + this.h / 2) < 9;
    return dist(px, py, this.x + CHECK_X, this.y + WCARD_H / 2) < 13;
  }

  // Queue view: which round button (if any) is at this point
  queueButtonAt(px, py) {
    const cy = this.y + CARD_H / 2;
    if (dist(px, py, this.x + this.w - 30, cy) < BTN_D / 2 + 2) return "check";
    if (dist(px, py, this.x + this.w - 68, cy) < BTN_D / 2 + 2) return "edit";
    return null;
  }

  // Week view: the little pencil in the bottom-right corner
  onWeekEdit(px, py) {
    return dist(px, py, this.x + this.w - 18, this.y + WCARD_H - 15) < 11;
  }

  // ----- Queue view card -----
  // hoverBtn: "check" | "edit" | null — which button the mouse is over
  show(position, hovered, hoverBtn = null) {
    const done = this.doneTimer >= 0;
    const front = position === 0 && !done;
    const overdue = this.isOverdue() && !done;
    const p = PRIORITIES[this.priority];
    const a = constrain(this.alpha, 0, 255);
    const w = this.w;

    push();
    translate(this.x, this.y);

    // Card
    strokeWeight(hovered || front ? 2 : 1);
    if (done) {
      fill(...colors.greenSoft, a);
      stroke(...colors.green, a);
    } else {
      fill(...colors.raised, a);
      stroke(...(hovered || front || overdue ? colors.pink : colors.line), a);
    }
    rect(0, 0, w, CARD_H, 10);

    // Left stripe in the priority's color
    noStroke();
    fill(...(done ? colors.green : p.color), a);
    rect(0, 0, 5, CARD_H, 10, 0, 0, 10);

    // Position badge, or a check once done
    const cx = 32;
    const cy = CARD_H / 2;
    if (done) {
      drawCheck(cx, cy, 26, colors.green, colors.raised, a);
    } else {
      fill(...(front ? colors.pink : colors.line), a);
      circle(cx, cy, 26);
      fill(...(front ? colors.raised : colors.muted), a);
      textAlign(CENTER, CENTER);
      textSize(13);
      textStyle(BOLD);
      text(position + 1, cx, cy + 1);
    }

    // Right side: ✓ and edit buttons, with "NEXT UP" beside them.
    // Once done, just a "DONE" label.
    let rightW = 30;
    if (done) {
      rightW += drawPill("DONE", w - 14, cy, 11, colors.green, colors.raised, a, "right");
    } else {
      drawIconButton(w - 30, cy, "check", hoverBtn === "check", a);
      drawIconButton(w - 68, cy, "edit", hoverBtn === "edit", a);
      rightW = 96;
      if (front) rightW += drawPill("NEXT UP", w - 96, cy, 11, colors.pinkSoft, colors.pink, a, "right") + 10;
    }

    // Line 1: task text
    const textX = 58;
    const titleY = cy - 9;
    textSize(16);
    textStyle(NORMAL);
    drawTitle(this.text, textX, titleY, w - textX - rightW - 10, done, a);

    // Line 2: priority pill, then the deadline
    const metaY = cy + 13;
    const pillW = drawPill(p.label, textX, metaY, 11, p.soft, p.color, a, "left");
    const dueInfo = this.dueLabel();
    if (dueInfo) {
      textAlign(LEFT, CENTER);
      textSize(12);
      textStyle(dueInfo.urgent ? BOLD : NORMAL);
      fill(...(done ? colors.green : dueInfo.color), a);
      text(dueInfo.text, textX + pillW + 10, metaY + 1);
    }

    pop();
  }

  // ----- Week view card -----
  // showDate: whether line 2 should spell out the date (backlog, late tasks)
  // boxKey: the date of the box the card sits in ("YYYY-MM-DD"), or null
  showWeek(hovered, hoverCheck, lifted, boxKey, hoverEdit = false) {
    const done = this.doneTimer >= 0;
    const late = this.isPlanLate() && !done;     // its day has passed
    const overdue = this.isOverdue() && !done;   // its deadline has passed
    const p = PRIORITIES[this.priority];
    const a = constrain(this.alpha, 0, 255);
    const w = this.w;
    const h = WCARD_H;

    push();
    translate(this.x, this.y);

    // Soft shadow while being dragged
    if (lifted) {
      noStroke();
      fill(...colors.ink, 28);
      rect(3, 6, w, h, 9);
    }

    // Card
    strokeWeight(hovered || lifted ? 1.5 : 1);
    if (done) {
      fill(...colors.greenSoft, a);
      stroke(...colors.green, a);
    } else {
      fill(...colors.raised, a);
      stroke(...(late || overdue ? colors.pink : hovered || lifted ? colors.muted : colors.line), a);
    }
    rect(0, 0, w, h, 9);

    // Left stripe in the priority's color
    noStroke();
    fill(...(done ? colors.green : p.color), a);
    rect(0, 0, 4, h, 9, 0, 0, 9);

    // Check circle — click it to complete
    const cy = h / 2;
    if (done) {
      drawCheck(CHECK_X, cy, 20, colors.green, colors.raised, a);
    } else if (hoverCheck) {
      drawCheck(CHECK_X, cy, 20, colors.greenSoft, colors.green, a);
    } else {
      noFill();
      stroke(...colors.muted, a * 0.7);
      strokeWeight(1.5);
      circle(CHECK_X, cy, 18);
      noStroke();
    }

    // LATE tag in the top-right
    let lateW = 0;
    if (late) lateW = drawPill("LATE", w - 8, 14, 10, colors.pink, colors.raised, a, "right") + 6;

    // Line 1: task text
    const textX = 40;
    textSize(14);
    textStyle(NORMAL);
    drawTitle(this.text, textX, cy - 9, w - textX - lateW - 10, done, a);

    // Line 2: priority pill, then the date when it's useful
    const metaY = cy + 11;
    const pillW = drawPill(p.label, textX, metaY, 10, p.soft, p.color, a, "left");
    // The deadline is always shown, since the box is the planned day
    let dateText = null;
    let dateColor = colors.muted;
    let bold = false;
    const dueShort = this.due ? shortDate(parseDate(this.due)) : null;
    // The box already shows the planned day, so only mention it when the
    // card has been carried over from an earlier week (a different date)
    const carried = late && this.planned && this.planned !== boxKey;
    if (carried) {
      dateText = "Planned " + shortDate(parseDate(this.planned)) + (this.due ? " · due " + dueShort : "");
      dateColor = colors.pink;
      bold = true;
    } else if (this.due) {
      const days = this.daysLeft();
      if (days < 0) {
        dateText = "Was due " + longDate(parseDate(this.due));
        dateColor = colors.pink;
        bold = true;
      } else if (days === 0) {
        dateText = "Due today";
        dateColor = colors.amber;
        bold = true;
      } else {
        dateText = "Due " + longDate(parseDate(this.due));
      }
    }
    if (dateText) {
      textAlign(LEFT, CENTER);
      textSize(11);
      textStyle(bold ? BOLD : NORMAL);
      fill(...(done ? colors.green : dateColor), a);
      text(fitText(dateText, w - textX - pillW - 40), textX + pillW + 8, metaY + 1);
    }

    // Pencil in the bottom-right corner opens the editor
    if (!done && !lifted) {
      if (hoverEdit) {
        noStroke();
        fill(...colors.pinkSoft, a);
        circle(w - 18, h - 15, 22);
      }
      drawPencil(w - 18, h - 15, 0.9, hoverEdit ? colors.pink : hovered ? colors.ink : colors.muted, a * (hovered ? 1 : 0.6));
    }

    pop();
  }

  // ----- Calendar chip -----
  // dim: the chip sits in a day from the previous or next month
  showChip(hovered, hoverCheck, lifted, dim) {
    const done = this.doneTimer >= 0;
    // Pink when the deadline has passed — or, when showing planned days,
    // when the planned day has passed too
    const late = !done && (this.isOverdue() || (calMode === "planned" && this.isPlanLate()));
    const p = PRIORITIES[this.priority];
    const a = constrain(this.alpha, 0, 255) * (dim ? 0.55 : 1);
    const w = this.w;
    const h = CHIP_H;

    push();
    translate(this.x, this.y);

    if (lifted) {
      noStroke();
      fill(...colors.ink, 28);
      rect(2, 4, w, h, 6);
    }

    strokeWeight(1);
    if (done) {
      fill(...colors.greenSoft, a);
      stroke(...colors.green, a);
    } else {
      fill(...(late ? colors.pinkSoft : colors.raised), a);
      stroke(...(late ? colors.pink : hovered || lifted ? colors.muted : colors.line), a);
    }
    rect(0, 0, w, h, 6);

    noStroke();
    fill(...(done ? colors.green : p.color), a);
    rect(0, 0, 3, h, 6, 0, 0, 6);

    // Check circle
    const cy = h / 2;
    if (done) {
      drawCheck(12, cy, 14, colors.green, colors.raised, a);
    } else if (hoverCheck) {
      drawCheck(12, cy, 14, colors.greenSoft, colors.green, a);
    } else {
      noFill();
      stroke(...colors.muted, a * 0.7);
      strokeWeight(1.2);
      circle(12, cy, 11);
      noStroke();
    }

    textSize(11);
    textStyle(late ? BOLD : NORMAL);
    drawTitle(this.text, 22, cy, w - 28, done, a, late ? colors.pink : colors.ink);
    textStyle(NORMAL);

    pop();
  }

  // Friendly deadline text for the queue view, plus a color for urgency
  dueLabel() {
    const days = this.daysLeft();
    if (days === null) return null;
    const date = parseDate(this.due);
    if (days < 0) {
      const n = -days;
      return { text: "Overdue by " + n + (n === 1 ? " day" : " days") + " · " + shortDate(date), color: colors.pink, urgent: true };
    }
    if (days === 0) return { text: "Due today", color: colors.amber, urgent: true };
    if (days === 1) return { text: "Due tomorrow", color: colors.amber, urgent: false };
    if (days < 7) return { text: "Due " + longDate(date), color: colors.muted, urgent: false };
    return { text: "Due " + shortDate(date), color: colors.muted, urgent: false };
  }
}

// ---------------------------------------------------------------

function setup() {
  const canvas = createCanvas(CANVAS_W, QUEUE_MIN_H);
  canvas.parent("sketch-holder");
  canvas.mousePressed(handleCanvasPress);
  textFont("Helvetica");

  calMonth = monthStart(today());
  loadQueue();
  wireUpControls();
  wireUpEditor();
  applyView();
}

function draw() {
  if (view === "queue") drawQueueView();
  else if (view === "week") drawWeekView();
  else drawCalendarView();

  // Completed tasks on their way out
  for (const t of leaving) {
    t.updateLeaving();
    if (view === "queue") t.show(0, false);
    else if (view === "week") t.showWeek(false, false, false, null);
    else t.showChip(false, false, false, false);
  }
  leaving = leaving.filter((t) => !t.isGone());
}

// ---------------------------------------------------------------
// Queue view

function drawQueueView() {
  // The canvas grows with the queue so every task is visible
  const neededH = max(QUEUE_MIN_H, slotY(queue.length) + 20);
  if (height !== neededH) resizeCanvas(CANVAS_W, neededH);
  background(...colors.paper);

  // While a card is dragged, the others shuffle to make room for it
  const dragged = dragging && dragging.queueDrag ? dragging.task : null;
  const ordered = dragged ? previewOrder() : orderedQueue();
  drawHeader(queue.length + (queue.length === 1 ? " task" : " tasks") + " in the queue");

  // Find the hovered card, and whether the mouse is on one of its buttons
  let hoveredIndex = -1;
  let hoverBtn = null;
  if (!dragged) {
    for (let i = 0; i < ordered.length; i++) {
      if (ordered[i].contains(mouseX, mouseY)) {
        hoveredIndex = i;
        hoverBtn = ordered[i].queueButtonAt(mouseX, mouseY);
        break;
      }
    }
  }
  cursor(dragged ? "grabbing" : hoverBtn ? HAND : hoveredIndex >= 0 ? "grab" : ARROW);

  // Waiting tasks — each eases toward its slot, so re-sorting animates
  for (let i = 0; i < ordered.length; i++) {
    if (ordered[i] === dragged) continue;
    ordered[i].update(MARGIN_X, slotY(i), CARD_W, CARD_H);
    ordered[i].show(i, i === hoveredIndex, i === hoveredIndex ? hoverBtn : null);
  }

  // The dragged card, lifted above the rest
  if (dragged) {
    dragged.x = lerp(dragged.x, MARGIN_X, 0.3);
    dragged.alpha = 255;
    noStroke();
    fill(...colors.ink, 28);
    rect(dragged.x + 3, dragged.y + 7, CARD_W, CARD_H, 10);
    dragged.show(dragging.index, true);
  }

  if (queue.length === 0 && leaving.length === 0) drawEmptyState(LIST_TOP + 180);
}

function slotY(i) {
  return LIST_TOP + i * (CARD_H + GAP);
}

// ---------------------------------------------------------------
// Week view

function drawWeekView() {
  weekBoxes = layoutWeek();
  const last = weekBoxes[weekBoxes.length - 1];
  const neededH = Math.ceil(last.y + last.h + 30);
  if (height !== neededH) resizeCanvas(CANVAS_W, neededH);
  background(...colors.paper);

  const start = weekStart();
  const end = addDays(start, 6);
  drawHeader("Week of " + shortDate(start) + " – " + shortDate(end));

  const dropTarget = dragging ? boxAt(mouseX, mouseY) : -1;

  // Boxes
  for (const box of weekBoxes) drawBox(box, dropTarget === box.index);

  // Cards (the dragged one is drawn last, on top)
  let hovered = null;
  for (const box of weekBoxes) {
    box.tasks.forEach((task, j) => {
      if (task === (dragging && dragging.task)) return;
      task.update(box.x + BOX_PAD, box.y + BOX_HEAD + j * (WCARD_H + WCARD_GAP), WCARD_W, WCARD_H);
      const isHover = !dragging && task.contains(mouseX, mouseY);
      if (isHover) hovered = task;
      task.showWeek(isHover, isHover && task.onCheck(mouseX, mouseY), false, box.date ? dateKey(box.date) : null,
        isHover && task.onWeekEdit(mouseX, mouseY));
    });
  }

  if (dragging) {
    const t = dragging.task;
    t.alpha = 255;
    t.w = lerp(t.w, WCARD_W, 0.25);
    t.h = WCARD_H;
    t.showWeek(false, false, true, null);
    cursor("grabbing");
  } else if (hovered) {
    cursor(hovered.onCheck(mouseX, mouseY) || hovered.onWeekEdit(mouseX, mouseY) ? HAND : "grab");
  } else {
    cursor(ARROW);
  }
}

// Works out where the eight boxes go and which tasks sit in each.
// Rows grow to fit the fuller of their two boxes.
function layoutWeek() {
  const start = weekStart();
  const boxes = [];
  for (let i = 0; i < 8; i++) {
    boxes.push({ index: i, date: i < BACKLOG ? addDays(start, i) : null, tasks: [] });
  }

  for (const task of queue) boxes[boxIndexFor(task, start)].tasks.push(task);

  // Inside a box: earliest day first (so late carry-overs sit on top),
  // then deadline, then priority, then arrival
  const byWeekDate = (a, b) => {
    const ka = a.weekDate();
    const kb = b.weekDate();
    if (ka === kb) return 0;
    if (!ka) return 1;
    if (!kb) return -1;
    return ka < kb ? -1 : 1;
  };
  for (const box of boxes) {
    box.tasks.sort((a, b) => byWeekDate(a, b) || byDeadline(a, b) || byPriority(a, b) || a.id - b.id);
  }

  let y = WEEK_TOP;
  for (let row = 0; row < 4; row++) {
    const pair = [boxes[row * 2], boxes[row * 2 + 1]];
    const most = max(1, pair[0].tasks.length, pair[1].tasks.length);
    const h = BOX_HEAD + most * (WCARD_H + WCARD_GAP) - WCARD_GAP + BOX_PAD;
    pair.forEach((box, col) => {
      box.x = MARGIN_X + col * (BOX_W + BOX_GAP);
      box.y = y;
      box.w = BOX_W;
      box.h = h;
    });
    y += h + BOX_GAP;
  }
  return boxes;
}

// Which box a task belongs in this week (by planned day, else deadline)
function boxIndexFor(task, start) {
  const key = task.weekDate();
  if (!key) return BACKLOG;
  const day = parseDate(key);
  if (day > addDays(start, 6)) return BACKLOG; // after this Sunday
  // This week, or late from an earlier week: its own weekday's box
  return (day.getDay() + 6) % 7; // Monday = 0 … Sunday = 6
}

function drawBox(box, isDropTarget) {
  const t = today();
  const isToday = box.date && box.date.getTime() === t.getTime();
  const isPast = box.date && box.date < t;

  push();
  translate(box.x, box.y);

  // Box
  strokeWeight(isDropTarget || isToday ? 2 : 1);
  stroke(...(isDropTarget ? colors.green : isToday ? colors.pink : colors.line));
  fill(...(isDropTarget ? colors.greenSoft : box.index === BACKLOG ? colors.paper : colors.raised));
  if (box.index === BACKLOG && !isDropTarget) drawingContext.setLineDash([5, 4]);
  rect(0, 0, box.w, box.h, 12);
  drawingContext.setLineDash([]);

  // Heading: "Monday · 12 Oct"
  noStroke();
  textAlign(LEFT, CENTER);
  textFont("Lora");
  textStyle(BOLD);
  textSize(15);
  fill(...(isPast ? colors.muted : colors.ink));
  const name = box.index === BACKLOG ? "Backlog" : DAY_NAMES[box.index];
  text(name, 14, 21);
  const nameW = textWidth(name);
  textFont("Helvetica");
  textStyle(NORMAL);
  textSize(13);
  fill(...colors.muted);
  const sub = box.date ? "· " + shortDate(box.date) : "· not planned this week";
  text(sub, 14 + nameW + 6, 22);

  // Right side: TODAY tag or task count
  if (isToday) {
    drawPill("TODAY", box.w - 12, 21, 10, colors.pinkSoft, colors.pink, 255, "right");
  } else if (box.tasks.length > 0) {
    textAlign(RIGHT, CENTER);
    textSize(12);
    fill(...colors.muted);
    text(box.tasks.length, box.w - 14, 22);
  }

  // Empty box
  if (box.tasks.length === 0) {
    textAlign(CENTER, CENTER);
    textSize(12);
    textStyle(ITALIC);
    fill(...colors.muted, 170);
    text(isDropTarget ? "Drop here" : "Nothing planned", box.w / 2, BOX_HEAD + WCARD_H / 2 - 4);
    textStyle(NORMAL);
  }

  pop();
}

function boxAt(px, py) {
  for (const box of weekBoxes) {
    if (px > box.x && px < box.x + box.w && py > box.y && py < box.y + box.h) return box.index;
  }
  return -1;
}

// ---------------------------------------------------------------
// Calendar view

function drawCalendarView() {
  calCells = layoutCalendar();
  const neededH = Math.ceil(tray.y + tray.h + 24);
  if (height !== neededH) resizeCanvas(CANVAS_W, neededH);
  background(...colors.paper);

  drawHeader(MONTH_NAMES[calMonth.getMonth()] + " " + calMonth.getFullYear());
  drawCalendarNav();

  // Weekday names
  noStroke();
  fill(...colors.muted);
  textAlign(LEFT, CENTER);
  textSize(11);
  textStyle(BOLD);
  for (let i = 0; i < 7; i++) {
    text(DAY_NAMES[i].slice(0, 3).toUpperCase(), MARGIN_X + i * CELL_W + 8, CAL_TOP + CAL_HEAD / 2);
  }
  textStyle(NORMAL);

  const target = dragging ? calendarDropTarget(mouseX, mouseY) : null;

  for (const cell of calCells) drawCell(cell, target === cell);
  drawTray(target === tray);

  // Chips (the dragged one is drawn last, on top)
  let hovered = null;
  const place = (task, x, y, w, dim) => {
    if (dragging && task === dragging.task) return;
    task.update(x, y, w, CHIP_H);
    const isHover = !dragging && task.contains(mouseX, mouseY);
    if (isHover) hovered = task;
    task.showChip(isHover, isHover && task.onCheck(mouseX, mouseY), false, dim);
  };
  for (const cell of calCells) {
    cell.tasks.forEach((task, j) => {
      place(task, cell.x + 4, cell.y + CELL_DATE_H + j * (CHIP_H + CHIP_GAP), CHIP_W, !cell.inMonth);
    });
  }
  tray.tasks.forEach((task, j) => {
    const col = j % tray.perRow;
    const row = Math.floor(j / tray.perRow);
    place(task, tray.x + 12 + col * (TRAY_CHIP_W + 8), tray.y + 36 + row * (CHIP_H + 8), TRAY_CHIP_W, false);
  });

  if (dragging) {
    const t = dragging.task;
    t.alpha = 255;
    t.w = lerp(t.w, CHIP_W + 20, 0.25);
    t.h = CHIP_H;
    t.showChip(false, false, true, false);
    cursor("grabbing");
  } else if (hovered) {
    cursor(hovered.onCheck(mouseX, mouseY) ? HAND : "grab");
    drawTooltip(hovered);
  } else {
    const onButton = calButtons.some((b) => insideRect(mouseX, mouseY, b));
    cursor(onButton ? HAND : ARROW);
  }
}

// Builds the month grid (Monday-first, with spill-over days from the
// months either side) and drops each task into its day.
function layoutCalendar() {
  const first = calMonth;
  const gridStart = addDays(first, -((first.getDay() + 6) % 7));
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const dayCount = Math.round((lastDay - gridStart) / 86400000) + 1;
  const rows = Math.ceil(dayCount / 7);

  const cells = [];
  const byKey = {};
  for (let i = 0; i < rows * 7; i++) {
    const date = addDays(gridStart, i);
    const cell = { date, key: dateKey(date), tasks: [], inMonth: date.getMonth() === first.getMonth() };
    cells.push(cell);
    byKey[cell.key] = cell;
  }

  const undated = [];
  for (const task of queue) {
    const key = calDate(task);
    if (!key) undated.push(task);
    else if (byKey[key]) byKey[key].tasks.push(task);
  }
  for (const cell of cells) cell.tasks.sort((a, b) => byPriority(a, b) || a.id - b.id);
  undated.sort((a, b) => byPriority(a, b) || a.id - b.id);

  // Rows grow to fit their busiest day
  let y = CAL_TOP + CAL_HEAD;
  for (let r = 0; r < rows; r++) {
    const row = cells.slice(r * 7, r * 7 + 7);
    const most = max(MIN_CHIP_SLOTS, ...row.map((c) => c.tasks.length));
    const h = CELL_DATE_H + most * (CHIP_H + CHIP_GAP) + 4;
    row.forEach((cell, col) => {
      cell.x = MARGIN_X + col * CELL_W;
      cell.y = y;
      cell.w = CELL_W;
      cell.h = h;
    });
    y += h;
  }

  // The Undated tray underneath
  const perRow = Math.floor((CONTENT_W - 24 + 8) / (TRAY_CHIP_W + 8));
  const trayRows = max(1, Math.ceil(undated.length / perRow));
  tray = {
    x: MARGIN_X,
    y: y + 20,
    w: CONTENT_W,
    h: 36 + trayRows * (CHIP_H + 8) + 4,
    tasks: undated,
    perRow
  };

  return cells;
}

function drawCell(cell, isDropTarget) {
  const t = today();
  const isToday = cell.date.getTime() === t.getTime();
  const isPast = cell.date < t;

  stroke(...(isDropTarget ? colors.green : colors.line));
  strokeWeight(isDropTarget ? 2 : 1);
  fill(...(isDropTarget ? colors.greenSoft : cell.inMonth ? colors.raised : colors.paper));
  rect(cell.x, cell.y, cell.w, cell.h);

  // Date number; today's sits in a pink circle
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(12);
  const nx = cell.x + 15;
  const ny = cell.y + 13;
  if (isToday) {
    fill(...colors.pink);
    circle(nx, ny, 22);
    fill(...colors.raised);
    textStyle(BOLD);
  } else {
    fill(...(!cell.inMonth ? colors.line : isPast ? colors.muted : colors.ink));
  }
  text(cell.date.getDate(), nx, ny + 1);
  textStyle(NORMAL);
}

function drawTray(isDropTarget) {
  push();
  translate(tray.x, tray.y);
  strokeWeight(isDropTarget ? 2 : 1);
  stroke(...(isDropTarget ? colors.green : colors.line));
  fill(...(isDropTarget ? colors.greenSoft : colors.paper));
  if (!isDropTarget) drawingContext.setLineDash([5, 4]);
  rect(0, 0, tray.w, tray.h, 12);
  drawingContext.setLineDash([]);

  noStroke();
  textAlign(LEFT, CENTER);
  textFont("Lora");
  textStyle(BOLD);
  textSize(15);
  fill(...colors.ink);
  const trayTitle = calMode === "deadline" ? "Undated" : "Not planned";
  text(trayTitle, 14, 19);
  const titleW = textWidth(trayTitle);
  textFont("Helvetica");
  textStyle(NORMAL);
  textSize(13);
  fill(...colors.muted);
  text(calMode === "deadline" ? "· drag a task here to clear its deadline" : "· drag a task here to take it off the plan",
    14 + titleW + 6, 20);

  if (tray.tasks.length === 0) {
    textSize(12);
    textStyle(ITALIC);
    fill(...colors.muted, 170);
    text(isDropTarget ? "Drop here" : calMode === "deadline" ? "Nothing undated" : "Everything has a day", 14, 36 + CHIP_H / 2);
    textStyle(NORMAL);
  }
  pop();
}

// The ‹ Today › buttons under the header
function drawCalendarNav() {
  const y = 94;
  const h = 26;
  calButtons = [
    { label: "‹", x: MARGIN_X, y, w: 30, h, go: () => (calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1)) },
    { label: "Today", x: MARGIN_X + 36, y, w: 60, h, go: () => (calMonth = monthStart(today())) },
    { label: "›", x: MARGIN_X + 102, y, w: 30, h, go: () => (calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1)) }
  ];
  for (const b of calButtons) {
    const hover = insideRect(mouseX, mouseY, b) && !dragging;
    stroke(...(hover ? colors.pink : colors.line));
    strokeWeight(1);
    fill(...(hover ? colors.pinkSoft : colors.raised));
    rect(b.x, b.y, b.w, b.h, 7);
    noStroke();
    fill(...colors.ink);
    textAlign(CENTER, CENTER);
    textSize(b.label.length > 1 ? 12 : 16);
    text(b.label, b.x + b.w / 2, b.y + b.h / 2 + (b.label.length > 1 ? 1 : 0));
  }

  // Tasks due in other months, so nothing feels lost
  const shown = new Set(calCells.flatMap((c) => c.tasks));
  const elsewhere = queue.filter((t) => calDate(t) && !shown.has(t)).length;
  if (elsewhere > 0) {
    textAlign(RIGHT, CENTER);
    textSize(12);
    fill(...colors.muted);
    text(elsewhere + (elsewhere === 1 ? " task" : " tasks") + (calMode === "deadline" ? " due" : " planned") + " in other months", MARGIN_X + CONTENT_W, y + h / 2);
  }
}

function calendarDropTarget(px, py) {
  if (insideRect(px, py, tray)) return tray;
  return calCells.find((c) => insideRect(px, py, c)) || null;
}

// Full task details on hover, since chips are small
function drawTooltip(task) {
  const p = PRIORITIES[task.priority];
  let meta = p.label + " priority";
  if (calMode === "planned") {
    const day = task.weekDate();
    meta += day ? " · planned " + longDate(parseDate(day)) : " · not planned";
  }
  if (task.due) meta += (task.isOverdue() ? " · was due " : " · due ") + longDate(parseDate(task.due));
  else meta += " · no deadline";

  textSize(13);
  textStyle(BOLD);
  const title = fitText(task.text, 320);
  const titleW = textWidth(title);
  textStyle(NORMAL);
  textSize(11);
  const w = max(titleW, textWidth(meta)) + 24;
  const h = 62;
  const x = constrain(mouseX + 14, 4, width - w - 4);
  let y = mouseY + 18;
  if (y + h > height - 4) y = mouseY - h - 10;

  noStroke();
  fill(...colors.ink, 235);
  rect(x, y, w, h, 7);
  textAlign(LEFT, CENTER);
  fill(...colors.raised);
  textSize(13);
  textStyle(BOLD);
  text(title, x + 12, y + 16);
  textStyle(NORMAL);
  textSize(11);
  fill(...(task.isOverdue() ? colors.pinkSoft : colors.line));
  text(meta, x + 12, y + 32);
  fill(...colors.muted);
  text("Double-click to edit", x + 12, y + 48);
}

function insideRect(px, py, r) {
  return px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h;
}

// ---------------------------------------------------------------
// Shared drawing

function drawHeader(title) {
  const total = queue.length + doneCount;
  const overdue = queue.filter((t) => t.isOverdue()).length;

  noStroke();
  fill(...colors.ink);
  textAlign(LEFT, BASELINE);
  textFont("Lora");
  textStyle(BOLD);
  textSize(26);
  text(title, MARGIN_X, 52);
  textFont("Helvetica");
  textStyle(NORMAL);

  // Right side: "1 overdue · 2 done"
  textAlign(RIGHT, BASELINE);
  textSize(14);
  const doneText = doneCount + " done";
  fill(...colors.muted);
  text(doneText, MARGIN_X + CONTENT_W, 52);
  if (overdue > 0) {
    textStyle(BOLD);
    fill(...colors.pink);
    text(overdue + " overdue · ", MARGIN_X + CONTENT_W - textWidth(doneText), 52);
    textStyle(NORMAL);
  }

  // Progress bar: fills as the queue empties
  const target = total === 0 ? 0 : doneCount / total;
  barProgress = lerp(barProgress, target, 0.1);
  fill(...colors.line);
  rect(MARGIN_X, 70, CONTENT_W, 10, 5);
  fill(...colors.green);
  if (barProgress > 0.002) rect(MARGIN_X, 70, CONTENT_W * barProgress, 10, 5);
}

function drawEmptyState(cy) {
  noStroke();
  textAlign(CENTER, CENTER);
  const cx = MARGIN_X + CONTENT_W / 2;

  if (doneCount > 0) {
    fill(...colors.greenSoft);
    circle(cx, cy - 40, 80);
    stroke(...colors.green);
    strokeWeight(5);
    noFill();
    beginShape();
    vertex(cx - 18, cy - 40);
    vertex(cx - 5, cy - 27);
    vertex(cx + 19, cy - 53);
    endShape();
    noStroke();

    fill(...colors.ink);
    textFont("Lora");
    textSize(22);
    text("Queue cleared", cx, cy + 25);
    textFont("Helvetica");
    fill(...colors.muted);
    textSize(15);
    text(doneCount + (doneCount === 1 ? " task" : " tasks") + " done. Nice.", cx, cy + 55);
  } else {
    fill(...colors.muted);
    textSize(16);
    text("Nothing in the queue yet.", cx, cy);
    textSize(14);
    text("Add a task above, or load the sample set.", cx, cy + 26);
  }
}

// Round button on queue cards: kind is "check" or "edit"
function drawIconButton(cx, cy, kind, hover, a) {
  const accent = kind === "check" ? colors.green : colors.pink;
  const soft = kind === "check" ? colors.greenSoft : colors.pinkSoft;
  strokeWeight(1);
  stroke(...(hover ? accent : colors.line), a);
  fill(...(hover ? soft : colors.paper), a);
  circle(cx, cy, BTN_D);
  if (kind === "check") {
    stroke(...(hover ? accent : colors.muted), a);
    strokeWeight(2);
    noFill();
    beginShape();
    vertex(cx - 6, cy);
    vertex(cx - 1.5, cy + 4.5);
    vertex(cx + 6.5, cy - 4.5);
    endShape();
  } else {
    drawPencil(cx, cy, 1, hover ? accent : colors.muted, a);
  }
  noStroke();
}

// A small pencil icon, drawn at an angle
function drawPencil(cx, cy, s, c, a) {
  push();
  translate(cx, cy);
  rotate(-QUARTER_PI);
  stroke(...c, a);
  strokeWeight(1.4);
  noFill();
  rect(-3 * s, -2.2 * s, 9 * s, 4.4 * s, 0.8);
  line(3.5 * s, -2.2 * s, 3.5 * s, 2.2 * s);
  fill(...c, a);
  triangle(-3 * s, -2.2 * s, -3 * s, 2.2 * s, -6.5 * s, 0);
  pop();
}

// A filled circle with a tick in it
function drawCheck(cx, cy, d, bg, tick, a) {
  noStroke();
  fill(...bg, a);
  circle(cx, cy, d);
  const s = d / 26;
  stroke(...tick, a);
  strokeWeight(2.5 * max(s, 0.8));
  noFill();
  beginShape();
  vertex(cx - 6 * s, cy);
  vertex(cx - 1.5 * s, cy + 5 * s);
  vertex(cx + 6.5 * s, cy - 5 * s);
  endShape();
  noStroke();
}

// A small rounded label. anchor "left" puts its left edge at x, "right"
// its right edge. Returns its width.
function drawPill(label, x, cy, size, bg, fg, a, anchor) {
  textSize(size);
  textStyle(BOLD);
  const w = textWidth(label) + size * 1.5;
  const h = size + 8;
  const left = anchor === "right" ? x - w : x;
  noStroke();
  fill(...bg, a);
  rect(left, cy - h / 2, w, h, h / 2);
  fill(...fg, a);
  textAlign(CENTER, CENTER);
  text(label, left + w / 2, cy + 1);
  textStyle(NORMAL);
  return w;
}

// Task title, shortened to fit, struck through once the task is done
function drawTitle(str, x, y, maxW, done, a, color = colors.ink) {
  const shown = fitText(str, maxW);
  textAlign(LEFT, CENTER);
  noStroke();
  fill(...(done ? colors.green : color), a);
  text(shown, x, y);
  if (done) {
    stroke(...colors.green, a);
    strokeWeight(1.5);
    line(x, y + 1, x + textWidth(shown), y + 1);
    noStroke();
  }
}

// ---------------------------------------------------------------
// Ordering and queue operations

const byPriority = (a, b) => PRIORITIES[a.priority].rank - PRIORITIES[b.priority].rank;
const byDeadline = (a, b) => {
  // No deadline sorts after any deadline
  if (a.due === b.due) return 0;
  if (!a.due) return 1;
  if (!b.due) return -1;
  return a.due < b.due ? -1 : 1; // "YYYY-MM-DD" strings sort like dates
};

// The waiting tasks in queue-view order. The queue array itself holds
// "my order" (new tasks join at the back, dragging rearranges it); the
// other modes return a sorted copy, falling back on my order for ties.
function orderedQueue() {
  const list = queue.slice();
  const mine = (a, b) => queue.indexOf(a) - queue.indexOf(b);
  if (orderBy === "priority") {
    list.sort((a, b) => byPriority(a, b) || byDeadline(a, b) || mine(a, b));
  } else if (orderBy === "deadline") {
    list.sort((a, b) => byDeadline(a, b) || byPriority(a, b) || mine(a, b));
  }
  return list;
}

// The queue as it would look if the dragged card were dropped right now
function previewOrder() {
  const list = orderedQueue().filter((t) => t !== dragging.task);
  list.splice(dragging.index, 0, dragging.task);
  return list;
}

// Which slot the dragged card is hovering over (kept to the visible slots)
function queueDropIndex() {
  const last = queue.length - 1;
  return constrain(Math.round((dragging.task.y - LIST_TOP) / (CARD_H + GAP)), 0, last);
}

function enqueue(text, priority, due, planned = null) {
  const clean = text.trim();
  if (!clean) return;
  // Start just below the back of the queue so it slides in
  queue.push(new Task(clean, priority, due, MARGIN_X, slotY(queue.length) + 24, planned));
  saveQueue();
}

function completeTask(task) {
  if (!queue.includes(task)) return;
  queue = queue.filter((t) => t !== task);
  task.doneTimer = 0;
  task.alpha = 255;
  leaving.push(task);
  doneCount++;
  saveQueue();
}

// ---------------------------------------------------------------
// Mouse

function handleCanvasPress() {
  if (view === "queue") {
    // ✓ completes, the pencil edits, anywhere else on the card can be dragged
    const ordered = orderedQueue();
    for (let i = 0; i < ordered.length; i++) {
      const task = ordered[i];
      if (!task.contains(mouseX, mouseY)) continue;
      const btn = task.queueButtonAt(mouseX, mouseY);
      if (btn === "check") completeTask(task);
      else if (btn === "edit") openEditor(task);
      else pressed = { task, index: i, x: mouseX, y: mouseY };
      return;
    }
    return;
  }

  if (view === "calendar") {
    for (const b of calButtons) {
      if (insideRect(mouseX, mouseY, b)) {
        b.go();
        return;
      }
    }
    const spots = calCells
      .flatMap((c) => c.tasks.map((task) => [task, c.key]))
      .concat(tray.tasks.map((task) => [task, "undated"]));
    for (const [task, from] of spots) {
      if (!task.contains(mouseX, mouseY)) continue;
      if (task.onCheck(mouseX, mouseY)) completeTask(task);
      else dragging = { task, dx: mouseX - task.x, dy: mouseY - task.y, fromBox: from };
      return;
    }
    return;
  }

  // Week view: the check circle completes; anywhere else on a card picks it up
  for (const box of weekBoxes) {
    for (const task of box.tasks) {
      if (!task.contains(mouseX, mouseY)) continue;
      if (task.onCheck(mouseX, mouseY)) {
        completeTask(task);
      } else if (task.onWeekEdit(mouseX, mouseY)) {
        openEditor(task);
      } else {
        dragging = { task, dx: mouseX - task.x, dy: mouseY - task.y, fromBox: box.index };
      }
      return;
    }
  }
}

function mouseDragged() {
  // Queue view: once the mouse has moved a few pixels, it's a drag
  if (pressed && dist(mouseX, mouseY, pressed.x, pressed.y) > 5) {
    const t = pressed.task;
    dragging = { task: t, dx: mouseX - t.x, dy: mouseY - t.y, queueDrag: true, index: pressed.index };
    pressed = null;
  }
  if (!dragging) return;

  if (dragging.queueDrag) {
    dragging.task.y = constrain(mouseY - dragging.dy, LIST_TOP - 20, slotY(queue.length - 1) + 20);
    dragging.index = queueDropIndex();
    return;
  }
  dragging.task.x = mouseX - dragging.dx;
  dragging.task.y = mouseY - dragging.dy;
}

function mouseReleased() {
  // Queue view: pressed and released without dragging — nothing happens
  // (tasks only complete from the ✓ button, so stray clicks are harmless)
  if (pressed) {
    pressed = null;
    return;
  }
  if (!dragging) return;

  if (dragging.queueDrag) {
    // The on-screen order becomes my order. If the queue was sorted by
    // priority or deadline, switch to my order so the move sticks.
    queue = previewOrder();
    if (orderBy !== "manual") {
      orderBy = "manual";
      document.getElementById("order-by").value = "manual";
    }
    dragging = null;
    saveQueue();
    return;
  }

  if (view === "calendar") {
    const target = calendarDropTarget(mouseX, mouseY);
    if (target) {
      const key = target === tray ? "undated" : target.key;
      if (key !== dragging.fromBox) {
        if (calMode === "deadline") dragging.task.due = key === "undated" ? null : key;
        else dragging.task.planned = key === "undated" ? "backlog" : key; // deadline untouched
        saveQueue();
      }
    }
    dragging = null;
    return;
  }

  const target = boxAt(mouseX, mouseY);
  if (target >= 0 && target !== dragging.fromBox) {
    // Planning only: the deadline stays as it is
    dragging.task.planned = target === BACKLOG ? "backlog" : dateKey(weekBoxes[target].date);
    saveQueue();
  }
  // Otherwise it just eases back to where it was
  dragging = null;
}

// Double-click any task (in any view) to edit it — the only way in for
// calendar chips, which are too small for an edit button
function doubleClicked() {
  if (dragging) return;
  const task = queue.find((t) => t.contains(mouseX, mouseY));
  if (task) {
    pressed = null;
    openEditor(task);
  }
}

// ---------------------------------------------------------------
// Edit dialog (plain HTML <dialog> in index.html)

let editingTask = null;

function openEditor(task) {
  editingTask = task;
  pressed = null;
  dragging = null;
  document.getElementById("edit-text").value = task.text;
  document.getElementById("edit-priority").value = task.priority;
  document.getElementById("edit-due").value = task.due || "";
  resetDeleteButton();
  document.getElementById("edit-dialog").showModal();
  document.getElementById("edit-text").select();
}

function closeEditor() {
  editingTask = null;
  document.getElementById("edit-dialog").close();
}

function resetDeleteButton() {
  const del = document.getElementById("edit-delete");
  del.textContent = "Delete";
  del.dataset.armed = "";
}

function wireUpEditor() {
  const dialog = document.getElementById("edit-dialog");

  document.getElementById("edit-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = document.getElementById("edit-text").value.trim();
    if (!editingTask || !text) return;
    editingTask.text = text;
    editingTask.priority = document.getElementById("edit-priority").value;
    editingTask.due = document.getElementById("edit-due").value || null;
    saveQueue();
    closeEditor();
  });

  document.getElementById("edit-cancel").addEventListener("click", closeEditor);

  document.getElementById("edit-clear-due").addEventListener("click", () => {
    document.getElementById("edit-due").value = "";
  });

  // Delete takes two clicks, so it can't happen by accident.
  // Deleting removes the task without counting it as done.
  document.getElementById("edit-delete").addEventListener("click", (e) => {
    const del = e.currentTarget;
    if (!del.dataset.armed) {
      del.dataset.armed = "yes";
      del.textContent = "Click again to delete";
      return;
    }
    queue = queue.filter((t) => t !== editingTask);
    saveQueue();
    closeEditor();
  });

  dialog.addEventListener("close", () => {
    editingTask = null;
  });
}

// ---------------------------------------------------------------
// Page controls

function wireUpControls() {
  const form = document.getElementById("add-form");
  const input = document.getElementById("task-input");
  const prioritySelect = document.getElementById("task-priority");
  const dueInput = document.getElementById("task-due");
  const orderSelect = document.getElementById("order-by");

  orderSelect.value = orderBy;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    enqueue(input.value, prioritySelect.value, dueInput.value);
    input.value = "";
    input.focus();
  });

  orderSelect.addEventListener("change", () => {
    orderBy = orderSelect.value;
    saveQueue();
  });

  for (const btn of document.querySelectorAll("[data-cal-mode]")) {
    btn.addEventListener("click", () => {
      calMode = btn.dataset.calMode;
      dragging = null;
      applyView();
      saveQueue();
    });
  }

  document.getElementById("complete-next").addEventListener("click", () => completeTask(orderedQueue()[0]));

  document.getElementById("load-samples").addEventListener("click", () => {
    for (const t of SAMPLE_TASKS) {
      enqueue(t.text, t.priority, t.dueInDays === null ? null : dateKey(addDays(today(), t.dueInDays)));
    }
  });

  document.getElementById("clear-all").addEventListener("click", () => {
    queue = [];
    leaving = [];
    doneCount = 0;
    saveQueue();
  });

  for (const btn of document.querySelectorAll("[data-view]")) {
    btn.addEventListener("click", () => {
      view = btn.dataset.view;
      dragging = null;
      pressed = null;
      leaving = [];
      applyView();
      saveQueue();
    });
  }
}

// Sync the page around the canvas with the current view
function applyView() {
  for (const btn of document.querySelectorAll("[data-view]")) {
    btn.classList.toggle("active", btn.dataset.view === view);
  }
  for (const btn of document.querySelectorAll("[data-cal-mode]")) {
    btn.classList.toggle("active", btn.dataset.calMode === calMode);
  }
  document.getElementById("order-control").style.display = view === "queue" ? "" : "none";
  document.getElementById("cal-mode-toggle").style.display = view === "calendar" ? "" : "none";
  const hints = {
    queue: "Drag a task to move it &middot; &#10003; marks it done &middot; the pencil edits it &middot; saved in this browser.",
    week: "Drag cards to plan which day to work on them (deadlines stay put) &middot; tick the circle to mark one done &middot; the pencil edits it.",
    calendar: calMode === "deadline"
      ? "Showing deadlines &middot; drag a task to change its deadline &middot; tick the circle to mark one done &middot; double-click to edit."
      : "Showing planned days &middot; drag a task to re-plan it (deadlines stay put) &middot; tick the circle to mark one done &middot; double-click to edit."
  };
  document.getElementById("hint").innerHTML = hints[view];
}

// ---------------------------------------------------------------
// Dates — all in local time, as "YYYY-MM-DD" strings for storage

function today() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// The date a task sits on in the calendar, depending on the Show switch
// (null = it goes in the tray under the grid)
function calDate(task) {
  return calMode === "deadline" ? task.due : task.weekDate();
}

function monthStart(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// Monday of the current week
function weekStart() {
  const t = today();
  return addDays(t, -((t.getDay() + 6) % 7));
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function parseDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateKey(d) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + mm + "-" + dd;
}

// "16 Oct"
function shortDate(d) {
  return d.getDate() + " " + MONTHS[d.getMonth()];
}

// "Fri · 16 Oct"
function longDate(d) {
  return WEEKDAYS[d.getDay()] + " · " + shortDate(d);
}

// ---------------------------------------------------------------
// Helpers

// Shorten a string with "…" so it fits in maxW pixels
function fitText(str, maxW) {
  if (textWidth(str) <= maxW) return str;
  let s = str;
  while (s.length > 0 && textWidth(s + "…") > maxW) s = s.slice(0, -1);
  return s + "…";
}

// Keep the queue between visits (in this browser only).
// Named saveQueue/loadQueue because p5 already has a save() function.
function saveQueue() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tasks: queue.map((t) => ({ text: t.text, priority: t.priority, due: t.due, planned: t.planned })),
        doneCount,
        orderBy,
        view,
        calMode
      })
    );
  } catch (e) {
    // Storage unavailable (private mode etc.) — the sketch still works
  }
}

function loadQueue() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!data) return;
    doneCount = data.doneCount || 0;
    if (["manual", "priority", "deadline"].includes(data.orderBy)) orderBy = data.orderBy;
    if (["queue", "week", "calendar"].includes(data.view)) view = data.view;
    if (["deadline", "planned"].includes(data.calMode)) calMode = data.calMode;
    for (const t of data.tasks || []) {
      // Older saves stored plain strings
      if (typeof t === "string") enqueue(t, "medium", null);
      else enqueue(t.text, t.priority, t.due, t.planned);
    }
  } catch (e) {
    // Nothing saved, or storage unavailable
  }
}
