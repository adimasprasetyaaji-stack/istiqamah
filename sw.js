/* Istiqamah PWA: aplikasi terbuka dari cache (cepat, bisa offline), lalu diperbarui di latar. */
var CACHE = 'istiqamah-v1';
var INTI = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(INTI); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function simpan(kunci, res) { if (res && (res.ok || res.type === 'opaque')) { var c = res.clone(); caches.open(CACHE).then(function (x) { x.put(kunci, c); }); } return res; }

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;            // panggilan API (POST) selalu langsung ke jaringan
  var url = new URL(req.url);
  if (url.origin === location.origin) {
    // halaman: tampil dari cache seketika, versi baru diunduh di latar untuk pembukaan berikutnya
    var kunci = req.mode === 'navigate' ? 'index.html' : req;
    e.respondWith(caches.match(kunci).then(function (ada) {
      var baru = fetch(req).then(function (res) { return simpan(kunci, res); }).catch(function () { return ada; });
      return ada || baru;
    }));
    return;
  }
  if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(function (ada) { return ada || fetch(req).then(function (res) { return simpan(req, res); }); }));
  }
});
