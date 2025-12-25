/* Matcha Mother – Fullscreen + Focus Mode
   - Canvas fills the screen
   - UI floats above canvas (doesn't shrink gameplay)
   - Focus mode hides UI overlay
   - Zones are more visible (stronger fills + thicker borders)
*/

const ASSET = (name) => `assets/${name}`;

// ------------------------------
// Canvas + scaling
// ------------------------------
const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const WORLD = { w: 960, h: 540 };
let DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
let view = { scale: 1, offX: 0, offY: 0, cssW: 0, cssH: 0 };

ctx.imageSmoothingEnabled = false;

function resizeCanvasToCSS() {
  DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  const rect = canvas.getBoundingClientRect();
  view.cssW = rect.width;
  view.cssH = rect.height;

  const scale = Math.min(view.cssW / WORLD.w, view.cssH / WORLD.h);
  view.scale = scale;
  view.offX = (view.cssW - WORLD.w * scale) / 2;
  view.offY = (view.cssH - WORLD.h * scale) / 2;

  canvas.width = Math.floor(view.cssW * DPR);
  canvas.height = Math.floor(view.cssH * DPR);

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

function toWorld(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  return {
    x: (x - view.offX) / view.scale,
    y: (y - view.offY) / view.scale,
  };
}

window.addEventListener("resize", resizeCanvasToCSS);

// ------------------------------
// Haptics helper
// ------------------------------
function haptic(ms) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {}
}

// ------------------------------
// UI elements
// ------------------------------
const toastEl = document.querySelector("#toast");
const overlayEl = document.querySelector("#overlay");
const overlayTitleEl = document.querySelector("#overlayTitle");
const overlayDescEl = document.querySelector("#overlayDesc");
const menuGridEl = document.querySelector("#menuGrid");
const receiptEl = document.querySelector("#receiptEl");

const diffEl = document.querySelector("#diffEl");
const levelEl = document.querySelector("#levelEl");
const timeEl = document.querySelector("#timeEl");
const goalEl = document.querySelector("#goalEl");
const earnedEl = document.querySelector("#earnedEl");
const servedEl = document.querySelector("#servedEl");
const comboEl = document.querySelector("#comboEl");
const bestComboEl = document.querySelector("#bestComboEl");

const orderEl = document.querySelector("#orderEl");
const orderLineEl = document.querySelector("#orderLineEl");
const drinkEl = document.querySelector("#drinkEl");
const baseEl = document.querySelector("#baseEl");
const tipEl = document.querySelector("#tipEl");

const feedbackEl = document.querySelector("#feedbackEl");
const serveBtn = document.querySelector("#serveBtn");
const pauseBtn = document.querySelector("#pauseBtn");

const focusBtn = document.querySelector("#focusBtn");
const musicBtn = document.querySelector("#musicBtn");
const startBtn = document.querySelector("#startBtn");
const resetProgressBtn = document.querySelector("#resetProgressBtn");
const diffBtns = Array.from(document.querySelectorAll(".diffBtn"));
const diffInfo = document.querySelector("#diffInfo");
const levelInfo = document.querySelector("#levelInfo");

// ------------------------------
// Focus mode
// ------------------------------
const FOCUS_KEY = "matcha-mother-focus";
let focusOn = false;

function setFocus(on) {
  focusOn = on;
  document.body.classList.toggle("focus-mode", focusOn);
  focusBtn.textContent = `Focus: ${focusOn ? "On" : "Off"}`;
  try { localStorage.setItem(FOCUS_KEY, focusOn ? "1" : "0"); } catch {}
}

focusBtn.addEventListener("click", () => setFocus(!focusOn));

// Optional keyboard shortcut: press "F"
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "f") setFocus(!focusOn);
});

// ------------------------------
// Audio
// ------------------------------
const music = new Audio(ASSET("SunnyRetro2.mp3"));
music.loop = true;
music.volume = 0.4;

let musicOn = false;
async function setMusic(on) {
  musicOn = on;
  musicBtn.textContent = `Music: ${musicOn ? "On" : "Off"}`;
  try {
    if (musicOn) await music.play();
    else music.pause();
  } catch {}
}
musicBtn.addEventListener("click", () => setMusic(!musicOn));

// ------------------------------
// Game configuration
// ------------------------------
const DIFFICULTIES = {
  easy:   { label: "Easy",   lineCap: 3, patience: 20, tipMax: 7 },
  medium: { label: "Medium", lineCap: 5, patience: 15, tipMax: 7 },
  hard:   { label: "Hard",   lineCap: 7, patience: 10, tipMax: 7 },
};

