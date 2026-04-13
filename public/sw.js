const CACHE_VERSION = 'kinelo-pwa-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;
const DATA_CACHE = `${CACHE_VERSION}-data`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const OFFLINE_URL = '/offline';

const APP_SHELL = [
  '/',
  '/it',
  '/it/palermo',
  '/it/palermo/classes',
  '/it/palermo/studios',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icon.svg',
  '/pwa-icon-192',
  '/pwa-icon-512',
  '/apple-icon'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

const shouldSkipRequest = (requestUrl, request) => {
  if (request.method !== 'GET') return true;
  if (requestUrl.origin !== self.location.origin) return true;
  if (requestUrl.pathname.startsWith('/api/auth')) return true;
  if (requestUrl.pathname.startsWith('/api/admin')) return true;
  if (requestUrl.pathname.startsWith('/api/session/status')) return true;
  if (requestUrl.pathname.startsWith('/auth/')) return true;
  if (requestUrl.pathname.startsWith('/it/account')) return true;
  if (requestUrl.pathname.startsWith('/it/favorites')) return true;
  if (requestUrl.pathname.startsWith('/it/schedule')) return true;
  if (requestUrl.pathname.startsWith('/it/sign-in')) return true;
  if (requestUrl.pathname.startsWith('/it/admin')) return true;
  return false;
};

const isNavigationRequest = (request) => request.mode === 'navigate';
const isPublicDataRequest = (pathname) => pathname.startsWith('/api/public/cities/');
const isStaticAssetRequest = (pathname) =>
  pathname.startsWith('/_next/static/') ||
  pathname.startsWith('/_next/image') ||
  pathname.startsWith('/pwa-icon-') ||
  pathname.startsWith('/pwa-screenshot-') ||
  pathname === '/apple-icon' ||
  pathname === '/icon.svg' ||
  /\.(?:png|jpg|jpeg|svg|webp|avif|woff2?)$/i.test(pathname);

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || networkPromise;
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (shouldSkipRequest(requestUrl, event.request)) {
    return;
  }

  if (isNavigationRequest(event.request)) {
    event.respondWith(networkFirst(event.request, PAGE_CACHE, OFFLINE_URL));
    return;
  }

  if (isPublicDataRequest(requestUrl.pathname)) {
    event.respondWith(staleWhileRevalidate(event.request, DATA_CACHE));
    return;
  }

  if (isStaticAssetRequest(requestUrl.pathname)) {
    event.respondWith(cacheFirst(event.request, ASSET_CACHE));
  }
});
