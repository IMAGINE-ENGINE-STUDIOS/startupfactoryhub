/* Imagine Engine top bar integrations: Supabase, SurrealDB and GitHub logo buttons in the header.
   The old floating "Connect backend" and "GitHub" buttons are hidden (not removed) so the canvas stays clear. */
(function () {
  var css = document.createElement("style");
  css.textContent = "#ie-sb-btn,[data-ie-gh]{display:none!important}" +
    ".ie-tb{display:inline-flex;align-items:center;gap:2px;padding:2px;border-radius:9999px;background:#18181b;border:1px solid #27272a;margin-right:4px}" +
    ".ie-tb button{position:relative;width:26px;height:24px;border-radius:9999px;border:0;background:transparent;display:grid;place-items:center;cursor:pointer;padding:0}" +
    ".ie-tb button:hover{background:#27272a}.ie-tb svg{width:15px;height:15px}" +
    ".ie-tb i{position:absolute;right:3px;top:3px;width:6px;height:6px;border-radius:50%;background:#22c55e;display:none;box-shadow:0 0 0 1.5px #18181b}.ie-tb button.on i{display:block}";
  document.head.appendChild(css);

  var SB = '<svg viewBox="0 0 109 113"><path d="M63.7 110.3c-2.9 3.6-8.7 1.6-8.8-3l-1-67.4h45.4c8.2 0 12.8 9.5 7.7 15.9z" fill="#249361"/><path d="M45.3 2.1c2.9-3.6 8.7-1.6 8.8 3l.4 67.4H9.8c-8.2 0-12.8-9.5-7.7-15.9z" fill="#3ECF8E"/></svg>';
  var SR = '<svg viewBox="0 0 24 24"><path fill="#FF00A0" d="M12 1 2.5 6.5v11L12 23l9.5-5.5v-11zm0 2.3 7.5 4.3-3.6 2.1L12 7.4 8.1 9.7 4.5 7.6zm-7.6 6 3.7 2.1v4.4L12 18v4.1l-7.6-4.4zm15.2 0v8.4L12 22.1V18l3.9-2.2v-4.4z"/></svg>';
  var GH = '<svg viewBox="0 0 24 24"><path fill="#e4e4e7" d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17.3 4.9 18.3 5.2 18.3 5.2c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5"/></svg>';

  function pid() { var x = window.__IE; return (x && x.raw && x.raw.pid) || "default"; }
  function has(k) { try { return !!localStorage.getItem(k); } catch (e) { return false; } }
  var bar;
  function mk(svg, title, fn) { var b = document.createElement("button"); b.type = "button"; b.title = title; b.setAttribute("aria-label", title); b.innerHTML = svg + "<i></i>"; b.onclick = fn; return b; }
  function backend() { if (window.__IEBackend) window.__IEBackend.open(); }
  setInterval(function () {
    var slot = document.getElementById("ie-hist-slot"); if (!slot) return;
    if (!bar || !slot.contains(bar)) {
      bar = document.createElement("div"); bar.className = "ie-tb";
      bar.appendChild(mk(SB, "Supabase", backend));
      bar.appendChild(mk(SR, "SurrealDB", backend));
      bar.appendChild(mk(GH, "GitHub sync", function () { window.__IEGitHub && window.__IEGitHub.open(); }));
      slot.insertBefore(bar, slot.firstChild);
    }
    var b = bar.children, p = pid();
    b[0].classList.toggle("on", has("ie-sbconn:" + p));
    b[1].classList.toggle("on", has("ie-surconn:" + p));
    b[2].classList.toggle("on", has("ie-gh-cfg") && !!sessionStorage.getItem("ie-gh-token"));
    panelBtn(slot);
  }, 600);

  /* ---------- Content / Design panel: keep on the side, or hide it and open it as a drop menu ---------- */
  var pcss = document.createElement("style");
  pcss.textContent = "body.ie-rp-hide .ie-right{display:none!important}" +
    "body.ie-rp-hide.ie-rp-open .ie-right{display:flex!important;position:fixed!important;top:52px!important;right:10px!important;width:360px!important;max-width:calc(100vw - 20px);height:min(78vh,760px)!important;z-index:80;border:1px solid #3f3f46!important;border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.6)}" +
    "#ie-rp-pin{display:none}body.ie-rp-hide.ie-rp-open #ie-rp-pin{display:block;position:fixed;top:58px;right:378px;z-index:81;height:26px;padding:0 10px;border-radius:9999px;background:#18181b;color:#e4e4e7;border:1px solid #3f3f46;font:11px system-ui;cursor:pointer}" +
    "#ie-rp-btn{height:28px;border-radius:9999px;background:#18181b;color:#e4e4e7;border:1px solid #27272a;font:11px system-ui;padding:0 10px;cursor:pointer;white-space:nowrap;margin-right:4px;display:inline-flex;align-items:center;gap:5px}#ie-rp-btn.on{background:#e4e4e7;color:#18181b}";
  document.head.appendChild(pcss);
  var hidden = localStorage.getItem("ie-rp-hide") === "1";
  function apply() {
    document.body.classList.toggle("ie-rp-hide", hidden);
    if (!hidden) document.body.classList.remove("ie-rp-open");
    var b = document.getElementById("ie-rp-btn");
    if (b) { b.title = hidden ? "Open Content & Design" : "Hide Content & Design (open it from here)"; b.lastChild.textContent = hidden ? "Panel \u25BE" : "Hide panel"; b.classList.toggle("on", document.body.classList.contains("ie-rp-open")); }
  }
  function panelBtn(slot) {
    if (document.getElementById("ie-rp-btn")) return;
    var b = document.createElement("button"); b.id = "ie-rp-btn"; b.type = "button";
    b.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/></svg><span></span>';
    b.onclick = function (e) {
      e.stopPropagation();
      if (!hidden) { hidden = true; localStorage.setItem("ie-rp-hide", "1"); }
      else document.body.classList.toggle("ie-rp-open");
      apply();
    };
    slot.insertBefore(b, bar && slot.contains(bar) ? bar : slot.firstChild);
    var pin = document.createElement("button"); pin.id = "ie-rp-pin"; pin.type = "button"; pin.textContent = "Pin to side";
    pin.onclick = function () { hidden = false; localStorage.setItem("ie-rp-hide", "0"); apply(); };
    document.body.appendChild(pin);
    apply();
  }
  /* ---------- Mobile header: the top bar must never overlap itself ----------
     On narrow screens the bundle's fixed header row keeps every group
     (logo, panel button, integration logos, undo/redo, Record, Run) on one
     line until they crush into each other. Fix: the header and the history
     slot become horizontally swipeable strips — every button keeps its real
     size and stays tappable, nothing overlaps, desktop is untouched. */
  var mcss = document.createElement("style");
  mcss.textContent = "@media (max-width: 900px){" +
    ".ie-hdr{flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none;-webkit-overflow-scrolling:touch}" +
    ".ie-hdr::-webkit-scrollbar{display:none}" +
    ".ie-hdr>*{flex:0 0 auto!important}" +
    "#ie-hist-slot{flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none;-webkit-overflow-scrolling:touch;max-width:58vw}" +
    "#ie-hist-slot::-webkit-scrollbar{display:none}" +
    "#ie-hist-slot>*{flex:0 0 auto!important}" +
    "#ie-rp-btn{font-size:10px;padding:0 7px;height:26px}}" ;
  document.head.appendChild(mcss);
  setInterval(function () {
    var slot = document.getElementById("ie-hist-slot"); if (!slot) return;
    if (!slot.dataset.ieHdr) {
      slot.dataset.ieHdr = "1";
      var hdr = slot.closest("header");
      if (!hdr) { var p = slot; for (var i = 0; i < 5 && p; i++) { p = p.parentElement; if (p && p.getBoundingClientRect().width >= window.innerWidth * 0.95) { hdr = p; break; } } }
      if (hdr) hdr.classList.add("ie-hdr");
    }
  }, 700);

  /* clicking the canvas closes the drop menu (clicks inside the panel keep it open) */
  document.addEventListener("mousedown", function (e) {
    if (!document.body.classList.contains("ie-rp-open")) return;
    var t = e.target; if (!t.closest) return;
    if (t.closest(".ie-right") || t.closest("#ie-rp-btn") || t.closest("#ie-rp-pin") || t.closest("[data-id]")) return;
    document.body.classList.remove("ie-rp-open"); apply();
  }, true);
})();
