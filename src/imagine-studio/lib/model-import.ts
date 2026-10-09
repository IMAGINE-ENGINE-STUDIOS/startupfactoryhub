// @ts-nocheck -- imported Imagine Studio v2
import * as THREE from "three";
import {
  OBJLoader,
  FBXLoader,
  STLLoader,
  ColladaLoader,
  TDSLoader,
  PLYLoader,
  GLTFExporter,
} from "three-stdlib";
import DxfParser from "dxf-parser";
import { unzipSync } from "fflate";
import { GLTFLoader, MTLLoader } from "three-stdlib";

/** Opens a .zip (Sketchfab glTF zips or user uploads) and imports the model inside. */
async function importZip(file: File): Promise<string> {
  const files = unzipSync(new Uint8Array(await readArrayBuffer(file)));
  const names = Object.keys(files).filter((n) => !n.startsWith("__MACOSX") && !n.endsWith("/"));
  const mime = (n: string) => (/\.png$/i.test(n) ? "image/png" : /\.jpe?g$/i.test(n) ? "image/jpeg" : /\.webp$/i.test(n) ? "image/webp" : "application/octet-stream");
  const urls = new Map<string, string>();
  for (const n of names) urls.set(n.toLowerCase(), URL.createObjectURL(new Blob([files[n]], { type: mime(n) })));
  const base = (n: string) => n.split("/").pop()!.toLowerCase();
  const resolve = (from: string, rel: string) => {
    const clean = decodeURIComponent(rel.replace(/^\.\//, "")).toLowerCase();
    const dir = from.includes("/") ? from.slice(0, from.lastIndexOf("/") + 1).toLowerCase() : "";
    return urls.get(dir + clean) || urls.get(clean) || [...urls.entries()].find(([k]) => base(k) === base(clean))?.[1];
  };
  const pick = (re: RegExp) => names.filter((n) => re.test(n)).sort((a, b) => a.split("/").length - b.split("/").length)[0];
  try {
    const glb = pick(/\.glb$/i);
    if (glb) return await sceneOrGroupToGLB((await new GLTFLoader().parseAsync(files[glb].buffer.slice(files[glb].byteOffset, files[glb].byteOffset + files[glb].byteLength), "")).scene);
    const gltf = pick(/\.gltf$/i);
    if (gltf) {
      const mgr = new THREE.LoadingManager();
      mgr.setURLModifier((u) => (u.startsWith("blob:") || u.startsWith("data:") ? u : resolve(gltf, u.replace(/^.*?blob:[^/]*\/[^/]*\//, "")) || u));
      const text = new TextDecoder().decode(files[gltf]);
      const res: any = await new Promise((ok, bad) => new GLTFLoader(mgr).parse(text, "", ok, bad));
      return await sceneOrGroupToGLB(res.scene);
    }
    const obj = pick(/\.obj$/i);
    if (obj) {
      const loader = new OBJLoader();
      const mtl = pick(/\.mtl$/i);
      if (mtl) {
        const mgr = new THREE.LoadingManager(); mgr.setURLModifier((u) => resolve(mtl, u.split("/").pop() || u) || u);
        const mats = new MTLLoader(mgr).parse(new TextDecoder().decode(files[mtl]), ""); mats.preload(); loader.setMaterials(mats);
      }
      return await sceneOrGroupToGLB(loader.parse(new TextDecoder().decode(files[obj])));
    }
    const other = pick(/\.(fbx|stl|dae|3ds|ply)$/i);
    if (other) return (await importModelFile(new File([files[other]], base(other)))).url;
    throw new Error("No 3D model found inside the zip (looked for .glb, .gltf, .obj, .fbx, .stl, .dae, .ply).");
  } finally {
    setTimeout(() => urls.forEach((u) => URL.revokeObjectURL(u)), 30000);
  }
}

/**
 * Re-export USDZ helpers here so callers can `import { downloadAsUsdz }`
 * from a single module alongside the existing importers.
 */
export { gltfUrlToUsdz, downloadAsUsdz, downloadBlob } from "./usdz-export";

export interface ImportedModel {
  /** glb data URL ready to feed into useGLTF. */
  url: string;
  /** Original lowercase extension without dot. */
  sourceFormat: string;
  fileName: string;
}

export const NATIVE_FORMATS = [
  "glb",
  "gltf",
  "obj",
  "fbx",
  "stl",
  "dae",
  "3ds",
  "ply",
  "dxf",
  "zip",
] as const;

export const CAD_FORMATS = [
  "skp",
  "step",
  "stp",
  "iges",
  "igs",
  "ifc",
  "rvt",
  "rfa",
  "max",
  "vwx",
  "dwg",
] as const;

export function extOf(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

function readArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(r.error);
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.readAsArrayBuffer(file);
  });
}

function readText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(r.error);
    r.onload = () => resolve(r.result as string);
    r.readAsText(file);
  });
}

function readDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(r.error);
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(file);
  });
}

