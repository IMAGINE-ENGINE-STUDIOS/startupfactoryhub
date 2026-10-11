/* Imagine Engine GitHub sync: push the current project to a repository and pull it back.
   Uses a GitHub personal access token kept only in this browser tab (sessionStorage). */
(function () {
  var API = "https://api.github.com";
  var BTN = "height:30px;border-radius:9px;background:#27272a;color:#e4e4e7;font:11px system-ui;border:1px solid #3f3f46;cursor:pointer;padding:0 10px";
  var INP = "width:100%;height:30px;border-radius:9px;background:#09090b;border:1px solid #27272a;color:#e4e4e7;font:12px system-ui;padding:0 8px;box-sizing:border-box;margin-bottom:8px";
  var L = "font:500 10px system-ui;text-transform:uppercase;letter-spacing:.04em;color:#71717a;margin:4px 0 4px";
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) { if (k === "style") e.style.cssText = attrs[k]; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]); else if (k === "value") e.value = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function raw() { return window.__IE && window.__IE.raw; }
  function cfg() { try { return JSON.parse(localStorage.getItem("ie-gh-cfg") || "{}"); } catch (e) { return {}; } }
  function b64(str) { var bytes = new TextEncoder().encode(str), s = ""; for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(s) { var bin = atob(s.replace(/\n/g, "")), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new TextDecoder().decode(u); }
  function gh(token, path, opts) {
    opts = opts || {};
    return fetch(API + path, { method: opts.method || "GET", headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "Content-Type": "application/json" }, body: opts.body ? JSON.stringify(opts.body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok && !(opts.allow404 && r.status === 404)) throw new Error(j.message || ("GitHub error " + r.status)); return r.status === 404 ? null : j; }); });
  }
  function snapshot() {
    var r = raw(); if (!r) throw new Error("Open a project first.");
    var proj = (r.projects || []).find(function (p) { return p.id === r.pid; }) || null;
    var edits = {};
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^ie-(txt|sty|add|map):/.test(k) || k === "ie-bg:" + r.pid) edits[k] = localStorage.getItem(k); }
    return { format: "imagine-engine-project", version: 1, exportedAt: new Date().toISOString(), project: proj, nodes: r.nodes, links: r.links, files: r.files, edits: edits };
  }
  function putFile(token, repo, branch, path, content, msg) {
    var url = "/repos/" + repo + "/contents/" + path.split("/").map(encodeURIComponent).join("/");
    return gh(token, url + "?ref=" + encodeURIComponent(branch), { allow404: true }).then(function (ex) {
      return gh(token, url, { method: "PUT", body: { message: msg, content: b64(content), branch: branch, sha: ex && ex.sha } });
    });
  }
  function ensureRepo(token, repo, setMsg) {
    return gh(token, "/repos/" + repo, { allow404: true }).then(function (r) {
      if (r) return;
      setMsg("Creating repository " + repo + "...");
      var parts = repo.split("/");
      return gh(token, "/user").then(function (me) {
        var body = { name: parts[1], private: true, auto_init: true, description: "Imagine Engine project" };
        return gh(token, me.login.toLowerCase() === parts[0].toLowerCase() ? "/user/repos" : "/orgs/" + parts[0] + "/repos", { method: "POST", body: body });
      }).then(function () { return new Promise(function (ok) { setTimeout(ok, 1500); }); });
    });
  }
  function push(token, repo, branch, setMsg) {
    return ensureRepo(token, repo, setMsg).then(function () { return pushFiles(token, repo, branch, setMsg); });
  }
  function pushFiles(token, repo, branch, setMsg) {
    var snap = snapshot(), name = (snap.project && snap.project.name) || "Imagine project";
    var files = [["imagine-project.json", JSON.stringify(snap, null, 2)],
      ["README.md", "# " + name + "\n\nBuilt with Imagine Engine on Startup Factory Hub.\n\n`imagine-project.json` holds the full project (pages, widgets, flows, tables and visual edits). Pull it back into Imagine Engine to keep building.\n"]];
    var f = snap.files;
    if (Array.isArray(f)) f.forEach(function (x, i) { if (x && typeof x.content === "string") files.push(["src/" + String(x.name || x.path || ("file-" + i)).replace(/^\/+/, ""), x.content]); });
    var msg = "Imagine Engine sync: " + new Date().toLocaleString();
    var i = 0;
    function next() { if (i >= files.length) return Promise.resolve(); var fl = files[i++]; setMsg("Uploading " + fl[0] + " (" + i + "/" + files.length + ")"); return putFile(token, repo, branch, fl[0], fl[1], msg).then(next); }
    return next();
  }
  function pull(token, repo, branch) {
    return gh(token, "/repos/" + repo + "/contents/imagine-project.json?ref=" + encodeURIComponent(branch)).then(function (j) {
      var snap = JSON.parse(unb64(j.content || ""));
      if (snap.format !== "imagine-engine-project" || !snap.project) throw new Error("This repository has no Imagine Engine project file.");
      var r = raw(); if (!r) throw new Error("Open the builder first.");
      if (window.__IEPushHistory) window.__IEPushHistory("Before GitHub pull");
      Object.keys(snap.edits || {}).forEach(function (k) {
        var nk = k.replace(/^ie-bg:.*/, "ie-bg:" + r.pid);
        localStorage.setItem(nk, snap.edits[k]);
      });
      var incoming = Object.assign({}, snap.project, { id: r.pid });
      r.setProjects(function (ps) { return ps.map(function (p) { return p.id === r.pid ? Object.assign({}, p, incoming) : p; }); });
      if (snap.nodes && r.setNodes) r.setNodes(snap.nodes);
      if (snap.links && r.setLinks) r.setLinks(snap.links);
      if (snap.files && r.setFiles) r.setFiles(snap.files);
      setTimeout(function () { (window.__IERoots || []).forEach(function (x) { try { x.__ieReload && x.__ieReload(); } catch (e) {} }); if (window.__IEApplyBg) window.__IEApplyBg(); }, 300);
    });
  }
  function openModal() {
    if (document.getElementById("ie-gh-modal")) return;
    var c = cfg();
    var tok = h("input", { style: INP, type: "password", placeholder: "Personal access token (repo scope)", value: sessionStorage.getItem("ie-gh-token") || "" });
    var repo = h("input", { style: INP, placeholder: "owner/repository", value: c.repo || "" });
    var br = h("input", { style: INP, placeholder: "main", value: c.branch || "main" });
    var msg = h("div", { style: "min-height:16px;font:12px system-ui;color:#a1a1aa;margin:6px 0" });
    function run(fn, label) {
      var t = tok.value.trim(), rp = repo.value.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, ""), b = br.value.trim() || "main";
      if (!t || !/^[\w.-]+\/[\w.-]+$/.test(rp)) { msg.style.color = "#f87171"; msg.textContent = "Enter your token and a repository like owner/name."; return; }
      sessionStorage.setItem("ie-gh-token", t); localStorage.setItem("ie-gh-cfg", JSON.stringify({ repo: rp, branch: b }));
      msg.style.color = "#a1a1aa"; msg.textContent = label + "...";
      fn(t, rp, b, function (s) { msg.textContent = s; }).then(function () {
          msg.style.color = "#4ade80"; msg.textContent = label + " finished. ";
          var a = h("a", { href: "https://github.com/" + rp + "/tree/" + encodeURIComponent(b), target: "_blank", rel: "noopener", style: "color:#a78bfa;text-decoration:underline" }, ["Open on GitHub"]);
          msg.appendChild(a);
        })
        .catch(function (e) { msg.style.color = "#f87171"; msg.textContent = e.message; });
    }
    var ov = h("div", { id: "ie-gh-modal", style: "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);display:grid;place-items:center", onclick: function (e) { if (e.target === ov) ov.remove(); } }, [
      h("div", { style: "width:min(380px,92vw);background:#18181b;border:1px solid #3f3f46;border-radius:14px;padding:16px;color:#e4e4e7;font:13px system-ui" }, [
        h("div", { style: "font:600 15px system-ui;margin-bottom:4px" }, ["GitHub sync"]),
        h("div", { style: "font:12px system-ui;color:#a1a1aa;margin-bottom:12px" }, ["Send this project to a repository, or bring it back from one. Your token stays in this browser tab only."]),
        h("div", { style: L }, ["Token"]), tok,
        h("div", { style: L }, ["Repository"]), repo,
        h("div", { style: L }, ["Branch"]), br,
        msg,
        h("div", { style: "display:flex;gap:8px;justify-content:flex-end" }, [
          h("button", { style: BTN, onclick: function () { ov.remove(); } }, ["Close"]),
          h("button", { style: BTN, onclick: function () { run(function (t, r, b) { return pull(t, r, b); }, "Pull"); } }, ["Pull from GitHub"]),
          h("button", { style: BTN + ";background:#7c3aed;border-color:#7c3aed;color:#fff", onclick: function () { run(push, "Push"); } }, ["Push to GitHub"]),
        ]),
      ]),
    ]);
    document.body.appendChild(ov);
  }
  window.__IEGitHub = { open: openModal };
  setInterval(function () {
    var host = document.getElementById("ie-canvas-bg"); if (!host || host.querySelector("[data-ie-gh]")) return;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    host.appendChild(h("button", { "data-ie-gh": "1", title: "GitHub sync", style: BTN + ";position:absolute;right:112px;bottom:12px;z-index:40;box-shadow:0 4px 14px rgba(0,0,0,.4)", onclick: openModal }, ["GitHub"]));
  }, 1000);
})();
