/* Imagine Engine library cache: keeps open-source libraries (esm.sh, unpkg, jsdelivr, Tailwind) on the device
   so live apps open instantly after the first visit. Pinned versions are cache-first; unversioned URLs refresh in the background. */
var CACHE = "ie-libs-v1";
var HOSTS = /^https:\/\/(esm\.sh|unpkg\.com|cdn\.jsdelivr\.net|cdn\.tailwindcss\.com|cdnjs\.cloudflare\.com)\//;
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return /^ie-libs-/.test(k) && k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener("fetch", function (e) {
  var r = e.request; if (r.method !== "GET" || !HOSTS.test(r.url)) return;
  var pinned = /@\d/.test(r.url);
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(r).then(function (hit) {
      var net = fetch(r).then(function (res) { if (res && (res.ok || res.type === "opaque")) c.put(r, res.clone()).catch(function () {}); return res; });
      if (hit) { if (!pinned) net.catch(function () {}); return hit; }
      return net;
    });
  }));
});