async function sceneOrGroupToGLB(root: THREE.Object3D): Promise<string> {
  // Make sure every mesh has a sane PBR material so the editor can apply
  // overrides afterwards.
  root.traverse((n: any) => {
    if (n.isMesh) {
      if (!n.material || Array.isArray(n.material) === false && !("isMeshStandardMaterial" in n.material)) {
        const old = n.material;
        const color = old && old.color ? old.color.clone() : new THREE.Color(0xcccccc);
        n.material = new THREE.MeshStandardMaterial({
          color,
          metalness: 0.1,
          roughness: 0.8,
        });
      }
    }
  });

  const exporter = new GLTFExporter();
  const buf: ArrayBuffer = await new Promise((resolve, reject) => {
    exporter.parse(
      root,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(result);
        else reject(new Error("GLTFExporter returned JSON, expected binary"));
      },
      (err) => reject(err),
      { binary: true, embedImages: true } as any,
    );
  });
  // ArrayBuffer → base64 data URL
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return `data:model/gltf-binary;base64,${b64}`;
}

function dxfToGroup(parsed: any): THREE.Group {
  // Minimal DXF → THREE.Group renderer for 2D entities (LINE, LWPOLYLINE,
  // POLYLINE, CIRCLE, ARC). Keeps everything in the XY plane.
  const group = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color: 0xdddddd });
  const entities = (parsed && parsed.entities) || [];
  const addLine = (pts: THREE.Vector3[]) => {
    if (pts.length < 2) return;
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    group.add(new THREE.Line(g, mat));
  };
  for (const e of entities) {
    if (e.type === "LINE") {
      addLine([
        new THREE.Vector3(e.vertices[0].x, e.vertices[0].y, 0),
        new THREE.Vector3(e.vertices[1].x, e.vertices[1].y, 0),
      ]);
    } else if (e.type === "LWPOLYLINE" || e.type === "POLYLINE") {
      const pts = (e.vertices || []).map(
        (v: any) => new THREE.Vector3(v.x, v.y, 0),
      );
      if (e.shape) pts.push(pts[0]);
      addLine(pts);
    } else if (e.type === "CIRCLE") {
      const seg = 64;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI * 2;
        pts.push(new THREE.Vector3(e.center.x + Math.cos(a) * e.radius, e.center.y + Math.sin(a) * e.radius, 0));
      }
      addLine(pts);
    } else if (e.type === "ARC") {
      const seg = 64;
      const start = (e.startAngle ?? 0) * (Math.PI / 180);
      const end = (e.endAngle ?? 0) * (Math.PI / 180);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= seg; i++) {
        const a = start + (i / seg) * (end - start);
        pts.push(new THREE.Vector3(e.center.x + Math.cos(a) * e.radius, e.center.y + Math.sin(a) * e.radius, 0));
      }
      addLine(pts);
    }
  }
  return group;
}

/**
 * Loads any supported file and returns a glb data URL plus the original
 * source format. For glb/gltf we just pass through (file → data URL). For
 * everything else we parse with three-stdlib and re-export as glb so the
 * rest of the editor (which expects glTF) keeps working unchanged.
 */
