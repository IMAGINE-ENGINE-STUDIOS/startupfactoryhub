/* Imagine Engine Dev link: opening Dev focuses the live app shown on the canvas, and a Preview pane
   runs that app next to the code (hot-reloads as the file changes). */
(function () {
  var lastApp = null, lastMode = null, pane = null, btn = null, open = false, width = 42, device = "full", lastErr = null;
  try { width = +localStorage.getItem("ie-dev-pw") || 42; device = localStorage.getItem("ie-dev-dev") || "full"; } catch (e) {}
  try { open = localStorage.getItem("ie-dev-preview") === "1"; } catch (e) {}
  function ie() { return window.__IE; }
  function mode() { var x = ie(); return x && x.raw ? x.raw.mode : x && x.mode; }
  function files() { var x = ie(); return (x && x.raw && x.raw.files) || []; }
  function seeCanvas() {
    var fs = document.querySelectorAll('iframe[src*="liveapp.html"]');
    for (var i = 0; i < fs.length; i++) { var m = /[?&]file=([^&]+)/.exec(fs[i].getAttribute("src") || ""); if (m) { lastApp = decodeURIComponent(m[1]); return; } }
  }
  function appOf(name) {
    if (/^apps\/[^/]+\.(tsx|jsx|html)$/.test(name || "")) return name;
    var m = /^apps\/([^/]+)\//.exec(name || ""), f = files();
    if (m) { var root = f.filter(function (x) { return new RegExp("^apps/" + m[1] + "\\.(tsx|jsx|html)$", "i").test(x.name); })[0]; if (root) return root.name; }
    return lastApp || (f.filter(function (x) { return /^apps\/[^/]+\.(tsx|jsx|html)$/.test(x.name); })[0] || {}).name || null;
  }
  function activeName() { var x = ie(), id = x && x.activeFile, f = files().filter(function (y) { return y.id === id; })[0]; return f && f.name; }
  function focusApp() {
    var x = ie(); if (!x || !x.openFile || !lastApp) return;
    var f = files().filter(function (y) { return y.name === lastApp; })[0]; if (f) x.openFile(f.id);
  }
  function src() { var a = appOf(activeName()); if (!a) return null; return "/imagine-engine/blocks/liveapp.html?b=1&kind=" + (/\.html$/.test(a) ? "html" : "react") + "&file=" + encodeURIComponent(a); }
  function ui() {
    if (btn) return;
    btn = document.createElement("button"); btn.type = "button"; btn.textContent = "Preview";
    btn.style.cssText = "position:fixed;z-index:60;right:16px;bottom:16px;padding:8px 14px;border-radius:999px;border:1px solid #3f3f46;background:#18181b;color:#e4e4e7;font:600 12px system-ui;cursor:pointer";
    btn.onclick = function () { open = !open; try { localStorage.setItem("ie-dev-preview", open ? "1" : "0"); } catch (e) {} paint(); };
    pane = document.createElement("div");
    pane.style.cssText = "position:fixed;z-index:55;top:56px;right:0;bottom:0;width:42vw;min-width:320px;background:#09090b;border-left:1px solid #27272a;display:none;flex-direction:column";
    var B = "background:none;border:0;color:#a1a1aa;cursor:pointer;font:500 11px system-ui;padding:2px 6px;border-radius:6px";
    pane.innerHTML = '<div data-h title="Drag to resize" style="position:absolute;left:-4px;top:0;bottom:0;width:8px;cursor:col-resize;z-index:2"></div>'
      + '<div style="height:32px;display:flex;align-items:center;gap:6px;padding:0 10px;color:#a1a1aa;font:500 11px system-ui;border-bottom:1px solid #27272a"><span data-n style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Live preview</span>'
      + '<button type="button" data-d="full" style="' + B + '">Desktop</button><button type="button" data-d="768" style="' + B + '">Tablet</button><button type="button" data-d="390" style="' + B + '">Mobile</button>'
      + '<button type="button" data-r style="' + B + '">Reload</button></div>'
      + '<div data-e style="display:none;align-items:center;gap:8px;padding:6px 10px;background:#450a0a;color:#fecaca;font:12px system-ui;border-bottom:1px solid #7f1d1d"><span data-em style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span><button type="button" data-j style="' + B + ';color:#fecaca;border:1px solid #7f1d1d">Go to line</button><button type="button" data-x style="' + B + ';color:#fecaca">Close</button></div>'
      + '<div data-w style="flex:1;display:flex;justify-content:center;background:#18181b;overflow:auto"><iframe title="Live preview" style="height:100%;border:0;width:100%;background:#fff;transition:width .2s"></iframe></div>';
    pane.querySelector("[data-r]").onclick = function () { var f = pane.querySelector("iframe"); f.src = f.src; hideErr(); };
    pane.querySelectorAll("[data-d]").forEach(function (b) { b.onclick = function () { device = b.getAttribute("data-d"); try { localStorage.setItem("ie-dev-dev", device); } catch (e) {} sizeDevice(); }; });
    pane.querySelector("[data-x]").onclick = hideErr;
    pane.querySelector("[data-j]").onclick = function () { if (lastErr) jump(lastErr.file, lastErr.line); };
    var h = pane.querySelector("[data-h]");
    h.onpointerdown = function (e) {
      e.preventDefault(); h.setPointerCapture(e.pointerId); var fr = pane.querySelector("iframe"); fr.style.pointerEvents = "none";
      h.onpointermove = function (ev) { width = Math.max(25, Math.min(80, (window.innerWidth - ev.clientX) / window.innerWidth * 100)); pane.style.width = width + "vw"; };
      h.onpointerup = function () { h.onpointermove = null; fr.style.pointerEvents = ""; try { localStorage.setItem("ie-dev-pw", String(Math.round(width))); } catch (x) {} };
    };
    pane.style.width = width + "vw"; sizeDevice();
    document.body.appendChild(pane); document.body.appendChild(btn);
  }
  function sizeDevice() {
    if (!pane) return; var f = pane.querySelector("iframe");
    f.style.width = device === "full" ? "100%" : device + "px"; f.style.flex = "none";
    pane.querySelectorAll("[data-d]").forEach(function (b) { var on = b.getAttribute("data-d") === device; b.style.background = on ? "#27272a" : "none"; b.style.color = on ? "#fafafa" : "#a1a1aa"; });
  }
  function hideErr() { lastErr = null; if (pane) pane.querySelector("[data-e]").style.display = "none"; }
  function jump(name, line) {
    var x = ie(); if (!x || !x.openFile) return;
    var f = files().filter(function (y) { return y.name === name; })[0]; if (!f) return; x.openFile(f.id);
    if (!line) return;
    setTimeout(function () {
      var ta = document.querySelector("textarea"); if (!ta) return;
      var lines = ta.value.split("\n"), pos = 0; for (var i = 0; i < Math.min(line - 1, lines.length); i++) pos += lines[i].length + 1;
      ta.focus(); ta.setSelectionRange(pos, pos + (lines[line - 1] || "").length);
      var lh = parseFloat(getComputedStyle(ta).lineHeight) || 18; ta.scrollTop = Math.max(0, (line - 5) * lh);
    }, 120);
  }
  window.__IEJump = jump;
  window.addEventListener("message", function (ev) {
    var d = ev.data; if (!d || d.ie !== "liveapp-error" || !pane) return;
    if (ev.origin !== location.origin && ev.origin !== "null") return;
    var m = String(d.message || ""), loc = /([\w./@-]+\.(?:tsx|jsx|ts|js|html|css))?\D{0,3}\(?(\d+):(\d+)\)?/.exec(m + " " + (d.stack || ""));
    var fname = (loc && loc[1] && files().some(function (y) { return y.name === loc[1]; })) ? loc[1] : d.file;
    lastErr = { file: fname, line: loc ? +loc[2] : 0 };
    pane.querySelector("[data-em]").textContent = (fname || "App") + (lastErr.line ? " line " + lastErr.line : "") + ": " + m;
    pane.querySelector("[data-e]").style.display = "flex";
  });
  function paint() {
    var dev = mode() === "dev"; ui();
    btn.style.display = dev ? "block" : "none"; btn.textContent = open ? "Hide preview" : "Preview";
    var show = dev && open, s = show && src(); pane.style.display = show ? "flex" : "none";
    if (show) {
      var f = pane.querySelector("iframe"), n = pane.querySelector("[data-n]");
      if (!s) { n.textContent = "No live app yet"; if (f.getAttribute("src")) f.removeAttribute("src"); }
      else if (f.getAttribute("src") !== s) { f.setAttribute("src", s); hideErr(); n.textContent = "Live preview · " + decodeURIComponent(s.split("file=")[1]); }
    }
  }
  setInterval(function () {
    if (!ie() || document.hidden) return; var m = mode();
    if (m !== "dev") seeCanvas();
    if (m === "dev" && lastMode && lastMode !== "dev") setTimeout(focusApp, 60);
    lastMode = m; paint();
  }, 400);
})();
