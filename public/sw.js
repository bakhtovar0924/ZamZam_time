const CACHE_NAME = 'zamzam-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/public/manifest.json',
  '/app.js',
  '/style.css',
  '/public/android-chrome-192x192.png',
  '/public/android-chrome-512x512.png',
  '/public/favicon-16x16.png',
  '/public/favicon-32x32.png',
  'https://cdn.jsdelivr.net/npm/adhan@4.4.3/lib/bundles/adhan.umd.min.js',
  '/public/sw.js',
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
      .then(response => response || fetch(event.request))
  );
});