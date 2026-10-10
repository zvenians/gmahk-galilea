const CACHE='galilea-v35-32-schedule-clock';
const SHELL=['/','/index.html','/schedule-clock.js?v=32-wita','/vendor/page-flip-2.0.7.js?v=24-fold','/page-turn.css?v=31-pixel','/page-turn.js?v=31-pixel','/manifest.webmanifest','/assets/logo-galilea-light.webp','/assets/logo-galilea-dark.webp','/assets/logo-galilea-icon-192.png','/assets/presentation/schedule.webp','/assets/presentation/bible.webp','/assets/presentation/hymnal.webp'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
  if(request.mode==='navigate'){event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('/index.html',copy));return response;}).catch(()=>caches.match('/index.html')));return;}
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}return response;})));
});
