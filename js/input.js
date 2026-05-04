
var SIDE_PANEL_X = 290;
var HAND_CARD_W = 62;
var HAND_H = 62;
var HAND_CARD_GAP = 5;
var HAND_Y = 350;
var ELIXIR_BAR_X = 0;
var ELIXIR_BAR_Y = 510
var ELIXIR_BAR_W = 290
var ELIXIR_BAR_H = 10

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.hand-card').forEach(function(el) {
    el.addEventListener('click', function() {
      var slot = parseInt(el.dataset.slot, 10);
      if (slot >= bOrder.length) return;
      var cardIdx = bDeck[bOrder[slot]];
      if (cardIdx === undefined || cardIdx === null) return;
      bSel = (bSel === slot) ? -1 : slot;
    });
  });
});

function ensureDefaultDeck() {
  if (bDeck.length >= 8) return;
  bDeck = [0, 1, 2, 3, 4, 5, 6, 7];
  bOrder = [0, 1, 2, 3, 4, 5, 6, 7];
  say("Auto-assigned default deck (first 8 cards)");
}



function mousePressed() {
  if (gamePhase !== "battle") return;

  var arenaRight = ARENA_PX_X + ARENA_TILES_W * TILE_SIZE;
  var arenaBottom = ARENA_PX_Y + ARENA_TILES_H * TILE_SIZE;
  if (mouseX >= ARENA_PX_X && mouseX <= arenaRight &&
      mouseY >= ARENA_PX_Y && mouseY <= arenaBottom) {
    tryPlaceSelectedCard(mouseX, mouseY);
  }
}


// ============================================================
// getHandSlotAtX(px) → slot index (0-3) or -1
// ============================================================

function isValidSpellPlacement(row, col) {
  if (row < 0.5 || row > 31.5) return false;
  if (col < 0.5 || col > 17.5) return false;
  return true;
}

// ============================================================
// tryPlaceSelectedCard(px, py) — attempt to spawn the selected
// card at the click position. Checks elixir and placement.
// ============================================================
function tryPlaceSelectedCard(px, py) {
  if (bSel === -1) return;
  if (bOrder.length === 0) return;

  var cardIdx = bDeck[bOrder[bSel]];
  if (cardIdx === undefined) return;

  var cost = getCardCost(cardIdx);

  if (elixir < cost) {
    say("Not enough elixir! Need " + cost + ", have " + Math.floor(elixir));
    return;
  }

var row = Math.floor(pxToTile(py)) + 0.5;
var col = Math.floor(pxToTile(px)) + 0.5;
if (isSpellCard(cardIdx)) {
  if (!isValidSpellPlacement(row, col)) {
    say("Can't place there");
    return;
  }
  castSpell(cardIdx, row, col, "blue");
  elixir -= cost;
  cycleHand(bSel);
  bSel = -1;
  return;
}

  if (!isValidPlacement(row, col)) {
    say("Can't place there!");
    return;
  }

  // Spawn each troop from the card template at the click position
  var templates = cards[cardIdx][3];
  for (var i = 0; i < templates.length; i++) {
    var t = deepCopyTroop(templates[i]);
    var rawName = cards[cardIdx][0];
t[39] = SPRITE_ALIASES[rawName] || rawName;
     t[4] = -t[4];      
    t[4] = row + t[4];    // apply spawn offset (row)
    t[5] = col + t[5];    // apply spawn offset (col)
    t[16] = 180;          // blue troops face up (toward enemy)
    bTroops.push(t);
      triggerSpawnSpell(t, "blue");
  }

  elixir -= cost;
  say("Placed " + getCardName(cardIdx) +
      " @(" + row.toFixed(1) + "," + col.toFixed(1) + ")");

  cycleHand(bSel);
  bSel = -1;
}

