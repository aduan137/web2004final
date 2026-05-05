


var SPDM = 1800;
var PROJECTILE_SPEED = 810;


function updateTroops() {
  for (var i = 0; i < bTroops.length; i++) {
    var t = bTroops[i];
    updateSingleTroop(t, rTroops, "blue");
    // Death-handler fires once per troop, ever
    if (t[1] <= 0 && t[27] !== true) {
      t[27] = true;
      handleDeath(t, "blue");
    }
  }
  for (var i = 0; i < rTroops.length; i++) {
    var t = rTroops[i];
    updateSingleTroop(t, bTroops, "red");
    if (t[1] <= 0 && t[27] !== true) {
      t[27] = true;
      handleDeath(t, "red");
    }
  }
}

function resolveOverlaps() {
  // Combine all troops into one list for pairwise check
  // (we want troops to push other troops on either team)
  var all = bTroops.concat(rTroops);

  for (var i = 0; i < all.length; i++) {
    for (var j = i + 1; j < all.length; j++) {
      var a = all[i];
      var b = all[j];
      
   
      if (a[1] <= 0 || b[1] <= 0) continue;
    
      if (a[22] > 0 || b[22] > 0) continue;
   
      if (a[18] === "building" || b[18] === "building") continue;
      
      if (a[18] === "air" && b[18] !== "air") continue;
      if (b[18] === "air" && a[18] !== "air") continue;
    
      if (a[18] === "bomb" || b[18] === "bomb") continue;

      var dr = b[4] - a[4];
      var dc = b[5] - a[5];
      var dist = Math.sqrt(dr * dr + dc * dc);
      var combinedRadii = a[6] / 2 + b[6] / 2;

      if (dist < combinedRadii && dist > 0.001) {
      
        var overlap = combinedRadii - dist;
        var nx = dr / dist;   
        var ny = dc / dist;
        var push = overlap / 2;

        
        a[4] -= nx * push;
        a[5] -= ny * push;
        b[4] += nx * push;
        b[5] += ny * push;
      }
    }
  }
}


function dealDamage(target, amount) {
  if (amount <= 0) return 0;
  

  if (target[31] > 0) {
    target[31] -= amount;
    if (target[31] < 0) target[31] = 0;

    return amount;
  }
  
  // No shield — damage goes to HP
  target[1] -= amount;
  return amount;
}

