// ============================================================
// main.js — entry point & orchestration
// ------------------------------------------------------------
// p5.js automatically calls setup() once at start, then draw()
// ~30 times per second (based on frameRate we set below).
//
// This file is intentionally "thin": it just sets up the canvas,
// wires the deck-select UI to the battle start, and delegates
// the actual per-frame work to functions defined in other files.
// ============================================================


// ---- GAME PHASE FLAG ----
// The original engine ran the battle loop immediately on load.
// We gate the game loop behind a phase flag so we can show the
// deck-select screen first, then transition into battle.
var gamePhase = "battle";  // "deckSelect" | "battle" | "gameOver"

// Frame counter (used by the original for timing / animations / the log)
var frame = 0;
var sprites = {};
function preload() {
  // Troops — uncomment each line once you drop the matching PNG into sprites/
  // sprites.knight      = loadImage('sprites/knight.png');
  // sprites.archer      = loadImage('sprites/archer.png');
  // sprites.giant       = loadImage('sprites/giant.png');
  // sprites.minipekka   = loadImage('sprites/minipekka.png');
  // sprites.musketeer   = loadImage('sprites/musketeer.png');
  // sprites.minion      = loadImage('sprites/minion.png');
  // sprites.babydragon  = loadImage('sprites/babydragon.png');
  // sprites.skeleton    = loadImage('sprites/skeleton.png');
  // sprites.goblin      = loadImage('sprites/goblin.png');
  // sprites.speargoblin = loadImage('sprites/speargoblin.png');
  // sprites.valkyrie    = loadImage('sprites/valkyrie.png');
  // sprites.bomber      = loadImage('sprites/bomber.png');
  // sprites.wizard      = loadImage('sprites/wizard.png');
  // sprites.barbarian   = loadImage('sprites/barbarian.png');
  // sprites.cannon      = loadImage('sprites/cannon.png');

  // Towers
  // sprites.kingTowerBlue     = loadImage('sprites/king_tower_blue.png');
  // sprites.princessTowerBlue = loadImage('sprites/princess_tower_blue.png');
  // sprites.kingTowerRed      = loadImage('sprites/king_tower_red.png');
  // sprites.princessTowerRed  = loadImage('sprites/princess_tower_red.png');
}


// ============================================================
// setup() — runs once, automatically, when p5.js is ready
// ============================================================
function setup() {
  var canvas = createCanvas(600, 600);
  canvas.parent("gameContainer");

  frameRate(30);
  textSize(10);
  textAlign(LEFT, BASELINE);
  noCursor();

  // NEW: sync the visible screen to whatever phase we're starting in.
  // This makes the `var gamePhase = "battle"` dev shortcut actually work.
  if (gamePhase === "battle") {
    document.getElementById("deckSelectScreen").style.display = "none";
    document.getElementById("battleScreen").style.display = "flex";
  }

  if (typeof buildDeckSelectUI === "function") {
    buildDeckSelectUI(startBattle);
  } else {
    console.warn("buildDeckSelectUI not defined yet — ui.js is a stub.");
  }
}


// ============================================================
// startBattle() — called by ui.js when the player confirms deck
// ------------------------------------------------------------
// Hides the deck-select HTML, shows the canvas, and flips the
// phase flag so draw() starts running battle logic.
// ============================================================
function startBattle(selectedDeck) {
  console.log("Starting battle with deck:", selectedDeck);

  // state.js owns bDeck — we just write into it here.
  bDeck = selectedDeck;

  // Reset game state to fresh values. state.js defines resetState()
  // (we'll write it when we build state.js). For now, guard it.
  if (typeof resetState === "function") {
    resetState();
  }

  // Swap screens
  document.getElementById("deckSelectScreen").style.display = "none";
  document.getElementById("battleScreen").style.display = "flex";

  gamePhase = "battle";
}


