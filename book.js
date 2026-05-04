/* ============================================================
   book.js — deckbook UI logic (the deck select screen)
   ------------------------------------------------------------
   Wrapped in an IIFE so its locals don't leak into the global
   namespace and clash with the game's globals (bDeck, rDeck,
   troops, etc.). All DOM lookups are scoped to .deckbook-app
   so the script can't accidentally grab game elements.
   ============================================================ */
(function() {
  window.saveDecks = saveDecks;
window.loadDecks = loadDecks;



const HIDDEN_CARDS = new Set([
  // Spell payloads (the actual damage objects, not the playable card)
  "BarrelDeath", "BarrelExplosion", "BombExplosion", "BowlerRock",
  "ElectroGiantPulse", "ElectroPulseBomb", "ExecutionerAxe",
  "FireSpiritExplosion", "GolemDeath", "GolemExplosion",
  "IceBlast", "IceBomb", "IceSpiritFreeze", "MagicArrow",
  "MegaKnightLeapSlam", "RoyalDeliveryImpact",
  // Death-spawn / multi-unit helpers (spawned by other cards)
  "SixLavaPups", "ThreeGoblins", "TwoBarbarians", "TwoSpearGoblins",
  "Skeletons4",
  // Misnamed internal entries
  "ewiz","OneSpearGoblin","Barbarian","GoblinBrawler","OneSkeleton","Bomb","OneGoblin"
]);
const DECKS_STORAGE_KEY = 'user_decks_v1';
const LAST_MODIFIED_KEY = 'last_modified_deck_v1';
let lastModifiedDeck = 0;

function saveDecks() {
  const toSave = decks.map(deck =>
    deck.map(card => card ? card.name : null)
  );
  localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(toSave));
  localStorage.setItem(LAST_MODIFIED_KEY, String(lastModifiedDeck));
}

function loadDecks() {
  try {
    const raw = localStorage.getItem(DECKS_STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    for (let i = 0; i < NUM_DECKS && i < saved.length; i++) {
      decks[i] = saved[i].map(name =>
        name ? CARDS.find(c => c.name === name) || null : null
      );
    }
    const lastIdx = parseInt(localStorage.getItem(LAST_MODIFIED_KEY), 10);
    if (!isNaN(lastIdx)) lastModifiedDeck = lastIdx;
  } catch (err) {
    console.warn('Failed to load saved decks:', err);
  }
}


const CARDS = (typeof cards !== 'undefined' ? cards : [])
  .filter(c => !HIDDEN_CARDS.has(c[0]))
  .map(c => {
    const rawName = c[0];
    const spriteName = (typeof SPRITE_ALIASES !== 'undefined' && SPRITE_ALIASES[rawName])
      ? SPRITE_ALIASES[rawName]
      : rawName;
    return {
      name:   rawName,
      rarity: c[1],
      elixir: c[2],
      spriteName: spriteName
    };
  });

  // ---- State ----
  const NUM_DECKS = 3;
  const decks = Array.from({length: NUM_DECKS}, () => Array(8).fill(null));
  let activeDeckIdx = 0;
  let activeSlotIdx = null;
 

  // ---- DOM refs (all scoped to the deckbook root) ----
  const root = document.querySelector('.deckbook-app');
  if (!root) return; // bail safely if the deckbook markup isn't on this page

  const stage       = root.querySelector('#stage');
  const sidebar     = root.querySelector('#sidebar');
  const cardList    = root.querySelector('#cardList');
  const searchInput = root.querySelector('#searchInput');
  const closeBtn    = root.querySelector('#closeSidebar');


  // ---- Helpers ----
  function getSlotEl(deckIdx, slotIdx) {
    const side = slotIdx < 4 ? 'left' : 'right';
    return root.querySelector(
      `.deck-half[data-deck="${deckIdx}"][data-side="${side}"] .card-slot[data-slot="${slotIdx}"]`
    );
  }

  // ---- Render the card library (sidebar) ----
  function renderLibrary() {
    const q = searchInput.value.trim().toLowerCase();
    const inDeck = new Set(decks[activeDeckIdx].filter(c => c).map(c => c.name));

    const matches = CARDS.filter(c => {
     
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });

    cardList.innerHTML = '';
    if (!matches.length) {
      cardList.innerHTML = '<div class="empty-state">No cards found</div>';
      return;
    }

    matches.forEach(card => {
  const el = document.createElement('div');
  const taken = inDeck.has(card.name);
  el.className = 'lib-card' + (taken ? ' in-deck' : '');
  el.dataset.rarity = card.rarity;

  const sprite = window.sprites && window.sprites[card.spriteName];
  if (sprite) {
    el.innerHTML = `
      <span class="elixir">${card.elixir}</span>
      <img src="${sprite.canvas.toDataURL()}" alt="${card.name}" style="width:100%;height:auto;">
    `;
  } else {
    el.innerHTML = `<span class="elixir">${card.elixir}</span><span>${card.name}</span>`;
  }

  if (!taken) el.addEventListener('click', () => placeCard(card));
  cardList.appendChild(el);
});
  }

  // ---- Sidebar open/close ----
  function openSidebar(deckIdx, slotIdx) {
    activeDeckIdx = deckIdx;
    activeSlotIdx = slotIdx;
    root.querySelectorAll('.card-slot.active').forEach(s => s.classList.remove('active'));
    const slot = getSlotEl(deckIdx, slotIdx);
    if (slot) slot.classList.add('active');
    stage.classList.add('sidebar-open');
    sidebar.classList.add('open');
    renderLibrary();
    setTimeout(() => searchInput.focus(), 300);
  }

  function closeSidebar() {
    stage.classList.remove('sidebar-open');
    sidebar.classList.remove('open');
    root.querySelectorAll('.card-slot.active').forEach(s => s.classList.remove('active'));
    activeSlotIdx = null;
    searchInput.value = '';
  }

  // ---- Add / remove cards from a deck ----
  function placeCard(card) {
    if (activeSlotIdx === null) return;
    if (decks[activeDeckIdx].some(c => c && c.name === card.name)) return; // no dupes
    decks[activeDeckIdx][activeSlotIdx] = card;
      lastModifiedDeck = activeDeckIdx;
    renderDeck(activeDeckIdx);
     saveDecks();
    closeSidebar();
  }

  function removeCard(deckIdx, slotIdx, ev) {
    ev.stopPropagation();
    decks[deckIdx][slotIdx] = null;
    lastModifiedDeck = deckIdx;
    renderDeck(deckIdx);
      saveDecks();
  }

  // ---- Render a deck's 8 slots ----
  function renderDeck(deckIdx) {
    let firstEmpty = -1;
    for (let i = 0; i < 8; i++) {
      const slot = getSlotEl(deckIdx, i);
      if (!slot) continue;
      const card = decks[deckIdx][i];
      slot.classList.remove('hint', 'filled');
      slot.removeAttribute('data-rarity');
      if (card) {
        slot.classList.add('filled');
        slot.dataset.rarity = card.rarity;
       const sprite = window.sprites && window.sprites[card.spriteName];
const inner = sprite
  ? `<img src="${sprite.canvas.toDataURL()}" alt="${card.name}" style="width:100%;height:100%;object-fit:contain;">`
  : `<div class="card-name">${card.name}</div>`;
slot.innerHTML = `
  <span class="elixir-cost">${card.elixir}</span>
  <button class="remove-btn" aria-label="Remove">×</button>
  ${inner}
`;
        slot.querySelector('.remove-btn').addEventListener('click', e => removeCard(deckIdx, i, e));
      } else {
        slot.innerHTML = '';
        if (firstEmpty === -1) firstEmpty = i;
      }
    }
    // The hint pulses on the first empty slot of this deck
    if (firstEmpty !== -1) {
      const hintSlot = getSlotEl(deckIdx, firstEmpty);
      if (hintSlot) {
        hintSlot.classList.add('hint');
        hintSlot.textContent = 'click here to add';
      }
    }
  }

  // ---- Wire up clicks ----
  root.querySelectorAll('.deck-half').forEach(half => {
    const deckIdx = parseInt(half.dataset.deck);
    half.querySelectorAll('.card-slot').forEach(slot => {
      const slotIdx = parseInt(slot.dataset.slot);
      slot.addEventListener('click', e => {
        if (e.target.classList.contains('remove-btn')) return;
        openSidebar(deckIdx, slotIdx);
      });
    });
  });

  closeBtn.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
  });
  searchInput.addEventListener('input', renderLibrary);


  // ---- Initial render ----
 loadDecks();
  for (let i = 0; i < NUM_DECKS; i++) renderDeck(i);
  renderLibrary();

  // ---- Optional: expose decks to the game so it can grab the chosen one ----
  // Your other scripts can read window.deckbookGetDeck(0) to get Deck I, etc.
  window.deckbookGetDeck = (idx) => decks[idx].slice();
  window.deckbookGetLastModified = () => lastModifiedDeck;
  window.onSpritesReady = function() {
  renderLibrary();
  for (let i = 0; i < NUM_DECKS; i++) renderDeck(i);
};

