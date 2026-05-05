(function() {
  window.saveDecks = saveDecks;
window.loadDecks = loadDecks;



const HIDDEN_CARDS = new Set([
  "BarrelDeath", "BarrelExplosion", "BombExplosion", "BowlerRock",
  "ElectroGiantPulse", "ElectroPulseBomb", "ExecutionerAxe",
  "FireSpiritExplosion", "GolemDeath", "GolemExplosion",
  "IceBlast", "IceBomb", "IceSpiritFreeze", "MagicArrow",
  "MegaKnightLeapSlam", "RoyalDeliveryImpact",
  "SixLavaPups", "ThreeGoblins", "TwoBarbarians", "TwoSpearGoblins",
  "Skeletons4",
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

  const NUM_DECKS = 3;
  const decks = Array.from({length: NUM_DECKS}, () => Array(8).fill(null));
  let activeDeckIdx = 0;
  let activeSlotIdx = null;
 

  const root = document.querySelector('.deckbook-app');
  if (!root) return;

  const stage       = root.querySelector('#stage');
  const sidebar     = root.querySelector('#sidebar');
  const cardList    = root.querySelector('#cardList');
  const searchInput = root.querySelector('#searchInput');
  const closeBtn    = root.querySelector('#closeSidebar');


  function getSlotEl(deckIdx, slotIdx) {
    const side = slotIdx < 4 ? 'left' : 'right';
    return root.querySelector(
      `.deck-half[data-deck="${deckIdx}"][data-side="${side}"] .card-slot[data-slot="${slotIdx}"]`
    );
  }

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

  function placeCard(card) {
    if (activeSlotIdx === null) return;
    if (decks[activeDeckIdx].some(c => c && c.name === card.name)) return;
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
    if (firstEmpty !== -1) {
      const hintSlot = getSlotEl(deckIdx, firstEmpty);
      if (hintSlot) {
        hintSlot.classList.add('hint');
        hintSlot.textContent = 'click here to add';
      }
    }
  }

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


 loadDecks();
  for (let i = 0; i < NUM_DECKS; i++) renderDeck(i);
  renderLibrary();

  window.deckbookGetDeck = (idx) => decks[idx].slice();
  window.deckbookGetLastModified = () => lastModifiedDeck;
  window.onSpritesReady = function() {
  renderLibrary();
  for (let i = 0; i < NUM_DECKS; i++) renderDeck(i);
};

function findCardsJsName(apiName) {
  if (CARDS.find(c => c.name === apiName)) return apiName;
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
    const resolved = deck.cards.map(apiName => {
      const cardsJsName = findCardsJsName(apiName);
      const sprite = window.sprites && window.sprites[apiName];
      return { apiName, cardsJsName, sprite };
    });

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
  const newCards = deck.cards.map(apiName => {
    const cardsJsName = findCardsJsName(apiName);
    if (!cardsJsName) return null;
    return CARDS.find(c => c.name === cardsJsName) || null;
  });

  decks[activeDeckIdx] = newCards;
    lastModifiedDeck = activeDeckIdx;
  renderDeck(activeDeckIdx);
  renderLibrary();
   saveDecks();    
}

document.getElementById('suggestedToggle').addEventListener('click', () => {
  document.getElementById('suggestedDecksSection').classList.toggle('collapsed');
});

renderSuggestedDecks();

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

  cbCover.checked = true;

  const RIFFLE_START   = 0;
  const RIFFLE_PERIOD  = 300;
  const PAGES_BEFORE_ZOOM = 0;

  let riffleInterval = null;
  
    riffleInterval = setInterval(() => spawnRifflePage(book), RIFFLE_PERIOD);
  

  const ZOOM_START = 0;
  setTimeout(() => {
    deckbook.classList.add('entering-battle');
    overlay.classList.add('active');
  }, ZOOM_START);
  const HIDE_CARDS_AT = 2 * RIFFLE_PERIOD;
setTimeout(() => {
  deckbook.classList.add('cards-hidden');
}, HIDE_CARDS_AT);

  const BLACKOUT = ZOOM_START + 4000;
setTimeout(() => {
  clearInterval(riffleInterval);
  if (typeof onBlackout === 'function') onBlackout();
  setTimeout(() => overlay.classList.remove('active'), 100);
  resetState();
}, BLACKOUT);
};

function spawnRifflePage(book) {
  const FLIP_MS = 600;
  const page = document.createElement('div');
  page.className = 'page riffle-page';
  page.innerHTML = '<div class="front-page"></div><div class="back-page"></div>';

  page.style.top = '0';
  page.style.left = '0';
  page.style.zIndex = '50';
  page.style.transition = `transform ${FLIP_MS}ms ease-in`;

  const backCover = book.querySelector('.back-cover');
  book.insertBefore(page, backCover);

  void page.offsetHeight;

  page.style.transform = 'rotateY(-180deg)';

  setTimeout(() => page.remove(), FLIP_MS + 100);
}

const cover = document.getElementById('checkbox-cover');
const page1 = document.getElementById('checkbox-page1');
const page2 = document.getElementById('checkbox-page2');

function updateActiveDeckFromPage() {
  if (page2.checked)      lastModifiedDeck = 2;
  else if (page1.checked) lastModifiedDeck = 1;
  else if (cover.checked) lastModifiedDeck = 0;

  saveDecks();
}

cover.addEventListener('change', updateActiveDeckFromPage);
page1.addEventListener('change', updateActiveDeckFromPage);
page2.addEventListener('change', updateActiveDeckFromPage);

})();