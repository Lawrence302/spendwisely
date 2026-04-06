/**
 * Service Worker for SpendWisely
 * Enables PWA capabilities with a robust caching strategy.
 */

const CACHE_NAME = 'spendwisely-v2';

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
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  // Force the waiting service worker to become active
  self.skipWaiting();
});

/**
 * 'activate' Event
 * Triggered after 'install'. Used to clean up old caches.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

/**
 * 'fetch' Event
 * Stale-while-revalidate strategy:
 * Serves from cache if available, while simultaneously fetching from network to update the cache.
 */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Only cache valid responses (status 200, type 'basic' or same-origin)
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network error: if we have a cached response, return it; otherwise, fail
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
