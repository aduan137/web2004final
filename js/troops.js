// ============================================================
// troops.js — ported from the original engine
// ------------------------------------------------------------
// Faithful translation of the original's targeting and movement
// rules, cleaned up and commented.
//
// Troop data layout (positional array):
//   [0]  name          [13] ret            [17] aoe
//   [1]  hp            [14] targetIdx      [18] type
//   [2]  maxHp         [15] locked         [19] targetType
//   [3]  damage        [16] facingAngle    [20] crownPenalty
//   [4]  row (y-tile)                      [21] loadTime
//   [5]  col (x-tile)                      [22] deployTime
//   [6]  size                              [23] effects[]
//   [7]  mass
//   [8]  speed         [9]  attackRange    [10] sightRange
//   [11] cooldown      [12] maxCooldown
// ============================================================


// ---- CONSTANTS ----
// SPDM matches the original engine's spdm = 1800. Speed 60 / 1800
// = ~0.033 tiles/frame = ~1 tile per second at 30 fps. Knight pace.
var SPDM = 1800;
var PROJECTILE_SPEED = 810;


// ============================================================
// updateTroops() — called once per frame from main.js
// ============================================================
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
// ============================================================
// resolveOverlaps — runs once per frame, after all movement.
// Any two troops whose hitboxes overlap get pushed apart
// symmetrically (each moves half the overlap distance).
// Towers are skipped (they don't move).
// ============================================================
function resolveOverlaps() {
  // Combine all troops into one list for pairwise check
  // (we want troops to push other troops on either team)
  var all = bTroops.concat(rTroops);

  for (var i = 0; i < all.length; i++) {
    for (var j = i + 1; j < all.length; j++) {
      var a = all[i];
      var b = all[j];
      
      // Skip dead troops
      if (a[1] <= 0 || b[1] <= 0) continue;
      // Skip troops still deploying
      if (a[22] > 0 || b[22] > 0) continue;
      // Skip buildings (towers, defensive buildings) — they don't move
      if (a[18] === "building" || b[18] === "building") continue;
      // Skip air vs ground (different layers don't collide)
      if (a[18] === "air" && b[18] !== "air") continue;
      if (b[18] === "air" && a[18] !== "air") continue;
      // Skip bombs
      if (a[18] === "bomb" || b[18] === "bomb") continue;

      var dr = b[4] - a[4];
      var dc = b[5] - a[5];
      var dist = Math.sqrt(dr * dr + dc * dc);
      var combinedRadii = a[6] / 2 + b[6] / 2;

      if (dist < combinedRadii && dist > 0.001) {
        // Overlap exists — calculate push amount
        var overlap = combinedRadii - dist;
        var nx = dr / dist;   // normalized direction from a to b
        var ny = dc / dist;
        var push = overlap / 2;

        // Push a backward, b forward — both by half the overlap
        a[4] -= nx * push;
        a[5] -= ny * push;
        b[4] += nx * push;
        b[5] += ny * push;
      }
    }
  }
}
// ============================================================
// dealDamage(target, amount)
// ------------------------------------------------------------
// Apply damage to a target, respecting shield mechanics.
// If the target has a shield (data[31] > 0), the shield absorbs
// the damage first. Overflow damage is WASTED — it does not
// carry over to the target's HP.
// Returns the actual damage that was applied (for logging).
// ============================================================
function dealDamage(target, amount) {
  if (amount <= 0) return 0;
  
  // Shield absorbs first
  if (target[31] > 0) {
    target[31] -= amount;
    if (target[31] < 0) target[31] = 0;
    // Damage was absorbed by shield, none goes to HP
    return amount;
  }
  
  // No shield — damage goes to HP
  target[1] -= amount;
  return amount;
}
// ============================================================
// updateSingleTroop — the per-troop AI cycle
// ------------------------------------------------------------
// Order of operations (matches original):
//   1. Skip if dead
//   2. Tick deploy-time, exit if still deploying
//   3. Tick cooldown
//   4. Validate current lock (if any)
//   5. If not locked, re-scan for closest enemy in sight
//   6. Based on target & distance: attack, chase, or default-path
// ============================================================
function updateSingleTroop(data, enemies, team) {
  // Dead — skip
  if (data[1] <= 0) return;
    var stunned = false;
      var slowed = false;
      if (data[0] === "royal_ghost") {
  // Track time since last attack via cooldown timer
  // When cooldown is high (>= maxCooldown - 30), recently attacked → visible
  // When cooldown is low (< maxCooldown - 30 OR didn't recently attack), hidden
  // Simpler: when cooldown was recently reset, visible. After 30 frames of decay, hidden.
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
           if (eff[0] === "summon") {
      var summonName = eff[3];
      spawnCard(team, summonName, data[4], data[5]);
      eff[1] = eff[2];   // reset timer to interval
      say(team + " " + data[0] + " summoned " + summonName);
      continue;          // skip splice
    }
       if (eff[0] === "leap") {
  var leapTgtIdx = eff[2];
  if (leapTgtIdx >= 0 && leapTgtIdx < enemies.length) {
    var leapTgt = enemies[leapTgtIdx];
    if (leapTgt[1] > 0) {
      // Land in front of target (works for buildings AND troops)
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
}if (eff[0] === "chain_dash") {
  var hitsLeft = eff[2];
  var hitIdxs = eff[3];   // ← now an object, not a single index
  
  if (hitsLeft <= 0) {
    data[23].splice(e, 1);
    continue;
  }
  
  var enemiesArrCD = (team === "blue") ? rTroops : bTroops;
  var nextTgt = null;
  var nextIdx = -1;
  var nextDist = 4.0;
  
  for (var k = 0; k < enemiesArrCD.length; k++) {
    if (hitIdxs[k]) continue;   // ← skip ALL previously hit targets
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
    hitIdxs[nextIdx] = true;   // ← mark this target as hit so we never come back
  } else {
    data[23].splice(e, 1);
  }
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
      // Future: if (eff[0] === "slow") ...
    }
  }

  // Stunned? can't act this frame at all (no deploy tick, no cooldown tick,
  // no targeting, no attack). We still allow the HP check above so dead
  // stunned troops still get removed.
  if (stunned) return;

  // Deploy time — freeze until zero
  if (data[22] > 0) {
    data[22]--;
    return;
  }

  // Cooldown ticks regardless
  if (data[11] > 0) data[11]--;
    // ===== SPECIAL CASE: Ram Rider — fires snare at nearest troop =====
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

  // Non-targeters (rare — mostly unused right now)
  if (data[19] === "none") return;

  // --- STEP 1: Validate lock ---
  // If locked, check that the locked target is still valid
  // (alive, deployed, still within attack range).
  // If not, release the lock so we re-scan below.
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
  // ===== Ramp reset on lost lock =====
  if (!data[15] && (data[0] === "mighty_miner" || data[0] === "inferno_dragon")) {
    data[33] = 0;
    data[34] = -1;
  }
  // ===== END Ramp reset =====

  // --- STEP 2: Acquire target if not locked ---
  if (!data[15]) {
    data[14] = findTargetInSight(data, enemies);
  }
  // Charge meter — ticks up each frame, capped at 60 (2 sec at 30fps)
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
var movementCharging = (data[0] === "prince" || data[0] === "royal_knight") && charging;
  var charging = (data[32] >= 60); 
  // --- STEP 3: Act based on target ---
  if (data[14] !== -1 && data[14] < enemies.length) {
    var tgt = enemies[data[14]];
    var dist = edgeDistance(data, tgt);

    if (dist <= data[9]) {
      // In attack range — lock on and attack
      data[15] = true;
      faceTarget(data, tgt);
      attemptAttack(data, tgt, data[14], team,slowed);
    } else {
         
      moveToward(data, tgt,slowed,movementCharging);
    }
  } else {
    
    walkDefaultPath(data, enemies,slowed,movementCharging);
  }
    if (team === "blue") {
    checkTowerPull(data);
  }
}


// ============================================================
// findTargetInSight — scan all enemies, return closest valid idx
// ============================================================
function findTargetInSight(data, enemies) {
  var bestIdx = -1;
  var bestDist = data[10]; // sight range
  var tt = data[19];       // targetType
 var canSeeAcrossRiver = (
  data[0] === "prince" ||
  data[0] === "dark_prince" ||      // ← already added probably, double-check
  data[0] === "hog_rider" ||
  data[0] === "royal_hog" ||
  data[0] === "princess"
);
 
  for (var j = 0; j < enemies.length; j++) {
    var e = enemies[j];
    if (e[1] <= 0) continue;            // dead
               // still deploying (untargetable)
    if (e[18] === "spell") continue;
    if ( e[35] === 1) continue; 
    
if (e[18] === "bomb") continue;  
if (data[18] === "ground" && !canSeeAcrossRiver && (data[9] < 2 || data[0] === "bandit" || data[0] === "mega_knight")) {
  var amBlue = (enemies === rTroops);
  if (amBlue && data[4] >= 17 && e[4] < 17) continue;       // blue still on blue side, target across the river
  if (!amBlue && data[4] <= 15 && e[4] > 15) continue;      // red still on red side, target across the river
}
   // spells are never targets

    // Target type filter (matches original)
    if (tt === "buildings" && e[18] !== "building") continue;
    if (tt === "troops"    && e[18] === "building") continue;
    if (tt === "ground"    && e[18] === "air")      continue;
    if (tt === "air"       && e[18] !== "air" && e[18] !== "building") continue;
    // "all" matches everything

    var d = edgeDistance(data, e);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = j;
    }
  }
  return bestIdx;
}


// ============================================================
// edgeDistance — distance between two troops' HITBOX EDGES
// (center-to-center minus both radii). Matches original's `cdis`.
// ============================================================
function edgeDistance(a, b) {
  var dr = b[4] - a[4];
  var dc = b[5] - a[5];
  return Math.sqrt(dr * dr + dc * dc) - a[6] / 2 - b[6] / 2;
}


// ============================================================
// moveToward — one step toward target (row/col aware).
// Matches original: ang = atan2(colDelta, rowDelta),
//   data[4] += cos(ang) * speed/spdm   (row movement)
//   data[5] += sin(ang) * speed/spdm   (col movement)
// ============================================================
function moveToward(data, tgt,slowed,charging) {
   
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

  data[4] += Math.cos(ang) * step;
  data[5] += Math.sin(ang) * step;

  data[16] = ang * 180 / Math.PI; // facing angle for rendering
}


// ============================================================
// faceTarget — update facing angle without moving
// (used when in attack range but still wanting to look at target)
// ============================================================
function faceTarget(data, tgt) {
  var xdif = tgt[4] - data[4];
  var ydif = tgt[5] - data[5];
  if (xdif === 0 && ydif === 0) return;
  data[16] = Math.atan2(ydif, xdif) * 180 / Math.PI;
}


// ============================================================
// walkDefaultPath — no enemy in sight, head toward enemy's
// nearest princess tower based on which lane we're in.
// (Matches original's `if(data[5] < 9)` lane logic.)
// ============================================================
// ============================================================
// walkDefaultPath — no enemy in sight, march straight along
// the lane. In real Clash, troops don't "target" towers —
// they walk straight forward and happen to bump into towers
// if nothing distracts them. Lane = roughly their current column.
//
// Direction is determined by team: blue troops move UP (toward
// lower row numbers, where red's side is), red troops move DOWN.
// ============================================================
function walkDefaultPath(data, enemies,slowed,charging) {
  if (data[8] === 0) return;

  var marchingDown = (enemies === bTroops);
  var step = data[8] / SPDM;
  if (slowed) step *= 0.65;
   if (charging) step *= 2; 
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
    // --- BLUE team walking north ---
    if (data[4] > 17.2) {
      // Still south of the river — walk diagonally to the bridge entry point
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

// Helper: move one step toward the target (row, col) at full speed.
function walkTowardPoint(data, targetRow, targetCol, step) {
  var dr = targetRow - data[4];
  var dc = targetCol - data[5];
  var dist = Math.sqrt(dr * dr + dc * dc);
  if (dist < 0.01) return;

  // Angle of travel
  var ang = Math.atan2(dc, dr);

  // Break the step into row/col components
  data[4] += Math.cos(ang) * step;
  data[5] += Math.sin(ang) * step;

  // Facing angle for rendering
  data[16] = ang * 180 / Math.PI;
}

// ============================================================
// attemptAttack — fire an attack if cooldown is ready
// Melee (range < 2, no AoE) → direct damage
// Ranged → spawn a projectile
// ============================================================
function attemptAttack(data, tgt, tgtIdx, team,slowed) {
  if (data[11] > 0) return;  // still reloading
  data[11] = data[12];       // reset cooldown

  var dmg = data[3];
    if (data[32] >= 60 && data[0] !== "royal_knight") {
    dmg = Math.floor(dmg * 2);
    data[32] = 0;   // reset charge counter — must wait 2 sec for next charge
    say(team + " " + data[0] + " CHARGE HIT");
  } else if (data[32] !== undefined && data[0] !== "royal_knight") {
    data[32] = 0;   // normal attack also resets the counter
  }

  // Crown tower damage penalty (towers are indices 0,1,2)
  if (tgtIdx <= 2) {
    dmg = Math.floor(dmg * data[20]);
  }
  // ===== RAMP-UP DAMAGE: Mighty Miner & Inferno Dragon =====
 if (data[0] === "mighty_miner" || data[0] === "inferno_dragon") {
  if (data[34] !== tgtIdx) {
    data[33] = 0;
    data[34] = tgtIdx;
  }
  
  data[33] = Math.min(data[33] + 1, 30);   // cap at 30 hits = 6 seconds at 5hits/sec
  
  // Exponential ramp: 1x at start, ~50x at full ramp
  var progress = data[33] / 30;
  var rampMult = Math.exp(4 * progress);
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
  //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ===== SPECIAL CASE: Electro Spirit — chain lightning =====
// ===== SPECIAL CASE: Bowler — throws a rolling rock =====
// ===== SPECIAL CASE: Executioner — throws a piercing axe =====
// ===== SPECIAL CASE: Magic Archer — fires piercing arrow =====
// ===== SPECIAL CASE: Mega Knight =====
// ===== SPECIAL CASE: Firecracker — fires projectile with stored direction =====
// ===== SPECIAL CASE: Bandit — leap if target is 3-5 tiles away =====
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
// ===== END Mega Knight =====

if (data[0] === "magic_archer") {
  var arrowIdx = getCardByName("MagicArrow");
  if (arrowIdx !== -1) {
    castSpell(arrowIdx, data[4], data[5], team, data[16]);
  }
  return;
}
// ===== END Magic Archer =====
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

  data[1] = 0;   // spirit dies
  say(team + " electro_spirit chained to " + hitCount + " targets");
  return;
}
// ===== END Electro Spirit =====
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
  // ===== SPECIAL CASE: Dark Prince — forward 60° cone melee =====
  if (data[0] === "dark_prince") {
    var enemies = (team === "blue") ? rTroops : bTroops;
    var coneRadius = 1.5;
    var coneHalfAngle = 45.5 * Math.PI / 180;  // 60° total = 30° each side
    var facingRad = data[16] * Math.PI / 180;

    for (var j = 0; j < enemies.length; j++) {
      var e = enemies[j];
      if (e[1] <= 0) continue;
      if (e[22] > 0) continue;

      // Edge distance check (within cone radius)
      var dr = e[4] - data[4];
      var dc = e[5] - data[5];
      var centerDist = Math.sqrt(dr * dr + dc * dc);
      var edgeDist = centerDist - e[6] / 2;
      if (edgeDist > coneRadius) continue;

      // Angle from Dark Prince to enemy
      var angleToEnemy = Math.atan2(dc, dr);
      var angleDiff = angleToEnemy - facingRad;
      // Normalize angle difference to [-PI, PI]
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      if (Math.abs(angleDiff) > coneHalfAngle) continue;

      // Hit! Apply damage with crown penalty if it's a tower
      var enemyDmg = data[3];
      if (j <= 2) enemyDmg = Math.floor(enemyDmg * e[20]);
      dealDamage(e, enemyDmg);
      say(team + " " + data[0] + " coned " + e[0] + " for " + enemyDmg);
      
      // Apply on-hit effects (none for DP, but for completeness)
      if (data[24] && data[24].length > 0) {
        for (var k = 0; k < data[24].length; k++) {
          e[23].push(data[24][k].slice());
        }
      }
    }
    return;  // skip normal attack flow
  }
  // ===== SPECIAL CASE: Hunter — forward cone with damage falloff =====
  if (data[0] === "hunter") {
    var enemies = (team === "blue") ? rTroops : bTroops;
    var coneRadius = 5.0;
    var coneHalfAngle = 37.5 * Math.PI / 180;  // 75° total
    var facingRad = data[16] * Math.PI / 180;

    var maxDamage = data[3];    // 211 at point-blank
    var minDamage = 135;        // at max range

    for (var j = 0; j < enemies.length; j++) {
      var e = enemies[j];
      if (e[1] <= 0) continue;
      if (e[22] > 0) continue;

      var dr = e[4] - data[4];
      var dc = e[5] - data[5];
      var centerDist = Math.sqrt(dr * dr + dc * dc);
      var edgeDist = centerDist - e[6] / 2;
      if (edgeDist > coneRadius) continue;
      if (edgeDist < 0) edgeDist = 0;   // clamp negative for falloff calc

      // Angle check (same as Dark Prince)
      var angleToEnemy = Math.atan2(dc, dr);
      var angleDiff = angleToEnemy - facingRad;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      if (Math.abs(angleDiff) > coneHalfAngle) continue;

      // Damage falloff: full damage at distance 0, scales linearly to minDamage at coneRadius
      // Damage falloff: exponential decay from maxDamage at point-blank.
// At half range (2.5 tiles), damage drops below 140 — can't kill goblins.
var falloffK = 0.3;
var enemyDmg = Math.floor(maxDamage * Math.exp(-falloffK * edgeDist));
      if (j <= 2) enemyDmg = Math.floor(enemyDmg * e[20]);
      dealDamage(e, enemyDmg);
      say(team + " " + data[0] + " blasted " + e[0] + " for " + enemyDmg);
    }
    return;
  }
  // ===== END Hunter =====




































   // ======================================================================================================
  var isMelee = (data[9] < 2 && data[17] === 0);
  if (isMelee) {
  if (data[0] === "royal_knight" && data[32] >= 60) {
  var firstDmg = Math.floor(data[3] * 1.3);
  if (tgtIdx <= 2) firstDmg = Math.floor(firstDmg * tgt[20]);
  dealDamage(tgt, firstDmg);
  say(team + " royal_knight CHAIN HIT " + tgt[0] + " for " + firstDmg);
  
  if (!data[23]) data[23] = [];
  // Initialize hit-tracking with the primary target
  var hitIdxs = {};
  hitIdxs[tgtIdx] = true;
  data[23].push(["chain_dash", 3, 7, hitIdxs]);
  
  data[32] = 0;
  return;
}
    dealDamage(tgt, dmg);
    say(team + " " + data[0] + " hit " + tgt[0] + " for " + dmg);
     // ===== Royal Knight chain =====

  }  else {

  var onHit = data[24] || [];   // get effects, default empty
  var proj = [data[0] + "_proj", data[4], data[5],
              tgtIdx, dmg, PROJECTILE_SPEED, data[17],
              onHit];   // ← NEW: index 7 of the projectile
  if (team === "blue") bProj.push(proj);
  else                 rProj.push(proj);
  say(team + " " + data[0] + " fired at " + tgt[0]);
}


  if (data[28]) {
    data[1] = 0;
  }
}
// ============================================================
// triggerSpawnSpell — fires a spell at this troop's location
// when it spawns, if the troop's data[25] is a spell name.
// ============================================================
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
// ============================================================
// handleDeath(troop, team)
// ------------------------------------------------------------
// Called once when a troop's HP reaches 0. Handles death-spawn
// effects (Giant Skeleton bomb, Lava Hound pups, etc.).
// ============================================================
function handleDeath(troop, team) {
  // Check for deathSpawn at index 26
  var deathSpawnName = troop[26];
  if (!deathSpawnName) return;

  spawnCard(team, deathSpawnName, troop[4], troop[5]);
  say(team + " " + troop[0] + " spawned " + deathSpawnName + " on death");
}


// ============================================================
// checkAggroPull — kept as a no-op for backwards compatibility.
// With proper every-frame sight scanning, aggro pulling happens
// automatically: when a new troop spawns next to an enemy, the
// enemy's next-frame scan will naturally pick it up as the
// closest target (unless the enemy is a building-targeter like
// Giant, which filters out non-buildings).
// ============================================================
function checkAggroPull(newTroop, team) {
  // Intentionally empty — handled implicitly by findTargetInSight.
}
function checkTowerPull(btgt) {
  // Only blue BTGTs trigger the pull
  if (btgt[18] !== "ground") return;
  if (btgt[19] !== "buildings") return;

  for (var j = 3; j < rTroops.length; j++) {
    // Start at 3 to skip red's own towers (indices 0-2).
    var e = rTroops[j];
    if (e[1] <= 0) continue;               // dead
    if (e[22] > 0) continue;               // still deploying
    if (e[18] !== "ground") continue;      // only ground troops get pulled
    if (e[19] === "buildings") continue;   // red BTGTs are immune

    // Is this red troop currently locked onto one of the BLUE towers?
    var lockedOnTower = (e[15] === true && e[14] >= 0 && e[14] <= 2 &&
                        bTroops[e[14]] && bTroops[e[14]][1] > 0);
    if (!lockedOnTower) continue;

    // Is the blue BTGT on the red troop's SOUTH side?
    // Higher row = more south (closer to blue towers = "tower-facing").
    if (btgt[4] <= e[4]) continue;

    // Hitboxes must be deeply overlapping
    var dist = edgeDistance(e, btgt);
    if (dist > -0.1) continue;

    // Pull! Break the red troop's lock so it re-scans next frame.
    e[15] = false;
    e[14] = -1;
    say(e[0] + " pulled off tower by " + btgt[0]);
  }
}


// ============================================================
// updateElixir / cleanupDead — unchanged
// ============================================================
function updateElixir() {
  if (elixir < maxE) {
    elixir = Math.min(maxE, elixir + regenX);
  }
}

function cleanupDead() {
  // No-op for now. Splicing dead troops would invalidate projectile
  // target indices. Skip for simplicity; can compact later if needed.
}
function applyStun(troop, frames) {
  if (!troop) return;
  if (!troop[23]) troop[23] = [];
  troop[23].push(["stun", frames]);
  say(troop[0] + " stunned for " + frames + " frames");
}