const CACHE = 'og-v12';
const PRECACHE = [
  './',
  './index.html'
];

// Install: pre-cache essential files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches and claim clients
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for same-origin GET requests
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;
  if (e.request.url.startsWith('blob:') || e.request.url.startsWith('data:')) return;

  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        // Return cached version immediately if available
        if (cached) {
          // Update cache in background (stale-while-revalidate)
          fetch(e.request).then(res => {
            if (res.ok) cache.put(e.request, res);
          }).catch(() => {});
          return cached;
        }
        // Not in cache: fetch and cache
        return fetch(e.request).then(res => {
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        }).catch(() => new Response('Offline', { status: 503 }));
      })
    )
  );
});
