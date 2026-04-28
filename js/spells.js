// ============================================================
// spells.js — active spells (projectile flight + landing)
// ------------------------------------------------------------
// A "spell" is a projectile thrown from the king tower that
// explodes on arrival, damaging enemies in a radius.
//
// activeSpells is a list of in-flight spells. Each frame:
//   1. Move each spell toward its target point
//   2. When it arrives, apply damage + effects, remove it
// ============================================================


// Active spells from each team
var bActiveSpells = [];
var rActiveSpells = [];


// ============================================================
// castSpell(cardIdx, row, col, team)
// ------------------------------------------------------------
// Called when the player confirms a spell placement.
// Launches a projectile from the team's king tower toward (row, col).
// ============================================================
function castSpell(cardIdx, row, col, team,facingDeg) {
  var spellData = cards[cardIdx][3][0];
  var name = spellData[0];
  var damage = spellData[1];
  var radius = spellData[2];
  var speed = spellData[3];
  var penalty = spellData[4];
  var effects = spellData[5];
  var preLand = spellData[6] || 0;
  var spellType = spellData[7];   // "rolling", "piercing", or undefined
  var isRolling = (spellType === "rolling");
  var isPiercing = (spellType === "piercing");

  var startRow, startCol, tgtRow, tgtCol;

 if (isRolling) {
    startRow = row;
    startCol = col;
    var rollDist = spellData[8] || 5;
    
    if (facingDeg !== undefined) {
      // Use the caster's facing direction
      var rad = facingDeg * Math.PI / 180;
      tgtRow = row + Math.cos(rad) * rollDist;
      tgtCol = col + Math.sin(rad) * rollDist;
    } else {
      // Default: roll toward enemy side
      var rollDir = (team === "blue") ? -1 : 1;
      tgtRow = row + rollDir * rollDist;
      tgtCol = col;
    }
  } else if (isPiercing) {
    startRow = row;
    startCol = col;
    var pierceDist = spellData[8] || 3;
    
    if (facingDeg !== undefined) {
      var rad = facingDeg * Math.PI / 180;
      tgtRow = row + Math.cos(rad) * pierceDist;
      tgtCol = col + Math.sin(rad) * pierceDist;
    } else {
      var pierceDir = (team === "blue") ? -1 : 1;
      tgtRow = row + pierceDir * pierceDist;
      tgtCol = col;
    }
  } 
  
  
  else if (speed === 0) {
    // existing fixed-delay branch
    startRow = row;
    startCol = col;
    tgtRow = row;
    tgtCol = col;
  } else {
    // existing flying-from-king-tower branch
    if (team === "blue") {
      startRow = 29;
      startCol = 9;
    } else {
      startRow = 3;
      startCol = 9;
    }
    tgtRow = row;
    tgtCol = col;
  }

  var spell = [name, startRow, startCol, tgtRow, tgtCol,
               damage, radius, speed, penalty, effects,
               -1, preLand,
               isRolling ? "rolling" : (isPiercing ? "piercing" : null),
               null,
               (spellData[9] !== undefined) ? spellData[9] : 1.5,
               (spellData[10] !== undefined) ? spellData[10] : 0.5,
               isPiercing ? "outbound" : null,   // [16] phase for piercing
               isPiercing ? row : null,           // [17] original start row
               isPiercing ? col : null            // [18] original start col
              ];

  if (team === "blue") {
    bActiveSpells.push(spell);
  } else {
    rActiveSpells.push(spell);
  }

  say(team + " cast " + name + " at (" + row.toFixed(1) + ", " + col.toFixed(1) + ")");
}


// ============================================================
// updateSpells() — called once per frame from main.js
// Processes flight, landing, and impact for all active spells.
// ============================================================
function updateSpells() {
  updateSpellArray(bActiveSpells, rTroops, "blue");
  updateSpellArray(rActiveSpells, bTroops, "red");
}

