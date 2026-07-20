/* =====================================================================
   Service Worker — Staff Manager
   -----------------------------------------------------------------
   Pamdima: இது app-ஐ Home Screen-ல் Install பண்ண + இணையம் இல்லாத
   நேரத்திலும் App திறக்க உதவும் (offline-ல் app shell load ஆகும்;
   Supabase தரவு internet திரும்ப வந்ததும் sync ஆகும்).
===================================================================== */
const CACHE_NAME = 'staff-manager-v1';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e)=>{
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(()=>{}) // சில CDN assets cache ஆகாம போனாலும் install fail ஆகக்கூடாது
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);

  // App shell files (same-origin: index.html, manifest, icons) -> Cache-first,
  // so app quickly loads even with weak/no network.
  if(url.origin === location.origin){
    e.respondWith(
      caches.match(e.request).then(cached=>{
        const networkFetch = fetch(e.request).then(res=>{
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return res;
        }).catch(()=> cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // Supabase API calls, CDN scripts (Chart.js, jsPDF, etc.) -> நேரடியா Network-க்கு
  // (live data இதுவே வேணும்; இதை cache பண்ணக்கூடாது)
});
