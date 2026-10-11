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
  }, 600);
})();