function updateSpellArray(arr, enemies, team) {
  for (var i = arr.length - 1; i >= 0; i--) {
    var s = arr[i];

    // Already-landed cleanup (impact flash)
    if (s[10] > 0) {
      s[10]--;
      if (s[10] <= 0) arr.splice(i, 1);
      continue;
    }


    if (s[12] === "rolling") {
         if (s[11] > 0) {
    s[11]--;
    continue;   // don't move or damage during delay
  }


      var dr = s[3] - s[1];
      var dc = s[4] - s[2];
      var dist = Math.sqrt(dr * dr + dc * dc);
      var stepLen = s[7] / SPDM;
if (dist <= stepLen) {
  arr.splice(i, 1);   // remove the spell entirely, no impact flash
  continue;
}

      var dirR = dr / dist;
      var dirC = dc / dist;
      s[1] += dirR * stepLen;
      s[2] += dirC * stepLen;

      var halfWidth = s[6];
      var halfDepth = 0.7;

      if (!s[13]) s[13] = {};

      for (var j = 0; j < enemies.length; j++) {
        if (s[13][j]) continue;
        var e = enemies[j];
        if (e[1] <= 0) continue;
        if (e[18] === "air" && s[0] !== "magic_arrow") continue;
        var distRow = Math.abs(e[4] - s[1]);
        var distCol = Math.abs(e[5] - s[2]);

        if (distRow < halfDepth && distCol < halfWidth) {
          var dmg = s[5];
          if (j <= 2) dmg = Math.floor(dmg * e[20]);
          dealDamage(e, dmg);

        var pushAmount = (e[7] > 4) ? s[15] : s[14];
          e[4] += dirR * pushAmount;
          e[5] += dirC * pushAmount;

          s[13][j] = true;
          say(team + " log hit " + e[0] + " for " + dmg);
        }
      }
      continue;
    }
    // ===== PIERCING SPELL (Executioner's Axe) =====
if (s[12] === "piercing") {
  var dr = s[3] - s[1];
  var dc = s[4] - s[2];
  var dist = Math.sqrt(dr * dr + dc * dc);
  var stepLen = s[7] / SPDM;

  if (dist <= stepLen) {
    // Reached end of current phase
    if (s[16] === "outbound") {
      // Switch to inbound — reverse direction, target = original cast point
      s[16] = "inbound";
      s[3] = s[17];   // original start row
      s[4] = s[18];   // original start col
      s[13] = {};     // reset hit-tracking so enemies can be hit again
      continue;
    } else {
      // Inbound phase done — clean up
      arr.splice(i, 1);
      continue;
    }
  }

  var dirR = dr / dist;
  var dirC = dc / dist;
  s[1] += dirR * stepLen;
  s[2] += dirC * stepLen;

  var halfWidth = s[6];
  var halfDepth = 0.7;

  if (!s[13]) s[13] = {};

  for (var j = 0; j < enemies.length; j++) {
    if (s[13][j]) continue;
    var e = enemies[j];
    if (e[1] <= 0) continue;
    if (e[18] === "air") continue;
    if (e[18] === "building") continue;

    var distRow = Math.abs(e[4] - s[1]);
    var distCol = Math.abs(e[5] - s[2]);

    if (distRow < halfDepth && distCol < halfWidth) {
      var dmg = s[5];
      if (j <= 2) dmg = Math.floor(dmg * e[20]);
      dealDamage(e, dmg);

      s[13][j] = true;
      say(team + " axe hit " + e[0] + " for " + dmg);
    }
  }
  continue;
}
// ===== END PIERCING =====

    // NEW: pre-land delay for fixed-delay spells (Zap)
    if (s[11] > 0) {
      s[11]--;
      if (s[11] <= 0) {
        applySpellDamage(s, enemies, team);
        s[10] = 8; // impact flash duration
      }
      continue;
    }

    // Flight phase — move toward target (projectile spells)
    var dr = s[3] - s[1];
    var dc = s[4] - s[2];
    var dist = Math.sqrt(dr * dr + dc * dc);
    var step = s[7] / SPDM;

    if (dist <= step) {
      s[1] = s[3];
      s[2] = s[4];
      applySpellDamage(s, enemies, team);
      s[10] = 8;
    } else {
      var ang = Math.atan2(dc, dr);
      s[1] += Math.cos(ang) * step;
      s[2] += Math.sin(ang) * step;
    }
  }
}