const LEVELS = [
  { id: 1, name: "Day 1", goal: 120, drinks: ["hot", "boba"] },
  { id: 2, name: "Day 2", goal: 180, drinks: ["hot", "boba", "strawberry"] },
  { id: 3, name: "Day 3", goal: 200, drinks: ["hot", "boba", "strawberry", "lavender", "galaxy"] },
  { id: 4, name: "Day 4 (Bonus)", goal: 500, drinks: ["hot", "boba", "strawberry", "lavender", "galaxy"] },
  { id: 5, name: "Day 5 (Bonus)", goal: 1000, drinks: ["hot", "boba", "strawberry", "lavender", "galaxy"] },
];

const DRINKS = {
  hot: {
    id: "hot",
    display: "Hot Matcha",
    cupImg: "hot-matcha.png",
    ingredients: ["matcha-powder.png", "water.png", "milk.png"],
    orderLines: ["One hot matcha please.", "Can I get a classic hot matcha?", "Warm matcha moment, please."],
  },
  strawberry: {
    id: "strawberry",
    display: "Strawberry Matcha",
    cupImg: "strawberry-matcha.png",
    ingredients: ["strawberry-puree.png", "matcha-powder.png", "water.png", "milk.png"],
    orderLines: ["Strawberry matcha, pretty please.", "I’m feeling pink today—strawberry matcha!", "Strawberry matcha… as a treat."],
  },
  boba: {
    id: "boba",
    display: "Boba Matcha",
    cupImg: "boba-matcha.png",
    ingredients: ["boba.png", "matcha-powder.png", "water.png", "milk.png"],
    orderLines: ["Boba matcha please.", "Boba matcha—extra cozy.", "Matcha with boba… you get me."],
  },
  lavender: {
    id: "lavender",
    display: "Lavender Matcha",
    cupImg: "lavender-matcha.png",
    ingredients: ["lavender-syrup.png", "matcha-powder.png", "water.png", "milk.png"],
    orderLines: ["Lavender matcha please.", "Lavender matcha—soft day.", "A lavender matcha would save me."],
  },
  galaxy: {
    id: "galaxy",
    display: "Galaxy Matcha",
    cupImg: "galaxy-matcha.png",
    ingredients: ["shimmer.png", "matcha-powder.png", "water.png", "milk.png"],
    orderLines: ["Galaxy matcha please!", "One galaxy matcha—starry vibes.", "I want the sparkly one—galaxy!"],
  },
};

const INGREDIENTS = [
  { id: "matcha-powder.png", label: "Matcha" },
  { id: "water.png", label: "Water" },
  { id: "milk.png", label: "Milk" },
  { id: "strawberry-puree.png", label: "Strawberry" },
  { id: "lavender-syrup.png", label: "Lavender" },
  { id: "boba.png", label: "Boba" },
  { id: "shimmer.png", label: "Shimmer" },
];

const BASE_PRICE = 5;

// Combo bonus: perfect serve streak => +1, +2, +3, +4, +5 (cap 5)
function comboBonusForStreak(streak) {
  return Math.min(5, Math.max(0, streak));
}

function difficulty() { return DIFFICULTIES[Game.selectedDifficulty]; }
function levelDef(id) { return LEVELS.find(l => l.id === id); }

// ------------------------------
// Save progression
// ------------------------------
const SAVE_KEY = "matcha-mother-save-v2";

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveProgress() {
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    unlockedLevel: Game.unlockedLevel,
    selectedDifficulty: Game.selectedDifficulty,
  }));
}
function resetProgress() {
  localStorage.removeItem(SAVE_KEY);
}

// ------------------------------
// Assets loader
// ------------------------------
const Images = new Map();

async function loadImage(name) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = ASSET(name);
  });
}

async function loadAllAssets() {
  const imageNames = [
    "cafe-background.png",
    "empty-cup.png",
    "hot-matcha.png",
    "strawberry-matcha.png",
    "boba-matcha.png",
    "lavender-matcha.png",
    "galaxy-matcha.png",
    "jolene-idle-1.png",
    "customer-jenny-happy.png",
    "customer-jenny-mad.png",
    "customer-kevin-happy.png",
    "customer-kevin-mad.png",
    ...INGREDIENTS.map(i => i.id),
  ];

  for (const name of imageNames) {
    try {
      Images.set(name, await loadImage(name));
    } catch {
      Images.set(name, null);
    }
  }
}
function img(name) { return Images.get(name) || null; }

