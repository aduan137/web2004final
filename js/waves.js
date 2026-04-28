// ============================================================
// waves.js — enemy wave generation + spawn helper
// ------------------------------------------------------------
// Currently this file just hosts spawnCard(), which is the
// general-purpose "create a card on the board" function used
// both for testing (from the dev console) and for enemy waves
// once we build the wave AI.
// ============================================================


// ============================================================
// spawnCard(team, cardName, row, col)
// ------------------------------------------------------------
// Places a card on the board. Respects the card template's
// per-troop offsets (so Skeletons spawn in a triangle, etc.).
//
//   team:      "blue" (player) or "red" (enemy)
//   cardName:  string matching a card in cards.js (e.g. "Knight")
//   row, col:  tile coordinates of the spawn location
// ============================================================
function spawnCard(team, cardName, row, col) {
  var cardIdx = getCardByName(cardName);
  if (cardIdx === -1) {
    console.error("No card named:", cardName);
    return;
  }

  var templates = cards[cardIdx][3];
  var targetArray = (team === "blue") ? bTroops : rTroops;
  var facingAngle = (team === "blue") ? 180 : 0;

  for (var i = 0; i < templates.length; i++) {
    var t = deepCopyTroop(templates[i]);
     if (team === "blue") t[4] = -t[4]; 
    t[4] = row + t[4];   // template offset is an offset, not absolute
    t[5] = col + t[5];
    t[16] = facingAngle;
    targetArray.push(t);
      triggerSpawnSpell(t, team);
  }
}


// ============================================================
// updateWaves() — called once per frame from main.js.
// Currently a no-op. Real wave logic goes here later.
// ============================================================
function updateWaves() {
  // Coming soon: random/scripted enemy card spawns on a timer
}