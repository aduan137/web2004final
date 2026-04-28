// ============================================================
// cards.js — card definitions (data only, no logic)
// ------------------------------------------------------------
// Each card follows the original engine's format:
//   [name, rarity, elixirCost, [troop templates], optional extra]
//
// Each troop template is a 24-element positional array:
//   [0]  name          — string, used as sprite/render key
//   [1]  hp            — current health
//   [2]  maxHp         — starts equal to hp
//   [3]  dmg           — damage per hit
//   [4]  x             — spawn OFFSET in tiles (added to click pos)
//   [5]  y             — spawn OFFSET in tiles
//   [6]  size          — hitbox diameter in tiles
//   [7]  mass          — for push/collision (1 = normal)
//   [8]  speed         — 45=slow, 60=medium, 90=fast, 120=very fast
//                       (0 for buildings/towers)
//   [9]  range         — attack range in tiles
//   [10] sightRange    — how far it can see (usually = range or slightly more)
//   [11] cool          — current attack cooldown (start at 0)
//   [12] maxCool       — frames between attacks (at 30 FPS, 30 = 1 sec)
//   [13] ret           — retarget behavior flag (-1 = default)
//   [14] target        — index of current target (-1 = none)
//   [15] lock          — target locked?
//   [16] facingAngle   — 0 = up, 180 = down (set at placement)
//   [17] aoe           — splash radius in tiles (0 = single target)
//   [18] type          — "ground" | "air" | "building" | "spell"
//   [19] targetType    — "all" | "ground" | "air" | "buildings" | "troops" | "none"
//   [20] penalty       — damage multiplier vs crown towers (1 = normal, <1 = reduced)
//   [21] loadTime      — frames before first attack
//   [22] deployTime    — frames of spawn delay (troop can't act yet)
//   [23] effects[]     — status effects (stun, slow, etc.) — starts empty
//
// Stats below are rough approximations of mid-level Clash values.
// Tune to taste later — this is a prototype pool.
// ============================================================