// ============================================================
// SUGGESTED DECKS — populated from window.proDecks (set by ui.js)
// ------------------------------------------------------------
// Each deck is a 8-card list using API names (e.g. "P.E.K.K.A.").
// We map those back to cards in `cards.js` so clicking a deck
// fills all 8 slots of the currently-open deck.
// ============================================================

// Reverse-map: API name → cards.js raw name (handles aliases)
function findCardsJsName(apiName) {
  // First try direct match
  if (CARDS.find(c => c.name === apiName)) return apiName;
  // Then check the alias map (raw → API)
  if (typeof SPRITE_ALIASES !== 'undefined') {
    for (const raw in SPRITE_ALIASES) {
      if (SPRITE_ALIASES[raw] === apiName) {
        if (CARDS.find(c => c.name === raw)) return raw;
      }
    }
  }
  return null;
}

function renderSuggestedDecks() {
  const list = document.getElementById('suggestedDecksList');
  if (!list) return;
  const decks = window.proDecks || [];
  if (!decks.length) {
    list.innerHTML = '<div class="empty-state">Loading…</div>';
    return;
  }

  list.innerHTML = '';
  decks.forEach((deck, deckIdx) => {
    // Resolve each card to its sprite + cards.js name
    const resolved = deck.cards.map(apiName => {
      const cardsJsName = findCardsJsName(apiName);
      const sprite = window.sprites && window.sprites[apiName];
      return { apiName, cardsJsName, sprite };
    });

    // Compute avg elixir from cards.js (skip missing)
    const elixirValues = resolved
      .map(r => r.cardsJsName ? CARDS.find(c => c.name === r.cardsJsName)?.elixir : null)
      .filter(e => typeof e === 'number');
    const avgElixir = elixirValues.length
      ? (elixirValues.reduce((a, b) => a + b, 0) / elixirValues.length).toFixed(1)
      : '—';

    const cardsHTML = resolved.map(r => {
      if (r.sprite) {
        return `<img src="${r.sprite.canvas.toDataURL()}" alt="${r.apiName}">`;
      }
      return `<div class="missing" title="${r.apiName} not in your library">?</div>`;
    }).join('');

    const el = document.createElement('div');
    el.className = 'suggested-deck';
    el.innerHTML = `
      <div class="suggested-deck-cards">${cardsHTML}</div>
      <div class="suggested-deck-meta">
        <span>${deck.count}× played</span>
        <span class="avg-elixir">${avgElixir} elixir</span>
      </div>
    `;
    el.addEventListener('click', () => applySuggestedDeck(deck));
    list.appendChild(el);
  });
}

