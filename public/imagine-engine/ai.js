/* Genius AI — universal builder copilot for Imagine Engine. */
(function () {
  var FN = "https://zqiihhmdsdgwdcwmryym.supabase.co/functions/v1/imagine-ai";
  var ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaWloaG1kc2Rnd2Rjd21yeXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MTAyMDcsImV4cCI6MjA3Mzk4NjIwN30.ppEJAvP7mVrX-6uXA1_AlaJEDHPBcb297irRyBBT3YI";
  var LOGO = "/__l5e/assets-v1/78c75160-d976-42d1-8c63-d01bef660475/imagine-engine-logo.png";
  var STORE = "imagine-ai-chat-v1";
  var messages = [];
  try { messages = JSON.parse(localStorage.getItem(STORE) || "[]"); } catch (e) {}
  var busy = false;

  function token() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.*-auth-token$/.test(k)) {
          var v = JSON.parse(localStorage.getItem(k));
          if (v && v.access_token) return v.access_token;
          if (v && v.currentSession) return v.currentSession.access_token;
        }
      }
    } catch (e) {}
    return null;
  }
  function esc(s) { return s.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  function inl(t) {
    return esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/__(.+?)__/g, "<b>$1</b>")
      .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, "$1<i>$2</i>").replace(/`([^`]+)`/g, '<code class="iea-code">$1</code>')
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\*{1,3}|(^|\s)#+(?=\s)/g, "$1");
  }
  function md(s) {
    s = String(s || "").replace(/\r/g, "").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "");
    var parts = s.split(/```/);
    return parts.map(function (p, i) {
      if (i % 2) { var nl = p.indexOf("\n"); return '<pre class="iea-pre">' + esc(nl > -1 ? p.slice(nl + 1) : p).replace(/\n$/, "") + "</pre>"; }
      var lines = p.split("\n"), html = "", list = null, para = [], tbl = [];
      function flushP() { if (para.length) { html += "<p>" + para.map(inl).join(" ") + "</p>"; para = []; } }
      function flushL() { if (list) { html += "<" + list.t + ">" + list.items.map(function (x) { return "<li>" + inl(x) + "</li>"; }).join("") + "</" + list.t + ">"; list = null; } }
      function flushT() { if (tbl.length) { var rows = tbl.filter(function (r) { return !/^[\s|:-]+$/.test(r); }).map(function (r) { return r.replace(/^\s*\||\|\s*$/g, "").split("|"); });
        html += '<table class="iea-tb">' + rows.map(function (r, k) { var tg = k ? "td" : "th"; return "<tr>" + r.map(function (c) { return "<" + tg + ">" + inl(c.trim()) + "</" + tg + ">"; }).join("") + "</tr>"; }).join("") + "</table>"; tbl = []; } }
      function flush() { flushP(); flushL(); flushT(); }
      lines.forEach(function (ln) {
        var m;
        if (/^\s*\|.*\|\s*$/.test(ln)) { flushP(); flushL(); tbl.push(ln); return; } else flushT();
        if (!ln.trim()) { flush(); return; }
        if (/^\s*([-*_])\1{2,}\s*$/.test(ln)) { flush(); html += '<hr class="iea-hr">'; return; }
        if ((m = /^\s*(#{1,6})\s+(.*)$/.exec(ln))) { flush(); var lv = Math.min(4, m[1].length + 1); html += "<h" + lv + ' class="iea-hd">' + inl(m[2].replace(/#+\s*$/, "")) + "</h" + lv + ">"; return; }
        if ((m = /^\s*>\s?(.*)$/.exec(ln))) { flush(); html += '<div class="iea-q">' + inl(m[1]) + "</div>"; return; }
        if ((m = /^\s*[-*+\u2022]\s+(.*)$/.exec(ln))) { flushP(); if (!list || list.t !== "ul") { flushL(); list = { t: "ul", items: [] }; } list.items.push(m[1]); return; }
        if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(ln))) { flushP(); if (!list || list.t !== "ol") { flushL(); list = { t: "ol", items: [] }; } list.items.push(m[1]); return; }
        if (list && /^\s{2,}\S/.test(ln)) { list.items[list.items.length - 1] += " " + ln.trim(); return; }
        flushL(); para.push(ln.trim());
      });
      flush(); return html;
    }).join("");
  }
  function ctx() {
    var ie = window.__IE || {};
    var files = ((ie.raw && ie.raw.files) || []).map(function (f) { return { name: f.name, content: String(f.content || "") }; });
    var budget = 36000, fileCtx = files.map(function (f) {
      var full = /^apps\//.test(f.name) || f.content.length < 3000;
      var c = full && budget > 0 ? f.content.slice(0, Math.min(budget, 24000)) : "";
      budget -= c.length; return { name: f.name, size: f.content.length, content: c };
    });
    var sel = null; try { var s = document.querySelector("[data-ie-selected], .ie-selected"); if (s) sel = { tag: s.tagName, text: (s.textContent || "").trim().slice(0, 120) }; } catch (e) {}
    var pin = window.__IEPin; if (pin && pin.file) { try { var lines = String((window.__IEFiles && window.__IEFiles.get(pin.file)) || "").split("\n"), ln = +pin.line || 1, a = Math.max(0, ln - 9), b = Math.min(lines.length, ln + 12); sel = { file: pin.file, line: ln, tag: pin.tag, text: (pin.text || "").slice(0, 200), snippet: lines.slice(a, b).map(function (x, i) { return (a + i + 1) + ": " + x; }).join("\n") }; } catch (e) {} }
    return { widgets: ie.widgets || [], tables: ie.tables || [], nodes: ie.nodes || [], graph: ie.graph || null, programs: ie.programs || [], sections: (ie.sections || []).slice(0, 40), state: Object.keys(window.__IEState || {}), files: fileCtx, selected: sel, legacyBlocks: legacyBlocks() };
  }
  /* static template blocks placed before templates became Dev files */
  function legacyBlocks() {
    var out = [];
    (function walk(doc) { try { doc.querySelectorAll("iframe").forEach(function (f) { var m = /\/imagine-engine\/blocks\/(cargame|webgl|game)\.html/.exec(f.getAttribute("src") || ""); if (m) { if (out.indexOf(m[1]) < 0) out.push(m[1]); } else { try { walk(f.contentDocument); } catch (e) {} } }); } catch (e) {} })(document);
    return out;
  }
  var LEG = { cargame: "StreetRacer", webgl: "Hero3D", game: "StarCatcher" };
  /* migrate old static blocks into editable apps/*.html Dev files so follow-up edits reach them */
  function migrateLegacy() {
    var list = legacyBlocks(); if (!list.length || !window.__IEFiles) return Promise.resolve();
    return Promise.all(list.map(function (k) {
      var file = "apps/" + LEG[k] + ".html"; if (window.__IEFiles.get(file)) return null;
      return fetch("/imagine-engine/blocks/" + k + ".html").then(function (r) { return r.text(); }).then(function (code) {
        window.__IEFiles.put(file, code, "html"); try { localStorage.setItem("ie-live:" + file, code); } catch (e) {}
        var raw = window.__IE && window.__IE.raw, from = "/imagine-engine/blocks/" + k + ".html?b=1", to = "/imagine-engine/blocks/liveapp.html?b=1&kind=html&file=" + encodeURIComponent(file);
        if (raw && raw.setProjects) raw.setProjects(function (ps) { return ps.map(function (pr) { return pr.id !== raw.pid ? pr : JSON.parse(JSON.stringify(pr).split(from).join(to)); }); });
      }).catch(function () {});
    }));
  }
  var REBUILD = /\b(revamp|redesign|rebuild|remake|start over|from scratch|recreate|build (it )?again|make (it )?again|brand new|replace (the )?(whole|entire))\b/i;
  function currentTab() { return (window.__IE && window.__IE.mode) || "canvas"; }

  function extractActions(text) {
    var found = [], clean = String(text || ""), roots = [];
    var tryParse = function (s) { try { var v = JSON.parse(s.trim()); var arr = Array.isArray(v) ? v : (v && Array.isArray(v.actions) ? v.actions : [v]); return arr.filter(function (a) { return a && typeof a === "object" && typeof a.type === "string"; }); } catch (e) { return null; } };
    /* Source files arrive as plain code fences (no JSON escaping, so big apps never break). Accepted forms:
       ```tsx file=apps/Name.tsx | ```tsx:apps/Name.tsx | ```tsx apps/Name.tsx | ```tsx title="apps/Name.tsx" | first line "// file: apps/Name.tsx" */
    var PATH = "(?:\\./|/)?((?:apps|components|lib|src|styles|custom-scripts|hooks|pages|scenes)\\/[\\w\\-./]+\\.(?:tsx|ts|jsx|js|html|css|json))";
    var addSrc = function (path, body) {
      path = path.replace(/^src\/(?=apps\/)/, "");
      var code = String(body).replace(/^\s*(?:\/\/|<!--|\/\*)\s*(?:file|path)\s*[:=]\s*[^\n]*\n/i, "").replace(/\s+$/, "") + "\n";
      if (!code.trim()) return;
      var hit = function (a) { return a.name === path || (a.type === "addLiveApp" && "apps/" + a.name === path.replace(/\.\w+$/, "")); };
      roots = roots.filter(function (a) { return !hit(a); }); found = found.filter(function (a) { return !hit(a); }); /* last copy of a file wins */
      if (/^apps\/[^/]+\.(tsx|jsx|html)$/i.test(path)) roots.push({ type: "addLiveApp", name: path.replace(/^apps\//, "").replace(/\.\w+$/, ""), kind: /\.html$/i.test(path) ? "html" : "react", code: code });
      else found.push({ type: "addFile", name: path, content: code });
    };
    clean = clean.replace(new RegExp("```[\\w-]*(?:[ \\t]*:[ \\t]*|[ \\t]+)(?:(?:file|path|name|title|filename)\\s*=\\s*)?[\"']?" + PATH + "[\"']?[^\\n]*\\n([\\s\\S]*?)(?:```|$(?![\\s\\S]))", "gi"), function (all, path, body) { addSrc(path, body); return ""; });
    clean = clean.replace(new RegExp("```[\\w-]*[ \\t]*\\n[ \\t]*(?:\\/\\/|<!--|\\/\\*)[ \\t]*(?:file|path)?[ \\t]*[:=]?[ \\t]*" + PATH + "[^\\n]*\\n([\\s\\S]*?)```", "gi"), function (all, path, body) { addSrc(path, body); return ""; });
    clean = clean.replace(/```(actions|json|javascript|js)?\s*([\s\S]*?)```/gi, function (all, lang, body) { var r = tryParse(body); if (r && r.length) { found = found.concat(r); return ""; } return lang === "actions" ? "" : all; });
    // Bare JSON arrays / objects with "type" outside fences
    var i = 0;
    while (i < clean.length) {
      var c = clean[i];
      if ((c === "[" || c === "{") && /"type"\s*:/.test(clean.slice(i, i + 400))) {
        var depth = 0, inStr = false, esc = false, j = i;
        for (; j < clean.length; j++) { var ch = clean[j];
          if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; continue; }
          if (ch === '"') inStr = true; else if (ch === "[" || ch === "{") depth++; else if (ch === "]" || ch === "}") { depth--; if (depth === 0) break; } }
        var r2 = tryParse(clean.slice(i, j + 1));
        if (r2 && r2.length) { found = found.concat(r2); clean = clean.slice(0, i) + clean.slice(j + 1); continue; }
      }
      i++;
    }
    found = found.filter(function (a) { return a.type !== "addLiveApp" || !roots.some(function (r) { return r.name === a.name; }); }).concat(roots);
    return { list: found, clean: clean.replace(/\n{3,}/g, "\n\n").trim() };
  }
  var APPWORDS = /\b(game|car|cars|player|enemy|enemies|level|scene|speed|lane|lanes|obstacle|bump|jump|score|traffic|road|physics|camera|character|3d|app|ui|button|animation)\b/i;
  var FLOWTYPES = /^(addNode|connect|createMetascript|callMetascript|runFlow|clearFlow)$/;
  /* continuous development: changes to a running app must edit its apps/* file, never add disconnected Flow scripts */
  function guard(list, done) {
    var last = (messages.filter(function (m) { return m.role === "user"; }).pop() || {}).content || "";
    var hasApp = ((window.__IE && window.__IE.raw && window.__IE.raw.files) || []).some(function (f) { return /^apps\//.test(f.name); });
    var editsFile = list.some(function (a) { return /^(patchFile|updateFile|addFile|addLiveApp|applyTemplate)$/.test(a.type); });
    var wantsFlow = /\b(flow|automation|automate|workflow|trigger|schedule|webhook|database|query|email|notify)\b/i.test(last);
    if (!hasApp || editsFile || wantsFlow || REBUILD.test(last) || !APPWORDS.test(last)) return list;
    var kept = list.filter(function (a) { return !FLOWTYPES.test(a.type); });
    if (kept.length !== list.length) { done.push("Skipped Flow scripts that could not reach the running app - ask again and Genius AI will edit the app file"); needFix = true; }
    return kept;
  }
  var needFix = false;
  window.__IEAIApply = function (text) { return runActions(text); };
  var SITEWORDS = /\b(landing|website|web site|homepage|home page|marketing page|portfolio|one-?pager|blog)\b/i;
  var APPKIND = /\b(app|apps|application|dashboard|crm|erp|tool|tracker|calculator|game|platform|portal|system|manager|editor|booking|scheduler|marketplace|store|shop|e-?commerce|chat|messenger|kanban|todo|to-do|inventory|planner|simulator|visuali[sz]er|3d|configurator|quiz|saas|analytics|admin panel|wallet|timer|player|feed|social network|lms|course)\b/i;
  /* what kind of build this message is: a real app (React live app + libraries) or a marketing site (canvas sections) */
  function buildKind(text) {
    var hasApp = ((window.__IE && window.__IE.raw && window.__IE.raw.files) || []).some(function (f) { return /^apps\//.test(f.name); });
    if (hasApp && !REBUILD.test(text)) return "edit";
    if (APPKIND.test(text) && !(SITEWORDS.test(text) && !/\b(app|dashboard|game|tool|platform|system|store|shop)\b/i.test(text))) return "app";
    return SITEWORDS.test(text) ? "site" : "edit";
  }
  function runActions(text) {
    var ex = extractActions(text);
    var done = [];
    var clean = ex.clean || (ex.list.length ? "Done — applied your changes to the canvas." : "");
    if (!ex.list.length || !window.__IE) return { text: clean, done: done };
    try {
      var list = guard(ex.list, done);
      var ie = window.__IE, refs = {}, wantRun = false;
      var rid = function (r) { return refs[r] || r; };
      (Array.isArray(list) ? list : [list]).slice(0, 40).forEach(function (a) {
        ie = window.__IE;
        if (a.type === "addWidget" && ie.widgets.indexOf(a.id) > -1) { ie.addWidget(a.id); done.push("Added " + a.id); }
        else if (a.type === "addNode") { var id = ie.addNode(a.kind || "action", a.subType || "custom", a.label, a.params, a.x, a.y); if (a.ref) refs[a.ref] = id; done.push("Node " + (a.label || a.subType)); }
        else if (a.type === "connect" && a.from && a.to) { ie.connect(rid(a.from), rid(a.to), a.fromPort); done.push("Linked"); }
        else if (a.type === "removeNode" && a.id) { ie.removeNode(rid(a.id)); done.push("Removed node"); }
        else if (a.type === "clearFlow") { ie.clearFlow(); done.push("Cleared flow"); }
        else if (a.type === "createMetascript" && a.name) { var pid = ie.createMetascript(a.name, a.code || "", a.description); if (a.ref) refs[a.ref] = pid; done.push("Metascript " + a.name); }
        else if (a.type === "callMetascript" && a.id) { var pid2 = rid(a.id); var nid = ie.addNode("metascript", "metascriptRef", a.label || "Metascript", { metascriptId: pid2 }, a.x, a.y); if (a.ref) refs[a.ref] = nid; done.push("Metascript node"); }
        else if (a.type === "addCustomSection" && Array.isArray(a.children) && ie.addSection) {
          var sfx = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
          var mk = function (n, i) { var tp = ["h1", "p", "button", "badge", "card", "div", "grid"].indexOf(n.type) > -1 ? n.type : "p";
            return { id: tp + "_" + sfx + "_" + i + Math.random().toString(36).slice(2, 4), type: tp, content: String(n.content || ""), style: Object.assign({}, n.style || {}), children: Array.isArray(n.children) ? n.children.map(mk) : undefined }; };
          ie.addSection({ id: "sec_ai_" + sfx, type: "section", style: Object.assign({ backgroundColor: "#0b0b0c", color: "#fafafa", borderColor: "#27272a", borderWidth: "1px", borderStyle: "solid", borderRadius: "24px", padding: "32px" }, a.style || {}), children: a.children.map(mk) });
          done.push("Built section");
        }
        else if (a.type === "removeSection" && a.id) { ie.removeSection(a.id); done.push("Removed section"); }
        else if (a.type === "addTable" && a.name) { ie.addTable({ id: "tbl_" + Date.now() + Math.random().toString(36).slice(2, 5), name: a.name, columns: a.columns || ["id"], rows: [] }); done.push("Table " + a.name); }
        else if (a.type === "setMode" && a.mode) { ie.setMode(a.mode); done.push("Opened " + a.mode); }
        else if (a.type === "runFlow") { wantRun = true; }
        else if (a.type === "log" && a.message) { ie.log("AI: " + a.message); }
        else if (/^(addToCart|openCart|checkout|clearCart|setCartConfig|addPage|goPage)$/.test(a.type) && window.__IEX) { window.__IEX[a.type](a); done.push(a.type === "addPage" ? "Page " + a.name : "Cart updated"); }
        else if (a.type === "applyTemplate" && window.__IEBlocks) { var tn = window.__IEBlocks.apply(a.template || a.id); if (tn) done.push("Template " + tn); }
        else if (a.type === "loadLibrary" && window.__IELoad && a.name) { window.__IELoad(a.name).catch(function () {}); done.push("Loaded " + a.name); }
        else if ((a.type === "addFile" || a.type === "updateFile") && a.name && window.__IEFiles) { var nc = a.content || a.code || ""; window.__IEFiles.put(a.name, nc, a.lang); try { if (/^apps\//.test(a.name)) localStorage.setItem("ie-live:" + a.name, nc); } catch (e) {} done.push((a.type === "updateFile" ? "Updated " : "File ") + a.name); }
        else if (a.type === "patchFile" && a.name && window.__IEFiles && Array.isArray(a.edits)) {
          var cur = window.__IEFiles.get(a.name); if (cur == null) { done.push("Missing file " + a.name); return; }
          var ok = 0, miss = 0;
          a.edits.forEach(function (e) { if (e && typeof e.find === "string" && e.find && cur.indexOf(e.find) > -1) { cur = cur.replace(e.find, String(e.replace == null ? "" : e.replace)); ok++; } else miss++; });
          if (ok) { window.__IEFiles.put(a.name, cur); try { localStorage.setItem("ie-live:" + a.name, cur); } catch (e) {} }
          done.push("Edited " + a.name + " (" + ok + " change" + (ok === 1 ? "" : "s") + (miss ? ", " + miss + " not found" : "") + ")");
        }
        else if (a.type === "dispatchApp" && a.action) { var n2 = window.__IEAppBus.broadcast(a.action, a.payload); done.push("Sent " + a.action + " to " + n2 + " app" + (n2 === 1 ? "" : "s")); }
        else if (a.type === "addLiveApp" && (a.code || a.content) && window.__IEFiles) { var lf = window.__IEFiles.liveApp(a.name || "App", a.code || a.content, a.kind); done.push("Live app " + (lf || a.name || "App")); }
      });
      if (wantRun) { setTimeout(function () { window.__IE && window.__IE.run(); }, 500); done.push("Flow running"); }
    } catch (e) { done.push("Could not apply some changes"); }
    return { text: clean, done: done };
  }

  /* ---------- Flow runtime: real actions ---------- */
  var SB = FN.replace("/functions/v1/imagine-ai", "");
  window.__IEState = window.__IEState || {};
  function L(msg, type) { if (window.__IE) window.__IE.log(msg, type); }
  function hdr() { var t = token(); return { apikey: ANON, Authorization: "Bearer " + (t || ANON), "Content-Type": "application/json" }; }
  function put(k, v) { if (k) window.__IEState[k] = v; }
  function safeTable(t) { return /^[A-Za-z_][A-Za-z0-9_]*$/.test(t || "") ? t : null; }
  /* Flow db steps use the same IE.db collections as live apps and the Database tab (table "App.collection" or "collection") */
  function dbMatch(p) { return function (r) { return !p.filterColumn || p.filterValue === "" || p.filterValue == null || String(r[p.filterColumn]) === String(p.filterValue); }; }
  /* connected user Supabase project (Database tab "Connect Supabase"): plain table names go there */
  function remoteDb() { var D = window.__IEData; return D && D.remote ? D.remote() : null; }
  function rq(c, tb, method, qs, body) {
    var h = { apikey: c.key, Authorization: "Bearer " + c.key, "Content-Type": "application/json", Prefer: "return=representation" };
    return fetch(c.url + "/rest/v1/" + encodeURIComponent(tb) + "?" + qs, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.text().then(function (t) { var j = null; try { j = t ? JSON.parse(t) : []; } catch (e) {} if (!r.ok) throw new Error((j && (j.message || j.hint)) || ("HTTP " + r.status)); return Array.isArray(j) ? j : j ? [j] : []; }); });
  }
  function rfilter(p, op) { return p.filterColumn && p.filterValue !== "" && p.filterValue != null ? encodeURIComponent(p.filterColumn) + "=" + encodeURIComponent((op || "eq") + "." + p.filterValue) : ""; }
  function useRemote(p) { var c = remoteDb(); return c && p.table && String(p.table).indexOf(".") < 0 && safeTable(p.table) ? c : null; }
  function dbq(p, method, body, label) {
    /* "surreal:person" (or plain names when only SurrealDB is connected) go to the project's SurrealDB */
    var B = window.__IEBackend, tn = String(p.table || "");
    if (B && B.surreal() && (/^surreal:/.test(tn) || (!remoteDb() && tn && tn.indexOf(".") < 0 && safeTable(tn)))) {
      var st = B.surrealTable(tn.replace(/^surreal:/, "")), sn = tn.replace(/^surreal:/, "");
      if ((method === "PATCH" || method === "DELETE") && !p.filterColumn) { L(label + ": a filter is required", "error"); return "filter required"; }
      var wh = p.filterColumn && p.filterValue !== "" && p.filterValue != null ? (function () { var o = {}; o[p.filterColumn] = p.filterValue; return o; })() : null, sj;
      if (method === "GET") sj = st.list({ where: wh, limit: p.limit });
      else if (method === "POST") sj = st.insert(body || {}).then(function (x) { return [x]; });
      else sj = st.list({ where: wh, limit: 1000 }).then(function (rows) { return Promise.all(rows.map(function (x) { return method === "PATCH" ? st.update(x.id, body || {}) : st.remove(x.id).then(function () { return x; }); })); });
      sj.then(function (rows) { put(p.stateKey, rows); L(label + " " + sn + " (SurrealDB): " + rows.length + " rows"); })
        .catch(function (e) { L(label + " " + sn + " (SurrealDB) failed: " + e.message, "error"); });
      return sn;
    }
    var c = useRemote(p);
    if (c) {
      if ((method === "PATCH" || method === "DELETE") && !p.filterColumn) { L(label + ": a filter is required", "error"); return "filter required"; }
      var qs = (method === "GET" ? "select=*&limit=" + (Number(p.limit) || 10) + "&" : "") + rfilter(p);
      rq(c, p.table, method, qs, body).then(function (rows) { put(p.stateKey, rows); L(label + " " + p.table + " (Supabase): " + rows.length + " rows"); })
        .catch(function (e) { L(label + " " + p.table + " (Supabase) failed: " + e.message, "error"); });
      return p.table;
    }
    var D = window.__IEData, t = D && D.table(p.table, p.app); if (!t) { L(label + ": data is still loading", "error"); return "not ready"; }
    if (!p.table) { L(label + ": choose a table name", "error"); return "missing table"; }
    if ((method === "PATCH" || method === "DELETE") && !p.filterColumn) { L(label + ": a filter is required", "error"); return "filter required"; }
    var r = D.resolve(p.table, p.app), name = r.app + "." + r.col, job;
    if (method === "GET") job = t.list().then(function (rows) { return rows.filter(dbMatch(p)).slice(0, Number(p.limit) || 10); });
    else if (method === "POST") job = t.insert(body || {}).then(function (x) { return [x]; });
    else job = t.list().then(function (rows) { var hit = rows.filter(dbMatch(p)); return Promise.all(hit.map(function (x) { return method === "PATCH" ? t.update(x.id, body || {}) : t.remove(x.id).then(function () { return x; }); })); });
    job.then(function (res) { put(p.stateKey, res); L(label + " " + name + ": " + res.length + " rows"); if (method !== "GET" && window.__IEDataRefresh) window.__IEDataRefresh(); })
      .catch(function (e) { L(label + " " + name + " failed: " + ((e && e.message) || "error"), "error"); });
    return name;
  }
  function http(p, method) {
    if (!/^https:\/\//.test(p.url || "")) { L("Request needs an https:// URL", "error"); return "bad url"; }
    var opt = { method: method };
    if (method !== "GET" && p.body != null) { opt.body = typeof p.body === "string" ? p.body : JSON.stringify(p.body); opt.headers = { "Content-Type": "application/json" }; }
    fetch(p.url, opt).then(function (r) { return r.text().then(function (x) { var v = x; try { v = JSON.parse(x); } catch (e) {} put(p.stateKey, v); L(method + " " + p.url + " -> " + r.status, r.ok ? "success" : "error"); }); })
      .catch(function () { L(method + " " + p.url + " blocked or offline", "error"); });
    return p.url;
  }
  function frames3D(doc, out) {
    out = out || []; var fs = doc.querySelectorAll("iframe");
    for (var i = 0; i < fs.length; i++) { var src = fs[i].getAttribute("src") || ""; if (/imagine-engine\/blocks\/|\/imagine-studio|\/level\//.test(src) || fs[i].getAttribute("data-ie-3d") === "1") out.push(fs[i].contentWindow); else { try { frames3D(fs[i].contentDocument, out); } catch (e) {} } }
    return out;
  }
  function send3D(msg) { var f = frames3D(document); f.forEach(function (w) { try { w.postMessage(msg, "*"); } catch (e) {} }); if (!f.length) L("No 3D block on this page", "warning"); return f.length; }
  window.__IE3DSend = send3D;
  function toast(msg, type) {
    var d = document.createElement("div");
    d.textContent = msg;
    d.style.cssText = "position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:10000;padding:10px 16px;border-radius:12px;font:12px system-ui;color:#fff;box-shadow:0 10px 30px #0008;background:" + (type === "error" ? "#b91c1c" : type === "warning" ? "#b45309" : "linear-gradient(135deg,#0d9488,#a21caf)");
    document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2600);
  }
  function makeCtx(node) {
    var ie = window.__IE || {};
    return {
      state: window.__IEState,
      getState: function (k) { return window.__IEState[k]; },
      setState: function (patch) { Object.assign(window.__IEState, patch || {}); },
      addSection: function (w) { if (ie.widgets && ie.widgets.indexOf(w) > -1) ie.addWidget(w); else L("Unknown widget " + w, "error"); },
      removeSection: function (id) { ie.removeSection(id); },
      notify: function (m, t) { toast(String(m), t); },
      log: function (m) { L("script: " + m, "log"); },
      db: function (table) {
        return {
          select: function (o) { return dbq(Object.assign({ table: table }, o || {}), "GET", null, "select"); },
          insert: function (v) { return dbq({ table: table }, "POST", v, "insert"); },
        };
      },
      fetch: function (url, o) { return fetch(url, o); },
      broadcast: function (action, payload) { return window.__IEAppBus.broadcast(action, payload); },
      on: function (event, cb) { return window.__IEAppBus.on(event, function (p) { try { cb(p, makeCtx(node)); } catch (e) { L("ctx.on " + event + ": " + e.message, "error"); } }); },
      node: node,
    };
  }

  /* ---------- App bus: Flow <-> running live apps / games (apps/*) ---------- */
  (function () {
    var subs = {};
    function frames() {
      var out = [];
      (function walk(doc) { try { doc.querySelectorAll("iframe").forEach(function (f) { if (/\/imagine-engine\/blocks\/|\/imagine-studio|\/level\//.test(f.getAttribute("src") || "") || f.getAttribute("data-ie-3d") === "1") out.push(f); else { try { walk(f.contentDocument); } catch (e) {} } }); } catch (e) {} })(document);
      return out;
    }
    window.addEventListener("message", function (e) {
      var d = e.data; if (!d || !d.ieBus || !d.event) return;
      window.__IEState["app:" + d.event] = d.payload === undefined ? true : d.payload;
      (subs[d.event] || []).concat(subs["*"] || []).forEach(function (cb) { try { cb(d.payload, d.event); } catch (x) {} });
      if (window.__IEBus) try { if (window.__IEBus.set) window.__IEBus.set("app:" + d.event, window.__IEState["app:" + d.event]); else if (window.__IEBus.emit) window.__IEBus.emit("app:" + d.event, d.payload); } catch (x) {}
      runAppTriggers(d.event, d.payload);
    });
    /* Flow trigger nodes with params.appEvent (or event) equal to an IE.emit name run their chain */
    function runAppTriggers(ev, payload) {
      var raw = window.__IE && window.__IE.raw; if (!raw || !raw.nodes) return;
      var nodes = raw.nodes || [], links = raw.links || [], byId = {};
      nodes.forEach(function (n) { byId[n.id] = n; });
      var starts = nodes.filter(function (n) { var p = n.params || {}; return n.kind === "trigger" && (p.appEvent === ev || p.event === ev || p.appEvent === "*"); });
      starts.forEach(function (t) {
        window.__IEState.event = { name: ev, payload: payload };
        if (window.__IE.log) window.__IE.log("App event " + ev + " → " + (t.label || t.id));
        var q = [t.id], seen = {}, steps = 0;
        while (q.length && steps++ < 200) {
          var id = q.shift(); if (seen[id]) continue; seen[id] = 1; var n = byId[id]; if (!n) continue; var port = null;
          try {
            if (n.kind === "customScript" || (n.kind !== "trigger" && n.code)) window.__IEMeta && window.__IEMeta(n.code || (n.params || {}).code || "", n);
            else if (n.kind === "condition") { var ex = (n.params || {}).expression || (n.params || {}).condition; if (ex) { port = !!Function("state", "event", "payload", "return (" + ex + ")")(window.__IEState, window.__IEState.event, payload) ? "true" : "false"; } }
            else if (n.kind !== "trigger" && window.__IEX && typeof window.__IEX[n.subType] === "function") window.__IEX[n.subType](Object.assign({}, n.params || {}), n);
          } catch (e) { if (window.__IE.log) window.__IE.log((n.label || n.id) + ": " + e.message, "error"); continue; }
          links.forEach(function (l) { if (l.from === id && (!port || !l.fromPort || l.fromPort === port)) q.push(l.to); });
        }
      });
    }
    window.__IEAppBus = {
      broadcast: function (action, payload) { var fs = frames(); fs.forEach(function (f) { try { f.contentWindow.postMessage({ __IE_ACTION: String(action), payload: payload }, "*"); } catch (e) {} }); return fs.length; },
      on: function (event, cb) { (subs[event] = subs[event] || []).push(cb); return function () { subs[event] = (subs[event] || []).filter(function (x) { return x !== cb; }); }; },
    };
  })();
  // turn module / TypeScript style scripts into plain JS that runs inside Function("ctx", code)
  window.__IESan = function (code) {
    code = String(code || "").replace(/\r/g, "")
      .replace(/^\s*import\s[^\n]*$/gm, "")
      .replace(/\bexport\s+default\s+/g, "var __def = ")
      .replace(/\bexport\s+/g, "")
      .replace(/\(\s*ctx\s*:\s*[A-Za-z_$][\w$<>\[\]]*\s*\)/g, "(ctx)")
      .replace(/\)\s*:\s*(?:Promise<[^>]*>|[A-Za-z_$][\w$]*(?:\[\])?)\s*(=>|\{)/g, ") $1")
      .replace(/\bas\s+(?:any|unknown|string|number|boolean)\b/g, "");
    var fn = code.match(/(?:function\s+|(?:const|let|var)\s+)([A-Za-z_$][\w$]*)\s*(?:\(|=\s*(?:async\s*)?(?:\(|[A-Za-z_$][\w$]*\s*=>|function))/);
    if (/var __def = /.test(code)) code += "\n;return typeof __def==='function'?__def(ctx):__def;";
    else if (fn) code += "\n;return typeof " + fn[1] + "==='function'?" + fn[1] + "(ctx):undefined;";
    return code;
  };
  window.__IEMeta = function (code, node) {
    code = String(code || "").replace(/\bexport\s+(default\s+)?/g, "");
    var fn = code.match(/function\s+([A-Za-z_$][\w$]*)\s*\(/);
    try { new Function("ctx", code + (fn ? "\nreturn " + fn[1] + "(ctx);" : ""))(makeCtx(node)); }
    catch (e) { L("Metascript error: " + e.message, "error"); throw e; }
  };
  window.__IEX = {
    addToCart: function (p) { window.__IECart.add({ name: p.name, price: p.price, image: p.image, qty: p.qty }); return p.name; },
    openCart: function () { window.__IECart.open(); return "open"; },
    checkout: function () { window.__IECart.checkout(); return "checkout"; },
    clearCart: function () { window.__IECart.clear(); return "cleared"; },
    setCartConfig: function (p) { window.__IECart.setConfig(p.config || p); return "cart updated"; },
    addPage: function (p) { window.__IE.addPage(p.name); return p.name; },
    goPage: function (p) { var ie = window.__IE, pg = (ie.pages || []).filter(function (x) { return x.id === p.pageId || x.name === p.name; })[0]; if (!pg) throw new Error("No such page"); ie.goPage(pg.id); return pg.name; },
    fetchData: function (p) { return http(p, "GET"); },
    httpRequest: function (p) { return http(p, String(p.method || "POST").toUpperCase()); },
    dbSelect: function (p) { return dbq(p, "GET", null, "select"); },
    dbInsert: function (p) { return dbq(p, "POST", p.values || {}, "insert"); },
    dbUpdate: function (p) { return dbq(p, "PATCH", p.values || {}, "update"); },
    dbDelete: function (p) { return dbq(p, "DELETE", null, "delete"); },
    removeSection: function (p) { if (!p.sectionId) return "no section id"; window.__IE.removeSection(p.sectionId); return p.sectionId; },
    showToast: function (p) { toast(p.message || "Done", p.type); return p.message; },
    requireAuth: function () { if (!token()) { toast("Please sign in first", "warning"); throw new Error("Not signed in"); } return "signed in"; },
    getUser: function (p) { var t = token(); if (!t) throw new Error("Not signed in"); try { var u = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); put(p.stateKey || "user", { id: u.sub, email: u.email }); return u.email || u.sub; } catch (e) { throw new Error("Could not read user"); } },
    redirect: function (p) { if (!/^https?:\/\//.test(p.url || "")) throw new Error("Invalid URL"); window.open(p.url, p.newTab === false ? "_top" : "_blank", "noopener"); return p.url; },
    runScript: function (p, node) { window.__IEMeta(p.code || "", node); return "done"; },
    onTimer: function (p, node) {
      window.__IETimers = window.__IETimers || {};
      clearInterval(window.__IETimers[node.id]);
      var ms = Math.max(5000, Number(p.everyMs) || 60000);
      window.__IETimers[node.id] = setInterval(function () { L("Timer " + node.id + " tick"); }, ms);
      return "every " + ms + "ms";
    },

    /* ---- live data + search ---- */
    liveQuery: function (p, node) {
      window.__IETimers = window.__IETimers || {}; clearInterval(window.__IETimers[node.id]);
      var tick = function () {
        var rc = useRemote(p);
        if (rc) { var qs = "select=*&limit=" + (Number(p.limit) || 50) + (rfilter(p, p.op) ? "&" + rfilter(p, p.op) : "") + (p.orderBy ? "&order=" + encodeURIComponent(p.orderBy) + "." + (p.desc === false ? "asc" : "desc") : "");
          rq(rc, p.table, "GET", qs).then(function (j) { var prev = JSON.stringify(window.__IEState[p.stateKey || "live"]); if (prev !== JSON.stringify(j)) { (window.__IEBus ? window.__IEBus.set : put)(p.stateKey || "live", j); L("liveQuery " + p.table + " (Supabase): " + j.length + " rows (updated)"); } })
            .catch(function (e) { L("liveQuery " + p.table + " (Supabase) failed: " + e.message, "error"); }); return; }
        var D = window.__IEData, t = D && p.table && D.table(p.table, p.app); if (!t) { L("liveQuery: choose a table name", "error"); return; }
        t.list().then(function (rows) {
          var j = rows.filter(dbMatch(p));
          if (p.orderBy) { var dd = p.desc === false ? 1 : -1; j.sort(function (a, b) { return a[p.orderBy] > b[p.orderBy] ? dd : a[p.orderBy] < b[p.orderBy] ? -dd : 0; }); }
          j = j.slice(0, Number(p.limit) || 50);
          var prev = JSON.stringify(window.__IEState[p.stateKey || "live"]); if (prev !== JSON.stringify(j)) { (window.__IEBus ? window.__IEBus.set : put)(p.stateKey || "live", j); L("liveQuery " + p.table + ": " + j.length + " rows (updated)"); }
        }).catch(function () { L("liveQuery " + p.table + " failed", "error"); });
      };
      tick(); window.__IETimers[node.id] = setInterval(tick, Math.max(3000, Number(p.refreshMs) || 10000));
      return "watching " + p.table;
    },
    smartSearch: function (p) {
      var src = window.__IEState[p.sourceKey || "rows"]; if (!Array.isArray(src)) throw new Error("State " + (p.sourceKey || "rows") + " is not a list");
      var q = String(p.query != null ? p.query : (window.__IEState[p.queryKey || "query"] || "")).toLowerCase().trim(), keys = p.keys && p.keys.length ? p.keys : null;
      var lev = function (a, b) { if (a === b) return 0; var m = [], i, j; for (i = 0; i <= b.length; i++) m[i] = [i]; for (j = 0; j <= a.length; j++) m[0][j] = j; for (i = 1; i <= b.length; i++) for (j = 1; j <= a.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (b[i - 1] === a[j - 1] ? 0 : 1)); return m[b.length][a.length]; };
      var words = q.split(/\s+/).filter(Boolean);
      var scored = src.map(function (row) {
        var text = (keys ? keys.map(function (k) { return row[k]; }) : Object.values(row || {})).filter(function (v) { return v != null; }).join(" ").toLowerCase(), toks = text.split(/[^a-z0-9]+/).filter(Boolean), sc = 0;
        words.forEach(function (w) { if (text.indexOf(w) > -1) { sc += 3; return; } var best = 9; toks.forEach(function (t) { var d = lev(w, t.slice(0, w.length + 1)); if (d < best) best = d; }); if (best <= Math.max(1, Math.floor(w.length / 4))) sc += 2 - best * .5; });
        return { row: row, sc: sc };
      }).filter(function (x) { return !words.length || x.sc > 0; }).sort(function (a, b) { return b.sc - a.sc; }).slice(0, Number(p.limit) || 20).map(function (x) { return x.row; });
      (window.__IEBus ? window.__IEBus.set : put)(p.stateKey || "results", scored); return scored.length + " matches";
    },
    aiSearch: function (p) {
      var src = window.__IEState[p.sourceKey || "rows"]; if (!Array.isArray(src)) throw new Error("State " + (p.sourceKey || "rows") + " is not a list");
      if (!token()) { toast("Sign in required for AI search", "warning"); throw new Error("Sign in required for AI search"); }
      var list = src.slice(0, 200).map(function (r, i) { return i + ": " + JSON.stringify(r).slice(0, 300); }).join("\n");
      fetch(FN, { method: "POST", headers: hdr(), body: JSON.stringify({ action: "chat", tab: "flow", messages: [{ role: "user", content: "Rank these items by how well they match the request \"" + (p.query || "") + "\". Reply with ONLY a JSON array of item numbers, best first, at most " + (Number(p.limit) || 10) + ".\n" + list }], context: { plain: true } }) })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (j.error) { L("aiSearch: " + j.error, "error"); return; } var m = String(j.text || "").match(/\[[\d,\s]*\]/); var ids = m ? JSON.parse(m[0]) : [];
          var out = ids.map(function (i) { return src[i]; }).filter(Boolean); (window.__IEBus ? window.__IEBus.set : put)(p.stateKey || "results", out); L("aiSearch: " + out.length + " matches"); })
        .catch(function () { L("aiSearch network error", "error"); });
      return "searching";
    },
    aggregate: function (p) {
      var src = window.__IEState[p.sourceKey || "rows"]; if (!Array.isArray(src)) throw new Error("State " + (p.sourceKey || "rows") + " is not a list");
      var g = {}, f = p.field, fn = p.fn || "count";
      src.forEach(function (r) { var k = p.groupBy ? String(r[p.groupBy]) : "all"; (g[k] = g[k] || []).push(r); });
      var out = Object.keys(g).map(function (k) { var rows = g[k], nums = rows.map(function (r) { return Number(r[f]) || 0; }), sum = nums.reduce(function (a, b) { return a + b; }, 0);
        var v = fn === "sum" ? sum : fn === "avg" ? (nums.length ? sum / nums.length : 0) : fn === "min" ? Math.min.apply(null, nums) : fn === "max" ? Math.max.apply(null, nums) : rows.length; return { group: k, value: Math.round(v * 100) / 100 }; })
        .sort(function (a, b) { return p.sort === "asc" ? a.value - b.value : b.value - a.value; }).slice(0, Number(p.limit) || 100);
      (window.__IEBus ? window.__IEBus.set : put)(p.stateKey || "summary", p.groupBy ? out : (out[0] ? out[0].value : 0)); return out.length + " groups";
    },
    /* ---- 3D scene blueprint steps (sent to every 3D block on the page) ---- */
    set3D: function (p) { return send3D({ __IE3D: "set", cfg: p.settings || p }) + " 3D blocks updated"; },
    spawn3D: function (p) { return send3D(Object.assign({ __IE3D: "cmd", op: "spawn" }, p)) + " spawned " + (p.id || p.shape || "box"); },
    move3D: function (p) { return send3D(Object.assign({ __IE3D: "cmd", op: "move" }, p)) + " moved " + p.id; },
    color3D: function (p) { return send3D(Object.assign({ __IE3D: "cmd", op: "color" }, p)) + " recolored " + p.id; },
    scale3D: function (p) { return send3D(Object.assign({ __IE3D: "cmd", op: "scale" }, p)) + " scaled " + p.id; },
    rotate3D: function (p) { return send3D(Object.assign({ __IE3D: "cmd", op: "rotate" }, p)) + " rotated " + p.id; },
    spin3D: function (p) { return send3D(Object.assign({ __IE3D: "cmd", op: "spin" }, p)) + " spinning " + p.id; },
    visible3D: function (p) { return send3D(Object.assign({ __IE3D: "cmd", op: "visible" }, p)) + " visibility " + p.id; },
    camera3D: function (p) { return send3D(Object.assign({ __IE3D: "cmd", op: "camera" }, p)) + " camera moved"; },
    light3D: function (p) { return send3D(Object.assign({ __IE3D: "cmd", op: "light" }, p)) + " lights updated"; },
    theater3D: function (p) { return send3D(Object.assign({ __IE3D: "cmd", op: "theater" }, p)) + " theater " + (p.kind || "screen"); },
    remove3D: function (p) { return send3D(Object.assign({ __IE3D: "cmd", op: "remove" }, p)) + " removed " + p.id; },
    on3DEvent: function (p) {
      if (!window.__IEBus || !p.event) throw new Error("Choose an event, e.g. game:over");
      window.__IE3DSubs = window.__IE3DSubs || {}; if (window.__IE3DSubs[p.event]) window.__IE3DSubs[p.event]();
      window.__IE3DSubs[p.event] = window.__IEBus.subscribe(p.event, function (v) { if (p.message) toast(String(p.message).replace("{value}", typeof v === "object" ? JSON.stringify(v) : v)); if (p.stateKey && p.stateKey !== p.event) put(p.stateKey, v); L("3D event " + p.event); });
      return "listening " + p.event;
    },
    aiGenerate: function (p) {
      var t = token(); if (!t) throw new Error("Not signed in");
      fetch(FN, { method: "POST", headers: hdr(), body: JSON.stringify({ action: "chat", tab: "flow", messages: [{ role: "user", content: String(p.prompt || "") }], context: { plain: true } }) })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (j.error) { L("aiGenerate: " + j.error, "error"); return; } put(p.stateKey || "ai", j.text); L("aiGenerate saved to state." + (p.stateKey || "ai")); })
        .catch(function () { L("aiGenerate network error", "error"); });
      return "asked AI";
    },
  };

  /* Admin tab visible only to Startup Factory Hub admins */
  var adminCss = document.createElement("style");
  adminCss.textContent = '[data-mode="admin"]{display:none!important}';
  document.head.appendChild(adminCss);
  (function () {
    var t = token(); if (!t) return;
    fetch(FN, { method: "POST", headers: hdr(), body: JSON.stringify({ action: "whoami" }) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.isAdmin) adminCss.textContent = ""; })
      .catch(function () {});
  })();

  var css = document.createElement("style");
  css.textContent =
    ".iea{display:flex;flex-direction:column;height:100%;min-height:0;background:#0a0a0c;color:#e4e4e7;font:12px/1.5 system-ui,sans-serif}" +
    ".iea-h{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #27272a}" +
    ".iea-h img{width:26px;height:26px;border-radius:50%;box-shadow:0 0 12px #d946ef66}" +
    ".iea-t{font-weight:600;background:linear-gradient(90deg,#5eead4,#e879f9);-webkit-background-clip:text;color:transparent}" +
    ".iea-s{font-size:10px;color:#71717a}.iea-x{margin-left:auto;background:none;border:0;color:#71717a;cursor:pointer;font-size:11px}" +
    ".iea-l{flex:1 1 0;min-height:0;overflow-y:scroll;overflow-x:hidden;padding:12px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:#52525b #18181b}.iea-l::-webkit-scrollbar{width:8px}.iea-l::-webkit-scrollbar-track{background:#18181b}.iea-l::-webkit-scrollbar-thumb{background:#52525b;border-radius:8px}.iea-l::-webkit-scrollbar-thumb:hover{background:#71717a}" +
    "#ie-ai-slot{max-height:calc(100dvh - 60px);position:sticky;top:56px;overflow:hidden}#ie-ai-slot>.iea{height:100%;max-height:calc(100dvh - 60px)}.iea-h,.iea-f,.iea-att{flex-shrink:0}" +
    ".iea-ph{margin-top:8px;border:1px solid #3f3f46;border-radius:10px;padding:8px 10px;background:#111114}.iea-ph ol{margin:4px 0 6px;padding-left:18px}.iea-ph li.ok{color:#71717a;text-decoration:line-through}" +
    ".iea-u{align-self:flex-end;max-width:88%;background:linear-gradient(135deg,#14b8a6,#a21caf);color:#fff;padding:8px 11px;border-radius:14px 14px 4px 14px}" +
    ".iea-a{max-width:100%;color:#d4d4d8;line-height:1.6}.iea-a p{margin:0 0 8px}.iea-a p:last-child{margin-bottom:0}.iea-a ul,.iea-a ol{margin:4px 0 8px;padding-left:18px}.iea-a li{margin:2px 0}.iea-a li::marker{color:#5eead4}.iea-hd{margin:12px 0 6px;font-weight:600;color:#fafafa;letter-spacing:.01em}h2.iea-hd{font-size:14px}h3.iea-hd{font-size:13px}h4.iea-hd{font-size:12px;color:#a1a1aa;text-transform:uppercase;font-size:10.5px;letter-spacing:.06em}.iea-a h2.iea-hd:first-child,.iea-a h3.iea-hd:first-child{margin-top:0}.iea-a b{color:#fafafa;font-weight:600}.iea-a a{color:#5eead4}.iea-q{border-left:2px solid #5eead4;padding:4px 10px;margin:6px 0;color:#a1a1aa;background:#5eead40d;border-radius:0 6px 6px 0}.iea-hr{border:0;border-top:1px solid #27272a;margin:10px 0}.iea-tb{border-collapse:collapse;margin:6px 0 10px;width:100%;font-size:11px}.iea-tb th,.iea-tb td{border:1px solid #27272a;padding:4px 6px;text-align:left}.iea-tb th{background:#18181b;color:#fafafa}.iea-d{margin-top:6px;font-size:10px;color:#5eead4}" +
    ".iea-pre{background:#18181b;border:1px solid #27272a;border-radius:8px;padding:8px;overflow:auto;font:11px/1.4 ui-monospace,monospace;white-space:pre}" +
    ".iea-code{background:#18181b;padding:1px 4px;border-radius:4px;font-family:ui-monospace,monospace}" +
    ".iea-e{color:#fca5a5;font-size:11px}.iea-sug{display:flex;flex-wrap:wrap;gap:6px}" +
    ".iea-sug button{background:#18181b;border:1px solid #3f3f46;color:#d4d4d8;border-radius:999px;padding:4px 10px;font-size:11px;cursor:pointer}" +
    ".iea-f{padding:10px;border-top:1px solid #27272a;display:flex;gap:6px;align-items:flex-end}" +
    ".iea-f textarea{flex:1;resize:none;background:#18181b;border:1px solid #3f3f46;border-radius:12px;color:#fafafa;padding:8px 10px;font:12px system-ui;max-height:120px;outline:none}" +
    ".iea-f textarea:focus{border-color:#14b8a6}.iea-f button{width:34px;height:34px;border-radius:10px;border:0;cursor:pointer;background:linear-gradient(135deg,#14b8a6,#c026d3);color:#fff;font-weight:700}" +
    ".iea-f button:disabled{opacity:.4}.iea-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#5eead4;margin-right:3px;animation:ieab 1s infinite}" +
    "@keyframes ieab{0%,100%{opacity:.2}50%{opacity:1}}" +
    ".iea-fab{position:fixed;right:18px;bottom:18px;z-index:9999;width:56px;height:56px;border-radius:50%;border:0;padding:0;cursor:pointer;background:none;box-shadow:0 0 24px #d946ef88}" +
    ".iea-fab img{width:100%;height:100%;border-radius:50%}" +
    ".iea-dr{position:fixed;right:18px;bottom:84px;z-index:9999;width:380px;height:560px;max-height:calc(100vh - 110px);border:1px solid #3f3f46;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px #000c}";
  document.head.appendChild(css);

  var root = document.createElement("div");
  root.className = "iea";
  root.innerHTML =
    '<div class="iea-h"><img src="' + LOGO + '" alt=""><div><div class="iea-t">Genius AI</div><div class="iea-s" id="iea-tab"></div></div><button class="iea-x" id="iea-clr">New chat</button></div>' +
    '<div class="iea-l" id="iea-l"></div>' +
    '<div class="iea-att" id="iea-att"></div>' +
    '<div class="iea-f"><div class="iea-pl"><button id="iea-plus" title="Add files">+</button><div class="iea-menu" id="iea-menu"><div class="iea-mh">Upload</div><button data-up="file">Upload file</button><button data-up="media">Upload image or video</button><div class="iea-mh">Models</div><button data-m="chat">Chat <small>ideas, analysis, plans</small></button><button data-m="build">Build <small>makes the changes</small></button><div class="iea-ms">More models coming soon</div></div></div><textarea id="iea-in" rows="2" placeholder="Describe what to build..."></textarea><button id="iea-go">&#8593;</button></div><div class="iea-cr" data-ie-credits-pill style="display:flex;justify-content:space-between;align-items:center;padding:2px 10px 6px;font:10px system-ui;color:#a1a1aa;cursor:pointer"><span data-ie-credits-text>Credits</span><span style="color:#a78bfa">Get more</span></div>' +
    '<input type="file" id="iea-ff" multiple hidden><input type="file" id="iea-fm" accept="image/*,video/*" multiple hidden>';
  css.textContent +=
    ".iea-pl{position:relative}.iea-pl>button{width:34px;height:34px;border-radius:10px;border:1px solid #3f3f46;background:#18181b;color:#e4e4e7;font-size:18px;cursor:pointer}" +
    ".iea-menu{display:none;position:absolute;bottom:40px;left:0;width:210px;background:#0a0a0c;border:1px solid #3f3f46;border-radius:10px;padding:4px;z-index:5;box-shadow:0 10px 30px #000a}.iea-menu.on{display:block}" +
    ".iea-menu button{display:flex;justify-content:space-between;width:100%;background:none;border:0;color:#e4e4e7;text-align:left;padding:7px 8px;border-radius:6px;cursor:pointer;font-size:12px;height:auto}.iea-menu button:hover,.iea-menu button.sel{background:#27272a}" +
    ".iea-menu small{color:#71717a;font-size:10px}.iea-mh{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#71717a;padding:6px 8px 2px}.iea-ms{font-size:10px;color:#52525b;padding:4px 8px}" +
    ".iea-att{display:flex;flex-wrap:wrap;gap:4px;padding:0 10px}.iea-att span{background:#18181b;border:1px solid #3f3f46;border-radius:8px;padding:2px 8px;font-size:10px;cursor:pointer}";
  var model = localStorage.getItem("iea-model") || "build", atts = [];
  var list = root.querySelector("#iea-l"), input = root.querySelector("#iea-in"), go = root.querySelector("#iea-go");

  var SUG = {
    canvas: ["Build a SaaS landing page", "Add pricing and testimonials", "Make a marketplace homepage"],
    flow: ["Build a lead capture flow and run it", "Create a metascript that adds a pricing section", "Load the signed-in user and greet them"],
    dev: ["Write a React pricing component", "Explain this project's structure", "Add a shadcn form with Zod"],
    database: ["Design tables for a marketplace", "Add a Subscriptions table", "Schema for a CRM"],
    deploy: ["Pre-launch checklist", "How do I deploy this?", "Review my project for issues"],
    admin: ["How should I price AI for my users?", "Compare flat fee vs per token", "Suggest paid plan tiers"],
  };
  /* Live progress: shows what Genius is doing while a build runs, and the files it wrote afterwards */
  var stageAt = 0, stageKind = "edit";
  var STAGES = { app: ["Understanding your request", "Planning the data and screens", "Writing the app files", "Linking the pieces together", "Starting your app"], edit: ["Reading your project", "Finding the exact place to change", "Writing the change", "Applying it"], chat: ["Thinking"], site: ["Planning the page", "Writing the sections", "Placing them on the canvas"] };
  function stageText() { var l = STAGES[stageKind] || STAGES.edit, i = Math.min(l.length - 1, Math.floor((Date.now() - stageAt) / 6000)); return l[i] + "..."; }
  setInterval(function () { var el = document.getElementById("iea-stage"); if (el && busy) el.textContent = stageText(); }, 1000);
  function fileChips(done) {
    var files = (done || []).map(function (d) { var m = /^(?:Live app|File|Updated|Edited)\s+(\S+)/.exec(d); return m && /[\/.]/.test(m[1]) ? m[1] : null; }).filter(Boolean);
    if (!files.length) return "";
    return '<div class="iea-sug" style="margin-top:6px">' + files.slice(0, 12).map(function (f) { return '<button data-file="' + esc(f) + '" title="Open in Dev">' + esc(f) + "</button>"; }).join("") + "</div>";
  }
  function render() {
    var tab = currentTab();
    root.querySelector("#iea-tab").textContent = "Helping on " + tab.charAt(0).toUpperCase() + tab.slice(1);
    var h = "";
    if (!messages.length) {
      h += '<div class="iea-a">Hi! I can build pages on the canvas, create flows, write code, design databases and help you deploy. What are we building?</div><div class="iea-sug">' +
        (SUG[tab] || SUG.canvas).map(function (s) { return "<button>" + esc(s) + "</button>"; }).join("") + "</div>";
    }
    messages.forEach(function (m, i) {
      if (m.role === "user") h += '<div class="iea-u">' + esc(m.content) + "</div>";
      else if (m.error) h += '<div class="iea-e">' + esc(m.content) + "</div>";
      else h += '<div class="iea-a">' + md(m.display || m.content) + (m.done && m.done.length ? '<div class="iea-d">&#10003; ' + esc(m.done.join(" · ")) + "</div>" : "") + fileChips(m.done) + (m.phases && i === messages.length - 1 && !busy ? phaseBox(m) : "") + (m.chat && i === messages.length - 1 && !busy ? '<div class="iea-sug" style="margin-top:6px"><button data-impl>Build this plan</button></div>' : "") + "</div>";
    });
    if (busy) h += '<div class="iea-a"><span class="iea-dot"></span><span class="iea-dot" style="animation-delay:.2s"></span><span class="iea-dot" style="animation-delay:.4s"></span> <span id="iea-stage" style="color:#a1a1aa;font-size:11px">' + esc(stageText()) + '</span></div>';
    list.innerHTML = h;
    list.querySelectorAll("[data-file]").forEach(function (b) { b.onclick = function () { try { window.__IE && window.__IE.setMode("dev"); } catch (e) {} }; });
    list.querySelectorAll(".iea-sug button:not([data-file])").forEach(function (b) { b.onclick = b.hasAttribute("data-impl") ? function () { model = "build"; localStorage.setItem("iea-model", model); markModel(); send("Implement the plan you just described. Make surgical changes to the existing project only."); } : function () { send(b.textContent); }; });
    list.querySelectorAll("[data-ph]").forEach(function (b) { b.onclick = function () { var last = messages[messages.length - 1]; if (last && last.phases) nextPhase(last, b.getAttribute("data-ph") === "all"); }; });
    list.scrollTop = list.scrollHeight;
    go.disabled = busy;
  }
  /* Phase plans: Genius builds what fits in one job and splits the rest into at most 4 phases */
  var autoPhases = false;
  function parsePhases(text) {
    var m = /```phases\s*([\s\S]*?)```/.exec(text || ""); if (!m) return null;
    try { var p = JSON.parse(m[1]); var list = (p.phases || p).slice(0, 4).map(String); if (!list.length) return null; return { list: list, current: Math.max(1, Math.min(list.length, +p.current || 1)) }; } catch (e) { return null; }
  }
  function phaseBox(m) {
    var p = m.phases, left = p.list.length - p.current;
    return '<div class="iea-ph"><b>Plan in ' + p.list.length + ' phases</b><ol>' + p.list.map(function (x, k) { return '<li class="' + (k < p.current ? "ok" : "") + '">' + esc(x) + "</li>"; }).join("") + "</ol>" +
      (left > 0 ? '<div class="iea-sug"><button data-ph="all">Auto-build all remaining phases</button><button data-ph="next">Approve phase ' + (p.current + 1) + "</button></div>" : "") + "</div>";
  }
  function nextPhase(m, all) {
    var p = m.phases, n = p.current + 1; autoPhases = !!all;
    model = "build"; try { localStorage.setItem("iea-model", model); } catch (e) {} markModel();
    send("Build phase " + n + " of " + p.list.length + ": " + p.list[n - 1] + ". Keep everything already built and edit it surgically. End with the phases block marking current " + n + ".");
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(messages.slice(-60))); } catch (e) {} }

  function send(text) {
    text = (text || "").trim();
    var ready = atts.filter(function (a) { return a.url; });
    if (ready.length) { text += "\n\nReference files:\n" + ready.map(function (a) { return "- " + a.name + " (" + (a.type || "file") + "): " + a.url; }).join("\n"); atts = atts.filter(function (a) { return !a.url; }); drawAtts(); }
    if (!text || busy) return;
    var t = token();
    messages.push({ role: "user", content: text });
    input.value = "";
    if (!t) { messages.push({ role: "assistant", error: true, content: "Please sign in to Startup Factory Hub to use Genius AI." }); render(); save(); return; }
    var mode = model === "chat" ? "chat" : "build";
    stageAt = Date.now(); stageKind = mode === "chat" ? "chat" : buildKind(text);
    busy = true; render();
    migrateLegacy().then(function () { setTimeout(function () { doSend(t, text, mode); if (window.__IEPin) { window.__IEPin = null; drawAtts(); } }, 200); });
  }
  /* 3D Studio route: 3D world/level/scene requests (or any Build while a studio scene is on the page) go to Genius 3D inside the studio frame */
  var STUDIO3D = /\b(3d|three[- ]?d)\b|\bin the (3d )?studio\b|\b(new|another|next|game|playable|sci[- ]?fi|cyberpunk|racing|open[- ]world)\s+(level|world|map|arena)\b|\b(level|world|arena)\b.*\b(character|player|npc|car|vehicle|sketchfab|drivable|walk)|\b(game|simulator|shooter|racer|platformer|rpg)\b.*\b(character|player|level|world|drivable|car|sketchfab)\b|\bsketchfab\b|\bdrivable\b|\bplaza\b/i;
  function studioFrames() { var out = []; (function walk(doc) { try { doc.querySelectorAll("iframe").forEach(function (f) { if (/\/imagine-studio/.test(f.getAttribute("src") || "")) out.push(f); else { try { walk(f.contentDocument); } catch (e) {} } }); } catch (e) {} })(document); return out; }
  function send3DStudio(text) {
    var fr = studioFrames();
    if (!fr.length && window.__IEStudio) {
      /* open the 3D Studio workspace and build there in a fresh level */
      window.__IEStudio.open();
      var sf = window.__IEStudio.frame();
      if (sf) { sf.src = "/imagine-studio?embedded=1&genius=" + encodeURIComponent(text); messages.push({ role: "assistant", content: "Opened the 3D Studio and started building your level there. Everything stays editable by hand, and the scene file appears in the Dev tab as scenes/level.json." }); return true; }
    }
    if (!fr.length) {
      var ie = window.__IE; if (!ie || !ie.addSection) return false;
      var s = Date.now().toString(36);
      ie.addSection({ id: "sec_studio_" + s, type: "section", style: { backgroundColor: "transparent", padding: "0px", overflow: "hidden", borderRadius: "20px", minHeight: "640px" },
        children: [{ id: "emb_studio_" + s, type: "embed", content: "/imagine-studio?embed=1&genius=" + encodeURIComponent(text), style: { minHeight: "640px" } }] });
      messages.push({ role: "assistant", content: "Building your 3D level in the 3D Studio. It is fully editable by hand, and its scene file appears in the Dev tab as scenes/level.json." });
      return true;
    }
    fr.forEach(function (f) { try { f.contentWindow.postMessage({ __IEStudio: "genius", prompt: text }, "*"); } catch (e) {} });
    messages.push({ role: "assistant", content: "Sent to Genius 3D in the 3D Studio. Changes apply to the open level." });
    return true;
  }
  window.addEventListener("message", function (ev) {
    var d = ev.data; if (!d || !d.__IEStudio) return;
    if (d.__IEStudio === "scene" && d.json) { try { window.__IEFiles && window.__IEFiles.put("scenes/level.json", d.json, "json"); } catch (e) {} }
    if (d.__IEStudio === "reply" && d.text) { messages.push({ role: "assistant", content: String(d.text) }); render(); save(); }
    if (d.__IEStudio === "scene" && d.json) lastStudioJson = d.json;
  });
  /* Dev tab -> 3D Studio: hand edits to scenes/level.json reload the open level */
  var lastStudioJson = null;
  setInterval(function () {
    var cur = window.__IEFiles && window.__IEFiles.get("scenes/level.json");
    if (!cur || lastStudioJson === null || cur === lastStudioJson) return;
    try { JSON.parse(cur); } catch (e) { return; }
    lastStudioJson = cur;
    studioFrames().forEach(function (f) { try { f.contentWindow.postMessage({ __IEStudio: "load", json: cur }, "*"); } catch (e) {} });
  }, 1500);
  function doSend(t, text, mode) {
    if (mode !== "chat" && !doSend._retried && (STUDIO3D.test(text) || studioFrames().length && /\b(scene|level|model|object|this|it)\b/i.test(text) && !/\b(page|website|app|dashboard|store)\b/i.test(text))) {
      if (send3DStudio(text)) { busy = false; render(); save(); return; }
    }
    var history = messages.filter(function (m) { return !m.error; }).map(function (m) { return { role: m.role, content: m.content }; });
    fetch(FN, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON, Authorization: "Bearer " + t },
      body: JSON.stringify({ action: "chat", tab: currentTab(), messages: history, context: Object.assign(ctx(), { intent: REBUILD.test(text) ? "rebuild" : "edit", build: buildKind(text) }), model: mode === "chat" ? "chat" : model, mode: mode }),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.j.credits && res.j.credits.balance != null) window.__IECredits.set(res.j.credits.balance);
        if (!res.ok || res.j.error) { messages.push({ role: "assistant", error: true, content: res.j.error || "Something went wrong." }); if (res.j.code === "no_credits") window.__IECredits.openPlans(); return; }
        if (mode === "chat") { messages.push({ role: "assistant", content: res.j.text || "", display: extractActions(res.j.text || "").clean || res.j.text, done: [], chat: true }); return; }
        needFix = false;
        var kindNow = buildKind(text), exNow = extractActions(res.j.text || "").list;
        var builtApp = exNow.some(function (a) { return /^(addLiveApp|applyTemplate|updateFile|patchFile)$/.test(a.type); });
        if (kindNow === "app" && !builtApp && !doSend._retried) {
          doSend._retried = true;
          messages.push({ role: "assistant", content: res.j.text || "" });
          messages.push({ role: "user", content: "That did not build a working app. Build it now as a real React live app: write each file as a code fence like ```tsx file=apps/<Name>.tsx (root, export default function App) plus module fences under apps/<name>/..., using real libraries (lucide-react, framer-motion, recharts, zustand, date-fns, three/@react-three/fiber when 3D) and IE.db for saved data. No widgets, no Flow nodes." });
          setTimeout(function () { doSend(t, text, mode); }, 50); return "retry";
        }
        var out = runActions(res.j.text || "");
        var ph = parsePhases(res.j.text || "");
        messages.push({ role: "assistant", content: res.j.text || "", display: String(out.text || "").replace(/```phases[\s\S]*?```/g, "").trim(), done: out.done, phases: ph });
        if (res.j.credits && res.j.credits.refunded) messages.push({ role: "assistant", error: true, content: "Genius hit an error, so your credits for that request were returned." });
        if (ph && autoPhases && ph.current < ph.list.length) { var lastM = messages[messages.length - 1]; setTimeout(function () { nextPhase(lastM, true); }, 600); }
        else if (!ph || ph.current >= ph.list.length) autoPhases = false;
        if (needFix && !doSend._retried) {
          needFix = false; doSend._retried = true;
          messages.push({ role: "user", content: "Those Flow nodes cannot change the running app. Make the change by editing the existing apps/* file with patchFile (exact find/replace snippets copied from the current file). Do not add Flow nodes." });
          setTimeout(function () { doSend(t, text, mode); }, 50); return "retry";
        }
        doSend._retried = false;
      })
      .catch(function () { messages.push({ role: "assistant", error: true, content: "Network error. Please try again." }); })
      .then(function (v) { if (v === "retry") { render(); return; } busy = false; render(); save(); input.focus(); });
  }
  go.onclick = function () { send(input.value); };
  var menu = root.querySelector("#iea-menu");
  function markModel() { menu.querySelectorAll("[data-m]").forEach(function (b) { b.classList.toggle("sel", b.getAttribute("data-m") === model); }); }
  markModel();
  root.querySelector("#iea-plus").onclick = function () { menu.classList.toggle("on"); };
  menu.querySelectorAll("[data-m]").forEach(function (b) { b.onclick = function () { model = b.getAttribute("data-m"); localStorage.setItem("iea-model", model); markModel(); menu.classList.remove("on"); }; });
  menu.querySelectorAll("[data-up]").forEach(function (b) { b.onclick = function () { menu.classList.remove("on"); root.querySelector(b.getAttribute("data-up") === "file" ? "#iea-ff" : "#iea-fm").click(); }; });
  window.__IEPinSet = function (d) {
    if (!d) { window.__IEPin = null; drawAtts(); return; }
    var parts = String(d.loc || "").split(":"); window.__IEPin = { file: parts.slice(0, -2).join(":"), line: parts.slice(-2)[0], tag: d.tag, text: d.text };
    if (model === "chat") { model = "build"; try { localStorage.setItem("iea-model", model); } catch (e) {} }
    drawAtts(); try { input.focus(); } catch (e) {}
  };
  function drawAtts() { var a = root.querySelector("#iea-att"), pin = window.__IEPin; a.innerHTML = (pin ? '<span data-pin title="Genius AI will edit this exact element. Click to remove.">Selected &lt;' + esc(pin.tag || "el") + "&gt; " + esc(pin.file) + ":" + esc(String(pin.line)) + " &times;</span>" : "") + atts.map(function (x, i) { return '<span data-i="' + i + '" title="Remove">' + esc(x.name) + (x.url ? "" : " (uploading)") + " &times;</span>"; }).join(""); a.querySelectorAll("span").forEach(function (sp) { if (sp.hasAttribute("data-pin")) { sp.onclick = function () { window.__IEPinSet(null); }; return; } sp.onclick = function () { atts.splice(+sp.getAttribute("data-i"), 1); drawAtts(); }; }); }
  function uid(t) { try { return JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub; } catch (e) { return ""; } }
  function upload(files) {
    var t = token(); if (!t) { messages.push({ role: "assistant", error: true, content: "Please sign in to upload files." }); render(); return; }
    Array.prototype.forEach.call(files, function (f) {
      var item = { name: f.name, type: f.type, url: "" }; atts.push(item); drawAtts();
      var path = uid(t) + "/imagine-ai/" + Date.now() + "-" + f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      fetch(SB + "/storage/v1/object/imagine-media/" + path, { method: "POST", headers: { apikey: ANON, Authorization: "Bearer " + t, "Content-Type": f.type || "application/octet-stream", "x-upsert": "true" }, body: f })
        .then(function (r) { if (!r.ok) return r.json().then(function (j) { throw new Error(j.message || j.error || "Upload failed"); }); item.url = SB + "/storage/v1/object/public/imagine-media/" + path; drawAtts(); })
        .catch(function (e) { atts.splice(atts.indexOf(item), 1); drawAtts(); messages.push({ role: "assistant", error: true, content: f.name + ": " + e.message }); render(); });
    });
  }
  ["#iea-ff", "#iea-fm"].forEach(function (sel) { var el = root.querySelector(sel); el.onchange = function () { upload(el.files); el.value = ""; }; });

  // Prompts from the Startup Factory Hub assistant bubble (parent window, same origin only)
  window.addEventListener("message", function (ev) {
    if (ev.origin !== location.origin || !ev.data || ev.data.iea !== "send") return;
    var id = ev.data.id, before = messages.length;
    send(String(ev.data.text || ""));
    var poll = setInterval(function () {
      if (busy) return;
      clearInterval(poll);
      var last = messages.slice(before).filter(function (m) { return m.role === "assistant"; }).pop();
      var text = last ? (last.display || last.content) + (last.done && last.done.length ? "\n\nDone: " + last.done.join(", ") : "") : "Done.";
      ev.source && ev.source.postMessage({ iea: "reply", id: id, text: text }, location.origin);
    }, 300);
  });

  // Self-healing: live apps report crashes; "Auto-repair with AI" sends the broken file + stack for a surgical patch
  var healAt = {};
  window.__IEAutoHeal = function (d) {
    d = d || {}; var f = String(d.file || ""); if (!f || busy) return false;
    if (healAt[f] && Date.now() - healAt[f] < 20000) return false; healAt[f] = Date.now();
    var srcTxt = ""; try { srcTxt = (window.__IEFiles && window.__IEFiles.get(f)) || ""; } catch (e) {}
    if (model === "chat") { model = "build"; try { localStorage.setItem("iea-model", model); } catch (e) {} }
    send("Auto-repair: the live app " + f + " crashed with this error. Fix it with patchFile on the exact broken code; keep every working feature and do not rebuild.\n\nError: " + String(d.message || "").slice(0, 800) + (d.stack ? "\nStack: " + String(d.stack).slice(0, 1200) : "") + (srcTxt ? "\n\nCurrent " + f + " (first 6000 chars):\n" + srcTxt.slice(0, 6000) : ""));
    return true;
  };
  // Automatic repair: at most 2 tries per file every 5 minutes, waits while Genius is busy
  var healTries = {};
  function autoHeal(d, wait) {
    var f = String(d.file || ""); if (!f) return;
    var t = healTries[f] = (healTries[f] || []).filter(function (x) { return Date.now() - x < 300000; });
    if (t.length >= 2) return;
    if (busy) { if ((wait || 0) < 20) setTimeout(function () { autoHeal(d, (wait || 0) + 1); }, 3000); return; }
    if (window.__IEAutoHeal(d)) t.push(Date.now());
  }
  window.addEventListener("message", function (ev) {
    var d = ev.data; if (!d || typeof d !== "object") return;
    if (d.ie === "liveapp-error") { try { window.__IE && window.__IE.log("Live app " + d.file + " crashed: " + d.message + " (Genius AI is repairing it)", "error"); } catch (e) {} setTimeout(function () { autoHeal(d); }, 800); }
    if (d.ie === "liveapp-autoheal") window.__IEAutoHeal(d);
  });
  input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input.value); } });
  root.querySelector("#iea-clr").onclick = function () { messages = []; save(); render(); };

  // Floating launcher for Flow / Dev / Database / Deploy (and canvas when AI tab closed)
  var fab = document.createElement("button");
  fab.className = "iea-fab"; fab.title = "Genius AI"; fab.innerHTML = '<img src="' + LOGO + '" alt="Genius AI">';
  var drawer = document.createElement("div"); drawer.className = "iea-dr"; drawer.style.display = "none";
  var open = false;
  fab.onclick = function () { open = !open; place(); };

  var lastMode = "";
  function place() {
    var slot = document.getElementById("ie-ai-slot");
    if (slot) {
      if (root.parentNode !== slot) slot.appendChild(root);
      drawer.style.display = "none";
      fab.style.display = "none";
    } else if (true) {
      // AI chat lives only inside an AI tab slot; never float over other tabs.
      fab.style.display = "none"; drawer.style.display = "none";
      if (root.parentNode && root.parentNode !== drawer) root.parentNode.removeChild(root);
    } else if (window.top !== window) {
      // Embedded in Startup Factory Hub: the site's single assistant bubble handles chat.
      fab.style.display = "none"; drawer.style.display = "none";
    } else {
      if (root.parentNode !== drawer) drawer.appendChild(root);
      if (!fab.parentNode) { document.body.appendChild(fab); document.body.appendChild(drawer); }
      fab.style.display = "block";
      drawer.style.display = open ? "block" : "none";
    }
    if (currentTab() !== lastMode) { lastMode = currentTab(); render(); }
  }
  function start() {
    render();
    place();
    new MutationObserver(place).observe(document.getElementById("root") || document.body, { childList: true, subtree: true });
    setTimeout(function () { input.focus(); }, 300);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

/* ---------- AI credits: balance pill (header + chat) and plans modal ---------- */
(function () {
  var SB = "https://zqiihhmdsdgwdcwmryym.supabase.co", FN = SB + "/functions/v1/imagine-ai", CK = SB + "/functions/v1/create-genius-checkout", PT = SB + "/functions/v1/customer-portal";
  var ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaWloaG1kc2Rnd2Rjd21yeXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MTAyMDcsImV4cCI6MjA3Mzk4NjIwN30.ppEJAvP7mVrX-6uXA1_AlaJEDHPBcb297irRyBBT3YI";
  var PLANS = [
    { name: "Imagine Starter", price: 15, credits: 300, id: "price_1UMWRHK5N1RcUVuYuamlc3g7" },
    { name: "Imagine Pro", price: 35, credits: 700, id: "price_1UMWRcK5N1RcUVuYbfH395fy" },
    { name: "Imagine Studio", price: 79, credits: 1600, id: "price_1UMWhHK5N1RcUVuY1bB3pmLA" }
  ];
  function token() {
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^sb-.*-auth-token$/.test(k)) { try { return JSON.parse(localStorage.getItem(k)).access_token; } catch (e) {} } }
    return null;
  }
  function post(url, body) {
    var t = token(); if (!t) return Promise.reject(new Error("Please sign in first."));
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json", apikey: ANON, Authorization: "Bearer " + t }, body: JSON.stringify(body || {}) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || j.error) throw new Error(j.error || "Request failed"); return j; }); });
  }
  var state = { balance: null, admin: false, plan: "free" };
  function fmt(n) { return (Math.round(n * 10) / 10).toLocaleString(); }
  function paint() {
    var txt = !token() ? "Sign in for credits" : state.admin ? "Admin: unlimited" : state.balance == null ? "Credits" : fmt(state.balance) + " credits";
    var col = state.admin || state.balance == null ? "#e4e4e7" : state.balance <= 0 ? "#f87171" : state.balance <= 10 ? "#fbbf24" : "#e4e4e7";
    document.querySelectorAll("[data-ie-credits-text]").forEach(function (e) { e.textContent = txt; e.style.color = col; });
  }
  function refresh() {
    if (!token()) { paint(); return; }
    post(FN, { action: "credits" }).then(function (j) { state.balance = j.balance; state.admin = !!j.isAdmin; state.plan = j.plan; paint(); }).catch(function () {});
  }
  var modal = null;
  function openPlans() {
    if (modal) return;
    modal = document.createElement("div");
    modal.style.cssText = "position:fixed;inset:0;z-index:400;background:rgba(0,0,0,.7);display:grid;place-items:center;padding:12px;font:13px system-ui;color:#e4e4e7";
    var cards = PLANS.map(function (p) {
      return '<div style="border:1px solid #27272a;border-radius:14px;padding:14px;background:#0f0f12;display:flex;flex-direction:column;gap:6px"><b>' + p.name + '</b><div style="font-size:24px;font-weight:700">$' + p.price + '<span style="font-size:11px;color:#71717a">/mo</span></div><div style="color:#a1a1aa;font-size:11px">' + p.credits.toLocaleString() + ' credits every month, unused credits roll over, plus 5 free daily</div><button data-buy="' + p.id + '" style="margin-top:auto;height:34px;border-radius:9999px;border:0;background:#7c3aed;color:#fff;cursor:pointer;font:600 12px system-ui">Subscribe</button></div>';
    }).join("");
    modal.innerHTML = '<div style="width:min(720px,100%);max-height:90vh;overflow:auto;background:#09090b;border:1px solid #27272a;border-radius:18px;padding:18px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><b style="font-size:16px">Get more AI credits</b><button data-x style="background:none;border:0;color:#a1a1aa;font-size:18px;cursor:pointer">&times;</button></div>' +
      '<div style="color:#a1a1aa;font-size:12px;margin-bottom:12px">Balance: <b data-ie-credits-text></b>. 1 credit = 1 AI build. Quick chats and small tweaks cost 0.2. Editing by hand, undo and versions are free. Everyone gets 5 free credits every day.</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">' + cards + '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:8px;flex-wrap:wrap"><span data-msg style="color:#a1a1aa;font-size:11px"></span><button data-portal style="height:30px;border-radius:9999px;border:1px solid #27272a;background:#18181b;color:#e4e4e7;padding:0 12px;cursor:pointer;font:11px system-ui">Manage billing</button></div></div>';
    document.body.appendChild(modal); paint();
    var msg = modal.querySelector("[data-msg]");
    function close() { if (modal) { modal.remove(); modal = null; } }
    modal.onclick = function (e) { if (e.target === modal) close(); };
    modal.querySelector("[data-x]").onclick = close;
    modal.querySelectorAll("[data-buy]").forEach(function (b) {
      b.onclick = function () {
        msg.textContent = "Opening secure checkout...";
        var path = (window.top !== window ? "/imagine-engine" : location.pathname);
        post(CK, { priceId: b.getAttribute("data-buy"), returnPath: path }).then(function (j) { window.open(j.url, "_blank"); msg.textContent = "Finish checkout in the new tab. Your credits update automatically."; poll(); })
          .catch(function (e) { msg.textContent = e.message; });
      };
    });
    modal.querySelector("[data-portal]").onclick = function () {
      post(PT, {}).then(function (j) { window.open(j.url, "_blank"); }).catch(function () { msg.textContent = "No billing account yet. Subscribe to a plan first."; });
    };
  }
  // After checkout, sync the subscription (grants monthly credits) and refresh for a few minutes.
  function poll() {
    var n = 0, iv = setInterval(function () { n++; post(SB + "/functions/v1/check-genius-plan", {}).then(function (j) { if (j.balance != null) { state.balance = j.balance; paint(); } }).catch(function () {}); if (n > 20) clearInterval(iv); }, 15000);
  }
  window.__IECredits = { refresh: refresh, openPlans: openPlans, set: function (b) { state.balance = Number(b); paint(); }, get: function () { return state.balance; } };
  document.addEventListener("click", function (e) { var p = e.target.closest && e.target.closest("[data-ie-credits-pill]"); if (!p) return; if (!token()) { signIn(); return; } openPlans(); });
  function signIn() { var w = window.top || window; var back = ""; try { back = w.location.pathname + w.location.search; } catch (er) { w = window; back = location.pathname + location.search; } try { w.location.href = "/auth?redirect=" + encodeURIComponent(back); } catch (er) { location.href = "/auth?redirect=" + encodeURIComponent(back); } }
  window.__IESignIn = signIn;
  // Header pill next to undo/redo
  setInterval(function () {
    var slot = document.getElementById("ie-hist-slot"); if (!slot || slot.querySelector("[data-ie-credits-pill]")) return;
    var b = document.createElement("button"); b.setAttribute("data-ie-credits-pill", "1"); b.title = "AI credits";
    b.style.cssText = "height:28px;border-radius:9999px;background:#18181b;border:1px solid #3b2a63;font:11px system-ui;padding:0 10px;cursor:pointer;white-space:nowrap;margin-left:4px";
    b.innerHTML = '<span data-ie-credits-text>Credits</span>'; slot.appendChild(b); paint();
  }, 500);
  // Sync plan credits once per load (monthly rollover), then keep balance fresh.
  if (token()) post(SB + "/functions/v1/check-genius-plan", {}).then(function (j) { if (j.balance != null) { state.balance = j.balance; paint(); } refresh(); }).catch(refresh); else paint();
  setInterval(refresh, 60000);
})();

/* ---------- Dev tab files + live apps (React/TSX or A-Frame HTML) ---------- */
(function () {
  function langOf(n, l) { if (l) return l; var m = /\.(\w+)$/.exec(n); return m ? m[1] : "ts"; }
  function put(name, content, lang) {
    var ie = window.__IE; if (!ie || !ie.raw || !ie.raw.setFiles) return null;
    var id = "file_" + name.replace(/[^A-Za-z0-9]/g, "_");
    var folder = name.indexOf("/") > -1 ? name.split("/")[0] : undefined;
    ie.raw.setFiles(function (fs) {
      var hit = false;
      var out = fs.map(function (f) { if (f.name === name) { hit = true; return Object.assign({}, f, { content: content }); } return f; });
      if (!hit) out.push({ id: id, name: name, lang: langOf(name, lang), folder: folder, content: content });
      return out;
    });
    return id;
  }
  function liveApp(name, code, kind) {
    var ie = window.__IE; if (!ie || !ie.addSection) return null;
    kind = kind === "html" || /^\s*(<!doctype|<html)/i.test(code) ? "html" : kind === "aframe" || /<a-scene/i.test(code) ? "aframe" : "react";
    var slug = String(name).replace(/[^A-Za-z0-9]/g, "") || "App";
    var file = "apps/" + slug + (kind === "react" ? ".tsx" : ".html");
    var exists = !!get(file) && !!document.querySelector('iframe[src*="' + encodeURIComponent(file) + '"]');
    put(file, code, kind === "react" ? "tsx" : "html");
    try { localStorage.setItem("ie-live:" + file, code); } catch (e) {}
    if (exists) return file; /* already on the canvas: updating the file hot-reloads it, no duplicate section */
    var s = Date.now().toString(36);
    ie.addSection({ id: "sec_live_" + s, type: "section", style: { backgroundColor: "transparent", borderColor: "#27272a", borderWidth: "1px", borderStyle: "solid", borderRadius: "20px", padding: "0px", overflow: "hidden" },
      children: [{ id: "emb_live_" + s, type: "embed", content: "/imagine-engine/blocks/liveapp.html?b=1&kind=" + kind + "&file=" + encodeURIComponent(file), style: {} }] });
    return file;
  }
  /* live apps read their source from the Dev tab, so edits there re-render the canvas */
  function get(name) { var f = ((window.__IE && window.__IE.raw && window.__IE.raw.files) || []).filter(function (x) { return x.name === name; })[0]; return f ? f.content : localStorage.getItem("ie-live:" + name); }
  window.__IEFiles = { put: put, liveApp: liveApp, get: get };
})();
