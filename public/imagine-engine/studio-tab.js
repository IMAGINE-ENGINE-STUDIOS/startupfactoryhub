/* Imagine Engine: 3D Studio workspace tab + floating toolbar (fullscreen, sizes, FPS, restart, Dev) on every app/3D block. */
(function () {
  if (window.__IEStudioTab) return; window.__IEStudioTab = true;
  var css = document.createElement("style");
  css.textContent =
    "#ie-studio-ws{position:fixed;z-index:60;background:#05070d;display:none}#ie-studio-ws iframe{width:100%;height:100%;border:0}" +
    "#ie-studio-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;font:500 12px system-ui;cursor:pointer;border:1px solid rgba(120,160,255,.35);background:rgba(60,100,255,.12);color:inherit;margin-left:6px}" +
    "#ie-studio-btn.on{background:rgba(60,100,255,.45)}" +
    ".ie-bar{position:absolute;top:8px;right:8px;z-index:5;display:flex;gap:4px;padding:4px;border-radius:10px;background:rgba(10,14,24,.78);backdrop-filter:blur(8px);opacity:0;transition:opacity .15s;font:500 11px system-ui;color:#e6ecff}" +
    ".ie-host:hover>.ie-bar,.ie-bar:focus-within{opacity:1}.ie-bar button{background:transparent;border:0;color:inherit;padding:4px 7px;border-radius:6px;cursor:pointer;font:inherit}.ie-bar button:hover{background:rgba(255,255,255,.12)}.ie-bar .fps{padding:4px 7px;opacity:.8;min-width:48px}";
  document.head.appendChild(css);

  /* ---------- 3D Studio workspace ---------- */
  var ws, btn, onTab = false;
  function center() {
    var bar = btn && btn.parentElement, top = 56;
    if (bar) { var hb = bar.getBoundingClientRect(); var row = bar.closest("header,nav") || bar.parentElement; top = Math.max(hb.bottom, row ? row.getBoundingClientRect().bottom : 0); }
    return { left: 0, top: top, width: innerWidth, height: innerHeight - top };
  }
  function place() { if (!ws || !onTab) return; var r = center(); Object.assign(ws.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" }); }
  function show(on) {
    onTab = on;
    if (on && !ws) {
      ws = document.createElement("div"); ws.id = "ie-studio-ws";
      ws.innerHTML = '<iframe data-ie-3d="1" allow="fullscreen; xr-spatial-tracking" src="/imagine-studio?embedded=1"></iframe>';
      document.body.appendChild(ws);
    }
    if (ws) ws.style.display = on ? "block" : "none";
    if (btn) btn.classList.toggle("on", on);
    place();
  }
  window.__IEStudio = { open: function () { show(true); }, close: function () { show(false); }, frame: function () { return ws && ws.querySelector("iframe"); } };
  addEventListener("resize", place);

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
