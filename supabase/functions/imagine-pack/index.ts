// Packs an Imagine Engine live app (all its Dev files) into one minified JavaScript file with esbuild,
// then optionally hosts it publicly so it runs outside the editor via /imagine-engine/run.html?src=<url>.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as esbuild from "https://deno.land/x/esbuild@v0.20.1/wasm.js";

const BUCKET = "studio-published";
const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

let ready: Promise<void> | null = null;
const init = () => (ready ||= esbuild.initialize({ wasmURL: "https://deno.land/x/esbuild@v0.20.1/esbuild.wasm", worker: false }));

const SHARE3 = /^(@react-three\/|postprocessing|three-stdlib|@react-spring\/three)/;
const EXTS = ["", ".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts", "/index.jsx", "/index.js"];

function join(from: string, spec: string) {
  const parts = from.split("/"); parts.pop();
  for (const p of spec.split("/")) { if (p === "..") parts.pop(); else if (p && p !== ".") parts.push(p); }
  return parts.join("/");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const auth = req.headers.get("Authorization") || "";
    const { data: u } = await admin.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
    const user = u?.user;
    if (!user) return json({ error: "Sign in to pack your app" }, 401);

    const body = await req.json().catch(() => ({}));
    const files: Record<string, string> = body.files && typeof body.files === "object" ? body.files : {};
    const ui: Record<string, string> = body.ui && typeof body.ui === "object" ? body.ui : {};
    const pins: Record<string, string> = body.pins && typeof body.pins === "object" ? body.pins : {};
    const entry = String(body.entry || "");
    if (!files[entry]) return json({ error: "App file not found: " + entry }, 400);
    const size = Object.values(files).reduce((n, s) => n + String(s).length, 0);
    if (size > 8_000_000) return json({ error: "App too large to pack (8 MB of source max)" }, 413);

    const find = (base: string) => {
      for (const e of EXTS) if (files[base + e] != null && files[base + e] !== "") return base + e;
      const kit = /(?:^|\/)(components\/ui\/[\w-]+|lib\/utils)$/.exec(base.replace(/\.(tsx?|jsx?)$/, ""));
      if (kit && ui[kit[1]]) return "@ui/" + kit[1] + ".tsx";
      return null;
    };
    const esm = (spec: string) => {
      const m = /^(@[^/]+\/[^/@]+|[^/@]+)(.*)$/.exec(spec);
      const pkg = m ? m[1] : spec, rest = m ? m[2] : "", ver = pins[pkg];
      const q = "?external=react,react-dom" + (SHARE3.test(pkg) && pins.three ? "&deps=three@" + pins.three : "");
      return "https://esm.sh/" + (ver && !/^@\d/.test(rest) ? pkg + "@" + ver + rest : spec) + q;
    };
    const warnings: string[] = [];

    await init();
    const result = await esbuild.build({
      stdin: {
        contents: `import App from ${JSON.stringify("./" + entry)};\nimport { createRoot } from "react-dom/client";\nimport { createElement } from "react";\ncreateRoot(document.getElementById("root")).render(createElement(App));\n`,
        loader: "tsx", resolveDir: "/", sourcefile: "__entry.tsx",
      },
      bundle: true, write: false, format: "esm", minify: true, target: "es2020", jsx: "automatic",
      plugins: [{
        name: "ie-virtual",
        setup(b) {
          b.onResolve({ filter: /.*/ }, (a) => {
            const spec = a.path;
            if (/^(react|react-dom)(\/|$)/.test(spec) || /^(https?:|data:)/.test(spec)) return { path: spec, external: true };
            if (/^(\.{1,2}\/|@\/)/.test(spec) || a.kind === "entry-point") {
              const from = a.importer === "<stdin>" || !a.importer ? "__entry.tsx" : a.importer.replace(/^\//, "");
              const base = spec.startsWith("@/") ? spec.slice(2) : join(from.startsWith("@ui/") ? from.slice(4) : from, spec);
              const hit = find(base);
              if (!hit) { warnings.push(`Missing ${spec} (imported from ${from}) - replaced with an empty part`); return { path: "missing:" + spec, namespace: "missing" }; }
              return { path: "/" + hit, namespace: "ie" };
            }
            return { path: esm(spec), external: true };
          });
          b.onLoad({ filter: /.*/, namespace: "ie" }, (a) => {
            const name = a.path.replace(/^\//, "");
            const src = name.startsWith("@ui/") ? ui[name.slice(4).replace(/\.tsx$/, "")] : files[name];
            const loader = /\.css$/.test(name) ? "css" : /\.json$/.test(name) ? "json" : /\.ts$/.test(name) ? "ts" : /\.jsx?$/.test(name) ? "jsx" : "tsx";
            return { contents: src, loader, resolveDir: "/" };
          });
          b.onLoad({ filter: /.*/, namespace: "missing" }, () => ({
            contents: "const P = () => null; export default P; export const __missing = true;", loader: "js",
          }));
        },
      }],
    });

    const out = result.outputFiles || [];
    const js = out.filter((f) => f.path.endsWith(".js") || !f.path.endsWith(".css")).map((f) => f.text).join("\n");
    const css = out.filter((f) => f.path.endsWith(".css")).map((f) => f.text).join("\n");
    const res: Record<string, unknown> = { ok: true, js, css, bytes: js.length + css.length, warnings };

    if (body.host) {
      const slug = String(body.slug || entry).replace(/^apps\//, "").replace(/\.\w+$/, "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60) || "app";
      const path = `apps/${user.id}/${slug}.js`;
      const { data: buckets } = await admin.storage.listBuckets();
      if (!buckets?.some((x) => x.name === BUCKET)) await admin.storage.createBucket(BUCKET, { public: true });
      const payload = JSON.stringify({ name: slug, js, css, packedAt: new Date().toISOString() });
      const { error } = await admin.storage.from(BUCKET).upload(path.replace(/\.js$/, ".json"), new Blob([payload], { type: "application/json" }), { upsert: true, contentType: "application/json", cacheControl: "60" });
      if (error) return json({ error: error.message }, 500);
      res.hostedSrc = admin.storage.from(BUCKET).getPublicUrl(path.replace(/\.js$/, ".json")).data.publicUrl;
    }
    return json(res);
  } catch (e) {
    const msg = e && typeof e === "object" && "errors" in e
      ? (e as { errors: { text: string; location?: { file: string; line: number } }[] }).errors.slice(0, 5).map((x) => (x.location ? `${x.location.file.replace(/^ie:\//, "")}:${x.location.line} ` : "") + x.text).join("\n")
      : e instanceof Error ? e.message : "Pack failed";
    return json({ error: msg }, 400);
  }
});
