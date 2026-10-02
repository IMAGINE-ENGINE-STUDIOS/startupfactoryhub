/* Imagine AI — universal builder copilot for Imagine Engine. */
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
  function md(s) {
    var parts = s.split(/```/);
    return parts.map(function (p, i) {
      if (i % 2) { var nl = p.indexOf("\n"); return '<pre class="iea-pre">' + esc(nl > -1 ? p.slice(nl + 1) : p) + "</pre>"; }
      return esc(p).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, '<code class="iea-code">$1</code>').replace(/\n/g, "<br>");
    }).join("");
  }
  function ctx() {
    var ie = window.__IE || {};
    return { widgets: ie.widgets || [], tables: ie.tables || [], nodes: ie.nodes || [], graph: ie.graph || null, programs: ie.programs || [], sections: (ie.sections || []).slice(0, 40), state: Object.keys(window.__IEState || {}) };
  }
  function currentTab() { return (window.__IE && window.__IE.mode) || "canvas"; }

  function runActions(text) {
    var m = text.match(/```actions\s*([\s\S]*?)```/);
    var done = [];
    var clean = text.replace(/```actions[\s\S]*?```/g, "").trim();
    if (!m || !window.__IE) return { text: clean, done: done };
    try {
      var list = JSON.parse(m[1]);
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
  function dbq(p, method, body, label) {
    var tb = safeTable(p.table); if (!tb) { L(label + ": choose a table name", "error"); return "missing table"; }
    var q = SB + "/rest/v1/" + tb + "?";
    if (method === "GET") q += "select=*&limit=" + (Number(p.limit) || 10) + "&";
    if (p.filterColumn && p.filterValue !== "" && p.filterValue != null) q += encodeURIComponent(p.filterColumn) + "=eq." + encodeURIComponent(p.filterValue);
    if ((method === "PATCH" || method === "DELETE") && !p.filterColumn) { L(label + ": a filter is required", "error"); return "filter required"; }
    var h = hdr(); h.Prefer = "return=representation";
    fetch(q, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (r) {
        if (!r.ok) { L(label + " " + tb + " failed: " + ((r.j && r.j.message) || "denied"), "error"); return; }
        put(p.stateKey, r.j); L(label + " " + tb + ": " + (Array.isArray(r.j) ? r.j.length + " rows" : "ok"));
      }).catch(function () { L(label + " " + tb + " network error", "error"); });
    return tb;
  }
  function http(p, method) {
    if (!/^https:\/\//.test(p.url || "")) { L("Request needs an https:// URL", "error"); return "bad url"; }
    var opt = { method: method };
    if (method !== "GET" && p.body != null) { opt.body = typeof p.body === "string" ? p.body : JSON.stringify(p.body); opt.headers = { "Content-Type": "application/json" }; }
    fetch(p.url, opt).then(function (r) { return r.text().then(function (x) { var v = x; try { v = JSON.parse(x); } catch (e) {} put(p.stateKey, v); L(method + " " + p.url + " -> " + r.status, r.ok ? "success" : "error"); }); })
      .catch(function () { L(method + " " + p.url + " blocked or offline", "error"); });
    return p.url;
  }
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
      node: node,
    };
  }
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
    ".iea-l{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:10px}" +
    ".iea-u{align-self:flex-end;max-width:88%;background:linear-gradient(135deg,#14b8a6,#a21caf);color:#fff;padding:8px 11px;border-radius:14px 14px 4px 14px}" +
    ".iea-a{max-width:100%;color:#d4d4d8}.iea-d{margin-top:6px;font-size:10px;color:#5eead4}" +
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
    '<div class="iea-h"><img src="' + LOGO + '" alt=""><div><div class="iea-t">Imagine AI</div><div class="iea-s" id="iea-tab"></div></div><button class="iea-x" id="iea-clr">New chat</button></div>' +
    '<div class="iea-l" id="iea-l"></div>' +
    '<div class="iea-f"><textarea id="iea-in" rows="2" placeholder="Describe what to build..."></textarea><button id="iea-go">&#8593;</button></div>';
  var list = root.querySelector("#iea-l"), input = root.querySelector("#iea-in"), go = root.querySelector("#iea-go");

  var SUG = {
    canvas: ["Build a SaaS landing page", "Add pricing and testimonials", "Make a marketplace homepage"],
    flow: ["Build a lead capture flow and run it", "Create a metascript that adds a pricing section", "Load the signed-in user and greet them"],
    dev: ["Write a React pricing component", "Explain this project's structure", "Add a shadcn form with Zod"],
    database: ["Design tables for a marketplace", "Add a Subscriptions table", "Schema for a CRM"],
    deploy: ["Pre-launch checklist", "How do I deploy this?", "Review my project for issues"],
    admin: ["How should I price AI for my users?", "Compare flat fee vs per token", "Suggest paid plan tiers"],
  };
  function render() {
    var tab = currentTab();
    root.querySelector("#iea-tab").textContent = "Helping on " + tab.charAt(0).toUpperCase() + tab.slice(1);
    var h = "";
    if (!messages.length) {
      h += '<div class="iea-a">Hi! I can build pages on the canvas, create flows, write code, design databases and help you deploy. What are we building?</div><div class="iea-sug">' +
        (SUG[tab] || SUG.canvas).map(function (s) { return "<button>" + esc(s) + "</button>"; }).join("") + "</div>";
    }
    messages.forEach(function (m) {
      if (m.role === "user") h += '<div class="iea-u">' + esc(m.content) + "</div>";
      else if (m.error) h += '<div class="iea-e">' + esc(m.content) + "</div>";
      else h += '<div class="iea-a">' + md(m.display || m.content) + (m.done && m.done.length ? '<div class="iea-d">&#10003; ' + esc(m.done.join(" · ")) + "</div>" : "") + "</div>";
    });
    if (busy) h += '<div class="iea-a"><span class="iea-dot"></span><span class="iea-dot" style="animation-delay:.2s"></span><span class="iea-dot" style="animation-delay:.4s"></span></div>';
    list.innerHTML = h;
    list.querySelectorAll(".iea-sug button").forEach(function (b) { b.onclick = function () { send(b.textContent); }; });
    list.scrollTop = list.scrollHeight;
    go.disabled = busy;
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(messages.slice(-60))); } catch (e) {} }

  function send(text) {
    text = (text || "").trim();
    if (!text || busy) return;
    var t = token();
    messages.push({ role: "user", content: text });
    input.value = "";
    if (!t) { messages.push({ role: "assistant", error: true, content: "Please sign in to Startup Factory Hub to use Imagine AI." }); render(); save(); return; }
    busy = true; render();
    var history = messages.filter(function (m) { return !m.error; }).map(function (m) { return { role: m.role, content: m.content }; });
    fetch(FN, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON, Authorization: "Bearer " + t },
      body: JSON.stringify({ action: "chat", tab: currentTab(), messages: history, context: ctx() }),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || res.j.error) { messages.push({ role: "assistant", error: true, content: res.j.error || "Something went wrong." }); return; }
        var out = runActions(res.j.text || "");
        messages.push({ role: "assistant", content: res.j.text || "", display: out.text, done: out.done });
      })
      .catch(function () { messages.push({ role: "assistant", error: true, content: "Network error. Please try again." }); })
      .finally(function () { busy = false; render(); save(); input.focus(); });
  }
  go.onclick = function () { send(input.value); };
  input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input.value); } });
  root.querySelector("#iea-clr").onclick = function () { messages = []; save(); render(); };

  // Floating launcher for Flow / Dev / Database / Deploy (and canvas when AI tab closed)
  var fab = document.createElement("button");
  fab.className = "iea-fab"; fab.title = "Imagine AI"; fab.innerHTML = '<img src="' + LOGO + '" alt="Imagine AI">';
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
