const CACHE = 'repondly-v1'
const STATIC = ['/', '/inbox', '/dashboard']

self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(STATIC).catch(() => {}))
))

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/data/')) {
    return
  }
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)))
    return
  }
  e.respondWith(
    fetch(e.request)
      .then(r => {
        caches.open(CACHE).then(c => c.put(e.request, r.clone()))
        return r
      })
      .catch(() => caches.match(e.request))
  )
})
