// Service worker for The Classic Co. Admin PWA
const CACHE_NAME = 'cc-admin-cache-v1';
const ASSETS_TO_CACHE = [
  '/admin-manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.png',
  '/chaching.ogg',
  '/js/products-data.js',
  '/js/admin-app.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Always fetch live for admin routes so the admin always sees fresh data
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});