function updateSingleTroop(data, enemies, team) {
  // Dead — skip
  if (data[1] <= 0) return;
    var stunned = false;
      var slowed = false;
      var raged = false;
      if (data[0] === "royal_ghost") {
  
  if (data[12] - data[11] < 30 && data[11] > 0) {
    data[35] = 0;   // visible (just attacked)
  } else {
    data[35] = 1;   // hidden
  }
}
  if (data[23]) {
    for (var e = data[23].length - 1; e >= 0; e--) {
      var eff = data[23][e];
      eff[1]--;  // decrement timer
      if (eff[1] <= 0) {
        if (eff[0] === "conditional_summon") {

  

  var hasTarget = false;
  for (var k = 0; k < enemies.length; k++) {
    var ee = enemies[k];
    if (ee[1] <= 0) continue;
    if (ee[22] > 0) continue;
    if (ee[35] === 1) continue;   // hidden, can't see
    
    var dr = ee[4] - data[4];
    var dc = ee[5] - data[5];
    var d = Math.sqrt(dr * dr + dc * dc) - ee[6] / 2;
    if (d <= data[10]) {   // within sight range (data[10])
      hasTarget = true;
      break;
    }
  }
  
  if (hasTarget) {
    var summonName = eff[3];
    spawnCard(team, summonName, data[4]-1, data[5]+0.1);
    say(team + " " + data[0] + " spawned " + summonName);
  }
  eff[1] = eff[2];  
  continue;          
}
           if (eff[0] === "summon") {
      var summonName = eff[3];
      spawnCard(team, summonName, data[4], data[5]);
      eff[1] = eff[2];   // reset timer to interval
      say(team + " " + data[0] + " summoned " + summonName);
      continue;        
    }
       if (eff[0] === "leap") {
  var leapTgtIdx = eff[2];
  if (leapTgtIdx >= 0 && leapTgtIdx < enemies.length) {
    var leapTgt = enemies[leapTgtIdx];
    if (leapTgt[1] > 0) {
    
      data[36] = data[4];   // store old row
      data[37] = data[5];   // store old col
      data[38] = (data[0] === "bandit") ? 5 : 8;   // duration depends on troop
     
      
      // Now teleport (existing code)
      var inFrontDir = (team === "blue") ? 1 : -1;
      data[4] = leapTgt[4] + inFrontDir * (leapTgt[6] / 2 + data[6] / 2 + 0.2);
      data[5] = leapTgt[5];

      // Face the target
      var dx = leapTgt[4] - data[4];
      var dy = leapTgt[5] - data[5];
      data[16] = Math.atan2(dy, dx) * 180 / Math.PI;

      if (data[0] === "mega_knight") {
        var slamIdx = getCardByName("MegaKnightLeapSlam");
        if (slamIdx !== -1) {
          castSpell(slamIdx, data[4], data[5], team);
        }
        say(team + " mega_knight LEAPED");
      } else if (data[0] === "bandit") {
        var dmg = 280;
        var idxInArr = enemies.indexOf(leapTgt);
        if (idxInArr <= 2) dmg = Math.floor(dmg * leapTgt[20]);
        dealDamage(leapTgt, dmg);
        say(team + " bandit LEAPED onto " + leapTgt[0] + " for " + dmg);
      }
    }
  }
  data[23].splice(e, 1);
  continue;
}
if (eff[0] === "chain_dash") {
  var hitsLeft = eff[2];
  var hitIdxs = eff[3];  
  
  if (hitsLeft <= 0) {
    data[23].splice(e, 1);
    continue;
  }
  
  var enemiesArrCD = (team === "blue") ? rTroops : bTroops;
  var nextTgt = null;
  var nextIdx = -1;
  var nextDist = 4.0;
  
  for (var k = 0; k < enemiesArrCD.length; k++) {
    if (hitIdxs[k]) continue; 
    var ee = enemiesArrCD[k];
    if (ee[1] <= 0) continue;
    if (ee[22] > 0) continue;
    if (ee[18] === "spell" || ee[18] === "bomb") continue;
    
    var dr = ee[4] - data[4];
    var dc = ee[5] - data[5];
    var d = Math.sqrt(dr * dr + dc * dc) - ee[6] / 2 - data[6] / 2;
    if (d < nextDist) {
      nextDist = d;
      nextTgt = ee;
      nextIdx = k;
    }
  }
  
  if (nextTgt) {
    data[4] = nextTgt[4] + 0.01;
    data[5] = nextTgt[5];
    
    var chainDmg = Math.floor(data[3] * 1.3);
    if (nextIdx <= 2) chainDmg = Math.floor(chainDmg * nextTgt[20]);
    dealDamage(nextTgt, chainDmg);
    say(team + " royal_knight CHAIN " + nextTgt[0] + " for " + chainDmg);
    
    eff[1] = 3;
    eff[2]--;
    hitIdxs[nextIdx] = true;   
  } else {
    data[23].splice(e, 1);
  }
  continue;
}
if (eff[0] === "go_stealth") {
  data[35] = 1;
  say(team + " " + data[0] + " went stealth");
 
  data[23].push(["go_visible", 240]);   
  data[23].splice(e, 1);
  continue;
}
if (eff[0] === "go_visible") {
  data[35] = 0;
  say(team + " " + data[0] + " visible again");
  data[23].splice(e, 1);
  continue;
}
if (eff[0] === "delayed_spell") {
  // Format: ["delayed_spell", framesRemaining, "SpellCardName"]
  var spellName = eff[2];
  var spellIdx = getCardByName(spellName);
  if (spellIdx !== -1) {
    castSpell(spellIdx, data[4], data[5], team);
  }
  say(team + " " + data[0] + " cast " + spellName);
  data[23].splice(e, 1);
  continue;
}

  if (eff[0] === "kamikaze") {
        var spellName = eff[3];
        var spellIdx = getCardByName(spellName);
        if (spellIdx !== -1) {
          // Cast at this troop's position
          // Use the troop's team
          castSpell(spellIdx, data[4], data[5], team);
        }
        data[1] = 0;  // kill self
      }
 data[23].splice(e, 1);   // remove expired effect
        continue;
      }
      // Flag active effects
      if (eff[0] === "stun") stunned = true;
       if (eff[0] === "slow") slowed = true;
       if (eff[0] === "rage")  raged = true;
      // Future: if (eff[0] === "slow") ...
    }
  }


  if (stunned) return;


  if (data[22] > 0) {
    data[22]--;
    return;
  }

  if (data[11] > 0) data[11]--;

  if (data[0] === "ram_rider") {
    if (data[33] > 0) data[33]--;
    if (data[33] <= 0) {
      var bestIdx = -1;
      var bestDist = 5.0;
      for (var k = 0; k < enemies.length; k++) {
        var ee = enemies[k];
        if (ee[1] <= 0) continue;
        if (ee[22] > 0) continue;
        if (ee[18] === "building") continue;
        var dd = edgeDistance(data, ee);
        if (dd < bestDist) {
          bestDist = dd;
          bestIdx = k;
        }
      }
      if (bestIdx !== -1) {
        var projArr = (team === "blue") ? bProj : rProj;
        projArr.push(["snare", data[4], data[5], bestIdx, 112, 600, 0, [["slow", 60]]]);
        data[33] = 30;
        say(team + " ram_rider snared " + enemies[bestIdx][0]);
      }
    }
  }

  if (data[19] === "none") return;

 
  var lockValid = false;
  if (data[15] === true && data[14] >= 0 && data[14] < enemies.length) {
    var tgt = enemies[data[14]];
    if (tgt[1] > 0 && tgt[22] <= 0) {
      var d = edgeDistance(data, tgt);
      if (d <= data[10]) lockValid = true;
    }
  }
  if (!lockValid) {
    data[15] = false;
  }
  
  if (!data[15] && (data[0] === "mighty_miner" || data[0] === "inferno_dragon" || data[0]==="inferno_tower")) {
    data[33] = 0;
    data[34] = -1;
  }

  if (!data[15]) {
    data[14] = findTargetInSight(data, enemies);
  }
 
if (data[32] !== undefined) {
  if (data[0] === "royal_knight") {
    // Royal Knight only charges when NOT attacking (target out of range)
    var rkLocked = data[15] && data[14] >= 0 && data[14] < enemies.length;
    if (rkLocked) {
      var lockedTgt = enemies[data[14]];
      var rkDist = edgeDistance(data, lockedTgt);
      if (rkDist <= data[9]) {
        // Within attack range = actively attacking, don't charge
        data[32] = Math.max(0, data[32] - 2);   // also slowly decay
      } else {
        // Locked but not in range, charging
        if (data[32] < 60) data[32]++;
      }
    } else {
      // No target locked, charging
      if (data[32] < 60) data[32]++;
    }
  } else {
    // Other troops: charge normally
    if (data[32] < 60) data[32]++;
  }
} 
var charging = (data[32] >= 60); 
var movementCharging = (data[0] === "prince" || data[0] === "royal_knight" || data[0] ==="dark_prince") && charging;
 

  if (data[14] !== -1 && data[14] < enemies.length) {
    var tgt = enemies[data[14]];
    var dist = edgeDistance(data, tgt);

    if (dist <= data[9]) {
      
      data[15] = true;
      faceTarget(data, tgt);
      attemptAttack(data, tgt, data[14], team,slowed);
    } else {
         
      moveToward(data, tgt,slowed,movementCharging,raged);
    }
  } else {
    
    walkDefaultPath(data, enemies,slowed,movementCharging,raged);
  }
    if (team === "blue") {
    checkTowerPull(data);
  }
}



