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

var SPRITE_ALIASES = {
  "ThreeGoblins": "Goblins",
  "TwoBarbarians": "Barbarians",
   "Skeletons4": "Skeletons",
   "TwoSpearGoblins": "Spear Goblins",
   "OneSpearGoblin":"Spear Goblins",
   "Barbarian":"Barbarians",
   "GoblinBrawler":"Goblins",
   "OneSkeleton":"Skeletons",
  

};
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
       var rawName = cards[cardIdx][0];
  t[39] = SPRITE_ALIASES[rawName] || rawName;
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
// AI ATTACKER — scripted enemy pushes for defensive training.
// ------------------------------------------------------------
// The AI has no defense and no towers. It only spawns red troops
// at the top of the arena to push down on the player.
//
// Each deck function uses two tools:
//   - elapsed: ticks since battle started (~30 ticks/sec)
//   - getJustPlayedCard(): card name the player just placed,
//     or null if they didn't play anything this tick.
//
// The deck functions are blank — fill them in yourself.
// ============================================================

// Which deck the AI plays (0–3).
var aiDeckIndex = 0;
var aiRageFrame = -1;
var aiLastSeenSpellCount = 0;
var aiStartFrame = -1;
var aiLastSeenBTroopCount = 0;
var aiElixir = 15;
var aiLastComboFrame = -9999;
var aiLastWhittleFrame = 0;
var aiGolemSupportFrame = -1;
var aiPunishFrame = -1;       // when the deferred punish fires; -1 = none pending
var aiLastPunishFrame = -9999;
var aiSupportFrame =-1; // cooldown gate for the punish trigger   // -1 means no pending support

// ============================================================
// updateWaves() — called once per frame from main.js.
// Replaces the old no-op. Dispatches to the chosen deck.
// ============================================================
function updateWaves() {
  if (gamePhase !== "battle") return;

  if (aiStartFrame === -1) {
    aiStartFrame = frameCount;
    aiLastSeenBTroopCount = bTroops.length;
    aiLastSeenSpellCount = 0;
  }

   aiElixir += 2 / 84;
  if (aiElixir > 10) aiElixir = 20;
  var elapsed = frameCount - aiStartFrame;

  switch (aiDeckIndex) {
    case 0: aiDeck0(elapsed); break;
    case 1: aiDeck1(elapsed); break;
    case 2: aiDeck2(elapsed); break;
    case 3: aiDeck3(elapsed); break;
  }
}


// ============================================================
// getJustPlayedCard()
// ------------------------------------------------------------
// Returns the API card name (e.g. "The Log", "Skeleton Army")
// the player just placed THIS TICK, or null if no new troop
// was placed.
//
// Detects new player troops by watching bTroops.length grow.
// The most recent troop's troop[39] field carries the card
// name (set at spawn time in input.js / spawnCard).
//
// Caveat: spells don't get added to bTroops, so this won't
// trigger on Fireball, Zap, etc. If you need spell reactions,
// that's a separate hook.
function getJustPlayedCard() {
  // New troop spawned this tick?
  if (bTroops.length > aiLastSeenBTroopCount) {
    var newest = bTroops[bTroops.length - 1];
    aiLastSeenBTroopCount = bTroops.length;
    return newest[39];
  }
  // New spell cast this tick?
  if (bActiveSpells.length > aiLastSeenSpellCount) {
    var newSpell = bActiveSpells[bActiveSpells.length - 1];
    aiLastSeenSpellCount = bActiveSpells.length;
    // Translate internal spell name → outer card name
    var internalName = newSpell[0];
    for (var i = 0; i < cards.length; i++) {
      if (cards[i][3][0] && cards[i][3][0][0] === internalName) {
        return cards[i][0];   // outer name like "The Log"
      }
    }
    return internalName;   // fallback if not found
  }
  return null;
}


// ============================================================
// resetWaves() — call from ui.js's startBattleWithDeck() so
// the AI restarts cleanly when a new battle begins.
// ============================================================
function resetWaves() {
  aiRageFrame = -1;
  aiStartFrame = -1;
  aiLastSeenBTroopCount = 0;
  aiElixir = 20;
   aiLastComboFrame = -9999;
   aiLastWhittleFrame = 0;
   aiPunishFrame = -1;
aiLastPunishFrame = -9999;
   aiGolemSupportFrame = -1;
   aiLastSeenSpellCount = 0;
   aiSupportFrame=-1;
}


