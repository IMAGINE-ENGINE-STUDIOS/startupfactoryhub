/* Imagine Engine Dev link: opening Dev focuses the live app shown on the canvas, and a Preview pane
   runs that app next to the code (hot-reloads as the file changes). */
(function () {
  var lastApp = null, lastMode = null, pane = null, btn = null, open = false, width = 42, device = "full", lastErr = null;
  try { width = +localStorage.getItem("ie-dev-pw") || 42; device = localStorage.getItem("ie-dev-dev") || "full"; } catch (e) {}
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
    var B = "background:none;border:0;color:#a1a1aa;cursor:pointer;font:500 11px system-ui;padding:2px 6px;border-radius:6px";
    pane.innerHTML = '<div data-h title="Drag to resize" style="position:absolute;left:-4px;top:0;bottom:0;width:8px;cursor:col-resize;z-index:2"></div>'
      + '<div style="height:32px;display:flex;align-items:center;gap:6px;padding:0 10px;color:#a1a1aa;font:500 11px system-ui;border-bottom:1px solid #27272a"><span data-n style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Live preview</span>'
      + '<button type="button" data-d="full" style="' + B + '">Desktop</button><button type="button" data-d="768" style="' + B + '">Tablet</button><button type="button" data-d="390" style="' + B + '">Mobile</button>'
      + '<button type="button" data-pk style="' + B + '" title="Join the app into one file on the server and download it">Download</button><button type="button" data-ph style="' + B + '" title="Pack and host the app at a public link">Host</button>'
      + '<button type="button" data-r style="' + B + '">Reload</button></div>'
      + '<div data-e style="display:none;align-items:center;gap:8px;padding:6px 10px;background:#450a0a;color:#fecaca;font:12px system-ui;border-bottom:1px solid #7f1d1d"><span data-em style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span><button type="button" data-j style="' + B + ';color:#fecaca;border:1px solid #7f1d1d">Go to line</button><button type="button" data-g style="' + B + ';color:#fecaca;border:1px solid #7f1d1d">Fix with Genius AI</button><button type="button" data-x style="' + B + ';color:#fecaca">Close</button></div>'
      + '<div data-w style="flex:1;display:flex;justify-content:center;background:#18181b;overflow:auto"><iframe title="Live preview" style="height:100%;border:0;width:100%;background:#fff;transition:width .2s"></iframe></div>';
    pane.querySelector("[data-r]").onclick = function () { var f = pane.querySelector("iframe"); f.src = f.src; hideErr(); };
    pane.querySelectorAll("[data-d]").forEach(function (b) { b.onclick = function () { device = b.getAttribute("data-d"); try { localStorage.setItem("ie-dev-dev", device); } catch (e) {} sizeDevice(); }; });
    pane.querySelector("[data-x]").onclick = hideErr;
    function packRun(btn, how) {
      var a = appOf(activeName()), P = window.__IEPack; if (!a || !P) return;
      var t = btn.textContent; btn.textContent = "Packing…"; btn.disabled = true;
      P[how](a).then(function (j) {
        btn.textContent = t; btn.disabled = false;
        var kb = Math.round((j.bytes || 0) / 1024) + " KB";
        if (how === "host") { try { navigator.clipboard.writeText(j.link); } catch (e) {} window.open(j.link, "_blank"); }
        (window.__IE && window.__IE.log) && window.__IE.log("Packed " + a + " into one file (" + kb + ")" + (how === "host" ? ". Hosted link copied: " + j.link : "") + (j.warnings && j.warnings.length ? " - " + j.warnings.join("; ") : ""));
      }).catch(function (e) {
        btn.textContent = t; btn.disabled = false;
        var m = /([\w./@-]+\.(?:tsx|ts|jsx|js|css|json)):(\d+)/.exec(e.message);
        showIssue({ file: m ? m[1] : a, line: m ? +m[2] : 0, app: a, msg: "Pack failed: " + e.message });
      });
    }
    pane.querySelector("[data-pk]").onclick = function () { packRun(this, "download"); };
    pane.querySelector("[data-ph]").onclick = function () { packRun(this, "host"); };
    pane.querySelector("[data-g]").onclick = function () { if (!lastErr) return; try { window.__IEAutoHeal && window.__IEAutoHeal({ ie: "liveapp-autoheal", file: lastErr.app || lastErr.file, message: lastErr.msg, stack: "" }); } catch (e) {} this.textContent = "Repairing…"; };
    pane.querySelector("[data-j]").onclick = function () { if (lastErr) jump(lastErr.file, lastErr.line); };
    var h = pane.querySelector("[data-h]");
    h.onpointerdown = function (e) {
      e.preventDefault(); h.setPointerCapture(e.pointerId); var fr = pane.querySelector("iframe"); fr.style.pointerEvents = "none";
      h.onpointermove = function (ev) { width = Math.max(25, Math.min(80, (window.innerWidth - ev.clientX) / window.innerWidth * 100)); pane.style.width = width + "vw"; };
      h.onpointerup = function () { h.onpointermove = null; fr.style.pointerEvents = ""; try { localStorage.setItem("ie-dev-pw", String(Math.round(width))); } catch (x) {} };
    };
    pane.style.width = width + "vw"; sizeDevice();
    document.body.appendChild(pane); document.body.appendChild(btn);
  }
  function sizeDevice() {
    if (!pane) return; var f = pane.querySelector("iframe");
    f.style.width = device === "full" ? "100%" : device + "px"; f.style.flex = "none";
    pane.querySelectorAll("[data-d]").forEach(function (b) { var on = b.getAttribute("data-d") === device; b.style.background = on ? "#27272a" : "none"; b.style.color = on ? "#fafafa" : "#a1a1aa"; });
  }
  function hideErr() { lastErr = null; if (pane) pane.querySelector("[data-e]").style.display = "none"; }
  function jump(name, line) {
    var x = ie(); if (!x || !x.openFile) return;
    var f = files().filter(function (y) { return y.name === name; })[0]; if (!f) return; x.openFile(f.id);
    if (!line) return;
    setTimeout(function () {
      var ta = document.querySelector("textarea"); if (!ta) return;
      var lines = ta.value.split("\n"), pos = 0; for (var i = 0; i < Math.min(line - 1, lines.length); i++) pos += lines[i].length + 1;
      ta.focus(); ta.setSelectionRange(pos, pos + (lines[line - 1] || "").length);
      var lh = parseFloat(getComputedStyle(ta).lineHeight) || 18; ta.scrollTop = Math.max(0, (line - 5) * lh);
    }, 120);
  }
  window.__IEJump = jump;
  function showIssue(e) {
    lastErr = e; var bar = pane.querySelector("[data-e]");
    pane.querySelector("[data-g]").textContent = "Fix with Genius AI";
    pane.querySelector("[data-em]").textContent = (e.file || "App") + (e.line ? " line " + e.line : "") + ": " + e.msg;
    bar.style.display = "flex";
    if (!open) { open = true; paint(); }
  }
  /* ---- strict file check on save: syntax, broken imports, missing exports, undeclared components ---- */
  var SUC = null, lastSeen = {}, pending = null;
  function sucrase() { return SUC || (SUC = import("https://esm.sh/sucrase@3.35.0?bundle").catch(function () { SUC = null; return null; })); }
  function fileMap() { var m = {}; files().forEach(function (f) { if (f && f.name) m[f.name] = String(f.content || ""); }); return m; }
  function resolveIn(map, from, spec) {
    var base = spec.slice(0, 2) === "@/" ? spec.slice(2) : (function () { var p = from.split("/"); p.pop(); spec.split("/").forEach(function (x) { if (x === "..") p.pop(); else if (x && x !== ".") p.push(x); }); return p.join("/"); })();
    var t = [base, base + ".tsx", base + ".ts", base + ".jsx", base + ".js", base + "/index.tsx", base + "/index.ts"];
    for (var i = 0; i < t.length; i++) if (map[t[i]]) return t[i];
    if (/(?:^|\/)(components\/ui\/[\w-]+|lib\/utils)$/.test(base.replace(/\.(tsx?|jsx?)$/, ""))) return "@kit";
    return null;
  }
  function exportsOf(src) {
    var ex = {}, m, re = /export\s+(?:declare\s+)?(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|var|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g;
    while ((m = re.exec(src))) ex[m[1]] = 1;
    var re2 = /export\s*(?:type\s*)?\{([^}]*)\}/g; while ((m = re2.exec(src))) m[1].split(",").forEach(function (p) { var k = p.trim().split(/\s+as\s+/).pop().trim(); if (k) ex[k] = 1; });
    if (/export\s+default\b/.test(src)) ex["default"] = 1;
    return { names: ex, star: /export\s+\*\s+from/.test(src) };
  }
  function lineOf(src, idx) { return src.slice(0, idx).split("\n").length; }
  function check(name, src, S) {
    var issues = [], map = fileMap();
    if (S) {
      try { S.transform(src, { transforms: ["typescript", "jsx"], jsxRuntime: "automatic", production: true, filePath: /\.(tsx|jsx)$/.test(name) ? name : name.replace(/\.ts$/, ".tsx").replace(/\.js$/, ".jsx"), disableESTransforms: true }); }
      catch (e) { var lm = /\((\d+):(\d+)\)/.exec(e.message); issues.push({ line: lm ? +lm[1] : 0, msg: "Syntax error: " + e.message.replace(/\s*\(\d+:\d+\)\s*$/, "") }); return issues; }
    }
    var m, re = /import\s+(?:type\s+)?([^'";]*?)\s+from\s*["']([^"']+)["']|import\s*["']([^"']+)["']/g;
    while ((m = re.exec(src))) {
      var spec = m[2] || m[3], clause = (m[1] || "").trim(); if (!/^(\.{1,2}\/|@\/)/.test(spec)) continue;
      var tgt = resolveIn(map, name, spec), ln = lineOf(src, m.index);
      if (!tgt) { issues.push({ line: ln, msg: "Broken link: \"" + spec + "\" points to a file that doesn't exist" }); continue; }
      if (tgt === "@kit" || /\.(css|json)$/.test(tgt) || /^type\b/.test(clause)) continue;
      var ex = exportsOf(map[tgt]); if (ex.star) continue;
      var br = /\{([^}]*)\}/.exec(clause), head = clause.replace(/\{[^}]*\}/, "").replace(/,/g, " ").trim();
      if (head && !/^\*/.test(head) && !ex.names["default"]) issues.push({ line: ln, msg: tgt + " has no default export (imported as " + head + ")" });
      if (br) br[1].split(",").forEach(function (p) { var k = p.trim(); if (!k || /^type\s/.test(k)) return; k = k.split(/\s+as\s+/)[0].trim(); if (k && !ex.names[k]) issues.push({ line: ln, msg: "Missing part: " + tgt + " doesn't export " + k }); });
    }
    var used = {}, r2 = /<([A-Z][\w$]*)(?=[\s>\/])/g;
    while ((m = r2.exec(src))) if (!used[m[1]]) used[m[1]] = lineOf(src, m.index);
    Object.keys(used).forEach(function (n) {
      var d = new RegExp("(\\b(function|class|const|let|var|type|interface|enum)\\s+" + n + "\\b)|(import[^;]*\\b" + n + "\\b[^;]*from)|([{,]\\s*" + n + "\\s*[,}=:])|(\\(\\s*" + n + "\\s*[,)])");
      if (!d.test(src) && !(n in window)) issues.push({ line: used[n], msg: "Missing part: <" + n + "> is used but never imported or defined" });
    });
    return issues;
  }
  function runCheck(name, src) {
    sucrase().then(function (S) {
      var list = check(name, src, S);
      if (!pane) ui();
      if (!list.length) { if (lastErr && lastErr.check && lastErr.file === name) hideErr(); return; }
      var first = list[0];
      showIssue({ check: true, file: name, app: appOf(name) || name, line: first.line, msg: first.msg + (list.length > 1 ? " (+" + (list.length - 1) + " more: " + list.slice(1, 4).map(function (x) { return "line " + x.line + " " + x.msg; }).join("; ") + ")" : "") });
    });
  }
  setInterval(function () {
    if (mode() !== "dev" || document.hidden) return;
    var n = activeName(); if (!n || !/\.(tsx|ts|jsx|js)$/.test(n) || /^custom-scripts\//.test(n)) return;
    var f = files().filter(function (y) { return y.name === n; })[0]; if (!f) return;
    var c = String(f.content || "");
    if (lastSeen[n] === c) return;
    if (lastSeen[n] == null) { lastSeen[n] = c; return runCheck(n, c); }
    lastSeen[n] = c; clearTimeout(pending); pending = setTimeout(function () { runCheck(n, c); }, 700);
  }, 500);
  window.addEventListener("message", function (ev) {
    var d = ev.data; if (!d || d.ie !== "liveapp-error" || !pane) return;
    if (ev.origin !== location.origin && ev.origin !== "null") return;
    var m = String(d.message || ""), loc = /([\w./@-]+\.(?:tsx|jsx|ts|js|html|css))?\D{0,3}\(?(\d+):(\d+)\)?/.exec(m + " " + (d.stack || ""));
    var fname = (loc && loc[1] && files().some(function (y) { return y.name === loc[1]; })) ? loc[1] : d.file;
    showIssue({ file: fname, app: d.file, msg: m, line: loc ? +loc[2] : 0 });
  });
  function paint() {
    var dev = mode() === "dev"; ui();
    btn.style.display = dev ? "block" : "none"; btn.textContent = open ? "Hide preview" : "Preview";
    var show = dev && open, s = show && src(); pane.style.display = show ? "flex" : "none";
    if (show) {
      var f = pane.querySelector("iframe"), n = pane.querySelector("[data-n]");
      if (!s) { n.textContent = "No live app yet"; if (f.getAttribute("src")) f.removeAttribute("src"); }
      else if (f.getAttribute("src") !== s) { f.setAttribute("src", s); hideErr(); n.textContent = "Live preview · " + decodeURIComponent(s.split("file=")[1]); }
    }
  }
  setInterval(function () {
    if (!ie() || document.hidden) return; var m = mode();
    if (m !== "dev") seeCanvas();
    if (m === "dev" && lastMode && lastMode !== "dev") setTimeout(focusApp, 60);
    lastMode = m; paint();
  }, 400);
})();