function findTargetInSight(data, enemies) {
  var bestIdx = -1;
  var bestDist = data[10];
  var tt = data[19];       
 var canSeeAcrossRiver = (
  data[0] === "prince" ||
  data[0] === "dark_prince" ||      
  data[0] === "hog_rider" ||
  data[0] === "royal_hog" ||
  
  data[0] === "princess"
);
 
  for (var j = 0; j < enemies.length; j++) {
    var e = enemies[j];
    if (e[1] <= 0) continue;            // dead
        if (e[0] === "royal_recruit" && e[22] > 0) continue;      // still deploying (untargetable)
    if (e[18] === "spell") continue;
    if ( e[35] === 1) continue; 
    
if (e[18] === "bomb") continue;  
if (data[18] === "ground" && !canSeeAcrossRiver && (data[9] < 2 || data[0] === "bandit" || data[0] === "mega_knight")) {
  var amBlue = (enemies === rTroops);
  if (amBlue && data[4] >= 17 && e[4] < 17) continue;       
  if (!amBlue && data[4] <= 15 && e[4] > 15) continue;      
}
   var isGrounded = false;
if (e[23]) {
  for (var x = 0; x < e[23].length; x++) {
    if (e[23][x][0] === "grounded" && e[23][x][1] > 0) {
      isGrounded = true;
      break;
    }
  }
}
if (tt === "ground" && e[18] === "air" && !isGrounded) continue;
    if (tt === "buildings" && e[18] !== "building") continue;
    if (tt === "troops"    && e[18] === "building") continue;
    
    if (tt === "air"       && e[18] !== "air" && e[18] !== "building") continue;
    // "all" matches everything

    var d = edgeDistance(data, e);
    if (data[0] === "mortar" && d < 4.0) continue;
    if (d < bestDist) {
      bestDist = d;
      bestIdx = j;
    }
  }
  return bestIdx;
}



