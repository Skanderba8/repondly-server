const CACHE = 'repondly-v2'
const STATIC = ['/', '/inbox', '/dashboard']

self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC).catch(() => {}))
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return
  }

  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/data/')) {
    return
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)))
    return
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok && !response.bodyUsed) {
          const cacheResponse = response.clone()
          event.waitUntil(
            caches.open(CACHE)
              .then(cache => cache.put(event.request, cacheResponse))
              .catch(() => {})
          )
        }

        return response
      })
      .catch(() => caches.match(event.request).then(response => response || Response.error()))
  )
})
