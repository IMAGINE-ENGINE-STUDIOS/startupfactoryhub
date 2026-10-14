/**
 * Admin visual editor for flipbook brochures: select, edit text, recolor,
 * hide, move, add images, then publish for all visitors.
 * Credits: Imagine Engine Studios Corp.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pencil, Trash2, ImagePlus, Upload, RotateCcw, X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

export type ElEdit = { text?: string; color?: string; bg?: string; hidden?: boolean; dx?: number; dy?: number };
export type AddedImg = { id: string; page: number; src: string; x: number; y: number; w: number };
export type BrochureDoc = { edits: Record<string, ElEdit>; images: AddedImg[] };
const EMPTY: BrochureDoc = { edits: {}, images: [] };

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string;
const publishedUrl = (slug: string) => `${SUPA_URL}/storage/v1/object/public/studio-published/brochures/${slug}.json`;
const draftKey = (slug: string) => `sfh-brochure-draft:${slug}`;

/* ---------- DOM path helpers (page root = [data-bp-root]) ---------- */
const pathOf = (el: Element, root: Element) => {
  const parts: number[] = [];
  let n: Element | null = el;
  while (n && n !== root) {
    const p: Element | null = n.parentElement;
    if (!p) return null;
    parts.unshift(Array.prototype.indexOf.call(p.children, n));
    n = p;
  }
  return n === root ? parts.join('.') : null;
};
const byPath = (root: Element, path: string) => {
  let n: Element | undefined = root;
  for (const i of path ? path.split('.').map(Number) : []) n = n?.children[i];
  return n || null;
};
const roots = (box: HTMLElement | null) => Array.from(box?.querySelectorAll('[data-bp-root]') || []) as HTMLElement[];
const pageOf = (el: HTMLElement) => Number(el.dataset.bpRoot);

function applyEdits(box: HTMLElement | null, doc: BrochureDoc) {
  for (const root of roots(box)) {
    const pg = pageOf(root);
    for (const [key, e] of Object.entries(doc.edits)) {
      const [p, path] = key.split(':');
      if (Number(p) !== pg) continue;
      const el = byPath(root, path) as HTMLElement | null;
      if (!el) continue;
      if (el.dataset.bpOrig === undefined && el.childElementCount === 0) el.dataset.bpOrig = el.textContent || '';
      if (e.text !== undefined && el.childElementCount === 0) el.textContent = e.text;
      el.style.color = e.color || '';
      if (e.color) el.style.webkitTextFillColor = e.color;
      if (e.bg) el.style.background = e.bg;
      el.style.display = e.hidden ? 'none' : '';
      el.style.transform = e.dx || e.dy ? `translate(${e.dx || 0}px, ${e.dy || 0}px)` : '';
    }
  }
}

/* ---------- Hook: load published + draft ---------- */
export function useBrochureEditor(slug: string) {
  const { role } = useUserRole();
  const isAdmin = role === 'admin';
  const [doc, setDoc] = useState<BrochureDoc>(EMPTY);
  const [published, setPublished] = useState<BrochureDoc>(EMPTY);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetch(`${publishedUrl(slug)}?t=${Date.now()}`).then((r) => (r.ok ? r.json() : null)).then((d) => {
      const pub = d && d.edits ? { edits: d.edits, images: d.images || [] } : EMPTY;
      setPublished(pub);
      setDoc(pub);
    }).catch(() => {});
  }, [slug]);

  // Admins resume their unpublished draft.
  useEffect(() => {
    if (!isAdmin) return;
    try { const d = localStorage.getItem(draftKey(slug)); if (d) setDoc(JSON.parse(d)); } catch { /* ignore */ }
  }, [isAdmin, slug]);

  const update = useCallback((fn: (d: BrochureDoc) => BrochureDoc) => {
    setDoc((d) => { const n = fn(d); try { localStorage.setItem(draftKey(slug), JSON.stringify(n)); } catch { /* ignore */ } return n; });
  }, [slug]);

  return { isAdmin, doc, update, published, setDoc, setPublished, editing, setEditing };
}

