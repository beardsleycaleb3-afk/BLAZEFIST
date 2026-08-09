const CACHE_NAME = 'fight-game-assets-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  
  // Backgrounds
  './assets/sprites/stages/backgrounds/stage1.png',
  './assets/sprites/stages/backgrounds/stage2.png',
  './assets/sprites/stages/backgrounds/stage3.png',
  './assets/sprites/stages/backgrounds/stage4.png',
  './assets/sprites/stages/backgrounds/stage5.png',
  './assets/sprites/stages/backgrounds/stage6.png',
  './assets/sprites/stages/backgrounds/stage7.png',
  './assets/sprites/stages/backgrounds/stage8.png',
  './assets/sprites/stages/backgrounds/stage9.png',

  // ---------------------------------------------------------------------------
  // 1. assets/sprites/fighter/east/ (Videos & Subfolders)
  // ---------------------------------------------------------------------------
  './assets/sprites/fighter/east/32hitnormal.mp4',
  './assets/sprites/fighter/east/fireset1.mp4',
  './assets/sprites/fighter/east/fireset2.mp4',
  './assets/sprites/fighter/east/fireset3.mp4',
  './assets/sprites/fighter/east/fireset4.mp4',
  './assets/sprites/fighter/east/normalrun.mp4',
  './assets/sprites/fighter/east/tigerset1.mp4',
  './assets/sprites/fighter/east/ultimatetiger.mp4',

  // East - cross
  './assets/sprites/fighter/east/cross/frame_000.png',
  './assets/sprites/fighter/east/cross/frame_001.png',
  './assets/sprites/fighter/east/cross/frame_002.png',
  './assets/sprites/fighter/east/cross/frame_003.png',
  './assets/sprites/fighter/east/cross/frame_004.png',
  './assets/sprites/fighter/east/cross/frame_005.png',

  // East - crouch
  './assets/sprites/fighter/east/crouch/frame_000.png',
  './assets/sprites/fighter/east/crouch/frame_001.png',
  './assets/sprites/fighter/east/crouch/frame_002.png',
  './assets/sprites/fighter/east/crouch/frame_003.png',
  './assets/sprites/fighter/east/crouch/frame_004.png',
  './assets/sprites/fighter/east/crouch/frame_005.png',

  // East - die
  './assets/sprites/fighter/east/die/frame_000.png',
  './assets/sprites/fighter/east/die/frame_001.png',
  './assets/sprites/fighter/east/die/frame_002.png',
  './assets/sprites/fighter/east/die/frame_003.png',
  './assets/sprites/fighter/east/die/frame_004.png',
  './assets/sprites/fighter/east/die/frame_005.png',

  // East - fireball
  './assets/sprites/fighter/east/fireball/frame_000.png',
  './assets/sprites/fighter/east/fireball/frame_001.png',
  './assets/sprites/fighter/east/fireball/frame_002.png',
  './assets/sprites/fighter/east/fireball/frame_003.png',
  './assets/sprites/fighter/east/fireball/frame_004.png',
  './assets/sprites/fighter/east/fireball/frame_005.png',

  // East - getup
  './assets/sprites/fighter/east/getup/frame_000.png',
  './assets/sprites/fighter/east/getup/frame_001.png',
  './assets/sprites/fighter/east/getup/frame_002.png',
  './assets/sprites/fighter/east/getup/frame_003.png',
  './assets/sprites/fighter/east/getup/frame_004.png',
  './assets/sprites/fighter/east/getup/frame_005.png',

  // East - idle
  './assets/sprites/fighter/east/idle/frame_000.png',
  './assets/sprites/fighter/east/idle/frame_001.png',
  './assets/sprites/fighter/east/idle/frame_002.png',
  './assets/sprites/fighter/east/idle/frame_003.png',
  './assets/sprites/fighter/east/idle/frame_004.png',
  './assets/sprites/fighter/east/idle/frame_005.png',
  './assets/sprites/fighter/east/idle/frame_006.png',
  './assets/sprites/fighter/east/idle/frame_007.png',

  // East - jab
  './assets/sprites/fighter/east/jab/frame_000.png',
  './assets/sprites/fighter/east/jab/frame_001.png',
  './assets/sprites/fighter/east/jab/frame_002.png',

  // East - kick
  './assets/sprites/fighter/east/kick/frame_000.png',
  './assets/sprites/fighter/east/kick/frame_001.png',
  './assets/sprites/fighter/east/kick/frame_002.png',
  './assets/sprites/fighter/east/kick/frame_003.png',
  './assets/sprites/fighter/east/kick/frame_004.png',
  './assets/sprites/fighter/east/kick/frame_005.png',

  // East - run
  './assets/sprites/fighter/east/run/frame_000.png',
  './assets/sprites/fighter/east/run/frame_001.png',
  './assets/sprites/fighter/east/run/frame_002.png',
  './assets/sprites/fighter/east/run/frame_003.png',
  './assets/sprites/fighter/east/run/frame_004.png',
  './assets/sprites/fighter/east/run/frame_005.png',
  './assets/sprites/fighter/east/run/frame_006.png',
  './assets/sprites/fighter/east/run/frame_007.png',

  // East - takehit
  './assets/sprites/fighter/east/takehit/frame_000.png',
  './assets/sprites/fighter/east/takehit/frame_001.png',
  './assets/sprites/fighter/east/takehit/frame_002.png',
  './assets/sprites/fighter/east/takehit/frame_003.png',
  './assets/sprites/fighter/east/takehit/frame_004.png',
  './assets/sprites/fighter/east/takehit/frame_005.png',

  // East - throw
  './assets/sprites/fighter/east/throw/frame_000.png',
  './assets/sprites/fighter/east/throw/frame_001.png',
  './assets/sprites/fighter/east/throw/frame_002.png',
  './assets/sprites/fighter/east/throw/frame_003.png',
  './assets/sprites/fighter/east/throw/frame_004.png',
  './assets/sprites/fighter/east/throw/frame_005.png',

  // East - transform
  './assets/sprites/fighter/east/transform/frame_000.png',
  './assets/sprites/fighter/east/transform/frame_001.png',
  './assets/sprites/fighter/east/transform/frame_002.png',
  './assets/sprites/fighter/east/transform/frame_003.png',
  './assets/sprites/fighter/east/transform/frame_004.png',
  './assets/sprites/fighter/east/transform/frame_005.png',

  // East - uppercut
  './assets/sprites/fighter/east/uppercut/frame_000.png',
  './assets/sprites/fighter/east/uppercut/frame_001.png',
  './assets/sprites/fighter/east/uppercut/frame_002.png',
  './assets/sprites/fighter/east/uppercut/frame_003.png',
  './assets/sprites/fighter/east/uppercut/frame_004.png',
  './assets/sprites/fighter/east/uppercut/frame_005.png',
  './assets/sprites/fighter/east/uppercut/frame_006.png',

  // ---------------------------------------------------------------------------
  // 2. assets/sprites/fighter/flaming/east/ (Subfolders)
  // ---------------------------------------------------------------------------
  // Flaming East - cross
  './assets/sprites/fighter/flaming/east/cross/frame_000.png',
  './assets/sprites/fighter/flaming/east/cross/frame_001.png',
  './assets/sprites/fighter/flaming/east/cross/frame_002.png',
  './assets/sprites/fighter/flaming/east/cross/frame_003.png',
  './assets/sprites/fighter/flaming/east/cross/frame_004.png',
  './assets/sprites/fighter/flaming/east/cross/frame_005.png',

  // Flaming East - headbutt
  './assets/sprites/fighter/flaming/east/headbutt/frame_000.png',
  './assets/sprites/fighter/flaming/east/headbutt/frame_001.png',
  './assets/sprites/fighter/flaming/east/headbutt/frame_002.png',
  './assets/sprites/fighter/flaming/east/headbutt/frame_003.png',
  './assets/sprites/fighter/flaming/east/headbutt/frame_004.png',
  './assets/sprites/fighter/flaming/east/headbutt/frame_005.png',
  './assets/sprites/fighter/flaming/east/headbutt/frame_006.png',
  './assets/sprites/fighter/flaming/east/headbutt/frame_007.png',
  './assets/sprites/fighter/flaming/east/headbutt/frame_008.png',
  './assets/sprites/fighter/flaming/east/headbutt/frame_009.png',
  './assets/sprites/fighter/flaming/east/headbutt/frame_010.png',

  // Flaming East - idle
  './assets/sprites/fighter/flaming/east/idle/frame_000.png',
  './assets/sprites/fighter/flaming/east/idle/frame_001.png',
  './assets/sprites/fighter/flaming/east/idle/frame_002.png',
  './assets/sprites/fighter/flaming/east/idle/frame_003.png',
  './assets/sprites/fighter/flaming/east/idle/frame_004.png',
  './assets/sprites/fighter/flaming/east/idle/frame_005.png',
  './assets/sprites/fighter/flaming/east/idle/frame_006.png',
  './assets/sprites/fighter/flaming/east/idle/frame_007.png',

  // Flaming East - jab
  './assets/sprites/fighter/flaming/east/jab/frame_000.png',
  './assets/sprites/fighter/flaming/east/jab/frame_001.png',
  './assets/sprites/fighter/flaming/east/jab/frame_002.png',

  // Flaming East - jump
  './assets/sprites/fighter/flaming/east/jump/frame_000.png',
  './assets/sprites/fighter/flaming/east/jump/frame_001.png',
  './assets/sprites/fighter/flaming/east/jump/frame_002.png',
  './assets/sprites/fighter/flaming/east/jump/frame_003.png',
  './assets/sprites/fighter/flaming/east/jump/frame_004.png',
  './assets/sprites/fighter/flaming/east/jump/frame_005.png',
  './assets/sprites/fighter/flaming/east/jump/frame_006.png',
  './assets/sprites/fighter/flaming/east/jump/frame_007.png',

  // Flaming East - kick
  './assets/sprites/fighter/flaming/east/kick/frame_000.png',
  './assets/sprites/fighter/flaming/east/kick/frame_001.png',
  './assets/sprites/fighter/flaming/east/kick/frame_002.png',
  './assets/sprites/fighter/flaming/east/kick/frame_003.png',
  './assets/sprites/fighter/flaming/east/kick/frame_004.png',
  './assets/sprites/fighter/flaming/east/kick/frame_005.png',

  // Flaming East - punch
  './assets/sprites/fighter/flaming/east/punch/frame_000.png',
  './assets/sprites/fighter/flaming/east/punch/frame_001.png',
  './assets/sprites/fighter/flaming/east/punch/frame_002.png',
  './assets/sprites/fighter/flaming/east/punch/frame_003.png',
  './assets/sprites/fighter/flaming/east/punch/frame_004.png',
  './assets/sprites/fighter/flaming/east/punch/frame_005.png',

  // Flaming East - roundhouse
  './assets/sprites/fighter/flaming/east/roundhouse/frame_000.png',
  './assets/sprites/fighter/flaming/east/roundhouse/frame_001.png',
  './assets/sprites/fighter/flaming/east/roundhouse/frame_002.png',
  './assets/sprites/fighter/flaming/east/roundhouse/frame_003.png',
  './assets/sprites/fighter/flaming/east/roundhouse/frame_004.png',
  './assets/sprites/fighter/flaming/east/roundhouse/frame_005.png',
  './assets/sprites/fighter/flaming/east/roundhouse/frame_006.png',

  // Flaming East - run
  './assets/sprites/fighter/flaming/east/run/frame_000.png',
  './assets/sprites/fighter/flaming/east/run/frame_001.png',
  './assets/sprites/fighter/flaming/east/run/frame_002.png',
  './assets/sprites/fighter/flaming/east/run/frame_003.png',
  './assets/sprites/fighter/flaming/east/run/frame_004.png',
  './assets/sprites/fighter/flaming/east/run/frame_005.png',
  './assets/sprites/fighter/flaming/east/run/frame_006.png',
  './assets/sprites/fighter/flaming/east/run/frame_007.png',

  // Flaming East - uppercut
  './assets/sprites/fighter/flaming/east/uppercut/frame_000.png',
  './assets/sprites/fighter/flaming/east/uppercut/frame_001.png',
  './assets/sprites/fighter/flaming/east/uppercut/frame_002.png',
  './assets/sprites/fighter/flaming/east/uppercut/frame_003.png',
  './assets/sprites/fighter/flaming/east/uppercut/frame_004.png',
  './assets/sprites/fighter/flaming/east/uppercut/frame_005.png',
  './assets/sprites/fighter/flaming/east/uppercut/frame_006.png',

  // Flaming East - victory
  './assets/sprites/fighter/flaming/east/victory/frame_000.png',
  './assets/sprites/fighter/flaming/east/victory/frame_001.png',
  './assets/sprites/fighter/flaming/east/victory/frame_002.png',
  './assets/sprites/fighter/flaming/east/victory/frame_003.png',
  './assets/sprites/fighter/flaming/east/victory/frame_004.png',
  './assets/sprites/fighter/flaming/east/victory/frame_005.png',
  './assets/sprites/fighter/flaming/east/victory/frame_006.png',
  './assets/sprites/fighter/flaming/east/victory/frame_007.png',
  './assets/sprites/fighter/flaming/east/victory/frame_008.png',
  './assets/sprites/fighter/flaming/east/victory/frame_009.png',
  './assets/sprites/fighter/flaming/east/victory/frame_010.png',
  './assets/sprites/fighter/flaming/east/victory/frame_011.png',
  './assets/sprites/fighter/flaming/east/victory/frame_012.png',

  // Flaming East - walk
  './assets/sprites/fighter/flaming/east/walk/frame_000.png',
  './assets/sprites/fighter/flaming/east/walk/frame_001.png',
  './assets/sprites/fighter/flaming/east/walk/frame_002.png',
  './assets/sprites/fighter/flaming/east/walk/frame_003.png',
  './assets/sprites/fighter/flaming/east/walk/frame_004.png',
  './assets/sprites/fighter/flaming/east/walk/frame_005.png',
  './assets/sprites/fighter/flaming/east/walk/frame_006.png',
  './assets/sprites/fighter/flaming/east/walk/frame_007.png',

  // ---------------------------------------------------------------------------
  // 3. Animation Sheets
  // ---------------------------------------------------------------------------
  './assets/sprites/animations/dragonhumansheet.png',
  './assets/sprites/animations/electrichumansheet.png',
  './assets/sprites/animations/electrichumansheet2.png',
  './assets/sprites/animations/electricrhinosheet.png',
  './assets/sprites/animations/elementalowlsheet.png',
  './assets/sprites/animations/elementalratsheet.png',
  './assets/sprites/animations/rathumansheet.png',
  './assets/sprites/animations/ratshadow2sheet.png',
  './assets/sprites/animations/ratsheet.png',
  './assets/sprites/animations/rhinohumansheet.png',
  './assets/sprites/animations/rhinohumansheet2.png',
  './assets/sprites/animations/rhinosheet.png',
  './assets/sprites/animations/shadowratsheet2.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (event.request.method === 'GET' && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    })
  );
});
