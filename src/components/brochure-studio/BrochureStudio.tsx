/**
 * Brochure Studio — one admin editing tool for every flipbook brochure.
 * Mounted once in App; it finds the brochure pages on screen, applies the
 * published edits for visitors, and gives admins a full editor
 * (text, colors, sizes, moving, deleting, pictures, icons, 3D/AR models,
 * animations, animated backgrounds, new pages / new brochures) with publish.
 * Credits: Imagine Engine Studios Corp.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Pencil, Trash2, ImagePlus, Upload, RotateCcw, X, Eye, EyeOff, Type, Shapes, Box, Square, Wallpaper,
  Undo2, Redo2, FilePlus2, Minus, Plus, Copy, BookPlus, FileMinus2, ArrowUpToLine, ArrowDownToLine, ChevronUp, ChevronDown, Shuffle, LayoutTemplate,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { applyEdits, applyFills, byPath, findRoots, layerHost, pageOf, pathOf, STUDIO_CSS } from './dom';
import { ItemView } from './ItemView';
import { PageBackground, BG_OPTIONS } from './Backgrounds';
import { ICONS } from './icons';
import { PageLibrary } from './PageLibrary';
import EmbedPage from './EmbedPage';
import { ColorField } from './ColorField';
import { FontPicker } from './FontPicker';
import { ReaderBar } from './ReaderBar';
import { THEMES } from './themes';
import { LayoutGallery } from './LayoutGallery';
import { LAYOUTS, LAYOUT_MIME, type Layout } from './layouts';
import { isEmbed } from './library';
import { EMPTY_DOC, normalizeDoc, type Anim, type BrochureDoc, type ElEdit, type Item, type PageBg, type PageRef, type Hover } from './types';

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string;
const publishedUrl = (slug: string) => `${SUPA_URL}/storage/v1/object/public/studio-published/brochures/${slug}.json`;
const draftKey = (slug: string) => `sfh-brochure-draft:${slug}`;
const ALIAS: Record<string, string> = { acceleratorbrochure: 'forpartners', membership: 'basic-plan', 'investor-priority': 'investor-plan' };

export const slugFromPath = (path: string) => {
  const p = path.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (p.startsWith('b/')) return `b-${p.slice(2)}`.replace(/[^a-z0-9_-]/g, '').slice(0, 60);
  const s = p.replace(/[^a-z0-9_-]/g, '-').slice(0, 60);
  return ALIAS[s] || s;
};

export const fetchPublished = (slug: string) =>
  fetch(`${publishedUrl(slug)}?t=${Date.now()}`).then((r) => (r.ok ? r.json() : null)).then(normalizeDoc).catch(() => normalizeDoc(null));

const HOVERS: { v: Hover; l: string }[] = [{ v: '', l: 'None' }, { v: 'lift', l: 'Lift' }, { v: 'grow', l: 'Grow' }, { v: 'glow', l: 'Glow' }, { v: 'tilt', l: 'Tilt' }];
const ANIMS: { v: Anim; l: string }[] = [
  { v: '', l: 'None' }, { v: 'fade', l: 'Fade in' }, { v: 'up', l: 'Slide up' }, { v: 'reveal', l: 'Cyber reveal' },
  { v: 'zoom', l: 'Zoom in' }, { v: 'pulse', l: 'Pulse' }, { v: 'float', l: 'Float' }, { v: 'glow', l: 'Neon glow' }, { v: 'spin', l: 'Spin' },
  { v: 'bounce', l: 'Bounce' }, { v: 'swing', l: 'Swing' }, { v: 'shimmer', l: 'Shimmer' }, { v: 'hue', l: 'Color cycle' }, { v: 'shake', l: 'Shake' },
];

type Sel = { kind: 'el'; key: string } | { kind: 'item'; id: string } | null;

export default function BrochureStudio() {
  return isEmbed() ? <EmbedPage /> : <StudioEditor />;
}

/** Moves every page-indexed thing at or after `at` by `by` (insert = +1, remove = -1). */
function shiftPages(d: BrochureDoc, at: number, by: number): BrochureDoc {
  const mv = (p: number) => (p >= at ? p + by : p);
  const edits: BrochureDoc['edits'] = {};
  for (const [k, v] of Object.entries(d.edits)) { const [p, path] = k.split(':'); if (by < 0 && Number(p) === at) continue; edits[`${mv(Number(p))}:${path}`] = v; }
  const bgs: BrochureDoc['bgs'] = {};
  for (const [k, v] of Object.entries(d.bgs)) { if (k === 'all') { bgs.all = v; continue; } if (by < 0 && Number(k) === at) continue; bgs[String(mv(Number(k)))] = v; }
  const items = d.items.filter((i) => !(by < 0 && i.page === at)).map((i) => ({ ...i, page: mv(i.page) }));
  return { ...d, edits, bgs, items };
}

