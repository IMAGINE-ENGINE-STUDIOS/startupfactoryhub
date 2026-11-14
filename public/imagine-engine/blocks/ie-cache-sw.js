/* Imagine Engine library cache: keeps open-source libraries (esm.sh, unpkg, jsdelivr, Tailwind) on the device
   so live apps open instantly after the first visit. Pinned versions are cache-first; unversioned URLs refresh in the background. */
/* Cache audit 2026-11-13 (Finish Plan Job 8): audited versioning (single CACHE name below), purge-on-activate
   (activate deletes every ie-libs-* cache except the current one), cache-first for pinned-version URLs,
   stale-while-revalidate for unpinned URLs, the 120-entry oldest-first trim, and the "ie-clear-cache" message.
   Bumped ie-libs-v1 -> ie-libs-v2 because v1 had never been bumped: cache-first pinned entries are never
   revalidated, so a poisoned or stale v1 entry could survive forever; the bump + purge-on-activate kills it. */
var CACHE = "ie-libs-v2", MAX = 120;
/* keep the cache small: drop the oldest entries beyond MAX */
function trim(c) { return c.keys().then(function (ks) { if (ks.length <= MAX) return; return Promise.all(ks.slice(0, ks.length - MAX).map(function (k) { return c.delete(k); })); }).catch(function () {}); }
self.addEventListener("message", function (e) { if (e.data === "ie-clear-cache") caches.delete(CACHE); });
var HOSTS = /^https:\/\/(esm\.sh|unpkg\.com|cdn\.jsdelivr\.net|cdn\.tailwindcss\.com|cdnjs\.cloudflare\.com)\//;
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return /^ie-libs-/.test(k) && k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener("fetch", function (e) {
  var r = e.request; if (r.method !== "GET" || !HOSTS.test(r.url)) return;
  var pinned = /@\d/.test(r.url);
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(r).then(function (hit) {
      var net = fetch(r).then(function (res) { if (res && (res.ok || res.type === "opaque")) c.put(r, res.clone()).then(function () { return trim(c); }).catch(function () {}); return res; });
      if (hit) { if (!pinned) net.catch(function () {}); return hit; }
      return net;
    });
  }));
});