/* ---------- Added images layer (render inside each page) ---------- */
export function AddedImages({ ed, page, selected, onSelect }: {
  ed: ReturnType<typeof useBrochureEditor>; page: number; selected: string | null; onSelect: (id: string) => void;
}) {
  const imgs = ed.doc.images.filter((i) => i.page === page);
  const drag = (e: React.PointerEvent, img: AddedImg) => {
    if (!ed.editing) return;
    e.stopPropagation(); e.preventDefault();
    onSelect(img.id);
    const host = (e.currentTarget as HTMLElement).parentElement!.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY, ox = img.x, oy = img.y;
    const move = (m: PointerEvent) => ed.update((d) => ({ ...d, images: d.images.map((i) => i.id === img.id
      ? { ...i, x: ox + ((m.clientX - sx) / host.width) * 100, y: oy + ((m.clientY - sy) / host.height) * 100 } : i) }));
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
  return (
    <div data-bp-added className="absolute inset-0" style={{ pointerEvents: 'none', zIndex: 30 }}>
      {imgs.map((img) => (
        <img key={img.id} src={img.src} alt="" draggable={false} onPointerDown={(e) => drag(e, img)}
          style={{ position: 'absolute', left: `${img.x}%`, top: `${img.y}%`, width: `${img.w}%`, pointerEvents: ed.editing ? 'auto' : 'none',
            cursor: ed.editing ? 'move' : 'default', borderRadius: 10, outline: selected === img.id ? '2px solid #a855f7' : 'none' }} />
      ))}
    </div>
  );
}

/* ---------- Toolbar + inspector ---------- */
export function BrochureEditorPanel({ ed, slug, boxRef, page }: {
  ed: ReturnType<typeof useBrochureEditor>; slug: string; boxRef: React.RefObject<HTMLDivElement>; page: number;
}) {
  const [sel, setSel] = useState<string | null>(null); // "page:path" or "img:<id>"
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { doc, update, editing } = ed;

  useEffect(() => { const t = setTimeout(() => applyEdits(boxRef.current, doc), 30); return () => clearTimeout(t); }, [doc, page, boxRef, editing]);

  // Select / drag elements while editing (capture phase so pages don't flip).
  useEffect(() => {
    const box = boxRef.current;
    if (!box || !editing) return;
    const down = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'IMG' && t.closest('[data-bp-added]')) return;
      const root = t.closest('[data-bp-root]') as HTMLElement | null;
      if (!root || t === root) return;
      e.stopPropagation(); e.preventDefault();
      const path = pathOf(t, root); if (path === null) return;
      const key = `${pageOf(root)}:${path}`;
      setSel(key);
      const cur = ed.doc.edits[key] || {};
      const sx = e.clientX, sy = e.clientY, ox = cur.dx || 0, oy = cur.dy || 0;
      let moved = false;
      const move = (m: PointerEvent) => {
        const dx = m.clientX - sx, dy = m.clientY - sy;
        if (!moved && Math.hypot(dx, dy) < 4) return;
        moved = true;
        update((d) => ({ ...d, edits: { ...d.edits, [key]: { ...d.edits[key], dx: Math.round(ox + dx), dy: Math.round(oy + dy) } } }));
      };
      const up = () => { window.removeEventListener('pointermove', move, true); window.removeEventListener('pointerup', up, true); };
      window.addEventListener('pointermove', move, true); window.addEventListener('pointerup', up, true);
    };
    const block = (e: Event) => { if ((e.target as HTMLElement).closest('[data-bp-root]')) { e.stopPropagation(); } };
    box.addEventListener('pointerdown', down, true);
    box.addEventListener('mousedown', block, true);
    box.addEventListener('touchstart', block, true);
    box.classList.add('bp-editing');
    return () => {
      box.removeEventListener('pointerdown', down, true);
      box.removeEventListener('mousedown', block, true);
      box.removeEventListener('touchstart', block, true);
      box.classList.remove('bp-editing');
    };
  }, [editing, boxRef, update, ed.doc.edits]);

  // Outline the selected element.
  useEffect(() => {
    const box = boxRef.current; if (!box) return;
    box.querySelectorAll('.bp-sel').forEach((n) => n.classList.remove('bp-sel'));
    if (!editing || !sel || sel.startsWith('img:')) return;
    const [p, path] = sel.split(':');
    const root = roots(box).find((r) => pageOf(r) === Number(p));
    root && byPath(root, path)?.classList.add('bp-sel');
  }, [sel, editing, doc, page, boxRef]);

  if (!ed.isAdmin) return null;

  const selEl = (() => {
    if (!sel || sel.startsWith('img:')) return null;
    const [p, path] = sel.split(':');
    const root = roots(boxRef.current).find((r) => pageOf(r) === Number(p));
    return root ? (byPath(root, path) as HTMLElement | null) : null;
  })();
  const selEdit = sel && !sel.startsWith('img:') ? doc.edits[sel] || {} : null;
  const selImg = sel?.startsWith('img:') ? doc.images.find((i) => i.id === sel.slice(4)) : null;
  const setEdit = (patch: Partial<ElEdit>) => sel && update((d) => ({ ...d, edits: { ...d.edits, [sel]: { ...d.edits[sel], ...patch } } }));
  const canText = !!selEl && selEl.childElementCount === 0;
  const origText = selEl ? selEl.dataset.bpOrig ?? selEl.textContent ?? '' : '';

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('brochure-publish', { body: { slug, ...body } });
    if (error || data?.error) throw new Error(data?.error || error?.message);
    return data;
  };

  const addImage = async (f: File) => {
    setBusy(true);
    try {
      const ext = (f.name.split('.').pop() || 'png').toLowerCase();
      const a = await call({ action: 'asset', ext });
      const up = await supabase.storage.from('studio-published').uploadToSignedUrl(a.path, a.token, f, { contentType: f.type });
      if (up.error) throw up.error;
      const id = crypto.randomUUID();
      update((d) => ({ ...d, images: [...d.images, { id, page, src: a.publicUrl, x: 20, y: 30, w: 60 }] }));
      setSel(`img:${id}`);
    } catch (e) { toast.error(`Upload failed: ${(e as Error).message}`); }
    setBusy(false);
  };

  const publish = async () => {
    setBusy(true);
    try {
      await call({ doc });
      ed.setPublished(doc);
      localStorage.removeItem(draftKey(slug));
      toast.success('Published — everyone now sees this version');
    } catch (e) { toast.error(`Publish failed: ${(e as Error).message}`); }
    setBusy(false);
  };

  const discard = () => {
    localStorage.removeItem(draftKey(slug));
    window.location.reload();
  };

  const btn = 'flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-bold disabled:opacity-50';
  const glass: React.CSSProperties = { background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(168,85,247,0.45)', color: '#e2e8f0', backdropFilter: 'blur(10px)' };

  return (
    <>
      <style>{`.bp-editing [data-bp-root] *{cursor:pointer}.bp-editing [data-bp-root] *:hover{outline:1px dashed rgba(168,85,247,.7)}.bp-sel{outline:2px solid #a855f7 !important;outline-offset:2px}`}</style>
      <div className="flex items-center gap-2 flex-wrap rounded-xl px-2 py-1.5" style={glass}>
        <button className={btn} onClick={() => { ed.setEditing(!editing); setSel(null); }}
          style={{ background: editing ? '#7c3aed' : 'rgba(255,255,255,0.08)' }}>
          <Pencil className="h-4 w-4" />{editing ? 'Editing' : 'Edit brochure'}
        </button>
        {editing && (
          <>
            <button className={btn} disabled={busy} onClick={() => fileRef.current?.click()} style={{ background: 'rgba(255,255,255,0.08)' }}>
              <ImagePlus className="h-4 w-4" />Add picture
            </button>
            <button className={btn} onClick={discard} style={{ background: 'rgba(255,255,255,0.08)' }}>
              <RotateCcw className="h-4 w-4" />Discard draft
            </button>
            <button className={btn} disabled={busy} onClick={publish} style={{ background: 'linear-gradient(135deg,#7c3aed,#0e7490)' }}>
              <Upload className="h-4 w-4" />Publish
            </button>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) addImage(f); e.target.value = ''; }} />
      </div>

      {editing && (sel && (selEdit || selImg)) && (
        <div className="fixed right-4 top-20 z-50 w-72 rounded-xl p-4 flex flex-col gap-3" style={glass}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-[0.2em]" style={{ color: '#c4b5fd' }}>{selImg ? 'PICTURE' : 'ELEMENT'}</span>
            <button aria-label="Close" onClick={() => setSel(null)}><X className="h-4 w-4" /></button>
          </div>
          {selEdit && (
            <>
              {canText ? (
                <label className="flex flex-col gap-1 text-[12px]">Text
                  <textarea rows={4} className="rounded-md p-2 text-[13px]" style={{ background: 'rgba(255,255,255,0.06)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.15)' }}
                    value={selEdit.text ?? origText} onChange={(e) => setEdit({ text: e.target.value })} />
                </label>
              ) : <span className="text-[12px]" style={{ color: '#94a3b8' }}>This is a group. Click a word to change its text.</span>}
              <div className="flex gap-3">
                <label className="flex flex-col gap-1 text-[12px]">Text color
                  <input type="color" value={selEdit.color || '#0f172a'} onChange={(e) => setEdit({ color: e.target.value })} />
                </label>
                <label className="flex flex-col gap-1 text-[12px]">Background
                  <input type="color" value={selEdit.bg || '#ffffff'} onChange={(e) => setEdit({ bg: e.target.value })} />
                </label>
              </div>
              <span className="text-[12px]" style={{ color: '#94a3b8' }}>Drag the element on the page to move it.</span>
              <div className="flex gap-2 flex-wrap">
                <button className={btn} style={{ background: 'rgba(255,255,255,0.08)' }} onClick={() => setEdit({ hidden: !selEdit.hidden })}>
                  {selEdit.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}{selEdit.hidden ? 'Show' : 'Delete'}
                </button>
                <button className={btn} style={{ background: 'rgba(255,255,255,0.08)' }} onClick={() => {
                  if (selEl && selEl.dataset.bpOrig !== undefined) selEl.textContent = selEl.dataset.bpOrig;
                  if (selEl) { selEl.style.background = ''; }
                  update((d) => { const e = { ...d.edits }; delete e[sel!]; return { ...d, edits: e }; });
                }}><RotateCcw className="h-4 w-4" />Reset</button>
              </div>
            </>
          )}
          {selImg && (
            <>
              <label className="flex flex-col gap-1 text-[12px]">Size
                <input type="range" min={5} max={100} value={selImg.w}
                  onChange={(e) => update((d) => ({ ...d, images: d.images.map((i) => i.id === selImg.id ? { ...i, w: Number(e.target.value) } : i) }))} />
              </label>
              <span className="text-[12px]" style={{ color: '#94a3b8' }}>Drag the picture to move it.</span>
              <button className={btn} style={{ background: 'rgba(239,68,68,0.25)' }} onClick={() => {
                update((d) => ({ ...d, images: d.images.filter((i) => i.id !== selImg.id) })); setSel(null);
              }}><Trash2 className="h-4 w-4" />Delete picture</button>
            </>
          )}
        </div>
      )}
      <SelBridge onImg={(id) => setSel(`img:${id}`)} />
    </>
  );
}

// Lets AddedImages report picture selection to the panel.
let imgSelect: ((id: string) => void) | null = null;
export const selectAddedImage = (id: string) => imgSelect?.(id);
function SelBridge({ onImg }: { onImg: (id: string) => void }) {
  useEffect(() => { imgSelect = onImg; return () => { imgSelect = null; }; }, [onImg]);
  return null;
}
