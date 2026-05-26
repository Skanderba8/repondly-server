const CACHE_VERSION = 'v5'
const CACHE_NAME = `repondly-${CACHE_VERSION}`
const STATIC_CACHE = `repondly-static-${CACHE_VERSION}`
const urlsToCache = [
  '/manifest.json',
  '/logo.png',
  '/mobile-icon.png',
  '/mobile-icon-maskable.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              return caches.delete(cacheName)
            }
          })
        )
      }),
      self.clients.claim()
    ])
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Pass all API routes through with no SW interception (SSE streams cannot be cached)
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Network-first for HTML navigation (no caching)
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request).then(cached => cached || fetch(event.request)))
    )
    return
  }
  
  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200) {
            return response
          }
          if (event.request.method !== 'GET') {
            return response
          }
          const responseToCache = response.clone()
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(event.request, responseToCache)
          })
          return response
        })
        .catch(() => fetch(event.request))
      })
  )
})

// Notify clients when a new version is available
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