// ============================================================
// getCardBounds(cardIdx)
// ------------------------------------------------------------
// Returns the bounding box of all troops in the card's template.
// Used for placement validation — ensures wide formations like
// Royal Recruits can't spawn troops off the arena.
// ============================================================
function getCardBounds(cardIdx) {
  var templates = cards[cardIdx][3];
  var minRow = 0, maxRow = 0, minCol = 0, maxCol = 0;
  for (var i = 0; i < templates.length; i++) {
    var t = templates[i];
    var halfSize = (t[6] || 1.0) / 2;
    if (t[4] - halfSize < minRow) minRow = t[4] - halfSize;
    if (t[4] + halfSize > maxRow) maxRow = t[4] + halfSize;
    if (t[5] - halfSize < minCol) minCol = t[5] - halfSize;
    if (t[5] + halfSize > maxCol) maxCol = t[5] + halfSize;
  }
  return { minRow: minRow, maxRow: maxRow, minCol: minCol, maxCol: maxCol };
}

// ============================================================
// isValidPlacement(row, col)
// ------------------------------------------------------------
// Player can only place on their own half (rows 16.5+).
// River is at rows 15-16, so excluded automatically.
// TODO: once an enemy princess tower dies, allow placement on
// their half in that lane.
// ============================================================
function isValidPlacement(row, col, bounds) {
  // Default bounds if not provided (single troop with size 1)
  if (!bounds) bounds = { minRow: -0.5, maxRow: 0.5, minCol: -0.5, maxCol: 0.5 };

  // Arena edges: every troop in the formation must fit inside
if (row + bounds.minRow < 18) return false;     // can't place above row 14
  if (row + bounds.maxRow > 31.5) return false;   // can't extend past arena bottom
  if (col + bounds.minCol < 0.5) return false;    // can't extend past left edge (col 0)
  if (col + bounds.maxCol > 17.5) return false;   // can't extend past right edge (col 18)

  // Overlap check (existing)
  for (var i = 0; i < bTroops.length; i++) {
    var t = bTroops[i];
    if (t[1] <= 0) continue;
    var drow = Math.abs(t[4] - row);
    var dcol = Math.abs(t[5] - col);
    if (drow < 0.2 && dcol < 0.2) return false;
  }
  return true;
}


// ============================================================
// cycleHand(slot) — play the card in `slot`, bring next card in.
// Matches the original engine's cycling logic exactly:
//   bOrder [a, b, c, d, e, f, g, h] with slot=2 (play c) becomes
//   bOrder [a, b, e, d, f, g, h, c]
// ============================================================
function cycleHand(slot) {
  bOrder.push(bOrder[slot]);              // played card → end
  bOrder.splice(slot, 1, bOrder[4]);      // replace slot with next card
  bOrder.splice(4, 1);                    // remove the duplicated slot-4
}


// ============================================================
// drawUI() — called every frame from main.js's draw().
// Overrides the placeholder in main.js automatically.
// ============================================================
function drawUI() {
  ensureDefaultDeck();
  drawElixirBar();
  renderHandHTML(); 
  drawPlacementPreview();
}


// ============================================================
// drawElixirBar()
// ============================================================
function drawElixirBar() {
  noStroke();
  fill(30, 30, 50);
  rect(ELIXIR_BAR_X, ELIXIR_BAR_Y, ELIXIR_BAR_W, ELIXIR_BAR_H);

  fill(200, 60, 200);
  var pct = elixir / maxE;
  rect(ELIXIR_BAR_X, ELIXIR_BAR_Y, ELIXIR_BAR_W * pct, ELIXIR_BAR_H);

  stroke(0, 0, 0, 80);
  strokeWeight(1);
  for (var i = 1; i < maxE; i++) {
    var x = ELIXIR_BAR_X + (ELIXIR_BAR_W * i / maxE);
    line(x, ELIXIR_BAR_Y, x, ELIXIR_BAR_Y + ELIXIR_BAR_H);
  }
  noStroke();

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(10);
  text(Math.floor(elixir) + " / " + maxE,
       ELIXIR_BAR_X + ELIXIR_BAR_W / 2, ELIXIR_BAR_Y + ELIXIR_BAR_H / 2);
  textAlign(LEFT, BASELINE);
  textSize(10);
}


