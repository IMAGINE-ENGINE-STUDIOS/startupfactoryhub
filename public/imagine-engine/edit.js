/* Imagine Engine: element editing for widgets rendered as DOM (component widgets + embedded widgets).
   - Double-click text to edit inline.
   - Click any element to select it; the Content tab edits its font, size, weight, color, alignment, button colors.
   - Drag a selected element to move it; drop it on another widget to move it there.
   All edits persist per widget in localStorage and are re-applied after re-renders. */
(function () {
  // nearest ancestor window that hosts the editor panel (app.html), even when app.html is itself inside the site page
  var TOP = (function () {
    var w = window, best = window;
    try { while (w.parent && w.parent !== w) { w = w.parent; if (w.document && w.document.getElementById("ie-el-panel") || /imagine-engine\/app\.html/.test(w.location.pathname)) { best = w; break; } } } catch (e) {}
    return best;
  })();
  function pathOf(el, root) {
    var p = [];
    while (el && el !== root) {
      if (el.hasAttribute && el.hasAttribute("data-ie-added")) { p.unshift("a" + el.getAttribute("data-ie-added")); return p.join("."); }
      var par = el.parentElement;
      if (!par) return null;
      p.unshift(Array.prototype.indexOf.call(par.children, el));
      el = par;
    }
    return el === root ? p.join(".") : null;
  }
  function byPath(root, p) {
    var parts = p.split("."), el = root, i = 0;
    if (parts[0].charAt(0) === "a") { el = root.querySelector('[data-ie-added="' + parts[0].slice(1) + '"]'); i = 1; }
    for (; i < parts.length; i++) { if (!el) return null; el = el.children[+parts[i]]; }
    return el || null;
  }
  function isLeaf(el) {
    return el && el.children && el.children.length === 0 && (el.textContent || "").trim().length > 0 &&
      !/^(INPUT|TEXTAREA|SELECT|svg|path)$/i.test(el.tagName);
  }
  function pickTarget(t, root) {
    // prefer buttons/links/images, then leaf text, else the clicked element
    if (t.closest && t.closest("[data-ie-map]")) return null;
    if (isLeaf(t) && !/^(BUTTON|A)$/.test(t.tagName)) { var bb = t.closest("button,a,[role=button]"); if (!bb || (bb.textContent || "").trim() !== (t.textContent || "").trim()) return t; }
    var b = t.closest && t.closest("button,a,img,[role=button]");
    if (b && root.contains(b) && b !== root) return b;
    if (t.tagName && /^(svg|path|g|circle|rect|line|polyline|polygon)$/i.test(t.tagName)) { var s = t.closest("svg"); if (s && s.parentElement && root.contains(s.parentElement)) return s.parentElement; }
    return t !== root ? t : null;
  }
  function setAttr(el, c, v) {
    if (c === "@src") {
      if (/^(IMG|VIDEO|SOURCE)$/.test(el.tagName)) { if (el.getAttribute("src") !== v) { el.setAttribute("src", v); if (el.tagName === "IMG") el.removeAttribute("srcset"); } }
      else if (/\.(mp4|webm|mov)(\?|$)/i.test(v)) { var vd = el.querySelector("video[data-ie-media]"); if (!vd) { vd = document.createElement("video"); vd.setAttribute("data-ie-media", "1"); vd.autoplay = vd.muted = vd.loop = true; vd.playsInline = true; vd.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;pointer-events:none"; if (!el.style.position) el.style.position = "relative"; el.prepend(vd); } if (vd.getAttribute("src") !== v) vd.src = v; }
      else { var bg = 'url("' + v + '")'; if (el.style.backgroundImage !== bg) { el.style.backgroundImage = bg; el.style.backgroundSize = "cover"; el.style.backgroundPosition = "center"; } }
    } else if (c === "@href") { if (v) el.setAttribute("data-ie-href", v); else el.removeAttribute("data-ie-href"); }
    else if (c === "@target") { if (v) el.setAttribute("data-ie-target", v); else el.removeAttribute("data-ie-target"); }
    else if (c === "@product") { if (v) el.setAttribute("data-ie-product", v); else el.removeAttribute("data-ie-product"); }
  }
  var TXT = { color: "color", fontSize: "font-size", fontFamily: "font-family", fontWeight: "font-weight", textAlign: "text-align", lineHeight: "line-height", letterSpacing: "letter-spacing" };
  var IMP = { backgroundColor: "background-color", backgroundImage: "background-image", borderColor: "border-color", borderRadius: "border-radius", padding: "padding" };
  function applyProp(el, c, v) {
    var css = TXT[c] || IMP[c];
    if (!css) { if (el.style[c] !== v) el.style[c] = v; return; }
    var set = function (e) { if (v === "" || v == null) e.style.removeProperty(css); else if (e.style.getPropertyValue(css) !== v || e.style.getPropertyPriority(css) !== "important") e.style.setProperty(css, v, "important"); };
    set(el);
    if (TXT[c] && c !== "textAlign") { var k = el.querySelectorAll("*"); for (var i = 0; i < k.length; i++) { if (!/^(svg|path|g|circle|rect|line|polyline|polygon|img|video|input|textarea|select)$/i.test(k[i].tagName) && !k[i].closest("[data-ie-map]")) set(k[i]); } }
  }
  function J(k, d) { try { return JSON.parse(localStorage.getItem(k) || d); } catch (e) { return JSON.parse(d); } }
  function S(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  window.__IEEdit = function (root, key) {
    if (!root || root.__ieEdit === key) return;
    root.__ieEdit = key;
    root.setAttribute("data-ie-root", key);
    var KT = "ie-txt:" + key, KS = "ie-sty:" + key, KA = "ie-add:" + key;
    var applying = false;
    var apply = function () {
      if (applying) return; applying = true;
      try {
        var adds = J(KA, "[]");
        adds.forEach(function (a, i) {
          if (!a || root.querySelector('[data-ie-added="' + i + '"]')) return;
          var w = document.createElement("div"); w.innerHTML = a.html; var el = w.firstElementChild; if (!el) return;
          el.setAttribute("data-ie-added", i); el.style.cssText = a.css || ""; el.style.position = "relative";
          root.appendChild(el);
        });
        var m = J(KT, "{}"), orig = root.__ieOrigT || (root.__ieOrigT = {});
        for (var p in m) { var el = byPath(root, p); if (el && el.children.length === 0 && el.textContent !== m[p] && document.activeElement !== el) { if (!(p in orig)) orig[p] = el.textContent; el.textContent = m[p]; } }
        var st = J(KS, "{}"), seen = root.__ieSeenS || (root.__ieSeenS = {});
        for (var q in st) { var e2 = byPath(root, q); if (!e2) continue; var o = st[q]; seen[q] = Object.assign(seen[q] || {}, o); for (var c in o) { if (c.charAt(0) === "@") setAttr(e2, c, o[c]); else applyProp(e2, c, o[c]); } }
      } finally { applying = false; }
    };
    // Full re-render from storage (used by undo/redo): clears old edits, then re-applies the saved ones.
    root.__ieReload = function () {
      var seen = root.__ieSeenS || {};
      for (var q in seen) { var e = byPath(root, q); if (!e) continue; for (var c in seen[q]) if (c.charAt(0) !== "@") applyProp(e, c, ""); }
      root.__ieSeenS = {};
      var orig = root.__ieOrigT || {}, m = J(KT, "{}");
      for (var p in orig) { if (p in m) continue; var el = byPath(root, p); if (el && el.children.length === 0) el.textContent = orig[p]; }
      root.querySelectorAll("[data-ie-added]").forEach(function (n) { n.remove(); });
      apply();
    };
    try { (TOP.__IERoots = TOP.__IERoots || []).push(root); } catch (e) {}
    root.__ieApi = {
      key: key, win: window,
      setStyle: function (el, patch) {
        var p = pathOf(el, root); if (p == null) return;
        for (var c in patch) { if (c.charAt(0) === "@") setAttr(el, c, patch[c]); else applyProp(el, c, patch[c]); }
        if (p.charAt(0) === "a") { var adds = J(KA, "[]"), i = +p.split(".")[0].slice(1); if (adds[i] && p.indexOf(".") < 0) { adds[i].css = el.style.cssText; S(KA, adds); return; } }
        var st = J(KS, "{}"); st[p] = Object.assign(st[p] || {}, patch); S(KS, st);
      },
      setText: function (el, txt) {
        if (el.children.length) return;
        el.textContent = txt;
        var p = pathOf(el, root); if (p == null) return;
        var m = J(KT, "{}"); m[p] = txt; S(KT, m);
      },
      addClone: function (srcEl, x, y) {
        var adds = J(KA, "[]");
        var c = srcEl.cloneNode(true); c.style.transform = ""; c.style.display = ""; c.removeAttribute("data-ie-added"); c.style.outline = "";
        var css = c.style.cssText + ";transform:translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
        adds.push({ html: c.outerHTML, css: css }); S(KA, adds); apply();
      },
      reset: function () { localStorage.removeItem(KT); localStorage.removeItem(KS); localStorage.removeItem(KA); }
    };
    if (TOP !== window && !document.__ieClick) { document.__ieClick = 1; document.addEventListener("click", function (e) { if (TOP.__IEClickHandler) TOP.__IEClickHandler(e, document); }, true); }
    var playing = function () { try { return !!(TOP.__IE && TOP.__IE.playing); } catch (x) { return false; } };
    root.addEventListener("dblclick", function (e) {
      if (playing()) return;
      var el = e.target;
      if (!isLeaf(el)) return;
      e.preventDefault(); e.stopPropagation();
      el.contentEditable = "true"; el.focus();
      try { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); } catch (err) {}
      var done = function () {
        el.contentEditable = "false"; el.removeEventListener("blur", done);
        root.__ieApi.setText(el, el.textContent);
        if (TOP.__IEElRefresh) TOP.__IEElRefresh();
      };
      el.addEventListener("blur", done);
      el.addEventListener("keydown", function (ev) { if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); el.blur(); } });
    }, true);

    // click select + drag move
    root.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || playing()) return;
      var t = e.target; if (t.isContentEditable) return;
      if (t.closest && t.closest('[title="drag handle top left"]')) return;
      var el = pickTarget(t, root); if (!el) return;
      if (TOP.__IEElSelect) TOP.__IEElSelect({ el: el, root: root, api: root.__ieApi, win: window });
      var sx = e.clientX, sy = e.clientY, moved = false;
      var base = (el.style.transform || "").match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
      var bx = base ? +base[1] : 0, by = base ? +base[2] : 0;
      // magnetic alignment: sibling edges/centers and the element's own auto (un-moved) slot
      var r0 = el.getBoundingClientRect(), hx = [], hy = [], gx = null, gy = null;
      hx.push(r0.left - bx); hy.push(r0.top - by); // auto position
      Array.prototype.forEach.call(el.parentElement ? el.parentElement.children : [], function (s) {
        if (s === el || !s.getBoundingClientRect) return; var r = s.getBoundingClientRect(); if (!r.width) return;
        hx.push(r.left, r.left + r.width / 2 - r0.width / 2, r.right - r0.width); hy.push(r.top, r.top + r.height / 2 - r0.height / 2, r.bottom + 8);
      });
      var guide = function (vert, pos) { var g = document.createElement("div"); g.style.cssText = "position:fixed;z-index:99999;pointer-events:none;background:#8b5cf6;opacity:.8;" + (vert ? "top:0;bottom:0;width:1px;left:" + pos + "px" : "left:0;right:0;height:1px;top:" + pos + "px"); document.body.appendChild(g); return g; };
      var clearG = function () { if (gx) gx.remove(); if (gy) gy.remove(); gx = gy = null; };
      var mv = function (ev) {
        var dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!moved && Math.abs(dx) + Math.abs(dy) < 5) return;
        if (!moved) { moved = true; if (el.style.position === "" ) el.style.position = "relative"; el.style.zIndex = "30"; el.style.pointerEvents = "none"; }
        ev.preventDefault();
        var L = r0.left + dx, T = r0.top + dy, snapped = false; clearG();
        for (var i = 0; i < hx.length; i++) if (Math.abs(hx[i] - L) < 8) { dx += hx[i] - L; gx = guide(true, hx[i]); snapped = true; break; }
        for (var j = 0; j < hy.length; j++) if (Math.abs(hy[j] - T) < 8) { dy += hy[j] - T; gy = guide(false, hy[j]); snapped = true; break; }
        el.style.opacity = snapped ? "0.5" : "";
        el.style.transform = "translate(" + (bx + dx) + "px," + (by + dy) + "px)";
      };
      var up = function (ev) {
        window.removeEventListener("pointermove", mv, true); window.removeEventListener("pointerup", up, true);
        clearG(); el.style.opacity = "";
        if (!moved) return;
        el.style.pointerEvents = ""; el.style.zIndex = "";
        if (/translate\(0px,\s*0px\)/.test(el.style.transform)) el.style.transform = "";
        var dropped = TOP.__IEElDrop && TOP.__IEElDrop(el, root, window, ev.clientX, ev.clientY);
        if (dropped) { el.style.transform = base ? base[0] : ""; root.__ieApi.setStyle(el, { display: "none" }); }
        else root.__ieApi.setStyle(el, { transform: el.style.transform, position: el.style.position || "relative", zIndex: "1" });
        var stop = function (ce) { ce.stopPropagation(); ce.preventDefault(); window.removeEventListener("click", stop, true); };
        window.addEventListener("click", stop, true); setTimeout(function () { window.removeEventListener("click", stop, true); }, 50);
      };
      window.addEventListener("pointermove", mv, true); window.addEventListener("pointerup", up, true);
    }, true);
    // prevent native HTML drag of images/links fighting our drag
    root.addEventListener("dragstart", function (e) { if (!(e.target.closest && e.target.closest('[title="drag handle top left"]'))) e.preventDefault(); }, true);

    var t;
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(apply, 80); })
      .observe(root, { subtree: true, childList: true, characterData: true });
    setTimeout(apply, 50); setTimeout(apply, 600);
  };

  if (TOP !== window) return; // panel + drop logic live only in the top window

  var sel = null;
  window.__IEElActive = function () { return !!(sel && sel.el && sel.el.isConnected); };
  window.__IEElStyle = function (o) { if (sel && sel.el) { sel.api.setStyle(sel.el, o); render(true); } };
  window.__IEElSelect = function (s) {
    if (sel && sel.el && sel.el !== s.el) sel.el.style.outline = sel.prevOutline || "";
    if (!sel || sel.el !== s.el) { s.prevOutline = s.el.style.outline; s.el.style.outline = "2px dashed #8b5cf6"; s.el.style.outlineOffset = "2px"; }
    else s.prevOutline = sel.prevOutline;
    sel = s; render();
  };
  window.__IEElClear = function () { if (sel && sel.el) sel.el.style.outline = sel.prevOutline || ""; sel = null; render(); };
  // a click on a regular canvas element (outside DOM widgets) switches the panel back to that element
  document.addEventListener("pointerdown", function (e) {
    var t = e.target; if (!t.closest) return;
    if (t.closest("[data-ie-root]") || t.closest("#ie-el-panel") || t.closest("iframe")) return;
    if (t.closest("[data-id]")) { if (sel) window.__IEElClear(); else setTimeout(render, 30); }
  }, true);

  function findRootAt(x, y) {
    var el = document.elementFromPoint(x, y);
    if (!el) return null;
    if (el.tagName === "IFRAME") {
      try { var r = el.getBoundingClientRect(), d = el.contentDocument, inner = d.elementFromPoint(x - r.left, y - r.top);
        var rt = inner && inner.closest && inner.closest("[data-ie-root]"); if (rt) return { root: rt, x: x - r.left, y: y - r.top }; } catch (e) {}
      return null;
    }
    var rr = el.closest("[data-ie-root]"); return rr ? { root: rr, x: x, y: y } : null;
  }
  window.__IEElDrop = function (el, srcRoot, srcWin, cx, cy) {
    var x = cx, y = cy;
    if (srcWin !== window) { var fr = srcWin.frameElement; if (!fr) return false; var r = fr.getBoundingClientRect(); x += r.left; y += r.top; }
    var hit = findRootAt(x, y);
    if (!hit || hit.root === srcRoot || !hit.root.__ieApi) return false;
    var rb = hit.root.getBoundingClientRect();
    hit.root.__ieApi.addClone(el, 0, 0);
    // place the clone where it was dropped
    var adds = hit.root.querySelectorAll("[data-ie-added]"), c = adds[adds.length - 1];
    if (c) { var cb = c.getBoundingClientRect(); hit.root.__ieApi.setStyle(c, { transform: "translate(" + Math.round(hit.x - cb.left - cb.width / 2) + "px," + Math.round(hit.y - cb.top - cb.height / 2) + "px)" }); }
    void rb;
    return true;
  };

  // ---------- Content tab panel ----------
  var FONTS = ["Inherit", "Inter", "Space Grotesk", "Plus Jakarta Sans", "Outfit", "Playfair Display", "Cinzel", "JetBrains Mono", "Georgia", "Arial"];
  var SWATCH = ["#ffffff", "#fafafa", "#a1a1aa", "#18181b", "#000000", "#8b5cf6", "#ec4899", "#14b8a6", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6"];
  function target() {
    if (sel && sel.el && sel.el.isConnected) return { kind: "dom", el: sel.el, api: sel.api, win: sel.win };
    var ie = window.__IE; var b = ie && ie.cur && ie.cur();
    if (b) return { kind: "native", node: b };
    return null;
  }
  function cs(tg) {
    if (tg.kind === "dom") { var c = tg.win.getComputedStyle(tg.el); return { fontFamily: c.fontFamily, fontSize: c.fontSize, fontWeight: c.fontWeight, color: c.color, backgroundColor: c.backgroundColor, textAlign: c.textAlign, borderRadius: c.borderRadius, text: tg.el.children.length ? null : tg.el.textContent, tag: tg.el.tagName.toLowerCase() }; }
    var s = tg.node.style || {}; return { fontFamily: s.fontFamily || "", fontSize: s.fontSize || "", fontWeight: s.fontWeight || "", color: s.color || "", backgroundColor: s.backgroundColor || "", textAlign: s.textAlign || "", borderRadius: s.borderRadius || "", text: tg.node.type === "section" ? null : (tg.node.content || ""), tag: tg.node.type };
  }
  function setStyle(patch) {
    var tg = target(); if (!tg) return;
    if (tg.kind === "dom") tg.api.setStyle(tg.el, patch);
    else if (window.__IE && window.__IE.style) window.__IE.style(patch);
  }
  window.__IEElSetStyle = function (p) { setStyle(p); if (typeof render === "function") render(true); };
  window.__IEElHasTarget = function () { return !!target(); };
  function setText(v) {
    var tg = target(); if (!tg) return;
    if (tg.kind === "dom") tg.api.setText(tg.el, v); else if (window.__IE && window.__IE.text) window.__IE.text(v);
  }
  function getAttr(name) {
    var tg = target(); if (!tg) return "";
    if (tg.kind === "native") return (tg.node.style || {})[name] || "";
    var m = { "@href": "data-ie-href", "@target": "data-ie-target", "@product": "data-ie-product" }[name];
    if (m) return tg.el.getAttribute(m) || "";
    if (name === "@src") return tg.el.getAttribute("src") || "";
    return "";
  }
  function toHex(c) {
    if (!c) return "#ffffff"; if (c.charAt(0) === "#") return c.length === 4 ? "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : c.slice(0, 7);
    var m = c.match(/\d+/g); if (!m) return "#ffffff";
    return "#" + m.slice(0, 3).map(function (n) { return (+n).toString(16).padStart(2, "0"); }).join("");
  }
  var lastSig = "";
  function h(tag, attrs, kids) {
    var e = document.createElement(tag); for (var k in attrs || {}) { if (k === "style") e.style.cssText = attrs[k]; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return e;
  }
  var L = "font:500 10px system-ui;text-transform:uppercase;letter-spacing:.04em;color:#71717a;margin:10px 0 4px";
  var BTN = "height:28px;border-radius:10px;background:#27272a;color:#e4e4e7;font:11px system-ui;border:1px solid #3f3f46;cursor:pointer;padding:0 8px";
  var INP = "width:100%;height:30px;border-radius:10px;background:#09090b;border:1px solid #27272a;color:#e4e4e7;font:12px system-ui;padding:0 8px;box-sizing:border-box";
  function colorRow(label, prop, val) {
    var row = h("div", { style: "display:flex;flex-wrap:wrap;gap:4px;align-items:center" });
    SWATCH.forEach(function (c) { row.appendChild(h("button", { title: c, style: "width:20px;height:20px;border-radius:6px;border:1px solid #3f3f46;cursor:pointer;background:" + c, onclick: function () { var p = {}; p[prop] = c; if (prop === "backgroundColor") p.backgroundImage = "none"; setStyle(p); render(true); } })); });
    row.appendChild(h("input", { type: "color", value: toHex(val), style: "width:28px;height:22px;border:0;background:none;cursor:pointer", oninput: function (e) { var p = {}; p[prop] = e.target.value; if (prop === "backgroundColor") p.backgroundImage = "none"; setStyle(p); } }));
    return [h("div", { style: L }, [label]), row];
  }

  // ---------- 3D scene / game control deck ----------
  var sel3d = null;
  var DECK = [
    ["Camera", [["fov", "Field of view", 30, 120, 1, 65], ["camDist", "Camera distance", .4, 3, .05, 1]]],
    ["Lighting", [["sun", "Sun strength", 0, 3, .05, 1], ["sunAngle", "Sun angle", 0, 180, 1, 60], ["ambient", "Ambient light", 0, 3, .05, 1], ["exposure", "Exposure", .2, 3, .05, 1]]],
    ["Atmosphere", [["fog", "Fog density", 0, 1, .01, .3]]],
    ["Materials", [["roughness", "Roughness", 0, 1, .01, .4], ["metalness", "Metalness", 0, 1, .01, .3]]],
  ];
  var GAME = ["Gameplay", [["gameSpeed", "Game speed", .3, 3, .05, 1], ["steering", "Steering", .3, 3, .05, 1], ["traffic", "Traffic / spawn rate", 0, 4, .05, 1]]];
  function send3d(patch) { if (!sel3d) return; Object.assign(sel3d.cfg, patch); try { sel3d.win.postMessage({ __IE3D: "set", cfg: patch }, "*"); } catch (e) {} }
  function deck3D() {
    var box = h("div", { style: "border-top:1px solid #27272a;padding-top:8px;color:#e4e4e7;font:12px system-ui" });
    box.appendChild(h("div", { style: "display:flex;justify-content:space-between;align-items:center" }, [h("div", { style: "font:600 11px system-ui;color:#c4b5fd" }, [(sel3d.studio ? "Studio 3D Active" : sel3d.game ? "3D game" : "3D scene") + " • live settings" + (sel3d.studio && sel3d.nanite ? " • Nanite LOD on " + sel3d.nanite + " meshes" : "")]), h("button", { style: BTN, onclick: function () { sel3d = null; render(true); } }, ["Close"])]));
    (sel3d.game ? DECK.concat([GAME]) : DECK).forEach(function (grp) {
      box.appendChild(h("div", { style: L }, [grp[0]]));
      grp[1].forEach(function (f) {
        var v = sel3d.cfg[f[0]] != null ? sel3d.cfg[f[0]] : f[5];
        var out = h("span", { style: "color:#a1a1aa;font-size:11px" }, [String(v)]);
        var r = h("input", { type: "range", min: String(f[2]), max: String(f[3]), step: String(f[4]), value: String(v), style: "width:100%;accent-color:#8b5cf6", oninput: function (e) { out.textContent = e.target.value; var p = {}; p[f[0]] = +e.target.value; send3d(p); } });
        box.appendChild(h("div", { style: "display:flex;justify-content:space-between;font-size:11px;margin-top:4px" }, [f[1], out])); box.appendChild(r);
      });
    });
    box.appendChild(h("div", { style: L }, ["Sky / background"]));
    var sky = h("div", { style: "display:flex;gap:4px;flex-wrap:wrap" });
    ["#05060a", "#0b1020", "#1e1b4b", "#7dd3fc", "#fde68a", "#f97316", "#ffffff"].forEach(function (c) { sky.appendChild(h("button", { title: c, style: "width:22px;height:22px;border-radius:6px;border:1px solid #3f3f46;cursor:pointer;background:" + c, onclick: function () { send3d({ bg: c }); } })); });
    sky.appendChild(h("input", { type: "color", value: sel3d.cfg.bg || "#05060a", style: "width:28px;height:22px;border:0;background:none", oninput: function (e) { send3d({ bg: e.target.value }); } }));
    box.appendChild(sky);
    var wf = h("label", { style: "display:flex;gap:6px;align-items:center;margin-top:10px;font-size:11px" }, [h("input", { type: "checkbox", onchange: function (e) { send3d({ wireframe: e.target.checked }); } }), "Wireframe view"]);
    if (sel3d.cfg.wireframe) wf.firstChild.checked = true; box.appendChild(wf);
    box.appendChild(h("button", { style: BTN + ";margin-top:10px;width:100%", onclick: function () { try { sel3d.win.postMessage({ __IE3D: "reset" }, "*"); } catch (e) {} sel3d.cfg = {}; render(true); } }, ["Reset to defaults"]));
    box.appendChild(h("div", { style: "font-size:10px;color:#71717a;margin-top:6px" }, ["Changes apply instantly and are saved with this block. Flow steps set3D / spawn3D / move3D control it too."]));
    return box;
  }
  addEventListener("message", function (e) {
    var d = e.data; if (!d || d.__IE3D !== "pick" || !e.source) return;
    sel3d = { win: e.source, key: d.key, cfg: d.cfg || {}, game: !!d.game, studio: !!d.studio, nanite: d.nanite || 0 };
    if (window.__IEElClear && sel) { sel.el.style.outline = sel.prevOutline || ""; sel = null; }
    lastSig = ""; render(true);
  });
  document.addEventListener("pointerdown", function (e) { var t = e.target; if (sel3d && t.closest && t.closest("[data-id]") && !t.closest("#ie-el-panel")) { sel3d = null; setTimeout(function () { render(true); }, 30); } }, true);
  function render(force) {
    var slot = document.getElementById("ie-el-panel"); if (!slot) return;
    if (sel3d && !(sel3d.win && sel3d.win.closed === false)) sel3d = null;
    var tg = target();
    var sig = sel3d ? "3d" + sel3d.key : tg ? (tg.kind === "dom" ? "d" + (tg.el.__ieid || (tg.el.__ieid = Math.random())) : "n" + tg.node.id) : "none";
    if (!force && sig === lastSig && slot.childNodes.length) return; lastSig = sig;
    slot.innerHTML = "";
    if (sel3d) { slot.appendChild(deck3D()); return; }
    if (!tg) return;
    var c = cs(tg), isBtn = /^(button|a)$/.test(c.tag) || (tg.kind === "dom" && tg.el.getAttribute("role") === "button");
    var box = h("div", { style: "border-top:1px solid #27272a;padding-top:8px;color:#e4e4e7;font:12px system-ui" });
    box.appendChild(h("div", { style: "font:600 11px system-ui;color:#c4b5fd" }, [(tg.kind === "dom" ? "Widget element" : "Element") + " • " + c.tag + (isBtn ? " (button)" : "")]));
    if (tg.kind === "native" && tg.node && tg.node.id) {
      var nid = tg.node.id;
      box.appendChild(h("button", { type: "button", style: "margin-top:6px;width:100%;padding:7px;border-radius:9px;border:1px solid #3f3f46;background:transparent;color:#e4e4e7;cursor:pointer;font:12px system-ui", onclick: function () {
        try { window.__IEDevSync && window.__IEDevSync.now(); window.__IEX && window.__IEX.setMode && window.__IEX.setMode({ mode: "dev" }); } catch (e) {}
        setTimeout(function () { var f = ((window.__IE && window.__IE.raw && window.__IE.raw.files) || []).filter(function (x) { return x.name === "App.tsx"; })[0]; if (!f) return;
          var ln = String(f.content || "").split("\n").findIndex(function (l) { return l.indexOf('"id": ' + JSON.stringify(nid)) > -1; });
          window.__IEJump && window.__IEJump("App.tsx", ln + 1); }, 150);
      } }, ["View in Dev"]));
    }
    if (c.text != null) {
      box.appendChild(h("div", { style: L }, [isBtn ? "Button text" : "Text"]));
      var ta = h("textarea", { style: INP + ";height:56px;padding:6px 8px;resize:vertical" }); ta.value = c.text;
      ta.addEventListener("input", function () { setText(ta.value); }); box.appendChild(ta);
    }
    box.appendChild(h("div", { style: L }, ["Font"]));
    var fs = h("select", { style: INP, onchange: function (e) { setStyle({ fontFamily: e.target.value === "Inherit" ? "" : "'" + e.target.value + "', system-ui, sans-serif" }); } });
    FONTS.forEach(function (f) { var o = h("option", { value: f }, [f]); if (c.fontFamily && c.fontFamily.indexOf(f) > -1) o.selected = true; fs.appendChild(o); }); box.appendChild(fs);
    box.appendChild(h("div", { style: L }, ["Font size"]));
    var sz = parseInt(c.fontSize) || 16;
    var szRow = h("div", { style: "display:flex;gap:4px;align-items:center" });
    var szIn = h("input", { type: "number", min: "6", max: "160", value: String(sz), style: INP + ";width:70px", oninput: function (e) { if (e.target.value) setStyle({ fontSize: e.target.value + "px" }); } });
    szRow.appendChild(h("button", { style: BTN, onclick: function () { szIn.value = Math.max(6, +szIn.value - 2); setStyle({ fontSize: szIn.value + "px" }); } }, ["-"]));
    szRow.appendChild(szIn);
    szRow.appendChild(h("button", { style: BTN, onclick: function () { szIn.value = +szIn.value + 2; setStyle({ fontSize: szIn.value + "px" }); } }, ["+"]));
    [12, 16, 24, 36, 56].forEach(function (n) { szRow.appendChild(h("button", { style: BTN + ";padding:0 6px", onclick: function () { szIn.value = n; setStyle({ fontSize: n + "px" }); } }, [String(n)])); });
    box.appendChild(szRow);
    box.appendChild(h("div", { style: L }, ["Weight"]));
    var wr = h("div", { style: "display:flex;gap:4px" });
    [["400", "Regular"], ["500", "Medium"], ["600", "Semi"], ["700", "Bold"], ["900", "Black"]].forEach(function (w) { wr.appendChild(h("button", { style: BTN + ";flex:1;padding:0 2px;" + (String(c.fontWeight) === w[0] ? "background:#e4e4e7;color:#18181b" : ""), onclick: function () { setStyle({ fontWeight: w[0] }); render(true); } }, [w[1]])); });
    box.appendChild(wr);
    box.appendChild(h("div", { style: L }, ["Align"]));
    var ar = h("div", { style: "display:flex;gap:4px" });
    ["left", "center", "right"].forEach(function (a) { ar.appendChild(h("button", { style: BTN + ";flex:1;" + (c.textAlign === a ? "background:#e4e4e7;color:#18181b" : ""), onclick: function () { setStyle({ textAlign: a }); render(true); } }, [a])); });
    box.appendChild(ar);
    colorRow("Font color", "color", c.color).forEach(function (n) { box.appendChild(n); });
    colorRow(isBtn ? "Button color" : "Background", "backgroundColor", c.backgroundColor).forEach(function (n) { box.appendChild(n); });
    if (isBtn) {
      box.appendChild(h("div", { style: L }, ["Button shape"]));
      var br = h("div", { style: "display:flex;gap:4px" });
      [["9999px", "Pill"], ["12px", "Round"], ["6px", "Soft"], ["0px", "Sharp"]].forEach(function (r) { br.appendChild(h("button", { style: BTN + ";flex:1", onclick: function () { setStyle({ borderRadius: r[1] === "Pill" ? "9999px" : r[0] }); } }, [r[1]])); });
      box.appendChild(br);
      box.appendChild(h("div", { style: L }, ["Button size"]));
      var bs = h("div", { style: "display:flex;gap:4px" });
      [["6px 12px", "Small"], ["10px 20px", "Medium"], ["14px 28px", "Large"]].forEach(function (r) { bs.appendChild(h("button", { style: BTN + ";flex:1", onclick: function () { setStyle({ padding: r[0] }); } }, [r[1]])); });
      box.appendChild(bs);
    }
    if (tg.kind === "dom") {
      box.appendChild(h("div", { style: "font:10px system-ui;color:#71717a;margin-top:10px" }, ["Drag this element to move it. Drop it on another widget to move it there."]));
      box.appendChild(h("button", { style: BTN + ";width:100%;margin-top:6px", onclick: function () { setStyle({ transform: "", display: "" }); render(true); } }, ["Reset position"]));
    }
    extras(box, tg, c, isBtn);
    if (window.__IEMapPanel) try { window.__IEMapPanel(box, tg, function () { render(true); }); } catch (er) {}
    slot.appendChild(box);
  }
  // ---------- Link, media, product, payments, storage ----------
  function sec(box, title) { var d = h("div", { style: "border-top:1px solid #27272a;margin-top:12px;padding-top:8px" }, [h("div", { style: "font:600 11px system-ui;color:#c4b5fd" }, [title])]); box.appendChild(d); return d; }
  function note(d, t, color) { var n = h("div", { style: "font:11px system-ui;margin-top:6px;color:" + (color || "#a1a1aa") }, [t]); d.appendChild(n); return n; }
  function sectionIds() {
    var out = [], ie = window.__IE; try { (ie.sections || []).forEach(function (s) { out.push(s.id); }); } catch (e) {}
    if (!out.length) document.querySelectorAll('[data-id^="sec_"]').forEach(function (e) { var id = e.getAttribute("data-id"); if (out.indexOf(id) < 0) out.push(id); });
    return out;
  }
  function cartDesigner(d) {
    var C = window.__IECart; if (!C || !C.config) return;
    var det = h("details", { style: "margin-top:8px" }, [h("summary", { style: "cursor:pointer;font:600 11px system-ui;color:#e4e4e7" }, ["Customize cart (whole project)"])]);
    d.appendChild(det);
    var c = C.config();
    function fld(lbl, key, type, opts) {
      det.appendChild(h("div", { style: "font:10px system-ui;color:#a1a1aa;margin-top:8px" }, [lbl]));
      var el;
      if (opts) { el = h("select", { style: INP + ";margin-top:4px" }); opts.forEach(function (o) { var op = h("option", { value: o[0] }, [o[1]]); if (String(c[key]) === o[0]) op.selected = true; el.appendChild(op); }); }
      else if (type === "checkbox") { el = h("input", { type: "checkbox" }); el.checked = !!c[key]; }
      else { el = h("input", { type: type || "text", style: type === "color" ? "width:40px;height:28px;border:0;background:none;margin-top:4px" : INP + ";margin-top:4px" }); el.value = c[key]; }
      el.addEventListener("change", function () { var p = {}; p[key] = type === "checkbox" ? el.checked : type === "number" ? +el.value || 0 : el.value; C.setConfig(p); });
      det.appendChild(el);
    }
    fld("Cart title", "title"); fld("Note under title", "note"); fld("Empty cart message", "emptyMsg");
    fld("Currency symbol", "currency"); fld("Tax %", "taxPct", "number"); fld("Flat shipping", "shipping", "number");
    fld("Look", "theme", null, [["dark", "Dark"], ["light", "Light"], ["glass", "Glass"]]);
    fld("Accent color", "accent", "color");
    fld("Show floating cart button", "fab", "checkbox");
    fld("Button side", "fabPos", null, [["right", "Right"], ["left", "Left"]]);
    fld("Cart button text", "fabLabel"); fld("Checkout button text", "checkoutLabel");
    fld("Send checkout to my own page (optional, https://...)", "checkoutUrl");
    det.appendChild(h("button", { style: BTN + ";margin-top:8px;width:100%", onclick: function () { C.resetConfig(); } }, ["Reset cart look"]));
    note(det, "Every widget shares this cart. Add-to-cart, buy, cart and checkout buttons in any widget, including ones the AI builds, use it.");
  }
  function extras(box, tg, c, isBtn) {
    var Cl = window.__IECloud;
    // Link
    var ld = sec(box, isBtn ? "Button link" : "Link");
    var cur = getAttr("@href"), kind = !cur ? "none" : cur.indexOf("cart:") === 0 ? cur : cur.indexOf("page:") === 0 ? "page" : cur.charAt(0) === "#" ? "section" : "url";
    var ks = h("select", { style: INP + ";margin-top:6px" });
    [["none", "No link"], ["page", "Go to a page"], ["url", "Web address"], ["section", "Scroll to a section"], ["cart:open", "Open cart"], ["cart:checkout", "Go to checkout"]].forEach(function (o) { var op = h("option", { value: o[0] }, [o[1]]); if (o[0] === kind) op.selected = true; ks.appendChild(op); });
    ld.appendChild(ks);
    var lw = h("div"); ld.appendChild(lw);
    function linkUI(ev) {
      lw.innerHTML = "";
      var k = ks.value;
      if (k === "url") {
        var ui = h("input", { style: INP + ";margin-top:6px", placeholder: "https://..." }); ui.value = cur.charAt(0) !== "#" && cur.indexOf("cart:") && cur.indexOf("page:") ? cur : "";
        var nt = h("label", { style: "display:flex;gap:6px;align-items:center;margin-top:6px;font:11px system-ui;color:#a1a1aa" }, [h("input", { type: "checkbox" }), "Open in a new tab"]);
        var cb = nt.querySelector("input"); cb.checked = getAttr("@target") === "_blank";
        var save = function () { var v = ui.value.trim(); if (v && !/^(https?:|mailto:|tel:)/.test(v)) v = "https://" + v; setStyle({ "@href": v, "@target": cb.checked ? "_blank" : "" }); cur = v; };
        ui.addEventListener("change", save); cb.addEventListener("change", save);
        lw.appendChild(ui); lw.appendChild(nt);
      } else if (k === "page") {
        var pg = h("select", { style: INP + ";margin-top:6px" }); pg.appendChild(h("option", { value: "" }, ["Pick a page"]));
        ((window.__IE && window.__IE.pages) || []).forEach(function (p) { var o = h("option", { value: "page:" + p.id }, [p.name]); if ("page:" + p.id === cur) o.selected = true; pg.appendChild(o); });
        pg.addEventListener("change", function () { setStyle({ "@href": pg.value, "@target": "" }); cur = pg.value; });
        lw.appendChild(pg);
        note(lw, "Make new pages with the page menu at the top of the canvas.");
      } else if (k === "section") {
        var ss = h("select", { style: INP + ";margin-top:6px" }); ss.appendChild(h("option", { value: "" }, ["Pick a section"]));
        sectionIds().forEach(function (id) { var o = h("option", { value: "#" + id }, [id.replace(/^sec_/, "").replace(/_/g, " ")]); if ("#" + id === cur) o.selected = true; ss.appendChild(o); });
        ss.addEventListener("change", function () { setStyle({ "@href": ss.value, "@target": "" }); cur = ss.value; });
        lw.appendChild(ss);
      } else if (ev) { setStyle({ "@href": k === "none" ? "" : k, "@target": "" }); cur = k === "none" ? "" : k; }
      note(lw, "Links work when you press Play.");
    }
    ks.addEventListener("change", linkUI); linkUI();

    // Media
    var md = sec(box, "Image or video");
    var isMedia = tg.kind === "dom" && /^(IMG|VIDEO)$/.test(tg.el.tagName);
    note(md, isMedia ? "Replace this " + (tg.el.tagName === "IMG" ? "image" : "video") + "." : "Upload to set this element's background image or video.");
    var fi = h("input", { type: "file", accept: "image/*,video/*", style: "display:none" });
    var st = note(md, "");
    var ub = h("button", { style: BTN + ";width:100%;margin-top:6px", onclick: function () { fi.click(); } }, ["Upload image or video"]);
    fi.addEventListener("change", function () {
      var f = fi.files && fi.files[0]; if (!f) return;
      if (!Cl || !Cl.signedIn()) {
        // Not signed in: keep images in this browser so they still show immediately.
        if (!/^image\//.test(f.type) || f.size > 2 * 1024 * 1024) { st.textContent = "Sign in to upload videos or images over 2 MB."; st.style.color = "#f87171"; fi.value = ""; return; }
        var rd = new FileReader();
        rd.onload = function () { setStyle({ "@src": rd.result }); st.textContent = "Added (saved in this browser). Sign in to store it in your account."; st.style.color = "#4ade80"; fi.value = ""; };
        rd.readAsDataURL(f); return;
      }
      st.textContent = "Uploading " + f.name + "..."; st.style.color = "#a1a1aa"; ub.disabled = true;
      Cl.upload(f).then(function (u) { setStyle({ "@src": u }); st.textContent = "Uploaded."; st.style.color = "#4ade80"; })
        .catch(function (e) { st.textContent = e.message; st.style.color = "#f87171"; }).finally(function () { ub.disabled = false; fi.value = ""; });
    });
    md.appendChild(ub); md.appendChild(fi);
    var mu = h("input", { style: INP + ";margin-top:6px", placeholder: "...or paste an image/video address" }); mu.value = getAttr("@src");
    mu.addEventListener("change", function () { if (mu.value.trim()) setStyle({ "@src": mu.value.trim() }); });
    md.appendChild(mu);

    // Product
    var pd = sec(box, "Product");
    var tables = []; try { tables = window.__IE.tableData || []; } catch (e) {}
    var linked = {}; try { linked = JSON.parse(getAttr("@product") || "{}"); } catch (e) {}
    if (linked.name) note(pd, "Linked: " + linked.name + " • $" + Number(linked.price).toFixed(2), "#4ade80");
    var tsel = h("select", { style: INP + ";margin-top:6px" }); tsel.appendChild(h("option", { value: "" }, ["Pick a product table"]));
    tables.forEach(function (t, i) { tsel.appendChild(h("option", { value: String(i) }, [t.name || ("Table " + (i + 1))])); });
    pd.appendChild(tsel);
    var rw = h("div"); pd.appendChild(rw);
    if (!tables.length) note(pd, "Create a product table in the Database tab (with name, price and image columns) to connect real products.");
    tsel.addEventListener("change", function () {
      rw.innerHTML = ""; var t = tables[+tsel.value]; if (!t) return;
      var rows = t.rows || t.data || [];
      var cols = (t.columns || []).map(function (x) { return typeof x === "string" ? x : x.name; });
      if (!cols.length && rows[0]) cols = Object.keys(rows[0]);
      var find = function (re) { return cols.filter(function (k) { return re.test(k); })[0]; };
      var nk = find(/name|title/i), pk = find(/price|amount|cost/i), ik = find(/image|img|photo|picture/i);
      if (!rows.length || !nk || !pk) { note(rw, "This table needs rows with a name and a price column.", "#f87171"); return; }
      var rs = h("select", { style: INP + ";margin-top:6px" }); rs.appendChild(h("option", { value: "" }, ["Pick a product"]));
      rows.forEach(function (r, i) { rs.appendChild(h("option", { value: String(i) }, [String(r[nk]) + " — $" + r[pk]])); });
      rs.addEventListener("change", function () {
        var r = rows[+rs.value]; if (!r) return;
        var p = { name: String(r[nk]), price: Number(String(r[pk]).replace(/[^\d.]/g, "")) || 0, image: ik ? String(r[ik] || "") : "" };
        setStyle({ "@product": JSON.stringify(p) });
        if (tg.kind === "dom") {
          var leaves = [].slice.call(tg.el.querySelectorAll("*")).filter(function (x) { return x.children.length === 0 && (x.textContent || "").trim(); });
          var priceEl = leaves.filter(function (x) { return /\$\s?\d/.test(x.textContent); })[0];
          var nameEl = leaves.filter(function (x) { return x !== priceEl && !/add to|buy|cart|bag/i.test(x.textContent) && x.textContent.trim().length > 2; })[0];
          if (priceEl) tg.api.setText(priceEl, "$" + p.price.toFixed(2));
          if (nameEl) tg.api.setText(nameEl, p.name);
          var im = tg.el.tagName === "IMG" ? tg.el : tg.el.querySelector("img");
          if (im && p.image) tg.api.setStyle(im, { "@src": p.image });
        }
        render(true);
      });
      rw.appendChild(rs);
      note(rw, "Select the whole product card first, then pick the product. Its name, price and photo fill in, and Add to cart uses this price.");
    });

    // Payments
    var pyd = sec(box, "Cart & payments");
    var cartRow = h("div", { style: "display:flex;gap:4px;margin-top:6px" });
    cartRow.appendChild(h("button", { style: BTN + ";flex:1", onclick: function () { window.__IECart && window.__IECart.open(); } }, ["View cart"]));
    cartRow.appendChild(h("button", { style: BTN + ";flex:1", onclick: function () { window.__IECart && window.__IECart.clear(); } }, ["Empty cart"]));
    pyd.appendChild(cartRow);
    cartDesigner(pyd);
    var ps = note(pyd, "Checking payment setup...");
    if (!Cl || !Cl.signedIn()) { ps.textContent = "Sign in to set up payments."; }
    else Cl.call("payment_status").then(function (r) {
      if (r.isAdmin) { ps.textContent = "Admin project: payments go to the Startup Factory Hub Stripe account."; ps.style.color = "#4ade80"; return; }
      ps.textContent = r.stripe_connect ? "Stripe connected." : r.keys.stripe ? "Using your Stripe key " + r.keys.stripe + "." : "Payments are not set up yet.";
      if (r.platform_fee_percent && r.stripe_connect) ps.textContent += " Platform fee: " + r.platform_fee_percent + "% per sale.";
      pyd.appendChild(h("button", { style: BTN + ";width:100%;margin-top:6px;background:#635bff;border-color:#635bff;color:#fff", onclick: function () {
        Cl.call("connect_stripe", { returnUrl: (window.top || window).location.href.split("?")[0] }).then(function (x) { window.open(x.url, "_blank"); }).catch(function (e) { Cl.toast(e.message); });
      } }, [r.stripe_connect ? "Finish / manage Stripe setup" : "Connect Stripe"]));
      var prov = h("select", { style: INP + ";margin-top:6px" });
      [["stripe", "Stripe secret key"], ["paypal", "PayPal"], ["square", "Square"], ["other", "Other payment service"]].forEach(function (o) { prov.appendChild(h("option", { value: o[0] }, [o[1] + (r.keys[o[0]] ? " (" + r.keys[o[0]] + ")" : "")])); });
      var key = h("input", { type: "password", style: INP + ";margin-top:6px", placeholder: "Paste key" });
      pyd.appendChild(prov); pyd.appendChild(key);
      pyd.appendChild(h("button", { style: BTN + ";width:100%;margin-top:6px", onclick: function () {
        Cl.call("save_payment_key", { provider: prov.value, key: key.value }).then(function () { key.value = ""; Cl.toast("Key saved securely"); render(true); }).catch(function (e) { Cl.toast(e.message); });
      } }, ["Save key"]));
    }).catch(function (e) { ps.textContent = e.message; });

    // Storage
    var sd = sec(box, "Your storage");
    var su = note(sd, Cl && Cl.signedIn() ? "Your edits save to your account automatically." : "Sign in to save your edits to your account.");
    if (Cl && Cl.signedIn()) Cl.call("usage").then(function (u) {
      var mb = function (b) { return (b / 1048576).toFixed(1) + " MB"; };
      note(sd, "Used " + mb(u.bytes) + " of " + mb(u.included_bytes) + " included. No limit — extra storage is $" + u.price_per_gb + "/GB per month." + (u.monthly_charge_usd ? " This month: $" + u.monthly_charge_usd.toFixed(2) + "." : ""));
    }).catch(function () {});
  }
  window.__IEElRefresh = function () { render(true); };
  setInterval(function () { if (document.hidden || window.__IEDragging) return; render(false); }, 400);
})();

/* ---------- Live app inspector: edit text/styles of elements inside React live apps; edits patch apps/*.tsx source ---------- */
(function () {
  var panel = null, cur = null, src = null;
  var INP = "width:100%;box-sizing:border-box;background:#0f0f12;border:1px solid #27272a;border-radius:8px;color:#e4e4e7;padding:6px 8px;font:12px system-ui";
  function hex(c) { var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(c || ""); if (!m || m[4] === "0") return ""; return "#" + [m[1], m[2], m[3]].map(function (x) { return (+x).toString(16).padStart(2, "0"); }).join(""); }
  function row(label, el) { var d = document.createElement("label"); d.style.cssText = "display:block;margin-top:8px;font:11px system-ui;color:#a1a1aa"; d.textContent = label; el.style.cssText += ";margin-top:4px"; d.appendChild(el); return d; }
  function inp(type, val) { var i = document.createElement(type === "area" ? "textarea" : "input"); if (type !== "area") i.type = type; i.value = val == null ? "" : val; i.style.cssText = INP; return i; }
  function close() { if (panel) panel.remove(); panel = null; }
  function open(d, source) {
    close(); cur = d; src = source;
    panel = document.createElement("div");
    panel.style.cssText = "position:fixed;right:16px;top:72px;width:260px;z-index:2147483000;background:#18181b;border:1px solid #27272a;border-radius:14px;padding:14px;color:#e4e4e7;font:12px system-ui;box-shadow:0 20px 50px rgba(0,0,0,.5)";
    var file = d.loc.split(":").slice(0, -2).join(":"), line = d.loc.split(":").slice(-2)[0];
    panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:13px">Edit &lt;' + d.tag + '&gt;</b><button data-x style="background:none;border:0;color:#a1a1aa;cursor:pointer;font-size:16px">×</button></div><div style="color:#71717a;margin-top:2px">' + file + " line " + line + "</div>";
    var f = {};
    if (d.text != null) panel.appendChild(row("Text", f.text = inp("area", d.text)));
    panel.appendChild(row("Text color", f.color = inp("color", hex(d.style.color) || "#ffffff")));
    panel.appendChild(row("Background", f.backgroundColor = inp("color", hex(d.style.backgroundColor) || "#000000")));
    panel.appendChild(row("Font size", f.fontSize = inp("text", d.style.fontSize)));
    var w = document.createElement("select"); w.style.cssText = INP; ["300", "400", "500", "600", "700", "800"].forEach(function (v) { var o = document.createElement("option"); o.value = o.textContent = v; w.appendChild(o); }); w.value = String(d.style.fontWeight); panel.appendChild(row("Font weight", f.fontWeight = w));
    var a = document.createElement("select"); a.style.cssText = INP; ["left", "center", "right", "justify"].forEach(function (v) { var o = document.createElement("option"); o.value = o.textContent = v; a.appendChild(o); }); a.value = d.style.textAlign === "start" ? "left" : d.style.textAlign; panel.appendChild(row("Alignment", f.textAlign = a));
    panel.appendChild(row("Padding", f.padding = inp("text", d.style.padding)));
    panel.appendChild(row("Corner radius", f.borderRadius = inp("text", d.style.borderRadius)));
    var bg0 = f.backgroundColor.value, orig = {};
    Object.keys(f).forEach(function (k) { orig[k] = f[k].value; });
    var ap = document.createElement("button"); ap.textContent = "Apply"; ap.style.cssText = "margin-top:12px;width:100%;padding:8px;border-radius:9px;border:0;background:#3b82f6;color:#fff;cursor:pointer;font:600 12px system-ui";
    ap.onclick = function () {
      var style = {}, msg = { ie: "liveapp-patch", loc: cur.loc };
      Object.keys(f).forEach(function (k) { if (f[k].value === orig[k]) return; if (k === "text") msg.text = f[k].value; else style[k] = f[k].value; });
      msg.style = style; try { src.postMessage(msg, "*"); } catch (e) {}
      Object.keys(f).forEach(function (k) { orig[k] = f[k].value; });
    };
    var jc = document.createElement("button"); jc.textContent = "View in Dev"; jc.style.cssText = "margin-top:6px;width:100%;padding:8px;border-radius:9px;border:1px solid #3f3f46;background:transparent;color:#e4e4e7;cursor:pointer;font:12px system-ui";
    jc.onclick = function () { try { window.__IEX && window.__IEX.setMode && window.__IEX.setMode({ mode: "dev" }); if (window.__IEJump) setTimeout(function () { window.__IEJump(file, +line); }, 150); else if (window.__IEFiles && window.__IEFiles.open) window.__IEFiles.open(file); } catch (e) {} };
    var ga = document.createElement("button"); ga.textContent = "Ask Genius AI about this"; ga.style.cssText = "margin-top:6px;width:100%;padding:8px;border-radius:9px;border:1px solid #7c3aed;background:transparent;color:#c4b5fd;cursor:pointer;font:600 12px system-ui";
    ga.onclick = function () { try { window.__IEX && window.__IEX.setMode && window.__IEX.setMode({ mode: "canvas" }); window.__IEPinSet && window.__IEPinSet(cur); } catch (e) {} close(); };
    panel.appendChild(ap); panel.appendChild(jc); panel.appendChild(ga);
    panel.querySelector("[data-x]").onclick = close;
    document.body.appendChild(panel);
  }
  window.addEventListener("message", function (e) {
    var d = e.data; if (!d || typeof d !== "object") return;
    if (d.ie === "liveapp-select" && d.loc) open(d, e.source);
    if (d.ie === "liveapp-inspect-state" && !d.on) close();
  });
})();