function edgeDistance(a, b) {
  var dr = b[4] - a[4];
  var dc = b[5] - a[5];
  return Math.sqrt(dr * dr + dc * dc) - a[6] / 2 - b[6] / 2;
}



function moveToward(data, tgt,slowed,charging,raged) {
   
   if (slowed === undefined) slowed = false;
   if (data[8] === 0) return; // buildings don't move

  var xdif = tgt[4] - data[4]; // row delta
  var ydif = tgt[5] - data[5]; // col delta
  var cdis = Math.sqrt(xdif * xdif + ydif * ydif);
  if (cdis < 0.001) return;

  var ang = Math.atan2(ydif, xdif); // radians
  var step = data[8] / SPDM;
   if (slowed) step *= 0.25; 
     if (charging) step *= 2;  
     if (raged)   step *= 1.35; 

  data[4] += Math.cos(ang) * step;
  data[5] += Math.sin(ang) * step;

  data[16] = ang * 180 / Math.PI; // facing angle for rendering
}



function faceTarget(data, tgt) {
  var xdif = tgt[4] - data[4];
  var ydif = tgt[5] - data[5];
  if (xdif === 0 && ydif === 0) return;
  data[16] = Math.atan2(ydif, xdif) * 180 / Math.PI;
}



function walkDefaultPath(data, enemies,slowed,charging,raged) {
  if (data[8] === 0) return;

  var marchingDown = (enemies === bTroops);
  var step = data[8] / SPDM;
  if (slowed) step *= 0.65;
   if (charging) step *= 2;
   if (raged)   step *= 1.35;  
  var onLeft = data[5] < 9;
  
  

  if (marchingDown) {
    
    if (data[4] < 14.8) {
      // Still north of the river — walk diagonally to the bridge entry point
      var bridgeRow = 15;
      var bridgeCol = onLeft ? 3 : 14;
      walkTowardPoint(data, bridgeRow, bridgeCol, step);
    } else {
      // Past the bridge — march straight south
      data[4] += step;
      data[16] = 0;
    }
  } else {
  
    if (data[4] > 17.2) {
    
      var bridgeRow = 17;
      var bridgeCol = onLeft ? 3 : 14;
      walkTowardPoint(data, bridgeRow, bridgeCol, step);
    } else {
      // Past the bridge — march straight north
      data[4] -= step;
      data[16] = 180;
    }
  }
}


function walkTowardPoint(data, targetRow, targetCol, step) {
  var dr = targetRow - data[4];
  var dc = targetCol - data[5];
  var dist = Math.sqrt(dr * dr + dc * dc);
  if (dist < 0.01) return;

  // Angle of travel
  var ang = Math.atan2(dc, dr);

 
  data[4] += Math.cos(ang) * step;
  data[5] += Math.sin(ang) * step;

  // Facing angle for rendering
  data[16] = ang * 180 / Math.PI;
}


