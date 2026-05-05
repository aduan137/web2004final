


// Active spells from each team
var bActiveSpells = [];
var rActiveSpells = [];



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
   else if (spellType === "persistent") {
  startRow = row;
  startCol = col;
  tgtRow = row;
  tgtCol = col;
  // Build a custom persistent spell entry
  var spell = ["graveyard", row, col, row, col,
               0, radius, 0, 0, [],
               -1, 0, "persistent",
               null, 0, 0, null, null, null,
               270,    // [19] total lifetime in frames (9 sec)
               0,      // [20] spawn timer (counts down to 0)
               10,     // [21] spawn interval in frames (0.5 sec)
               "OneSkeleton"  // [22] what to spawn
              ];
  if (team === "blue") {
    
    bActiveSpells.push(spell);
  } else {
    rActiveSpells.push(spell);
  }
  say(team + " cast graveyard at (" + row.toFixed(1) + ", " + col.toFixed(1) + ")");
  return;
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
     if (s[12] === "persistent") {
      // s[19] = lifetime, s[20] = spawn timer, s[21] = spawn interval, s[22] = spawn name
      
      s[19]--;   // tick lifetime
      s[20]--;   // tick spawn timer
      
      if (s[20] <= 0) {
        // Spawn one skeleton at random point in radius
        var angle = Math.random() * 2 * Math.PI;
        var dist = Math.random() * s[6];   // s[6] = radius
        var spawnRow = s[1] + Math.cos(angle) * dist;
        var spawnCol = s[2] + Math.sin(angle) * dist;
        spawnCard(team, s[22], spawnRow, spawnCol);
        s[20] = s[21];   // reset spawn timer
        say(team + " graveyard summoned skeleton");
      }
      
      if (s[19] <= 0) {
        // Lifetime done, remove spell
        arr.splice(i, 1);
      }
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
   if (s[0] === "barbarian_barrel") {
    spawnCard(team, "Barbarian", s[3], s[4]);
    say(team + " barbarian_barrel spawned Barbarian");
  }
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
   
      s[16] = "inbound";
      s[3] = s[17]; 
      s[4] = s[18];  
      s[13] = {};     
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



function applySpellDamage(s, enemies, team) {
  var tgtRow  = s[3];
  var tgtCol  = s[4];
  var damage  = s[5];
  var radius  = s[6];
  var penalty = s[8];
  var effects = s[9];
  if (s[0] === "lightning") {
  var radius = s[6];
  var dmg = s[5];
  var hitX = s[3];   // tgtRow
  var hitY = s[4];   // tgtCol
  var effects = s[9];
  
  // Find all enemies in radius
  var candidates = [];
  for (var j = 0; j < enemies.length; j++) {
    var e = enemies[j];
    if (e[1] <= 0) continue;
    if (e[35] === 1) continue;
  
    
    var dr = e[4] - hitX;
    var dc = e[5] - hitY;
    var d = Math.sqrt(dr * dr + dc * dc) - e[6] / 2;
    if (d <= radius) {
      candidates.push({ idx: j, troop: e, hp: e[1] });
    }
  }
  
  // Sort by HP descending — highest HP gets zapped first
  candidates.sort(function(a, b) { return b.hp - a.hp; });
  
  // Zap top 3
  var maxHits = 3;
  for (var i = 0; i < Math.min(maxHits, candidates.length); i++) {
    var c = candidates[i];
    var enemyDmg = dmg;
    if (c.idx <= 2) enemyDmg = Math.floor(enemyDmg * c.troop[20]);
    dealDamage(c.troop, enemyDmg);
    say(team + " lightning zapped " + c.troop[0] + " for " + enemyDmg);
    
    // Apply stun
    if (effects && effects.length > 0) {
      if (!c.troop[23]) c.troop[23] = [];
      for (var k = 0; k < effects.length; k++) {
        c.troop[23].push(effects[k].slice());
      }
    }
  }
  
  return;
}
if (s[0] === "goblin_barrel") {
  var hitX = s[3];   // tgtRow
  var hitY = s[4];   // tgtCol
  var triangleRadius = s[6];   // 2.5
  
  // Triangle vertices: 120° apart
  var angles = [Math.PI / 2, Math.PI / 2 + 2 * Math.PI / 3, Math.PI / 2 + 4 * Math.PI / 3];
  for (var i = 0; i < 3; i++) {
    var a = angles[i];
    var goblinRow = hitX + Math.cos(a) * triangleRadius;
    var goblinCol = hitY + Math.sin(a) * triangleRadius;
    spawnCard(team, "OneGoblin", goblinRow, goblinCol);
  }
  say(team + " goblin_barrel spawned 3 goblins");
  return;
}

  if (s[0] === "rage") {
    var radius = s[6];
    var dmg = s[5];
    var hitX = s[1];   // row of impact
    var hitY = s[2];   // col of impact
    
    // Damage enemies in radius
    for (var j = 0; j < enemies.length; j++) {
      var e = enemies[j];
      if (e[1] <= 0) continue;
      if (e[35] === 1) continue;
      var dr = e[4] - hitX;
      var dc = e[5] - hitY;
      var d = Math.sqrt(dr * dr + dc * dc) - e[6] / 2;
      if (d <= radius) {
        var enemyDmg = dmg;
        if (j <= 2) enemyDmg = Math.floor(enemyDmg * e[20]);
        dealDamage(e, enemyDmg);
        say(team + " rage hit " + e[0] + " for " + enemyDmg);
      }
    }
    
    // Apply rage buff to friendly troops in radius
    var friendlies = (team === "blue") ? bTroops : rTroops;
    for (var k = 0; k < friendlies.length; k++) {
      var f = friendlies[k];
      if (f[1] <= 0) continue;
      if (f[18] === "building") continue;   // buildings don't get raged
      var dr = f[4] - hitX;
      var dc = f[5] - hitY;
      var d = Math.sqrt(dr * dr + dc * dc) - f[6] / 2;
      if (d <= radius) {
        if (!f[23]) f[23] = [];
        f[23].push(["rage", 180]);   // 180 frames = 6 sec
        say(team + " rage buffed " + f[0]);
      }
    }
    
    return;
  }
  for (var j = 0; j < enemies.length; j++) {
    var e = enemies[j];
    
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
    if (s[11] > 0 && s[0] === "mega_knight_slam") continue;

    if (s[12] === "persistent" && s[0] === "graveyard") {
  push();
  noStroke();
  fill(80, 40, 100, 80);   // purple, semi-transparent
  ellipse(tileToPx(s[2]), tileToPx(s[1]), s[6] * 2 * TILE_SIZE, s[6] * 2 * TILE_SIZE);
  pop();
  continue;
}
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

  
    if (s[12] === "piercing") {
      noStroke();
      fill(180, 60, 60);
      var d = s[6] * 2 * TILE_SIZE;
      ellipse(x, y, d, d);
      continue;
    }

    if (s[10] > 0) {
      
      noStroke();
      var flashAlpha = map(s[10], 8, 0, 180, 0);
      fill(255, 140, 40, flashAlpha);
      ellipse(tileToPx(s[4]), tileToPx(s[3]),
              s[6] * 2 * TILE_SIZE, s[6] * 2 * TILE_SIZE);
    } else {
      
      noStroke();
      fill(255, 120, 40);
      ellipse(x, y, 10, 10);
      fill(255, 200, 80, 120);
      ellipse(x, y, 18, 18);
    }
  }
}