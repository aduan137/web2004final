
var TILE_SIZE = 16;
var ARENA_PX_X =1;        
var ARENA_PX_Y = 1;         
var ARENA_TILES_W = 18;
var ARENA_TILES_H = 32;
var bConeFlashes = [];
var rConeFlashes = [];

function tileToPx(t) {
  return ARENA_PX_X + t * TILE_SIZE;
}


function pxToTile(p) {
  return (p - ARENA_PX_X) / TILE_SIZE;
}



var startE = 10;              
var maxE = 10;             
var regenX = 1 / 50;         

var elixir = startE;       



var bDeck = [];
var bOrder = [];
var bSel = -1;



var bTroops = [];
var rTroops = [];



var bProj = [];
var rProj = [];
var bNProj = [];
var rNProj = [];



var won = 0;                 


var messages = [];

function say(txt) {
  var stamp = (typeof frame === "number") ? frame : 0;
  messages.unshift(stamp + ": " + txt);
  // Keep it bounded so the array doesn't grow forever
  if (messages.length > 100) messages.pop();
}


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