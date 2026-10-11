/* Imagine Engine backend connections: each project can plug in its own Supabase project and/or SurrealDB.
   Supabase: address + public anon key (localStorage ie-sbconn:<pid>), schema read from PostgREST OpenAPI.
   SurrealDB: address + namespace + database (localStorage ie-surconn:<pid>), sign-in kept in sessionStorage only.
   window.__IEBackend exposes open(), supabase(), surreal(), schema(), surrealQuery(). */
(function () {
  function pid() { var x = window.__IE; return (x && x.raw && x.raw.pid) || "default"; }
  function rd(s, k) { try { return JSON.parse(s.getItem(k) || "null"); } catch (e) { return null; } }
  function sb() { var c = rd(localStorage, "ie-sbconn:" + pid()); return c && c.url && c.key ? c : null; }
  function sr() {
    var c = rd(localStorage, "ie-surconn:" + pid()); if (!c || !c.url) return null;
    var a = rd(sessionStorage, "ie-surauth:" + pid()) || {}; return Object.assign({}, c, a);
  }
  var cache = { supabase: null, surreal: null };

  /* ---------- Supabase ---------- */
  function sbSchema(c) {
    return fetch(c.url + "/rest/v1/", { headers: { apikey: c.key, Authorization: "Bearer " + c.key, Accept: "application/openapi+json" } })
      .then(function (r) { if (r.status === 401 || r.status === 403) throw new Error("The key was rejected"); return r.json(); })
      .then(function (j) {
        var d = (j && j.definitions) || {};
        return Object.keys(d).map(function (t) {
          var p = d[t].properties || {}, req = d[t].required || [];
          return { name: t, columns: Object.keys(p).map(function (k) { return { name: k, type: p[k].format || p[k].type || "", required: req.indexOf(k) >= 0, pk: /<pk\/>/.test(p[k].description || "") }; }) };
        });
      });
  }
  function checkKey(key) {
    if (/^sb_secret_/.test(key)) return "That's a secret key. Use the publishable/anon key instead.";
    try { var role = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role; if (role === "service_role") return "That's a service_role key. Use the anon (public) key instead."; } catch (e) {}
    return "";
  }

  /* ---------- SurrealDB (HTTP /sql endpoint) ---------- */
  function surrealQuery(sql, conn) {
    var c = conn || sr(); if (!c) return Promise.reject(new Error("SurrealDB is not connected"));
    var h = { Accept: "application/json", "Content-Type": "text/plain", "surreal-ns": c.ns, "surreal-db": c.db, NS: c.ns, DB: c.db };
    if (c.token) h.Authorization = "Bearer " + c.token;
    else if (c.user) h.Authorization = "Basic " + btoa(c.user + ":" + (c.pass || ""));
    return fetch(c.url.replace(/\/+$/, "") + "/sql", { method: "POST", headers: h, body: sql })
      .then(function (r) { return r.text().then(function (t) { var j; try { j = JSON.parse(t); } catch (e) { j = null; } if (!r.ok) throw new Error((j && (j.information || j.details || j.description)) || ("HTTP " + r.status)); return j; }); })
      .then(function (res) {
        var last = Array.isArray(res) ? res[res.length - 1] : res;
        if (last && last.status && last.status !== "OK") throw new Error(typeof last.result === "string" ? last.result : "Query failed");
        return Array.isArray(res) ? res.map(function (x) { return x && "result" in x ? x.result : x; }) : [res];
      });
  }
  function srSchema(c) {
    return surrealQuery("INFO FOR DB;", c).then(function (r) {
      var info = r[0] || {}, tb = info.tables || info.tb || {};
      return Promise.all(Object.keys(tb).map(function (t) {
        return surrealQuery("INFO FOR TABLE " + t + ";", c).then(function (x) {
          var f = ((x[0] || {}).fields || (x[0] || {}).fd) || {};
          return { name: t, columns: Object.keys(f).map(function (k) { var m = /TYPE\s+([^\s]+)/i.exec(String(f[k])); return { name: k, type: m ? m[1] : "any" }; }) };
        }).catch(function () { return { name: t, columns: [] }; });
      }));
    });
  }
  function surrealTable(name) {
    var t = String(name || "").replace(/[^A-Za-z0-9_]/g, "");
    var lit = function (v) { return JSON.stringify(v); };
    return {
      list: function (o) { o = o || {}; var w = o.where ? " WHERE " + Object.keys(o.where).map(function (k) { return k.replace(/[^A-Za-z0-9_]/g, "") + " = " + lit(o.where[k]); }).join(" AND ") : ""; return surrealQuery("SELECT * FROM " + t + w + " LIMIT " + (Number(o.limit) || 100) + ";").then(function (r) { return r[0] || []; }); },
      insert: function (rec) { return surrealQuery("CREATE " + t + " CONTENT " + lit(rec || {}) + ";").then(function (r) { return (r[0] || [])[0] || null; }); },
      update: function (id, patch) { return surrealQuery("UPDATE " + String(id).replace(/[^A-Za-z0-9_:⟨⟩-]/g, "") + " MERGE " + lit(patch || {}) + ";").then(function (r) { return (r[0] || [])[0] || null; }); },
      remove: function (id) { return surrealQuery("DELETE " + String(id).replace(/[^A-Za-z0-9_:⟨⟩-]/g, "") + ";").then(function () { return true; }); },
    };
  }

  function schema(force) {
    var jobs = [];
    var a = sb(), b = sr();
    if (a) jobs.push((cache.supabase && !force ? Promise.resolve(cache.supabase) : sbSchema(a)).then(function (s) { cache.supabase = s; }).catch(function () { cache.supabase = null; }));
    else cache.supabase = null;
    if (b) jobs.push((cache.surreal && !force ? Promise.resolve(cache.surreal) : srSchema(b)).then(function (s) { cache.surreal = s; }).catch(function () { cache.surreal = null; }));
    else cache.surreal = null;
    return Promise.all(jobs).then(function () { return { supabase: cache.supabase, surreal: cache.surreal }; });
  }
  /* short text summary of the connected backends, sent to Genius AI so builds match real tables */
  function summary() {
    var out = [];
    if (sb() && cache.supabase) out.push("Supabase " + sb().url + " tables: " + cache.supabase.slice(0, 40).map(function (t) { return t.name + "(" + t.columns.slice(0, 15).map(function (c) { return c.name + ":" + c.type; }).join(", ") + ")"; }).join("; "));
    if (sr() && cache.surreal) out.push("SurrealDB " + sr().ns + "/" + sr().db + " tables: " + cache.surreal.slice(0, 40).map(function (t) { return t.name + "(" + t.columns.map(function (c) { return c.name + ":" + c.type; }).join(", ") + ")"; }).join("; "));
    return out.join("\n");
  }

  /* ---------- panel ---------- */
  var S = "font:13px system-ui;color:#e4e4e7";
  var IN = "width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px 10px;border-radius:8px;border:1px solid #3f3f46;background:#09090b;color:#e4e4e7;font:13px system-ui";
  var BT = "padding:8px 14px;border-radius:8px;border:1px solid #3f3f46;background:#27272a;color:#e4e4e7;font:600 12px system-ui;cursor:pointer;margin-right:6px";
  function el(tag, css, html) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function open() {
    var old = document.getElementById("ie-backend"); if (old) old.remove();
    var ov = el("div", "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center"); ov.id = "ie-backend";
    var box = el("div", S + ";width:min(560px,94vw);max-height:88vh;overflow:auto;background:#18181b;border:1px solid #3f3f46;border-radius:14px;padding:18px");
    ov.appendChild(box); ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.body.appendChild(ov);
    paint(box);
  }
  function paint(box) {
    var a = sb(), b = sr();
    box.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><b style="font-size:15px">Backend connections</b><button data-x style="' + BT + '">Close</button></div>' +
      '<div style="font-size:12px;color:#a1a1aa;margin-bottom:14px">Connect this project to your own databases. Flow data steps, the Database tab and Genius AI builds use them.</div>' +
      '<div style="border:1px solid #27272a;border-radius:10px;padding:12px;margin-bottom:12px"><b>Supabase</b>' +
      (a ? '<div style="margin:6px 0;color:#86efac">Connected: ' + esc(a.url) + '</div><button data-sbdis style="' + BT + '">Disconnect</button><button data-sbsch style="' + BT + '">Refresh tables</button>'
         : '<input data-sburl placeholder="https://xxxx.supabase.co" style="' + IN + '"><input data-sbkey placeholder="Public anon / publishable key (never the service_role key)" style="' + IN + '"><button data-sbcon style="' + BT + '">Connect</button>') +
      '<div data-sbout style="margin-top:8px;font-size:12px"></div></div>' +
      '<div style="border:1px solid #27272a;border-radius:10px;padding:12px"><b>SurrealDB</b>' +
      (b ? '<div style="margin:6px 0;color:#86efac">Connected: ' + esc(b.url) + " · " + esc(b.ns) + "/" + esc(b.db) + (b.token || b.user ? "" : ' <span style="color:#fca5a5">(sign in again to query)</span>') + '</div><button data-srdis style="' + BT + '">Disconnect</button><button data-srsch style="' + BT + '">Refresh tables</button>' +
          '<textarea data-srsql placeholder="SELECT * FROM person LIMIT 10;" style="' + IN + ';height:70px;font-family:monospace"></textarea><button data-srrun style="' + BT + '">Run query</button>'
         : '<input data-srurl placeholder="https://your-instance.surreal.cloud or https://db.example.com" style="' + IN + '"><div style="display:flex;gap:8px"><input data-srns placeholder="Namespace" style="' + IN + '"><input data-srdb placeholder="Database" style="' + IN + '"></div>' +
           '<input data-sruser placeholder="Username (or leave empty and use a token)" style="' + IN + '"><input data-srpass type="password" placeholder="Password" style="' + IN + '"><input data-srtok placeholder="Access token (optional)" style="' + IN + '">' +
           '<div style="font-size:11px;color:#a1a1aa;margin-bottom:8px">Use a limited database user, not root. Sign-in details stay in this browser tab only.</div><button data-srcon style="' + BT + '">Connect</button>') +
      '<div data-srout style="margin-top:8px;font-size:12px;white-space:pre-wrap"></div></div>';
    var $ = function (s) { return box.querySelector("[" + s + "]"); };
    $("data-x").onclick = function () { box.parentNode.remove(); };
    var tables = function (out, list) { out.innerHTML = list && list.length ? list.map(function (t) { return "<div><b>" + esc(t.name) + "</b> <span style='color:#a1a1aa'>" + esc(t.columns.map(function (c) { return c.name; }).join(", ")) + "</span></div>"; }).join("") : "<span style='color:#a1a1aa'>No tables visible with this key.</span>"; };
    var log = function (m, t) { window.__IE && window.__IE.log && window.__IE.log(m, t); };
    if (a) {
      $("data-sbdis").onclick = function () { localStorage.removeItem("ie-sbconn:" + pid()); cache.supabase = null; paint(box); };
      var showSb = function (f) { $("data-sbout").textContent = "Reading tables…"; schema(f).then(function (s) { tables($("data-sbout"), s.supabase); }); };
      $("data-sbsch").onclick = function () { showSb(true); }; showSb(false);
    } else {
      $("data-sbcon").onclick = function () {
        var url = $("data-sburl").value.trim().replace(/\/+$/, ""), key = $("data-sbkey").value.trim(), out = $("data-sbout");
        if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(url)) { out.textContent = "That doesn't look like a Supabase project address."; return; }
        var bad = checkKey(key); if (!key || bad) { out.textContent = bad || "Paste the public key."; return; }
        out.textContent = "Connecting…";
        sbSchema({ url: url, key: key }).then(function (s) { localStorage.setItem("ie-sbconn:" + pid(), JSON.stringify({ url: url, key: key })); cache.supabase = s; log("Connected Supabase " + url, "success"); paint(box); })
          .catch(function (e) { out.textContent = "Could not connect: " + e.message; });
      };
    }
    if (b) {
      $("data-srdis").onclick = function () { localStorage.removeItem("ie-surconn:" + pid()); sessionStorage.removeItem("ie-surauth:" + pid()); cache.surreal = null; paint(box); };
      var showSr = function (f) { $("data-srout").textContent = "Reading tables…"; schema(f).then(function (s) { if (s.surreal) tables($("data-srout"), s.surreal); else $("data-srout").textContent = "Could not read tables. Check the sign-in."; }); };
      $("data-srsch").onclick = function () { showSr(true); }; showSr(false);
      $("data-srrun").onclick = function () { var out = $("data-srout"); out.textContent = "Running…"; surrealQuery($("data-srsql").value).then(function (r) { out.textContent = JSON.stringify(r, null, 2).slice(0, 4000); }).catch(function (e) { out.textContent = "Error: " + e.message; }); };
    } else {
      $("data-srcon").onclick = function () {
        var c = { url: $("data-srurl").value.trim().replace(/\/+$/, ""), ns: $("data-srns").value.trim(), db: $("data-srdb").value.trim() };
        var auth = { user: $("data-sruser").value.trim(), pass: $("data-srpass").value, token: $("data-srtok").value.trim() }, out = $("data-srout");
        if (!/^https:\/\//i.test(c.url)) { out.textContent = "The address must start with https://"; return; }
        if (!c.ns || !c.db) { out.textContent = "Enter the namespace and database."; return; }
        if (auth.user === "root") { out.textContent = "Please use a limited database user, not root."; return; }
        out.textContent = "Connecting…";
        surrealQuery("INFO FOR DB;", Object.assign({}, c, auth)).then(function () {
          localStorage.setItem("ie-surconn:" + pid(), JSON.stringify(c)); sessionStorage.setItem("ie-surauth:" + pid(), JSON.stringify(auth));
          cache.surreal = null; log("Connected SurrealDB " + c.ns + "/" + c.db, "success"); paint(box);
        }).catch(function (e) { out.textContent = "Could not connect: " + e.message; });
      };
    }
  }

  window.__IEBackend = { open: open, supabase: sb, surreal: sr, schema: schema, summary: summary, surrealQuery: surrealQuery, surrealTable: surrealTable };
  setTimeout(function () { if (sb() || sr()) schema(false); }, 1500);
})();