// ------------------------------
// Toast / feedback
// ------------------------------
function showToast(text, ms = 2200) {
  toastEl.textContent = text;
  toastEl.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toastEl.classList.add("hidden");
    toastEl.textContent = "";
  }, ms);
}
function setFeedback(text) { feedbackEl.textContent = text; }

// ------------------------------
// Game state
// ------------------------------
const Game = {
  mode: "MENU", // MENU | PLAY | PAUSE | RESULTS
  selectedDifficulty: "easy",
  unlockedLevel: 1,

  levelId: 1,
  levelDuration: 180,
  timeLeft: 180,

  earned: 0,
  served: 0,

  baseTotal: 0,
  tipTotal: 0,
  comboBonusTotal: 0,
  customersLeft: 0,

  combo: 0,
  bestCombo: 0,
  perfectServes: 0,

  customers: [],
  spawnTimer: 0,

  currentCustomer: null,
  currentDrink: null,
  added: new Set(),
  whiskProgress: 0,
  canServe: false,

  dragging: null,
};

// ------------------------------
// Customers
// ------------------------------
function makeCustomer() {
  const isJenny = Math.random() < 0.5;
  return {
    name: isJenny ? "Jenny" : "Kevin",
    spriteHappy: isJenny ? "customer-jenny-happy.png" : "customer-kevin-happy.png",
    spriteMad: isJenny ? "customer-jenny-mad.png" : "customer-kevin-mad.png",
    drinkId: null,
    patienceLeft: difficulty().patience,
    overtime: 0,
    tip: difficulty().tipMax,
    mood: "happy",
    leaving: false,
  };
}

function pickDrinkForLevel(level) {
  const ids = level.drinks;
  const id = ids[Math.floor(Math.random() * ids.length)];
  return DRINKS[id];
}

function enqueueCustomer() {
  if (Game.customers.length >= difficulty().lineCap) return;
  const c = makeCustomer();
  const drink = pickDrinkForLevel(levelDef(Game.levelId));
  c.drinkId = drink.id;
  Game.customers.push(c);
}

function updateCustomers(dt) {
  for (const c of Game.customers) {
    if (c.leaving) continue;

    c.patienceLeft -= dt;

    if (c.patienceLeft < 0) {
      c.overtime += dt;

      const newTip = Math.max(0, difficulty().tipMax - Math.floor(c.overtime));
      c.tip = newTip;

      if (c.tip <= 0) {
        c.mood = "mad";
        if (c.overtime >= difficulty().tipMax + 1) {
          c.leaving = true;
        }
      }
    }
  }

  const before = Game.customers.length;
  Game.customers = Game.customers.filter(c => !c.leaving);
  const removed = before - Game.customers.length;

  if (removed > 0) {
    Game.customersLeft += removed;
    showToast("A customer left…", 1600);
    setFeedback("Try serving faster next time.");
  }
}

// ------------------------------
// Drink-making
// ------------------------------
function setCurrentCustomerToFront() {
  Game.currentCustomer = Game.customers.length ? Game.customers[0] : null;

  if (!Game.currentCustomer) {
    Game.currentDrink = null;
    Game.added = new Set();
    Game.whiskProgress = 0;
    Game.canServe = false;
    serveBtn.disabled = true;
    updateOrderUI();
    return;
  }

  Game.currentDrink = DRINKS[Game.currentCustomer.drinkId];
  Game.added = new Set();
  Game.whiskProgress = 0;
  Game.canServe = false;
  serveBtn.disabled = true;

  updateOrderUI(true);
}

function updateOrderUI(newOrder = false) {
  if (!Game.currentCustomer) {
    orderEl.textContent = "—";
    orderLineEl.textContent = "No customers right now.";
    drinkEl.textContent = "—";
    baseEl.textContent = `$${BASE_PRICE}`;
    tipEl.textContent = "$0";
    return;
  }

  const d = Game.currentDrink;
  orderEl.textContent = `${Game.currentCustomer.name} is waiting…`;
  drinkEl.textContent = d.display;
  baseEl.textContent = `$${BASE_PRICE}`;
  tipEl.textContent = `$${Game.currentCustomer.tip}`;

  if (newOrder) {
    const line = d.orderLines[Math.floor(Math.random() * d.orderLines.length)];
    orderLineEl.textContent = line;
  }
}

function checkServeReady() {
  if (!Game.currentDrink) return false;

  for (const ing of Game.currentDrink.ingredients) {
    if (!Game.added.has(ing)) return false;
  }

  if (Game.whiskProgress < 1) return false;

  return true;
}