// ============================================================
// applySpellDamage — called when a spell lands.
// Damages every enemy within `radius` tiles of the impact point.
// Applies any effects (e.g. stun) from the spell's effect list.
// ============================================================
function applySpellDamage(s, enemies, team) {
  var tgtRow  = s[3];
  var tgtCol  = s[4];
  var damage  = s[5];
  var radius  = s[6];
  var penalty = s[8];
  var effects = s[9];

  for (var j = 0; j < enemies.length; j++) {
    var e = enemies[j];
    if (e[1] <= 0) continue;

    // Edge distance (center-to-center minus target radius)
    var dr = e[4] - tgtRow;
    var dc = e[5] - tgtCol;
    var d = Math.sqrt(dr * dr + dc * dc) - e[6] / 2;

    if (d <= radius) {
      var dmg = damage;
      // Reduced damage vs towers
      if (j <= 2) dmg = Math.floor(dmg * penalty);
      dealDamage(e, dmg);
      say(team + " " + s[0] + " hit " + e[0] + " for " + dmg);

      // Apply any extra effects
      if (effects && effects.length > 0) {
        for (var k = 0; k < effects.length; k++) {
          e[23].push(effects[k].slice()); // copy to avoid shared refs
        }
      }
    }
  }
}


// ============================================================
// drawSpells() — renders in-flight spells and impact flashes.
// ============================================================
function drawSpells() {
  drawSpellArray(bActiveSpells, "blue");
  drawSpellArray(rActiveSpells, "red");
}

function drawSpellArray(arr, team) {
  for (var i = 0; i < arr.length; i++) {
    
    var s = arr[i];
    var x = tileToPx(s[2]);
    var y = tileToPx(s[1]);
    if (s[11] > 0 && s[0] === "royal_delivery_impact") continue;

    // Rolling spell — Log is a rectangle, others are circles
    if (s[12] === "rolling") {
      var d = s[6] * 2 * TILE_SIZE;

      if (s[0] === "log") {
        // Log — brown rectangle, rotated to direction of travel
        var dr = s[3] - s[1];
        var dc = s[4] - s[2];
        var angle = Math.atan2(dc, dr);
        var w = d;
        var h = 0.6 * TILE_SIZE;

        push();
        translate(x, y);
        rotate(angle);
        noStroke();
        fill(120, 70, 30);
        rectMode(CENTER);
        rect(0, 0, w, h);
        rectMode(CORNER);
        pop();
      } else if (s[0] === "magic_arrow") {
        // Magic Arrow — light blue circle
        noStroke();
        fill(180, 200, 240);
        ellipse(x, y, d, d);
      } else {
        // Bowler rock and others — brown circle
        noStroke();
        fill(120, 70, 30);
        ellipse(x, y, d, d);
      }
      continue;
    }

    // Piercing spell (Executioner Axe) — red circle
    if (s[12] === "piercing") {
      noStroke();
      fill(180, 60, 60);
      var d = s[6] * 2 * TILE_SIZE;
      ellipse(x, y, d, d);
      continue;
    }

    if (s[10] > 0) {
      // Impact flash — translucent orange circle matching AoE
      noStroke();
      var flashAlpha = map(s[10], 8, 0, 180, 0);
      fill(255, 140, 40, flashAlpha);
      ellipse(tileToPx(s[4]), tileToPx(s[3]),
              s[6] * 2 * TILE_SIZE, s[6] * 2 * TILE_SIZE);
    } else {
      // In-flight projectile — small orange blob with a trail feel
      noStroke();
      fill(255, 120, 40);
      ellipse(x, y, 10, 10);
      fill(255, 200, 80, 120);
      ellipse(x, y, 18, 18);
    }
  }
}