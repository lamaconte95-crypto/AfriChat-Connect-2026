// Service Worker for AfriChat Connect PWA
const CACHE_NAME = 'africhat-connect-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/icon-192.svg',
  '/icon-512.svg'
];

// Install Event - Pre-cache essential app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('AfriChat SW pre-caching partial warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up obsolete caches & take control immediately
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
  self.clients.claim();
});

// Fetch Event - Handle requests with Network First & Cache Fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests from http / https schemes
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // For API or live external streams, let browser handle directly
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.hostname.includes('youtube.com') || url.hostname.includes('facebook.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If response is valid, clone and update cache asynchronously
        if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline or Network Failure: Return cached match
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // For page navigations, return cached index.html
          if (event.request.mode === 'navigate' || event.request.destination === 'document') {
            return caches.match('/index.html');
          }
          return new Response('Connexion hors-ligne. AfriChat Connect sera de retour dès le rétablissement du réseau.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' }),
          });
        });
      })
  );
});