function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// Zones
const Zones = {
  cup:     { x: 360, y: 220, w: 220, h: 220 },
  whisk:   { x: 620, y: 280, w: 140, h: 140 },
  serve:   { x: 780, y: 420, w: 150, h: 80 },
  tray:    { x: 40,  y: 390, w: 300, h: 120 },
  line:    { x: 40,  y: 90,  w: 300, h: 260 },
  jolene:  { x: 700, y: 110, w: 220, h: 220 },
};

const TraySlots = (() => {
  const startX = Zones.tray.x + 10;
  const startY = Zones.tray.y + 10;
  const size = 52;
  const gap = 10;

  const slots = [];
  for (let i = 0; i < INGREDIENTS.length; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    slots.push({
      ingredientId: INGREDIENTS[i].id,
      rect: {
        x: startX + col * (size + gap),
        y: startY + row * (size + gap),
        w: size,
        h: size,
      }
    });
  }
  return slots;
})();

function hitTestTray(wx, wy) {
  for (const s of TraySlots) {
    if (pointInRect(wx, wy, s.rect)) return s;
  }
  return null;
}

function onIngredientDropped(ingredientId, dropX, dropY) {
  if (!Game.currentDrink || !Game.currentCustomer) return;

  const inCup = pointInRect(dropX, dropY, Zones.cup);
  if (!inCup) {
    setFeedback("Drop ingredients into the cup.");
    return;
  }

  const needed = Game.currentDrink.ingredients;
  const isNeeded = needed.includes(ingredientId);

  if (!isNeeded) {
    setFeedback("Oops! That’s not for this drink.");
    showToast("Oops! Wrong ingredient.", 1400);
    haptic(25);
    return "bounce";
  }

  if (Game.added.has(ingredientId)) {
    setFeedback("Already added.");
    return;
  }

  Game.added.add(ingredientId);
  showToast("Ingredient added.", 900);
  haptic(10);

  if (checkServeReady()) {
    Game.canServe = true;
    serveBtn.disabled = false;
    setFeedback("Ready! Tap Serve.");
  } else {
    const allIngs = needed.every(i => Game.added.has(i));
    setFeedback(allIngs ? "Now whisk! Tap fast in the whisk circle." : "Nice! Keep going.");
  }

  updateOrderUI(false);
}

// ------------------------------
// Levels
// ------------------------------
function randomLevelDuration() {
  return 150 + Math.floor(Math.random() * (270 - 150 + 1));
}
function nextPlayableLevel() {
  return Math.min(Game.unlockedLevel, 5);
}

function updateMenuInfo() {
  const lvl = levelDef(nextPlayableLevel());
  levelInfo.textContent =
    `Level ${lvl.id}: ${lvl.drinks.map(id => DRINKS[id].display).join(" + ")} · Goal $${lvl.goal}`;

  const diff = difficulty();
  diffInfo.textContent =
    `${diff.label}: line ${diff.lineCap}, patience ${diff.patience}s, tip max $${diff.tipMax}`;
}

function startLevel(levelId) {
  Game.levelId = levelId;
  const lvl = levelDef(levelId);

  Game.levelDuration = randomLevelDuration();
  Game.timeLeft = Game.levelDuration;

  Game.earned = 0;
  Game.served = 0;

  Game.baseTotal = 0;
  Game.tipTotal = 0;
  Game.comboBonusTotal = 0;
  Game.customersLeft = 0;

  Game.combo = 0;
  Game.bestCombo = 0;
  Game.perfectServes = 0;

  Game.customers = [];
  Game.spawnTimer = 0;

  Game.currentCustomer = null;
  Game.currentDrink = null;
  Game.added = new Set();
  Game.whiskProgress = 0;
  Game.canServe = false;
  serveBtn.disabled = true;

  Game.mode = "PLAY";

  overlayEl.style.display = "none";
  receiptEl.classList.add("hidden");
  menuGridEl.classList.remove("hidden");

  showToast(`${lvl.name} started. Goal $${lvl.goal}`, 2400);

  enqueueCustomer();
  if (Math.random() < 0.5) enqueueCustomer();

  setCurrentCustomerToFront();
  updateTopUI();
}

function endLevel() {
  const lvl = levelDef(Game.levelId);
  const success = Game.earned >= lvl.goal;

  Game.mode = "RESULTS";
  overlayEl.style.display = "grid";

  menuGridEl.classList.add("hidden");
  receiptEl.classList.remove("hidden");

  overlayTitleEl.textContent = success ? `${lvl.name} complete!` : `${lvl.name} failed…`;
  overlayDescEl.textContent = success
    ? `You hit the goal and unlocked the next level.`
    : `You didn’t reach the goal, so you’ll repeat this level.`;

  if (success) {
    Game.unlockedLevel = Math.max(Game.unlockedLevel, Math.min(5, Game.levelId + 1));
    saveProgress();
  }

  renderReceipt(success);
  updateMenuInfo();
}

