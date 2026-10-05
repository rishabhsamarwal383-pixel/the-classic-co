// The Classic Co. - cleanup worker.
// Older versions of the site installed a caching service worker. This file replaces it:
// it deletes every cache and unregisters itself, so nobody gets stale pages.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
  })());
});
