/* Imagine Engine history: undo/redo (canvas, flow, dev), Record + Version Log, and phone/tablet layout.
   Reads/writes editor state through window.__IE.raw (exposed by the bundle). Versions persist in
   localStorage "ie-ver:<projectId>" (ie- prefix, so they sync with the account). */
(function () {
  var FN = "https://zqiihhmdsdgwdcwmryym.supabase.co/functions/v1/imagine-ai";
  var ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaWloaG1kc2Rnd2Rjd21yeXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MTAyMDcsImV4cCI6MjA3Mzk4NjIwN30.ppEJAvP7mVrX-6uXA1_AlaJEDHPBcb297irRyBBT3YI";
  var MAX = 50;

  /* ---------- phone / tablet layout ---------- */
  var css = document.createElement("style");
  css.textContent =
    "html,body{max-width:100vw;overflow-x:hidden}" +
    ".ie-hdr{overflow-x:auto;scrollbar-width:none}.ie-hdr::-webkit-scrollbar{display:none}" +
    "body[data-mtab] .ie-mbar [data-mtab]{color:#a1a1aa}" +
    "body[data-mtab=ai] .ie-mbar [data-mtab=ai],body[data-mtab=widgets] .ie-mbar [data-mtab=widgets],body[data-mtab=projects] .ie-mbar [data-mtab=projects],body[data-mtab=content] .ie-mbar [data-mtab=content],body[data-mtab=design] .ie-mbar [data-mtab=design]{background:#f4f4f5;color:#18181b}" +
    "@media (max-width:767px){body[data-mside=left] .ie-left{display:flex!important;position:fixed;left:0;right:0;top:48px;bottom:52px;width:auto!important;z-index:40}" +
    "#ie-pages-slot select{max-width:110px!important}}" +
    "@media (max-width:1023px){body[data-mside=right] .ie-right{display:flex!important;position:fixed;left:0;right:0;top:48px;bottom:52px;width:auto!important;height:auto!important;max-height:none!important;z-index:40}" +
    ".iea-fab,#iea-fab{bottom:64px!important}}";
  document.head.appendChild(css);

  /* ---------- snapshots ---------- */
  function raw() { var ie = window.__IE; return ie && ie.raw; }
  // Canvas edits (text, styles, added elements) and the project background live in localStorage,
  // so every snapshot captures those keys too.
  var EDIT_RE = /^ie-(txt|sty|add):/;
  function editKeys(p) {
    var o = {};
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (EDIT_RE.test(k) || k === "ie-bg:" + p) o[k] = localStorage.getItem(k); }
    return o;
  }
  function snap() {
    var r = raw(); if (!r) return null;
    var p = (r.projects || []).filter(function (x) { return x.id === r.pid; })[0];
    var ed = editKeys(r.pid), sorted = {}; Object.keys(ed).sort().forEach(function (k) { sorted[k] = ed[k]; });
    return JSON.stringify({ pid: r.pid, project: p || null, nodes: r.nodes, links: r.links, files: r.files, edits: sorted });
  }
  function reloadCanvas() {
    var roots = window.__IERoots || [];
    window.__IERoots = roots.filter(function (x) { return x && x.isConnected; });
    window.__IERoots.forEach(function (x) { try { x.__ieReload && x.__ieReload(); } catch (e) {} });
    if (window.__IEApplyBg) window.__IEApplyBg();
    if (window.__IEElRefresh) try { window.__IEElRefresh(); } catch (e) {}
  }
  function apply(s) {
    var r = raw(); if (!r || !s) return; var o = JSON.parse(s);
    if (o.project) r.setProjects(function (q) { return q.map(function (x) { return x.id === o.project.id ? o.project : x; }); });
    if (o.nodes) r.setNodes(o.nodes); if (o.links) r.setLinks(o.links); if (o.files) r.setFiles(o.files);
    if (o.edits) {
      var cur = editKeys(o.pid || r.pid);
      for (var k in cur) if (!(k in o.edits)) localStorage.removeItem(k);
      for (var k2 in o.edits) { try { localStorage.setItem(k2, o.edits[k2]); } catch (e) {} }
      // Let React re-render sections first, then repaint edits.
      setTimeout(reloadCanvas, 60); setTimeout(reloadCanvas, 400);
    }
  }
  var past = [], future = [], cur = null, pid = null, busy = false, stable = 0, pending = null;
  setInterval(function () {
    var r = raw(); if (!r) return;
    if (r.pid !== pid) { pid = r.pid; past = []; future = []; cur = snap(); pending = null; paint(); return; }
    if (busy) { cur = snap(); busy = false; return; }
    var s = snap(); if (s === cur) { pending = null; return; }
    // group fast typing into one step: commit once the state has been still for ~0.6s
    if (s !== pending) { pending = s; stable = Date.now(); return; }
    if (Date.now() - stable < 600) return;
    past.push(cur); if (past.length > MAX) past.shift(); future = []; cur = s; pending = null; paint();
  }, 300);
  function undo() { if (!past.length) return; var s = snap(); if (s !== cur) { past.push(cur); cur = s; } future.push(cur); cur = past.pop(); busy = true; apply(cur); paint(); }
  function redo() { if (!future.length) return; past.push(cur); cur = future.pop(); busy = true; apply(cur); paint(); }
  document.addEventListener("keydown", function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    var t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    var k = e.key.toLowerCase();
    if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
    else if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
  });

  /* ---------- versions ---------- */
  function vkey() { return "ie-ver:" + (raw() ? raw().pid : ""); }
  function versions() { try { return JSON.parse(localStorage.getItem(vkey()) || "[]"); } catch (e) { return []; } }
  function token() {
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^sb-.*-auth-token$/.test(k)) { try { return JSON.parse(localStorage.getItem(k)).access_token; } catch (e) {} } }
    return null;
  }
  function record() {
    var s = snap(); if (!s) return;
    var name = prompt("Name this version", "Version " + new Date().toLocaleString()); if (name === null) return;
    var list = versions(); list.unshift({ id: Date.now(), name: name || "Version", at: new Date().toISOString(), data: s });
    try { localStorage.setItem(vkey(), JSON.stringify(list.slice(0, 30))); } catch (e) { alert("Not enough browser storage to save another version. Delete an old one first."); return; }
    say("Version saved");
  }
  function restore(v) {
    var t = token(); if (!t) { alert("Please sign in to restore versions."); return; }
    if (!confirm("Restore \"" + v.name + "\"? Restoring a version uses credits (free for admins). You can undo afterwards.")) return;
    fetch(FN, { method: "POST", headers: { "Content-Type": "application/json", apikey: ANON, Authorization: "Bearer " + t }, body: JSON.stringify({ action: "restore_version" }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || !res.j.ok) { alert(res.j.error || "Could not restore this version."); return; }
        past.push(snap()); future = []; busy = true; apply(v.data); cur = v.data; paint(); closeLog();
        say(res.j.charged > 0 ? "Version restored (charged " + res.j.charged + " credits)" : "Version restored");
      })
      .catch(function () { alert("Could not reach the server. Please try again."); });
  }
  var logEl = null;
  function closeLog() { if (logEl) { logEl.remove(); logEl = null; } }
  function openLog() {
    if (logEl) { closeLog(); return; }
    logEl = document.createElement("div");
    logEl.style.cssText = "position:fixed;top:52px;right:8px;z-index:200;width:min(320px,calc(100vw - 16px));max-height:70vh;overflow:auto;background:#09090b;border:1px solid #27272a;border-radius:14px;padding:10px;font:12px system-ui;color:#e4e4e7;box-shadow:0 12px 40px rgba(0,0,0,.6)";
    var list = versions();
    logEl.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>Version log</b><button data-x style="' + B + '">Close</button></div>' +
      (list.length ? "" : '<div style="color:#71717a">No versions yet. Press Record to save one.</div>');
    logEl.querySelector("[data-x]").onclick = closeLog;
    list.forEach(function (v, i) {
      var row = document.createElement("div");
      row.style.cssText = "display:flex;gap:6px;align-items:center;padding:6px 0;border-top:1px solid #18181b";
      var o = {}; try { o = JSON.parse(v.data); } catch (e) {}
      var n = o.project && o.project.sections ? o.project.sections.length : 0;
      row.innerHTML = '<div style="flex:1;min-width:0"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div><div style="color:#71717a;font-size:10px">' + new Date(v.at).toLocaleString() + " · " + n + " widgets</div></div>";
      row.firstChild.firstChild.textContent = v.name;
      var r = document.createElement("button"); r.textContent = "Restore"; r.style.cssText = B + ";background:#7c3aed;border-color:#7c3aed;color:#fff"; r.onclick = function () { restore(v); };
      var d = document.createElement("button"); d.textContent = "Delete"; d.style.cssText = B; d.onclick = function () { if (!confirm("Delete this version?")) return; var l = versions(); l.splice(i, 1); localStorage.setItem(vkey(), JSON.stringify(l)); closeLog(); openLog(); };
      row.appendChild(r); row.appendChild(d); logEl.appendChild(row);
    });
    document.body.appendChild(logEl);
  }
  function say(m) {
    var d = document.createElement("div"); d.textContent = m;
    d.style.cssText = "position:fixed;top:56px;left:50%;transform:translateX(-50%);z-index:300;background:#18181b;border:1px solid #3f3f46;color:#fff;padding:6px 12px;border-radius:9999px;font:12px system-ui";
    document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2200);
  }

  /* ---------- header buttons ---------- */
  var B = "height:28px;min-width:28px;border-radius:9999px;background:#18181b;color:#e4e4e7;border:1px solid #27272a;font:11px system-ui;padding:0 8px;cursor:pointer;white-space:nowrap";
  var u, rd;
  function paint() {
    if (u) { u.disabled = !past.length; u.style.opacity = past.length ? "1" : ".4"; }
    if (rd) { rd.disabled = !future.length; rd.style.opacity = future.length ? "1" : ".4"; }
  }
  function mk(txt, title, fn) { var b = document.createElement("button"); b.textContent = txt; b.title = title; b.setAttribute("aria-label", title); b.style.cssText = B; b.onclick = fn; return b; }
  setInterval(function () {
    var slot = document.getElementById("ie-hist-slot"); if (!slot || slot.firstChild) return;
    u = mk("\u21B6", "Undo (Ctrl+Z)", undo); rd = mk("\u21B7", "Redo (Ctrl+Y)", redo);
    var rec = mk("", "Record a version", record);
    rec.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ef4444;margin-right:5px;vertical-align:middle"></span>Record';
    var log = mk("Log", "Version log", openLog);
    [u, rd, rec, log].forEach(function (b) { slot.appendChild(b); }); paint();
  }, 400);
})();
