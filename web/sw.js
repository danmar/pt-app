// Gör att appen fungerar utan internet. Höj VERSION när du ändrar filerna.
const VERSION = 'minpt-v18';
const FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './exercises.js',
  './figure.js',
  './planner.js',
  './storage.js',
  './swim.js',
  './workouts.js',
  './safety.js',
  './physio.js',
  './week.js',
  './charts.js',
  './feedback.js',
  './cardio.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Visa cachad version direkt, hämta en ny i bakgrunden till nästa gång.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(event.request, { ignoreSearch: true });
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
