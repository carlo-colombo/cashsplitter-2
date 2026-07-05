import { BASE_PATH, p } from './src/lib/config.js'
import { handleRequest } from './src/api/router.js'
import { setTemplate } from './src/lib/template.js'

const CACHE_NAME = 'cashsplitter-static-v1'
const STATIC_ASSETS = [
  p('/'),
  p('/index.html'),
  p('/404.html'),
  p('/styles/app.css'),
  p('/manifest.json'),
  p('/sw.js'),
  p('/src/api/router.js'),
  p('/src/api/groups.js'),
  p('/src/api/members.js'),
  p('/src/api/expenses.js'),
  p('/src/api/balances.js'),
  p('/src/db/store.js'),
  p('/src/db/events.js'),
  p('/src/lib/config.js'),
  p('/src/lib/split.js'),
  p('/src/lib/template.js'),
  p('/src/views/groups-list.html.hx'),
  p('/src/views/group-detail.html.hx'),
  p('/src/views/expense-form.html.hx'),
  p('/src/views/member-form.html.hx'),
  p('/src/views/settlements.html.hx'),
  p('/icon.svg'),
]

const TEMPLATE_NAMES = ['groups-list', 'group-detail', 'expense-form', 'member-form', 'settlements']

async function loadTemplates() {
  for (const name of TEMPLATE_NAMES) {
    try {
      const cache = await caches.open(CACHE_NAME)
      let res = await cache.match(p(`/src/views/${name}.html.hx`))
      if (!res) {
        res = await fetch(p(`/src/views/${name}.html.hx`))
      }
      if (res && res.ok) {
        setTemplate(name, await res.text())
      }
    } catch (err) {
      console.error('Failed to load template ' + name + ': ' + err.message)
    }
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('Cache install warning (non-fatal):', err)
      })
    ).then(() => loadTemplates())
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => clients.claim())
  )
})

function isNavigationRequest(request) {
  return request.mode === 'navigate'
}

function isAssetRequest(url) {
  const ext = url.pathname.split('.').pop().toLowerCase()
  return ['css', 'js', 'png', 'svg', 'ico', 'jpg', 'jpeg', 'gif', 'webp', 'woff', 'woff2', 'ttf'].includes(ext)
}

async function serveOfflineFallback(request) {
  const url = new URL(request.url)
  const isNav = isNavigationRequest(request)
  const isAsset = isAssetRequest(url)
  if (isNav) {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(p('/index.html'))
    if (cached) return cached
    return new Response(
      '<html><body><h1>Offline</h1><p>CashSplitter is offline.</p></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
  if (isAsset) {
    return new Response('', { status: 503 })
  }
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(p('/index.html'))
  if (cached) return cached
  return new Response('Offline', { status: 503 })
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (url.pathname.startsWith(BASE_PATH + '/api/')) {
    event.respondWith(
      (async () => {
        try {
          return await handleRequest(request)
        } catch (err) {
          console.error('Router error:', err)
          return new Response('<div class="error">Router error: ' + err.message + '</div>', {
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
      if (isNavigationRequest(request)) {
        const cached = await caches.match(p('/index.html'))
        if (cached) return cached
        try {
          const response = await fetch(request)
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME)
            cache.put(p('/index.html'), response.clone())
          }
          return response
        } catch {
          return serveOfflineFallback(request)
        }
      }
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
        return serveOfflineFallback(request)
      }
    })()
  )
})

console.log('CashSplitter SW registered')
