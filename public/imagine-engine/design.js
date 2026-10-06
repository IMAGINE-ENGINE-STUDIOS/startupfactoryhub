/* Imagine Engine design studio: gradient builder, project background, advanced content inspector. */
(function () {
  var BG_PREFIX = "ie-bg:";
  function pid() { try { return (window.__IE && window.__IE.raw && window.__IE.raw.pid) || "default"; } catch (e) { return "default"; } }
  function J(k, d) { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch (e) { return d; } }
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) { if (k === "style") e.style.cssText = attrs[k]; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]); else if (k === "value") e.value = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  var L = "font:500 10px system-ui;text-transform:uppercase;letter-spacing:.04em;color:#71717a;margin:10px 0 4px";
  var BTN = "height:26px;border-radius:9px;background:#27272a;color:#e4e4e7;font:11px system-ui;border:1px solid #3f3f46;cursor:pointer;padding:0 7px";
  var ON = ";background:#e4e4e7;color:#18181b";
  var INP = "width:100%;height:28px;border-radius:9px;background:#09090b;border:1px solid #27272a;color:#e4e4e7;font:12px system-ui;padding:0 8px;box-sizing:border-box";
  var css = document.createElement("style");
  css.textContent = ".ie-dragging iframe{pointer-events:none!important}.ie-dragging [data-section-id]:hover{outline:2px dashed #8b5cf6;outline-offset:4px}" +
    ".ied-rng{width:100%;accent-color:#8b5cf6}.ied-sec{border-top:1px solid #27272a;padding-top:8px;margin-top:8px;color:#e4e4e7;font:12px system-ui}";
  document.head.appendChild(css);
  document.addEventListener("dragend", function () { document.body.classList.remove("ie-dragging"); });
  document.addEventListener("drop", function () { document.body.classList.remove("ie-dragging"); });

  /* ---------- gradient model ---------- */
  function hexA(hex, a) { var n = parseInt(hex.slice(1), 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + (+a).toFixed(2) + ")"; }
  function gcss(g) {
    var st = g.stops.slice().sort(function (a, b) { return a.p - b.p; }).map(function (s) { return hexA(s.c, s.a) + " " + s.p + "%"; }).join(", ");
    if (g.type === "radial") return "radial-gradient(" + g.shape + " at " + g.pos + ", " + st + ")";
    if (g.type === "conic") return "conic-gradient(from " + g.angle + "deg at " + g.pos + ", " + st + ")";
    return "linear-gradient(" + g.angle + "deg, " + st + ")";
  }
  function P(type, angle, stops) { return { type: type, angle: angle, shape: "circle", pos: "50% 50%", stops: stops.map(function (s) { return { c: s[0], a: s[1] == null ? 1 : s[1], p: s[2] }; }) }; }
  var PRESETS = [
    ["Cyberpunk", P("linear", 135, [["#00f5d4", 1, 0], ["#9b5de5", 1, 55], ["#f15bb5", 1, 100]])],
    ["Obsidian", P("linear", 180, [["#2a2a2e", 1, 0], ["#0a0a0b", 1, 100]])],
    ["Velvet Night", P("linear", 160, [["#1e1b4b", 1, 0], ["#4c1d95", 1, 60], ["#0f172a", 1, 100]])],
    ["Solar Flare", P("linear", 120, [["#f97316", 1, 0], ["#facc15", 1, 100]])],
    ["Aurora", P("linear", 140, [["#22d3ee", 1, 0], ["#10b981", 1, 50], ["#6366f1", 1, 100]])],
    ["Hyper Violet", P("radial", 0, [["#a855f7", 1, 0], ["#0a0a0a", 1, 70]])],
    ["Emerald Flux", P("linear", 90, [["#064e3b", 1, 0], ["#34d399", 1, 100]])],
    ["Rose Gold", P("linear", 135, [["#fda4af", 1, 0], ["#fcd34d", 1, 100]])],
    ["Pure Glass", P("linear", 135, [["#ffffff", 0.18, 0], ["#ffffff", 0.04, 100]])],
    ["Dark Titan", P("linear", 200, [["#334155", 1, 0], ["#020617", 1, 100]])],
    ["Dusk", P("linear", 180, [["#0ea5e9", 1, 0], ["#f43f5e", 1, 100]])],
    ["Sunset", P("linear", 45, [["#ef4444", 1, 0], ["#f59e0b", 1, 50], ["#ec4899", 1, 100]])],
    ["Ocean", P("linear", 180, [["#0c4a6e", 1, 0], ["#06b6d4", 1, 100]])],
    ["Mint", P("linear", 120, [["#a7f3d0", 1, 0], ["#e0f2fe", 1, 100]])],
    ["Spotlight", P("radial", 0, [["#ffffff", 0.25, 0], ["#000000", 0, 60]])],
    ["Spectrum", P("conic", 0, [["#ef4444", 1, 0], ["#eab308", 1, 25], ["#22c55e", 1, 50], ["#3b82f6", 1, 75], ["#ef4444", 1, 100]])],
  ];
  var G = J("ie-grad-draft", null) || JSON.parse(JSON.stringify(PRESETS[0][1]));
  var sel = 0, target = "element";

  /* ---------- project background ---------- */
  function bgOf() { return J(BG_PREFIX + pid(), { mode: "default", solid: "#0a0a0a", grad: null, img: "", fit: "cover", posi: "center", ov: "#000000", ova: 0, pattern: "none" }); }
  function saveBg(b) { try { localStorage.setItem(BG_PREFIX + pid(), JSON.stringify(b)); } catch (e) {} applyBg(); if (window.__IEPushHistory) window.__IEPushHistory("Background"); }
  var bgStyle = document.createElement("style"); document.head.appendChild(bgStyle);
  function applyBg() {
    var b = bgOf(), layers = [], pat = { grid: "linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px) 0 0/32px 32px,linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px) 0 0/32px 32px", dots: "radial-gradient(rgba(255,255,255,.09) 1px,transparent 1px) 0 0/18px 18px" }[b.pattern];
    if (b.mode === "default" && !pat) { bgStyle.textContent = ""; return; }
    if (pat) layers.push(pat);
    if (b.ova > 0) layers.push("linear-gradient(" + hexA(b.ov, b.ova) + "," + hexA(b.ov, b.ova) + ")");
    if (b.mode === "gradient" && b.grad) layers.push(gcss(b.grad));
    if (b.mode === "image" && b.img) layers.push('url("' + b.img.replace(/"/g, "") + '") ' + b.posi + "/" + (b.fit === "tile" ? "auto" : b.fit) + (b.fit === "tile" ? " repeat" : " no-repeat"));
    var base = b.mode === "solid" ? b.solid : (b.mode === "default" ? "#0a0a0a" : b.solid);
    bgStyle.textContent = "#ie-canvas-bg,#ie-play-bg{background:" + (layers.length ? layers.join(",") + "," : "") + base + "!important;background-attachment:local!important}" +
      // inner scroll areas paint their own dark fill over the background; let the project background show through
      "#ie-canvas-bg [class*='bg-[#0a0a0a]'],#ie-canvas-bg [class*='bg-[#09090b]'],#ie-play-bg [class*='bg-[#0a0a0a]'],#ie-play-bg [class*='bg-[#09090b]']{background-color:transparent!important}";
  }
  /* quick background button on the canvas */
  function quickBg() {
    var host = document.getElementById("ie-canvas-bg"); if (!host || host.querySelector("[data-ie-qbg]")) return;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    var pop = null;
    var btn = h("button", { "data-ie-qbg": "1", title: "Page background", style: BTN + ";position:absolute;right:12px;bottom:12px;z-index:40;height:30px;padding:0 10px;box-shadow:0 4px 14px rgba(0,0,0,.4)", onclick: function (ev) {
      ev.stopPropagation(); if (pop) { pop.remove(); pop = null; return; }
      var b = bgOf();
      pop = h("div", { style: "position:absolute;right:12px;bottom:50px;z-index:41;width:240px;background:#18181b;border:1px solid #3f3f46;border-radius:12px;padding:10px;color:#e4e4e7;font:12px system-ui" }, [
        h("div", { style: L }, ["Solid color"]),
        h("input", { type: "color", value: b.solid || "#0a0a0a", style: "width:100%;height:28px;border:0;background:none", oninput: function (e) { var x = bgOf(); x.mode = "solid"; x.solid = e.target.value; saveBg(x); } }),
        h("div", { style: L }, ["Gradient"]),
        h("div", { style: "display:grid;grid-template-columns:repeat(4,1fr);gap:4px" }, PRESETS.slice(0, 12).map(function (pr) {
          return h("button", { title: pr[0], style: "height:24px;border-radius:6px;border:1px solid #3f3f46;cursor:pointer;background:" + gcss(pr[1]), onclick: function () { var x = bgOf(); x.mode = "gradient"; x.grad = JSON.parse(JSON.stringify(pr[1])); saveBg(x); } });
        })),
        h("div", { style: L }, ["Image link"]),
        h("input", { style: INP, placeholder: "https://...", value: b.img || "", onchange: function (e) { var x = bgOf(); x.mode = e.target.value ? "image" : "default"; x.img = e.target.value.trim(); saveBg(x); } }),
        h("div", { style: L }, ["Pattern"]),
        h("div", { style: "display:flex;gap:4px" }, ["none", "grid", "dots"].map(function (pt) { return h("button", { style: BTN + (b.pattern === pt ? ON : ""), onclick: function () { var x = bgOf(); x.pattern = pt; saveBg(x); pop.remove(); pop = null; } }, [pt]); })),
        h("button", { style: BTN + ";width:100%;margin-top:10px", onclick: function () { var x = bgOf(); x.mode = "default"; x.pattern = "none"; x.img = ""; x.ova = 0; saveBg(x); pop.remove(); pop = null; } }, ["Reset background"]),
      ]);
      pop.addEventListener("click", function (e) { e.stopPropagation(); });
      host.appendChild(pop);
    } }, ["Background"]);
    host.appendChild(btn);
    document.addEventListener("click", function () { if (pop) { pop.remove(); pop = null; } });
  }
  setInterval(quickBg, 1000);

  window.__IEApplyBg = function () { applyBg(); try { paint(true); } catch (e) {} };
  var lastPid = "";
  setInterval(function () { if (pid() !== lastPid) { lastPid = pid(); applyBg(); paint(true); } }, 700);

  /* ---------- apply to selected element ---------- */
  function hasEl() { return !!(window.__IEElHasTarget && window.__IEElHasTarget()); }
  function styleEl(p) { if (window.__IEElSetStyle) window.__IEElSetStyle(p); }
  function commit() {
    try { localStorage.setItem("ie-grad-draft", JSON.stringify(G)); } catch (e) {}
    var c = gcss(G);
    if (target === "element") { if (hasEl()) styleEl({ backgroundImage: c }); }
    else { var b = bgOf(); b.mode = "gradient"; b.grad = JSON.parse(JSON.stringify(G)); saveBg(b); }
  }

  /* ---------- Design tab: gradient studio + background ---------- */
  var lastDesign = "";
  function paint(force) {
    var slot = document.getElementById("ie-design-panel");
    if (!slot) { lastDesign = ""; return; }
    var sig = target + "|" + hasEl() + "|" + pid();
    if (!force && sig === lastDesign && slot.childNodes.length) return;
    lastDesign = sig; slot.innerHTML = "";
    var box = h("div", { style: "color:#e4e4e7;font:12px system-ui" });
    box.appendChild(h("div", { style: "font:600 12px system-ui;color:#c4b5fd" }, ["Gradient studio"]));
    // target
    var tr = h("div", { style: "display:flex;gap:4px;margin-top:6px" });
    [["element", "Selected element"], ["background", "Project background"]].forEach(function (t) {
      tr.appendChild(h("button", { style: BTN + ";flex:1" + (target === t[0] ? ON : ""), onclick: function () { target = t[0]; paint(true); } }, [t[1]]));
    });
    box.appendChild(tr);
    if (target === "element" && !hasEl()) box.appendChild(h("div", { style: "font-size:10px;color:#f59e0b;margin-top:4px" }, ["Click an element on the canvas first, or switch to Project background."]));
    // type
    box.appendChild(h("div", { style: L }, ["Type"]));
    var ty = h("div", { style: "display:flex;gap:4px" });
    ["linear", "radial", "conic"].forEach(function (t) { ty.appendChild(h("button", { style: BTN + ";flex:1;text-transform:capitalize" + (G.type === t ? ON : ""), onclick: function () { G.type = t; commit(); paint(true); } }, [t])); });
    box.appendChild(ty);
    // preview bar + stops
    box.appendChild(h("div", { style: L }, ["Stops — click the bar to add"]));
    var bar = h("div", { style: "position:relative;height:28px;border-radius:8px;border:1px solid #3f3f46;cursor:copy;background:linear-gradient(90deg," + G.stops.slice().sort(function (a, b) { return a.p - b.p; }).map(function (s) { return hexA(s.c, s.a) + " " + s.p + "%"; }).join(",") + "),repeating-conic-gradient(#27272a 0 25%,#18181b 0 50%) 0 0/10px 10px" });
    bar.addEventListener("click", function (e) {
      if (e.target !== bar) return;
      var r = bar.getBoundingClientRect(), p = Math.round((e.clientX - r.left) / r.width * 100);
      G.stops.push({ c: G.stops[sel] ? G.stops[sel].c : "#ffffff", a: 1, p: p }); sel = G.stops.length - 1; commit(); paint(true);
    });
    G.stops.forEach(function (s, i) {
      var pin = h("div", { title: "Drag to move", style: "position:absolute;top:-4px;width:14px;height:34px;margin-left:-7px;border-radius:5px;cursor:ew-resize;box-sizing:border-box;border:2px solid " + (i === sel ? "#fff" : "#52525b") + ";background:" + s.c + ";left:" + s.p + "%" });
      pin.addEventListener("pointerdown", function (e) {
        e.preventDefault(); sel = i; var r = bar.getBoundingClientRect();
        var mv = function (ev) { s.p = Math.max(0, Math.min(100, Math.round((ev.clientX - r.left) / r.width * 100))); pin.style.left = s.p + "%"; commit(); };
        var up = function () { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); paint(true); };
        addEventListener("pointermove", mv); addEventListener("pointerup", up);
      });
      bar.appendChild(pin);
    });
    box.appendChild(bar);
    var s = G.stops[sel] || G.stops[0]; if (!G.stops[sel]) sel = 0;
    var sr = h("div", { style: "display:grid;grid-template-columns:34px 1fr 1fr;gap:6px;align-items:center;margin-top:8px" });
    sr.appendChild(h("input", { type: "color", value: s.c, style: "width:34px;height:28px;border:0;background:none;cursor:pointer", oninput: function (e) { s.c = e.target.value; commit(); } , onchange: function () { paint(true); } }));
    var hx = h("input", { value: s.c, style: INP, onchange: function (e) { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) { s.c = e.target.value; commit(); paint(true); } } });
    sr.appendChild(hx);
    sr.appendChild(h("input", { type: "number", min: "0", max: "100", value: String(s.p), title: "Position %", style: INP, oninput: function (e) { s.p = Math.max(0, Math.min(100, +e.target.value || 0)); commit(); }, onchange: function () { paint(true); } }));
    box.appendChild(sr);
    box.appendChild(h("div", { style: L }, ["Opacity " + Math.round(s.a * 100) + "%"]));
    box.appendChild(h("input", { type: "range", min: "0", max: "100", value: String(Math.round(s.a * 100)), "class": "ied-rng", oninput: function (e) { s.a = e.target.value / 100; commit(); }, onchange: function () { paint(true); } }));
    var sa = h("div", { style: "display:flex;gap:4px;margin-top:6px" });
    sa.appendChild(h("button", { style: BTN + ";flex:1", onclick: function () { if (G.stops.length > 2) { G.stops.splice(sel, 1); sel = 0; commit(); paint(true); } } }, ["Remove stop"]));
    sa.appendChild(h("button", { style: BTN + ";flex:1", onclick: function () { G.stops.forEach(function (x) { x.p = 100 - x.p; }); commit(); paint(true); } }, ["Reverse"]));
    box.appendChild(sa);
    // angle / position
    if (G.type !== "radial") {
      box.appendChild(h("div", { style: L }, ["Angle " + G.angle + "°"]));
      box.appendChild(h("input", { type: "range", min: "0", max: "360", value: String(G.angle), "class": "ied-rng", oninput: function (e) { G.angle = +e.target.value; commit(); }, onchange: function () { paint(true); } }));
      var ar = h("div", { style: "display:grid;grid-template-columns:repeat(8,1fr);gap:3px;margin-top:4px" });
      [[0, "↑"], [45, "↗"], [90, "→"], [135, "↘"], [180, "↓"], [225, "↙"], [270, "←"], [315, "↖"]].forEach(function (a) { ar.appendChild(h("button", { style: BTN + ";padding:0" + (G.angle === a[0] ? ON : ""), onclick: function () { G.angle = a[0]; commit(); paint(true); } }, [a[1]])); });
      box.appendChild(ar);
    }
    if (G.type !== "linear") {
      box.appendChild(h("div", { style: L }, ["Center"]));
      var pr = h("div", { style: "display:grid;grid-template-columns:repeat(3,1fr);gap:3px" });
      [["0% 0%", "Top left"], ["50% 0%", "Top"], ["100% 0%", "Top right"], ["0% 50%", "Left"], ["50% 50%", "Center"], ["100% 50%", "Right"], ["0% 100%", "Bottom left"], ["50% 100%", "Bottom"], ["100% 100%", "Bottom right"]].forEach(function (q) { pr.appendChild(h("button", { style: BTN + ";font-size:10px" + (G.pos === q[0] ? ON : ""), onclick: function () { G.pos = q[0]; commit(); paint(true); } }, [q[1]])); });
      box.appendChild(pr);
      if (G.type === "radial") {
        var shp = h("div", { style: "display:flex;gap:4px;margin-top:4px" });
        ["circle", "ellipse"].forEach(function (q) { shp.appendChild(h("button", { style: BTN + ";flex:1;text-transform:capitalize" + (G.shape === q ? ON : ""), onclick: function () { G.shape = q; commit(); paint(true); } }, [q])); });
        box.appendChild(shp);
      }
    }
    // presets
    box.appendChild(h("div", { style: L }, ["Presets"]));
    var pg = h("div", { style: "display:grid;grid-template-columns:repeat(4,1fr);gap:4px" });
    PRESETS.forEach(function (p) { pg.appendChild(h("button", { title: p[0], style: "height:30px;border-radius:8px;border:1px solid #3f3f46;cursor:pointer;background:" + gcss(p[1]), onclick: function () { G = JSON.parse(JSON.stringify(p[1])); sel = 0; commit(); paint(true); } })); });
    box.appendChild(pg);
    var cp = h("button", { style: BTN + ";width:100%;margin-top:8px", onclick: function () { var t = "background-image: " + gcss(G) + ";"; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { cp.textContent = "Copied"; setTimeout(function () { cp.textContent = "Copy CSS"; }, 1200); }).catch(function () { prompt("CSS", t); }); } }, ["Copy CSS"]);
    box.appendChild(cp);

    // project background
    var b = bgOf(), bs = h("div", { "class": "ied-sec" });
    bs.appendChild(h("div", { style: "font:600 12px system-ui;color:#c4b5fd" }, ["Project background"]));
    var md = h("div", { style: "display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:6px" });
    [["default", "Default"], ["solid", "Solid"], ["gradient", "Gradient"], ["image", "Image"]].forEach(function (m) { md.appendChild(h("button", { style: BTN + (b.mode === m[0] ? ON : ""), onclick: function () { b.mode = m[0]; if (m[0] === "gradient" && !b.grad) b.grad = JSON.parse(JSON.stringify(G)); saveBg(b); paint(true); } }, [m[1]])); });
    bs.appendChild(md);
    if (b.mode === "solid" || b.mode === "image") {
      bs.appendChild(h("div", { style: L }, ["Color"]));
      bs.appendChild(h("input", { type: "color", value: b.solid, style: "width:100%;height:28px;border:0;background:none;cursor:pointer", oninput: function (e) { b.solid = e.target.value; saveBg(b); } }));
    }
    if (b.mode === "gradient") bs.appendChild(h("button", { style: BTN + ";width:100%;margin-top:6px", onclick: function () { target = "background"; b.grad = JSON.parse(JSON.stringify(G)); saveBg(b); paint(true); } }, ["Use the gradient above"]));
    if (b.mode === "image") {
      bs.appendChild(h("div", { style: L }, ["Image link"]));
      bs.appendChild(h("input", { value: b.img, placeholder: "https://...", style: INP, onchange: function (e) { b.img = e.target.value.trim(); saveBg(b); } }));
      var st = h("div", { style: "font-size:10px;color:#71717a;margin-top:4px" });
      var fi = h("input", { type: "file", accept: "image/*", style: "display:none", onchange: function () {
        var f = fi.files[0]; if (!f) return; var Cl = window.__IECloud;
        if (Cl && Cl.signedIn && Cl.signedIn() && Cl.upload) { st.textContent = "Uploading..."; Cl.upload(f).then(function (u) { b.img = u; saveBg(b); paint(true); }).catch(function (e) { st.textContent = e.message; }); }
        else if (f.size <= 2 * 1024 * 1024) { var rd = new FileReader(); rd.onload = function () { b.img = rd.result; saveBg(b); paint(true); }; rd.readAsDataURL(f); }
        else st.textContent = "Sign in to upload images over 2 MB.";
      } });
      bs.appendChild(fi); bs.appendChild(h("button", { style: BTN + ";width:100%;margin-top:6px", onclick: function () { fi.click(); } }, ["Upload image"])); bs.appendChild(st);
      bs.appendChild(h("div", { style: L }, ["Fit"]));
      var ft = h("div", { style: "display:flex;gap:4px" });
      ["cover", "contain", "tile"].forEach(function (q) { ft.appendChild(h("button", { style: BTN + ";flex:1;text-transform:capitalize" + (b.fit === q ? ON : ""), onclick: function () { b.fit = q; saveBg(b); paint(true); } }, [q])); });
      bs.appendChild(ft);
      var po = h("div", { style: "display:flex;gap:4px;margin-top:4px" });
      ["top", "center", "bottom"].forEach(function (q) { po.appendChild(h("button", { style: BTN + ";flex:1;text-transform:capitalize" + (b.posi === q ? ON : ""), onclick: function () { b.posi = q; saveBg(b); paint(true); } }, [q])); });
      bs.appendChild(po);
    }
    if (b.mode !== "default") {
      bs.appendChild(h("div", { style: L }, ["Overlay " + Math.round(b.ova * 100) + "%"]));
      var ovr = h("div", { style: "display:flex;gap:6px;align-items:center" });
      ovr.appendChild(h("input", { type: "color", value: b.ov, style: "width:34px;height:26px;border:0;background:none", oninput: function (e) { b.ov = e.target.value; saveBg(b); } }));
      ovr.appendChild(h("input", { type: "range", min: "0", max: "90", value: String(Math.round(b.ova * 100)), "class": "ied-rng", oninput: function (e) { b.ova = e.target.value / 100; saveBg(b); }, onchange: function () { paint(true); } }));
      bs.appendChild(ovr);
    }
    bs.appendChild(h("div", { style: L }, ["Pattern"]));
    var pt = h("div", { style: "display:flex;gap:4px" });
    [["none", "None"], ["grid", "Grid"], ["dots", "Dots"]].forEach(function (q) { pt.appendChild(h("button", { style: BTN + ";flex:1" + (b.pattern === q[0] ? ON : ""), onclick: function () { b.pattern = q[0]; saveBg(b); paint(true); } }, [q[1]])); });
    bs.appendChild(pt);
    bs.appendChild(h("div", { style: "font-size:10px;color:#71717a;margin-top:6px" }, ["Shows on the canvas and in Play as user."]));
    box.appendChild(bs);
    box.appendChild(h("div", { style: "border-top:1px solid #27272a;margin-top:10px;padding-top:6px;font:500 10px system-ui;color:#71717a;text-transform:uppercase" }, ["Quick colors"]));
    slot.appendChild(box);
  }

  /* ---------- Content tab: advanced inspector ---------- */
  var lastContent = "";
  function seg(label, opts, cb) {
    var w = h("div", {}); w.appendChild(h("div", { style: L }, [label]));
    var r = h("div", { style: "display:flex;flex-wrap:wrap;gap:4px" });
    opts.forEach(function (o) { r.appendChild(h("button", { style: BTN + ";flex:1", onclick: function () { cb(o[1]); } }, [o[0]])); });
    w.appendChild(r); return w;
  }
  function range(label, min, max, step, unit, prop) {
    var w = h("div", {}), lb = h("div", { style: L }, [label]); w.appendChild(lb);
    w.appendChild(h("input", { type: "range", min: String(min), max: String(max), step: String(step), "class": "ied-rng", oninput: function (e) { lb.textContent = label + " " + e.target.value + unit; var p = {}; p[prop] = e.target.value + unit; styleEl(p); } }));
    return w;
  }
  function details(title, open, kids) {
    var d = h("details", { style: "border-top:1px solid #27272a;padding:6px 0" }); if (open) d.open = true;
    d.appendChild(h("summary", { style: "cursor:pointer;font:600 11px system-ui;color:#c4b5fd" }, [title]));
    kids.forEach(function (k) { d.appendChild(k); }); return d;
  }
  function content(force) {
    var slot = document.getElementById("ie-content-pro");
    if (!slot) { lastContent = ""; return; }
    var on = hasEl(), sig = String(on);
    if (!force && sig === lastContent && (slot.childNodes.length || !on)) return;
    lastContent = sig; slot.innerHTML = "";
    if (!on) return;
    var box = h("div", { style: "color:#e4e4e7;font:12px system-ui;margin-top:8px" });
    box.appendChild(details("Quick styles", true, [(function () {
      var g = h("div", { style: "display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:6px" });
      [["Display", { fontSize: "56px", fontWeight: "800", lineHeight: "1.05", letterSpacing: "-0.03em" }], ["Headline", { fontSize: "36px", fontWeight: "700", lineHeight: "1.15", letterSpacing: "-0.02em" }], ["Subhead", { fontSize: "22px", fontWeight: "600", lineHeight: "1.3" }],
       ["Body", { fontSize: "16px", fontWeight: "400", lineHeight: "1.6", letterSpacing: "0" }], ["Caption", { fontSize: "12px", fontWeight: "500", letterSpacing: "0.04em", textTransform: "uppercase" }], ["Pill badge", { padding: "6px 12px", borderRadius: "999px", fontSize: "11px", backgroundColor: "#27272a", borderWidth: "1px", borderStyle: "solid", borderColor: "#3f3f46" }],
       ["Primary", { padding: "12px 20px", borderRadius: "14px", backgroundColor: "#7c3aed", color: "#ffffff", fontWeight: "600", backgroundImage: "none" }], ["Ghost", { padding: "12px 20px", borderRadius: "14px", backgroundColor: "transparent", color: "#fafafa", borderWidth: "1px", borderStyle: "solid", borderColor: "#3f3f46", backgroundImage: "none" }], ["Glass card", { padding: "24px", borderRadius: "20px", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: "1px", borderStyle: "solid", borderColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)" }]
      ].forEach(function (q) { g.appendChild(h("button", { style: BTN + ";font-size:10px", onclick: function () { styleEl(q[1]); } }, [q[0]])); });
      g.appendChild(h("button", { style: BTN + ";font-size:10px;grid-column:span 3;color:#fca5a5", onclick: function () { styleEl({ fontSize: "", fontWeight: "", lineHeight: "", letterSpacing: "", textTransform: "", fontStyle: "", textDecoration: "", padding: "", borderRadius: "", boxShadow: "", opacity: "", backgroundImage: "", backdropFilter: "", filter: "" }); } }, ["Reset element style"]));
      return g;
    })()]));
    box.appendChild(details("Typography", false, [
      range("Line height", 0.9, 2.4, 0.05, "", "lineHeight"),
      range("Letter spacing", -0.08, 0.3, 0.01, "em", "letterSpacing"),
      seg("Case", [["Aa", "none"], ["AA", "uppercase"], ["aa", "lowercase"], ["Title", "capitalize"]], function (v) { styleEl({ textTransform: v }); }),
      seg("Style", [["Italic", "i"], ["Underline", "u"], ["Strike", "s"], ["Plain", "n"]], function (v) { styleEl(v === "i" ? { fontStyle: "italic" } : v === "u" ? { textDecoration: "underline" } : v === "s" ? { textDecoration: "line-through" } : { fontStyle: "normal", textDecoration: "none" }); }),
      seg("Justify", [["Justify", "justify"]], function (v) { styleEl({ textAlign: v }); }),
    ]));
    var bc = h("input", { type: "color", value: "#3f3f46", style: "width:100%;height:26px;border:0;background:none", oninput: function (e) { styleEl({ borderColor: e.target.value, borderStyle: "solid" }); } });
    box.appendChild(details("Shape & border", false, [
      seg("Corners", [["0", "0px"], ["6", "6px"], ["12", "12px"], ["20", "20px"], ["32", "32px"], ["Pill", "999px"]], function (v) { styleEl({ borderRadius: v }); }),
      range("Radius", 0, 64, 1, "px", "borderRadius"),
      range("Border width", 0, 8, 1, "px", "borderWidth"),
      seg("Border style", [["Solid", "solid"], ["Dashed", "dashed"], ["Dotted", "dotted"], ["None", "none"]], function (v) { styleEl({ borderStyle: v }); }),
      h("div", { style: L }, ["Border color"]), bc,
    ]));
    box.appendChild(details("Spacing", false, [range("Padding", 0, 80, 2, "px", "padding"), range("Margin top", 0, 120, 2, "px", "marginTop"), range("Margin bottom", 0, 120, 2, "px", "marginBottom")]));
    box.appendChild(details("Effects", false, [
      seg("Shadow", [["None", "none"], ["Subtle", "0 1px 3px rgba(0,0,0,.35)"], ["Card", "0 8px 30px rgba(0,0,0,.45)"], ["Deep", "0 24px 60px rgba(0,0,0,.6)"], ["Violet", "0 0 32px rgba(139,92,246,.55)"], ["Cyan", "0 0 28px rgba(34,211,238,.55)"]], function (v) { styleEl({ boxShadow: v }); }),
      range("Opacity", 0, 1, 0.05, "", "opacity"),
      range("Rotate", -45, 45, 1, "deg", "rotate"),
    ]));
    box.appendChild(details("Image & media", false, [
      seg("Fit", [["Cover", "cover"], ["Contain", "contain"], ["Fill", "fill"]], function (v) { styleEl({ objectFit: v }); }),
      (function () {
        var f = { b: 100, c: 100, g: 0, bl: 0 }, w = h("div", {});
        var upd = function () { styleEl({ filter: "brightness(" + f.b + "%) contrast(" + f.c + "%) grayscale(" + f.g + "%) blur(" + f.bl + "px)" }); };
        [["Brightness", "b", 0, 200], ["Contrast", "c", 0, 200], ["Grayscale", "g", 0, 100], ["Blur", "bl", 0, 20]].forEach(function (q) {
          w.appendChild(h("div", { style: L }, [q[0]]));
          w.appendChild(h("input", { type: "range", min: String(q[2]), max: String(q[3]), value: String(f[q[1]]), "class": "ied-rng", oninput: function (e) { f[q[1]] = e.target.value; upd(); } }));
        });
        return w;
      })(),
    ]));
    slot.appendChild(box);
  }

  function tick() { paint(false); content(false); }
  function start() {
    applyBg();
    new MutationObserver(function () { clearTimeout(start.t); start.t = setTimeout(tick, 60); }).observe(document.getElementById("root") || document.body, { childList: true, subtree: true });
    document.addEventListener("click", function () { setTimeout(tick, 120); }, true);
    tick();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
