/* HTC Vault — offline shell. The journal's data never passes through here: trades are in
   localStorage and charts in IndexedDB. This only keeps the app's own files on the phone
   so it opens with no signal. The page is fetched fresh when there is a connection, so a
   new build shows up on the next open; the cached copy is the fallback. */
const CACHE = 'htc-vault-202610012123';
const SHELL = ['./', 'manifest.webmanifest', 'fonts/figtree-latin.woff2', 'fonts/figtree-latin-ext.woff2',
  'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
/* Only this app's own old caches are cleared: the address is shared with other apps
   (github.io/larpenator), and their caches are theirs. */
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('htc-vault-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./', copy)); }
      return res;
    }).catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
