// ============================================================
// state.js — global game state
// ------------------------------------------------------------
// All the variables the rest of the engine reads/writes live here.
// Since we're not using ES modules, declaring a `var` at the top
// level of this file makes it a global that every other file can see.
//
// Coordinate system note: the original engine uses a TILE grid,
// not pixels. The arena is 18 tiles wide × 32 tiles tall, with
// each tile = 15 pixels. We keep that internally because all the
// card stats (range, speed, size) are in tile units. render.js and
// input.js will convert between tiles and pixels when needed.
// ============================================================


// ---- ARENA CONSTANTS ----
// The arena rectangle in pixel coordinates (matches the original).
var TILE_SIZE = 16;
var ARENA_PX_X =1;        // left edge of arena, in pixels
var ARENA_PX_Y = 1;         // top edge of arena, in pixels
var ARENA_TILES_W = 18;
var ARENA_TILES_H = 32;
var bConeFlashes = [];
var rConeFlashes = [];
// Helper: convert a tile coordinate to a pixel coordinate.
// Example: tileToPx(15) → 60 + 15*15 = 285
function tileToPx(t) {
  return ARENA_PX_X + t * TILE_SIZE;
}

// Helper: convert a pixel coordinate (e.g. mouseX) back to tiles.
function pxToTile(p) {
  return (p - ARENA_PX_X) / TILE_SIZE;
}


// ---- ELIXIR SETTINGS ----
// The original did `regenX = regenX / 84` after load. Here's why:
// at 30 FPS, 84 frames ≈ 2.8 seconds (the standard Clash regen time).
// So regenX ends up adding 1/84 elixir per frame = +1 elixir every 2.8s.
var startE = 5;              // starting elixir
var maxE = 10;               // elixir cap
var regenX = 1 / 84;         // elixir gained per frame (1x speed)

var elixir = startE;         // current player elixir


// ---- PLAYER DECK & HAND ----
// bDeck: array of 8 card INDICES (into the `cards` array from cards.js).
// Starts empty — ui.js fills this when the player confirms their deck.
// bOrder: cycles through which cards are currently in hand.
//   bOrder[0..3] = cards in hand (4 slots)
//   bOrder[4]    = next card (the "on-deck" preview)
//   bOrder[5..7] = rest of the cycle
// bSel: which hand slot is currently picked up (-1 = none).
var bDeck = [];
var bOrder = [];
var bSel = -1;


// ---- ACTIVE UNITS ON THE BOARD ----
// Every troop and tower is a positional array (see troops.js for index docs).
// bTroops[0..2] are always the 3 player towers:
//   [0] = King tower (center-bottom)
//   [1] = Left Princess tower
//   [2] = Right Princess tower
// Any deployed troops get pushed onto the end.
//
// Tower format (from the original engine):
// ["name", hp, maxHp, dmg, x, y, size, mass, speed, range, sightRange,
//  cooldown, maxCooldown, ret, target, lock, shield, aoe, type,
//  targetType, penalty, loadTime, deployTime, effects[]]
var bTroops = [];
var rTroops = [];


// ---- PROJECTILES ----
// bProj / rProj:  homing projectiles (follow their target)
// bNProj/ rNProj: non-homing projectiles (fly to a fixed spot — Fireball, etc.)
var bProj = [];
var rProj = [];
var bNProj = [];
var rNProj = [];


// ---- GAME FLAGS ----
var won = 0;                 // >0 means a side won; animates over frames
                             // (the original uses this to fade in a "win" banner)


// ---- MESSAGE LOG ----
// Mirrors the original's say() system — a rolling list of events.
// render.js or ui.js can display these either on the canvas or in the
// #messageLog <div>. Newest messages go to the front of the array.
var messages = [];

function say(txt) {
  var stamp = (typeof frame === "number") ? frame : 0;
  messages.unshift(stamp + ": " + txt);
  // Keep it bounded so the array doesn't grow forever
  if (messages.length > 100) messages.pop();
}


// ============================================================
// Tower factory — returns a fresh tower array.
// Called by resetState() below so each battle starts fresh.
// ============================================================
function makeTower(kind, x, y, facingAngle) {
  if (kind === "king") {
    // King tower: 4008 HP, slightly bigger, shoots every 1 sec (30 frames)
    return ["KING", 4008, 4008, 90, x, y, 2.8, 0, 0, 7, 7, 0, 30, 15,
            -1, false, 180, 0, "building", "all", 1, 0, 0, []];
  } else {
    // Princess tower: 2534 HP, smaller, shoots every 0.8 sec (24 frames)
    return ["", 2534, 2534, 90, x, y, 2, 0, 0, 7.5, 7.5, 0, 24, 30,
            -1, false, facingAngle, 0, "building", "all", 1, 0, 0, []];
  }
}


// ============================================================
// resetState() — called by main.js when a battle starts.
// Wipes the board, restores starting values, and places the towers.
// ------------------------------------------------------------
// Tower positions (in tiles, from the original engine):
//   Player side (bottom):  King @ (29, 9), Princesses @ (25.5, 3.5) & (25.5, 14.5)
//   Enemy side (top):      King @ (3, 9),  Princesses @ (6.5, 3.5)  & (6.5, 14.5)
// Facing angle 180 = looking down (player), 0 = looking up (enemy).
// ============================================================
function resetState() {
  // Reset elixir
  elixir = startE;

  // Reset projectiles
  bProj = [];
  rProj = [];
  bNProj = [];
  rNProj = [];

  // Place player towers
  bTroops = [
    makeTower("king",     29,   9,   180),
    makeTower("princess", 25.5, 3.5, 180),
    makeTower("princess", 25.5, 14.5, 180),
  ];

  // Place enemy towers
  rTroops = [
    makeTower("king",     3,   9,   0),
    makeTower("princess", 6.5, 3.5, 0),
    makeTower("princess", 6.5, 14.5, 0),
  ];

  // Set up the player's hand from their chosen deck.
  // bOrder starts as [0,1,2,3,4,5,6,7] — first 4 are in hand,
  // slot 4 is "next card," then 5-7 are pending.
  bOrder = [];
  for (var i = 0; i < bDeck.length; i++) {
    bOrder.push(i);
  }

  bSel = -1;
  won = 0;
  messages = [];

  say("Battle started!");
}