const CACHE_NAME = 'college-memories-v1';
const urlsToCache = [
  './',
  './index.html',
  './sky.html',
  './letters.html',
  './garden.html',
  './admin.html',
  './manifest.json',
  './icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
