const CACHE='galilea-v48-sabbath';
const SHELL=['/sabbath-presentation.js?v=42-sabbath','/sabbath-presentation.css?v=42-sabbath','/','/index.html','/viewer.css?v=37-immersive','/viewer.js?v=42-sabbath','/visitor-ui.css?v=38-thumbnails','/appearance.css?v=41-nav','/hymnal-scores.js?v=34-pdf4','/hymnal-scores.css?v=34-pdf4','/schedule-clock.js?v=32-wita','/vendor/page-flip-2.0.7.js?v=24-fold','/page-turn.css?v=31-pixel','/page-turn.js?v=31-pixel','/manifest.webmanifest','/assets/logo-galilea-light.webp','/assets/logo-galilea-dark.webp','/assets/logo-galilea-icon-192.png','/assets/presentation/schedule.webp','/assets/presentation/bible.webp','/assets/presentation/hymnal.webp'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('galilea-') && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin ||
      /^\/(?:api(?:\/|$)|admin(?:\/|$)|berita(?:\/|$))/.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    if (!['/','/index.html'].includes(url.pathname)) return;
    event.respondWith(fetch(request).then(response => {
      if (response.ok && /text\/html/.test(response.headers.get('Content-Type') || '')) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put('/index.html',copy)));
      }
      return response;
    }).catch(() => caches.match('/index.html')));
    return;
  }

  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(request,copy)));
    }
    return response;
  })));
});
