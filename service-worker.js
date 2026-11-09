const CACHE_NAME = 'finora-v1';
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

// Install Event (Files ko cache karo)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Fetch Event (Offline kaam karo)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Activate Event (Purane cache clear karo)
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
    })
  );
});