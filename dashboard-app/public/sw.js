const CACHE_VERSION = 'v2'
const STATIC_CACHE = `repondly-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `repondly-dynamic-${CACHE_VERSION}`

const STATIC_ASSETS = [
  '/',
  '/dashboard/accueil',
  '/dashboard/messagerie',
  '/auth/signin',
  '/manifest.json',
]

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// Fetch strategy:
// - API routes: network-only (never cache)
// - SSE: network-only (never cache)
// - Navigation: network-first, fallback to cache
// - Static assets: cache-first
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Never intercept API, SSE, or external requests
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/api/sse') ||
    url.origin !== self.location.origin
  ) {
    return // let browser handle normally
  }

  // Navigation requests: network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone()
          caches.open(DYNAMIC_CACHE).then(c => c.put(request, clone))
          return res
        })
        .catch(() => caches.match(request) || caches.match('/dashboard/accueil'))
    )
    return
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(DYNAMIC_CACHE).then(c => c.put(request, clone))
        }
        return res
      })
    })
  )
})

// Push notifications (ready for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'Répondly', {
      body: data.body || 'Nouveau message',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      tag: data.tag || 'message',
      data: { url: data.url || '/dashboard/messagerie' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard/messagerie'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      return clients.openWindow(url)
    })
  )
})
