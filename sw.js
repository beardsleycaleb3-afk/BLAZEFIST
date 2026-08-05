const CACHE_NAME = 'fight-v1';

const PRECACHE_ASSETS = [
    './index.html',
    './manifest.json',
    './src/js/main.js',
    './src/js/engine.js',
    './src/js/input.js',
    './src/js/fighter.js',
    './assets/sprites/fighter/east/32hitnormal.mp4',
    './assets/sprites/fighter/east/fireset1.mp4',
    './assets/sprites/fighter/east/fireset2.mp4',
    './assets/sprites/fighter/east/fireset3.mp4',
    './assets/sprites/fighter/east/fireset4.mp4',
    './assets/sprites/fighter/east/normalrun.mp4',
    './assets/sprites/fighter/east/tigerset1.mp4',
    './assets/sprites/fighter/east/ultimatetiger.mp4'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then(networkResponse => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {});
        })
    );
});
