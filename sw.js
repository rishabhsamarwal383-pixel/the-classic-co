// The Classic Co. - PWA Service Worker (Auto-Update, Caching & Push Notifications)
const CACHE_NAME = 'classic-co-v4';
const ASSETS_TO_CACHE = [
  './',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon.png',
  './screenshot-mobile.png',
  './screenshot-wide.png',
  './icons/gpay.svg',
  './icons/phonepe.svg',
  './icons/paytm.svg',
  './icons/upi.svg',
  './icons/amazonpay.svg'
];

// Install: pre-cache assets and force immediate activation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.log('[PWA] Cache prefetch note:', err));
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first for index.html / main page so catalog updates reflect immediately
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Bypass Service Worker for external CDNs (Shopify, Fonts, etc.) - let browser handle directly at native speed
  if (url.origin !== self.location.origin) return;

  // If requesting API endpoint, bypass cache
  if (url.pathname.startsWith('/api/')) return;

  // For HTML documents: try network first so catalog updates reflect instantly
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  // For static assets: Cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => null);
    })
  );
});

// Push & Notification Handlers
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});

self.addEventListener('push', (event) => {
  let title = 'The Classic Co. Eyewear 🕶️';
  let body = 'New luxury frames & express courier dispatch updates!';
  let icon = 'icon.svg';

  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) title = data.title;
      if (data.body) body = data.body;
      if (data.icon) icon = data.icon;
    } catch (e) {
      body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      badge: icon,
      vibrate: [200, 100, 200]
    })
  );
});
