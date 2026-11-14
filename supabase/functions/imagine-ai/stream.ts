// Credits: Imagine Engine Studios Corp. Direct-provider streaming normalization.
export type Completion = { text: string; input: number; output: number; finish: string };
export async function readCompletion(resp: Response, onDelta: (text: string) => void): Promise<Completion> {
  const result: Completion = { text: "", input: 0, output: 0, finish: "" };
  if (!resp.body) throw new Error("Provider returned no stream");
  if (!(resp.headers.get("content-type") || "").includes("text/event-stream") && !(resp.headers.get("content-type") || "").includes("ndjson")) {
    const data = await resp.json();
    result.text = data.choices?.[0]?.message?.content || "";
    result.finish = data.choices?.[0]?.finish_reason || "stop";
    result.input = data.usage?.prompt_tokens || 0; result.output = data.usage?.completion_tokens || 0;
    onDelta(result.text); return result;
  }
  const reader = resp.body.getReader(), decoder = new TextDecoder();
  const ndjson = (resp.headers.get("content-type") || "").includes("ndjson");
  let buffer = "", ended = false;
  function consume(raw: string) {
    // The provider's end-of-stream sentinel is not valid JSON and reaches
    // this parser in several real shapes: alone, padded with whitespace,
    // joined into the same frame as a final JSON chunk ("{...}\n[DONE]"),
    // or sitting in the leftover buffer with no trailing frame delimiter.
    // Feeding any of those to JSON.parse throws 'Unexpected token \'D\',
    // "[DONE]" is not valid JSON' and kills otherwise-complete builds at
    // the last frame, so every sentinel shape is end-of-stream: process a
    // JSON prefix first (its delta/finish must not be lost), then end.
    const at = raw.indexOf("[DONE]");
    if (at >= 0) {
      const prefix = raw.slice(0, at).trim();
      if (prefix) applyJson(prefix);
      ended = true;
      return;
    }
    applyJson(raw);
  }
  function applyJson(raw: string) {
    let data: any;
    try { data = JSON.parse(raw); } catch (e) {
      // A parse failure on text that still carries the sentinel is an
      // end-of-stream, not corruption; genuine corruption throws as before.
      if (raw.includes("[DONE]")) { ended = true; return; }
      throw e;
    }
    if (data.error || data.type === "error") throw new Error("The build was interrupted; please try again");
    const delta = data.choices?.[0]?.delta?.content || data.delta?.text || data.message?.content || "";
    if (delta) { result.text += delta; if (result.text.length > 300000) throw new Error("Build output exceeded the safety limit"); onDelta(delta); }
    const usage = data.usage || data.message?.usage;
    if (usage) { result.input = usage.prompt_tokens ?? usage.input_tokens ?? result.input; result.output = usage.completion_tokens ?? usage.output_tokens ?? result.output; }
    if (data.prompt_eval_count != null) result.input = data.prompt_eval_count;
    if (data.eval_count != null) result.output = data.eval_count;
    const finish = data.choices?.[0]?.finish_reason || data.delta?.stop_reason;
    if (finish) { result.finish = finish; ended = true; }
    if (data.type === "message_stop" || data.done) { ended = true; result.finish ||= data.done_reason || "stop"; }
  }
  try {
    while (true) {
      const chunk = await reader.read(); buffer += decoder.decode(chunk.value || new Uint8Array(), { stream: !chunk.done });
      buffer = buffer.replace(/\r\n/g, "\n");
      const delimiter = ndjson ? "\n" : "\n\n";
      let at;
      while ((at = buffer.indexOf(delimiter)) >= 0) {
        const frame = buffer.slice(0, at); buffer = buffer.slice(at + delimiter.length);
        const raw = ndjson ? frame.trim() : frame.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trimStart()).join("\n");
        if (raw) consume(raw);
      }
      if (chunk.done) break;
    }
    // A final frame can arrive without its trailing delimiter (the
    // sentinel commonly does); the framed loop above never sees it.
    // Extract its payload the same way and consume it before giving up.
    if (buffer.trim()) {
      const raw = ndjson ? buffer.trim() : buffer.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trimStart()).join("\n");
      if (raw) consume(raw);
    }
    if (!ended) throw new Error("AI response ended unexpectedly");
    return result;
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
// Providers disagree on finish strings: OpenAI says "length"/"stop",
// Gemini's layer can emit "MAX_TOKENS"/"STOP", Anthropic "max_tokens"/
// "end_turn", and a stream that ends via [DONE] may carry no finish at
// all (""). Normalise before comparing so case/variant never decides
// whether a build continues.
export function normalizeFinish(finish: string): string {
  return (finish || "").trim().toLowerCase();
}
const TRUNCATION_FINISHES = new Set(["length", "max_tokens", "max_output_tokens"]);
const TERMINAL_FINISHES = new Set(["stop", "end_turn", "complete", "eos", "stop_sequence"]);
export function continuation(text: string, finish: string): boolean {
  return TRUNCATION_FINISHES.has(normalizeFinish(finish));
}
// Structural completeness gate for builds: a pass is finished only when
// the accumulated text is provably whole, not merely when the provider
// claims it stopped. An unrecognised/absent finish with truncated text
// must continue the build (bounded by the caller's pass/budget caps)
// instead of returning the partial output as a successful completion.
export function buildComplete(text: string, finish: string): boolean {
  const f = normalizeFinish(finish);
  if (TRUNCATION_FINISHES.has(f)) return false;
  // Fence state, using the client parser's rule: a line of 3+ backticks
  // (with optional info string) opens a fence; a bare backtick line closes.
  let inFence = false;
  const lines = text.split("\n");
  for (const line of lines) {
    if (!inFence) { if (/^\s*`{3,}/.test(line)) inFence = true; }
    else if (/^\s*`{3,}\s*$/.test(line)) inFence = false;
  }
  if (inFence) return false;
  // A trailing line that opens a JSON record but does not parse is a cut record.
  for (let i = lines.length - 1; i >= 0; i--) {
    const last = lines[i].trim();
    if (!last) continue;
    if (last.startsWith("{")) { try { JSON.parse(last); } catch { return false; } }
    break;
  }
  if (/"type"\s*:\s*"done"/.test(text.slice(-4000))) return true;
  return TERMINAL_FINISHES.has(f);
}
export function resumeMessages(messages: { role: string; content: string }[], text: string) {
  // Keep the partial record verbatim: the next output is concatenated, never written alone.
  return [...messages, { role: "assistant", content: text.slice(-24000) }, { role: "user", content: "Continue EXACTLY from the final character of the partial output above. Do not restart the line, repeat any completed files, add a heading or insert a newline first. Finish the interrupted JSON record/code fence, then deliver remaining modules and the root file last. End with the done record. Keep remaining files concise and complete." }];
}
// ---- Build completeness gate: missing root / unresolved imports ----
// buildComplete() proves the accumulated text is structurally whole; this
// gate proves the APP is whole. Live failure shape (2026-11-14): the model
// emitted apps/<Name>/ modules and stopped — no root file, so the app
// never mounted and its files did not persist; or a file imported a module
// that was never created, so the app could not run. missingParts() lists
// what a build still owes; the caller continues the build for exactly
// those files (inside the same pass/budget bounds) instead of accepting
// the incomplete output as a finished build.

// Mirror the client parser's path normalisation closely enough that a
// created record path and a path the client already knows compare equal.
function gatePath(p: string): string {
  return String(p || "").trim().replace(/\\/g, "/").replace(/^\/+/, "").replace(/^(\.\/)+/, "").replace(/\s+/g, "-");
}
const GATE_CODE_EXT = /\.(tsx|ts|jsx|js|mjs)$/;
function collectRecord(rec: any, out: Map<string, string>) {
  if (!rec || typeof rec !== "object") return;
  if (Array.isArray(rec)) { for (const r of rec) collectRecord(r, out); return; }
  if (Array.isArray(rec.actions)) for (const r of rec.actions) collectRecord(r, out);
  if (rec.type === "action" && rec.action) { collectRecord(rec.action, out); return; }
  if (rec.type === "file" && typeof rec.path === "string") {
    if (typeof rec.content === "string") out.set(gatePath(rec.path), rec.content);
    return;
  }
  if ((rec.type === "addFile" || rec.type === "updateFile") && typeof rec.name === "string") {
    const content = typeof rec.content === "string" ? rec.content : typeof rec.code === "string" ? rec.code : null;
    if (content !== null) out.set(gatePath(rec.name), content);
    return;
  }
  if (rec.type === "addLiveApp" && typeof rec.name === "string" && /^[\w-]+$/.test(rec.name)) {
    const content = typeof rec.code === "string" ? rec.code : typeof rec.content === "string" ? rec.content : "";
    out.set(`apps/${rec.name}${rec.kind === "html" ? ".html" : ".tsx"}`, content);
  }
}
// Extract the files a build text creates, accepting the same shapes the
// client build-protocol parser accepts: NDJSON {"type":"file"} records,
// {"type":"action"} wrappers, addFile/updateFile/addLiveApp actions, and
// closed legacy fences carrying a file path.
function createdFiles(text: string): Map<string, string> {
  const out = new Map<string, string>();
  let fence: { path: string | null; lines: string[] } | null = null;
  let jsonBuf = "";
  for (const ln of text.split("\n")) {
    if (fence) {
      if (/^\s*`{3,}\s*$/.test(ln)) {
        if (fence.path) out.set(fence.path, fence.lines.join("\n"));
        fence = null;
      } else {
        if (!fence.lines.length && !fence.path) {
          const header = /^\s*(?:\/\/|<!--|\/\*)\s*(?:file|path)\s*[:=]\s*(\S+)/.exec(ln);
          if (header) { const hp = gatePath(header[1]); if (hp) { fence.path = hp; continue; } }
        }
        fence.lines.push(ln);
      }
      continue;
    }
    if (jsonBuf) {
      jsonBuf += "\n" + ln;
      try { collectRecord(JSON.parse(jsonBuf), out); jsonBuf = ""; } catch { if (jsonBuf.length > 300000) jsonBuf = ""; }
      continue;
    }
    const open = /^\s*`{3,}([\w-]*)(.*)$/.exec(ln);
    if (open) {
      const m = /(?:file|path|name|title|filename)\s*=\s*["']?([^\s"']+)/.exec(open[2]) || /[:\s]+["']?((?:apps|components|lib|src|styles|hooks|pages|scenes|custom-scripts)\/[^\s"']+)/.exec(open[2]);
      fence = { path: m ? gatePath(m[1]) : null, lines: [] };
      continue;
    }
    const trimmed = ln.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try { collectRecord(JSON.parse(trimmed), out); } catch { jsonBuf = trimmed; }
    }
  }
  return out;
}
function resolveRel(importer: string, spec: string): string {
  const parts = importer.split("/").slice(0, -1);
  for (const seg of spec.split("/")) {
    if (seg === "." || seg === "") continue;
    if (seg === "..") { parts.pop(); continue; }
    parts.push(seg);
  }
  return parts.join("/");
}
// Some imports never exist as project files because the engine serves
// them itself; they must never be flagged missing. The IE SDK is imported
// as "../lib/ie", and liveapp.html's resolver also serves the built-in UI
// kit for any relative path landing on components/ui/<name> or lib/utils
// (the same regex the runtime uses, applied to the resolved path).
function engineProvided(resolved: string, spec: string): boolean {
  const bare = spec.replace(/^(\.\.\/)+/, "").replace(/^(\.\/)+/, "");
  if (bare === "lib/ie" || bare.startsWith("lib/ie/") || resolved === "lib/ie" || resolved.startsWith("lib/ie/")) return true;
  return /(?:^|\/)(components\/ui\/[\w-]+|lib\/utils)$/.test(resolved.replace(/\.(tsx?|jsx?)$/, ""));
}
export function missingParts(text: string, knownPaths: string[] = []): string[] {
  const created = createdFiles(text);
  if (!created.size) return [];
  const known = new Set<string>();
  for (const p of knownPaths || []) { const n = gatePath(p); if (n) known.add(n); }
  const all = new Set<string>([...known, ...created.keys()]);
  const folders = new Set<string>();
  for (const p of created.keys()) {
    const m = /^apps\/([^/]+)\//.exec(p);
    if (m) folders.add(m[1]);
  }
  if (!folders.size) return [];
  // Only NEW folder apps are gated. A folder the project already knows
  // (any known file under it, or its single-file root) is an existing app
  // being tweaked, and a tweak turn must never be held open by this gate.
  const fresh: string[] = [];
  for (const name of folders) {
    const prefix = `apps/${name}/`;
    let established = false;
    for (const k of known) { if (k.startsWith(prefix)) { established = true; break; } }
    if (!established && !known.has(`apps/${name}.tsx`) && !known.has(`apps/${name}.jsx`) && !known.has(`apps/${name}.html`)) fresh.push(name);
  }
  if (!fresh.length) return [];
  fresh.sort();
  const missing: string[] = [];
  const ROOT_FILES = ["App.tsx", "App.jsx", "index.tsx", "index.jsx"];
  for (const name of fresh) {
    const hasRoot = ROOT_FILES.some((f) => all.has(`apps/${name}/${f}`)) || all.has(`apps/${name}.tsx`) || all.has(`apps/${name}.jsx`) || all.has(`apps/${name}.html`);
    if (!hasRoot) missing.push(`root:apps/${name}/App.tsx`);
  }
  // Import scan over the files this turn created for the new apps
  // (a single-file root emitted alongside its modules is scanned too).
  const importRes = [
    /\bimport\s+(?:[\w${},*\s]+?\s+from\s+)?["']([^"']+)["']/g,
    /\bexport\s+(?:\*|{[^}]*})\s+from\s+["']([^"']+)["']/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  const seenImport = new Set<string>();
  for (const [path, content] of created) {
    const underFresh = fresh.some((n) => path.startsWith(`apps/${n}/`) || path === `apps/${n}.tsx` || path === `apps/${n}.jsx`);
    if (!underFresh || !GATE_CODE_EXT.test(path) || !content) continue;
    const specs = new Set<string>();
    for (const re of importRes) { re.lastIndex = 0; let m: RegExpExecArray | null; while ((m = re.exec(content))) specs.add(m[1]); }
    for (const spec of specs) {
      if (!spec.startsWith("./") && !spec.startsWith("../")) continue;
      const resolved = resolveRel(path, spec);
      if (engineProvided(resolved, spec)) continue;
      // Same candidate list liveapp.html's resolver tries.
      const candidates = [resolved];
      if (!/\.[a-z0-9]+$/i.test(spec)) candidates.push(resolved + ".tsx", resolved + ".ts", resolved + ".jsx", resolved + ".js", resolved + "/index.tsx", resolved + "/index.ts");
      if (candidates.some((c) => all.has(c))) continue;
      const entry = `import:${path} -> ${spec}`;
      if (!seenImport.has(entry)) { seenImport.add(entry); missing.push(entry); }
    }
  }
  return missing;
}
export function missingMessages(messages: { role: string; content: string }[], text: string, missing: string[]) {
  const lines = missing.map((m) => {
    if (m.startsWith("root:")) return `- root file: ${m.slice(5)} (the app cannot run or be saved without it)`;
    const mm = /^import:(.*) -> (.*)$/.exec(m);
    if (mm) return `- missing module: ${mm[1]} imports "${mm[2]}", which was never created`;
    return `- ${m}`;
  });
  return [...messages, { role: "assistant", content: text.slice(-24000) }, { role: "user", content: `The build is not finished: these required files are still missing:\n${lines.join("\n")}\nEmit ONLY those missing files now, each as a complete records-v1 {"type":"file"} record (dependencies first, the root app file last), then the {"type":"done"} record. Do not repeat any file already emitted, do not edit other files, and add no prose.` }];
}