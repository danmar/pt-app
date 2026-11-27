// Gör att appen fungerar utan internet. Höj VERSION när du ändrar filerna.
const VERSION = 'minpt-v50';
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
  './body.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  // cache: 'reload' går förbi webbläsarens HTTP-cache så att vi inte sparar gamla filer.
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Nätverket först så att senaste versionen alltid visas; cachen används utan internet.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      try {
        const response = await fetch(event.request, { cache: 'no-cache' });
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      } catch {
        const cached = await cache.match(event.request, { ignoreSearch: true });
        return cached || Response.error();
      }
    }),
  );
});
