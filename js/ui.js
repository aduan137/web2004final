// ============================================================
// ui.js — placeholder battle button + sprite loader
// ============================================================
// ============================================================
// PRO DECKS — fetched from leaderboard players, cached locally
// ------------------------------------------------------------
// Pulls battlelogs from a slice of mid-leaderboard players
// (rank 800-850, where decks are meta but not weird-tech).
// Cached in localStorage for 6 hours so we don't hammer the API.
// ============================================================

const DECKS_CACHE_KEY = 'pro_decks_cache_v1';
const DECKS_CACHE_HOURS = 6;

window.proDecks = [];   // global, read by book.js

async function loadProDecks() {
  // 1. Check localStorage cache first
  try {
    const cached = JSON.parse(localStorage.getItem(DECKS_CACHE_KEY));
    if (cached && cached.decks && cached.time) {
      const ageHours = (Date.now() - cached.time) / (1000 * 60 * 60);
      if (ageHours < DECKS_CACHE_HOURS) {
        window.proDecks = cached.decks;
        console.log(`Pro decks loaded from cache (${ageHours.toFixed(1)}h old)`);
        if (typeof onProDecksReady === 'function') onProDecksReady();
        return;
      }
    }
  } catch (err) {
    // bad/corrupted cache — fall through to fresh fetch
  }

  // 2. No fresh cache → fetch from API
  console.log('Pro decks cache stale or missing, fetching fresh data...');
  try {
    const decks = await fetchDecksFromLeaderboard();
    window.proDecks = decks;
    localStorage.setItem(DECKS_CACHE_KEY, JSON.stringify({
      time: Date.now(),
      decks: decks
    }));
    console.log(`Pro decks fetched: ${decks.length} unique decks`);
    if (typeof onProDecksReady === 'function') onProDecksReady();
  } catch (err) {
    console.error('Pro decks fetch failed:', err);
  }
}