function renderReceipt(success) {
  const lvl = levelDef(Game.levelId);

  receiptEl.innerHTML = `
    <h3>Day Summary Receipt</h3>
    <div class="receiptGrid">
      <div>Level</div><div class="right">${lvl.id}</div>
      <div>Duration</div><div class="right">${Math.round(Game.levelDuration)}s</div>
      <div>Served</div><div class="right">${Game.served}</div>
      <div>Customers who left</div><div class="right">${Game.customersLeft}</div>

      <div style="margin-top:8px;">Base ($${BASE_PRICE} × ${Game.served})</div><div class="right" style="margin-top:8px;">$${Game.baseTotal}</div>
      <div>Tips</div><div class="right">$${Game.tipTotal}</div>
      <div>Combo Bonus</div><div class="right">$${Game.comboBonusTotal}</div>

      <div style="margin-top:8px; font-weight:900;">TOTAL</div><div class="right" style="margin-top:8px; font-weight:900;">$${Game.earned}</div>
      <div>Goal</div><div class="right">$${lvl.goal}</div>
      <div>Best Combo</div><div class="right">${Game.bestCombo}</div>
      <div>Perfect Serves</div><div class="right">${Game.perfectServes}</div>
    </div>
    <div class="badge">${success ? "PASSED — Next level unlocked" : "REPEAT — Try the day again"}</div>
    <div class="row" style="margin-top:12px;">
      <button id="receiptPrimaryBtn">${success ? "Next Level" : "Retry Level"}</button>
      <button id="receiptMenuBtn" class="ghost">Back to Menu</button>
    </div>
  `;

  document.querySelector("#receiptPrimaryBtn").addEventListener("click", async () => {
    if (!musicOn) await setMusic(true);
    const next = success ? Math.min(5, Game.levelId + 1) : Game.levelId;
    startLevel(next);
  });

  document.querySelector("#receiptMenuBtn").addEventListener("click", () => {
    Game.mode = "MENU";
    overlayEl.style.display = "grid";
    menuGridEl.classList.remove("hidden");
    receiptEl.classList.add("hidden");
    overlayTitleEl.textContent = "Matcha Mother";
    overlayDescEl.textContent =
      "Drag ingredients into the cup, tap whisk fast, then serve customers before they leave.";
    updateMenuInfo();
  });
}

// ------------------------------
// Serving + combos
// ------------------------------
function tryServe() {
  if (Game.mode !== "PLAY") return;
  if (!Game.currentCustomer || !Game.currentDrink) return;

  const ready = checkServeReady();
  if (!ready) {
    setFeedback("Not ready yet—add ingredients and whisk.");
    showToast("Not ready yet.", 1000);
    haptic(20);
    return;
  }

  const tipMax = difficulty().tipMax;
  const tip = Game.currentCustomer.tip;
  const perfect = tip === tipMax;

  if (perfect) {
    Game.combo += 1;
    Game.bestCombo = Math.max(Game.bestCombo, Game.combo);
    Game.perfectServes += 1;
  } else {
    Game.combo = 0;
  }

  const comboBonus = perfect ? comboBonusForStreak(Game.combo) : 0;

  const base = BASE_PRICE;
  const earned = base + tip + comboBonus;

  Game.baseTotal += base;
  Game.tipTotal += tip;
  Game.comboBonusTotal += comboBonus;
  Game.earned += earned;
  Game.served += 1;

  showToast(perfect ? `Perfect! +$${earned}` : `Served! +$${earned}`, 1400);
  setFeedback(perfect ? "Perfect serve! Combo up!" : "Served!");

  haptic(perfect ? 50 : 25);

  Game.customers.shift();
  updateTopUI();

  setCurrentCustomerToFront();
}

serveBtn.addEventListener("click", tryServe);

// ------------------------------
// Pause
// ------------------------------
pauseBtn.addEventListener("click", () => {
  if (Game.mode === "PLAY") {
    Game.mode = "PAUSE";
    pauseBtn.textContent = "Resume";
    showToast("Paused", 900);
  } else if (Game.mode === "PAUSE") {
    Game.mode = "PLAY";
    pauseBtn.textContent = "Pause";
    showToast("Resume", 900);
  }
});

