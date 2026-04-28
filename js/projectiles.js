// ============================================================
// projectiles.js — projectile movement, hit detection, damage
// ------------------------------------------------------------
// Ported from the original engine. Simplified to skip special
// mechanics (chains, spreads, spell effects) that we don't have
// cards for yet — those can be added as we build cards that
// need them.
//
// Projectile data format (from troops.js attemptAttack):
//   [0] name          e.g. "knight_proj"
//   [1] row           current position
//   [2] col           current position
//   [3] targetIdx     index into the target team's troop array
//   [4] damage
//   [5] speed         typically 810
//   [6] aoe           splash radius; 0 = single-target
// ============================================================


// ---- CONSTANTS ----
// HIT_THRESHOLD: how close a non-AoE projectile needs to be to its
// target before we count it as a hit. 0.2 tiles = ~3 pixels.
// Small enough to look precise, large enough that the projectile
// can never "tunnel past" its target due to framerate jitter.
var HIT_THRESHOLD = 0.2;


// ============================================================
// updateProjectiles() — called once per frame from main.js.
// Processes all four projectile arrays.
// ============================================================
function updateProjectiles() {
  // Blue projectiles hit red enemies
  updateProjectileArray(bProj, rTroops, "blue");
  // Red projectiles hit blue enemies
  updateProjectileArray(rProj, bTroops, "red");
}


// ============================================================
// updateProjectileArray(projArr, enemies, team)
// ------------------------------------------------------------
// Iterates in REVERSE so we can splice dead projectiles out
// during the loop without breaking the index.
// ============================================================
function updateProjectileArray(projArr, enemies, team) {
  for (var i = projArr.length - 1; i >= 0; i--) {
    var proj = projArr[i];
    var targetIdx = proj[3];

    // --- 1. Validate target ---
    // If the original target is gone (somehow out of array bounds
    // or dead), delete the projectile. Real Clash sometimes keeps
    // the projectile flying to the last-known position, but for
    // a first pass we just drop it.
    if (targetIdx < 0 || targetIdx >= enemies.length) {
      projArr.splice(i, 1);
      continue;
    }
    var target = enemies[targetIdx];
    if (target[1] <= 0) {
      // Target already dead — projectile has no one to hit
      projArr.splice(i, 1);
      continue;
    }

    // --- 2. Compute distance to target (center-to-center) ---
    var dr = target[4] - proj[1];
    var dc = target[5] - proj[2];
    var cdis = Math.sqrt(dr * dr + dc * dc);

    // --- 3. Hit check ---
      var aoeRadius = proj[6];
    var projectileStep = proj[5] / SPDM;
    var hitRadius = target[6] / 2 + projectileStep;
    var hit = (cdis <= hitRadius);
    if (hit) {
      applyProjectileDamage(proj, enemies, team);
      projArr.splice(i, 1);
      continue;
    }

    // --- 4. Move toward target ---
    // Same atan2+cos/sin pattern as troop movement.
    var ang = Math.atan2(dc, dr);
    var step = proj[5] / SPDM;
    proj[1] += Math.cos(ang) * step;
    proj[2] += Math.sin(ang) * step;
  }
}


