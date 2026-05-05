
function drawTroop(troop, team) {
  var stealthAlpha = (troop[35] === 1) ? 128 : 255;

  var name   = troop[0];
  var hp     = troop[1];
  var maxHp  = troop[2];
  var x      = tileToPx(troop[5]);
  var y      = tileToPx(troop[4]);
  var baseSize = troop[6] * TILE_SIZE;
  
  if (troop[22] > 0 && troop[0] === "royal_recruit") return;

  // ----- SHARED: animation lerp + scale -----
  var animScale = 1.0;
  if (troop[38] > 0) {
    var animDuration;
    if (troop[0] === "bandit") animDuration = 5;
    else if (troop[0] === "mega_knight") animDuration = 8;
    else animDuration = 30;

    var progress = troop[38] / animDuration;
    var lerpedRow = troop[4] + (troop[36] - troop[4]) * progress;
    var lerpedCol = troop[5] + (troop[37] - troop[5]) * progress;
    x = tileToPx(lerpedCol);
    y = tileToPx(lerpedRow);

    if (troop[0] === "mega_knight") {
      var animProgress = 1 - progress;
      animScale = 1 + 0.8 * Math.sin(animProgress * Math.PI);
    }
    troop[38]--;
  }

  var pulseAmount = 0;
  if (troop[9] >= 2 && troop[12] > 0 && troop[11] > 0) {
    var pulseProgress = troop[11] / troop[12];
    pulseAmount = 0.4 * Math.pow(pulseProgress, 8);
  }
  baseSize = baseSize * animScale;
  var size = baseSize * (1 + pulseAmount);

  
  var facingDx = 0;
  var facingDy = 0;
  var enemies = (team === "blue") ? rTroops : bTroops;
  var tgtIdx = troop[14];
  if (tgtIdx >= 0 && tgtIdx < enemies.length && enemies[tgtIdx][1] > 0) {
    facingDx = enemies[tgtIdx][5] - troop[5];
    facingDy = enemies[tgtIdx][4] - troop[4];
  }
  if (facingDx === 0 && facingDy === 0) {
    facingDy = (team === "blue") ? -1 : 1;
  }
  var drawAngle = Math.atan2(facingDy, facingDx);

  var swingOffset = 0;
  if (troop[9] < 2 && troop[12] > 0 && troop[11] > 0) {
    var swingProgress = troop[11] / troop[12];
    swingOffset = 0.6 * Math.pow(swingProgress, 8);
  }

  // ----- SHARED: stun check -----
  var stunned = false;
  if (troop[23]) {
    for (var e = 0; e < troop[23].length; e++) {
      if (troop[23][e][0] === "stun" && troop[23][e][1] > 0) {
        stunned = true;
        break;
      }
    }
  }

  
 var cardName = troop[39];
if (!cardName || !sprites[cardName]) {
   
    push();
    translate(x, y);
    rotate(drawAngle + swingOffset);
 

    noStroke();
    if (stunned)              fill(255, 230, 0, stealthAlpha);
     else if (raged) { fill(255, 80, 200, stealthAlpha); }
    else if (team === "blue") fill(40, 80, 255, stealthAlpha);
    else                      fill(230, 40, 40, stealthAlpha);
    rect(-size/2, -size/2, size, size);

    
pop();

// Label
fill(255);
noStroke();
textAlign(CENTER, CENTER);
if (troop[0] === "ctower") {
  textSize(10);
  textStyle(BOLD);
  text("KING", x, y);
  textStyle(NORMAL);
} else if (troop[0] === "ptower") {
  // blank — no label
} else {
  textSize(8);
  text(name.substring(0, 4), x, y);
}
textAlign(LEFT, BASELINE);
textSize(10);
  
  } else {
   
    push();
    translate(x, y);
    rotate(drawAngle + swingOffset+ Math.PI /2);
    imageMode(CENTER);
       
    var raged = false;
if (troop[23]) {
  for (var r = 0; r < troop[23].length; r++) {
    if (troop[23][r][0] === "rage" && troop[23][r][1] > 0) {
      raged = true;
      break;
    }
  }
}

    if (stunned)                   tint(255, 230, 0, stealthAlpha);
    else if (raged)                tint(255, 80, 200, stealthAlpha);
    else if (stealthAlpha < 255)   tint(255, stealthAlpha);

   image(sprites[cardName], 0, 0, size*1.3, size*1.95);
    noTint();
    pop();
  }


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

  
  if (troop[30] > 0 && troop[31] > 0) {
    var shieldBarW = size;
    var shieldBarH = 4;
    var shieldBarX = x - shieldBarW / 2;
    var shieldBarY = y - size / 2 - 12;

    noStroke();
    fill(40);
    rect(shieldBarX, shieldBarY, shieldBarW, shieldBarH);
    fill(180, 180, 220);
    rect(shieldBarX, shieldBarY, shieldBarW * (troop[31] / troop[30]), shieldBarH);
  }


  if (hp < maxHp && hp > 0) {
    var barW = size;
    var barH = 4;
    var barX = x - barW / 2;
   var barY = (team === "red")
  ? y + size / 2 + 4    
  : y - size / 2 - 8;   
    noStroke();
    fill(40);
    rect(barX, barY, barW, barH);

    var pct = hp / maxHp;
    if      (pct > 0.5)  fill(50, 200, 50);
    else if (pct > 0.25) fill(230, 200, 50);
    else                 fill(220, 50, 50);
    rect(barX, barY, barW * pct, barH);
  }

  
  if (troop[0] === "sparky" && troop[11] <= 0) {
    noStroke();
    var pulseAlpha = 150 + Math.sin(frameCount * 0.2) * 80;
    fill(80, 160, 255, pulseAlpha);
    ellipse(x, y - size/2 - 18, 12, 12);
  }
}

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
function drawArena() {
  // Base layer: warm pale gold (the "mortar" between stones)
  noStroke();
  fill(180, 165, 120);
  rect(ARENA_PX_X, ARENA_PX_Y,
       ARENA_TILES_W * TILE_SIZE,
       ARENA_TILES_H * TILE_SIZE);

  // Cobblestones — varied shades of pale gold per tile
  for (var r = 0; r < ARENA_TILES_H; r++) {
   for (var c = 0; c < ARENA_TILES_W; c++) {
      
      var seed = (r * 7 + c * 13) % 5;
      var stoneR, stoneG, stoneB;
      if (seed === 0)      { stoneR = 210; stoneG = 195; stoneB = 150; }
      else if (seed === 1) { stoneR = 200; stoneG = 185; stoneB = 140; }
      else if (seed === 2) { stoneR = 220; stoneG = 200; stoneB = 155; }
      else if (seed === 3) { stoneR = 195; stoneG = 180; stoneB = 135; }
      else                 { stoneR = 215; stoneG = 200; stoneB = 160; }

      fill(stoneR, stoneG, stoneB);
      // Inset by 1 pixel to leave a tiny "mortar" gap between stones
      rect(ARENA_PX_X + c * TILE_SIZE + 1,
           ARENA_PX_Y + r * TILE_SIZE + 1,
           TILE_SIZE - 2, TILE_SIZE - 2);
    }
  }

  // River across the middle (rows 15-16)
  fill(80, 140, 200);
  rect(ARENA_PX_X,
       ARENA_PX_Y + 15 * TILE_SIZE,
       ARENA_TILES_W * TILE_SIZE,
       2 * TILE_SIZE);

  // Bridges — cobblestone matching the rest
  fill(180, 160, 120);
  rect(ARENA_PX_X + 2 * TILE_SIZE,
       ARENA_PX_Y + 15 * TILE_SIZE,
       3 * TILE_SIZE, 2 * TILE_SIZE);
  rect(ARENA_PX_X + 13 * TILE_SIZE,
       ARENA_PX_Y + 15 * TILE_SIZE,
       3 * TILE_SIZE, 2 * TILE_SIZE);
        
       noFill();
  stroke(0);
  strokeWeight(2);
  rect(ARENA_PX_X, ARENA_PX_Y,
       ARENA_TILES_W * TILE_SIZE,
       ARENA_TILES_H * TILE_SIZE);
  noStroke();


}