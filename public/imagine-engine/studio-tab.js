/* Imagine Engine: 3D Studio workspace tab + floating toolbar (fullscreen, sizes, FPS, restart, Dev) on every app/3D block. */
(function () {
  if (window.__IEStudioTab) return; window.__IEStudioTab = true;
  var css = document.createElement("style");
  css.textContent =
    "#ie-studio-ws{position:fixed;z-index:60;background:#05070d;display:none}#ie-studio-ws iframe{width:100%;height:calc(100% - 40px);border:0}" +
    ".ie-sbar{height:40px;display:flex;align-items:center;gap:6px;padding:0 10px;border-bottom:1px solid rgba(120,160,255,.2);font:500 12px system-ui;color:#e6ecff}.ie-sbar b{margin-right:8px}.ie-sbar .sp{flex:1}.ie-sbar button{padding:5px 12px;border-radius:8px;border:1px solid rgba(120,160,255,.3);background:rgba(60,100,255,.1);color:inherit;cursor:pointer;font:inherit}.ie-sbar button:hover{background:rgba(60,100,255,.25)}.ie-sbar .pl{background:rgba(20,184,166,.25);border-color:rgba(20,184,166,.6)}.ie-sbar .pl.on{background:rgba(239,68,68,.3);border-color:rgba(239,68,68,.6)}" +
    "#ie-studio-btn{display:inline-flex;white-space:nowrap;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;font:500 12px system-ui;cursor:pointer;border:1px solid rgba(120,160,255,.35);background:rgba(60,100,255,.12);color:inherit;margin-left:6px}" +
    "#ie-studio-btn.on{background:rgba(60,100,255,.45)}" +
    "html.ie-studio-on,body.ie-studio-on{overflow:hidden!important;height:100%}body.ie-studio-on .ie-hdr{position:fixed;top:0;left:0;right:0;z-index:61}body.ie-studio-on .ie-hdr~*{display:none!important}body.ie-studio-on #ie-pages-slot,body.ie-studio-on #ie-pages-slot+button{display:none!important}body.ie-studio-on .ie-hdr button[data-mode]{background:transparent!important;color:#a1a1aa!important}body.ie-studio-on .ie-hdr button[data-mode]:hover{color:#fff!important}body.ie-studio-on .iea-fab{display:none!important}" +
    ".ie-bar{position:absolute;top:8px;right:8px;z-index:5;display:flex;gap:4px;padding:4px;border-radius:10px;background:rgba(10,14,24,.78);backdrop-filter:blur(8px);opacity:0;transition:opacity .15s;font:500 11px system-ui;color:#e6ecff}" +
    ".ie-host:hover>.ie-bar,.ie-bar:focus-within{opacity:1}.ie-bar button{background:transparent;border:0;color:inherit;padding:4px 7px;border-radius:6px;cursor:pointer;font:inherit}.ie-bar button:hover{background:rgba(255,255,255,.12)}.ie-bar .fps{padding:4px 7px;opacity:.8;min-width:48px}";
  document.head.appendChild(css);

  /* ---------- 3D Studio workspace ---------- */
  var ws, btn, onTab = false;
  function center() {
    var bar = btn && btn.parentElement, top = 56;
    var hdr = document.querySelector(".ie-hdr"); if (hdr) { var hb0 = hdr.getBoundingClientRect().bottom; return { left: 0, top: hb0, width: innerWidth, height: innerHeight - hb0 }; }
    if (bar) { var hb = bar.getBoundingClientRect(); var row = bar.closest("header,nav") || bar.parentElement; top = Math.max(hb.bottom, row ? row.getBoundingClientRect().bottom : 0); }
    return { left: 0, top: top, width: innerWidth, height: innerHeight - top };
  }
  function place() { if (!ws || !onTab) return; var r = center(); Object.assign(ws.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" }); }
  function show(on) {
    onTab = on;
    if (on && !ws) {
      ws = document.createElement("div"); ws.id = "ie-studio-ws";
      ws.innerHTML = '<div class="ie-sbar"><b>3D Studio</b><button data-s="projects">My 3D projects</button><button data-s="new">+ New level</button><span class="sp"></span><button data-s="play" class="pl">Play</button></div>' +
        '<iframe data-ie-3d="1" allow="fullscreen; xr-spatial-tracking" src="/imagine-studio?embedded=1"></iframe>';
      document.body.appendChild(ws);
      var fr = ws.querySelector("iframe");
      ws.querySelector(".ie-sbar").addEventListener("click", function (e) {
        var b = e.target.closest && e.target.closest("button"); if (!b) return; var a = b.getAttribute("data-s");
        if (a === "projects") fr.src = "/levels?embedded=1";
        if (a === "new") fr.src = "/imagine-studio?embedded=1&new=1";
        if (a === "play") { try { fr.contentWindow.postMessage({ __IEStudio: "play" }, "*"); } catch (er) {} }
      });
      addEventListener("message", function (ev) { var d = ev.data; if (d && d.__IEStudio === "playing") { var p = ws.querySelector(".pl"); if (p) { p.textContent = d.on ? "Stop" : "Play"; p.classList.toggle("on", !!d.on); } } });
    }
    if (ws) ws.style.display = on ? "block" : "none";
    document.body.classList.toggle("ie-studio-on", !!on); document.documentElement.classList.toggle("ie-studio-on", !!on);
    try { window.__IEHistPaint && window.__IEHistPaint(); } catch (e) {}
    if (btn) btn.classList.toggle("on", on);
    place();
  }
  window.__IEStudio = { open: function () { show(true); }, close: function () { show(false); }, frame: function () { return ws && ws.querySelector("iframe"); } };
  addEventListener("resize", place);
  /* any other workspace mode (Canvas, Flow, Dev, Database, Deploy, Admin) closes the studio so it never sits behind them */
  document.addEventListener("click", function (e) { if (!onTab) return; var b = e.target && e.target.closest && e.target.closest("button"); if (!b || b === btn) return; if (/^\s*(canvas|flow|dev|database|deploy|admin)\s*$/i.test(b.textContent || "")) show(false); }, true);

  function mountBtn() {
    if (document.getElementById("ie-studio-btn")) return;
    var all = Array.prototype.slice.call(document.querySelectorAll("button"));
    var flow = all.filter(function (b) { return /^\s*flow\s*$/i.test(b.textContent || ""); })[0];
    if (!flow || !flow.parentElement) return;
    btn = document.createElement("button"); btn.id = "ie-studio-btn"; btn.type = "button"; btn.textContent = "3D Studio";
    btn.onclick = function () { show(!onTab); };
    flow.parentElement.appendChild(btn);
    /* any other workspace tab closes the studio */
    flow.parentElement.addEventListener("click", function (e) { if (e.target !== btn && !btn.contains(e.target)) show(false); }, true);
  }

  /* ---------- toolbar on app/3D iframes ---------- */
  var SIZES = [["480", "480px"], ["16:9", "16/9"], ["Tall", "100vh"]];
  function fileOf(src) { var m = /[?&]file=([^&]+)/.exec(src || ""); return m ? decodeURIComponent(m[1]) : ""; }
  function decorate(f) {
    if (f.__ieBar) return; f.__ieBar = 1;
    var host = f.parentElement; if (!host) return;
    host.classList.add("ie-host"); if (getComputedStyle(host).position === "static") host.style.position = "relative";
    f.setAttribute("allow", (f.getAttribute("allow") || "") + "; fullscreen");
    var bar = document.createElement("div"); bar.className = "ie-bar";
    var fps = document.createElement("span"); fps.className = "fps"; fps.textContent = "-- fps";
    function b(label, title, fn) { var x = document.createElement("button"); x.type = "button"; x.textContent = label; x.title = title; x.onclick = function (e) { e.stopPropagation(); fn(); }; bar.appendChild(x); return x; }
    b("Full", "Fullscreen (Esc to exit)", function () { var el = host; (el.requestFullscreen || el.webkitRequestFullscreen).call(el); });
    var si = 0, key = "ie-size:" + (fileOf(f.src) || f.src);
    function size(i) {
      si = i; var v = SIZES[i][1];
      if (v === "16/9") { f.style.height = "auto"; f.style.aspectRatio = "16/9"; } else { f.style.aspectRatio = ""; f.style.height = v === "100vh" ? "calc(100vh - 120px)" : v; }
      f.style.width = "100%"; sz.textContent = SIZES[i][0]; try { localStorage.setItem(key, i); } catch (e) {}
    }
    var sz = b("480", "Change size", function () { size((si + 1) % SIZES.length); });
    b("Restart", "Restart", function () { var s = f.src; f.src = "about:blank"; setTimeout(function () { f.src = s; }, 30); });
    var file = fileOf(f.src);
    if (file) b("Code", "Open in Dev", function () { try { window.__IEX && window.__IEX.setMode && window.__IEX.setMode({ mode: "dev" }); window.__IEFiles && window.__IEFiles.open && window.__IEFiles.open(file); } catch (e) {} });
    bar.appendChild(fps); host.appendChild(bar);
    size(+(localStorage.getItem(key) || 0) || 0);
    /* FPS: same-origin iframes are measured directly */
    var last = 0, n = 0;
    function tick(t) {
      if (!f.isConnected) return;
      try { var w = f.contentWindow; if (w && w.requestAnimationFrame) { n++; if (t - last > 1000) { fps.textContent = n + " fps"; n = 0; last = t; } return w.requestAnimationFrame(tick); } } catch (e) {}
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function scan() {
    mountBtn();
    document.querySelectorAll('iframe[src*="/imagine-engine/blocks/"],iframe[src*="/imagine-studio"]').forEach(function (f) { if (!f.closest("#ie-studio-ws")) decorate(f); });
  }
  new MutationObserver(function () { clearTimeout(scan.t); scan.t = setTimeout(scan, 250); }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(scan, 800);
})();
