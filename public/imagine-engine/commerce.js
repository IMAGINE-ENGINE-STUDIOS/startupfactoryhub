/* Imagine Engine: account sync (all ie-* edits + projects saved to the user's account),
   media uploads, shared shopping cart + Stripe checkout, button links in Play mode. */
(function () {
  var FN = "https://zqiihhmdsdgwdcwmryym.supabase.co/functions/v1/imagine-commerce";
  var ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaWloaG1kc2Rnd2Rjd21yeXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MTAyMDcsImV4cCI6MjA3Mzk4NjIwN30.ppEJAvP7mVrX-6uXA1_AlaJEDHPBcb297irRyBBT3YI";
  function token() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.*-auth-token$/.test(k)) { var v = JSON.parse(localStorage.getItem(k)); if (v && v.access_token) return v.access_token; if (v && v.currentSession) return v.currentSession.access_token; }
      }
    } catch (e) {}
    return null;
  }
  function call(action, body) {
    var t = token();
    if (!t) return Promise.reject(new Error("Please sign in first."));
    return fetch(FN, { method: "POST", headers: { apikey: ANON, Authorization: "Bearer " + t, "Content-Type": "application/json" }, body: JSON.stringify(Object.assign({ action: action }, body || {})) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || j.error) throw new Error(j.error || "Request failed"); return j; }); });
  }
  function toast(msg) {
    var d = document.createElement("div");
    d.textContent = msg;
    d.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;background:#18181b;color:#fafafa;border:1px solid #3f3f46;border-radius:12px;padding:10px 16px;font:13px system-ui;box-shadow:0 10px 30px rgba(0,0,0,.4)";
    document.body.appendChild(d); setTimeout(function () { d.remove(); }, 3500);
  }

  // ---------- account sync ----------
  var origSet = Storage.prototype.setItem, origRemove = Storage.prototype.removeItem, saveT = null, ready = false;
  function collect() { var o = {}; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^ie-/.test(k) && k !== "ie-cloud-at") o[k] = localStorage.getItem(k); } return o; }
  function schedule() {
    if (!ready || !token()) return;
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      call("save", { ls: collect() }).then(function (r) { origSet.call(localStorage, "ie-cloud-at", r.updated_at); window.__IECloud.status = "saved"; })
        .catch(function () { window.__IECloud.status = "offline"; });
    }, 1500);
  }
  Storage.prototype.setItem = function (k, v) { origSet.call(this, k, v); if (this === localStorage && /^ie-/.test(k) && k !== "ie-cloud-at") schedule(); };
  Storage.prototype.removeItem = function (k) { origRemove.call(this, k); if (this === localStorage && /^ie-/.test(k)) schedule(); };
  if (token()) {
    call("load").then(function (r) {
      var st = r.state, local = localStorage.getItem("ie-cloud-at") || "";
      if (st && st.ls && st.updated_at && st.updated_at > local && !sessionStorage.getItem("ie-cloud-reloaded")) {
        Object.keys(collect()).forEach(function (k) { origRemove.call(localStorage, k); });
        for (var k in st.ls) origSet.call(localStorage, k, st.ls[k]);
        origSet.call(localStorage, "ie-cloud-at", st.updated_at);
        sessionStorage.setItem("ie-cloud-reloaded", "1");
        location.reload(); return;
      }
      sessionStorage.removeItem("ie-cloud-reloaded");
      ready = true; if (!st) schedule();
    }).catch(function () { ready = true; });
  }

  window.__IECloud = {
    status: "", call: call, toast: toast, signedIn: function () { return !!token(); },
    upload: function (file) {
      if (!file) return Promise.reject(new Error("No file"));
      return call("upload_url", { name: file.name, type: file.type }).then(function (r) {
        return fetch(r.signedUrl, { method: "PUT", headers: { "Content-Type": file.type, "x-upsert": "true" }, body: file })
          .then(function (res) { if (!res.ok) throw new Error("Upload failed"); return r.publicUrl; });
      });
    },
  };

  // ---------- shared cart ----------
  var CK = "ie-cart";
  function items() { try { return JSON.parse(localStorage.getItem(CK) || "[]"); } catch (e) { return []; } }
  function setItems(a) { localStorage.setItem(CK, JSON.stringify(a)); paint(); }
  var cart = window.__IECart = {
    items: items,
    add: function (p) {
      var a = items(), f = a.filter(function (x) { return x.name === p.name; })[0];
      if (f) f.qty += p.qty || 1; else a.push({ name: p.name, price: +p.price, image: p.image || "", qty: p.qty || 1 });
      setItems(a); toast("Added to cart: " + p.name);
    },
    setQty: function (i, q) { var a = items(); if (!a[i]) return; if (q <= 0) a.splice(i, 1); else a[i].qty = q; setItems(a); },
    clear: function () { setItems([]); },
    total: function () { return items().reduce(function (s, x) { return s + x.price * x.qty; }, 0); },
    open: function () { drawer(true); }, close: function () { drawer(false); },
    checkout: function () {
      var a = items(); if (!a.length) { toast("Your cart is empty"); return; }
      toast("Opening secure checkout...");
      call("checkout", { items: a, returnUrl: (window.top || window).location.href.split("?")[0] })
        .then(function (r) { (window.top || window).location.href = r.url; })
        .catch(function (e) { toast(e.message); });
    },
  };
  var fab, panel;
  function paint() {
    if (!document.body) return;
    var a = items(), n = a.reduce(function (s, x) { return s + x.qty; }, 0);
    if (!fab) {
      fab = document.createElement("button"); fab.id = "ie-cart-fab"; fab.title = "Cart";
      fab.style.cssText = "position:fixed;right:20px;bottom:84px;z-index:2147483000;height:44px;min-width:44px;padding:0 14px;border-radius:9999px;background:#8b5cf6;color:#fff;border:0;font:600 13px system-ui;cursor:pointer;box-shadow:0 8px 24px rgba(139,92,246,.4);display:none";
      fab.onclick = function () { drawer(!panel || panel.style.display === "none"); };
      document.body.appendChild(fab);
    }
    fab.textContent = "Cart (" + n + ")";
    fab.style.display = n ? "block" : "none";
    if (panel && panel.style.display !== "none") drawer(true);
  }
  function drawer(show) {
    if (!panel) { panel = document.createElement("div"); panel.id = "ie-cart-drawer"; document.body.appendChild(panel); }
    panel.style.cssText = "position:fixed;top:0;right:0;bottom:0;width:340px;max-width:100vw;z-index:2147483001;background:#0b0b0c;color:#fafafa;border-left:1px solid #27272a;font:13px system-ui;display:" + (show ? "flex" : "none") + ";flex-direction:column";
    if (!show) return;
    var a = items();
    panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;padding:16px;border-bottom:1px solid #27272a"><b style="font-size:15px">Your cart</b><button data-x style="background:none;border:0;color:#a1a1aa;font-size:18px;cursor:pointer">×</button></div><div data-list style="flex:1;overflow:auto;padding:12px"></div><div style="padding:16px;border-top:1px solid #27272a"><div style="display:flex;justify-content:space-between;margin-bottom:10px"><span>Total</span><b>$' + cart.total().toFixed(2) + '</b></div><button data-co style="width:100%;height:42px;border-radius:12px;background:#8b5cf6;color:#fff;border:0;font:600 14px system-ui;cursor:pointer">Checkout</button></div>';
    var list = panel.querySelector("[data-list]");
    if (!a.length) list.innerHTML = '<div style="color:#71717a;text-align:center;padding:40px 0">Your cart is empty</div>';
    a.forEach(function (x, i) {
      var r = document.createElement("div");
      r.style.cssText = "display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid #18181b";
      r.innerHTML = (x.image ? '<img src="' + x.image + '" style="width:44px;height:44px;border-radius:8px;object-fit:cover">' : "") +
        '<div style="flex:1;min-width:0"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div><div style="color:#a1a1aa">$' + x.price.toFixed(2) + '</div></div>' +
        '<button data-m style="width:26px;height:26px;border-radius:8px;background:#27272a;color:#fff;border:0;cursor:pointer">-</button><span>' + x.qty + '</span><button data-p style="width:26px;height:26px;border-radius:8px;background:#27272a;color:#fff;border:0;cursor:pointer">+</button>';
      r.querySelector("div div").textContent = x.name;
      r.querySelector("[data-m]").onclick = function () { cart.setQty(i, x.qty - 1); };
      r.querySelector("[data-p]").onclick = function () { cart.setQty(i, x.qty + 1); };
      list.appendChild(r);
    });
    panel.querySelector("[data-x]").onclick = function () { drawer(false); };
    panel.querySelector("[data-co]").onclick = cart.checkout;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint); else paint();
  if (/checkout=success/.test(location.search)) { setTimeout(function () { cart.clear(); toast("Payment complete. Thank you!"); }, 500); }

  // ---------- product detection + link actions ----------
  var PRICE = /\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/;
  function productFrom(btn) {
    var linked = btn.closest("[data-ie-product]");
    if (linked) { try { return JSON.parse(linked.getAttribute("data-ie-product")); } catch (e) {} }
    var card = btn.parentElement, hops = 0;
    while (card && hops < 6 && !PRICE.test(card.textContent || "")) { card = card.parentElement; hops++; }
    if (!card) return null;
    var m = (card.textContent || "").match(PRICE); if (!m) return null;
    var name = "";
    var cands = card.querySelectorAll("h1,h2,h3,h4,h5,h6,p,span,div");
    for (var i = 0; i < cands.length; i++) { var c = cands[i]; if (c.children.length) continue; var t = (c.textContent || "").trim(); if (t.length > 2 && t.length < 60 && !PRICE.test(t) && !/add to|buy|cart|bag/i.test(t)) { name = t; break; } }
    var img = card.querySelector("img");
    return { name: name || "Item", price: +m[1].replace(/,/g, ""), image: img ? img.src : "" };
  }
  function findNative(id) {
    var ps = (window.__IE && window.__IE.projects) || [];
    function walk(n) { if (!n) return null; if (n.id === id) return n; var k = n.children || []; for (var i = 0; i < k.length; i++) { var r = walk(k[i]); if (r) return r; } return null; }
    for (var i = 0; i < ps.length; i++) { var pg = ps[i].pages || []; for (var j = 0; j < pg.length; j++) { var s = pg[j].sections || []; for (var q = 0; q < s.length; q++) { var r = walk(s[q]); if (r) return r; } } }
    return null;
  }
  function runLink(href, target) {
    if (!href) return false;
    if (href === "cart:open") { cart.open(); return true; }
    if (href === "cart:checkout") { cart.checkout(); return true; }
    if (href.charAt(0) === "#") { var d = document.querySelector('[data-id="' + href.slice(1) + '"]'); if (d) d.scrollIntoView({ behavior: "smooth" }); return true; }
    if (/^(https?:|mailto:|tel:)/.test(href)) { if (target === "_blank") window.open(href, "_blank", "noopener"); else (window.top || window).location.href = href; return true; }
    return false;
  }
  window.__IELink = runLink;
  // runs in this window and is installed into widget iframes by edit.js
  window.__IEClickHandler = function (e, doc) {
    var top = window;
    if (!top.__IE || !top.__IE.playing) return;
    var t = e.target; if (!t.closest) return;
    var el = t.closest("[data-ie-href]");
    if (el && runLink(el.getAttribute("data-ie-href"), el.getAttribute("data-ie-target"))) { e.preventDefault(); e.stopPropagation(); return; }
    var nat = t.closest("[data-id]");
    if (nat && doc === document) { var n = findNative(nat.getAttribute("data-id")); if (n && n.style && n.style["@href"] && runLink(n.style["@href"], n.style["@target"])) { e.preventDefault(); e.stopPropagation(); return; } }
    var b = t.closest("button,a,[role=button]");
    if (b && /add to (cart|bag)|buy now|add to basket|^\s*buy\s*$/i.test(b.textContent || "")) {
      var p = productFrom(b); if (p) { e.preventDefault(); e.stopPropagation(); cart.add(p); }
    } else if (b && /checkout|check out/i.test(b.textContent || "")) { e.preventDefault(); e.stopPropagation(); cart.checkout(); }
    else if (b && /^\s*(cart|bag|view cart)\b/i.test(b.textContent || "")) { e.preventDefault(); e.stopPropagation(); cart.open(); }
  };
  document.addEventListener("click", function (e) { window.__IEClickHandler(e, document); }, true);
})();
