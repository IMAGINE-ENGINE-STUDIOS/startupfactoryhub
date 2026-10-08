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
  IE.db = function (col) {
    col = String(col || "items").replace(/[^a-zA-Z0-9_-]/g, "_");
    return {
      list: function (o) { return call("list", col).then(function (rows) { o = o || {}; var r = rows || []; if (o.where) r = r.filter(function (x) { return Object.keys(o.where).every(function (k) { return x[k] === o.where[k]; }); }); if (o.mine) r = r.filter(function (x) { return x._mine; }); if (o.order) { var d = o.desc ? -1 : 1; r = r.slice().sort(function (a, b) { return a[o.order] > b[o.order] ? d : a[o.order] < b[o.order] ? -d : 0; }); } return o.limit ? r.slice(0, o.limit) : r; }); },
      insert: function (record) { return call("insert", col, { record: record }); },
      update: function (id, patch) { return call("update", col, { id: id, patch: patch }); },
      remove: function (id) { return call("delete", col, { id: id }); },
    };
  };

  /* hash router: IE.route() -> "/settings", IE.navigate("/settings"), IE.useRoute(React) hook */
  IE.route = function () { return (location.hash.replace(/^#/, "") || "/").split("?")[0]; };
  IE.navigate = function (p) { location.hash = p; };
  IE.useRoute = function (React) {
    var s = React.useState(IE.route());
    React.useEffect(function () { var f = function () { s[1](IE.route()); }; addEventListener("hashchange", f); return function () { removeEventListener("hashchange", f); }; }, []);
    return s[0];
  };
})();
