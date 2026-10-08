/* Imagine Engine solution templates, shared state bus and CDN library loader. */
(function () {
  /* ---- Shared state bus ---- */
  var st = window.__IEState = window.__IEState || {};
  var subs = {};
  window.__IEBus = {
    get: function (k) { return st[k]; },
    set: function (k, v) { st[k] = v; (subs[k] || []).concat(subs["*"] || []).forEach(function (f) { try { f(v, k); } catch (e) {} }); },
    subscribe: function (k, f) { (subs[k] = subs[k] || []).push(f); return function () { subs[k] = subs[k].filter(function (g) { return g !== f; }); }; }
  };
  addEventListener("message", function (e) { var d = e.data; if (d && d.ie === "state" && typeof d.key === "string") window.__IEBus.set(d.key, d.value); });

  /* ---- CDN library loader ---- */
  var LIBS = {
    three: "https://unpkg.com/three@0.160.0/build/three.min.js",
    chart: "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js",
    gsap: "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js",
    lucide: "https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js",
    confetti: "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js",
    pixi: "https://cdn.jsdelivr.net/npm/pixi.js@7.4.2/dist/pixi.min.js",
    matter: "https://cdn.jsdelivr.net/npm/matter-js@0.19.0/build/matter.min.js",
    d3: "https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js",
    aframe: "https://aframe.io/releases/1.6.0/aframe.min.js",
    babylon: "https://cdn.babylonjs.com/babylon.js",
    babylonloaders: "https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js",
    playcanvas: "https://cdn.jsdelivr.net/npm/playcanvas@2.3.3/build/playcanvas.min.js",
    tone: "https://cdn.jsdelivr.net/npm/tone@14.8.49/build/Tone.js",
    howler: "https://cdn.jsdelivr.net/npm/howler@2.2.4/dist/howler.min.js",
    phaser: "https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js",
    leaflet: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
    tfjs: "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js",
    babel: "https://unpkg.com/@babel/standalone@7.26.4/babel.min.js",
    tailwind: "https://cdn.tailwindcss.com"
  };
  var loaded = {};
  window.__IELoad = function (name) {
    var url = LIBS[name] || (/^https:\/\//.test(name) ? name : null);
    if (!url) return Promise.reject(new Error("Unknown library " + name));
    if (!loaded[url]) loaded[url] = new Promise(function (res, rej) { var s = document.createElement("script"); s.src = url; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    return loaded[url];
  };
  window.__IELibs = Object.keys(LIBS);

  /* ---- Templates ---- */
  var C = { bg: "#0b0b0c", card: "#18181b", line: "#27272a", text: "#fafafa", mute: "#a1a1aa", acc: "#8b5cf6" };
  var btn = function (t, href, ghost) { return { type: "button", content: t, style: Object.assign({ backgroundColor: ghost ? C.card : C.acc, color: "#ffffff", borderRadius: "9999px", padding: "12px 22px" }, href ? { "@href": href } : {}) }; };
  var card = function (title, body) { return { type: "div", children: [{ type: "h1", content: title, style: { fontSize: "18px" } }, { type: "p", content: body, style: { color: C.mute } }], style: { backgroundColor: C.card, borderRadius: "16px", padding: "20px" } }; };
  var grid = function (items) { return { type: "grid", children: items, style: { gap: "16px" } }; };
  var head = function (badge, h, p) { return [{ type: "badge", content: badge }, { type: "h1", content: h, style: { fontSize: "40px" } }, { type: "p", content: p, style: { color: C.mute } }]; };
  var embed = function (file) { return { embed: "/imagine-engine/blocks/" + file + "?b=1" }; };

  var T = {
    saas: { name: "SaaS dashboard", pages: ["Dashboard", "Pricing"], tables: [["Customers", ["id", "name", "email", "plan", "mrr"]], ["Leads", ["id", "name", "email", "message"]]], sections: [
      { children: head("Analytics", "Know your numbers in one place", "Track revenue, customers and churn the moment they change.").concat([btn("Start free trial", "page:Pricing"), btn("See dashboard", "page:Dashboard", true)]) },
      { children: [{ type: "h1", content: "Key metrics", style: { fontSize: "24px" } }, grid([card("Monthly revenue", "Connect your data to fill this in"), card("Active customers", "Connect your data to fill this in"), card("Churn", "Connect your data to fill this in"), card("Trials", "Connect your data to fill this in")])] },
      { children: [{ type: "h1", content: "Everything a growing team needs", style: { fontSize: "28px" } }, grid([card("Live reports", "Dashboards that update in real time."), card("Team access", "Invite your team with roles."), card("Exports", "Download any report as CSV.")])] },
      { children: [{ type: "h1", content: "Simple pricing", style: { fontSize: "28px" } }, grid([card("Starter - $19/mo", "1 workspace, core reports"), card("Growth - $49/mo", "5 workspaces, alerts"), card("Scale - $99/mo", "Unlimited, priority support")])] },
      { children: [{ type: "h1", content: "Talk to us", style: { fontSize: "24px" } }, { type: "p", content: "Leave your email and we will get back to you within one business day.", style: { color: C.mute } }, btn("Contact sales")] }
    ] },
    ecommerce: { name: "Online store", pages: ["Shop", "About"], cart: { title: "Your bag", accent: C.acc, theme: "dark", fab: true }, tables: [["Products", ["id", "name", "price", "stock", "image"]], ["Orders", ["id", "email", "items", "total", "status"]]], sections: [
      { children: head("New season", "Pieces made to last", "Free shipping on orders over $75. Easy 30-day returns.").concat([btn("Shop now", "page:Shop"), btn("Cart", "cart:open", true)]) },
      { children: [{ type: "h1", content: "Best sellers", style: { fontSize: "28px" } }, grid(["Classic tee|$28", "Everyday hoodie|$64", "Canvas tote|$22", "Wool beanie|$26"].map(function (s) { var p = s.split("|"); return { type: "div", children: [{ type: "h1", content: p[0], style: { fontSize: "18px" } }, { type: "p", content: p[1], style: { color: C.mute } }, btn("Add to cart")], style: { backgroundColor: C.card, borderRadius: "16px", padding: "20px" } }; }))] },
      { children: [grid([card("Free shipping", "On every order over $75"), card("30-day returns", "No questions asked"), card("Secure checkout", "Card payments by Stripe")])] },
      { children: [{ type: "h1", content: "Join the list", style: { fontSize: "24px" } }, { type: "p", content: "Get early access to new drops.", style: { color: C.mute } }, btn("Subscribe")] }
    ] },
    agency: { name: "Agency portfolio", pages: ["Work", "Contact"], tables: [["Leads", ["id", "name", "email", "budget", "message"]]], sections: [
      { children: head("Studio", "We design brands people remember", "Strategy, identity and websites for ambitious companies.").concat([btn("Start a project", "page:Contact"), btn("See our work", "page:Work", true)]) },
      { children: [{ type: "h1", content: "Services", style: { fontSize: "28px" } }, grid([card("Brand identity", "Logos, type and visual systems."), card("Web design", "Fast, beautiful marketing sites."), card("Product design", "Apps people enjoy using.")])] },
      { children: [{ type: "h1", content: "Selected work", style: { fontSize: "28px" } }, grid([card("Project one", "Add your case study"), card("Project two", "Add your case study"), card("Project three", "Add your case study")])] },
      { children: [{ type: "h1", content: "Have a project in mind?", style: { fontSize: "28px" } }, btn("Get in touch", "page:Contact")] }
    ] },
    webgl: { name: "3D hero", sections: [{ liveFile: "webgl.html", app: "Hero3D" }, { children: head("3D", "Built with real-time 3D", "Swap the shape, colors and copy to match your product.") }] },
    cargame: { name: "3D car game", sections: [{ liveFile: "cargame.html", app: "StreetRacer" }, { children: [{ type: "h1", content: "How to play", style: { fontSize: "24px" } }, { type: "p", content: "Steer with arrow keys, A/D or the on-screen buttons. Hold Up/W to go faster. Dodge traffic to score.", style: { color: C.mute } }] }] },
    game: { name: "2D game", sections: [{ liveFile: "game.html", app: "StarCatcher" }, { children: [{ type: "h1", content: "How to play", style: { fontSize: "24px" } }, { type: "p", content: "Catch yellow stars, avoid red ones. Speed rises with your score.", style: { color: C.mute } }] }] },
    studio3d: { name: "3D Level Studio", sections: [{ embed: "/imagine-studio" }, { children: [{ type: "h1", content: "3D Level Studio", style: { fontSize: "24px" } }, { type: "p", content: "Build levels with terrain, characters, physics and lighting, then press Play.", style: { color: C.mute } }] }] },
    camera: { name: "Camera and motion", sections: [embed("camera.html"), { children: [{ type: "h1", content: "Live motion detection", style: { fontSize: "24px" } }, { type: "p", content: "Runs fully in the browser. Video never leaves the device. Motion level is shared with flows as state key 'motion'.", style: { color: C.mute } }] }] }
  };
  var ALIAS = { car: "cargame", racing: "cargame", race: "cargame", "3dgame": "cargame", driving: "cargame", dashboard: "saas", shop: "ecommerce", store: "ecommerce", portfolio: "agency", "3d": "webgl", three: "webgl", cv: "camera", studio: "studio3d", level: "studio3d", leveleditor: "studio3d", vision: "camera", sensor: "camera" };

  function sfx() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function mk(n, s, i) {
    var tp = ["h1", "p", "button", "badge", "card", "div", "grid"].indexOf(n.type) > -1 ? n.type : "p";
    return { id: tp + "_" + s + "_" + i + Math.random().toString(36).slice(2, 4), type: tp, content: String(n.content || ""), style: Object.assign({}, n.style || {}), children: Array.isArray(n.children) ? n.children.map(function (c, j) { return mk(c, s, i + "" + j); }) : undefined };
  }
  function addSection(sec) {
    var ie = window.__IE; if (!ie || !ie.addSection) return;
    var s = sfx();
    if (sec.liveFile) {
      /* templates become editable Dev files (apps/*.html) so the AI can keep developing them */
      fetch("/imagine-engine/blocks/" + sec.liveFile).then(function (r) { return r.text(); }).then(function (code) {
        if (window.__IEFiles) window.__IEFiles.liveApp(sec.app, code, "html");
        else addSection({ embed: "/imagine-engine/blocks/" + sec.liveFile + "?b=1" });
      }).catch(function () { addSection({ embed: "/imagine-engine/blocks/" + sec.liveFile + "?b=1" }); });
      return;
    }
    if (sec.embed) {
      ie.addSection({ id: "sec_tpl_" + s, type: "section", style: { backgroundColor: "transparent", borderColor: C.line, borderWidth: "1px", borderStyle: "solid", borderRadius: "20px", padding: "0px", overflow: "hidden" }, children: [{ id: "emb_tpl_" + s, type: "embed", content: sec.embed, style: {} }] });
      return;
    }
    ie.addSection({ id: "sec_tpl_" + s, type: "section", style: { backgroundColor: C.bg, color: C.text, borderColor: C.line, borderWidth: "1px", borderStyle: "solid", borderRadius: "24px", padding: "36px" }, children: sec.children.map(function (c, i) { return mk(c, s, i); }) });
  }
  function apply(key) {
    key = String(key || "").toLowerCase(); key = ALIAS[key] || key;
    var t = T[key]; if (!t || !window.__IE) return null;
    var X = window.__IEX || {};
    var pages = t.pages || [];
    pages.forEach(function (p, i) { setTimeout(function () { try { X.addPage && X.addPage({ name: p }); } catch (e) {} }, i * 150); });
    var wait = pages.length ? pages.length * 150 + 300 : 0;
    setTimeout(function () { if (pages.length && X.goPage) try { X.goPage({ name: "Main" }); } catch (e) {} }, wait);
    setTimeout(function () {
      t.sections.forEach(addSection);
      if (t.cart && X.setCartConfig) try { X.setCartConfig({ config: t.cart }); } catch (e) {}
      (t.tables || []).forEach(function (tb) { try { window.__IE.addTable({ id: "tbl_" + sfx(), name: tb[0], columns: tb[1], rows: [] }); } catch (e) {} });
    }, wait + 300);
    return t.name;
  }
  T.vr = { name: "3D / VR room", live: { name: "VRRoom", kind: "aframe", code: '<a-scene background="color: #cfe3f2" renderer="antialias: true">\n  <a-entity light="type: hemisphere; color: #ffffff; groundColor: #7a6a55; intensity: 0.9"></a-entity>\n  <a-entity light="type: directional; intensity: 0.8" position="4 8 3"></a-entity>\n  <a-plane rotation="-90 0 0" width="30" height="30" color="#9fb38a"></a-plane>\n  <a-box position="-1.5 0.5 -4" color="#c0563b" animation="property: rotation; to: 0 360 0; loop: true; dur: 8000"></a-box>\n  <a-sphere position="0 1.25 -5" radius="1.1" color="#e8b04b"></a-sphere>\n  <a-cylinder position="1.8 0.75 -4" radius="0.5" height="1.5" color="#3d6e8f"></a-cylinder>\n  <a-text value="Welcome - open in a headset for VR" position="-2.2 2.9 -5" color="#1f2933" width="6"></a-text>\n  <a-entity camera look-controls wasd-controls position="0 1.6 0"></a-entity>\n</a-scene>' }, sections: [{ children: [{ type: "h1", content: "Walk around", style: { fontSize: "24px" } }, { type: "p", content: "Drag to look, WASD to move. Works in VR headsets with the VR button.", style: { color: C.mute } }] }] };
  ALIAS.aframe = "vr"; ALIAS.webxr = "vr"; ALIAS.metaverse = "vr"; ALIAS.virtual = "vr";
  var _apply = apply;
  apply = function (key) { var k = String(key || "").toLowerCase(); k = ALIAS[k] || k; var t = T[k]; if (t && t.live && window.__IEFiles) { window.__IEFiles.liveApp(t.live.name, t.live.code, t.live.kind); } return _apply(key); };
  window.__IEBlocks = { apply: apply, list: Object.keys(T).map(function (k) { return { id: k, name: T[k].name }; }) };
})();
