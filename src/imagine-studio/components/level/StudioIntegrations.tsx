// @ts-nocheck -- Imagine Studio v2
/**
 * 3D Studio <-> platform wiring: Sketchfab library, file drops onto the
 * viewport, Genius 3D (bubble tab + Genius AI requests), Dev tab scene
 * sync (scenes/level.json) and publishing.
 */
import { useEffect, useRef, useState } from "react";
import { Library, Sparkles, Rocket, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import SketchfabModal from "@/imagine-studio/components/level/SketchfabModal";
import { studio3d, type Studio3DMsg } from "@/lib/studio3dBus";
import { applyStudioOps, sceneContext } from "@/imagine-studio/lib/studioOps";
import { PLAZA_LEVEL_NAME } from "@/imagine-studio/lib/plazaLevel";
import { NATIVE_FORMATS, extOf, importModelFile } from "@/imagine-studio/lib/model-import";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/** Resolves Genius "sketchfab" ops into real model "add" ops (search, download, normalize size). */
/** Resolves Genius "optimize" ops (one id, or "all" heavy models) into lighter model files. */
async function resolveOptimizeOps(ops: any[], scene: any, note: (t: string) => void): Promise<any[]> {
  const out: any[] = [];
  for (const op of ops || []) {
    if (op?.op !== "optimize") { out.push(op); continue; }
    const { optimizeModelUrl, OPTIMIZE_LEVELS } = await import("./ModelOptimizer");
    const ratio = (OPTIMIZE_LEVELS as any)[op.level] ?? OPTIMIZE_LEVELS.lighter;
    const targets = (scene?.objects || []).filter((o: any) => o.kind === "model" && o.url && (!op.id || op.id === "all" || o.id === op.id || o.name === op.id));
    for (const o of targets) {
      try {
        const r = await optimizeModelUrl(o.url, ratio);
        if (r.after >= r.before) continue;
        out.push({ op: "update", id: o.id, patch: { url: r.url, originalUrl: o.originalUrl || o.url, optimized: { level: op.level || "lighter", before: r.before, after: r.after } } });
        note(`Optimized ${o.name || o.id}: ${r.before.toLocaleString()} to ${r.after.toLocaleString()} triangles`);
      } catch (e: any) { note(`Optimize ${o.name || o.id}: ${e.message || "failed"}`); }
    }
  }
  return out;
}

async function resolveSketchfabOps(ops: any[], note: (t: string) => void): Promise<any[]> {
  const out: any[] = [];
  for (const op of ops || []) {
    if (op?.op === "level" && Array.isArray(op.ops)) { out.push({ ...op, ops: await resolveSketchfabOps(op.ops, note) }); continue; }
    if (op?.op !== "sketchfab") { out.push(op); continue; }
    try {
      // Try the main query, then the AI's fallbacks, then shorter versions of the query.
      const base = String(op.query || op.name || "model");
      const words = base.split(/\s+/).filter(Boolean);
      const tries = [base, ...(Array.isArray(op.fallback) ? op.fallback.map(String) : []), words.slice(-2).join(" "), words.slice(-1).join(" "), op.name].filter((x, i, a) => x && a.indexOf(x) === i);
      let list: any[] = [];
      for (const q of tries) {
        for (const maxFaces of [op.maxFaces ?? 100000, 300000]) {
          const sr = await supabase.functions.invoke("sketchfab-proxy", { body: { action: "search", q, maxFaces } });
          list = sr.data?.results || [];
          if (list.length) break;
        }
        if (list.length) break;
      }
      if (!list.length) throw new Error(`no model for "${base}"`);
      let file: File | null = null, credit = "";
      for (const m of list.slice(0, 5)) {
        const d = await supabase.functions.invoke("sketchfab-proxy", { body: { action: "download", uid: m.uid } });
        if (d.error || d.data?.error || !d.data?.url) continue;
        const r = await fetch(d.data.url); if (!r.ok) continue;
        const zip = d.data.format !== "glb";
        file = new File([await r.blob()], `${(m.name || "model").replace(/[^a-zA-Z0-9 _-]/g, "").trim() || "model"}.${zip ? "zip" : "glb"}`);
        credit = `${m.name} by ${m.author} (${m.license})`; break;
      }
      if (!file) throw new Error(`could not download "${op.query}"`);
      const imp = await importModelFile(file);
      const size = typeof op.size === "number" ? op.size : 2;
      let scale = 1, lift = 0;
      try {
        const g = await new GLTFLoader().loadAsync(imp.url);
        const box = new THREE.Box3().setFromObject(g.scene); const dim = box.getSize(new THREE.Vector3());
        scale = size / Math.max(dim.x, dim.y, dim.z, 1e-3); lift = -box.min.y * scale;
      } catch {}
      const pos = Array.isArray(op.position) ? op.position : [0, 0, 0];
      out.push({ op: "add", object: { kind: "model", id: op.id, name: op.name || imp.fileName.replace(/\.[^.]+$/, ""), url: imp.url, fileName: imp.fileName, position: [pos[0], (pos[1] || 0) + lift, pos[2]], rotation: op.rotation, scale: [scale, scale, scale] } });
      if (op.behavior && op.id) out.push({ op: "play", id: op.id, behavior: op.behavior });
      note(`Added ${credit} via Sketchfab`);
      if (!op.behavior) setTimeout(() => (window as any).__ieAskCollisions?.(1), 800);
    } catch (e: any) { note(`Sketchfab: ${e.message || "failed"}`); }
  }
  return out;
}

type Props = {
  levelId: string;
  name: string;
  scene: any;
  updateScene: (mut: (s: any) => any) => void;
  selectedId: string | null;
  layerId?: string;
  canEdit: boolean;
  compact?: boolean;
  importFile: (file: File) => Promise<void>;
  save: () => Promise<void> | void;
};

export default function StudioIntegrations({ levelId, name, scene, updateScene, selectedId, layerId, canEdit, compact, importFile, save }: Props) {
  const [libOpen, setLibOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [msgs, setMsgs] = useState<Studio3DMsg[]>([]);
  const [busy, setBusy] = useState(false);
  const live = useRef({ scene, selectedId, name, busy, msgs });
  live.current = { scene, selectedId, name, busy, msgs };
  const embedded = typeof window !== "undefined" && window.parent !== window;
  const isPlaza = name === PLAZA_LEVEL_NAME;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" }).then(({ data: a }) => setIsAdmin(!!a));
    });
  }, []);

  /* ---- Genius 3D ---- */
  const sel = scene.objects.find((o) => o.id === selectedId);
  useEffect(() => {
    studio3d.publish({ levelId, levelName: name, selected: sel?.name ?? null, objectCount: scene.objects.length, busy, msgs });
  }, [levelId, name, sel?.name, scene.objects.length, busy, msgs]);
  useEffect(() => () => studio3d.publish(null), []);

  const runGenius = async (prompt: string, fromEngine = false) => {
    if (live.current.busy) return;
    if (!canEdit) { toast.error("Only the level owner can edit this level"); return; }
    const userMsg = { role: "user" as const, text: prompt, at: Date.now() };
    setMsgs((m) => [...m, userMsg]);
    setBusy(true);
    try {
      const { scene: sc, selectedId: sid, name: nm, msgs: hist } = live.current;
      const { data, error } = await supabase.functions.invoke("studio-genius", {
        body: { prompt, context: sceneContext(sc, nm, sid), history: hist.slice(-6).map((m) => ({ role: m.role, content: m.text })) },
      });
      if (error || data?.error) throw new Error(data?.error || error.message);
      let applied = 0;
      if (data.ops?.some((o: any) => o?.op === "sketchfab" || o?.op === "optimize" || (o?.op === "level" && o.ops?.some((x: any) => x?.op === "sketchfab")))) {
        setMsgs((m) => [...m, { role: "assistant", text: "Fetching models from Sketchfab…", at: Date.now() }]);
        data.ops = await resolveOptimizeOps(await resolveSketchfabOps(data.ops, (t) => toast.message(t)), scene, (t) => toast.message(t));
      }
      if (data.ops?.length) {
        updateScene((s) => { const r = applyStudioOps(s, data.ops, layerId); applied = r.applied; return r.scene; });
      }
      const text = `${data.reply}${data.ops?.length ? ` (${data.ops.length} change${data.ops.length === 1 ? "" : "s"})` : ""}`;
      setMsgs((m) => [...m, { role: "assistant", text, at: Date.now() }]);
      if (fromEngine && embedded) window.parent.postMessage({ __IEStudio: "reply", text }, "*");
    } catch (e: any) {
      setMsgs((m) => [...m, { role: "assistant", text: e.message || "Genius 3D failed", at: Date.now(), error: true }]);
    }
    setBusy(false);
  };
  useEffect(() => studio3d.onSend((t) => runGenius(t)), [canEdit, layerId]);

  // Prompt passed on the URL (Genius AI "build in 3D" opens the studio with ?genius=)
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    const p = new URLSearchParams(window.location.search).get("genius");
    if (!p || !canEdit) return;
    startedRef.current = true;
    const url = new URL(window.location.href); url.searchParams.delete("genius"); window.history.replaceState(null, "", url.toString());
    setTimeout(() => runGenius(p, true), 600);
  }, [canEdit]);

  /* ---- Imagine Engine (parent frame): Genius requests, Dev tab sync ---- */
  const lastJson = useRef("");
  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      const d = ev.data; if (!d || !d.__IEStudio) return;
      if (d.__IEStudio === "genius" && d.prompt) runGenius(String(d.prompt), true);
      if (d.__IEStudio === "load" && d.json && d.json !== lastJson.current) {
        try {
          const next = JSON.parse(d.json);
          if (!Array.isArray(next.objects)) return;
          lastJson.current = d.json;
          updateScene((s) => ({ ...s, ...next }));
          toast.success("Scene updated from the Dev tab");
        } catch {}
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [canEdit, layerId]);
  useEffect(() => {
    if (!embedded) return;
    const t = setTimeout(() => {
      const { userClipLibrary, ...rest } = scene;
      const json = JSON.stringify(rest, (k, v) => (typeof v === "string" && v.startsWith("data:") && v.length > 2000 ? "[embedded file]" : v), 2);
      if (json === lastJson.current) return;
      lastJson.current = json;
      window.parent.postMessage({ __IEStudio: "scene", json, levelId, name }, "*");
    }, 800);
    return () => clearTimeout(t);
  }, [scene]);

  /* ---- After a model lands: offer auto tracing + collisions ---- */
  const askCollisions = (count: number) => {
    toast("Make the new model walkable and solid?", {
      description: "Characters can walk on its floors and are blocked by its walls and objects.",
      duration: 15000,
      action: {
        label: "Yes, auto trace",
        onClick: () => {
          let ids: string[] = [];
          updateScene((s) => {
            const models = s.objects.filter((o: any) => o.kind === "model").slice(-count);
            ids = models.map((m: any) => m.id);
            return { ...s, objects: s.objects.map((o: any) => ids.includes(o.id) ? { ...o, playBehavior: { ...(o.playBehavior || {}), collision: "walkable" } } : o) };
          });
          const names = live.current.scene.objects.filter((o: any) => ids.includes(o.id)).map((o: any) => o.name).join(", ");
          runGenius(`Auto trace collisions for the model(s) just added${names ? ` (${names})` : ""}: keep them walkable on floors, and add invisible blocking boxes (primitive boxes with behavior {"collision":"blocking","invisibleInPlay":true}) around their walls and solid objects so characters cannot walk through them.`);
        },
      },
      cancel: { label: "No", onClick: () => {} },
    });
  };
  if (typeof window !== "undefined") (window as any).__ieAskCollisions = askCollisions;

  /* ---- Drag & drop model files onto the viewport ---- */
  useEffect(() => {
    let depth = 0;
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types || []).includes("Files");
    const enter = (e: DragEvent) => { if (!hasFiles(e)) return; e.preventDefault(); depth++; setDragging(true); };
    const over = (e: DragEvent) => { if (hasFiles(e)) e.preventDefault(); };
    const leave = (e: DragEvent) => { if (!hasFiles(e)) return; depth = Math.max(0, depth - 1); if (!depth) setDragging(false); };
    const drop = async (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault(); depth = 0; setDragging(false);
      if (!canEdit) { toast.error("Only the level owner can add models"); return; }
      const files = Array.from(e.dataTransfer?.files || []);
      const ok = files.filter((f) => NATIVE_FORMATS.includes(extOf(f.name)));
      if (!ok.length) { toast.error(`Drop a 3D model: ${NATIVE_FORMATS.map((x) => "." + x).join(", ")}`); return; }
      for (const f of ok) await importFile(f);
      askCollisions(ok.length);
    };
    window.addEventListener("dragenter", enter); window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave); window.addEventListener("drop", drop);
    return () => { window.removeEventListener("dragenter", enter); window.removeEventListener("dragover", over); window.removeEventListener("dragleave", leave); window.removeEventListener("drop", drop); };
  }, [canEdit, importFile]);

  /* ---- Publish ---- */
  const callPublish = async (body: any) => {
    const { data, error } = await supabase.functions.invoke("studio-publish", { body });
    if (error) {
      let msg = error.message;
      try { const j = await (error as any).context?.json?.(); if (j?.error) msg = j.error; } catch {}
      if (/non-2xx/i.test(msg)) msg = "Publishing failed. Make sure you are signed in" + (isPlaza ? " with an admin account." : ".");
      throw new Error(msg);
    }
    if (data?.error) throw new Error(data.error);
    return data;
  };
  /** Uploads embedded (data:/blob:) model files so the published scene only holds links. */
  const hostAssets = async (scene: any) => {
    const cache = new Map<string, string>();
    const copy = JSON.parse(JSON.stringify(scene));
    const walk = async (o: any) => {
      if (!o || typeof o !== "object") return;
      for (const k of Object.keys(o)) {
        const v = o[k];
        if (typeof v === "string" && (v.startsWith("data:") || v.startsWith("blob:")) && v.length > 64) {
          if (!cache.has(v)) {
            const blob = await (await fetch(v)).blob();
            const ext = /image\/png/.test(blob.type) ? "png" : /image\/jpe?g/.test(blob.type) ? "jpg" : "glb";
            const a = await callPublish({ action: "asset", ext });
            const up = await supabase.storage.from("studio-published").uploadToSignedUrl(a.path, a.token, blob, { contentType: blob.type || "model/gltf-binary" });
            if (up.error) throw new Error(up.error.message);
            cache.set(v, a.publicUrl);
          }
          o[k] = cache.get(v);
        } else if (v && typeof v === "object") await walk(v);
      }
    };
    await walk(copy);
    return copy;
  };
  const publish = async () => {
    setPublishing(true);
    try {
      await save();
      const sc = await hostAssets(live.current.scene);
      const data = await callPublish({ target: isPlaza ? "plaza" : "level", levelId, name, scene: sc });
      toast.success(isPlaza ? "Published. Everyone in /plaza now sees this version." : "Level published", isPlaza ? undefined : { description: data.url });
    } catch (e: any) { toast.error(e.message || "Publish failed"); }
    setPublishing(false);
  };

  const cls = compact ? "h-7 px-2 text-[11px]" : "h-8 text-xs";
  return (
    <>
      <Button size="sm" variant="ghost" className={cls} onClick={() => setLibOpen(true)} disabled={!canEdit} title="Sketchfab model library">
        <Library className="w-3.5 h-3.5 sm:mr-1" /><span className="hidden sm:inline">Library</span>
      </Button>
      <Button size="sm" variant="secondary" className={cls} onClick={() => studio3d.open()} title="Genius 3D: ask for changes to this level">
        {busy ? <Loader2 className="w-3.5 h-3.5 sm:mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 sm:mr-1" />}<span className="hidden sm:inline">Genius 3D</span>
      </Button>
      {(!isPlaza || isAdmin) && (
        <Button size="sm" variant="outline" className={cls} onClick={publish} disabled={!canEdit || publishing} title={isPlaza ? "Publish to the live Plaza" : "Publish this level"}>
          {publishing ? <Loader2 className="w-3.5 h-3.5 sm:mr-1 animate-spin" /> : <Rocket className="w-3.5 h-3.5 sm:mr-1" />}<span className="hidden sm:inline">{isPlaza ? "Publish Plaza" : "Publish"}</span>
        </Button>
      )}
      <SketchfabModal open={libOpen} onOpenChange={setLibOpen} onSpawn={async (file, credit) => { await importFile(file); toast.message(credit); }} />
      {dragging && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center ring-2 ring-inset ring-primary bg-primary/5">
          <div className="rounded-xl bg-background/90 px-5 py-3 text-sm font-medium flex items-center gap-2 border border-border/50">
            <Upload className="w-4 h-4 text-primary" />Drop 3D model files to add them to the scene
          </div>
        </div>
      )}
    </>
  );
}
