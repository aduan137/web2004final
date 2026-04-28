// ============================================================
// render.js — drawing troops, towers, and projectiles
// ------------------------------------------------------------
// Everything here runs inside the p5.js canvas.
// ============================================================


// ============================================================
// drawTroop(troop, team)
// ------------------------------------------------------------
//   troop: the positional-array troop (from bTroops or rTroops)
//   team:  "blue" (player) or "red" (enemy) — affects fallback color
//
// If a sprite exists for troop[0], draws it. Otherwise falls back
// to a colored circle so the game is still playable without art.
// Health bar is drawn above the troop regardless.
// ============================================================
function drawTroop(troop, team) {
  var stealthAlpha = (troop[35] === 1) ? 128 : 255;
  
  var name   = troop[0];
  var hp     = troop[1];
  var maxHp  = troop[2];
  var x      = tileToPx(troop[5]);
  var y      = tileToPx(troop[4]);
  var baseSize = troop[6] * TILE_SIZE;
   if (troop[22] > 0 && troop[0] === "royal_recruit") return;

// Attack pulse — pops bigger on attack, snaps back almost instantly
var pulseAmount = 0;
if (troop[9] >= 2 && troop[12] > 0 && troop[11] > 0) {
  var pulseProgress = troop[11] / troop[12];
  pulseAmount = 0.4 * Math.pow(pulseProgress, 8);
}

var size = baseSize * (1 + pulseAmount);
  
  var angle  = troop[16];

  // --- Sprite or fallback shape ---
  if (sprites[name]) {
    push();
    translate(x, y);
    rotate(radians(angle));
    imageMode(CENTER);
    image(sprites[name], 0, 0, size, size);
    pop();
  } else {
    // Figure out which direction the troop should be facing.
    // Default: where are they MOVING?
    // If locked onto a target: toward the target.
    var facingDx = 0;  // col direction (x on screen)
    var facingDy = 0;  // row direction (y on screen)

    // Try to use the current target's position
    var enemies = (team === "blue") ? rTroops : bTroops;
    var tgtIdx = troop[14];
    if (tgtIdx >= 0 && tgtIdx < enemies.length && enemies[tgtIdx][1] > 0) {
      facingDx = enemies[tgtIdx][5] - troop[5];
      facingDy = enemies[tgtIdx][4] - troop[4];
    }

    // Fall back to team default direction if no target
    if (facingDx === 0 && facingDy === 0) {
      facingDy = (team === "blue") ? -1 : 1;  // blue goes up, red goes down
    }

    // Compute the angle in screen-space
    // atan2(dy, dx) where dx is horizontal, dy is vertical
    // Result: 0° points right (east), 90° points down (south)
    var drawAngle = Math.atan2(facingDy, facingDx);
    // Melee swing wiggle — quick rotate-right on attack, snaps back

    var swingOffset = 0;
if (troop[9] < 2 && troop[12] > 0 && troop[11] > 0) {
  var swingProgress = troop[11] / troop[12];
  swingOffset = 0.6 * Math.pow(swingProgress, 8);  // radians, ~35° at peak
}



    push();
    translate(x, y);
    rotate(drawAngle+swingOffset);

    // Circle
   // Check if this troop is currently stunned
    var stunned = false;
    if (troop[23]) {
      for (var e = 0; e < troop[23].length; e++) {
        if (troop[23][e][0] === "stun" && troop[23][e][1] > 0) {
          stunned = true;
          break;
        }
      }
    }

    noStroke();
    if (stunned) {
      fill(255, 230, 0,stealthAlpha);   // yellow = stunned
    } else if (team === "blue") {
      fill(40, 80, 255,stealthAlpha);
    }
    else {
      fill(230, 40, 40,stealthAlpha);
    }
     rect(-size/2, -size/2, size, size);

    // Stick — points "forward" along local +x axis
    stroke(255);
    strokeWeight(2);
    line(0, 0, size / 2 + 5, 0);

    pop();
      if (troop[0] === "hunter" && troop[12] > 0 && troop[11] > 0) {
      var coneProgress = troop[11] / troop[12];
      if (coneProgress > 0.88) {
        var coneAlpha = (coneProgress - 0.88) / 0.12 * 200;
        push();
        translate(x, y);
        rotate(drawAngle);
        var coneRadius = 5.0 * TILE_SIZE;
        var halfAngle = 37.5 * Math.PI / 180;
        noStroke();
        fill(255, 240, 100, coneAlpha);
        var tipX1 = Math.cos(halfAngle) * coneRadius;
        var tipY1 = Math.sin(halfAngle) * coneRadius;
        var tipX2 = Math.cos(-halfAngle) * coneRadius;
        var tipY2 = Math.sin(-halfAngle) * coneRadius;
        triangle(0, 0, tipX1, tipY1, tipX2, tipY2);
        pop();
      }
    }

    // Label (outside push/pop, stays upright)
    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(8);
    text(name.substring(0, 4), x, y);
    textAlign(LEFT, BASELINE);
    textSize(10);
  }
  if (troop[30] > 0 && troop[31] > 0) {
  var barW = size;
  var barH = 4;
  var barX = x - barW / 2;
  var shieldBarY = y - size / 2 - 12;   // higher up to leave space for HP bar

  noStroke();
  fill(40);
  rect(barX, shieldBarY, barW, barH);
  fill(180, 180, 220);   // silver-blue
  rect(barX, shieldBarY, barW * (troop[31] / troop[30]), barH);
}

  // --- Health bar (only if damaged) ---
  if (hp < maxHp && hp > 0) {
    var barW = size;
    var barH = 4;
    var barX = x - barW / 2;
    var barY = y - size / 2 - 8;

    noStroke();
    fill(40);
    rect(barX, barY, barW, barH);

    var pct = hp / maxHp;
    if      (pct > 0.5) fill(50, 200, 50);
    else if (pct > 0.25) fill(230, 200, 50);
    else                 fill(220, 50, 50);
    rect(barX, barY, barW * pct, barH);
  }
  // Sparky's "ready" indicator — blue glow when cooldown is at 0
if (troop[0] === "sparky" && troop[11] <= 0) {
  noStroke();
  // Pulse the alpha based on a timer for a glowing effect
  var pulseAlpha = 150 + Math.sin(frameCount * 0.2) * 80;
  fill(80, 160, 255, pulseAlpha);
  ellipse(x, y - size/2 - 18, 12, 12);
}
  // Shield bar (only if shielded)

}