function applySuggestedDeck(deck) {
  // Build new deck: fill what we can, leave missing slots null
  const newCards = deck.cards.map(apiName => {
    const cardsJsName = findCardsJsName(apiName);
    if (!cardsJsName) return null;
    return CARDS.find(c => c.name === cardsJsName) || null;
  });

  // Apply to the currently-active de
  // ck
  decks[activeDeckIdx] = newCards;
    lastModifiedDeck = activeDeckIdx;
  renderDeck(activeDeckIdx);
  renderLibrary();
   saveDecks();    
}

// Collapse toggle
document.getElementById('suggestedToggle').addEventListener('click', () => {
  document.getElementById('suggestedDecksSection').classList.toggle('collapsed');
});

// Initial render — may be empty if proDecks hasn't loaded yet
renderSuggestedDecks();

// Hook into the load lifecycle so we re-render when proDecks arrives
const originalSpritesReady = window.onSpritesReady;
window.onSpritesReady = function() {
  if (originalSpritesReady) originalSpritesReady();
  renderSuggestedDecks();
};
window.onProDecksReady = function() {
  renderSuggestedDecks();
};


window.startBattleTransition = function(onBlackout) {
  const deckbook = document.getElementById('deckSelectScreen');
  const overlay  = document.getElementById('loadingOverlay');
  const cbCover  = document.getElementById('checkbox-cover');
  const book     = deckbook.querySelector('.book');

  // Open the cover immediately
  cbCover.checked = true;

  // Start riffling pages right after the cover finishes opening (~1s).
  // 300ms between spawns = the slower, deliberate riffle you asked for.
  const RIFFLE_START   = 0;
  const RIFFLE_PERIOD  = 300;
  const PAGES_BEFORE_ZOOM = 0;     // let 3 pages flip before zoom kicks in

  let riffleInterval = null;
  
    riffleInterval = setInterval(() => spawnRifflePage(book), RIFFLE_PERIOD);
  

  // Zoom + darken don't start until we've seen ~3 pages flip
  const ZOOM_START = 0;
  setTimeout(() => {
    deckbook.classList.add('entering-battle');
    overlay.classList.add('active');
  }, ZOOM_START);
  const HIDE_CARDS_AT = 2 * RIFFLE_PERIOD;
setTimeout(() => {
  deckbook.classList.add('cards-hidden');
}, HIDE_CARDS_AT);

  // Blackout 1.4s after zoom starts (matches the scale transition duration)
  const BLACKOUT = ZOOM_START + 4000;
setTimeout(() => {
  clearInterval(riffleInterval);
  if (typeof onBlackout === 'function') onBlackout();
  // Give the new screen one frame to render, then fade the overlay out
  setTimeout(() => overlay.classList.remove('active'), 100);
  resetState();
}, BLACKOUT);
};

