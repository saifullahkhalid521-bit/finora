// service-worker.js — Finora PWA cache
//
// IMPORTANT: bump CACHE_NAME every time you ship changes to JS/CSS/HTML.
// Strategy is network-first so a stale cache can never pin old modules again
// (that is what made the "restore deletes the vault" bug impossible to fix).
const CACHE_NAME = 'finora-v2';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/reset.css',
  './css/variables.css',
  './css/main.css',
  './js/app.js',
  './js/state.js',
  './js/storage.js',
  './js/formatters.js',
  './js/dates.js',
  './js/calculations.js',
  './js/dashboard.js',
  './js/history.js',
  './js/savings.js',
  './js/backup.js',
  './js/theme.js'
];

// Install: pre-cache, then take over immediately (no waiting for tab close).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate: drop every other cache version, then claim open pages.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first, cache as offline fallback.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only same-origin GETs are ours to handle.
  if (request.method !== 'GET') return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache valid same-origin responses.
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => {
        if (cached) return cached;
        if (request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      }))
  );
});

// Allow the page to trigger an immediate update.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
