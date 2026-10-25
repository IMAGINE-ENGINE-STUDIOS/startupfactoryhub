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
import { resolveLevelWorld, setLevelWorld, worldForKey } from "@/imagine-studio/lib/worldBindings";
import { sceneControllers, normalizeController } from "@/imagine-studio/lib/controllers";
import { AGENT_MODEL_URL } from "@/imagine-studio/lib/officeWorld";
import { Users, Gamepad2 } from "lucide-react";

/** Compact-op vocabulary the studio applies locally; appended to every Genius 3D
 *  prompt so complex scenes can be described in a few ops instead of hundreds. */
const GENIUS_EXTENDED_OPS = `EXTENDED OPS (accepted by this studio — prefer them for large scenes):
- {"op":"repeat","object":OBJ,"count":n,"step":[dx,dy,dz],"rotateStep":rad?} n copies of OBJ in a line (desks, lamps, fences).
- {"op":"grid","object":OBJ,"rows":n,"cols":n,"spacing":[sx,sz],"origin":[x,y,z],"rotateY":rad?} a rows x cols bank of OBJ (desk banks, trees, seats).
- {"op":"ring","object":OBJ,"count":n,"radius":r,"center":[x,y,z],"faceCenter":true?} copies on a circle.
- {"op":"scatter","object":OBJ,"count":n,"bounds":[minX,minZ,maxX,maxZ],"seed":n,"minDist":m} scattered copies.
- {"op":"room","name":str,"center":[x,z],"size":[w,d],"height":h,"windows":"band|full|none","color":"#hex","floorColor":"#hex","openSide":"N|S|E|W"?} floor slab + 4 walls; window walls include a glass band and mullions.
- {"op":"add","object":{"kind":"character","name":str,"url":"/models/plaza/Xbot.glb","position":[x,0,z],"rotation":[0,ry,0],"playable":false}} a character/NPC (models under /models/plaza/: Xbot.glb, Soldier.glb, RobotExpressive.glb — only these three; CesiumMan and RiggedFigure are retired, never add them).
COMPLEX BUILDS: plan the whole scene first, then build it in parts with these compact ops. If the full request does not fit in one reply, build the next part and end your "reply" text with [MORE]; when everything requested exists, end the reply with [DONE]. Never repeat objects that already exist in the context.`;
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
  const namedWorld = resolveLevelWorld(levelId, name);
  const isPlaza = namedWorld?.key === "plaza";
  const isOffice = namedWorld?.key === "office";
  const [socialOpen, setSocialOpen] = useState(false);
  const [ctrlOpen, setCtrlOpen] = useState(false);
  const [ctrlForm, setCtrlForm] = useState<any>(null);
  const [ctrlImport, setCtrlImport] = useState("");
  const [myAgents, setMyAgents] = useState<any[] | null>(null);
  const [agentPick, setAgentPick] = useState('');
  const [agentModel, setAgentModel] = useState(AGENT_MODEL_URL);
  const [agentSeated, setAgentSeated] = useState(true);
  useEffect(() => {
    if (!socialOpen || myAgents !== null) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('call-agents', { body: { action: 'list' } });
        const list = (!error && data && !data.error) ? (data.agents || []) : [];
        setMyAgents(list);
        if (list[0]) setAgentPick(list[0].id);
      } catch { setMyAgents([]); }
    })();
  }, [socialOpen]);
  const addAgentCharacter = () => {
    const a = (myAgents || []).find((x: any) => x.id === agentPick) || (myAgents || [])[0];
    if (!a) { toast.error('Pick an agent first.'); return; }
    const stamp = Date.now().toString(36);
    updateScene((s: any) => ({ ...s, objects: [...(s.objects || []), { id: `agent_${stamp}`, kind: 'character', name: a.name, url: agentModel, position: [0, 0, 5], rotation: [0, Math.PI, 0], scale: [1, 1, 1], visible: true, playable: false, agentId: a.id, startSeated: agentSeated }] }));
    toast.success(`${a.name} added to the scene`, { description: 'An AI agent character with its brain linked — publish, then click it in the live world to open its console.' });
  };
  const social = (scene as any)?.social || {};
  const setSocial = (patch: Record<string, unknown>) =>
    updateScene((s: any) => ({ ...s, social: { ...(s.social || {}), ...patch } }));
  // Controllers: one system for every published world. Definitions live on
  // the scene (scene.controllers), the player uses scene.playerControllerId,
  // and every character carries a controllerId (default on drop).
  const selChar = (scene?.objects || []).find((o: any) => o.id === selectedId && o.kind === "character");
  const customCtrls: any[] = (scene as any)?.controllers || [];
  const upsertController = (def: any) => updateScene((sc: any) => ({ ...sc, controllers: [...((sc.controllers || []) as any[]).filter((c: any) => c.id !== def.id), def] }));
  const setCharController = (cid: string) => updateScene((sc: any) => ({ ...sc, objects: (sc.objects || []).map((o: any) => (o.id === selectedId ? { ...o, controllerId: cid } : o)) }));
  const saveCtrlForm = () => { const def = normalizeController(ctrlForm); if (!def) { toast.error("Controller needs at least a name"); return; } upsertController(def); setCtrlForm(null); toast.success(`Controller "${def.name}" saved to this world`); };
  const importCtrl = () => { const t = ctrlImport.trim(); if (!t) return; let def: any = null; try { def = normalizeController(JSON.parse(t)); } catch { def = null; } if (!def) def = normalizeController({ id: `ctrl-${Date.now().toString(36)}`, name: "Scripted controller", mode: "third", script: t }); if (!def) { toast.error("Could not read that controller"); return; } upsertController(def); setCtrlImport(""); toast.success(`Controller "${def.name}" imported`); };

  const hasTheater = ((scene as any)?.objects || []).some((o: any) => /theater/i.test(o?.name || ""));
  const addTheaterScreen = () => {
    const hexA = (h: string): [number, number, number, number] => { const v = parseInt(h.replace("#", ""), 16); return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255, 1]; };
    const stamp = Date.now().toString(36);
    updateScene((s: any) => {
      if ((s.objects || []).some((o: any) => /theater/i.test(o?.name || ""))) return s;
      const frame = { id: `theater_frame_${stamp}`, kind: "primitive", name: "Theater Frame", shape: "box", position: [0, 2.2, -10.12], rotation: [0, 0, 0], scale: [7.7, 3.7, 0.1], visible: true, color: hexA("#14171c"), metalness: 0, roughness: 0.85 };
      const screen = { id: `theater_screen_${stamp}`, kind: "primitive", name: "Theater Screen", shape: "box", position: [0, 2.2, -10], rotation: [0, 0, 0], scale: [7.2, 3.3, 0.12], visible: true, color: hexA("#0a0f16"), metalness: 0, roughness: 0.4, emissive: "#00e5ff", emissiveIntensity: 0.25 };
      return { ...s, objects: [...(s.objects || []), frame, screen], social: { ...(s.social || {}), theater: true } };
    });
    toast.success("Theater screen added", { description: "It's at the north side of the level — select it in the Scene panel and drag it where you want." });
  };
  const assignRoute = (key: string) => {
    setLevelWorld(levelId, key || null);
    if (key) {
      const w = worldForKey(key);
      toast.success(`Route assigned: startupfactoryhub.com${w?.livePath}`, { description: "Reloading so the editor syncs with the live world." });
      setTimeout(() => window.location.reload(), 700);
    } else {
      toast.success("Public route removed", { description: "This level now publishes to your library only." });
    }
  };

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
      const history = hist.slice(-6).map((m) => ({ role: m.role, content: m.text }));
      /* Complex scenes are built in parts: each round applies its ops, then the
         updated scene goes back as context until Genius ends with [DONE]. */
      let working = sc;
      let appliedTotal = 0;
      let rounds = 0;
      let lastReply = "";
      let roundPrompt = `${prompt.slice(0, 2400)}\n\n${GENIUS_EXTENDED_OPS}`;
      for (;;) {
        const { data, error } = await supabase.functions.invoke("studio-genius", {
          body: { prompt: roundPrompt, context: sceneContext(working, nm, sid), history },
        });
        if (error || data?.error) throw new Error(data?.error || error.message);
        let ops = data.ops || [];
        if (ops.some((o: any) => o?.op === "sketchfab" || o?.op === "optimize" || (o?.op === "level" && o.ops?.some((x: any) => x?.op === "sketchfab")))) {
          if (rounds === 0) setMsgs((m) => [...m, { role: "assistant", text: "Fetching models from Sketchfab…", at: Date.now() }]);
          ops = await resolveOptimizeOps(await resolveSketchfabOps(ops, (t) => toast.message(t)), working, (t) => toast.message(t));
        }
        if (ops.length) {
          const r = applyStudioOps(working, ops, layerId);
          working = r.scene;
          appliedTotal += r.applied;
          updateScene(() => working);
        }
        lastReply = String(data.reply || "");
        rounds++;
        if (!/\[MORE\]/i.test(lastReply) || !ops.length || rounds >= 6) break;
        setMsgs((m) => [...m, { role: "assistant", text: `Building… part ${rounds + 1}`, at: Date.now() }]);
        roundPrompt = `Continue the SAME build for this request: "${prompt.slice(0, 600)}". The scene context shows what already exists — do NOT repeat it. Build the next part now. End your reply with [MORE] if parts still remain, or [DONE] when the full request is complete.\n\n${GENIUS_EXTENDED_OPS}`;
      }
      const cleanReply = lastReply.replace(/\[(MORE|DONE)\]/gi, "").trim() || "Done.";
      const text = `${cleanReply}${appliedTotal ? ` (${appliedTotal} change${appliedTotal === 1 ? "" : "s"}${rounds > 1 ? ` in ${rounds} parts` : ""})` : ""}`;
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
      if (/non-2xx/i.test(msg)) msg = "Publishing failed. Make sure you are signed in" + (isPlaza || isOffice ? " with an admin account." : ".");
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
      const target = namedWorld ? namedWorld.key : "level";
      const data = await callPublish({ target, levelId, name, scene: sc });
      // VERIFY the publish landed in the exact file the player reads, holding
      // exactly this scene. A publish that writes anywhere else is an error,
      // never a success — for every level, current and future.
      const expectedPath = namedWorld ? namedWorld.path : null;
      if (expectedPath && data?.path !== expectedPath) {
        throw new Error(`Publish went to "${data?.path || "an unknown file"}" instead of ${expectedPath} — the live ${isPlaza ? "Plaza" : "Office"} did NOT change. The studio-publish function is out of date.`);
      }
      if (!expectedPath && !(typeof data?.path === "string" && data.path.endsWith(`/${levelId}.json`))) {
        throw new Error(`Publish went to "${data?.path || "an unknown file"}" — the live level did NOT change.`);
      }
      try {
        const check = await fetch(`${data.url}?t=${Date.now()}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
        const landed = check?.scene?.objects?.length;
        if (typeof landed === "number" && landed !== sc.objects.length) {
          throw new Error(`Publish check failed: the live file holds ${landed} objects, this scene has ${sc.objects.length}. The live world did NOT change.`);
        }
      } catch (e: any) { if (/Publish check failed/.test(e?.message || "")) throw e; }
      toast.success(isPlaza ? "Published. Everyone in /plaza now sees this version." : isOffice ? "Published. Everyone in /office now sees this version." : "Level published", { description: data.path });
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
      {((!isPlaza && !isOffice) || isAdmin) && (
        <Button size="sm" variant="outline" className={cls} onClick={publish} disabled={!canEdit || publishing} title={isPlaza ? "Publish to the live Plaza" : isOffice ? "Publish to the live Office" : "Publish this level"}>
          {publishing ? <Loader2 className="w-3.5 h-3.5 sm:mr-1 animate-spin" /> : <Rocket className="w-3.5 h-3.5 sm:mr-1" />}<span className="hidden sm:inline">{isPlaza ? "Publish Plaza" : isOffice ? "Publish Office" : "Publish"}</span>
        </Button>
      )}
      <select
        value={namedWorld?.key ?? ""}
        disabled={!isAdmin}
        onChange={(e) => assignRoute(e.target.value)}
        title={isAdmin ? "Public route this level publishes to — assign it yourself" : "Public route this level publishes to (only admins can change it)"}
        className={`${compact ? "h-7 text-[11px]" : "h-8 text-xs"} bg-transparent border border-input rounded-md px-1 max-w-[104px] sm:max-w-[150px] text-foreground [&>option]:text-black`}
      >
        <option value="">No route</option>
        <option value="plaza">/plaza</option>
        <option value="office">/office</option>
      </select>
      {namedWorld && (
        <a href={namedWorld.livePath} target="_blank" rel="noreferrer" className={`${cls} hidden md:inline-flex items-center text-muted-foreground hover:text-foreground`} title={`Open the live world: startupfactoryhub.com${namedWorld.livePath}`}>
          Live
        </a>
      )}
      <Button size="sm" variant="ghost" className={cls} onClick={() => setSocialOpen((o) => !o)} disabled={!canEdit} title="Social features: let people join this world together, like the Plaza">
        <Users className="w-3.5 h-3.5 sm:mr-1" /><span className="hidden sm:inline">Social</span>
      </Button>
      <Button size="sm" variant="ghost" className={cls} onClick={() => setCtrlOpen((o) => !o)} disabled={!canEdit} title="Controllers: the movement/camera system for this world and its characters">
        <Gamepad2 className="w-3.5 h-3.5 sm:mr-1" /><span className="hidden sm:inline">Controllers</span>
      </Button>
      {socialOpen && (
        <div className="fixed right-3 top-16 z-[80] w-[320px] max-w-[92vw] rounded-xl border border-border bg-background/97 backdrop-blur-xl shadow-2xl p-4 text-left">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm flex items-center gap-2"><Users className="w-4 h-4" />Social features</div>
            <button onClick={() => setSocialOpen(false)} className="text-muted-foreground hover:text-foreground text-xs">Close</button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Let people join this world together — the same social layer as the Plaza. Settings save inside the level and travel with it when published. Named worlds (/plaza, /office) have these on by default.</p>
          <div className="mt-3 space-y-2.5">
            {([
              ["presence", "Multiplayer presence", "Visitors see each other as avatars, live."],
              ["voice", "Voice chat", "Spatial voice — people sound closer when they are closer."],
              ["chat", "Text chat", "A chat panel inside the world."],
              ["theater", "Theater sharing", "Admins can share a screen, camera, document or dashboard on the big screen."],
            ] as const).map(([key, label, hint]) => (
              <label key={key} className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" className="mt-0.5" checked={social[key] !== undefined ? !!social[key] : !!namedWorld} onChange={(e) => setSocial({ [key]: e.target.checked })} />
                <span>
                  <span className="block text-xs font-medium">{label}</span>
                  <span className="block text-[11px] text-muted-foreground">{hint}</span>
                </span>
              </label>
            ))}
          </div>
          <button onClick={addTheaterScreen} disabled={hasTheater} className="mt-3.5 w-full rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50">
            {hasTheater ? "Theater screen already in this scene" : "Add a theater screen to this scene"}
          </button>
          <div className="border-t border-border mt-3 pt-3 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">AI agent characters</div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">Drop one of your Agents-tab agents into this scene as a character with an AI brain. It renders in the published world; visitors click it to open its agent console.</p>
            {myAgents === null ? (
              <div className="text-[11px] text-muted-foreground">Loading your agents…</div>
            ) : myAgents.length === 0 ? (
              <div className="text-[11px] text-muted-foreground">No agents found for your account — create one in any dashboard&rsquo;s Agents tab first.</div>
            ) : (
              <>
                <select value={agentPick} onChange={(e) => setAgentPick(e.target.value)} className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs">
                  {myAgents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <select value={agentModel} onChange={(e) => setAgentModel(e.target.value)} className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs">
                  <option value={AGENT_MODEL_URL}>Character: Signature Agent</option>
                </select>
                <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <input type="checkbox" checked={agentSeated} onChange={(e) => setAgentSeated(e.target.checked)} /> Starts seated (at a desk or chair)
                </label>
                <button onClick={addAgentCharacter} className="w-full h-8 rounded-md bg-fuchsia-600 text-white text-xs font-medium hover:bg-fuchsia-500">Add agent character to scene</button>
              </>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2.5 leading-relaxed">Tip: bind this level to a public route (the route selector next to Publish) so people can open it at its own address and join each other there.</p>
        </div>
      )}
      {ctrlOpen && (
        <div className="fixed right-3 top-16 z-[80] w-[330px] max-w-[92vw] max-h-[84vh] overflow-y-auto rounded-xl border border-border bg-background/97 backdrop-blur-xl shadow-2xl p-4 text-left">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm flex items-center gap-2"><Gamepad2 className="w-4 h-4" />Controllers</div>
            <button onClick={() => setCtrlOpen(false)} className="text-muted-foreground hover:text-foreground text-xs">Close</button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">One controller system drives every published world — plaza, office and the play test. Characters carry a controller (new ones get the default), and controllers can be created here by form, by pasting JSON or code, or by asking Genius. Everything saves inside the level and publishes with it.</p>
          <div className="mt-3 space-y-2">
            <label className="block">
              <span className="block text-[11px] font-medium mb-1">Player controller (this world)</span>
              <select value={(scene as any)?.playerControllerId || "default"} onChange={(e) => updateScene((sc: any) => ({ ...sc, playerControllerId: e.target.value }))} className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs">
                {sceneControllers(scene).map((d) => <option key={d.id} value={d.id}>{d.name} ({d.mode})</option>)}
              </select>
            </label>
            {selChar ? (
              <label className="block">
                <span className="block text-[11px] font-medium mb-1">Selected character: {selChar.name}</span>
                <select value={selChar.controllerId || "default"} onChange={(e) => setCharController(e.target.value)} className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs">
                  {sceneControllers(scene).map((d) => <option key={d.id} value={d.id}>{d.name} ({d.mode})</option>)}
                </select>
              </label>
            ) : (
              <p className="text-[11px] text-muted-foreground">Select a character in the scene to give it a different controller.</p>
            )}
          </div>
          <div className="border-t border-border mt-3 pt-3 space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">This world&rsquo;s controllers</div>
            {customCtrls.length === 0 && <p className="text-[11px] text-muted-foreground">Only the built-ins so far: Default (third person), First person, NPC.</p>}
            {customCtrls.map((c: any) => (
              <div key={c.id} className="flex items-center gap-2 text-xs">
                <span className="flex-1 truncate">{c.name} <span className="text-muted-foreground">({c.mode})</span></span>
                <button onClick={() => setCtrlForm({ ...c })} className="text-primary hover:underline">Edit</button>
                <button onClick={() => updateScene((sc: any) => ({ ...sc, controllers: ((sc.controllers || []) as any[]).filter((x: any) => x.id !== c.id) }))} className="text-destructive hover:underline">Delete</button>
              </div>
            ))}
            {!ctrlForm && <button onClick={() => setCtrlForm({ id: `ctrl-${Date.now().toString(36)}`, name: "New controller", mode: "third", walkSpeed: 4.2, sprintMultiplier: 1.7, canJump: true, jumpHeight: 1.1, cameraDistance: 6.5, cameraHeight: 2.6, script: "" })} className="w-full h-8 rounded-md border border-border text-xs font-medium hover:bg-muted">+ New controller</button>}
          </div>
          {ctrlForm && (
            <div className="border-t border-border mt-3 pt-3 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Controller editor</div>
              <input value={ctrlForm.name} onChange={(e) => setCtrlForm({ ...ctrlForm, name: e.target.value })} placeholder="Name" className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs" />
              <select value={ctrlForm.mode} onChange={(e) => setCtrlForm({ ...ctrlForm, mode: e.target.value })} className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs">
                <option value="third">Third person</option><option value="first">First person</option><option value="npc">NPC (not player-controlled)</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px]">Walk speed<input type="number" step="0.1" value={ctrlForm.walkSpeed} onChange={(e) => setCtrlForm({ ...ctrlForm, walkSpeed: parseFloat(e.target.value) || 0 })} className="mt-0.5 w-full h-8 rounded-md border border-border bg-background px-2 text-xs" /></label>
                <label className="text-[11px]">Sprint x<input type="number" step="0.1" value={ctrlForm.sprintMultiplier} onChange={(e) => setCtrlForm({ ...ctrlForm, sprintMultiplier: parseFloat(e.target.value) || 1 })} className="mt-0.5 w-full h-8 rounded-md border border-border bg-background px-2 text-xs" /></label>
                <label className="text-[11px]">Jump height<input type="number" step="0.1" value={ctrlForm.jumpHeight} onChange={(e) => setCtrlForm({ ...ctrlForm, jumpHeight: parseFloat(e.target.value) || 0 })} className="mt-0.5 w-full h-8 rounded-md border border-border bg-background px-2 text-xs" /></label>
                <label className="text-[11px]">Camera distance<input type="number" step="0.5" value={ctrlForm.cameraDistance} onChange={(e) => setCtrlForm({ ...ctrlForm, cameraDistance: parseFloat(e.target.value) || 0 })} className="mt-0.5 w-full h-8 rounded-md border border-border bg-background px-2 text-xs" /></label>
                <label className="text-[11px]">Camera height<input type="number" step="0.1" value={ctrlForm.cameraHeight} onChange={(e) => setCtrlForm({ ...ctrlForm, cameraHeight: parseFloat(e.target.value) || 0 })} className="mt-0.5 w-full h-8 rounded-md border border-border bg-background px-2 text-xs" /></label>
                <label className="text-[11px] flex items-end gap-2 pb-1"><input type="checkbox" checked={ctrlForm.canJump !== false} onChange={(e) => setCtrlForm({ ...ctrlForm, canJump: e.target.checked })} /> Can jump</label>
              </div>
              <textarea value={ctrlForm.script || ""} onChange={(e) => setCtrlForm({ ...ctrlForm, script: e.target.value })} placeholder="Optional script, runs every frame: api = { dt, input:{x,z,sprint,jump}, position (mutable Vector3), yaw, speed, setSpeed(mult) }" rows={4} className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-[11px] font-mono" />
              <div className="flex gap-2">
                <button onClick={saveCtrlForm} className="flex-1 h-8 rounded-md bg-primary text-primary-foreground text-xs font-medium">Save controller</button>
                <button onClick={() => setCtrlForm(null)} className="h-8 px-3 rounded-md border border-border text-xs">Cancel</button>
              </div>
            </div>
          )}
          <div className="border-t border-border mt-3 pt-3 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Import by code</div>
            <textarea value={ctrlImport} onChange={(e) => setCtrlImport(e.target.value)} placeholder='Paste a controller JSON object — or paste raw script code and it becomes a scripted controller' rows={3} className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-[11px] font-mono" />
            <button onClick={importCtrl} className="w-full h-8 rounded-md border border-border text-xs font-medium hover:bg-muted">Import controller</button>
          </div>
        </div>
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
