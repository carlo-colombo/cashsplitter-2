import { handleRequest } from './src/api/router.js'

const CACHE_NAME = 'cashsplitter-static-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/app.css',
  '/manifest.json',
  '/sw.js',
  '/src/api/router.js',
  '/src/api/groups.js',
  '/src/api/members.js',
  '/src/api/expenses.js',
  '/src/api/balances.js',
  '/src/db/store.js',
  '/src/db/events.js',
  '/src/lib/split.js',
  '/src/views/groups-list.html.hx.js',
  '/src/views/group-detail.html.hx.js',
  '/src/views/expense-form.html.hx.js',
  '/src/views/member-form.html.hx.js',
  '/src/views/settlements.html.hx.js',
  '/icon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => clients.claim())
  )
})

async function serveOfflineFallback() {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match('/index.html')
  if (cached) return cached
  return new Response(
    '<html><body><h1>Offline</h1><p>CashSplitter is offline.</p></body></html>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        try {
          return await handleRequest(request)
        } catch (err) {
          console.error('Router error:', err)
          return new Response(`<div class="error">Router error: ${err.message}</div>`, {
            status: 500,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          })
        }
      })()
    )
    return
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request)
      if (cached) return cached
      try {
        const response = await fetch(request)
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME)
          cache.put(request, response.clone())
        }
        return response
      } catch {
        return serveOfflineFallback()
      }
    })()
  )
})

console.log('CashSplitter SW registered')
