/* Imagine Engine two-way Canvas <-> Dev sync.
   Canvas sections are written to App.tsx as readable React code with the exact section data in
   an `export const sections = [...]` block; editing that block in the Dev tab updates the canvas. */
(function () {
  var FILE = "App.tsx", B = "/* @ie-sections:begin */", E = "/* @ie-sections:end */";
  var lastOut = null, lastJson = null, timer = null;

  function proj() { var ie = window.__IE; if (!ie || !ie.raw || !ie.raw.projects) return null; return ie.raw.projects.find(function (p) { return p.id === ie.raw.pid; }) || null; }
  function file() { var ie = window.__IE; return ((ie && ie.raw && ie.raw.files) || []).find(function (f) { return f.name === FILE; }) || null; }
  function pageName() { var ie = window.__IE, p = proj(); var pg = p && (p.pages || []).find(function (x) { return x.id === (ie && ie.page); }); return pg ? pg.name : "Main"; }

  function generate(sections) {
    var json = JSON.stringify(sections, null, 2);
    return [
      "// App.tsx - generated live from the Canvas (" + pageName() + " page).",
      "// Edit the sections data below and the Canvas updates. Live apps/games are in apps/*.",
      'import React from "react";',
      "",
      "type Node = { id: string; type: string; content?: string; style?: React.CSSProperties; children?: Node[] };",
      "",
      B,
      "export const sections: Node[] = " + json + ";",
      E,
      "",
      'const TAGS: Record<string, string> = { h1: "h1", p: "p", button: "button", badge: "span", card: "div", div: "div", grid: "div", section: "section" };',
      "",
      "function Render({ node }: { node: Node }) {",
      '  if (node.type === "embed") return <iframe src={node.content} style={{ width: "100%", height: 560, border: 0, ...node.style }} />;',
      '  if (node.type === "image") return <img src={node.content} style={node.style} alt="" />;',
      '  const Tag = (TAGS[node.type] || "div") as any;',
      "  return (",
      "    <Tag data-ie-id={node.id} style={node.style}>",
      "      {node.content}",
      "      {node.children?.map((c) => <Render key={c.id} node={c} />)}",
      "    </Tag>",
      "  );",
      "}",
      "",
      "export default function App() {",
      "  return (",
      '    <main style={{ display: "grid", gap: 16, padding: 16 }}>',
      "      {sections.map((s) => <Render key={s.id} node={s} />)}",
      "    </main>",
      "  );",
      "}",
      "",
    ].join("\n");
  }

  function canvasToCode() {
    var p = proj(), ie = window.__IE; if (!p || !window.__IEFiles) return;
    var json = JSON.stringify(p.sections || []);
    if (json === lastJson) return;
    lastJson = json;
    var out = generate(p.sections || []);
    var cur = file();
    if (cur && cur.content === out) { lastOut = out; return; }
    lastOut = out;
    window.__IEFiles.put(FILE, out, "tsx");
  }

  function codeToCanvas() {
    var f = file(); if (!f || f.content === lastOut) return;
    var c = String(f.content || ""), a = c.indexOf(B), b = c.indexOf(E);
    if (a < 0 || b < a) return; /* user replaced the whole file: leave the canvas alone */
    var body = c.slice(a + B.length, b).replace(/^\s*export\s+const\s+sections(\s*:\s*[^=]+)?=\s*/, "").replace(/;\s*$/, "");
    var data; try { data = JSON.parse(body); } catch (e) { return; } /* still typing */
    if (!Array.isArray(data)) return;
    data = data.filter(function (n) { return n && typeof n === "object"; }).map(function (n) { return window.__IEFix ? window.__IEFix(n) : n; });
    var json = JSON.stringify(data); lastOut = c;
    if (json === lastJson) return;
    lastJson = json;
    var ie = window.__IE, raw = ie.raw;
    raw.setProjects(function (ps) {
      return ps.map(function (pr) {
        if (pr.id !== raw.pid) return pr;
        return Object.assign({}, pr, { sections: data, pages: (pr.pages || []).map(function (pg) { return pg.id === ie.page ? Object.assign({}, pg, { sections: data }) : pg; }) });
      });
    });
    try { ie.log && ie.log("Dev: App.tsx applied to the Canvas"); } catch (e) {}
  }

  var busyUntil = 0;
  var dst = document.createElement("style"); dst.textContent = "body.ie-dragging iframe{pointer-events:none!important}"; document.head.appendChild(dst);
  document.addEventListener("pointerdown", function (e) { window.__IEDragging = true; if (e.target && e.target.closest && e.target.closest("[data-id]") && !e.target.closest("input,textarea,select,[contenteditable]")) document.body.classList.add("ie-dragging"); }, true);
  document.addEventListener("pointercancel", function () { window.__IEDragging = false; document.body.classList.remove("ie-dragging"); }, true);
  document.addEventListener("pointerup", function () { window.__IEDragging = false; document.body.classList.remove("ie-dragging"); busyUntil = Date.now() + 300; }, true);
  document.addEventListener("keydown", function () { busyUntil = Date.now() + 500; }, true);
  function tick() { if (document.hidden || window.__IEDragging || Date.now() < busyUntil) return; try { codeToCanvas(); canvasToCode(); } catch (e) {} }
  setInterval(tick, 700);
  window.__IEDevSync = { now: function () { busyUntil = 0; tick(); }, generate: generate };
})();
