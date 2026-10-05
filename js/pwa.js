// No service worker / install prompts on this site.
// This cleans up the old service worker and caches from earlier versions,
// so returning visitors always get the latest site.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations()
      .then(regs => regs.forEach(r => r.unregister()))
      .catch(() => {});
    if (window.caches) {
      caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
    }
  });
}