// ------------------------------
// Overlay controls
// ------------------------------
diffBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    Game.selectedDifficulty = btn.dataset.diff;
    diffBtns.forEach(b => b.classList.toggle("selected", b === btn));
    updateMenuInfo();
    saveProgress();
  });
});

startBtn.addEventListener("click", async () => {
  if (!musicOn) await setMusic(true);
  startLevel(nextPlayableLevel());
});

resetProgressBtn.addEventListener("click", () => {
  Game.unlockedLevel = 1;
  resetProgress();
  saveProgress();
  showToast("Progress reset to Level 1", 1600);
  updateMenuInfo();
});

// ------------------------------
// Input (pointer events)
// ------------------------------
canvas.addEventListener("pointerdown", (e) => {
  if (Game.mode !== "PLAY") return;

  canvas.setPointerCapture(e.pointerId);
  const p = toWorld(e.clientX, e.clientY);

  // whisk tap
  if (pointInRect(p.x, p.y, Zones.whisk)) {
    if (Game.currentDrink && Game.currentCustomer) {
      Game.whiskProgress = Math.min(1, Game.whiskProgress + 0.06);
      setFeedback(Game.whiskProgress >= 1 ? "Whisked! Now serve." : "Whisking… tap fast!");
      haptic(8);

      if (checkServeReady()) {
        Game.canServe = true;
        serveBtn.disabled = false;
        setFeedback("Ready! Tap Serve.");
      }
    }
    return;
  }

  // serve tap
  if (pointInRect(p.x, p.y, Zones.serve)) {
    tryServe();
    return;
  }

  // drag from tray
  const slot = hitTestTray(p.x, p.y);
  if (slot) {
    const r = slot.rect;
    Game.dragging = {
      ingredientId: slot.ingredientId,
      x: p.x,
      y: p.y,
      startX: r.x + r.w / 2,
      startY: r.y + r.h / 2,
      bounceBack: false,
    };
    haptic(10);
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (Game.mode !== "PLAY") return;
  if (!Game.dragging) return;
  const p = toWorld(e.clientX, e.clientY);
  Game.dragging.x = p.x;
  Game.dragging.y = p.y;
});

canvas.addEventListener("pointerup", () => {
  if (Game.mode !== "PLAY") return;
  if (!Game.dragging) return;

  const d = Game.dragging;
  const result = onIngredientDropped(d.ingredientId, d.x, d.y);

  if (result === "bounce") {
    d.bounceBack = true;
  } else {
    Game.dragging = null;
  }
});

// ------------------------------
// Drawing helpers
// ------------------------------
function drawRect(r, fill, stroke) {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
  if (stroke) {
    ctx.save();
    ctx.lineWidth = 3;              // thicker border so it's easier to see
    ctx.strokeStyle = stroke;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.restore();
  }
}

function drawImageOrFallback(name, r) {
  const im = img(name);
  if (im) ctx.drawImage(im, r.x, r.y, r.w, r.h);
  else {
    drawRect(r, "rgba(220,220,220,0.9)", "rgba(50,50,50,0.6)");
    ctx.fillStyle = "rgba(20,20,20,0.8)";
    ctx.font = "12px system-ui";
    ctx.fillText(name, r.x + 6, r.y + 18);
  }
}

function money(n) { return `$${Math.floor(n)}`; }

function updateTopUI() {
  const lvl = levelDef(Game.levelId);
  diffEl.textContent = difficulty().label;
  levelEl.textContent = String(Game.levelId);
  timeEl.textContent = `${Math.ceil(Game.timeLeft)}s`;
  goalEl.textContent = `$${lvl.goal}`;
  earnedEl.textContent = money(Game.earned);
  servedEl.textContent = String(Game.served);
  comboEl.textContent = String(Game.combo);
  bestComboEl.textContent = String(Game.bestCombo);

  if (Game.currentCustomer) tipEl.textContent = money(Game.currentCustomer.tip);
  else tipEl.textContent = "$0";
}

// ------------------------------
// Update + Draw loop
// ------------------------------
let last = performance.now();

function update(dt) {
  if (Game.mode !== "PLAY") return;

  Game.timeLeft -= dt;
  if (Game.timeLeft <= 0) {
    Game.timeLeft = 0;
    updateTopUI();
    endLevel();
    return;
  }

  Game.spawnTimer -= dt;
  if (Game.spawnTimer <= 0) {
    enqueueCustomer();
    Game.spawnTimer = 4 + Math.random() * 3.0;
    if (!Game.currentCustomer) setCurrentCustomerToFront();
  }

  updateCustomers(dt);

  const front = Game.customers[0] || null;
  if (front !== Game.currentCustomer) setCurrentCustomerToFront();
  else if (front) {
    Game.currentCustomer = front;
    Game.currentDrink = DRINKS[front.drinkId];
    tipEl.textContent = money(front.tip);
  }

  if (Game.dragging && Game.dragging.bounceBack) {
    const d = Game.dragging;
    const dx = d.startX - d.x;
    const dy = d.startY - d.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 2) Game.dragging = null;
    else {
      d.x += dx * 0.25;
      d.y += dy * 0.25;
    }
  }

  updateTopUI();
}

