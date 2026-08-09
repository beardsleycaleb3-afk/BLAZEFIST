// sw.js - Service Worker handling asset caching, offline intercept, and sequenced offscreen canvas pre-rendering
const CACHE_NAME = 'fight-v7';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './styles.css',
  './sw.js',
  './worker.js',
  './icon-192.png',
  './icon-512.png',
  './favicon.png'
];

const DIRECTORY_MAPPINGS = {
  backgrounds: { path: './assets/sprites/stages/backgrounds/stage', count: 9, ext: '.png' },
  animations: [
    'dragonhumansheet', 'electrichumansheet', 'electrichumansheet2', 
    'electricrhinosheet', 'elementalowlsheet', 'elementalratsheet', 
    'rathumansheet', 'ratshadow2sheet', 'ratsheet', 'rhinohumansheet', 
    'rhinohumansheet2', 'rhinosheet', 'shadowratsheet2'
  ],
  flamingVideos: [
    '32hitnormal', 'fireset1', 'fireset2', 'fireset3', 
    'fireset4', 'normalrun', 'tigerset1', 'ultimatetiger'
  ],
  fighterEast: {
    base: './assets/sprites/fighter/east/',
    sequences: {
      cross: 6, crouch: 6, die: 6, fireball: 6, getup: 6,
      idle: 8, jab: 3, kick: 6, run: 8, takehit: 6,
      throw: 6, transform: 6, uppercut: 7
    }
  },
  flamingEast: {
    base: './assets/sprites/fighter/flaming/east/',
    sequences: {
      cross: 6, headbutt: 11, idle: 8, jab: 3, jump: 8,
      kick: 6, punch: 6, roundhouse: 7, run: 8, uppercut: 7,
      victory: 13, walk: 8
    }
  }
};

function generateMappedAssetList() {
  const assets = [...CORE_ASSETS];

  for (let i = 1; i <= DIRECTORY_MAPPINGS.backgrounds.count; i++) {
    assets.push(`${DIRECTORY_MAPPINGS.backgrounds.path}${i}${DIRECTORY_MAPPINGS.backgrounds.ext}`);
  }

  DIRECTORY_MAPPINGS.animations.forEach(name => {
    assets.push(`./assets/sprites/animations/${name}.png`);
  });

  DIRECTORY_MAPPINGS.flamingVideos.forEach(name => {
    assets.push(`./assets/sprites/fighter/flaming/${name}.mp4`);
  });

  const east = DIRECTORY_MAPPINGS.fighterEast;
  for (const [anim, count] of Object.entries(east.sequences)) {
    for (let i = 0; i < count; i++) {
      const frameNum = String(i).padStart(3, '0');
      assets.push(`${east.base}${anim}/frame_${frameNum}.png`);
    }
  }

  const flamingEast = DIRECTORY_MAPPINGS.flamingEast;
  for (const [anim, count] of Object.entries(flamingEast.sequences)) {
    for (let i = 0; i < count; i++) {
      const frameNum = String(i).padStart(3, '0');
      assets.push(`${flamingEast.base}${anim}/frame_${frameNum}.png`);
    }
  }

  return assets;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const allAssets = generateMappedAssetList();
      const CHUNK_SIZE = 10;

      for (let i = 0; i < allAssets.length; i += CHUNK_SIZE) {
        const chunk = allAssets.slice(i, i + CHUNK_SIZE);
        
        await Promise.all(
          chunk.map(async (url) => {
            try {
              const response = await fetch(url);
              if (response.ok) {
                if (url.endsWith('.png') && 'OffscreenCanvas' in self) {
                  try {
                    const blob = await response.blob();
                    const bitmap = await createImageBitmap(blob);
                    const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
                    const ctx = offscreen.getContext('2d');
                    ctx.drawImage(bitmap, 0, 0);
                    bitmap.close();
                  } catch (err) {}
                }
                await cache.put(url, response.clone());
              }
            } catch (err) {}
          })
        );
      }
    }).then(() => self.skipWaiting())
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
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