function attemptAttack(data, tgt, tgtIdx, team,slowed) {
  if (data[11] > 0) return;  // still reloading
  data[11] = data[12];  
       var hasRage = false;
  if (data[23]) {
    for (var r = 0; r < data[23].length; r++) {
      if (data[23][r][0] === "rage") { 
        hasRage = true; 
        break; }
    }
  }
  if (hasRage) data[11] = Math.ceil(data[11] * 0.73);

  var dmg = data[3];
    if (data[32] >= 60 && data[0] !== "royal_knight") {
    dmg = Math.floor(dmg * 2);
    data[32] = 0;   
    say(team + " " + data[0] + " CHARGE HIT");
  } else if (data[32] !== undefined && data[0] !== "royal_knight") {
    data[32] = 0;  
  }

  
  if (tgtIdx <= 2) {
    dmg = Math.floor(dmg * data[20]);
  }

 if (data[0] === "mighty_miner" || data[0] === "inferno_dragon"||data[0] === "inferno_tower") {
  if (data[34] !== tgtIdx) {
    data[33] = 0;
    data[34] = tgtIdx;
  }
  
  data[33] = Math.min(data[33] + 1, 30); 
  
 
  var progress = data[33] / 30;
  var rampMult = Math.exp(2 * progress);
  dmg = Math.floor(dmg * rampMult);
}
  // ===== END RAMP-UP =====
  if (data[0] === "musketeer3") {
  var closeRange = 1.2;  // same as Valkyrie's melee range
  var d = edgeDistance(data, tgt);
  if (d <= closeRange) {
    dmg = Math.floor(dmg * 1.5);
  }
}
  //++++++++++++++++++++++++++++++++++++++++these cases are special cases for each troop++++++++++++++++++++++++++++++++++++++++++++++


if (data[0] === "skeleton_king") {
  if (slowed) data[11] = Math.ceil(data[11] * 1.35);

  var enemiesArr = (team === "blue") ? rTroops : bTroops;
  var coneRadius = 2.5;
  var coneHalfAngle = 57.5 * Math.PI / 180;   // 115° total
  var facingRad = data[16] * Math.PI / 180;

  for (var j = 0; j < enemiesArr.length; j++) {
    var e = enemiesArr[j];
    if (e[1] <= 0) continue;
    if (e[22] > 0) continue;

    var dr = e[4] - data[4];
    var dc = e[5] - data[5];
    var centerDist = Math.sqrt(dr * dr + dc * dc);
    var edgeDist = centerDist - e[6] / 2;
    if (edgeDist > coneRadius) continue;

    if (centerDist < 0.5) {
      var enemyDmg = data[3];
      if (j <= 2) enemyDmg = Math.floor(enemyDmg * e[20]);
      dealDamage(e, enemyDmg);
      say(team + " skeleton_king smashed " + e[0] + " for " + enemyDmg);
      continue;
    }

    var angleToEnemy = Math.atan2(dc, dr);
    var angleDiff = angleToEnemy - facingRad;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    if (Math.abs(angleDiff) > coneHalfAngle) continue;

    var enemyDmg = data[3];
    if (j <= 2) enemyDmg = Math.floor(enemyDmg * e[20]);
    dealDamage(e, enemyDmg);
    say(team + " skeleton_king smashed " + e[0] + " for " + enemyDmg);
  }
  return;
}
// ===== END Skeleton King =====

if (data[0] === "fisherman") {
  var dist = edgeDistance(data, tgt);
  
  if (dist > 1.6) {
    // ===== Set animation fields on TARGET =====
    tgt[36] = tgt[4];   
    tgt[37] = tgt[5];   
    tgt[38] = 30;        
    // ===== END =====
    
    // Hook
    var inFrontDir = (team === "blue") ? -1 : 1;
    tgt[4] = data[4] + inFrontDir * (data[6]/2 + tgt[6]/2 + 0.5);
    tgt[5] = data[5];
    
    if (!tgt[23]) tgt[23] = [];
    tgt[23].push(["stun", 15]);
    
    say(team + " fisherman HOOKED " + tgt[0]);
  } else {
    dealDamage(tgt, dmg);
    say(team + " fisherman hit " + tgt[0] + " for " + dmg);
  }
  return;
}

if (data[0] === "bandit") {
  var distToTarget = edgeDistance(data, tgt);

  if (distToTarget >= 1.5 && distToTarget <= 5.0) {
    if (!data[23]) data[23] = [];
    data[23].push(["leap", 12, tgtIdx]);   // 0.4 sec windup
    say(team + " bandit winding up to leap onto " + tgt[0]);
    return;
  }
  // Otherwise fall through to normal single-target melee below
}
// ===== END Bandit =====
if (data[0] === "firecracker") {
  var dr = tgt[4] - data[4];
  var dc = tgt[5] - data[5];
  var dist = Math.sqrt(dr * dr + dc * dc);
  var dirR = dr / dist;
  var dirC = dc / dist;
  
  var proj = ["firecracker_proj", data[4], data[5],
              tgtIdx, dmg, PROJECTILE_SPEED, 0, [],
              dirR, dirC];   // direction at indices 8 and 9
  
  if (team === "blue") bProj.push(proj);
  else                 rProj.push(proj);
  
  say(team + " firecracker fired at " + tgt[0]);
  return;
}
// ===== END Firecracker =====
if (data[0] === "mega_knight") {

  if (slowed) data[11] = Math.ceil(data[11] * 1.35);

  var distToTarget = edgeDistance(data, tgt);

if (distToTarget >= 3.5 && distToTarget <= 5.0) {
  if (!data[23]) data[23] = [];
  data[23].push(["leap", 30, tgtIdx]);
  say(team + " mega_knight winding up to leap onto " + tgt[0]);
  return;
}
  // CONE MELEE: forward 85° cone, 2.5 tile radius
  // CONE MELEE: forward 85° cone, 2.5 tile radius
var enemiesArr = (team === "blue") ? rTroops : bTroops;
var coneRadius = 2.5;
var coneHalfAngle = 55.5 * Math.PI / 180;
var facingRad = data[16] * Math.PI / 180;

for (var j = 0; j < enemiesArr.length; j++) {
  var e = enemiesArr[j];
  if (e[1] <= 0) continue;
  if (e[22] > 0) continue;

  var dr = e[4] - data[4];
  var dc = e[5] - data[5];
  var centerDist = Math.sqrt(dr * dr + dc * dc);
  var edgeDist = centerDist - e[6] / 2;
  if (edgeDist > coneRadius) continue;

  // Overlap: if we're essentially on top of the enemy, always hit
  if (centerDist < 0.5) {
    var enemyDmg = data[3];
    if (j <= 2) enemyDmg = Math.floor(enemyDmg * e[20]);
    dealDamage(e, enemyDmg);
    say(team + " mega_knight smashed " + e[0] + " for " + enemyDmg);
    continue;
  }

  // Normal angle check
  var angleToEnemy = Math.atan2(dc, dr);
  var angleDiff = angleToEnemy - facingRad;
  while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
  if (Math.abs(angleDiff) > coneHalfAngle) continue;

  var enemyDmg = data[3];
  if (j <= 2) enemyDmg = Math.floor(enemyDmg * e[20]);
  dealDamage(e, enemyDmg);
  say(team + " mega_knight smashed " + e[0] + " for " + enemyDmg);
}
return;
}


if (data[0] === "magic_archer") {
  var arrowIdx = getCardByName("MagicArrow");
  if (arrowIdx !== -1) {
    castSpell(arrowIdx, data[4], data[5], team, data[16]);
  }
  return;
}

if (data[0] === "executioner") {
  var axeIdx = getCardByName("ExecutionerAxe");
  if (axeIdx !== -1) {
    castSpell(axeIdx, data[4], data[5], team, data[16]);
    //                                         ↑ pass facing
  }
  return;
}
if (data[0] === "bowler") {
  var rockIdx = getCardByName("BowlerRock");
  if (rockIdx !== -1) {
    castSpell(rockIdx, data[4], data[5], team, data[16]);
    //                                          ↑ pass facing
  }
  return;
}
// ===== END Bowler =====
if (data[0] === "electro_spirit") {
  data[4] = tgt[4];
  data[5] = tgt[5];

  var enemies = (team === "blue") ? rTroops : bTroops;
  var chainRadius = 3.0;
  var maxTargets = 8;
  var chainDamage = 90;
  var chainStun = 15;   // 0.5 sec at 30fps

  // First target is the one we just leaped to
  var current = tgt;
  var hitIndices = {};
  var hitCount = 0;

  while (hitCount < maxTargets && current) {
    // Find current's index in enemies array
    var currentIdx = enemies.indexOf(current);
    if (currentIdx === -1) break;
    if (hitIndices[currentIdx]) break;   // already hit (safety)

    // Mark as hit, apply damage and stun
    hitIndices[currentIdx] = true;
    hitCount++;

    var dmg = chainDamage;
    if (currentIdx <= 2) dmg = Math.floor(dmg * current[20]);   // crown penalty
    dealDamage(current, dmg);
    if (!current[23]) current[23] = [];
    current[23].push(["stun", chainStun]);
    say(team + " electro_spirit zapped " + current[0] + " for " + dmg);

    // Find next target: closest enemy within chainRadius that hasn't been hit
    var nextTarget = null;
    var nextDist = chainRadius;
    for (var j = 0; j < enemies.length; j++) {
      if (hitIndices[j]) continue;
      var e = enemies[j];
      if (e[1] <= 0) continue;
      if (e[22] > 0) continue;
      if (e[18] === "spell" || e[18] === "bomb") continue;

      var dr = e[4] - current[4];
      var dc = e[5] - current[5];
      var d = Math.sqrt(dr * dr + dc * dc) - e[6] / 2 - current[6] / 2;
      if (d < nextDist) {
        nextDist = d;
        nextTarget = e;
      }
    }
    current = nextTarget;
  }

  data[1] = 0;  
  say(team + " electro_spirit chained to " + hitCount + " targets");
  return;
}

if (data[0] === "fire_spirit") {
  data[4] = tgt[4];
  data[5] = tgt[5];
  var explIdx = getCardByName("FireSpiritExplosion");
  if (explIdx !== -1) {
    castSpell(explIdx, tgt[4], tgt[5], team);
  }
  data[1] = 0;
  say(team + " " + data[0] + " burned onto " + tgt[0]);
  return;
}  
  
  if (data[0] === "ice_spirit") {
    var freezeIdx = getCardByName("IceSpiritFreeze");
    if (freezeIdx !== -1) {
      castSpell(freezeIdx, tgt[4], tgt[5], team);
    }
    data[1] = 0;   // kamikaze death
    say(team + " " + data[0] + " jumped onto " + tgt[0]);
    return;
  }
  
  if (data[0] === "valkyrie") {
    var enemies = (team === "blue") ? rTroops : bTroops;
    var aoe = data[17];
    for (var j = 0; j < enemies.length; j++) {
      var e = enemies[j];
      if (e[1] <= 0) continue;
      if (e[22] > 0) continue;

      var d = edgeDistance(data, e);
      if (d <= aoe) {
        var enemyDmg = data[3];
        if (j <= 2) enemyDmg = Math.floor(data[3] * e[20]);
       dealDamage(e, enemyDmg);
        say(team + " " + data[0] + " swiped " + e[0] + " for " + enemyDmg);
      }
    }
    return;
  }
 
  if (data[0] === "dark_prince") {
    var enemies = (team === "blue") ? rTroops : bTroops;
    var coneRadius = 1.5;
    var coneHalfAngle = 45.5 * Math.PI / 180;  
    var facingRad = data[16] * Math.PI / 180;

    for (var j = 0; j < enemies.length; j++) {
      var e = enemies[j];
      if (e[1] <= 0) continue;
      if (e[22] > 0) continue;

      
      var dr = e[4] - data[4];
      var dc = e[5] - data[5];
      var centerDist = Math.sqrt(dr * dr + dc * dc);
      var edgeDist = centerDist - e[6] / 2;
      if (edgeDist > coneRadius) continue;

    
      var angleToEnemy = Math.atan2(dc, dr);
      var angleDiff = angleToEnemy - facingRad;
  
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      if (Math.abs(angleDiff) > coneHalfAngle) continue;

      var enemyDmg = data[3];
      if (j <= 2) enemyDmg = Math.floor(enemyDmg * e[20]);
      dealDamage(e, enemyDmg);
      say(team + " " + data[0] + " coned " + e[0] + " for " + enemyDmg);
      
   
      if (data[24] && data[24].length > 0) {
        for (var k = 0; k < data[24].length; k++) {
          e[23].push(data[24][k].slice());
        }
      }
    }
    return;  
  }

  if (data[0] === "hunter") {
    var enemies = (team === "blue") ? rTroops : bTroops;
    var coneRadius = 5.0;
    var coneHalfAngle = 37.5 * Math.PI / 180;  // 75° total
    var facingRad = data[16] * Math.PI / 180;

    var maxDamage = data[3];    
    var minDamage = 135;        

    for (var j = 0; j < enemies.length; j++) {
      var e = enemies[j];
      if (e[1] <= 0) continue;
      if (e[22] > 0) continue;

      var dr = e[4] - data[4];
      var dc = e[5] - data[5];
      var centerDist = Math.sqrt(dr * dr + dc * dc);
      var edgeDist = centerDist - e[6] / 2;
      if (edgeDist > coneRadius) continue;
      if (edgeDist < 0) edgeDist = 0;   
      var angleToEnemy = Math.atan2(dc, dr);
      var angleDiff = angleToEnemy - facingRad;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      if (Math.abs(angleDiff) > coneHalfAngle) continue;

      
var falloffK = 0.3;
var enemyDmg = Math.floor(maxDamage * Math.exp(-falloffK * edgeDist));
      if (j <= 2) enemyDmg = Math.floor(enemyDmg * e[20]);
      dealDamage(e, enemyDmg);
      say(team + " " + data[0] + " blasted " + e[0] + " for " + enemyDmg);
    }
    return;
  }





































  var isMelee = (data[9] < 2 && data[17] === 0);
  if (isMelee) {
  if (data[0] === "royal_knight" && data[32] >= 60) {
  var firstDmg = Math.floor(data[3] * 1.3);
  if (tgtIdx <= 2) firstDmg = Math.floor(firstDmg * tgt[20]);
  dealDamage(tgt, firstDmg);
  say(team + " royal_knight CHAIN HIT " + tgt[0] + " for " + firstDmg);
  
  if (!data[23]) data[23] = [];

  var hitIdxs = {};
  hitIdxs[tgtIdx] = true;
  data[23].push(["chain_dash", 3, 7, hitIdxs]);
  
  data[32] = 0;
  return;
}
    dealDamage(tgt, dmg);
    say(team + " " + data[0] + " hit " + tgt[0] + " for " + dmg);
  

  }  else {

  var onHit = data[24] || [];   
  var proj = [data[0] + "_proj", data[4], data[5],
              tgtIdx, dmg, PROJECTILE_SPEED, data[17],
              onHit];   
  if (team === "blue") bProj.push(proj);
  else                 rProj.push(proj);
  say(team + " " + data[0] + " fired at " + tgt[0]);
}


  if (data[28]) {
    data[1] = 0;
  }
}

