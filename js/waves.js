

var SPRITE_ALIASES = {
  "ThreeGoblins": "Goblins",
  "TwoBarbarians": "Barbarians",
   "Skeletons4": "Skeletons",
   "TwoSpearGoblins": "Spear Goblins",
   "OneSpearGoblin":"Spear Goblins",
   "Barbarian":"Barbarians",
   "GoblinBrawler":"Goblins",
   "OneSkeleton":"Skeletons",
   "golemite":"Golem",
    "OneGoblin":"Goblins"

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


var aiDeckIndex = 0;
var aiRageFrame = -1;
var aiLastSeenSpellCount = 0;
var aiStartFrame = -1;
var aiLastSeenBTroopCount = 0;
var aiElixir = 15;
var aiLastComboFrame = -9999;
var aiLastWhittleFrame = 0;
var aiGolemSupportFrame = -1;
var aiPunishFrame = -1;      
var aiLastPunishFrame = -9999;
var aiSupportFrame =-1; 
var aiLastSeenSpellCount = 0;


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



function aiHasOnField(cardName) {
  for (var i = 0; i < rTroops.length; i++) {
    if (rTroops[i][1] > 0 && rTroops[i][39] === cardName) return true;
  }
  return false;
}
function aiDeck0(elapsed) {
 
  var played = getJustPlayedCard();
  if (played === "Cannon" || played === "Inferno Tower" || played === "Tesla") {
    var bldg = bTroops[bTroops.length - 1];
    castSpell(getCardByName("Fireball"), bldg[4], bldg[5], "red");
    aiElixir -= 4;
    return;
  }

  
  if (aiSupportFrame !== -1 && elapsed >= aiSupportFrame) {
    aiSupportFrame = -1;
    
        spawnCard("red", "Balloon",        1.0, 13.5);
    spawnCard("red", "Inferno Dragon", 1.5, 13.5);
    spawnCard("red", "Lumberjack", 0.5, 13.5);
    aiElixir -= 5 + 4;   // 9 elixir
    return;
  }

  
  var pushCooldown = aiElixir < 0 ? 2000 : 1000;  
  var canPush      = elapsed - aiLastComboFrame > pushCooldown;
  var playerLow    = elixir <= 4;
  var forcedPush   = elapsed - aiLastComboFrame > 1800;   

  if ((playerLow || forcedPush) && canPush && aiSupportFrame === -1) {
    aiLastComboFrame = elapsed;
    
    spawnCard("red", "Bowler", 0.5, 13.5);
    aiElixir -= 4;
    aiSupportFrame = elapsed + 90; 
    return;
  }

  
  var cycleCooldown = aiElixir < 0 ? 1000 : 400;
  if (elapsed > 0 && elapsed - aiLastWhittleFrame >= cycleCooldown) {
    aiLastWhittleFrame = elapsed;
    var pool = ["Lumberjack", "Goblins","Bowler"];
    var cycleIdx = Math.floor(elapsed / cycleCooldown) % pool.length;
    var cardName = pool[cycleIdx];

    spawnCard("red", cardName, 0.5, 13.5);
    if (cardName === "Lumberjack")           aiElixir -= 4;
  else if (cardName === "Bowler")         aiElixir -= 2;
    else if (cardName === "Goblins")         aiElixir -= 2;
  }
}
function aiDeck1(elapsed) {
 
  var played = getJustPlayedCard();
  if (played === "Cannon" || played === "Inferno Tower" || played === "Tesla") {
    var bldg = bTroops[bTroops.length - 1];
    castSpell(getCardByName("Fireball"), bldg[4], bldg[5], "red");
    aiElixir -= 4;
    return;
  }
 

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
  
  var played = getJustPlayedCard();
  if (played === "Cannon" || played === "Inferno Tower" || played === "Tesla") {
    var bldg = bTroops[bTroops.length - 1];
    castSpell(getCardByName("Fireball"), bldg[4], bldg[5], "red");
    aiElixir -= 4;
    return;
  }

  if (aiGolemSupportFrame !== -1 && elapsed >= aiGolemSupportFrame) {
    spawnCard("red", "Baby Dragon",     10,  3.5);
    spawnCard("red", "Electro Dragon",  10,  5.5);
    spawnCard("red", "Mini P.E.K.K.A", 4,  4.5);
 
    aiElixir -= 4 + 5 + 4 + 2;   
    aiGolemSupportFrame = -1;    
    return;
  }

 
  var golemCooldown = aiElixir < 0 ? 10000 : 4000;
  if ((elixir <= 4 ||elapsed > 1800) && elapsed - aiLastComboFrame > golemCooldown && aiGolemSupportFrame === -1) {
    aiLastComboFrame = elapsed;
    spawnCard("red", "Golem", 0.5, 4.5);
    aiElixir -= 8;
     aiRageFrame = elapsed + 800;   
    aiGolemSupportFrame = elapsed + 700;  
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
 
  if (aiPunishFrame !== -1 && elapsed >= aiPunishFrame) {
    aiPunishFrame = -1;
    spawnCard("red", "Goblin Gang", 15, 13.5);
    spawnCard("red", "Skeleton Army",   15, 13.5);
     spawnCard("red", "Mega Knight",   15, 13.5);
    castSpell(getCardByName("Goblin Barrel"), 26, 14, "red");
    aiElixir -= 5;  
    return;
  }

  var played = getJustPlayedCard();
  if (aiPunishFrame === -1 && elapsed - aiLastPunishFrame > 600) {
    if (played === "The Log" || played === "Zap" ||
        played === "Arrows" || played === "Barbarian Barrel" || elixir <=4)  {
      aiPunishFrame = elapsed + 120;         
      aiLastPunishFrame = elapsed + 120;
      return;
    }
  }


  if (aiPunishFrame !== -1) return;


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