// Service Worker - Disabled for development
// This SW does nothing - just passes through all requests
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  // Clear all existing caches
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener('fetch', () => {
  // Let all requests pass through to the network
});
