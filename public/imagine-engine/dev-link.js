/* Imagine Engine Dev link: opening Dev focuses the live app shown on the canvas, and a Preview pane
   runs that app next to the code (hot-reloads as the file changes). */
(function () {
  var lastApp = null, lastMode = null, pane = null, btn = null, open = false;
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
    pane.innerHTML = '<div style="height:32px;display:flex;align-items:center;justify-content:space-between;padding:0 10px;color:#a1a1aa;font:500 11px system-ui;border-bottom:1px solid #27272a"><span data-n>Live preview</span><button type="button" data-r style="background:none;border:0;color:#a1a1aa;cursor:pointer;font:500 11px system-ui">Reload</button></div><iframe title="Live preview" style="flex:1;border:0;width:100%;background:#fff"></iframe>';
    pane.querySelector("[data-r]").onclick = function () { var f = pane.querySelector("iframe"); f.src = f.src; };
    document.body.appendChild(pane); document.body.appendChild(btn);
  }
  function paint() {
    var dev = mode() === "dev"; ui();
    btn.style.display = dev ? "block" : "none"; btn.textContent = open ? "Hide preview" : "Preview";
    var show = dev && open, s = show && src(); pane.style.display = show ? "flex" : "none";
    if (show) {
      var f = pane.querySelector("iframe"), n = pane.querySelector("[data-n]");
      if (!s) { n.textContent = "No live app yet"; if (f.getAttribute("src")) f.removeAttribute("src"); }
      else if (f.getAttribute("src") !== s) { f.setAttribute("src", s); n.textContent = "Live preview · " + decodeURIComponent(s.split("file=")[1]); }
    }
  }
  setInterval(function () {
    if (!ie() || document.hidden) return; var m = mode();
    if (m !== "dev") seeCanvas();
    if (m === "dev" && lastMode && lastMode !== "dev") setTimeout(focusApp, 60);
    lastMode = m; paint();
  }, 400);
})();
