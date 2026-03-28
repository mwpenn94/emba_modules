/**
 * Service Worker — Offline Mode
 * Caches app shell, static assets, and EMBA content data for offline access.
 * Strategy: Network-first for API, Cache-first for static assets.
 */

const CACHE_VERSION = 'emba-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DATA_CACHE = `${CACHE_VERSION}-data`;
const API_CACHE = `${CACHE_VERSION}-api`;

// App shell files to precache
const APP_SHELL = [
  '/',
  '/index.html',
];

// Install — precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL);
    }).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('emba-') && key !== STATIC_CACHE && key !== DATA_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch — routing strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip browser-extension and chrome-extension requests
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') return;

  // API requests — network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstThenCache(event.request, API_CACHE));
    return;
  }

  // TTS audio — network only (too large to cache all)
  if (url.pathname.startsWith('/api/tts/')) return;

  // Static assets (JS, CSS, images, fonts) — cache first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstThenNetwork(event.request, STATIC_CACHE));
    return;
  }

  // CDN assets — cache first
  if (url.hostname.includes('cloudfront.net') || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirstThenNetwork(event.request, STATIC_CACHE));
    return;
  }

  // Navigation requests — network first, fallback to cached index.html (SPA)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Default — network first
  event.respondWith(networkFirstThenCache(event.request, DATA_CACHE));
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_CONTENT_DATA') {
    // Cache the EMBA content data JSON for offline access
    const data = event.data.payload;
    if (data) {
      caches.open(DATA_CACHE).then((cache) => {
        const response = new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' },
        });
        cache.put('/offline/emba-data', response);
      });
    }
  }

  if (event.data?.type === 'CACHE_MASTERY_DATA') {
    const data = event.data.payload;
    if (data) {
      caches.open(DATA_CACHE).then((cache) => {
        const response = new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' },
        });
        cache.put('/offline/mastery-data', response);
      });
    }
  }

  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ── Strategy helpers ── */

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp)(\?.*)?$/.test(pathname);
}

async function cacheFirstThenNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Return a basic offline response
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirstThenCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