function draw() {
  ctx.clearRect(0, 0, view.cssW, view.cssH);

  ctx.save();
  ctx.translate(view.offX, view.offY);
  ctx.scale(view.scale, view.scale);

  drawImageOrFallback("cafe-background.png", { x: 0, y: 0, w: WORLD.w, h: WORLD.h });

  drawImageOrFallback("jolene-idle-1.png", Zones.jolene);

  // Stronger, clearer panels
  drawRect(Zones.line, "rgba(255,255,255,0.70)", "rgba(53,34,34,0.70)");
  ctx.fillStyle = "rgba(53,34,34,0.90)";
  ctx.font = "700 16px system-ui";
  ctx.fillText("Customers", Zones.line.x + 10, Zones.line.y + 22);

  const max = difficulty().lineCap;
  for (let i = 0; i < Math.min(Game.customers.length, max); i++) {
    const c = Game.customers[i];
    const r = { x: Zones.line.x + 12, y: Zones.line.y + 36 + i * 70, w: 56, h: 56 };
    const sprite = c.mood === "mad" ? c.spriteMad : c.spriteHappy;
    drawImageOrFallback(sprite, r);

    const p = Math.max(0, c.patienceLeft) / difficulty().patience;
    const bar = { x: r.x + 66, y: r.y + 10, w: 160, h: 10 };
    drawRect(bar, "rgba(0,0,0,0.15)");
    drawRect({ x: bar.x, y: bar.y, w: bar.w * p, h: bar.h }, "rgba(68,162,162,0.95)");

    ctx.font = "12px system-ui";
    ctx.fillStyle = "rgba(53,34,34,0.92)";
    const drinkName = DRINKS[c.drinkId]?.display || "—";
    ctx.fillText(`${c.name}: ${drinkName}`, r.x + 66, r.y + 38);
    ctx.fillText(`Tip: $${c.tip}`, r.x + 66, r.y + 54);
  }

  // Cup zone (more visible)
  drawRect(Zones.cup, "rgba(255,255,255,0.88)", "rgba(53,34,34,0.75)");
  const cupRect = { x: Zones.cup.x + 60, y: Zones.cup.y + 30, w: 100, h: 160 };

  if (!Game.currentDrink) drawImageOrFallback("empty-cup.png", cupRect);
  else {
    const ready = checkServeReady();
    drawImageOrFallback(ready ? Game.currentDrink.cupImg : "empty-cup.png", cupRect);
  }

  // Needed ingredient icons (with clearer header)
  if (Game.currentDrink) {
    ctx.font = "12px system-ui";
    ctx.fillStyle = "rgba(53,34,34,0.95)";
    ctx.fillText("Needed:", Zones.cup.x + 12, Zones.cup.y + 22);

    const needed = Game.currentDrink.ingredients;
    for (let i = 0; i < needed.length; i++) {
      const id = needed[i];
      const rr = { x: Zones.cup.x + 12 + i * 34, y: Zones.cup.y + 26, w: 28, h: 28 };
      drawImageOrFallback(id, rr);
      if (Game.added.has(id)) {
        ctx.fillStyle = "rgba(68,162,162,0.92)";
        ctx.fillRect(rr.x, rr.y, rr.w, rr.h);
        ctx.fillStyle = "white";
        ctx.font = "700 14px system-ui";
        ctx.fillText("✓", rr.x + 9, rr.y + 19);
      }
    }
  }

  // Whisk zone (stronger tint)
  drawRect(Zones.whisk, "rgba(244,207,72,0.40)", "rgba(53,34,34,0.75)");
  ctx.font = "800 14px system-ui";
  ctx.fillStyle = "rgba(53,34,34,0.95)";
  ctx.fillText("Whisk (tap fast)", Zones.whisk.x + 10, Zones.whisk.y + 18);

  const cx = Zones.whisk.x + Zones.whisk.w / 2;
  const cy = Zones.whisk.y + Zones.whisk.h / 2 + 10;
  const radius = 42;

  ctx.lineWidth = 10;
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();

  ctx.strokeStyle = "rgba(68,162,162,0.98)";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, -Math.PI/2, -Math.PI/2 + (Math.PI*2)*Game.whiskProgress);
  ctx.stroke();

  // Serve zone
  drawRect(Zones.serve, "rgba(68,162,162,0.22)", "rgba(53,34,34,0.75)");
  ctx.font = "900 16px system-ui";
  ctx.fillStyle = "rgba(53,34,34,0.95)";
  ctx.fillText("SERVE", Zones.serve.x + 44, Zones.serve.y + 50);

  // Tray zone
  drawRect(Zones.tray, "rgba(185,192,140,0.34)", "rgba(53,34,34,0.75)");
  ctx.font = "800 14px system-ui";
  ctx.fillStyle = "rgba(53,34,34,0.95)";
  ctx.fillText("Ingredients (drag)", Zones.tray.x + 10, Zones.tray.y + 18);

  for (const s of TraySlots) {
    drawRect(s.rect, "rgba(255,255,255,0.90)", "rgba(53,34,34,0.55)");
    drawImageOrFallback(s.ingredientId, s.rect);
  }

  if (Game.dragging) {
    const r = { x: Game.dragging.x - 26, y: Game.dragging.y - 26, w: 52, h: 52 };
    drawRect(r, "rgba(255,255,255,0.95)", "rgba(53,34,34,0.85)");
    drawImageOrFallback(Game.dragging.ingredientId, r);
  }

  // Small HUD (still visible in focus mode)
  ctx.font = "800 14px system-ui";
  ctx.fillStyle = "rgba(53,34,34,0.95)";
  ctx.fillText(`Earned: $${Game.earned}`, 720, 30);
  ctx.fillText(`Time: ${Math.ceil(Game.timeLeft)}s`, 720, 50);
  ctx.fillText(`Combo: ${Game.combo}`, 720, 70);

  ctx.restore();
    // ------------------------------
  // HUD info box (screen space)
  // ------------------------------
  const hudX = 14;
  const hudY = 14;
  const hudW = 220;
  const hudH = 78;

  // White background
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillRect(hudX, hudY, hudW, hudH);

  // Brown border
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(53,34,34,0.95)";
  ctx.strokeRect(hudX, hudY, hudW, hudH);

  // Text
  ctx.fillStyle = "rgba(53,34,34,0.98)";
  ctx.font = "800 14px system-ui";
  ctx.fillText(`Earned: $${Game.earned}`, hudX + 12, hudY + 26);
  ctx.fillText(`Time: ${Math.ceil(Game.timeLeft)}s`, hudX + 12, hudY + 46);
  ctx.fillText(`Combo: ${Game.combo}`, hudX + 12, hudY + 66);
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// ------------------------------
// Boot
// ------------------------------
(async function boot() {
  resizeCanvasToCSS();

  // Load saved focus
  try {
    const rawFocus = localStorage.getItem(FOCUS_KEY);
    setFocus(rawFocus === "1");
  } catch {
    setFocus(false);
  }

  const saved = loadSave();
  if (saved) {
    if (saved.unlockedLevel) Game.unlockedLevel = saved.unlockedLevel;
    if (saved.selectedDifficulty) Game.selectedDifficulty = saved.selectedDifficulty;
  }
  saveProgress();

  diffBtns.forEach(b => b.classList.toggle("selected", b.dataset.diff === Game.selectedDifficulty));
  updateMenuInfo();

  await loadAllAssets();

  overlayEl.style.display = "grid";
  overlayTitleEl.textContent = "Matcha Mother";
  overlayDescEl.textContent =
    "Drag ingredients into the cup, tap whisk fast, then serve customers before they leave.";

  receiptEl.classList.add("hidden");
  menuGridEl.classList.remove("hidden");

  musicBtn.textContent = "Music: Off";
  focusBtn.textContent = `Focus: ${focusOn ? "On" : "Off"}`;

  diffEl.textContent = "—";
  levelEl.textContent = "1";
  timeEl.textContent = "—";
  goalEl.textContent = "—";
  earnedEl.textContent = "$0";
  servedEl.textContent = "0";
  comboEl.textContent = "0";
  bestComboEl.textContent = "0";

  orderEl.textContent = "—";
  orderLineEl.textContent = "—";
  drinkEl.textContent = "—";
  baseEl.textContent = `$${BASE_PRICE}`;
  tipEl.textContent = "$0";

  requestAnimationFrame(loop);
})();