function spawnRifflePage(book) {
  const FLIP_MS = 600;
  const page = document.createElement('div');
  page.className = 'page riffle-page';
  page.innerHTML = '<div class="front-page"></div><div class="back-page"></div>';

  // Anchor explicitly to top-left of book (belt-and-suspenders)
  page.style.top = '0';
  page.style.left = '0';
  page.style.zIndex = '50';
  page.style.transition = `transform ${FLIP_MS}ms ease-in`;

  // Insert BEFORE .back-cover so the page sits in the same DOM/layout
  // slot as the original #page1/#page2/#page3 — same static position,
  // same scale behavior, same z-context.
  const backCover = book.querySelector('.back-cover');
  book.insertBefore(page, backCover);

  // Force a layout flush so the browser commits the initial rotateY(0)
  // from the .page CSS rule BEFORE we mutate it. Without this, the
  // browser collapses both states into one and skips the transition —
  // which is the "weird animation" you saw (pages snapping flat instead
  // of flipping).
  void page.offsetHeight;

  page.style.transform = 'rotateY(-180deg)';

  setTimeout(() => page.remove(), FLIP_MS + 100);
}

// Track the page flip — the deck currently being viewed counts as "last touched"
const cover = document.getElementById('checkbox-cover');
const page1 = document.getElementById('checkbox-page1');
const page2 = document.getElementById('checkbox-page2');

function updateActiveDeckFromPage() {
  // Mapping based on which checkboxes are checked:
  //   cover open + page1 open + page2 open  → Deck III
  //   cover open + page1 open                → Deck II
  //   cover open                              → Deck I
  if (page2.checked)      lastModifiedDeck = 2;
  else if (page1.checked) lastModifiedDeck = 1;
  else if (cover.checked) lastModifiedDeck = 0;
  // Cover closed → don't change anything

  saveDecks();   // persist so refreshing keeps the current deck as "last"
}

cover.addEventListener('change', updateActiveDeckFromPage);
page1.addEventListener('change', updateActiveDeckFromPage);
page2.addEventListener('change', updateActiveDeckFromPage);






})();
