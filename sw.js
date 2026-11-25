/* Fonctionnement hors connexion. En ligne, la dernière version publiée est toujours prise en priorité.
   Les noms de cache commencent par « mysmooziz- » : les autres applications hébergées
   sur la même adresse github.io ne sont jamais touchées. */
var CACHE = 'mysmooziz-1.0';
var FILES = ['./', 'index.html', 'style.css', 'season.js', 'calories.js', 'data.js', 'engine.js', 'app.js', 'manifest.webmanifest',
  'fredoka.woff2', 'nunito.woff2', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(FILES.map(function (f) { return new Request(f, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('mysmooziz-') === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request.url, { cache: 'no-cache' }).then(function (response) {
      if (response.ok) {
        var copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(function (c) { return c.put(request, copy); }));
      }
      return response;
    }).catch(function () {
      return caches.open(CACHE).then(function (c) {
        return c.match(request, { ignoreSearch: true }).then(function (hit) {
          return hit || (request.mode === 'navigate' ? c.match('index.html') : Response.error());
        });
      });
    })
  );
});
