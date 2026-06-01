/**
 * Sophie's Escape — Service worker (ADR 008)
 *
 * Scope: caching only. Cross-origin isolation is NOT included because
 * Sophie's Escape does not use SharedArrayBuffer (ADR 008).
 *
 * Three cache scopes, versioned by VERSION:
 *   core-cache-v<n>    HTML, JS, CSS, fonts
 *   room-cache-v<n>    models, textures, audio (content-hashed URLs)
 *   runtime-cache-v<n> other same-origin runtime fetches
 *
 * The GoatCounter analytics ping passes through without caching
 * (replayed analytics would corrupt the count).
 *
 * TODO(v0.2): Replace VERSION placeholder with the value from build-info.js
 * once the full build pipeline (ADR 009) is wired.
 */

const VERSION = '0.2.0';
const CORE_CACHE = `core-cache-v${VERSION}`;
const ROOM_CACHE = `room-cache-v${VERSION}`;
const RUNTIME_CACHE = `runtime-cache-v${VERSION}`;
const ALL_CACHES = [CORE_CACHE, ROOM_CACHE, RUNTIME_CACHE];

const GOATCOUNTER_ORIGIN = 'https://timdixon82.goatcounter.com';

// Install — no precaching in v0.1 (ADR 008 decision to cache on demand).
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// Activate — claim clients and evict stale caches.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !ALL_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch — cache-first strategy for same-origin requests.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Pass GoatCounter pings through without caching.
  if (url.origin === GOATCOUNTER_ORIGIN) return;

  // Only handle same-origin GET requests.
  if (url.origin !== self.location.origin) return;
  if (request.method !== 'GET') return;

  event.respondWith(_cacheFirst(request, _pickCache(url.pathname)));
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _pickCache(pathname) {
  if (
    pathname.startsWith('/models/') ||
    pathname.startsWith('/textures/') ||
    pathname.startsWith('/audio/')
  ) {
    return ROOM_CACHE;
  }
  return CORE_CACHE;
}

async function _cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Network failed and nothing in cache.
    return new Response('Offline', { status: 503 });
  }
}