export async function importModelFile(file: File): Promise<ImportedModel> {
  const ext = extOf(file.name);
  const base = { fileName: file.name, sourceFormat: ext };

  if (ext === "zip") return { ...base, url: await importZip(file) };

  if (ext === "glb" || ext === "gltf") {
    const url = await readDataURL(file);
    return { ...base, url };
  }

  if (ext === "obj") {
    const text = await readText(file);
    const group = new OBJLoader().parse(text);
    return { ...base, url: await sceneOrGroupToGLB(group) };
  }

  if (ext === "fbx") {
    const buf = await readArrayBuffer(file);
    const group = new FBXLoader().parse(buf, "");
    return { ...base, url: await sceneOrGroupToGLB(group) };
  }

  if (ext === "stl") {
    const buf = await readArrayBuffer(file);
    const geom = new STLLoader().parse(buf);
    const mat = new THREE.MeshStandardMaterial({ color: 0xb0b0b0, metalness: 0.2, roughness: 0.7 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = file.name.replace(/\.[^.]+$/, "");
    return { ...base, url: await sceneOrGroupToGLB(mesh) };
  }

  if (ext === "dae") {
    const text = await readText(file);
    const collada = new ColladaLoader().parse(text, "");
    return { ...base, url: await sceneOrGroupToGLB(collada.scene) };
  }

  if (ext === "3ds") {
    const buf = await readArrayBuffer(file);
    const group = new TDSLoader().parse(buf, "");
    return { ...base, url: await sceneOrGroupToGLB(group) };
  }

  if (ext === "ply") {
    const buf = await readArrayBuffer(file);
    const geom = new PLYLoader().parse(buf);
    geom.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.1,
      roughness: 0.8,
      vertexColors: !!geom.getAttribute("color"),
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = file.name.replace(/\.[^.]+$/, "");
    return { ...base, url: await sceneOrGroupToGLB(mesh) };
  }

  if (ext === "dxf") {
    const text = await readText(file);
    const parser = new DxfParser();
    const parsed = parser.parseSync(text);
    const group = dxfToGroup(parsed);
    return { ...base, url: await sceneOrGroupToGLB(group) };
  }

  throw new Error(`Unsupported file format: .${ext}`);
}

export function isCadFormat(ext: string): boolean {
  return (CAD_FORMATS as readonly string[]).includes(ext);
}

export function isNativeFormat(ext: string): boolean {
  return (NATIVE_FORMATS as readonly string[]).includes(ext);
}

/**
 * Convert a CAD format that requires server-side translation via the
 * Autodesk Platform Services (APS) edge function. Returns a glb data URL
 * the editor can consume just like a native import.
 */
export async function convertCadViaAps(
  file: File,
  invoke: (fnName: string, opts: { body: any }) => Promise<{ data: any; error: any }>,
): Promise<ImportedModel> {
  const ext = extOf(file.name);
  const buf = await readArrayBuffer(file);
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);

  const { data, error } = await invoke("aps-convert", {
    body: { fileName: file.name, fileBase64: b64 },
  });
  if (error) throw new Error(error.message || "APS conversion failed");
  if (!data?.objBase64) throw new Error(data?.error || "APS returned no output");

  // Decode OBJ that APS returned and re-export to glb (same path as
  // native .obj imports).
  const objText = atob(data.objBase64);
  const group = new OBJLoader().parse(objText);
  const url = await sceneOrGroupToGLB(group);
  return { url, sourceFormat: ext, fileName: file.name };
}

/**
 * DWG pipeline. Tries the open-source `dwg-convert` edge function
 * (ODA File Converter / LibreDWG worker) first. Two possible payloads
 * are accepted from the worker:
 *   - `{ glbBase64 }` — direct glTF binary, imported as-is.
 *   - `{ dxfBase64 }` — DXF text, parsed through the existing DXF
 *     path so we stay on one renderer.
 * On 501 (worker not configured) or any error we fall back to the
 * paid-but-reliable Autodesk Platform Services path.
 */
export async function convertDwg(
  file: File,
  invoke: (fnName: string, opts: { body: any }) => Promise<{ data: any; error: any }>,
  opts: { format?: "auto" | "glb" | "dxf" } = {},
): Promise<ImportedModel> {
  const ext = extOf(file.name);
  const buf = await readArrayBuffer(file);
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);

  try {
    const { data, error } = await invoke("dwg-convert", {
      body: { fileName: file.name, fileBase64: b64, format: opts.format ?? "auto" },
    });
    if (error) throw new Error(error.message || "DWG worker failed");
    if (data?.glbBase64) {
      return { url: `data:model/gltf-binary;base64,${data.glbBase64}`, sourceFormat: ext, fileName: file.name };
    }
    if (data?.dxfBase64) {
      const dxfText = atob(data.dxfBase64);
      const parsed = new DxfParser().parseSync(dxfText);
      const group = dxfToGroup(parsed);
      return { url: await sceneOrGroupToGLB(group), sourceFormat: ext, fileName: file.name };
    }
    // Unexpected shape → fall through to APS.
    throw new Error(data?.error || "DWG worker returned no usable output");
  } catch (workerErr) {
    // Fall back to Autodesk Platform Services (already integrated).
    return convertCadViaAps(file, invoke);
  }
}