function triggerSpawnSpell(troop, team) {
  var cardName = troop[25];
  if (!cardName) return;
  var cardIdx = getCardByName(cardName);
  if (cardIdx === -1) return;

  if (isSpellCard(cardIdx)) {
    castSpell(cardIdx, troop[4], troop[5], team);
  } else {
    spawnCard(team, cardName, troop[4], troop[5]);
  }
}

function handleDeath(troop, team) {
  var deathSpellName = troop[29];
  if (deathSpellName) {
    var deathSpellIdx = getCardByName(deathSpellName);
    if (deathSpellIdx !== -1) {
      castSpell(deathSpellIdx, troop[4], troop[5], team);
      say(team + " " + troop[0] + " cast " + deathSpellName + " on death");
    }
  }
  // Check for deathSpawn at index 26
  var deathSpawnName = troop[26];
  if (!deathSpawnName) return;

  spawnCard(team, deathSpawnName, troop[4], troop[5]);
  say(team + " " + troop[0] + " spawned " + deathSpawnName + " on death");
}



function checkAggroPull(newTroop, team) {
 
}
function checkTowerPull(btgt) {
 
  if (btgt[18] !== "ground") return;
  if (btgt[19] !== "buildings") return;

  for (var j = 3; j < rTroops.length; j++) {

    var e = rTroops[j];
    if (e[1] <= 0) continue;              
    if (e[22] > 0) continue;             
    if (e[18] !== "ground") continue;      
    if (e[19] === "buildings") continue;  

    var lockedOnTower = (e[15] === true && e[14] >= 0 && e[14] <= 2 &&
                        bTroops[e[14]] && bTroops[e[14]][1] > 0);
    if (!lockedOnTower) continue;

  
    if (btgt[4] <= e[4]) continue;

  
    var dist = edgeDistance(e, btgt);
    if (dist > -0.1) continue;


     e[15] = false;
      e[14] = -1;
    say(e[0] + " pulled off tower by " + btgt[0]);
  }
}



function updateElixir() {
  if (elixir < maxE) {
    elixir = Math.min(maxE, elixir + regenX);
  }
}

function cleanupDead() {

}
function applyStun(troop, frames) {
  if (!troop) return;
  if (!troop[23]) troop[23] = [];
  troop[23].push(["stun", frames]);
  say(troop[0] + " stunned for " + frames + " frames");
}