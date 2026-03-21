/**
 * Service Worker for SpendWisely
 * Enables basic PWA capabilities like offline access to core assets.
 */

const CACHE_NAME = 'spendwisely-v1';

// List of static assets to cache during the 'install' phase
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './favicon32.svg',
];

/**
 * 'install' Event
 * Triggered when the service worker is first registered.
 * Opens the cache and adds the specified assets.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

/**
 * 'fetch' Event
 * Intercepts network requests.
 * Checks the cache first; if the asset is found, returns it.
 * Otherwise, fetches it from the network.
 */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
