// Credits: Imagine Engine Studios Corp.
// Shared browser build protocol: complete records only, never partial source.
(function (host) {
  function safePath(path) {
    return typeof path === "string" && path.length < 240 && !path.split("/").some(function (p) { return !p || p === "." || p === ".."; }) &&
      /^(apps|components|lib|src|styles|custom-scripts|hooks|pages|scenes)\/[\w./-]+\.(tsx|ts|jsx|js|html|css|json)$/.test(path);
  }
  function action(record) {
    if (!record || typeof record !== "object") throw new Error("Invalid build record");
    if (record.type === "file") {
      if (!safePath(record.path) || typeof record.content !== "string" || !record.content.trim()) throw new Error("Invalid source file");
      return sourceAction(record.path, record.content);
    }
    if (record.type === "action") return action(record.action);
    if (["addFile", "updateFile", "patchFile"].indexOf(record.type) >= 0) {
      if (!safePath(record.name)) throw new Error("Unsafe source path");
      if (record.type === "patchFile" && (!Array.isArray(record.edits) || !record.edits.length)) throw new Error("Empty patch");
      if (record.type !== "patchFile" && typeof (record.content || record.code) !== "string") throw new Error("Missing source");
    }
    if (record.type === "addLiveApp" && !/^[\w-]+$/.test(record.name || "")) throw new Error("Invalid app name");
    if (typeof record.type !== "string") throw new Error("Missing action type");
    return record;
  }
  function sourceAction(path, content) {
    if (/^apps\/[^/]+\.(tsx|jsx|html)$/.test(path)) return { type: "addLiveApp", name: path.replace(/^apps\//, "").replace(/\.[^.]+$/, ""), kind: /\.html$/.test(path) ? "html" : "react", code: content };
    return { type: "addFile", name: path, content: content };
  }
  function parser(onRecord) {
    var pending = "", fence = null, prose = [], records = [], errors = [];
    function emit(r) {
      try {
        if (r.type === "summary") { if (typeof r.text !== "string") throw new Error("Invalid summary"); prose.push(r.text); }
        else if (r.type === "phases" || r.type === "done") { /* metadata */ }
        else { r = action(r); }
        records.push(r); if (onRecord) onRecord(r);
      } catch (e) { errors.push(e.message); }
    }
    function json(text) {
      var value = JSON.parse(text), list = Array.isArray(value) ? value : value.actions || [value];
      list.forEach(emit);
    }
    function line(ln) {
      var trimmed = ln.trim(), open;
      if (fence) {
        if (/^\s*`{3,}\s*$/.test(ln)) {
          try {
            if (fence.path) emit({ type: "file", path: fence.path, content: fence.lines.join("\n") + "\n" });
            else if (/^(actions|json)$/.test(fence.kind)) json(fence.lines.join("\n"));
            else if (fence.kind === "phases") emit(Object.assign({ type: "phases" }, JSON.parse(fence.lines.join("\n"))));
          } catch (e) { errors.push("Invalid " + fence.kind + " block: " + e.message); }
          fence = null;
        } else {
          if (!fence.lines.length && !fence.path) {
            var header = /^\s*(?:\/\/|<!--|\/\*)\s*(?:file|path)\s*[:=]\s*(\S+)/.exec(ln);
            if (header && safePath(header[1])) { fence.path = header[1]; return; }
          }
          fence.lines.push(ln);
        }
        return;
      }
      if ((open = /^\s*`{3,}([\w-]*)(.*)$/.exec(ln))) {
        var path = /(?:file|path|name|title|filename)\s*=\s*["']?([^\s"']+)/.exec(open[2]) || /[:\s]+["']?((?:apps|components|lib|src|styles|hooks|pages|scenes|custom-scripts)\/[^\s"']+)/.exec(open[2]);
        fence = { kind: open[1], path: path && safePath(path[1]) ? path[1] : null, lines: [] }; return;
      }
      if (trimmed[0] === "{" || trimmed[0] === "[") {
        try { json(trimmed); } catch (e) { errors.push("Invalid structured build record"); } return;
      }
      if (trimmed) prose.push(ln);
    }
    return {
      feed: function (chunk) { pending += chunk; var i; while ((i = pending.indexOf("\n")) >= 0) { line(pending.slice(0, i).replace(/\r$/, "")); pending = pending.slice(i + 1); } },
      finish: function () { if (pending) { line(pending); pending = ""; } if (fence) errors.push("Incomplete source block; no partial file was saved"); return this.result(); },
      result: function () { return { records: records.slice(), list: records.filter(function (r) { return ["summary", "phases", "done"].indexOf(r.type) < 0; }), clean: prose.join("\n").trim(), errors: errors.slice() }; }
    };
  }
  function parse(text) { var p = parser(); p.feed(String(text || "")); return p.finish(); }
  function patch(source, edits) {
    var staged = source;
    edits.forEach(function (edit) {
      if (!edit || typeof edit.find !== "string" || !edit.find.trim() || typeof edit.replace !== "string") throw new Error("Invalid patch");
      var at = staged.indexOf(edit.find), end;
      if (at >= 0) {
        if (staged.indexOf(edit.find, at + 1) >= 0) throw new Error("Ambiguous patch; use a longer unique snippet");
        end = at + edit.find.length;
      } else {
        // Conservative fuzzy match: whitespace differences only, preserving all code tokens.
        var tokens = edit.find.match(/\S+/g) || [], pattern = tokens.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("\\s+"), re = new RegExp(pattern, "g"), match = re.exec(staged);
        if (!match) throw new Error("Patch snippet was not found");
        at = match.index; end = at + match[0].length;
        if (re.exec(staged)) throw new Error("Ambiguous whitespace match");
      }
      staged = staged.slice(0, at) + edit.replace + staged.slice(end);
    });
    return staged;
  }
  function rank(files, query, selected, budget) {
    budget = budget || 36000;
    var terms = String(query || "").toLowerCase().match(/[a-z0-9_-]{3,}/g) || [], pin = selected && selected.file;
    var sorted = files.map(function (f, i) {
      var content = String(f.content || ""), name = f.name.toLowerCase(), score = f.name === pin ? 10000 : 0;
      terms.forEach(function (t) { if (name.indexOf(t) >= 0) score += 100; if (content.toLowerCase().indexOf(t) >= 0) score += 2; });
      if (/^apps\/[^/]+\.(tsx|jsx|html)$/.test(f.name)) score += 15;
      return { name: f.name, content: content, size: content.length, score: score, index: i };
    }).sort(function (a, b) { return b.score - a.score || a.index - b.index; });
    var first = sorted[0];
    if (first) sorted.forEach(function (f) { if (first.content.indexOf(f.name.replace(/\.(tsx|ts|jsx|js)$/, "")) >= 0) f.score += 30; });
    sorted.sort(function (a, b) { return b.score - a.score || a.index - b.index; });
    return sorted.map(function (f) {
      var content = "", startLine = 1;
      if (f.size <= budget) { content = f.content; budget -= f.size; }
      else if (f.name === pin && budget > 1000) {
        var lines = f.content.split("\n"), center = Math.max(0, Number(selected.line || 1) - 1), from = Math.max(0, center - 30);
        content = lines.slice(from, center + 45).join("\n");
        if (content.length > budget) content = ""; else { budget -= content.length; startLine = from + 1; }
      }
      return { name: f.name, size: f.size, content: content, omitted: content.length !== f.size, startLine: startLine };
    });
  }
  async function readResponse(response, onEvent) {
    if (!response.ok || !(response.headers.get("content-type") || "").includes("text/event-stream")) return { ok: response.ok, j: await response.json() };
    if (!response.body) throw new Error("Missing build stream");
    var reader = response.body.getReader(), decoder = new TextDecoder(), buffer = "", final = null;
    try {
      while (true) {
        var chunk = await reader.read(); buffer += decoder.decode(chunk.value || new Uint8Array(), { stream: !chunk.done }).replace(/\r\n/g, "\n");
        var at;
        while ((at = buffer.indexOf("\n\n")) >= 0) {
          var frame = buffer.slice(0, at); buffer = buffer.slice(at + 2);
          var data = frame.split("\n").filter(function (l) { return l.indexOf("data:") === 0; }).map(function (l) { return l.slice(5).trimStart(); }).join("\n");
          if (!data) continue;
          var event = JSON.parse(data);
          if (event.type === "error") throw new Error(event.error || "Build interrupted");
          if (event.type === "complete") final = event.result;
          else if (onEvent) await onEvent(event);
        }
        if (chunk.done) break;
      }
      if (!final) throw new Error("Build connection ended before completion; completed files were kept");
      return { ok: true, j: final };
    } finally { await reader.cancel().catch(function () {}); reader.releaseLock(); }
  }
  host.__IEBuild = { safePath: safePath, action: action, parser: parser, parse: parse, patch: patch, rank: rank, readResponse: readResponse };
})(typeof window === "undefined" ? globalThis : window);