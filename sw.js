// ═══════════════════════════════════════════════════════════════
//  src/js/sw.js  —  BLAZEFIST Service Worker
//  Cache-first for all game assets (sprites, MP4, JS modules).
//  Network-first for index.html so updates deploy immediately.
//  Stale-while-revalidate for GitHub raw assets.
// ═══════════════════════════════════════════════════════════════

const CACHE_VERSION  = 'BLAZEFIST-v1';
const STATIC_CACHE   = `${CACHE_VERSION}-static`;
const SPRITE_CACHE   = `${CACHE_VERSION}-sprites`;
const VIDEO_CACHE    = `${CACHE_VERSION}-video`;

const GH_RAW = 'https://raw.githubusercontent.com/beardsleycaleb3-afk/BLAZEFIST/';

// Files to precache on install (shell)
const PRECACHE_URLS = [
  './index.html',
  './manifest.json',
  './src/js/clock.js',
  './assets/sprites/
  './src/js/gameclock.js',
  './src/js/playclock.js',
  './src/js/universalclock.js',
  './src/js/parserclock.js',
  './src/js/renderclock.js',
];

// ── Install ───────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ──────────────────────────────────────────────────
self.addEventListener('activate', event => {
  const valid = new Set([STATIC_CACHE, SPRITE_CACHE, VIDEO_CACHE]);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !valid.has(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch strategy router ─────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // ── 1. MP4 video files → cache-first (large, rarely change)
  if (url.href.endsWith('.mp4')) {
    event.respondWith(videoStrategy(request));
    return;
  }

  // ── 2. PNG sprites from GitHub raw → stale-while-revalidate
  if (url.hostname === 'raw.githubusercontent.com' && url.href.includes('/fight/')) {
    event.respondWith(spriteStrategy(request));
    return;
  }

  // ── 3. Local JS modules & manifest → cache-first
  if (url.href.includes('/esmodules/') || url.href.endsWith('manifest.json')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── 4. index.html → network-first (always get latest)
  if (url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // ── 5. Everything else → network with cache fallback
  event.respondWith(networkFirst(request, STATIC_CACHE));
});

// ── Strategy: Video cache-first ──────────────────────────────
async function videoStrategy(request) {
  const cache    = await caches.open(VIDEO_CACHE);
  const cached   = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request.clone(), { mode: 'cors' });
    if (response.ok) {
      // Store with range-request support flag
      await cache.put(request, response.clone());
    }
    return response;
  } catch(e) {
    return new Response('Video unavailable offline', { status: 503 });
  }
}

// ── Strategy: Sprite stale-while-revalidate ──────────────────
async function spriteStrategy(request) {
  const cache  = await caches.open(SPRITE_CACHE);
  const cached = await cache.match(request);

  // Revalidate in background regardless
  const fetchPromise = fetch(request.clone(), { mode: 'cors' })
    .then(response => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  // Return cached immediately if available, else wait for network
  return cached || fetchPromise || new Response('Sprite unavailable', { status: 503 });
}

// ── Strategy: Cache-first ────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch(e) {
    return new Response('Offline', { status: 503 });
  }
}

// ── Strategy: Network-first with cache fallback ───────────────
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
    }
    return response;
  } catch(e) {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// ── Message handler (cache control from main thread) ──────────
self.addEventListener('message', event => {
  const { type, payload } = event.data || {};

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (type === 'CACHE_SPRITE') {
    // Pre-cache a specific sprite URL sent from the loader
    caches.open(SPRITE_CACHE).then(cache => {
      fetch(payload.url, { mode: 'cors' })
        .then(r => { if (r.ok) cache.put(payload.url, r); })
        .catch(() => {});
    });
  }

  if (type === 'CACHE_VIDEO') {
    caches.open(VIDEO_CACHE).then(cache => {
      fetch(payload.url, { mode: 'cors' })
        .then(r => { if (r.ok) cache.put(payload.url, r); })
        .catch(() => {});
    });
  }

  if (type === 'CLEAR_SPRITE_CACHE') {
    caches.delete(SPRITE_CACHE).then(() =>
      event.source?.postMessage({ type: 'CACHE_CLEARED', cache: 'sprite' })
    );
  }

  if (type === 'STATUS') {
    Promise.all([
      caches.open(STATIC_CACHE).then(c => c.keys()),
      caches.open(SPRITE_CACHE).then(c => c.keys()),
      caches.open(VIDEO_CACHE).then(c => c.keys()),
    ]).then(([s, sp, v]) => {
      event.source?.postMessage({
        type: 'STATUS_REPLY',
        static:  s.length,
        sprites: sp.length,
        videos:  v.length,
      });
    });
  }
});