// ============================================================
// drawHand() — draws the 4 card slots.
// ============================================================




// ============================================================
// drawPlacementPreview()
// ------------------------------------------------------------
// Shows a ghost circle at the mouse position when a card is
// selected: green if placement is legal, red if not.
// ============================================================
function drawPlacementPreview() {
  if (bSel === -1) return;

  var arenaRight = ARENA_PX_X + ARENA_TILES_W * TILE_SIZE;
  var arenaBottom = ARENA_PX_Y + ARENA_TILES_H * TILE_SIZE;
  if (mouseX < ARENA_PX_X || mouseX > arenaRight) return;
  if (mouseY < ARENA_PX_Y || mouseY > arenaBottom) return;

  var row = Math.floor(pxToTile(mouseY)) + 0.5;
var col = Math.floor(pxToTile(mouseX)) + 0.5;
var valid = isValidPlacement(row, col);

// Compute where the ghost circle should go in pixels (snapped)
var ghostX = tileToPx(col);
var ghostY = tileToPx(row);

var cardIdx = bDeck[bOrder[bSel]];
if (cardIdx === undefined) return;

var isSpell = isSpellCard(cardIdx);
var valid;
if (isSpell) {
  valid = isValidSpellPlacement(row, col);
} else {
  valid = isValidPlacement(row, col, getCardBounds(cardIdx));
}
noStroke();
if (isSpell) {
  var aoe = cards[cardIdx][3][0][2];
  var d = aoe * 2 * TILE_SIZE;
  if (valid) fill(100, 255, 100, 100);
  else       fill(255, 80, 80, 100);
  ellipse(ghostX, ghostY, d, d);
} else {
  if (valid) fill(100, 255, 100, 120);
  else       fill(255, 80, 80, 120);
  ellipse(ghostX, ghostY, 28, 28);
}

  // Tinted zone: highlight the valid placement area
if (!isSpell && valid) {
  fill(255, 255, 255, 20);
  rect(ARENA_PX_X,
       tileToPx(17),
       ARENA_TILES_W * TILE_SIZE,
       tileToPx(32) - tileToPx(17));
}
}
// ============================================================
// renderHandHTML() — populates the .hand-card divs based on
// the current bOrder / bDeck. Called every frame from drawUI().
// ------------------------------------------------------------
// We rebuild the cards' contents (img + cost + name + classes)
// each frame because elixir affordability changes constantly.
// The DOM elements themselves stay — we just update their innards.
// ============================================================
function renderHandHTML() {
  for (var slot = 0; slot < 4; slot++) {
    var el = document.querySelector('.hand-card[data-slot="' + slot + '"]');
    if (!el) continue;

    if (slot >= bOrder.length) {
      el.innerHTML = '';
      el.className = 'hand-card';
      continue;
    }

    var cardIdx = bDeck[bOrder[slot]];
    if (cardIdx === undefined || cardIdx === null) {
      el.innerHTML = '';
      el.className = 'hand-card';
      continue;
    }

    var cardName = cards[cardIdx][0];
    var cost = getCardCost(cardIdx);
    var affordable = elixir >= cost;
    var selected = (bSel === slot);

    // Update classes
    el.className = 'hand-card';
    if (selected)    el.classList.add('selected');
    if (!affordable) el.classList.add('unaffordable');

    // Only rebuild innerHTML if this card slot's content actually changed
    // (avoids reflow every frame for unchanged cards)
    var stamp = cardName + '|' + cost;
    if (el.dataset.stamp !== stamp) {
      el.dataset.stamp = stamp;
      var imgHTML = sprites[cardName]
        ? '<img src="' + sprites[cardName].canvas.toDataURL() + '" alt="' + cardName + '">'
        : '<div class="card-name">' + cardName + '</div>';
      el.innerHTML = imgHTML +
        '<div class="card-cost">' + cost + '</div>';
    }
  }
}