async function fetchDecksFromLeaderboard() {
  const TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImViYTM4OWU4LTFlOGQtNDQ5Zi05ZWNkLTFkNzdkMjk3NzgyZSIsImlhdCI6MTc3NzUwNDM5OCwic3ViIjoiZGV2ZWxvcGVyLzAyMGQ4MjMyLTZkM2EtMzBhYS04YWQ1LTIzYTlmN2I4YWFjMyIsInNjb3BlcyI6WyJyb3lhbGUiXSwibGltaXRzIjpbeyJ0aWVyIjoiZGV2ZWxvcGVyL3NpbHZlciIsInR5cGUiOiJ0aHJvdHRsaW5nIn0seyJjaWRycyI6WyI0NS43OS4yMTguNzkiXSwidHlwZSI6ImNsaWVudCJ9XX0.0_Ik5sJoRI9SXxeqtYeC6BQoneFKuK_n0SbNbLVpk3Tnr4t7ihTY8LsuZKQLnSRTcdeeVi-bN_OV7LwdjBqa8Q';   // same token as loadCardSprites
  const PROXY = 'https://proxy.royaleapi.dev/v1';

  async function api(path) {
    const r = await fetch(PROXY + path, {
      headers: { Authorization: 'Bearer ' + TOKEN }
    });
    if (!r.ok) throw new Error(`${path} → ${r.status}`);
    return r.json();
  }

  // Get top 1000, slice 800-850
  const lb = await api('/locations/global/pathoflegend/players?limit=1000');
  const slice = lb.items.slice(799, 850);

  const deckCounts = new Map();   // key → { cards, count }

  for (const player of slice) {
    try {
      const tag = player.tag.replace('#', '');
      const battles = await api(`/players/%23${tag}/battlelog`);
      for (const b of battles) {
        if (!b.team || !b.team[0] || !b.team[0].cards) continue;
        const cards = b.team[0].cards.map(c => c.name).sort();
        if (cards.length !== 8) continue;
        const key = cards.join('|');
        if (!deckCounts.has(key)) deckCounts.set(key, { cards, count: 0 });
        deckCounts.get(key).count++;
      }
    } catch (err) {
      // Skip individual player failures, keep going
    }
    await new Promise(r => setTimeout(r, 200));   // throttle
  }

  // Top 12 most common
  return [...deckCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}
window.sprites = window.sprites || {};

document.querySelectorAll('.opponent-card').forEach(btn => {
  btn.addEventListener('click', () => {
    const aiDeckChoice = parseInt(btn.dataset.aiDeck, 10);
    aiDeckIndex = aiDeckChoice;

    // Set up the battle
    bDeck = window.pendingPlayerDeck;
    bOrder = [0, 1, 2, 3, 4, 5, 6, 7];

    if (typeof resetWaves === 'function') resetWaves();

    document.getElementById('opponentSelectScreen').style.display = 'none';
    document.getElementById('battleScreen').style.display = '';
    gamePhase = 'battle';
    resetState();
  });
});

window.addEventListener('load', async () => {
  try {
    await Promise.all([
      loadCardSprites(),
      loadProDecks()
    ]);
    if (typeof onSpritesReady === 'function') onSpritesReady();
    if (typeof onProDecksReady === 'function') onProDecksReady();

    // Done loading: hide the "Loading…" text, reveal the Continue button.
    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('loadingContinueBtn').style.display = '';
  } catch (err) {
    console.error('Load failed:', err);
    const msg = document.getElementById('loadingMessage');
    if (msg) msg.textContent = 'Failed to load — check console';
  }
});

// Continue button dismisses the whole loading screen
document.getElementById('loadingContinueBtn').addEventListener('click', () => {
  document.getElementById('loadingScreen').style.display = 'none';
});

function showApp() {
  const ls = document.getElementById('loadingScreen');
  if (ls) ls.style.display = 'none';
}

async function loadCardSprites() {
  const TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImViYTM4OWU4LTFlOGQtNDQ5Zi05ZWNkLTFkNzdkMjk3NzgyZSIsImlhdCI6MTc3NzUwNDM5OCwic3ViIjoiZGV2ZWxvcGVyLzAyMGQ4MjMyLTZkM2EtMzBhYS04YWQ1LTIzYTlmN2I4YWFjMyIsInNjb3BlcyI6WyJyb3lhbGUiXSwibGltaXRzIjpbeyJ0aWVyIjoiZGV2ZWxvcGVyL3NpbHZlciIsInR5cGUiOiJ0aHJvdHRsaW5nIn0seyJjaWRycyI6WyI0NS43OS4yMTguNzkiXSwidHlwZSI6ImNsaWVudCJ9XX0.0_Ik5sJoRI9SXxeqtYeC6BQoneFKuK_n0SbNbLVpk3Tnr4t7ihTY8LsuZKQLnSRTcdeeVi-bN_OV7LwdjBqa8Q';
  const res = await fetch('https://proxy.royaleapi.dev/v1/cards', {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  const data = await res.json();

  const iconByName = {};
  for (const c of data.items) {
    if (c.iconUrls?.medium) iconByName[c.name] = c.iconUrls.medium;
  }
  const PROXY = 'https://cr-image-proxy.duanaaron137.workers.dev/';

  const promises = [];
  for (const card of cards) { 
    const cardName = card[0];
    const rawUrl = iconByName[cardName];
if (!rawUrl) continue;
const url = `${PROXY}?url=${encodeURIComponent(rawUrl)}`;
   

    if (!url) continue;
    promises.push(new Promise(resolve => {
      loadImage(url,
        img => { window.sprites[cardName] = img; resolve(); },
        err => { console.warn('Failed:', cardName, err); resolve(); }
      );
    }));
  }
  await Promise.all(promises);
  console.log('Sprites loaded:', Object.keys(window.sprites).length);
}

// Wire up the placeholder button
document.getElementById('placeholderBattleBtn').addEventListener('click', () => {
  // Validate the player's deck first
  const idx = window.deckbookGetLastModified();
  const chosenDeck = window.deckbookGetDeck(idx);
  if (chosenDeck.some(c => c === null)) {
    alert('Fill all 8 cards in your deck before battling.');
    return;
  }
  const cardIndices = chosenDeck.map(card =>
    cards.findIndex(c => c[0] === card.name)
  );
  if (cardIndices.some(i => i === -1)) {
    alert('Some cards in this deck are not playable.');
    return;
  }

  // Stash deck for later (opponent picker reads this)
  window.pendingPlayerDeck = cardIndices;

  // Hide the battle button so it doesn't sit on top of the inflating book
  document.getElementById('placeholderBattleBtn').style.display = 'none';

  // Play the page-flip + zoom animation. When it fades to black,
  // swap to the opponent picker.
  window.startBattleTransition(() => {
    document.getElementById('deckSelectScreen').style.display = 'none';
    document.getElementById('opponentSelectScreen').style.display = '';

    // Populate the four opponent card images
    ["Balloon", "P.E.K.K.A", "Golem", "Goblin Barrel"].forEach((name, i) => {
      const sprite = window.sprites && window.sprites[name];
      const img = document.getElementById('opponentImg' + i);
      if (sprite) img.src = sprite.canvas.toDataURL();
    });
  });
});




// Stub the deckbook bridge
function buildDeckSelectUI(onStart) {}