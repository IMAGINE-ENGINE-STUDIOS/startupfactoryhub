/* Imagine Engine page menu: switch, create, rename, duplicate and delete project pages.
   Renders into #ie-pages-slot (canvas header) and #ie-play-pages (Play preview header). */
(function () {
  var S = "height:28px;border-radius:9999px;background:#18181b;color:#e4e4e7;border:1px solid #27272a;font:11px system-ui;padding:0 10px;margin-left:4px;cursor:pointer";
  var last = { a: "", b: "" };
  function sig(ie) { return JSON.stringify([ie.page, ie.pages]); }
  function btn(t, title, fn) { var b = document.createElement("button"); b.textContent = t; b.title = title; b.style.cssText = S; b.onclick = fn; return b; }
  function render(slot, ie, play) {
    slot.innerHTML = "";
    var sel = document.createElement("select"); sel.title = "Page"; sel.style.cssText = S + ";max-width:160px";
    (ie.pages || []).forEach(function (p) { var o = document.createElement("option"); o.value = p.id; o.textContent = "Page: " + p.name; if (p.id === ie.page) o.selected = true; sel.appendChild(o); });
    sel.onchange = function () { window.__IE.goPage(sel.value); };
    slot.appendChild(sel);
    if (play) return;
    if (window.innerWidth < 768) {
      var act = document.createElement("select"); act.title = "Page actions"; act.style.cssText = S + ";width:34px";
      [["", "\u22EF"], ["add", "+ New page"], ["rename", "Rename"], ["copy", "Copy"], ["delete", "Delete"]].forEach(function (a) { var o = document.createElement("option"); o.value = a[0]; o.textContent = a[1]; act.appendChild(o); });
      act.onchange = function () { var v = act.value; act.value = ""; var bs = slot.__acts; if (bs[v]) bs[v].onclick(); };
      slot.__acts = {}; slot.appendChild(act);
    }
    var keys = ["add", "rename", "copy", "delete"], ki = 0;
    slot.__add = function (b) { if (slot.__acts) { slot.__acts[keys[ki++]] = b; } else slot.appendChild(b); };
    slot.__add(btn("+ Page", "Create a new page", function () { var n = prompt("Name of the new page (e.g. About, Shop, Contact)"); if (n && n.trim()) window.__IE.addPage(n.trim()); }));
    slot.__add(btn("Rename", "Rename this page", function () { var ie2 = window.__IE, cur = (ie2.pages || []).filter(function (p) { return p.id === ie2.page; })[0]; var n = prompt("New page name", cur ? cur.name : ""); if (n && n.trim()) ie2.renamePage(ie2.page, n.trim()); }));
    slot.__add(btn("Copy", "Duplicate this page", function () { window.__IE.duplicatePage(window.__IE.page); }));
    slot.__add(btn("Delete", "Delete this page", function () { var ie2 = window.__IE; if ((ie2.pages || []).length < 2) { alert("A project needs at least one page."); return; } if (confirm("Delete this page and everything on it?")) ie2.deletePage(ie2.page); }));
  }
  setInterval(function () {
    var ie = window.__IE; if (!ie || !ie.pages) return;
    var k = sig(ie);
    var a = document.getElementById("ie-pages-slot"), b = document.getElementById("ie-play-pages");
    if (a && (a.dataset.k !== k || !a.firstChild)) { a.dataset.k = k; render(a, ie, false); }
    if (b && (b.dataset.k !== k || !b.firstChild)) { b.dataset.k = k; render(b, ie, true); }
  }, 400);
})();
