/* Imagine Engine: inline text editing for widgets rendered as DOM (embeds + component widgets).
   Double-click any text to edit; edits persist per widget in localStorage and survive re-renders. */
(function () {
  function pathOf(el, root) {
    var p = [];
    while (el && el !== root) {
      var par = el.parentElement;
      if (!par) return null;
      p.unshift(Array.prototype.indexOf.call(par.children, el));
      el = par;
    }
    return el === root ? p.join(".") : null;
  }
  function byPath(root, p) {
    var el = root, parts = p.split(".");
    for (var i = 0; i < parts.length; i++) {
      if (!el) return null;
      el = el.children[+parts[i]];
    }
    return el || null;
  }
  function isLeaf(el) {
    return el && el.children && el.children.length === 0 && (el.textContent || "").trim().length > 0 &&
      !/^(INPUT|TEXTAREA|SELECT|svg|path)$/i.test(el.tagName);
  }
  window.__IEEdit = function (root, key) {
    if (!root || root.__ieEdit === key) return;
    root.__ieEdit = key;
    var K = "ie-txt:" + key;
    var load = function () { try { return JSON.parse(localStorage.getItem(K) || "{}"); } catch (e) { return {}; } };
    var apply = function () {
      var m = load();
      for (var p in m) {
        var el = byPath(root, p);
        if (el && el.children.length === 0 && el.textContent !== m[p] && document.activeElement !== el) el.textContent = m[p];
      }
    };
    root.addEventListener("dblclick", function (e) {
      var el = e.target;
      if (!isLeaf(el)) return;
      e.preventDefault();
      e.stopPropagation();
      el.contentEditable = "true";
      el.focus();
      try {
        var r = document.createRange(); r.selectNodeContents(el);
        var s = getSelection(); s.removeAllRanges(); s.addRange(r);
      } catch (err) {}
      var done = function () {
        el.contentEditable = "false";
        el.removeEventListener("blur", done);
        var p = pathOf(el, root);
        if (p == null) return;
        var m = load(); m[p] = el.textContent;
        try { localStorage.setItem(K, JSON.stringify(m)); } catch (err) {}
      };
      el.addEventListener("blur", done);
      el.addEventListener("keydown", function (ev) { if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); el.blur(); } });
    }, true);
    var t;
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(apply, 80); })
      .observe(root, { subtree: true, childList: true, characterData: true });
    setTimeout(apply, 50); setTimeout(apply, 600);
  };
})();