// ============================================================
// applyProjectileDamage(proj, enemies, team)
// ------------------------------------------------------------
// For a single-target projectile, damages only the stored target.
// For an AoE projectile, damages everyone within aoe radius of
// the projectile's CURRENT POSITION (not target position — this
// matters when projectile overshoots or hits near-miss).
// ============================================================
function applyProjectileDamage(proj, enemies, team) {
  
   if (proj[0] === "firecracker_proj") {
    var coneRadius = 3.0;
    var coneHalfAngle = 25 * Math.PI / 180;   // 90° total
    var maxDamage = 400;
    var minDamage = 84;
    
    var dirR = proj[8];
    var dirC = proj[9];
    var coneFacing = Math.atan2(dirC, dirR);
    
    var hitX = proj[1];
    var hitY = proj[2];
    
    for (var j = 0; j < enemies.length; j++) {
      var e = enemies[j];
      if (e[1] <= 0) continue;
      if (e[22] > 0) continue;
        if (e[35] === 1) continue;
      
      var dr = e[4] - hitX;
      var dc = e[5] - hitY;
      var centerDist = Math.sqrt(dr * dr + dc * dc);
      var edgeDist = centerDist - e[6] / 2;
      if (edgeDist > coneRadius) continue;
      if (edgeDist < 0) edgeDist = 0;
      
      var angleToEnemy = Math.atan2(dc, dr);
      var angleDiff = angleToEnemy - coneFacing;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      if (Math.abs(angleDiff) > coneHalfAngle) continue;
      
      var falloff = 1 - (edgeDist / coneRadius);
      var enemyDmg = Math.floor(minDamage + (maxDamage - minDamage) * falloff);
      if (j <= 2) enemyDmg = Math.floor(enemyDmg * e[20]);
      
      dealDamage(e, enemyDmg);
      say(team + " firecracker boomed " + e[0] + " for " + enemyDmg);
    }

    
    return;
  }
  var damage = proj[4];
  var aoeRadius = proj[6];
  var targetIdx = proj[3];

  if (aoeRadius > 0) {
    // AoE splash — hit everyone within radius of the impact point
    for (var j = 0; j < enemies.length; j++) {
      var e = enemies[j];
      if (e[1] <= 0) continue;

      var dr = e[4] - proj[1];
      var dc = e[5] - proj[2];
      // Edge distance (projectile point vs enemy hitbox)
      var cdis = Math.sqrt(dr * dr + dc * dc) - e[6] / 2;

      if (cdis <= aoeRadius) {
        var d = damage;
        // Crown tower penalty (indices 0-2 are towers)
        if (j <= 2) d = Math.floor(d * e[20]);
        dealDamage(e, d);
        say(team + " " + proj[0] + " splashed " + e[0] + " for " + d);
        applyOnHitEffects(e, proj[7]);
      }
    }
  } else {
    // Single-target hit
    var target = enemies[targetIdx];
       if (!target) return;             // ← guard against missing target
    if (target[35] === 1) return;
    var d = damage;
    if (targetIdx <= 2) d = Math.floor(d * target[20]);
  dealDamage(target, d);
    say(team + " " + proj[0] + " hit " + target[0] + " for " + d);4
    applyOnHitEffects(target, proj[7]);
  }
}
function applyOnHitEffects(target, onHit) {
  if (!onHit || onHit.length === 0) return;
  for (var k = 0; k < onHit.length; k++) {
    target[23].push(onHit[k].slice());
  }
}


// ============================================================
// drawProjectiles() — called once per frame from main.js during render.
// Draws each projectile as a small colored dot. Blue for player,
// red for enemy, so you can tell them apart.
// ============================================================
function drawProjectiles() {
  noStroke();

  // Blue projectiles
  for (var i = 0; i < bProj.length; i++) {
    var p = bProj[i];
    var x = tileToPx(p[2]);
    var y = tileToPx(p[1]);
    
    if (p[0] === "sparky_proj") {
      // Big glowing blue ball — size of a card
      var size = 1.0 * TILE_SIZE;
      fill(80, 160, 255, 100);
      ellipse(x, y, size * 1.5, size * 1.5);   // outer glow
      fill(120, 200, 255);
      ellipse(x, y, size, size);                // inner core
    } else {
      fill(60, 120, 255);
      ellipse(x, y, 6, 6);
    }
  }

  // Red projectiles
  for (var i = 0; i < rProj.length; i++) {
    var p = rProj[i];
    var x = tileToPx(p[2]);
    var y = tileToPx(p[1]);
    
    if (p[0] === "sparky_proj") {
      // Big glowing blue ball — size of a card (same as blue's, since visual is the projectile)
      var size = 1.0 * TILE_SIZE;
      fill(80, 160, 255, 100);
      ellipse(x, y, size * 1.5, size * 1.5);
      fill(120, 200, 255);
      ellipse(x, y, size, size);
    } else {
      fill(255, 60, 60);
      ellipse(x, y, 6, 6);
    }
  }
}