function StudioEditor() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const slug = useMemo(() => slugFromPath(pathname), [pathname]);
  const { role } = useUserRole();
  const isAdmin = role === 'admin';

  const [roots, setRoots] = useState<HTMLElement[]>([]);
  const [doc, setDoc] = useState<BrochureDoc>(EMPTY_DOC);
  const docRef = useRef(doc); docRef.current = doc;
  const past = useRef<BrochureDoc[]>([]); const future = useRef<BrochureDoc[]>([]);
  const [editing, setEditing] = useState(false);
  const [sel, setSel] = useState<Sel>(null);
  const selRef = useRef<Sel>(null); selRef.current = sel;
  const [busy, setBusy] = useState(false);
  const [bgOpen, setBgOpen] = useState(false);
  const [bgAll, setBgAll] = useState(false);
  const [libAt, setLibAt] = useState<number | null>(null);
  const [layoutsOpen, setLayoutsOpen] = useState(false);
  const lastPage = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<{ mode: 'new-image' | 'new-model' | 'replace' | 'ios'; id?: string }>({ mode: 'new-image' });

  /* ---- find pages on screen ---- */
  useEffect(() => {
    setRoots([]); setEditing(false); setSel(null);
    let t: ReturnType<typeof setTimeout> | undefined;
    const scan = () => {
      const r = findRoots();
      setRoots((prev) => (prev.length === r.length && prev.every((p, i) => p === r[i]) ? prev : r));
    };
    const mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(scan, 150); });
    mo.observe(document.body, { childList: true, subtree: true });
    scan();
    return () => { mo.disconnect(); clearTimeout(t); };
  }, [pathname]);
  const active = roots.length > 0;

  /* ---- load published + admin draft ---- */
  useEffect(() => {
    let off = false;
    past.current = []; future.current = [];
    fetchPublished(slug).then((pub) => {
      if (off) return;
      let d = pub;
      if (isAdmin) { try { const s = localStorage.getItem(draftKey(slug)); if (s) d = normalizeDoc(JSON.parse(s)); } catch { /* ignore */ } }
      setDoc(d);
    });
    return () => { off = true; };
  }, [slug, isAdmin]);

  useEffect(() => { window.dispatchEvent(new CustomEvent('bs:doc', { detail: { slug, doc } })); }, [doc, slug]);
  useEffect(() => { if (active) { const t = setTimeout(() => { applyEdits(doc); applyFills(doc); }, 30); return () => clearTimeout(t); } }, [doc, roots, active]);

  const commit = useCallback((n: BrochureDoc) => {
    try { localStorage.setItem(draftKey(slug), JSON.stringify(n)); } catch { /* ignore */ }
    return n;
  }, [slug]);
  const update = useCallback((fn: (d: BrochureDoc) => BrochureDoc, record = true) => {
    setDoc((d) => {
      if (record) { past.current = [...past.current.slice(-60), d]; future.current = []; }
      return commit(fn(d));
    });
  }, [commit]);
  const undo = () => { const p = past.current.pop(); if (!p) return; future.current.push(docRef.current); setDoc(commit(p)); };
  const redo = () => { const f = future.current.pop(); if (!f) return; past.current.push(docRef.current); setDoc(commit(f)); };

  const curPage = () => {
    if (lastPage.current !== null) return lastPage.current;
    const vis = roots.find((r) => { const b = r.getBoundingClientRect(); return b.width > 0 && getComputedStyle(r).display !== 'none'; });
    return vis ? pageOf(vis, roots) : 0;
  };

  /* ---- pointer editing (capture phase so flipbooks don't turn pages) ---- */
  useEffect(() => {
    if (!editing || !active) return;
    document.body.classList.add('bs-editing');
    const inBook = (t: HTMLElement) => t.closest('[data-bs-ui]') ? null : t.closest('[data-bp-root], .stf__item, [data-bs-layer]') as HTMLElement | null;
    const down = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (!inBook(t)) return;
      e.stopPropagation(); e.preventDefault();
      const all = findRoots();
      const sx = e.clientX, sy = e.clientY;
      const handle = t.closest('[data-bs-handle]') as HTMLElement | null;
      const itemEl = t.closest('[data-bs-item]') as HTMLElement | null;
      let onMove: (dx: number, dy: number) => void;
      let started = false;
      if (handle || itemEl) {
        const id = (handle?.dataset.bsHandle || itemEl!.dataset.bsItem)!;
        const it = docRef.current.items.find((i) => i.id === id); if (!it) return;
        lastPage.current = it.page;
        setSel({ kind: 'item', id });
        const host = (itemEl || handle)!.closest('[data-bs-layer]')!.getBoundingClientRect();
        onMove = (dx, dy) => update((d) => ({ ...d, items: d.items.map((i) => i.id !== id ? i : handle
          ? { ...i, w: Math.max(3, Math.min(150, it.w + (dx / host.width) * 100)) }
          : { ...i, x: it.x + (dx / host.width) * 100, y: it.y + (dy / host.height) * 100 }) }), !started);
      } else {
        const root = t.closest('[data-bp-root], .stf__item') as HTMLElement | null;
        if (!root || t === root) return;
        const path = pathOf(t, root); if (path === null) return;
        const pg = pageOf(root, all); lastPage.current = pg;
        const key = `${pg}:${path}`;
        setSel({ kind: 'el', key });
        const cur = docRef.current.edits[key] || {};
        onMove = (dx, dy) => update((d) => ({ ...d, edits: { ...d.edits, [key]: { ...d.edits[key], dx: Math.round((cur.dx || 0) + dx), dy: Math.round((cur.dy || 0) + dy) } } }), !started);
      }
      const move = (m: PointerEvent) => {
        const dx = m.clientX - sx, dy = m.clientY - sy;
        if (!started && Math.hypot(dx, dy) < 4) return;
        onMove(dx, dy); started = true;
      };
      const up = () => { window.removeEventListener('pointermove', move, true); window.removeEventListener('pointerup', up, true); };
      window.addEventListener('pointermove', move, true); window.addEventListener('pointerup', up, true);
    };
    // Mouse wheel over the selected piece makes it bigger / smaller.
    const wheel = (e: WheelEvent) => {
      const t = e.target as HTMLElement; if (!inBook(t)) return;
      const s = selRef.current; if (!s) return;
      e.preventDefault(); e.stopPropagation();
      const k = e.deltaY < 0 ? 1 : -1;
      if (s.kind === 'item') update((d) => ({ ...d, items: d.items.map((i) => i.id === s.id ? { ...i, w: Math.max(3, Math.min(150, i.w + k * 2)) } : i) }));
      else update((d) => { const c = d.edits[s.key] || {}; return { ...d, edits: { ...d.edits, [s.key]: { ...c, scale: Math.max(0.2, Math.min(3, +((c.scale ?? 1) + k * 0.05).toFixed(2))) } } }; });
    };
    window.addEventListener('wheel', wheel, { capture: true, passive: false });
    const block = (e: Event) => { if (inBook(e.target as HTMLElement)) { e.stopPropagation(); if (e.type === 'click') e.preventDefault(); } };
    window.addEventListener('pointerdown', down, true);
    ['mousedown', 'touchstart', 'click'].forEach((n) => window.addEventListener(n, block, true));
    return () => {
      document.body.classList.remove('bs-editing');
      window.removeEventListener('wheel', wheel, true);
      window.removeEventListener('pointerdown', down, true);
      ['mousedown', 'touchstart', 'click'].forEach((n) => window.removeEventListener(n, block, true));
    };
  }, [editing, active, update]);

  /* ---- selection outline ---- */
  useEffect(() => {
    document.querySelectorAll('.bs-sel').forEach((n) => n.classList.remove('bs-sel'));
    if (!editing || sel?.kind !== 'el') return;
    const [p, path] = sel.key.split(':');
    const root = roots.find((r) => pageOf(r, roots) === Number(p));
    root && byPath(root, path)?.classList.add('bs-sel');
  }, [sel, editing, doc, roots]);

  /* ---- server calls ---- */
  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('brochure-publish', { body: { slug, ...body } });
    if (error || data?.error) throw new Error(data?.error || error?.message);
    return data;
  };
  const upload = async (f: File) => {
    const ext = (f.name.split('.').pop() || 'png').toLowerCase();
    const a = await call({ action: 'asset', ext });
    const up = await supabase.storage.from('studio-published').uploadToSignedUrl(a.path, a.token, f, { contentType: f.type || (ext === 'glb' ? 'model/gltf-binary' : undefined) });
    if (up.error) throw up.error;
    return a.publicUrl as string;
  };
  const onFile = async (f: File) => {
    setBusy(true);
    try {
      const tgt = uploadTarget.current;
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if ((tgt.mode === 'new-model' || (tgt.mode === 'replace' && docRef.current.items.find((i) => i.id === tgt.id)?.type === 'model')) && ext !== 'glb') throw new Error('Please upload a single .glb 3D file');
      if (tgt.mode === 'ios' && ext !== 'usdz') throw new Error('Please upload a .usdz file for iPhone');
      if (f.size > 50 * 1024 * 1024) throw new Error('3D files must be under 50 MB');
      const src = await upload(f);
      if (tgt.mode === 'ios' && tgt.id) update((d) => ({ ...d, items: d.items.map((i) => (i.id === tgt.id ? { ...i, iosSrc: src } : i)) }));
      else if (tgt.mode === 'replace' && tgt.id) update((d) => ({ ...d, items: d.items.map((i) => (i.id === tgt.id ? { ...i, src } : i)) }));
      else addItem(tgt.mode === 'new-model' ? { type: 'model', src, w: 45, ar: true } : { type: 'image', src, w: 55, radius: 10 });
    } catch (e) { toast.error(`Upload failed: ${(e as Error).message}`); }
    setBusy(false);
  };
  const pick = (mode: 'new-image' | 'new-model' | 'replace' | 'ios', accept: string, id?: string) => {
    uploadTarget.current = { mode, id };
    if (fileRef.current) { fileRef.current.accept = accept; fileRef.current.click(); }
  };

  const addItem = (p: Partial<Item>) => {
    const id = crypto.randomUUID();
    update((d) => ({ ...d, items: [...d.items, { id, page: curPage(), type: 'text', x: 20, y: 30, w: 50, ...p } as Item] }));
    setSel({ kind: 'item', id });
  };

  const publish = async () => {
    setBusy(true);
    try { await call({ doc }); localStorage.removeItem(draftKey(slug)); toast.success('Published — everyone now sees this version'); }
    catch (e) { toast.error(`Publish failed: ${(e as Error).message}`); }
    setBusy(false);
  };
  const discard = () => { localStorage.removeItem(draftKey(slug)); window.location.reload(); };
  const newBrochure = () => {
    const name = window.prompt('Name for the new brochure (letters, numbers, dashes)');
    const s = (name || '').toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    if (s) navigate(`/b/${s}`);
  };

  /* ---- page library: insert pages from any brochure ---- */
  const isCustomSlug = slug.startsWith('b-');
  const pagesOf = (d: BrochureDoc): PageRef[] => d.pages ?? Array.from({ length: d.pageCount || 4 }, () => ({}));
  const insertPage = (src: string | null, label: string) => {
    const at = libAt ?? curPage() + 1;
    setLibAt(null);
    if (isCustomSlug) {
      update((d) => { const pages = [...pagesOf(d)]; pages.splice(at, 0, src ? { src, label } : {}); return { ...shiftPages(d, at, 1), pages, pageCount: pages.length }; });
      lastPage.current = at;
      toast.success(`Inserted ${label} as page ${at + 1}`);
    } else if (src) {
      addItem({ type: 'page', src, x: 0, y: 0, w: 100 });
      toast.success(`${label} placed on this page`);
    }
  };
  /* ---- layout gallery: drop a template's pieces onto a page ---- */
  const placeLayout = (l: Layout, page: number) => {
    update((d) => ({ ...d, items: [...d.items, ...l.pieces.map((p) => ({ ...p, id: crypto.randomUUID(), page } as Item))] }));
    lastPage.current = page;
    toast.success(`${l.name} added to page ${page + 1}`);
  };
  const layoutAsPage = (l: Layout, where?: number) => {
    const at = where ?? curPage() + 1;
    setLibAt(null);
    update((d) => {
      const pages = [...pagesOf(d)]; pages.splice(at, 0, { label: l.name });
      const n = shiftPages(d, at, 1);
      return { ...n, pages, pageCount: pages.length, items: [...n.items, ...l.pieces.map((p) => ({ ...p, id: crypto.randomUUID(), page: at } as Item))] };
    });
    lastPage.current = at;
    toast.success(`${l.name} added as page ${at + 1}`);
  };
  useEffect(() => {
    if (!editing || !layoutsOpen) return;
    const pageAt = (e: DragEvent) => {
      const el = (document.elementsFromPoint(e.clientX, e.clientY) as HTMLElement[]).find((n) => !n.closest('[data-bs-ui]') && n.closest('[data-bp-root], .stf__item'));
      const root = el ? roots.find((r) => r.contains(el) || el.closest('.stf__item')?.contains(r)) : undefined;
      return root ? pageOf(root, roots) : null;
    };
    const over = (e: DragEvent) => { if (e.dataTransfer?.types.includes(LAYOUT_MIME) && pageAt(e) !== null) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } };
    const drop = (e: DragEvent) => {
      const id = e.dataTransfer?.getData(LAYOUT_MIME); if (!id) return;
      const pg = pageAt(e); const l = LAYOUTS.find((x) => x.id === id);
      if (pg === null || !l) return;
      e.preventDefault(); e.stopPropagation(); placeLayout(l, pg);
    };
    document.addEventListener('dragover', over, true); document.addEventListener('drop', drop, true);
    return () => { document.removeEventListener('dragover', over, true); document.removeEventListener('drop', drop, true); };
  }, [editing, layoutsOpen, roots]); // eslint-disable-line react-hooks/exhaustive-deps

  const removePage = () => {
    const at = curPage();
    update((d) => { const pages = pagesOf(d).filter((_, i) => i !== at); if (!pages.length) return d; return { ...shiftPages(d, at, -1), pages, pageCount: pages.length }; });
    lastPage.current = null;
  };

  /* ---- portals: backgrounds + added items on every page ---- */
  const portals = active ? roots.map((root) => {
    const pg = pageOf(root, roots);
    const bg = doc.bgs[String(pg)] || doc.bgs.all;
    const items = doc.items.filter((i) => i.page === pg);
    const plus = editing && isAdmin && isCustomSlug;
    if (!bg && !items.length && !plus) return null;
    return createPortal(
      <>
        {bg && <PageBackground bg={bg} />}
        {items.map((it) => <ItemView key={it.id} it={it} editing={editing} selected={sel?.kind === 'item' && sel.id === it.id} />)}
        {plus && (
          <button data-bs-ui aria-label="Insert page after this one" title="Insert a page here" onClick={() => setLibAt(pg + 1)}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: 999, pointerEvents: 'auto', zIndex: 999,
              display: 'grid', placeItems: 'center', color: '#fff', background: 'linear-gradient(135deg,#7c3aed,#0e7490)', boxShadow: '0 0 20px rgba(168,85,247,0.6)', border: '2px solid rgba(255,255,255,0.7)' }}>
            <Plus className="h-5 w-5" />
          </button>
        )}
      </>,
      layerHost(root), `bs-${pg}`,
    );
  }) : null;

  if (!active) return null;
  if (!isAdmin) return <>{portals}<ReaderBar roots={roots} /></>;

  /* ---- inspector data ---- */
  const selEl = (() => {
    if (sel?.kind !== 'el') return null;
    const [p, path] = sel.key.split(':');
    const root = roots.find((r) => pageOf(r, roots) === Number(p));
    return root ? byPath(root, path) : null;
  })();
  const selEdit: ElEdit | null = sel?.kind === 'el' ? doc.edits[sel.key] || {} : null;
  const selItem = sel?.kind === 'item' ? doc.items.find((i) => i.id === sel.id) || null : null;
  const setEdit = (patch: Partial<ElEdit>) => sel?.kind === 'el' && update((d) => ({ ...d, edits: { ...d.edits, [sel.key]: { ...d.edits[sel.key], ...patch } } }));
  const setItem = (patch: Partial<Item>) => selItem && update((d) => ({ ...d, items: d.items.map((i) => (i.id === selItem.id ? { ...i, ...patch } : i)) }));
  const canText = !!selEl && selEl.childElementCount === 0;
  const baseFont = selEl ? Math.round(parseFloat(getComputedStyle(selEl).fontSize) || 16) : 16;

  const isCustom = slug.startsWith('b-');
  const bgKey = bgAll ? 'all' : String(curPage());
  const curBg: PageBg = doc.bgs[bgKey] || { kind: 'none', opacity: 0.45, blend: 'normal' };
  const setBg = (p: Partial<PageBg>) => update((d) => ({ ...d, bgs: { ...d.bgs, [bgKey]: { ...curBg, ...p } } }));

  const btn = 'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-bold disabled:opacity-40 whitespace-nowrap';
  const soft: React.CSSProperties = { background: 'rgba(255,255,255,0.08)' };
  const glass: React.CSSProperties = { background: 'rgba(15,23,42,0.94)', border: '1px solid rgba(168,85,247,0.45)', color: '#e2e8f0', backdropFilter: 'blur(10px)' };
  const field: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.15)' };
  const Lbl = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="flex flex-col gap-1 text-[11px] font-semibold" style={{ color: '#cbd5e1' }}>{t}{children}</label>;
  const Stepper = ({ v, set, step, min, max, fmt }: { v: number; set: (n: number) => void; step: number; min: number; max: number; fmt?: (n: number) => string }) => (
    <div className="flex items-center gap-2">
      <button className="rounded-md p-1" style={soft} aria-label="Smaller" onClick={() => set(Math.max(min, +(v - step).toFixed(2)))}><Minus className="h-3.5 w-3.5" /></button>
      <input type="range" className="flex-1" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} />
      <button className="rounded-md p-1" style={soft} aria-label="Bigger" onClick={() => set(Math.min(max, +(v + step).toFixed(2)))}><Plus className="h-3.5 w-3.5" /></button>
      <span className="w-10 text-right font-mono text-[11px]">{fmt ? fmt(v) : v}</span>
    </div>
  );
  const zs = () => [...doc.items.map((i) => i.z ?? 1), ...Object.values(doc.edits).map((e) => e.z ?? 0)];
  const LayerCtl = ({ z, set }: { z: number; set: (n: number) => void }) => (
    <Lbl t={`Layer (${z})`}><div className="flex gap-1.5">
      <button className={btn} style={soft} title="Bring to front" onClick={() => set(Math.max(...zs()) + 1)}><ArrowUpToLine className="h-4 w-4" />Front</button>
      <button className={btn} style={soft} aria-label="Move forward" title="Move forward" onClick={() => set(z + 1)}><ChevronUp className="h-4 w-4" /></button>
      <button className={btn} style={soft} aria-label="Move backward" title="Move backward" onClick={() => set(z - 1)}><ChevronDown className="h-4 w-4" /></button>
      <button className={btn} style={soft} title="Send to back" onClick={() => set(Math.min(...zs()) - 1)}><ArrowDownToLine className="h-4 w-4" />Back</button>
    </div></Lbl>
  );
  const HoverSel = ({ v, set }: { v?: Hover; set: (h: Hover) => void }) => (
    <Lbl t="When the mouse is over it"><select className="rounded-md p-1.5 text-[12px]" style={field} value={v || ''} onChange={(e) => set(e.target.value as Hover)}>
      {HOVERS.map((a) => <option key={a.v} value={a.v} style={{ background: '#0f172a' }}>{a.l}</option>)}</select></Lbl>
  );
  const AnimSel = ({ v, set }: { v?: Anim; set: (a: Anim) => void }) => (
    <Lbl t="Animation"><select className="rounded-md p-1.5 text-[12px]" style={field} value={v || ''} onChange={(e) => set(e.target.value as Anim)}>
      {ANIMS.map((a) => <option key={a.v} value={a.v} style={{ background: '#0f172a' }}>{a.l}</option>)}</select></Lbl>
  );

  return (
    <>
      <style>{STUDIO_CSS}</style>
      {portals}
      {!editing && <ReaderBar roots={roots} />}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-3 z-[70] max-w-[calc(100vw-16px)] overflow-x-auto rounded-xl px-2 py-1.5 flex items-center gap-1.5" style={glass}>
        <button className={btn} onClick={() => { setEditing(!editing); setSel(null); setBgOpen(false); }} style={{ background: editing ? '#7c3aed' : 'rgba(255,255,255,0.08)' }}>
          <Pencil className="h-4 w-4" />{editing ? 'Editing' : 'Brochure Studio'}
        </button>
        {editing && (
          <>
            <span className="w-px h-6" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <button className={btn} style={soft} onClick={() => addItem({ type: 'text', text: 'New headline', size: 28, w: 60, metal: true })}><Type className="h-4 w-4" />Text</button>
            <button className={btn} style={soft} onClick={() => addItem({ type: 'icon', icon: 'Rocket', w: 14 })}><Shapes className="h-4 w-4" />Icon</button>
            <button className={btn} style={soft} disabled={busy} onClick={() => pick('new-image', 'image/*')}><ImagePlus className="h-4 w-4" />Picture</button>
            <button className={btn} style={soft} disabled={busy} onClick={() => pick('new-model', '.glb,model/gltf-binary')}><Box className="h-4 w-4" />3D / AR</button>
            <button className={btn} style={soft} onClick={() => addItem({ type: 'shape', w: 50 })}><Square className="h-4 w-4" />Card</button>
            <button className={btn} style={{ background: bgOpen ? '#7c3aed' : 'rgba(255,255,255,0.08)' }} onClick={() => setBgOpen(!bgOpen)}><Wallpaper className="h-4 w-4" />Background</button>
            {isCustom && <>
              <button className={btn} style={soft} title="Remove the current page" aria-label="Remove page" disabled={pagesOf(doc).length <= 1} onClick={removePage}><FileMinus2 className="h-4 w-4" /></button>
            </>}
            <span className="w-px h-6" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <button className={btn} style={soft} aria-label="Undo" onClick={undo}><Undo2 className="h-4 w-4" /></button>
            <button className={btn} style={soft} aria-label="Redo" onClick={redo}><Redo2 className="h-4 w-4" /></button>
            <button className={btn} style={soft} onClick={() => setLibAt(isCustom ? curPage() + 1 : curPage())}><FilePlus2 className="h-4 w-4" />Page library</button>
            <button className={btn} style={layoutsOpen ? { background: '#7c3aed' } : soft} onClick={() => setLayoutsOpen((o) => !o)}><LayoutTemplate className="h-4 w-4" />Layouts</button>
            <button className={btn} style={soft} onClick={newBrochure}><BookPlus className="h-4 w-4" />New brochure</button>
            <button className={btn} style={soft} onClick={discard}><RotateCcw className="h-4 w-4" />Discard</button>
            <button className={btn} disabled={busy} onClick={publish} style={{ background: 'linear-gradient(135deg,#7c3aed,#0e7490)' }}><Upload className="h-4 w-4" />Publish</button>
          </>
        )}
        <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
      </div>

      {editing && bgOpen && (
        <div className="fixed left-4 bottom-20 z-[70] w-64 rounded-xl p-4 flex flex-col gap-3" style={glass}>
          <div className="flex items-center justify-between"><span className="font-mono text-[11px] tracking-[0.2em]" style={{ color: '#c4b5fd' }}>BACKGROUND</span>
            <button aria-label="Close" onClick={() => setBgOpen(false)}><X className="h-4 w-4" /></button></div>
          <div className="flex gap-1.5">
            <button className={btn} style={!bgAll ? { background: '#7c3aed' } : soft} onClick={() => setBgAll(false)}>This page</button>
            <button className={btn} style={bgAll ? { background: '#7c3aed' } : soft} onClick={() => setBgAll(true)}>All pages</button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {BG_OPTIONS.map((o) => <button key={o.kind} className={btn} style={curBg.kind === o.kind ? { background: '#7c3aed' } : soft} onClick={() => setBg({ kind: o.kind })}>{o.label}</button>)}
          </div>
          <Lbl t="Strength"><Stepper v={curBg.opacity} set={(v) => setBg({ opacity: v })} step={0.05} min={0.05} max={1} fmt={(n) => `${Math.round(n * 100)}%`} /></Lbl>
          <Lbl t="Blend"><select className="rounded-md p-1.5 text-[12px]" style={field} value={curBg.blend} onChange={(e) => setBg({ blend: e.target.value as PageBg['blend'] })}>
            <option value="normal" style={{ background: '#0f172a' }}>Normal</option><option value="screen" style={{ background: '#0f172a' }}>Glow (dark pages)</option><option value="multiply" style={{ background: '#0f172a' }}>Ink (light pages)</option></select></Lbl>
          <span className="font-mono text-[11px] tracking-[0.2em] pt-1" style={{ color: '#c4b5fd' }}>THEME</span>
          <div className="grid grid-cols-2 gap-1.5">
            {THEMES.map((t) => <button key={t.id} className={btn} style={soft} title={t.name} onClick={() => setBg({ fill: 'gradient', f1: t.f1, f2: t.f2, c1: t.c1, c2: t.c2, angle: 135 })}>
              <span className="h-3 w-3 rounded-full" style={{ background: `linear-gradient(135deg,${t.f2},${t.c1})` }} />{t.name}</button>)}
            <button className={btn} style={soft} onClick={() => { const t = THEMES[Math.floor(Math.random() * THEMES.length)]; setBg({ fill: 'gradient', f1: t.f1, f2: t.f2, c1: t.c1, c2: t.c2, angle: 135 }); }}><Shuffle className="h-4 w-4" />Shuffle</button>
          </div>
          <div className="flex gap-3">
            <Lbl t="Animation color 1"><ColorField value={curBg.c1 || '#22d3ee'} onChange={(v) => setBg({ c1: v })} /></Lbl>
            <Lbl t="Color 2"><ColorField value={curBg.c2 || '#a855f7'} onChange={(v) => setBg({ c2: v })} /></Lbl>
          </div>
          <Lbl t="Speed"><Stepper v={curBg.speed ?? 1} set={(v) => setBg({ speed: v })} step={0.1} min={0.1} max={4} fmt={(n) => `${n}x`} /></Lbl>
          <span className="font-mono text-[11px] tracking-[0.2em] pt-1" style={{ color: '#c4b5fd' }}>PAGE COLOR</span>
          <div className="grid grid-cols-2 gap-1.5">
            {([['none', 'Original'], ['solid', 'Solid'], ['gradient', 'Gradient'], ['animated', 'Moving gradient']] as const).map(([v, l]) => (
              <button key={v} className={btn} style={(curBg.fill || 'none') === v ? { background: '#7c3aed' } : soft} onClick={() => setBg({ fill: v })}>{l}</button>
            ))}
          </div>
          {curBg.fill && curBg.fill !== 'none' && <>
            <div className="flex gap-3">
              <Lbl t="Color 1"><ColorField value={curBg.f1 || '#0b1220'} onChange={(v) => setBg({ f1: v })} /></Lbl>
              {curBg.fill !== 'solid' && <Lbl t="Color 2"><ColorField value={curBg.f2 || '#4c1d95'} onChange={(v) => setBg({ f2: v })} /></Lbl>}
            </div>
            {curBg.fill !== 'solid' && <Lbl t="Direction"><Stepper v={curBg.angle ?? 160} set={(v) => setBg({ angle: v })} step={5} min={0} max={360} fmt={(n) => `${n}°`} /></Lbl>}
            <button className={btn} style={curBg.deep ? { background: '#7c3aed' } : soft} onClick={() => setBg({ deep: !curBg.deep })}>Also recolor the page's own panel</button>
          </>}
        </div>
      )}

      {editing && (selEdit || selItem) && (
        <div className="fixed right-4 top-16 z-[70] w-72 max-h-[calc(100vh-150px)] overflow-y-auto rounded-xl p-4 flex flex-col gap-3" style={glass}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-[0.2em]" style={{ color: '#c4b5fd' }}>{selItem ? selItem.type.toUpperCase() : 'ELEMENT'}</span>
            <button aria-label="Close" onClick={() => setSel(null)}><X className="h-4 w-4" /></button>
          </div>

          {selEdit && (
            <>
              {canText
                ? <Lbl t="Text"><textarea rows={3} className="rounded-md p-2 text-[13px]" style={field} value={selEdit.text ?? selEl?.dataset.bpOrig ?? selEl?.textContent ?? ''} onChange={(e) => setEdit({ text: e.target.value })} /></Lbl>
                : <span className="text-[11px]" style={{ color: '#94a3b8' }}>This is a group. Click a word to change its text.</span>}
              <div className="flex gap-3">
                <Lbl t="Text color"><ColorField value={selEdit.color || '#ffffff'} onChange={(v) => setEdit({ color: v })} /></Lbl>
                <Lbl t="Fill"><ColorField value={selEdit.bg || '#1e293b'} onChange={(v) => setEdit({ bg: v })} /></Lbl>
              </div>
              <Lbl t="Size (pictures and blocks)"><Stepper v={selEdit.scale ?? 1} set={(v) => setEdit({ scale: v })} step={0.05} min={0.2} max={3} fmt={(n) => `${Math.round(n * 100)}%`} /></Lbl>
              {canText && <Lbl t="Font"><FontPicker value={selEdit.font} onChange={(f) => setEdit({ font: f })} /></Lbl>}
              {canText && <Lbl t="Font size"><Stepper v={selEdit.fontSize ?? baseFont} set={(v) => setEdit({ fontSize: v })} step={1} min={8} max={120} /></Lbl>}
              <Lbl t="Rotate"><Stepper v={selEdit.rot ?? 0} set={(v) => setEdit({ rot: v })} step={1} min={-180} max={180} fmt={(n) => `${n}°`} /></Lbl>
              <Lbl t="Opacity"><Stepper v={selEdit.opacity ?? 1} set={(v) => setEdit({ opacity: v })} step={0.05} min={0} max={1} fmt={(n) => `${Math.round(n * 100)}%`} /></Lbl>
              <Lbl t="Corners"><Stepper v={selEdit.radius ?? 0} set={(v) => setEdit({ radius: v })} step={1} min={0} max={80} /></Lbl>
              <AnimSel v={selEdit.anim} set={(anim) => setEdit({ anim })} />
              <HoverSel v={selEdit.hover} set={(hover) => setEdit({ hover })} />
              <LayerCtl z={selEdit.z ?? 0} set={(z) => setEdit({ z })} />
              <span className="text-[11px]" style={{ color: '#94a3b8' }}>Drag to move. Scroll the mouse wheel over it to grow or shrink.</span>
              <div className="flex gap-2 flex-wrap">
                <button className={btn} style={soft} onClick={() => setEdit({ hidden: !selEdit.hidden })}>
                  {selEdit.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}{selEdit.hidden ? 'Show' : 'Delete'}
                </button>
                <button className={btn} style={soft} onClick={() => update((d) => { const e = { ...d.edits }; delete e[(sel as { key: string }).key]; return { ...d, edits: e }; })}>
                  <RotateCcw className="h-4 w-4" />Reset
                </button>
              </div>
            </>
          )}

          {selItem && (
            <>
              {selItem.type === 'text' && <>
                <Lbl t="Text"><textarea rows={3} className="rounded-md p-2 text-[13px]" style={field} value={selItem.text || ''} onChange={(e) => setItem({ text: e.target.value })} /></Lbl>
                <Lbl t="Font"><FontPicker value={selItem.font} onChange={(f) => setItem({ font: f })} /></Lbl>
                <Lbl t="Font size"><Stepper v={selItem.size || 22} set={(v) => setItem({ size: v })} step={1} min={8} max={140} /></Lbl>
                <Lbl t="Weight"><Stepper v={selItem.weight || 700} set={(v) => setItem({ weight: v })} step={100} min={300} max={900} /></Lbl>
                <div className="flex items-end gap-3">
                  <Lbl t="Color"><ColorField value={selItem.color || '#f1f5f9'} onChange={(v) => setItem({ color: v, metal: false })} /></Lbl>
                  <button className={btn} style={selItem.metal ? { background: '#7c3aed' } : soft} onClick={() => setItem({ metal: !selItem.metal })}>Metallic</button>
                </div>
              </>}
              {selItem.type === 'icon' && <>
                <div className="grid grid-cols-8 gap-1">
                  {Object.entries(ICONS).map(([n, I]) => (
                    <button key={n} title={n} aria-label={n} className="rounded-md p-1 grid place-items-center" style={selItem.icon === n ? { background: '#7c3aed' } : soft} onClick={() => setItem({ icon: n })}><I className="h-4 w-4" /></button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Lbl t="Icon color"><ColorField value={selItem.color || '#e9d5ff'} onChange={(v) => setItem({ color: v })} /></Lbl>
                  <Lbl t="Badge"><ColorField value={selItem.bg?.startsWith('#') ? selItem.bg : '#2e1065'} onChange={(v) => setItem({ bg: v })} /></Lbl>
                </div>
              </>}
              {selItem.type === 'shape' && <Lbl t="Fill"><ColorField value={selItem.bg?.startsWith('#') ? selItem.bg : '#312e81'} onChange={(v) => setItem({ bg: v })} /></Lbl>}
              {selItem.type === 'image' && <button className={btn} style={soft} disabled={busy} onClick={() => pick('replace', 'image/*', selItem.id)}><ImagePlus className="h-4 w-4" />Replace picture</button>}
              {selItem.type === 'model' && <>
                <button className={btn} style={soft} disabled={busy} onClick={() => pick('replace', '.glb,model/gltf-binary', selItem.id)}><Box className="h-4 w-4" />Upload 3D model</button>
                <Lbl t="Or model link (.glb)"><input className="rounded-md p-1.5 text-[12px]" style={field} defaultValue={selItem.src || ''} onBlur={(e) => setItem({ src: e.target.value.trim() })} placeholder="https://…/model.glb" /></Lbl>
                <div className="flex gap-2">
                  <button className={btn} style={selItem.ar ? { background: '#7c3aed' } : soft} onClick={() => setItem({ ar: !selItem.ar })}>AR view</button>
                  <button className={btn} style={selItem.autoRotate !== false ? { background: '#7c3aed' } : soft} onClick={() => setItem({ autoRotate: selItem.autoRotate === false })}>Auto-rotate</button>
                </div>
                <button className={btn} style={soft} disabled={busy} onClick={() => pick('ios', '.usdz,model/vnd.usdz+zip', selItem.id)}><Box className="h-4 w-4" />{selItem.iosSrc ? 'Replace iPhone file' : 'iPhone file (.usdz, optional)'}</button>
                <span className="text-[11px]" style={{ color: '#94a3b8' }}>With AR view on, visitors get a "View in your room" button. Phones place the model on the floor; computers show a QR code to open it on a phone.</span>
              </>}
              <Lbl t="Size"><Stepper v={Math.round(selItem.w)} set={(v) => setItem({ w: v })} step={1} min={3} max={150} fmt={(n) => `${n}%`} /></Lbl>
              <Lbl t="Rotate"><Stepper v={selItem.rot ?? 0} set={(v) => setItem({ rot: v })} step={1} min={-180} max={180} fmt={(n) => `${n}°`} /></Lbl>
              <Lbl t="Opacity"><Stepper v={selItem.opacity ?? 1} set={(v) => setItem({ opacity: v })} step={0.05} min={0.05} max={1} fmt={(n) => `${Math.round(n * 100)}%`} /></Lbl>
              {selItem.type !== 'text' && selItem.type !== 'model' && <Lbl t="Corners"><Stepper v={selItem.radius ?? 10} set={(v) => setItem({ radius: v })} step={1} min={0} max={200} /></Lbl>}
              <AnimSel v={selItem.anim} set={(anim) => setItem({ anim })} />
              <HoverSel v={selItem.hover} set={(hover) => setItem({ hover })} />
              <LayerCtl z={selItem.z ?? 1} set={(z) => setItem({ z })} />
              <span className="text-[11px]" style={{ color: '#94a3b8' }}>Drag to move. Drag the purple corner or scroll the mouse wheel to resize.</span>
              <div className="flex gap-2 flex-wrap">
                <button className={btn} style={soft} onClick={() => { const id = crypto.randomUUID(); update((d) => ({ ...d, items: [...d.items, { ...selItem, id, x: selItem.x + 3, y: selItem.y + 3 }] })); setSel({ kind: 'item', id }); }}><Copy className="h-4 w-4" />Duplicate</button>
                <button className={btn} style={{ background: 'rgba(239,68,68,0.25)' }} onClick={() => { update((d) => ({ ...d, items: d.items.filter((i) => i.id !== selItem.id) })); setSel(null); }}><Trash2 className="h-4 w-4" />Delete</button>
              </div>
            </>
          )}
        </div>
      )}
      {editing && layoutsOpen && <LayoutGallery canAddPage={isCustom} onClose={() => setLayoutsOpen(false)} onUse={(l) => placeLayout(l, curPage())} onNewPage={(l) => layoutAsPage(l)} />}
      {libAt !== null && <PageLibrary allowBlank={isCustom} onClose={() => setLibAt(null)} onPick={insertPage} onLayout={isCustom ? (l) => layoutAsPage(l, libAt ?? undefined) : (l) => { setLibAt(null); placeLayout(l, curPage()); }} />}
    </>
  );
}
