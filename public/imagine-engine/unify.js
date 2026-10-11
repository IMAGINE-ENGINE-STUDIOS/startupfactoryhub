/* Imagine Engine unified canvas: sections render as one continuous page and embedded apps/widgets
   grow to their content height instead of showing an inner scrollbar. */
(function () {
  var ROOT = ".mx-auto.max-w-\\[980px\\].space-y-8";
  var css = document.createElement("style");
  css.textContent =
    ROOT + ">:not([hidden])~:not([hidden]){margin-top:0!important}" +
    ROOT + ">div>[data-id],"+ROOT+">div>[data-id]>*:first-child{box-shadow:none!important}" +
    ROOT + ">div:not(:first-child)>[data-id]{border-top-left-radius:0!important;border-top-right-radius:0!important}" +
    ROOT + ">div:not(:last-child)>[data-id]{border-bottom-left-radius:0!important;border-bottom-right-radius:0!important}" +
    "iframe[data-ie-auto]{transition:height .15s ease}";
  document.head.appendChild(css);

  var MAX = 6000;
  function fullViewportApp(doc) {
    /* 3D scenes, games and cameras fill their frame on purpose: keep their fixed height */
    var cs = doc.querySelectorAll("canvas,video");
    for (var i = 0; i < cs.length; i++) { var r = cs[i].getBoundingClientRect(); if (r.height > doc.documentElement.clientHeight * 0.5) return true; }
    var b = getComputedStyle(doc.body);
    return b.overflow === "hidden" && doc.body.scrollHeight <= doc.documentElement.clientHeight + 2;
  }
  function innerDoc(fr) {
    try { var d = fr.contentDocument; if (!d || !d.body) return null;
      /* liveapp html apps render inside one nested frame */
      var nested = d.body.children.length <= 3 && d.querySelector("body>iframe");
      if (nested) { try { if (nested.contentDocument && nested.contentDocument.body) return nested.contentDocument; } catch (e) {} }
      return d; } catch (e) { return null; }
  }
  function fit(fr) {
    var d = innerDoc(fr); if (!d) return;
    if (fullViewportApp(d)) { delete fr.dataset.ieAuto; return; }
    var need = Math.min(MAX, Math.max(d.documentElement.scrollHeight, d.body.scrollHeight));
    var cur = fr.getBoundingClientRect().height;
    /* grow when content overflows; shrink only when content clearly ends earlier */
    if (need > cur + 2 || (need < cur - 40 && d.body.scrollHeight < cur - 40)) {
      fr.dataset.ieAuto = "1"; fr.style.height = need + "px";
      try { var nest = fr.contentDocument && fr.contentDocument.querySelector("body>iframe"); if (nest) nest.style.height = need + "px"; } catch (e) {}
    }
  }
  function watch(fr) {
    if (fr.__ieUnify || !fr.closest || !fr.closest("[data-id]")) return;
    fr.__ieUnify = true;
    var ro = null;
    function hook() {
      var d = innerDoc(fr); if (!d) return;
      try { if (ro) ro.disconnect(); ro = new (fr.contentWindow.ResizeObserver || ResizeObserver)(function () { requestAnimationFrame(function () { fit(fr); }); }); ro.observe(d.body); } catch (e) {}
      fit(fr); setTimeout(function () { fit(fr); }, 400); setTimeout(function () { fit(fr); }, 1500);
    }
    fr.addEventListener("load", function () { setTimeout(hook, 50); });
    hook();
  }
  function scan() { var f = document.querySelectorAll("[data-id] iframe"); for (var i = 0; i < f.length; i++) watch(f[i]); }
  new MutationObserver(function () { scan(); }).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener("message", function (e) { if (e.data && e.data.ie === "liveapp-ready") scan(); });
  setInterval(function () { if (!document.hidden) { var f = document.querySelectorAll("iframe[data-ie-auto]"); for (var i = 0; i < f.length; i++) fit(f[i]); } }, 2000);
  scan();
})();
