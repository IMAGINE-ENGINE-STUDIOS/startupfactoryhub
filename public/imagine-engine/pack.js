/* Imagine Engine server-side pack: joins the current live app (all Dev files) into one file on the server
   (imagine-pack edge function, esbuild), then downloads it as a single HTML file or hosts it at /imagine-engine/run.html. */
(function () {
  var FN = "https://zqiihhmdsdgwdcwmryym.supabase.co/functions/v1/imagine-pack";
  var ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaWloaG1kc2Rnd2Rjd21yeXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MTAyMDcsImV4cCI6MjA3Mzk4NjIwN30.ppEJAvP7mVrX-6uXA1_AlaJEDHPBcb297irRyBBT3";
  function sess() { try { var t = JSON.parse(localStorage.getItem("sb-zqiihhmdsdgwdcwmryym-auth-token") || "null"); return t && t.access_token; } catch (e) { return null; } }
  function files() { var x = window.__IE; return (x && x.raw && x.raw.files) || []; }
  var pinsP = null, uiP = null;
  function pins() {
    return pinsP || (pinsP = fetch("/imagine-engine/blocks/liveapp.html").then(function (r) { return r.text(); }).then(function (t) {
      var a = t.indexOf("var PINS = {"), b = t.indexOf("};", a); if (a < 0 || b < 0) return {};
      var out = {}, re = /"([^"]+)":\s*"([^"]+)"/g, m, body = t.slice(a, b);
      while ((m = re.exec(body))) out[m[1]] = m[2];
      return out;
    }).catch(function () { return {}; }));
  }
  function ui() {
    if (window.__IE_UI) return Promise.resolve(window.__IE_UI);
    return uiP || (uiP = new Promise(function (res) { var s = document.createElement("script"); s.src = "/imagine-engine/blocks/ui-kit.js"; s.onload = function () { res(window.__IE_UI || {}); }; s.onerror = function () { res({}); }; document.head.appendChild(s); }));
  }
  function pack(entry, host) {
    if (!sess()) return Promise.reject(new Error("Sign in to pack your app."));
    var map = {}; files().forEach(function (f) { if (f && f.name && typeof f.content === "string" && !/^custom-scripts\//.test(f.name)) map[f.name] = f.content; });
    return Promise.all([pins(), ui()]).then(function (r) {
      return fetch(FN, { method: "POST", headers: { apikey: ANON, Authorization: "Bearer " + sess(), "Content-Type": "application/json" }, body: JSON.stringify({ entry: entry, files: map, pins: r[0], ui: r[1], host: !!host }) });
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.error) throw new Error(j.error || "Pack failed (" + r.status + ")"); return j; }); });
  }
  function html(name, j) {
    var o = location.origin, js = String(j.js).replace(/<\/script/gi, "<\\/script");
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + name + '</title>'
      + '<script type="importmap">{"imports":{"react":"https://esm.sh/react@19.1.0","react/jsx-runtime":"https://esm.sh/react@19.1.0/jsx-runtime","react-dom":"https://esm.sh/react-dom@19.1.0?external=react","react-dom/client":"https://esm.sh/react-dom@19.1.0/client?external=react"}}</script>'
      + '<script src="https://cdn.tailwindcss.com"></script><script src="' + o + '/imagine-engine/blocks/ie-sdk.js"></script>'
      + '<style>html,body{margin:0;min-height:100%;background:#0b0b0c;color:#fafafa;font-family:system-ui,sans-serif}' + String(j.css || "").replace(/<\/style/gi, "<\\/style") + '</style>'
      + '</head><body><div id="root"></div><script type="module">' + js + '</script></body></html>';
  }
  window.__IEPack = {
    pack: pack,
    download: function (entry) {
      return pack(entry, false).then(function (j) {
        var name = entry.split("/").pop().replace(/\.\w+$/, "");
        var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([html(name, j)], { type: "text/html" })); a.download = name + ".html"; a.click();
        return j;
      });
    },
    host: function (entry) {
      return pack(entry, true).then(function (j) { j.link = location.origin + "/imagine-engine/run.html?src=" + encodeURIComponent(j.hostedSrc); return j; });
    },
  };
})();