// ============================================================
// DECK FUNCTIONS — fill these in yourself.
// ------------------------------------------------------------
// Each function receives `elapsed`, the number of ticks since
// the battle started. p5 runs at ~30fps, so elapsed=30 ≈ 1 sec.
//
// Patterns:
//   if (elapsed === 90) ...                   one-shot at 3 sec
//   if (elapsed % 120 === 0) ...              every 4 sec
//   var played = getJustPlayedCard(); if (played === "...") ...
//
// Coordinate hint: red spawns from the top.
// Arena is 18 cols × 32 rows. Common spawn coords:
//   - Top-left lane:  (0.5, 3.5)
//   - Top-right lane: (0.5, 14.5)
//   - Top-center:     (0.5, 9)
// ======
//======================================================
function aiHasOnField(cardName) {
  for (var i = 0; i < rTroops.length; i++) {
    if (rTroops[i][1] > 0 && rTroops[i][39] === cardName) return true;
  }
  return false;
}
function aiDeck0(elapsed) {
  // ---- REACTIVE SPELLS ----
  var played = getJustPlayedCard();
  if (played === "Cannon" || played === "Inferno Tower" || played === "Tesla") {
    var bldg = bTroops[bTroops.length - 1];
    castSpell(getCardByName("Fireball"), bldg[4], bldg[5], "red");
    aiElixir -= 4;
    return;
  }

  // ---- DELAYED SUPPORT: Balloon + Inferno Dragon behind the lumberjack ----
  if (aiSupportFrame !== -1 && elapsed >= aiSupportFrame) {
    aiSupportFrame = -1;
    
    spawnCard("red", "Balloon",        1.0, 13.5);
    spawnCard("red", "Inferno Dragon", 1.5, 13.5);
    spawnCard("red", "Lumberjack", 0.5, 13.5);
    aiElixir -= 5 + 4;   // 9 elixir
    return;
  }

  // ---- KILL PUSH: Lumberjack first, schedule Balloon support ----
  var pushCooldown = aiElixir < 0 ? 6000 : 2400;   // 80s / 200s when broke
  var canPush      = elapsed - aiLastComboFrame > pushCooldown;
  var playerLow    = elixir <= 4;
  var forcedPush   = elapsed - aiLastComboFrame > 1800;   // force after 60s

  if ((playerLow || forcedPush) && canPush && aiSupportFrame === -1) {
    aiLastComboFrame = elapsed;
    
    spawnCard("red", "Bowler", 0.5, 13.5);
    aiElixir -= 4;
    aiSupportFrame = elapsed + 90;   // 3 seconds later
    return;
  }

  // ---- WHITTLE DOWN ----
  var cycleCooldown = aiElixir < 0 ? 1000 : 400;
  if (elapsed > 0 && elapsed - aiLastWhittleFrame >= cycleCooldown) {
    aiLastWhittleFrame = elapsed;
    var pool = ["Lumberjack", "Goblins"];
    var cycleIdx = Math.floor(elapsed / cycleCooldown) % pool.length;
    var cardName = pool[cycleIdx];

    spawnCard("red", cardName, 0.5, 13.5);
    if (cardName === "Lumberjack")           aiElixir -= 4;
  
    else if (cardName === "Goblins")         aiElixir -= 2;
  }
}
function aiDeck1(elapsed) {
  // ---- REACTIVE SPELLS ----
  var played = getJustPlayedCard();
  if (played === "Cannon" || played === "Inferno Tower" || played === "Tesla") {
    var bldg = bTroops[bTroops.length - 1];
    castSpell(getCardByName("Fireball"), bldg[4], bldg[5], "red");
    aiElixir -= 4;
    return;
  }
 

  // ---- KILL PUSH: player drained to 3 elixir, ≥12 sec since last combo ----
var comboCooldown = aiElixir < 0 ? 4000 : 1000;
if (elixir <= 1 && elapsed - aiLastComboFrame > comboCooldown) {
    aiLastComboFrame = elapsed;
    spawnCard("red", "P.E.K.K.A",   10,  4.5);
    spawnCard("red", "Bandit",       0.5,  4.5);
    spawnCard("red", "Royal Ghost",  0.5, 13.5);
    spawnCard("red", "Magic Archer", 0.5, 13.5);
    aiElixir -= 17;
    return;
  }

  // ---- WHITTLE DOWN ----
var cycleCooldown = aiElixir < 0 ? 720 : 180;
if (elapsed > 0 && elapsed % cycleCooldown === 0) {
  var lane = (elapsed / cycleCooldown) % 2 === 0 ? 4.5 : 13.5;
  var pool = ["Battle Ram", "Bandit", "Royal Ghost"];
  var cardName = pool[(elapsed / cycleCooldown) % pool.length];
  spawnCard("red", cardName, 0.5, lane);
  if (cardName === "Battle Ram")        aiElixir -= 4;
  else if (cardName === "Bandit")       aiElixir -= 3;
  else if (cardName === "Royal Ghost")  aiElixir -= 3;
}
}