var cards = [
  ["ThreeGoblins", "common", 0, [
  ["goblin", 140, 140, 100, 0, -0.4, 0.4, 1, 90,
   0.5, 5.5, 0, 33, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["goblin", 140, 140, 100, 0, 0, 0.4, 1, 90,
   0.5, 5.5, 0, 33, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["goblin", 140, 140, 100, 0, 0.4, 0.4, 1, 90,
   0.5, 5.5, 0, 33, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []]
]],
["Suspicious Bush", "rare", 3, [
  ["suspicious_bush", 100, 100, 0, 0, 0, 0.6, 4, 60,
   0.5, 5.5, 0, 30, -1, -1, false, 0, 0,
   "ground", "buildings", 1, 30, 30, [],
   [], null, "ThreeGoblins", false, true, null,
   0, 0, 0, 0, -1,
   1                  // [35] stealth flag — always hidden
  ]
]],
["Royal Ghost", "legendary", 3, [
  ["royal_ghost", 1100, 1100, 200, 0, 0, 1.0, 4, 60,
   1.6, 5.5, 0, 45, -1, -1, false, 0, 1.0,
   "ground", "ground", 1, 30, 30, [],
   [], null, null, false, false, null,
   0, 0, 0, 0, -1,
   1                  // [35] stealth flag — starts hidden
  ]
]],
  ["Ice Wizard", "legendary", 3, [
  ["icewizard",
   598, 598,        // hp
   80,              // damage (low — utility card)
   0, 0,            // offsets
   0.6,             // size
   1,               // mass
   60,              // speed
   5.5,             // attack range
   6.0,             // sight range
   0, 51,           // maxCooldown 1.7 sec
   -1, -1, false,
   0, 1.0,          // small AoE on his projectile
   "ground", "all",
   1, 30, 30, [],
   [["slow", 75]]   // ← onHitEffects: slow target for 2.5 sec
  ]
]],
["Royal Knight", "rare", 4, [
  ["royal_knight", 2000, 2000, 200, 0, 0, 1.0, 6, 60,
   1.6, 5.5, 0, 45, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, [],
   [], null, null, false, false, null,
   0, 0,
   60
  ]
]],

["Mighty Miner", "champion", 4, [
  ["mighty_miner", 1100, 1100, 70, 0, 0, 1.0, 4, 60,
   0.6, 5.5, 0, 10, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, [],
   [], null, null, false, false, null,
   0, 0, 0,
   0, -1
  ]
]],

["Inferno Dragon", "legendary", 4, [
  ["inferno_dragon", 700, 700, 30, 0, 0, 1.0, 4, 60,
   4.0, 5.5, 0, 6, -1, -1, false, 0, 0,
   "air", "all", 1, 30, 30, [],
   [], null, null, false, false, null,
   0, 0, 0,
   0, -1
  ]
]],
["Bandit", "legendary", 3, [
  ["bandit", 750, 750, 160, 0, 0, 0.8, 4, 90,
   3.0, 5.5, 0, 36, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []]
]],

  ["Electro Dragon", "epic", 5, [
  ["edragon",
   1116, 1116,      // hp, maxHp (chunkier than ewiz)
   159,             // damage
   0, 0,            // row offset, col offset
   1.5,             // size (bigger — it's a dragon)
   2,               // mass
   60,              // speed (medium)
   3.5,             // attack range (shorter than ewiz, like Baby Dragon)
   5.5,             // sight range
   0, 72,           // cooldown, maxCooldown (slower attacks — 2.4 sec)
   -1, -1, false,   // ret, target, lock
   0, 0,            // facingAngle, aoe
   "air", "all",    // ← KEY: type is "air"
   1, 30, 30, [],   // crownPenalty, loadTime, deployTime, effects
   [["stun", 15]]   // onHitEffects (stun on hit, same as ewiz)
   // no [25] onSpawnSpell — no spawn zap
  ]
]],

["Flying Machine", "rare", 4, [
  ["flying_machine", 305, 305, 138, 0, 0, 0.8, 2, 60,
   6.0, 6.0, 0, 33, -1, -1, false, 0, 0,
   "air", "all", 1, 30, 30, []]
]],
["P.E.K.K.A.", "epic", 7, [
  ["pekka", 3068, 3068, 678, 0, 0, 1.4, 4, 45,
   1.2, 5.5, 0, 54, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []]
]],
["Dart Goblin", "rare", 3, [
  ["dart_goblin", 167, 167, 87, 0, 0, 0.6, 1, 120,
   6.5, 7.0, 0, 21, -1, -1, false, 0, 0,
   "ground", "all", 1, 30, 30, []]
]],
["Mega Minion", "rare", 3, [
  ["mega_minion", 472, 472, 144, 0, 0, 0.8, 2, 60,
   1.6, 5.5, 0, 42, -1, -1, false, 0, 0,
   "air", "all", 1, 30, 30, []]
]],

  ["Electro Wizard", "legendary", 4, [
  // Electro Wizard troop template, expanded:
["ewiz",
 598, 598, 159, 0, 0, 0.6, 1, 60,
 5.0, 5.5, 0, 54, -1, -1, false,
 0, 0,
 "ground", "all",
 1, 30, 30, [],
 [["stun", 15]],   // [24] onHitEffects
 "Zap"             // [25] onSpawnSpell — cast this spell at spawn position
]]],
["Three Musketeers", "rare", 9, [
  ["musketeer3", 720, 720, 200,  0.0, -0.7, 0.8, 1, 60,
   6.0, 6.5, 0, 33, -1, -1, false, 0, 0,
   "ground", "all", 1, 30, 30, []],
  ["musketeer3", 720, 720, 200, -0.6,  0.4, 0.8, 1, 60,
   6.0, 6.5, 0, 33, -1, -1, false, 0, 0,
   "ground", "all", 1, 30, 30, []],
  ["musketeer3", 720, 720, 200,  0.6,  0.4, 0.8, 1, 60,
   6.0, 6.5, 0, 33, -1, -1, false, 0, 0,
   "ground", "all", 1, 30, 30, []]
]],
["Royal Giant", "common", 6, [
  ["royal_giant", 1844, 1844, 240, 0, 0, 1.5, 4, 45,
   5.0, 5.5, 0, 51, -1, -1, false, 0, 0,
   "ground", "buildings", 1, 30, 30, []]
]],
["Hog Rider", "rare", 4, [
  ["hog_rider", 1300, 1300, 264, 0, 0, 1.0, 4, 120,
   1.2, 5.5, 0, 48, -1, -1, false, 0, 0,
   "ground", "buildings", 1, 30, 30, []]
]],
["TwoBarbarians", "common", 0, [
  ["barbarian", 555, 555, 159, -0.5, 0, 1.0, 4, 60,
   1.2, 5.5, 0, 42, -1, -1, false, 0, 0,
   "ground", "ground", 1, 0, 30, []],
  ["barbarian", 555, 555, 159,  0.5, 0, 1.0, 4, 60,
   1.2, 5.5, 0, 42, -1, -1, false, 0, 0,
   "ground", "ground", 1, 0, 30, []]
]],
["Battle Ram", "rare", 4, [
  ["battle_ram", 756, 756, 220, 0, 0, 1.5, 6, 90,
   0.5, 5.5, 0, 30, -1, -1, false, 0, 0,
   "ground", "buildings", 1, 30, 30, [],
   [],            // [24] onHitEffects
   null,          // [25] onSpawnSpell
   "TwoBarbarians", // [26] deathSpawn
   false,         // [27] deathHandled (gets set true after death)
   true           // [28] dieAfterAttack ← NEW FLAG
  ]
]],
["RoyalDeliveryImpact", "common", 0, [
  ["royal_delivery_impact",
   159,     // damage
   2.5,     // radius
   0,       // speed 0 = fixed delay
   0.35,    // crown penalty
   [],      // no effects
   90       // fixedDelay 90 frames = 3 sec wait, matches recruit's deploy
  ]
], "spell"],
["Royal Delivery", "rare", 3, [
  ["royal_recruit", 873, 873, 120, 0, 0, 0.8, 4, 60,
   1.2, 5.5, 0, 36, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 90, [],
   [],
   "RoyalDeliveryImpact",
   null, false, false, null,    // [26-29]
   202, 202                      // [30] shieldMaxHp, [31] shieldHp
  ]
]],

["IceBomb", "epic", 0, [
  ["ice_bomb", 1, 1, 0, 0, 0, 0.5, 0, 0,
   0, 0, 0, 0, -1, -1, false, 0, 0,
   "bomb", "none", 1, 0, 1, [["kamikaze", 1, 1, "IceBlast"]]
  ]
]],
["IceBlast", "epic", 0, [
  ["ice_blast",
   33,
   2.5,
   0,
   0.35,
   [["stun", 15], ["slow", 90]],
   1
  ]
], "spell"],
["Ice Golem", "rare", 2, [
  ["ice_golem", 819, 819, 49, 0, 0, 1.0, 4, 45,
   1.2, 5.5, 0, 75, -1, -1, false, 0, 0,
   "ground", "buildings", 1, 30, 30, [],
   [],            // [24] onHitEffects
   null,          // [25] onSpawnSpell
   "IceBomb"      // [26] deathSpawn ← spawns IceBomb on death
  ]
]],
["Wall Breakers", "epic", 2, [
  ["wall_breaker", 480, 480, 287, -0.4, 0, 0.6, 1, 120,
   0.5, 5.5, 0, 30, -1, -1, false, 0, 1.5,
   "ground", "buildings", 1, 30, 30, [],
   [], null, null, false, true
  ],
  ["wall_breaker", 480, 480, 287, 0.4, 0, 0.6, 1, 120,
   0.5, 5.5, 0, 30, -1, -1, false, 0, 1.5,
   "ground", "buildings", 1, 30, 30, [],
   [], null, null, false, true
  ]
]],
["Guards", "rare", 3, [
  ["guard", 80, 80, 80, 0.0, -0.6, 0.5, 1, 90,
   0.5, 5.5, 0, 30, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, [],
   [], null, null, false, false, null,
   130, 130   // [30] shieldMaxHp, [31] shieldHp
  ],
  ["guard", 80, 80, 80, -0.5,  0.4, 0.5, 1, 90,
   0.5, 5.5, 0, 30, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, [],
   [], null, null, false, false, null,
   130, 130
  ],
  ["guard", 80, 80, 80,  0.5,  0.4, 0.5, 1, 90,
   0.5, 5.5, 0, 30, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, [],
   [], null, null, false, false, null,
   130, 130
  ]
]],
["Witch", "epic", 5, [
  ["witch", 752, 752, 102, 0, 0, 0.8, 1, 60,
   4.0, 5.0, 0, 42, -1, -1, false, 0, 0.6,
   "ground", "all", 1, 30, 30,
   [["summon", 210, 210, "Skeletons4"]],
   [],
   "Skeletons4"
  ]
]],
["Skeletons4", "common", 0, [
  ["skeleton", 80, 80, 80,  0.0, -0.7, 0.5, 1, 90,
   0.5, 5.5, 0, 30, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80,  0.7,  0.0, 0.5, 1, 90,
   0.5, 5.5, 0, 30, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80,  0.0,  0.7, 0.5, 1, 90,
   0.5, 5.5, 0, 30, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80, -0.7,  0.0, 0.5, 1, 90,
   0.5, 5.5, 0, 30, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []]
]],
["Zappies", "rare", 4, [
  ["zappy", 252, 252, 64,  0.0, -0.6, 0.5, 1, 60,
   4.5, 5.0, 0, 54, -1, -1, false, 0, 0,
   "ground", "all", 1, 30, 30, [],
   [["stun", 15]]
  ],
  ["zappy", 252, 252, 64, -0.5,  0.4, 0.5, 1, 60,
   4.5, 5.0, 0, 54, -1, -1, false, 0, 0,
   "ground", "all", 1, 30, 30, [],
   [["stun", 15]]
  ],
  ["zappy", 252, 252, 64,  0.5,  0.4, 0.5, 1, 60,
   4.5, 5.0, 0, 54, -1, -1, false, 0, 0,
   "ground", "all", 1, 30, 30, [],
   [["stun", 15]]
  ]
]],
["Balloon", "epic", 5, [
  ["balloon", 1050, 1050, 600, 0, 0, 1.0, 4, 60,
   1.5, 4.5, 0, 90, -1, -1, false, 0, 0,
   "air", "buildings", 1, 30, 30, [],
   [],         // [24] onHitEffects
   null,       // [25] onSpawnSpell
   "Bomb"      // [26] deathSpawn — spawns existing Bomb on death
  ]
]],
["Royal Hogs", "rare", 5, [
  ["royal_hog", 540, 540, 47, 0, -1.2, 0.7, 3, 120,
   1.2, 5.5, 0, 36, -1, -1, false, 0, 0,
   "ground", "buildings", 1, 30, 30, []],
  ["royal_hog", 540, 540, 47, 0, -0.4, 0.7, 3, 120,
   1.2, 5.5, 0, 36, -1, -1, false, 0, 0,
   "ground", "buildings", 1, 30, 30, []],
  ["royal_hog", 540, 540, 47, 0,  0.4, 0.7, 3, 120,
   1.2, 5.5, 0, 36, -1, -1, false, 0, 0,
   "ground", "buildings", 1, 30, 30, []],
  ["royal_hog", 540, 540, 47, 0,  1.2, 0.7, 3, 120,
   1.2, 5.5, 0, 36, -1, -1, false, 0, 0,
   "ground", "buildings", 1, 30, 30, []]
]],
["Princess", "legendary", 3, [
  ["princess", 240, 240, 159, 0, 0, 0.6, 1, 60,
   11.0, 11.5, 0, 90, -1, -1, false, 0, 1.5,
   "ground", "all", 1, 30, 30, []]
]],
["Prince", "epic", 5, [
  ["prince", 1615, 1615, 325, 0, 0, 1.2, 6, 60,
   1.6, 5.5, 0, 42, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, [],
   [], null, null, false, false, null,
   0, 0,        // [30] [31] no shield
   60           // [32] chargeReady — starts at 60 = ready to charge from spawn
  ]
]],
["Golem", "epic", 8, [
  ["golem", 4263, 4263, 222, 0, 0, 1.6, 8, 45,
   1.2, 5.5, 0, 75, -1, -1, false, 0, 0,
   "ground", "buildings", 1, 30, 240, [],
   [], null, "GolemDeath",   // [26] deathSpawn
   false, false, null
  ]
]],
["GolemExplosion", "epic", 0, [
  ["golem_explosion",
   332,     // damage — moderate area damage (Golem death damage in Clash)
   2.5,     // radius
   0,       // speed = 0
   0.35,    // crown penalty
   [],      // no effects
   1        // fixedDelay
  ]
], "spell"],
["GolemDeath", "common", 0, [
  // Death-explosion bomb
  ["golem_bomb", 1, 1, 0, 0, 0, 0.5, 0, 0,
   0, 0, 0, 0, -1, -1, false, 0, 0,
   "bomb", "none", 1, 0, 1, [["kamikaze", 1, 1, "GolemExplosion"]]
  ],
  // First Golemite (no death explosion)
  ["golemite", 766, 766, 159, 0, -0.5, 1.0, 4, 45,
   1.2, 5.5, 0, 50, -1, -1, false, 0, 0,
   "ground", "buildings", 1, 30, 30, []
  ],
  // Second Golemite
  ["golemite", 766, 766, 159, 0, 0.5, 1.0, 4, 45,
   1.2, 5.5, 0, 50, -1, -1, false, 0, 0,
   "ground", "buildings", 1, 30, 30, []
  ]
]],
["Rascals", "common", 5, [
  ["rascal_boy", 1148, 1148, 100, 0.7, 0, 1.0, 4, 60,
   1.2, 5.5, 0, 36, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["rascal_girl", 244, 244, 70, -0.5, -0.5, 0.5, 1, 60,
   5.5, 6.0, 0, 30, -1, -1, false, 0, 0,
   "ground", "all", 1, 30, 30, []],
  ["rascal_girl", 244, 244, 70, -0.5,  0.5, 0.5, 1, 60,
   5.5, 6.0, 0, 30, -1, -1, false, 0, 0,
   "ground", "all", 1, 30, 30, []]
]],
["Bats", "common", 2, [
  ["bat", 67, 67, 67,  0.0, -0.6, 0.5, 1, 90,
   1.6, 5.5, 0, 39, -1, -1, false, 0, 0,
   "air", "all", 1, 30, 30, []],
  ["bat", 67, 67, 67,  0.6,  0.0, 0.5, 1, 90,
   1.6, 5.5, 0, 39, -1, -1, false, 0, 0,
   "air", "all", 1, 30, 30, []],
  ["bat", 67, 67, 67,  0.0,  0.6, 0.5, 1, 90,
   1.6, 5.5, 0, 39, -1, -1, false, 0, 0,
   "air", "all", 1, 30, 30, []],
  ["bat", 67, 67, 67, -0.6,  0.0, 0.5, 1, 90,
   1.6, 5.5, 0, 39, -1, -1, false, 0, 0,
   "air", "all", 1, 30, 30, []]
]],
["Hunter", "legendary", 4, [
  ["hunter", 871, 871, 211, 0, 0, 0.8, 4, 60,
   5.0, 5.5, 0, 84, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []]
]],
["Dark Prince", "epic", 4, [
  ["dark_prince", 1117, 1117, 195, 0, 0, 1.0, 6, 60,
   1.5, 5.5, 0, 42, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, [],
   [], null, null, false, false, null,
   161, 161,    // [30] [31] shield 161
   60           // [32] chargeReady (starts charged)
  ]
]],
["Royal Recruits", "common", 7, [
  ["royal_recruit", 873, 873, 120, 0, -7.2, 0.8, 4, 60,
   1.2, 5.5, 0, 36, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, [],
   [], null, null, false, false, null,
   202, 202
  ],
  ["royal_recruit", 873, 873, 120, 0, -4.32, 0.8, 4, 60,
   1.2, 5.5, 0, 36, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, [],
   [], null, null, false, false, null,
   202, 202
  ],
  ["royal_recruit", 873, 873, 120, 0, -1.44, 0.8, 4, 60,
   1.2, 5.5, 0, 36, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, [],
   [], null, null, false, false, null,
   202, 202
  ],
  ["royal_recruit", 873, 873, 120, 0,  1.44, 0.8, 4, 60,
   1.2, 5.5, 0, 36, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, [],
   [], null, null, false, false, null,
   202, 202
  ],
  ["royal_recruit", 873, 873, 120, 0,  4.32, 0.8, 4, 60,
   1.2, 5.5, 0, 36, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, [],
   [], null, null, false, false, null,
   202, 202
  ],
  ["royal_recruit", 873, 873, 120, 0,  7.2, 0.8, 4, 60,
   1.2, 5.5, 0, 36, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, [],
   [], null, null, false, false, null,
   202, 202
  ]
]],
["Goblin Giant", "epic", 6, [
  ["goblin_giant", 2700, 2700, 159, 0, 0, 1.4, 7, 75,
   1.2, 5.5, 0, 51, -1, -1, false, 0, 0,
   "ground", "buildings", 1, 30, 30, [],
   [], null, "TwoSpearGoblins"
  ]
]],
["TwoSpearGoblins", "common", 0, [
  ["spear_goblin", 100, 100, 64, 0, -0.4, 0.4, 1, 90,
   5.0, 5.5, 0, 51, -1, -1, false, 0, 0,
   "ground", "all", 1, 30, 30, []],
  ["spear_goblin", 100, 100, 64, 0,  0.4, 0.4, 1, 90,
   5.0, 5.5, 0, 51, -1, -1, false, 0, 0,
   "ground", "all", 1, 30, 30, []]
]],

["Skeleton Army", "epic", 3, [
  ["skeleton", 80, 80, 80,  0.6,  0.0, 0.5, 1, 90,
   0.5, 5.5, 50, 60, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80,  0.42, 0.42, 0.5, 1, 90,
   0.5, 5.5, 50, 60, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80,  0.0,  0.6, 0.5, 1, 90,
   0.5, 5.5, 50, 60, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80, -0.42, 0.42, 0.5, 1, 90,
   0.5, 5.5, 50, 60, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80, -0.6,  0.0, 0.5, 1, 90,
   0.5, 5.5, 50, 60, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80, -0.42,-0.42, 0.5, 1, 90,
   0.5, 5.5, 50, 60, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80,  0.0, -0.6, 0.5, 1, 90,
   0.5, 5.5, 50, 60, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80,  0.42,-0.42, 0.5, 1, 90,
   0.5, 5.5, 50, 60, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80,  0.3,  0.0, 0.5, 1, 90,
   0.5, 5.5, 50, 60, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80,  0.21, 0.21, 0.5, 1, 90,
   0.5, 5.5, 50, 60, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80,  0.0,  0.3, 0.5, 1, 90,
   0.5, 5.5, 50, 60, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80, -0.21, 0.21, 0.5, 1, 90,
   0.5, 5.5, 50, 60, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80, -0.3,  0.0, 0.5, 1, 90,
   0.5, 5.5, 50, 60, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80, -0.21,-0.21, 0.5, 1, 90,
   0.5, 5.5, 50, 60, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80,  0.21,-0.21, 0.5, 1, 90,
   0.5, 5.5, 50, 60, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []]
]],

["Elite Barbarians", "common", 6, [
  ["elite_barbarian", 970, 970, 301, -0.5, 0, 1.0, 4, 120,
   1.2, 5.5, 0, 51, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["elite_barbarian", 970, 970, 301,  0.5, 0, 1.0, 4, 120,
   1.2, 5.5, 0, 51, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []]
]],
["Skeleton Dragons", "common", 4, [
  ["skeleton_dragon", 380, 380, 92, -0.5, 0, 1.0, 2, 60,
   3.5, 4.0, 0, 48, -1, -1, false, 1.5, 0,
   "air", "all", 1, 30, 30, []],
  ["skeleton_dragon", 380, 380, 92,  0.5, 0, 1.0, 2, 60,
   3.5, 4.0, 0, 48, -1, -1, false, 1.5, 0,
   "air", "all", 1, 30, 30, []]
]],

["Minion Horde", "common", 5, [
  ["minion", 190, 190, 85,  0.0, -0.7, 0.6, 1, 90,
   1.7, 2.0, 0, 30, -1, -1, false, 0, 0,
   "air", "all", 1, 30, 30, []],
  ["minion", 190, 190, 85, -0.6, -0.4, 0.6, 1, 90,
   1.7, 2.0, 0, 30, -1, -1, false, 0, 0,
   "air", "all", 1, 30, 30, []],
  ["minion", 190, 190, 85,  0.6, -0.4, 0.6, 1, 90,
   1.7, 2.0, 0, 30, -1, -1, false, 0, 0,
   "air", "all", 1, 30, 30, []],
  ["minion", 190, 190, 85, -0.7,  0.3, 0.6, 1, 90,
   1.7, 2.0, 0, 30, -1, -1, false, 0, 0,
   "air", "all", 1, 30, 30, []],
  ["minion", 190, 190, 85,  0.7,  0.3, 0.6, 1, 90,
   1.7, 2.0, 0, 30, -1, -1, false, 0, 0,
   "air", "all", 1, 30, 30, []],
  ["minion", 190, 190, 85,  0.0,  0.6, 0.6, 1, 90,
   1.7, 2.0, 0, 30, -1, -1, false, 0, 0,
   "air", "all", 1, 30, 30, []]
]],

["Goblin Gang", "common", 3, [
  ["goblin", 140, 140, 120,  0.0, -0.4, 0.5, 1, 120,
   0.5, 5.5, 0, 33, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["goblin", 140, 140, 120, -0.5,  0.3, 0.5, 1, 120,
   0.5, 5.5, 0, 33, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["goblin", 140, 140, 120,  0.5,  0.3, 0.5, 1, 120,
   0.5, 5.5, 0, 33, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],

  ["speargoblin", 100, 100, 55,  0.0, -1.0, 0.5, 1, 120,
   5.0, 5.5, 0, 51, -1, -1, false, 0, 0,
   "ground", "all", 1, 30, 30, []],
  ["speargoblin", 100, 100, 55, -0.7, -0.7, 0.5, 1, 120,
   5.0, 5.5, 0, 51, -1, -1, false, 0, 0,
   "ground", "all", 1, 30, 30, []],
  ["speargoblin", 100, 100, 55,  0.7, -0.7, 0.5, 1, 120,
   5.0, 5.5, 0, 51, -1, -1, false, 0, 0,
   "ground", "all", 1, 30, 30, []]
]],
  // ===== ZAP — instant lightning strike =====
["Zap", "common", 2, [
  ["zap",
    159,             // damage
    2.5,             // AoE radius
    0,               // speed = 0 → fixed-delay spell, not a projectile
    0.3,             // crown tower damage penalty (game-file value)
    [["stun", 15]],  // 15-frame stun (0.5s at 30fps)
    5                // fixed delay in frames (only used when speed === 0)
  ]
], "spell"],
  // ===== FIREBALL — classic AoE spell =====
["Fireball", "rare", 4, [
  ["fireball",
    572,     // damage
    2.5,     // radius
    1280,    // speed — was 7.0
    0.35,    // penalty
    []
  ]
], "spell"],  
["BombExplosion", "epic", 0, [
  ["bomb_explosion",
   1144,    // damage
   3.0,     // AoE radius
   0,       // speed = 0 means "appears at target instantly"
   0.35,    // crown penalty
   [],      // no effects
   1        // fixedDelay = 1 frame (essentially instant)
  ]
], "spell"],

["Arrows", "common", 3, [
  ["arrows",
    142,     // damage (relatively low — kills swarms, not tanks)
    4.0,     // AoE radius (much bigger than Fireball — arrow spread)
    1800,    // speed (fastest spell — they're arrows, not a heavy ball)
    0.35,    // tower damage penalty
    []       // no extra effects
  ]
], "spell"],// ← new 5th element on the outer card array, marks this as a spell

  // ===== 1. KNIGHT — cheap melee tank =====
   ["Knight", "common", 3, [
    ["knight", 2400, 2400, 160, 0, 0, 1.0, 1, 60, 1.2, 5.5, 0, 40, -1, -1, false, 0, 0, "ground", "ground", 1, 30, 30, []]
  ]],

  // ===== 2. ARCHERS — spawns 2 ranged units =====
  ["Archers", "common", 3, [
    ["archer", 250, 250, 90, -0.5, 0, 0.6, 1, 60,
     5.0, 5.5, 0, 36, -1, -1, false, 0, 0,
     "ground", "all", 1, 30, 30, []],
    ["archer", 250, 250, 90,  0.5, 0, 0.6, 1, 60,
     5.0, 5.5, 0, 36, -1, -1, false, 0, 0,
     "ground", "all", 1, 30, 30, []]
  ]],

  // ===== 3. GIANT — big slow tank, targets buildings only =====
  ["Giant", "rare", 5, [
    ["giant", 3500, 3500, 230, 0, 0, 1.5, 3, 45, 1.2, 1.2, 0, 45, -1, -1, false, 0, 0, "ground", "buildings", 1, 30, 30, []]
  ]],
  ["Giant Skeleton", "epic", 6, [
  ["giant_skeleton",
   2127, 2127, 159, 0, 0, 1.5, 4, 45,
   1.2, 5.5, 0, 45, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, [],
   [],          // [24] onHitEffects — none
   null,        // [25] onSpawnSpell — none
   "Bomb"       // [26] deathSpawn — spawns Bomb card on death
  ]
]],

  // ===== MINI P.E.K.K.A. =====
  ["Mini P.E.K.K.A.", "rare", 4, [
    ["minipekka", 1200, 1200, 550, 0, 0, 0.8, 1, 90,
     1.2, 5.5, 0, 54, -1, -1, false, 0, 0,   // ← sight 5.5
     "ground", "ground", 1, 30, 30, []]
  ]],


  // ===== 5. MUSKETEER — ranged single-target =====
  ["Musketeer", "rare", 4, [
    ["musketeer", 720, 720, 200, 0, 0, 0.8, 1, 60,
     6.0, 6.5, 0, 33, -1, -1, false, 0, 0,
     "ground", "all", 1, 30, 30, []]
  ]],

  // ===== 6. MINIONS — 3 flying units =====
  ["Minions", "common", 3, [
    ["minion", 190, 190, 85,  0.0, -0.5, 0.6, 1, 90,
     1.7, 2.0, 0, 30, -1, -1, false, 0, 0,
     "air", "all", 1, 30, 30, []],
    ["minion", 190, 190, 85, -0.6,  0.3, 0.6, 1, 90,
     1.7, 2.0, 0, 30, -1, -1, false, 0, 0,
     "air", "all", 1, 30, 30, []],
    ["minion", 190, 190, 85,  0.6,  0.3, 0.6, 1, 90,
     1.7, 2.0, 0, 30, -1, -1, false, 0, 0,
     "air", "all", 1, 30, 30, []]
  ]],

  // ===== 7. BABY DRAGON — flying splash =====
  ["Baby Dragon", "epic", 4, [
    ["babydragon", 1050, 1050, 160, 0, 0, 1.1, 2, 60,
     3.5, 4.0, 0, 48, -1, -1, false, 1.5, 0,
     "air", "all", 1, 30, 30, []]
  ]],

   // ===== SKELETONS =====
  ["Skeletons", "common", 1, [
    ["skeleton", 80, 80, 80,  0.0, -0.4, 0.5, 1, 90,
     0.5, 5.5, 0, 30, -1, -1, false, 0, 0,   // ← sight 5.5
     "ground", "ground", 1, 30, 30, []],
    ["skeleton", 80, 80, 80, -0.5, 0.3, 0.5, 1, 90,
     0.5, 5.5, 0, 30, -1, -1, false, 0, 0,
     "ground", "ground", 1, 30, 30, []],
    ["skeleton", 80, 80, 80,  0.5, 0.3, 0.5, 1, 90,
     0.5, 5.5, 0, 30, -1, -1, false, 0, 0,
     "ground", "ground", 1, 30, 30, []]
  ]],

  // ===== GOBLINS =====
  ["Goblins", "common", 2, [
    ["goblin", 140, 140, 120,  0.0, -0.4, 0.5, 1, 120,
     0.5, 5.5, 0, 33, -1, -1, false, 0, 0,   // ← sight 5.5
     "ground", "ground", 1, 30, 30, []],
    ["goblin", 140, 140, 120, -0.5, 0.3, 0.5, 1, 120,
     0.5, 5.5, 0, 33, -1, -1, false, 0, 0,
     "ground", "ground", 1, 30, 30, []],
    ["goblin", 140, 140, 120,  0.5, 0.3, 0.5, 1, 120,
     0.5, 5.5, 0, 33, -1, -1, false, 0, 0,
     "ground", "ground", 1, 30, 30, []]
  ]],

  // ===== 10. SPEAR GOBLINS — 3 cheap ranged =====
  ["Spear Goblins", "common", 2, [
    ["speargoblin", 100, 100, 55,  0.0, -0.4, 0.5, 1, 120,
     5.0, 5.5, 0, 51, -1, -1, false, 0, 0,
     "ground", "all", 1, 30, 30, []],
    ["speargoblin", 100, 100, 55, -0.5, 0.3, 0.5, 1, 120,
     5.0, 5.5, 0, 51, -1, -1, false, 0, 0,
     "ground", "all", 1, 30, 30, []],
    ["speargoblin", 100, 100, 55,  0.5, 0.3, 0.5, 1, 120,
     5.0, 5.5, 0, 51, -1, -1, false, 0, 0,
     "ground", "all", 1, 30, 30, []]
  ]],

  // ===== VALKYRIE =====
 ["Valkyrie", "rare", 4, [
    ["valkyrie", 1800, 1800, 195, 0, 0, 1.2, 2, 60,
     0.2, 5.5, 0, 45, -1, -1, false, 1.2, 1.8,
     "ground", "ground", 1, 30, 30, []]
  ]],

  // ===== 12. BOMBER — ranged AoE (ground only) =====
  ["Bomber", "common", 3, [
    ["bomber", 280, 280, 150, 0, 0, 0.7, 1, 60,
     4.5, 5.5, 0, 54, -1, -1, false, 1.5, 0,
     "ground", "ground", 1, 30, 30, []]
  ]],

  // ===== 13. WIZARD — ranged AoE, hits air & ground =====
  ["Wizard", "rare", 5, [
    ["wizard", 880, 880, 190, 0, 0, 0.9, 1, 60,
     5.5, 6.0, 0, 42, -1, -1, false, 1.5, 40,
     "ground", "all", 1, 30, 30, []]
  ]],

  // ===== BARBARIANS =====
  ["Barbarians", "common", 5, [
    ["barbarian", 680, 680, 150, -0.8, -0.5, 0.8, 1, 60,
     1.2, 5.5, 0, 45, -1, -1, false, 0, 0,   // ← sight 5.5
     "ground", "ground", 1, 30, 30, []],
    ["barbarian", 680, 680, 150,  0.8, -0.5, 0.8, 1, 60,
     1.2, 5.5, 0, 45, -1, -1, false, 0, 0,
     "ground", "ground", 1, 30, 30, []],
    ["barbarian", 680, 680, 150, -0.8,  0.5, 0.8, 1, 60,
     1.2, 5.5, 0, 45, -1, -1, false, 0, 0,
     "ground", "ground", 1, 30, 30, []],
    ["barbarian", 680, 680, 150,  0.8,  0.5, 0.8, 1, 60,
     1.2, 5.5, 0, 45, -1, -1, false, 0, 0,
     "ground", "ground", 1, 30, 30, []]
  ]],
  ["Bomb", "epic", 0, [
  ["bomb", 1, 1, 0, 0, 0, 0.5, 0, 0,
   0, 0, 0, 0, -1, -1, false, 0, 0,
   "bomb", "none", 1, 0, 30, [["kamikaze", 30, 1, "BombExplosion"]]
  ]
]],
["IceSpiritFreeze", "common", 0, [
  ["ice_spirit_freeze",
   90,
   0.25,
   0,
   0.35,
   [["stun", 30]],
   12              // ← was 1, now 12 frames = 0.4 sec at 30fps
  ]
], "spell"],
["Ice Spirit", "common", 1, [
  ["ice_spirit", 133, 133, 90, 0, 0, 0.5, 1, 90,
   1.8, 4.0, 0, 1, -1, -1, false, 0, 0,
//  
   "ground", "all", 1, 30, 30, []]
]],

["Electro Spirit", "common", 1, [
  ["electro_spirit", 133, 133, 90, 0, 0, 0.5, 1, 90,
   2.5, 4.0, 0, 1, -1, -1, false, 0, 0,
   "ground", "all", 1, 30, 30, []]
]],
["FireSpiritExplosion", "common", 0, [
  ["fire_spirit_explosion",
   145,
   1.0,
   0,
   0.35,
   [],
   12
  ]
], "spell"],
["Fire Spirit", "common", 1, [
  ["fire_spirit", 133, 133, 145, 0, 0, 0.5, 1, 90,
   2.5, 4.0, 0, 1, -1, -1, false, 0, 0,
   "ground", "all", 1, 30, 30, []]
]],
["Skeleton Barrel", "common", 3, [
  ["skeleton_barrel", 595, 595, 0, 0, 0, 1.0, 4, 60,
   1.5, 5.5, 0, 60, -1, -1, false, 0, 0,
   "air", "buildings", 1, 30, 30, [],
   [], null, "BarrelDeath",
   false, true, null
  ]
]],
["Berserker", "rare", 3, [
  ["berserker", 350, 350, 50, 0, 0, 0.6, 1, 90,
   0.6, 5.0, 0, 6, -1, -1, false, 0, 0,
//          ↑ 0 = no windup, swings instantly when in range
   "ground", "ground", 1, 30, 30, []]
]],
["BarrelExplosion", "epic", 0, [
  ["barrel_explosion",
   126,                  // 90% of goblin HP
   1.5,                  // radius
   0,                    // speed = 0
   0.35,                 // crown penalty
   [],                   // no effects
   1                     // fixedDelay 1 frame
  ]
], "spell"],
["BarrelDeath", "common", 0, [
  // The exploding bomb
  ["barrel_bomb", 1, 1, 0, 0, 0, 0.5, 0, 0,
   0, 0, 0, 0, -1, -1, false, 0, 0,
   "bomb", "none", 1, 0, 1, [["kamikaze", 1, 1, "BarrelExplosion"]]
  ],
  // 7 skeletons around the death point
  ["skeleton", 80, 80, 80,  0.0, -0.7, 0.5, 1, 90,
   0.5, 5.5, 0, 30, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80,  0.6, -0.35, 0.5, 1, 90,
   0.5, 5.5, 0, 30, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80,  0.6,  0.35, 0.5, 1, 90,
   0.5, 5.5, 0, 30, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80,  0.0,  0.7, 0.5, 1, 90,
   0.5, 5.5, 0, 30, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80, -0.6,  0.35, 0.5, 1, 90,
   0.5, 5.5, 0, 30, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80, -0.6, -0.35, 0.5, 1, 90,
   0.5, 5.5, 0, 30, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []],
  ["skeleton", 80, 80, 80,  0.0,  0.0, 0.5, 1, 90,
   0.5, 5.5, 0, 30, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []]
]],
["SixLavaPups", "common", 0, [
  ["lava_pup", 100, 100, 56,  0.7,  0.0, 0.5, 1, 90,
   2.0, 5.5, 0, 36, -1, -1, false, 0, 0,
   "air", "all", 1, 30, 30, []],
  ["lava_pup", 100, 100, 56,  0.42, 0.42, 0.5, 1, 90,
   2.0, 5.5, 0, 36, -1, -1, false, 0, 0,
   "air", "all", 1, 30, 30, []],
  ["lava_pup", 100, 100, 56, -0.42, 0.42, 0.5, 1, 90,
   2.0, 5.5, 0, 36, -1, -1, false, 0, 0,
   "air", "all", 1, 30, 30, []],
  ["lava_pup", 100, 100, 56, -0.7,  0.0, 0.5, 1, 90,
   2.0, 5.5, 0, 36, -1, -1, false, 0, 0,
   "air", "all", 1, 30, 30, []],
  ["lava_pup", 100, 100, 56, -0.42,-0.42, 0.5, 1, 90,
   2.0, 5.5, 0, 36, -1, -1, false, 0, 0,
   "air", "all", 1, 30, 30, []],
  ["lava_pup", 100, 100, 56,  0.42,-0.42, 0.5, 1, 90,
   2.0, 5.5, 0, 36, -1, -1, false, 0, 0,
   "air", "all", 1, 30, 30, []]
]],
["Lava Hound", "legendary", 7, [
  ["lava_hound", 3000, 3000, 36, 0, 0, 1.6, 8, 30,
   1.9, 5.5, 0, 90, -1, -1, false, 0, 0,
//   ↑ 1.75 = half of 3.5
   "air", "buildings", 1, 30, 30, [],
   [], null, "SixLavaPups"
  ]
]],

["ElectroGiantPulse", "common", 0, [
  ["electro_giant_pulse",
   126,                  // damage
   1.5,                  // radius (1 tile around the giant + edge slack)
   0,                    // speed = 0 → fixed delay
   0.35,                 // crown penalty
   [["stun", 9]],        // 0.3 sec stun
   1                     // fixedDelay 1 frame (instant)
  ]
], "spell"],
["ElectroPulseBomb", "common", 0, [
  ["electro_pulse_bomb", 1, 1, 0, 0, 0, 0.5, 0, 0,
   0, 0, 0, 0, -1, -1, false, 0, 0,
   "bomb", "none", 1, 0, 1, [["kamikaze", 1, 1, "ElectroGiantPulse"]]
  ]
]],
["Electro Giant", "epic", 7, [
  ["electro_giant", 2900, 2900, 159, 0, 0, 1.5, 7, 45,
   1.2, 5.5, 0, 75, -1, -1, false, 0, 0,
   "ground", "buildings", 1, 30, 30,
   [["summon", 15, 15, "ElectroPulseBomb"]]
  ]
]],
["BowlerRock", "epic", 0, [
  ["bowler_rock",
   288,            // damage
   0.5,            // radius (half of Log)
   180,            // speed
   0.35,           // crown penalty
   [],             // no effects
   0,              // no delay
   "rolling",      // is rolling
   3.18,           // roll distance (7/11 of 5)
   0.6,            // knockSmall
   0.2             // knockBig
  ]
], "spell"],
["Bowler", "epic", 5, [
  ["bowler", 1717, 1717, 80, 0, 0, 1.0, 4, 45,
   5.0, 5.5, 0, 75, -1, -1, false, 0, 0,
   "ground", "ground", 1, 30, 30, []]
]],
["The Log", "legendary", 2, [
  ["log",
   240,
   1.6,
   180,
   0.4,
   [],
   15,                  // delay
   "rolling",
   10                   // ← roll distance (was implicit 5, now explicit 10)
  ]
], "spell"],
["Executioner", "legendary", 5, [
  ["executioner", 700, 700, 90, 0, 0, 1.0, 4, 60,
   4.5, 5.5, 0, 75, -1, -1, false, 0, 0,
   "ground", "all", 1, 30, 30, []]
]],
["ExecutionerAxe", "epic", 0, [
  ["executioner_axe",
   90,             // damage per pass
   0.4,            // radius (width)
   200,            // speed
   0.35,           // crown penalty
   [],             // no effects
   0,              // no delay
   "piercing",     // new spell type
   3               // pierce range (forward distance)
  ]
], "spell"],
["MagicArrow", "epic", 0, [
  ["magic_arrow",
   90,            // damage per pierce
   0.5,           // narrow width
   600,           // fast speed
   0.35,          // crown penalty
   [],            // no effects
   0,             // no delay
   "rolling",     // pierces through enemies
   16,            // very long roll distance (~half the arena)
   0, 0           // ← knockback set to 0 — no push
  ]
], "spell"],
["Magic Archer", "legendary", 4, [
  ["magic_archer", 596, 596, 90, 0, 0, 0.6, 1, 60,
   7.0, 7.5, 0, 36, -1, -1, false, 0, 0,
   "ground", "all", 1, 30, 30, []]
]],
["Ram Rider", "legendary", 5, [
  ["ram_rider", 1400, 1400, 250, 0, 0, 1.0, 6, 90,
   1.0, 5.5, 0, 60, -1, -1, false, 0, 0,
   "ground", "buildings", 1, 30, 30, [],
   [], null, null, false, false, null,
   0, 0, 0,             // [30][31][32] no shield/charge
   0                    // [33] secondaryCooldown for snare attack
  ]
]],
["Sparky", "legendary", 6, [
  ["sparky", 1100, 1100, 1014, 0, 0, 1.0, 6, 45,
   6.5, 7.0, 0, 240, -1, -1, false, 0, 4.0,
//                ↑ was 150, now 240 (8 sec)
   "ground", "ground", 1, 30, 30, []]
]],
["Firecracker", "common", 3, [
  ["firecracker", 244, 244, 50, 0, 0, 0.5, 1, 60,
   6.0, 6.5, 0, 90, -1, -1, false, 0, 0,
   "ground", "all", 1, 30, 30, []]
]],
["MegaKnightLeapSlam", "epic", 0, [
  ["mega_knight_slam",
   400,
   1.5,
   0,
   0.35,
   [],
   5                   // ← was 1, now 30 frames = 1 sec delay
  ]
], "spell"],
["Mega Knight", "legendary", 7, [
  ["mega_knight", 3000, 3000, 170, 0, 0, 1.4, 8, 60,
   5, 5.5, 0, 50, -1, -1, false, 0, 0,
//             ↑↑ was 90, now 11 (0.35 sec attack rate)
   "ground", "all", 1, 30, 30, [],
   [],
   "MegaKnightSlam"
  ]
]],

  // ===== 15. CANNON — defensive building =====
  ["Cannon", "common", 3, [
    ["cannon", 740, 740, 125, 0, 0, 1.0, 100, 0,
     5.5, 5.5, 0, 24, -1, -1, false, 0, 0,
     "building", "ground", 1, 30, 30,
     [["lifetime", 900]]]  // disappears after 30 seconds (900 frames)
  ]]

];

function isSpellCard(cardIdx) {
  return cards[cardIdx][4] === "spell";
}

// ============================================================
// Helper lookups — makes the rest of the code easier to read.
// Use these instead of remembering which index means what.
// ============================================================

function getCardByName(name) {
  for (var i = 0; i < cards.length; i++) {
    if (cards[i][0] === name) return i;
  }
  return -1;
}

function getCardCost(cardIndex)  { return cards[cardIndex][2]; }
function getCardName(cardIndex)  { return cards[cardIndex][0]; }
function getCardTroops(cardIndex){ return cards[cardIndex][3]; }

function getOnHitEffects(troop) {
  return troop[24] || [];
}
// ============================================================
// deepCopyTroop — IMPORTANT!
// ------------------------------------------------------------
// When a player plays a card, we need a FRESH copy of the troop
// template — not a reference. Otherwise the first Knight would
// share its hp/position/cooldown with every other Knight ever spawned.
// This is the #1 source of weird bugs in the original engine.
// ============================================================
function deepCopyTroop(troopTemplate) {
  var copy = [];
  for (var i = 0; i < troopTemplate.length; i++) {
    var val = troopTemplate[i];
    if (Array.isArray(val)) {
      // Effects array and special array — copy recursively
      var arrCopy = [];
      for (var j = 0; j < val.length; j++) {
        if (Array.isArray(val[j])) {
          arrCopy.push(val[j].slice());
        } else {
          arrCopy.push(val[j]);
        }
      }
      copy.push(arrCopy);
    } else {
      copy.push(val);
    }
  }
  return copy;
}