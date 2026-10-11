/* Imagine Engine app SDK for live apps: IE.auth (real accounts), IE.db (saved cloud data), IE.route (pages).
   Loaded by liveapp.html before the app runs. Data is saved through the imagine-commerce function. */
(function () {
  var URL_ = "https://zqiihhmdsdgwdcwmryym.supabase.co";
  var KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaWloaG1kc2Rnd2Rjd21yeXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MTAyMDcsImV4cCI6MjA3Mzk4NjIwN30.ppEJAvP7mVrX-6uXA1_AlaJEDHPBcb297irRyBBT3YI";
  var IE = (window.IE = window.IE || {});
  var q = new URLSearchParams(location.search);
  var appName = (q.get("file") || "app").replace(/^apps\//, "").replace(/\.\w+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
  var clientP = null;
  function client() {
    if (!clientP) clientP = import("https://esm.sh/@supabase/supabase-js@2.57.4").then(function (m) {
      return m.createClient(URL_, KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "sb-zqiihhmdsdgwdcwmryym-auth-token" } });
    });
    return clientP;
  }
  var listeners = [];
  IE.auth = {
    user: function () { return client().then(function (c) { return c.auth.getUser(); }).then(function (r) { return (r.data && r.data.user) || null; }); },
    signUp: function (email, password) { return client().then(function (c) { return c.auth.signUp({ email: email, password: password, options: { emailRedirectTo: location.origin } }); }).then(out); },
    signIn: function (email, password) { return client().then(function (c) { return c.auth.signInWithPassword({ email: email, password: password }); }).then(out); },
    signOut: function () { return client().then(function (c) { return c.auth.signOut(); }); },
    onChange: function (fn) { listeners.push(fn); client().then(function (c) { c.auth.onAuthStateChange(function (_e, s) { fn((s && s.user) || null); }); }); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; },
  };
  function out(r) { if (r.error) throw new Error(r.error.message); return r.data; }

  /* every app name gets its own namespace, sync channel and collections; the host engine uses IE.dbFor(app, col) */
  function track(app, col) { try { var k = "ie-appcols:" + app, a = JSON.parse(localStorage.getItem(k) || "[]"); if (a.indexOf(col) < 0) { a.push(col); localStorage.setItem(k, JSON.stringify(a)); } } catch (e) {} }
  var made = {};
  function makeDB(appName) {
  if (made[appName]) return made[appName];
  /* project namespace: creator id is fixed the first time the app is opened by a signed-in creator */
  function ns() {
    return IE.auth.user().then(function (u) {
      var k = "ie-appns:" + appName, v = null; try { v = localStorage.getItem(k); } catch (e) {}
      if (!v && u) { v = u.id + "/" + appName; try { localStorage.setItem(k, v); } catch (e) {} }
      return { ns: v, user: u };
    });
  }
  function call(op, col, extra) {
    return Promise.all([client(), ns()]).then(function (a) {
      var c = a[0], info = a[1];
      if (!info.user || !info.ns) return local(op, col, extra);
      return c.functions.invoke("imagine-commerce", { body: Object.assign({ action: "appdb", op: op, ns: info.ns, collection: col }, extra || {}) }).then(function (r) {
        if (r.error) throw new Error((r.data && r.data.error) || r.error.message);
        if (r.data && r.data.error) throw new Error(r.data.error);
        return r.data.result;
      });
    });
  }
  /* signed-out visitors keep data in this browser until they sign in */
  function local(op, col, extra) {
    var k = "ie-appdb:" + appName + ":" + col, rows = [];
    try { rows = JSON.parse(localStorage.getItem(k) || "[]"); } catch (e) {}
    var save = function () { try { localStorage.setItem(k, JSON.stringify(rows)); } catch (e) {} };
    if (op === "list") return Promise.resolve(rows);
    if (op === "insert") { var r = Object.assign({}, extra.record, { id: "r_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), created_at: new Date().toISOString() }); rows.push(r); save(); return Promise.resolve(r); }
    if (op === "update") { rows = rows.map(function (x) { return x.id === extra.id ? Object.assign({}, x, extra.patch) : x; }); save(); return Promise.resolve(rows.find(function (x) { return x.id === extra.id; }) || null); }
    if (op === "delete") { rows = rows.filter(function (x) { return x.id !== extra.id; }); save(); return Promise.resolve(true); }
    return Promise.resolve(null);
  }
  /* change notifications across components and browser tabs */
  var bc = null; try { bc = new BroadcastChannel("ie-sync:" + appName); } catch (e) {}
  var subs = {};
  function notify(col, remote) { (subs[col] || []).forEach(function (fn) { fn(); }); if (!remote && bc) try { bc.postMessage({ col: col }); } catch (e) {} }
  if (bc) bc.onmessage = function (e) { if (e.data && e.data.col) notify(e.data.col, true); };
  function query(rows, o) {
    o = o || {}; var r = rows || [];
    if (o.where) r = r.filter(function (x) { return Object.keys(o.where).every(function (k) { return x[k] === o.where[k]; }); });
    if (typeof o.filter === "function") r = r.filter(o.filter);
    if (o.mine) r = r.filter(function (x) { return x._mine; });
    if (o.order) { var d = o.desc ? -1 : 1; r = r.slice().sort(function (a, b) { return a[o.order] > b[o.order] ? d : a[o.order] < b[o.order] ? -d : 0; }); }
    if (o.page) { var pp = o.perPage || 20; r = r.slice((o.page - 1) * pp, o.page * pp); }
    return o.limit ? r.slice(0, o.limit) : r;
  }
  var dbFn = function (col) {
    col = String(col || "items").replace(/[^a-zA-Z0-9_-]/g, "_"); track(appName, col);
    var after = function (p) { return p.then(function (v) { notify(col); return v; }); };
    var api = {
      list: function (o) { return call("list", col).then(function (rows) { return query(rows, o); }); },
      insert: function (record) { return after(call("insert", col, { record: record })); },
      update: function (id, patch) { return after(call("update", col, { id: id, patch: patch })); },
      remove: function (id) { return after(call("delete", col, { id: id })); },
      /* fn(rows) now and after every change; returns an unsubscribe function */
      subscribe: function (fn, o) {
        var run = function () { api.list(o).then(fn).catch(function () {}); };
        (subs[col] = subs[col] || []).push(run); run();
        return function () { subs[col] = (subs[col] || []).filter(function (x) { return x !== run; }); };
      },
    };
    return api;
  };
  dbFn.ns = ns;
  return (made[appName] = dbFn);
  }
  IE.db = makeDB(appName);
  IE.dbFor = function (app, col) { return makeDB(String(app || "app").replace(/[^a-zA-Z0-9_-]/g, "_"))(col); };
  /* "owner" = the creator who first opened the app signed in, "member" = other signed-in users, "guest" = signed out */
  IE.auth.role = function () { return IE.db.ns().then(function (i) { if (!i.user) return "guest"; return i.ns && i.ns.indexOf(i.user.id + "/") === 0 ? "owner" : "member"; }); };
  IE.auth.hasRole = function (r) { return IE.auth.role().then(function (x) { return x === r || (r === "member" && x === "owner"); }); };

  /* hash router: IE.route() -> "/settings", IE.navigate("/settings"), IE.useRoute(React) hook */
  IE.route = function () { return (location.hash.replace(/^#/, "") || "/").split("?")[0]; };
  IE.navigate = function (p) { location.hash = p; };
  IE.useRoute = function (React) {
    var s = React.useState(IE.route());
    React.useEffect(function () { var f = function () { s[1](IE.route()); }; addEventListener("hashchange", f); return function () { removeEventListener("hashchange", f); }; }, []);
    return s[0];
  };
  /* Controllers for games/apps: IE.controls.keyboard(), .joystick(el?), .pointer(el)
     Every controller returns { x, y, ... , destroy() } with x/y in -1..1 (y up = forward). */
  IE.controls = {
    keyboard: function () {
      var k = {}, st = { x: 0, y: 0, keys: k, jump: false, run: false };
      function upd() { st.x = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0); st.y = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0); st.jump = !!k.Space; st.run = !!(k.ShiftLeft || k.ShiftRight); }
      function d(e) { var t = e.target; if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return; k[e.code] = true; upd(); }
      function u(e) { k[e.code] = false; upd(); }
      addEventListener("keydown", d); addEventListener("keyup", u);
      st.destroy = function () { removeEventListener("keydown", d); removeEventListener("keyup", u); };
      return st;
    },
    joystick: function (opts) {
      opts = opts || {}; var size = opts.size || 120, st = { x: 0, y: 0, active: false };
      var base = document.createElement("div"), knob = document.createElement("div");
      base.style.cssText = "position:fixed;z-index:9999;touch-action:none;border-radius:50%;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);width:" + size + "px;height:" + size + "px;" + (opts.side === "right" ? "right:24px;" : "left:24px;") + "bottom:24px";
      knob.style.cssText = "position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,255,255,.55)";
      base.appendChild(knob); (opts.parent || document.body).appendChild(base);
      var id = null;
      function mv(e) { if (e.pointerId !== id) return; var r = base.getBoundingClientRect(), R = size / 2, dx = e.clientX - r.left - R, dy = e.clientY - r.top - R, l = Math.hypot(dx, dy), c = Math.min(l, R - 10); if (l) { dx = dx / l * c; dy = dy / l * c; } knob.style.transform = "translate(" + dx + "px," + dy + "px)"; st.x = dx / (R - 10); st.y = -dy / (R - 10); }
      function end(e) { if (e.pointerId !== id) return; id = null; st.active = false; st.x = st.y = 0; knob.style.transform = ""; }
      base.addEventListener("pointerdown", function (e) { id = e.pointerId; st.active = true; base.setPointerCapture(e.pointerId); mv(e); });
      base.addEventListener("pointermove", mv); base.addEventListener("pointerup", end); base.addEventListener("pointercancel", end);
      st.destroy = function () { base.remove(); };
      return st;
    },
    pointer: function (el, onClick) {
      el = el || document.body; var st = { x: 0, y: 0, down: false, dx: 0, dy: 0 };
      function m(e) { var r = el.getBoundingClientRect(); st.x = ((e.clientX - r.left) / r.width) * 2 - 1; st.y = -((e.clientY - r.top) / r.height) * 2 + 1; st.dx += e.movementX || 0; st.dy += e.movementY || 0; }
      function d(e) { st.down = true; m(e); onClick && onClick({ x: st.x, y: st.y }); }
      function u() { st.down = false; }
      el.addEventListener("pointermove", m); el.addEventListener("pointerdown", d); addEventListener("pointerup", u);
      st.lock = function () { el.requestPointerLock && el.requestPointerLock(); };
      st.take = function () { var r = { dx: st.dx, dy: st.dy }; st.dx = st.dy = 0; return r; };
      st.destroy = function () { el.removeEventListener("pointermove", m); el.removeEventListener("pointerdown", d); removeEventListener("pointerup", u); };
      return st;
    },
  };
})();