// ============================================================
// draw() — runs ~30 times per second, automatically
// ------------------------------------------------------------
// This is the game loop. Order of operations mirrors the
// original engine:
//   1. Update elixir
//   2. Update troops (target, move, attack)
//   3. Update projectiles
//   4. Spawn enemy waves
//   5. Clear & redraw everything
//   6. Check win/loss
// Most of these will be stubs until we build their .js files.
// ============================================================
function draw() {
  // Don't run the battle loop until the player hits Start.
  if (gamePhase !== "battle") return;

  frame++;

  // ---- UPDATE PHASE ----
  // Each of these lives in its own file. We use `typeof ... === "function"`
  // guards so main.js can boot even if we haven't written them yet.
  if (typeof updateElixir === "function")       updateElixir();
  if (typeof updateWaves === "function")        updateWaves();        // waves.js (AI spawner)
  if (typeof updateTroops === "function")       updateTroops(); 
  if (typeof resolveOverlaps === "function") resolveOverlaps();       // troops.js
  if (typeof updateProjectiles === "function")  updateProjectiles();  // projectiles.js
  if (typeof resolveCollisions === "function")  resolveCollisions();  // (optional, later)
  if (typeof cleanupDead === "function")        cleanupDead();        // remove 0-hp stuff
   if (typeof updateSpells === "function") updateSpells();

  // ---- RENDER PHASE ----
  background(200, 200, 200);

  if (typeof drawArena === "function")  drawArena();
  else                                  drawArenaPlaceholder();

  if (typeof drawTroops === "function")       drawTroops();
  if (typeof drawProjectiles === "function")  drawProjectiles();
  if (typeof drawUI === "function")           drawUI();
 
// ...
if (typeof drawSpells === "function") drawSpells();

 
  else                                        drawUIPlaceholder();


  // Custom cursor (since we called noCursor() in setup)
  drawCursor();

  // ---- WIN / LOSS CHECK ----
  if (typeof checkGameOver === "function") checkGameOver();
}


// ============================================================
// Placeholder renderers — these exist so the canvas looks like
// SOMETHING before we've written the real render.js. Delete or
// ignore them once drawArena() and drawUI() exist in render.js.
// ============================================================

function drawArenaPlaceholder() {
  // Arena boundary (matches original's rect at 59,59,271,481,
  // though I've centered it here for the placeholder).
  stroke(0);
  strokeWeight(1);
  noFill();
  rect(60, 60, 480, 480);

  // River in the middle
  noStroke();
  fill(100, 150, 200);
  rect(60, 290, 480, 30);

  // Blue (player) towers — bottom half
  fill(0, 0, 200);
  rect(140, 460, 50, 50);   // left princess
  rect(280, 510, 50, 50);   // king (placeholder center-bottom)
  rect(420, 460, 50, 50);   // right princess

  // Red (enemy) towers — top half
  fill(200, 0, 0);
  rect(140, 90, 50, 50);
  rect(280, 60, 50, 50);
  rect(420, 90, 50, 50);

  // Label so you know the placeholder is working
  fill(0);
  textSize(14);
  textAlign(CENTER);
  text("Arena placeholder — frame " + frame, width / 2, 40);
  textAlign(LEFT);
  textSize(10);
}

function drawUIPlaceholder() {
  // Elixir bar background
  fill(80);
  noStroke();
  rect(60, 570, 480, 20);

  // Elixir fill (reads from global `elixir` if state.js defined it,
  // else shows 0 so we can see the bar)
  var e = (typeof elixir === "number") ? elixir : 0;
  var maxE_local = (typeof maxE === "number") ? maxE : 10;
  fill(200, 50, 200);
  rect(60, 570, 480 * (e / maxE_local), 20);

  // Elixir number
  fill(255);
  textAlign(CENTER);
  textSize(14);
  text(e.toFixed(1) + " / " + maxE_local, 300, 585);
  textAlign(LEFT);
  textSize(10);
}

function drawCursor() {
  noFill();
  stroke(0, 0, 0, mouseIsPressed ? 200 : 100);
  ellipse(mouseX, mouseY, 10, 10);
  ellipse(mouseX, mouseY, 1, 1);
}