// ============================================================
// drawTroops() — draws every troop on both teams.
// Called once per frame from main.js.
// ================================
// ============================
function drawTroops() {
  // Enemy first (so player troops render on top if they overlap)
  for (var i = 0; i < rTroops.length; i++) {
    if (rTroops[i][1] <= 0) continue; 
    drawTroop(rTroops[i], "red");
  }
  for (var i = 0; i < bTroops.length; i++) {
    if (bTroops[i][1] <= 0) continue; 
    drawTroop(bTroops[i], "blue");
  }
}


// ============================================================
// drawArena() — real arena background.
// Replaces the placeholder in main.js once this file is loaded.
// ============================================================
function drawArena() {
  // Arena grass
  noStroke();
  fill(120, 170, 100);
  rect(ARENA_PX_X, ARENA_PX_Y,
       ARENA_TILES_W * TILE_SIZE,
       ARENA_TILES_H * TILE_SIZE);

  // River across the middle (at tile row 15-16)
  fill(80, 140, 200);
  rect(ARENA_PX_X,
       ARENA_PX_Y + 15 * TILE_SIZE,
       ARENA_TILES_W * TILE_SIZE,
       2 * TILE_SIZE);

  // Bridges — two gaps in the river where troops can cross
  fill(150, 110, 70);
  rect(ARENA_PX_X + 2 * TILE_SIZE,
       ARENA_PX_Y + 15 * TILE_SIZE,
       3 * TILE_SIZE, 2 * TILE_SIZE);
  rect(ARENA_PX_X + 13 * TILE_SIZE,
       ARENA_PX_Y + 15 * TILE_SIZE,
       3 * TILE_SIZE, 2 * TILE_SIZE);

  // Arena border
  noFill();
  stroke(0);
  strokeWeight(2);
  rect(ARENA_PX_X, ARENA_PX_Y,
       ARENA_TILES_W * TILE_SIZE,
       ARENA_TILES_H * TILE_SIZE);
  noStroke();
}