function aiDeck2(elapsed) {
  // ---- REACTIVE SPELLS ----
  var played = getJustPlayedCard();
  if (played === "Cannon" || played === "Inferno Tower" || played === "Tesla") {
    var bldg = bTroops[bTroops.length - 1];
    castSpell(getCardByName("Fireball"), bldg[4], bldg[5], "red");
    aiElixir -= 4;
    return;
  }

  // ---- DELAYED SUPPORT: 20s after golem spawn, dump the rest ----
  if (aiGolemSupportFrame !== -1 && elapsed >= aiGolemSupportFrame) {
    spawnCard("red", "Baby Dragon",     10,  3.5);
    spawnCard("red", "Electro Dragon",  10,  5.5);
    spawnCard("red", "Mini P.E.K.K.A", 4,  4.5);
 
    aiElixir -= 4 + 5 + 4 + 2;   // 15 elixir
    aiGolemSupportFrame = -1;    // reset, no pending support anymore
    return;
  }

  // ---- KILL PUSH (golem only) ----
  var golemCooldown = aiElixir < 0 ? 10000 : 4000;
  if ((elixir <= 4 ||elapsed > 1800) && elapsed - aiLastComboFrame > golemCooldown && aiGolemSupportFrame === -1) {
    aiLastComboFrame = elapsed;
    spawnCard("red", "Golem", 0.5, 4.5);
    aiElixir -= 8;
     aiRageFrame = elapsed + 800;   
    aiGolemSupportFrame = elapsed + 700;   // schedule support 20s later
    return;
  }
 
if (aiRageFrame !== -1 && elapsed >= aiRageFrame) {
   for (var i = 0; i < rTroops.length; i++) {
    if (rTroops[i][1] > 0 && rTroops[i][39] === "Golem") {
      castSpell(getCardByName("Rage"), rTroops[i][4], rTroops[i][5], "red");
      
    }
  }
  
  aiElixir -= 2;
  aiRageFrame = -1;
  return;
}
  

  // ---- WHITTLE DOWN ----
  var cycleCooldown = aiElixir < 0 ? 1000 : 300;
  if (elapsed > 0 && elapsed - aiLastWhittleFrame >= cycleCooldown) {
    aiLastWhittleFrame = elapsed;
    var pool = ["Baby Dragon", "Mini P.E.K.K.A", "Goblins", "Electro Dragon"];
    var cycleIdx = Math.floor(elapsed / cycleCooldown) % pool.length;
    var cardName = pool[cycleIdx];
    

    spawnCard("red", cardName, 0.5, 4);
    if (cardName === "Baby Dragon")          aiElixir -= 4;
    else if (cardName === "Mini P.E.K.K.A") aiElixir -= 4;
    else if (cardName === "Goblins")         aiElixir -= 2;
    else if (cardName === "Electro Dragon")  aiElixir -= 5;
  }
}

function aiDeck3(elapsed) {
  // ---- DEFERRED PUNISH: spell baited, dump swarms after 4s ----
  if (aiPunishFrame !== -1 && elapsed >= aiPunishFrame) {
    aiPunishFrame = -1;
    spawnCard("red", "Goblin Gang", 15, 13.5);
    spawnCard("red", "Skeleton Army",   15, 13.5);
     spawnCard("red", "Mega Knight",   15, 13.5);
    castSpell(getCardByName("Goblin Barrel"), 26, 14, "red");
    aiElixir -= 5;   // 4 elixir
    return;
  }

  // ---- BAIT TRIGGER: player used a small spell ----
  var played = getJustPlayedCard();
  if (aiPunishFrame === -1 && elapsed - aiLastPunishFrame > 600) {
    if (played === "The Log" || played === "Zap" ||
        played === "Arrows" || played === "Barbarian Barrel" || elixir <=4)  {
      aiPunishFrame = elapsed + 120;          // 4s delay
      aiLastPunishFrame = elapsed + 120;
      return;
    }
  }

  // ---- WAITING for punish → no other plays ----
  if (aiPunishFrame !== -1) return;

  // ---- WHITTLE: relentless cycle including barrel ----
  var cycleCooldown = aiElixir < 0 ? 200 : 100;
  if (elapsed > 0 && elapsed - aiLastWhittleFrame >= cycleCooldown) {
    aiLastWhittleFrame = elapsed;
    var pool = ["Princess", "Fire Spirit", "Goblin Barrel","Knight"];
    var cycleIdx = Math.floor(elapsed / cycleCooldown) % pool.length;
    var cardName = pool[cycleIdx];

    if (cardName === "Goblin Barrel") {
      // Barrel lands on the player's tower
      castSpell(getCardByName("Goblin Barrel"), 26, 14, "red");
      aiElixir -= 3;
    } else {
      spawnCard("red", cardName, 0.5, 13.5);
      if (cardName === "Princess")         aiElixir -= 3;
      else if (cardName === "Fire Spirit") aiElixir -= 1;
      else if (cardName === "Knight")      aiElixir -= 3;
    }
  }
}