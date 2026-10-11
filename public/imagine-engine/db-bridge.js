/* Imagine Engine data bridge: live app collections (IE.db) appear as tables in the Database tab,
   edits made there are written back to IE.db, and Flow db steps use the same data (window.__IEData). */
(function () {
  var PFX = "iedb:";
  function apps() {
    var out = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i) || "", m;
        if ((m = /^ie-appcols:(.+)$/.exec(k))) { try { JSON.parse(localStorage.getItem(k) || "[]").forEach(function (c) { (out[m[1]] = out[m[1]] || {})[c] = 1; }); } catch (e) {} }
        else if ((m = /^ie-appdb:([^:]+):(.+)$/.exec(k))) (out[m[1]] = out[m[1]] || {})[m[2]] = 1;
      }
    } catch (e) {}
    return Object.keys(out).map(function (a) { return { app: a, cols: Object.keys(out[a]) }; });
  }
  function db(app, col) { return window.IE && window.IE.dbFor ? window.IE.dbFor(app, col) : null; }
  /* "App.collection" or just "collection" (first app that has it, else the first app) */
  function resolve(name, app) {
    name = String(name || "").trim(); var a = app, c = name, i = name.indexOf(".");
    if (!a && i > 0) { a = name.slice(0, i); c = name.slice(i + 1); }
    if (!a) { var all = apps(), hit = all.filter(function (x) { return x.cols.indexOf(c) >= 0; })[0] || all[0]; a = hit ? hit.app : "app"; }
    return { app: a, col: c.replace(/[^a-zA-Z0-9_-]/g, "_") || "items" };
  }
  var snap = {}, busy = false, last = "";
  function cols(rows) { var s = { id: 1 }, o = ["id"]; rows.forEach(function (r) { Object.keys(r || {}).forEach(function (k) { if (!s[k] && k.charAt(0) !== "_") { s[k] = 1; o.push(k); } }); }); return o; }
  function strip(r) { var o = {}; Object.keys(r || {}).forEach(function (k) { if (k !== "id" && k !== "created_at" && k.charAt(0) !== "_") o[k] = r[k]; }); return o; }
  function refresh() {
    var ie = window.__IE; if (!ie || !ie.setTables || !window.IE || !window.IE.dbFor) return Promise.resolve();
    var list = []; apps().forEach(function (a) { a.cols.forEach(function (c) { list.push({ app: a.app, col: c }); }); });
    return Promise.all(list.map(function (x) { return db(x.app, x.col).list().then(function (rows) { return { x: x, rows: rows || [] }; }).catch(function () { return { x: x, rows: [] }; }); }))
      .then(function (res) {
        var live = res.map(function (r) {
          var id = PFX + r.x.app + ":" + r.x.col; snap[id] = JSON.parse(JSON.stringify(r.rows));
          return { id: id, name: r.x.app + "." + r.x.col, columns: cols(r.rows), rows: r.rows.map(function (x) { return Object.assign({}, x); }), live: true };
        });
        busy = true;
        ie.setTables(function (prev) { var own = (prev || []).filter(function (t) { return String(t.id).indexOf(PFX) !== 0; }); return own.concat(live); });
        setTimeout(function () { busy = false; last = sig(); }, 50);
      });
  }
  function sig() { try { return JSON.stringify((window.__IE.tableData || []).filter(function (t) { return String(t.id).indexOf(PFX) === 0; })); } catch (e) { return ""; } }
  /* write Database-tab edits on live tables back to IE.db */
  function push() {
    if (busy || !window.__IE || !window.__IE.tableData) return; var s = sig(); if (s === last) return; last = s;
    var jobs = [];
    window.__IE.tableData.forEach(function (t) {
      if (String(t.id).indexOf(PFX) !== 0 || !snap[t.id]) return;
      var p = t.id.slice(PFX.length).split(":"), d = db(p[0], p.slice(1).join(":")); if (!d) return;
      var old = {}; snap[t.id].forEach(function (r) { old[r.id] = r; });
      var seen = {};
      (t.rows || []).forEach(function (r) {
        var o = r && old[r.id];
        if (o) { seen[r.id] = 1; var ch = {}, n = 0; Object.keys(r).forEach(function (k) { if (k !== "id" && String(r[k]) !== String(o[k])) { ch[k] = r[k]; n++; } }); if (n) jobs.push(d.update(r.id, ch)); }
        else if (r) jobs.push(d.insert(strip(r)));
      });
      Object.keys(old).forEach(function (id) { if (!seen[id]) jobs.push(d.remove(id)); });
    });
    if (jobs.length) Promise.all(jobs).then(refresh, function (e) { window.__IE.log && window.__IE.log("Database save failed: " + (e && e.message), "error"); refresh(); });
  }
  window.__IEData = {
    apps: apps, resolve: resolve, refresh: refresh,
    table: function (name, app) { var r = resolve(name, app); return db(r.app, r.col); },
  };
  /* apps saving data anywhere (other frames or tabs) refresh the Database tab */
  var chans = {};
  function listen() { apps().forEach(function (a) { if (chans[a.app]) return; try { var bc = new BroadcastChannel("ie-sync:" + a.app); bc.onmessage = function () { clearTimeout(chans._t); chans._t = setTimeout(refresh, 150); }; chans[a.app] = bc; } catch (e) { chans[a.app] = 1; } }); }
  addEventListener("storage", function (e) { if (e.key && /^ie-app(db|cols):/.test(e.key)) { listen(); refresh(); } });
  var n = 0, boot = setInterval(function () { if (window.__IE && window.__IE.setTables && window.IE && window.IE.dbFor) { clearInterval(boot); listen(); refresh(); setInterval(push, 700); setInterval(function () { listen(); }, 4000); } else if (++n > 200) clearInterval(boot); }, 150);
  window.__IEDataRefresh = function () { listen(); return refresh(); };
})();
