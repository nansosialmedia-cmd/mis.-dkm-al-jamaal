const V = 'dkm-v1', FILES = ['./', 'index.html', 'css/style.css', 'js/config.js', 'js/pengaturan.js', 'js/api.js', 'js/app.js', 'img/logo.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.indexOf('/audio/') > -1) return;
  e.respondWith(caches.open(V).then(c => c.match(e.request).then(m => {
    const f = fetch(e.request).then(r => { c.put(e.request, r.clone()).catch(() => {}); return r; }).catch(() => m);
    return m || f;
  })));
});
