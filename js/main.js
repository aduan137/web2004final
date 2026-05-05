
var gamePhase = "deckSelect";  


var frame = 0;
var sprites = {};
function preload() {

}


function setup() {
  var canvas = createCanvas(290, 520);
  canvas.parent("gameContainer");

  frameRate(30);
  textSize(10);
  textAlign(LEFT, BASELINE);
  noCursor();

  if (gamePhase === "battle") {
    document.getElementById("deckSelectScreen").style.display = "none";
    document.getElementById("battleScreen").style.display = "flex";
  }

  if (typeof buildDeckSelectUI === "function") {
    buildDeckSelectUI(startBattle);
  } else {
    console.warn("buildDeckSelectUI not defined yet — ui.js is a stub.");
  }
}




function startBattle(selectedDeck) {
  console.log("Starting battle with deck:", selectedDeck);

 
  bDeck = selectedDeck;


  if (typeof resetState === "function") {
    resetState();
  }

  // Swap screens
  document.getElementById("deckSelectScreen").style.display = "none";
  document.getElementById("battleScreen").style.display = "flex";

  gamePhase = "battle";
}



function draw() {
  
  
  if (gamePhase !== "battle") return;

  frame++;

 
  if (typeof updateElixir === "function")       updateElixir();
  if (typeof updateWaves === "function")        updateWaves();       
  if (typeof updateTroops === "function")       updateTroops(); 
  if (typeof resolveOverlaps === "function") resolveOverlaps();       
  if (typeof updateProjectiles === "function")  updateProjectiles();  
  if (typeof resolveCollisions === "function")  resolveCollisions();  
  if (typeof cleanupDead === "function")        cleanupDead();       
   if (typeof updateSpells === "function") updateSpells();

  // ---- RENDER PHASE ----
  background(200, 200, 200);

  

  if (typeof drawArena === "function")  drawArena();
  else                                  drawArenaPlaceholder();


  if (typeof drawTroops === "function")       drawTroops();
  if (typeof drawProjectiles === "function")  drawProjectiles();
  if (typeof drawUI === "function")           drawUI();
 
// ...
if (typeof drawSpells === "function") drawSpells();

 
  else                                        drawUIPlaceholder();


 
  drawCursor();

 
  if (typeof checkGameOver === "function") checkGameOver();
}



function drawArenaPlaceholder() {
  // Arena boundary (matches original's rect at 59,59,271,481,
  // though I've centered it here for the placeholder).
  stroke(0);
  strokeWeight(1);
  noFill();
  rect(60, 60, 480, 480);

  // River in the middle
  noStroke();
  fill(100, 150, 200);
  rect(60, 290, 480, 30);

  // Blue (player) towers — bottom half
  fill(0, 0, 200);
  rect(140, 460, 50, 50);   // left princess
  rect(280, 510, 50, 50);   // king (placeholder center-bottom)
  rect(420, 460, 50, 50);   // right princess

  
  fill(200, 0, 0);
  rect(140, 90, 50, 50);
  rect(280, 60, 50, 50);
  rect(420, 90, 50, 50);

  
  fill(0);
  textSize(14);
  textAlign(CENTER);
  text("Arena placeholder — frame " + frame, width / 2, 40);
  textAlign(LEFT);
  textSize(10);
}

function drawUIPlaceholder() {
  
  fill(80);
  noStroke();
  rect(60, 570, 480, 20);

  var e = (typeof elixir === "number") ? elixir : 0;
  var maxE_local = (typeof maxE === "number") ? maxE : 10;
  fill(200, 50, 200);
  rect(60, 570, 480 * (e / maxE_local), 20);

  // Elixir number
  fill(255);
  textAlign(CENTER);
  textSize(14);
  text(e.toFixed(1) + " / " + maxE_local, 300, 585);
  textAlign(LEFT);
  textSize(10);
}

function drawCursor() {
  noFill();
  stroke(0, 0, 0, mouseIsPressed ? 200 : 100);
  ellipse(mouseX, mouseY, 10, 10);
  ellipse(mouseX, mouseY, 1, 1);
}
function checkGameOver() {
 

  var pKing = bTroops[0];
  if (pKing && pKing[0] === "KING" && pKing[1] <= 0) {
    endBattle("loss");
  }
}

function endBattle(result) {
  if (gamePhase === "gameOver") return;   // don't re-trigger every frame
  gamePhase = "gameOver";
  document.getElementById('gameOverScreen').style.display = 'flex';
  document.getElementById('gameOverResult').textContent =
    result === "win" ? "VICTORY" : "DEFEAT";
}

function returnToDeckSelect() {
  
  document.getElementById('gameOverScreen').style.display = 'none';
  document.getElementById('battleScreen').style.display = 'none';


  var deckbook = document.getElementById('deckSelectScreen');
  deckbook.classList.remove('entering-battle', 'cards-hidden');
  document.getElementById('checkbox-cover').checked = false;
  document.getElementById('checkbox-page1').checked = false;
  document.getElementById('checkbox-page2').checked = false;

  
  document.getElementById('placeholderBattleBtn').style.display = '';


  deckbook.style.display = '';
  if (typeof resetState === "function") resetState();
  if (typeof resetWaves === "function") resetWaves();

  gamePhase = "deckSelect";
  
document.getElementById('bgMusic').play();   
}


document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("gameOverReturnBtn");
  if (btn) btn.addEventListener("click", returnToDeckSelect);
});