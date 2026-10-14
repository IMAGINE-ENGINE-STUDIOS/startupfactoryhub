/**
 * 3D model library for Brochure Studio: upload your own .glb models, sort them
 * into categories, and drag them onto any brochure page (or press Add).
 * The list is shared by every brochure and saved through brochure-publish.
 * Credits: Imagine Engine Studios Corp.
 */
import React, { useEffect, useRef, useState } from 'react';
import { X, Box, Upload, Trash2, GripVertical, Pencil, Check } from 'lucide-react';
import { toast } from 'sonner';

export type LibModel = { id: string; name: string; category: string; src: string; iosSrc?: string; addedAt?: string };
export const MODEL_MIME = 'application/x-bs-model';

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string;
const LIB_URL = `${SUPA_URL}/storage/v1/object/public/studio-published/brochures/library/models.json`;
export const fetchModels = (): Promise<LibModel[]> =>
  fetch(`${LIB_URL}?t=${Date.now()}`).then((r) => (r.ok ? r.json() : { models: [] })).then((d) => (Array.isArray(d?.models) ? d.models : [])).catch(() => []);

let mvLoaded = false;
const loadMV = () => { if (!mvLoaded) { mvLoaded = true; import('@google/model-viewer').catch(() => { mvLoaded = false; }); } };

export function ModelLibrary({ models, setModels, upload, save, onAdd, onClose }: {
  models: LibModel[];
  setModels: (m: LibModel[]) => void;
  upload: (f: File) => Promise<string>;
  save: (m: LibModel[]) => Promise<void>;
  onAdd: (m: LibModel) => void;
  onClose: () => void;
}) {
  const [cat, setCat] = useState('All');
  const [busy, setBusy] = useState(false);
  const [newCat, setNewCat] = useState('General');
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: '', category: '' });
  const file = useRef<HTMLInputElement>(null);
  useEffect(loadMV, []);

  const cats = Array.from(new Set(models.map((m) => m.category))).sort();
  const list = models.filter((m) => cat === 'All' || m.category === cat);
  const persist = async (next: LibModel[]) => {
    const prev = models; setModels(next);
    try { await save(next); } catch (e) { setModels(prev); toast.error(`Could not save the library: ${(e as Error).message}`); }
  };

  const onFiles = async (files: FileList) => {
    setBusy(true);
    const added: LibModel[] = [];
    for (const f of Array.from(files)) {
      if (!/\.glb$/i.test(f.name)) { toast.error(`${f.name}: please use a .glb file`); continue; }
      if (f.size > 50 * 1024 * 1024) { toast.error(`${f.name}: files must be under 50 MB`); continue; }
      try {
        const src = await upload(f);
        added.push({ id: crypto.randomUUID(), name: f.name.replace(/\.glb$/i, '').replace(/[-_]+/g, ' '), category: newCat.trim() || 'General', src, addedAt: new Date().toISOString() });
      } catch (e) { toast.error(`${f.name}: ${(e as Error).message}`); }
    }
    if (added.length) { await persist([...added, ...models]); toast.success(`${added.length} model${added.length > 1 ? 's' : ''} added to the library`); }
    setBusy(false);
  };

  const field: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.15)' };
  return (
    <div data-bs-ui className="fixed right-4 top-20 bottom-20 z-[72] w-80 rounded-xl flex flex-col overflow-hidden"
      style={{ background: 'rgba(15,23,42,0.96)', border: '1px solid rgba(168,85,247,0.45)', color: '#e2e8f0', backdropFilter: 'blur(10px)' }}>
      <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.2em]" style={{ color: '#c4b5fd' }}><Box className="h-4 w-4" />3D LIBRARY</span>
        <button aria-label="Close" onClick={onClose}><X className="h-4 w-4" /></button>
      </div>

      <div className="flex flex-col gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <label className="flex flex-col gap-1 text-[11px] font-semibold" style={{ color: '#cbd5e1' }}>Category for new uploads
          <input list="bs-model-cats" className="rounded-md p-1.5 text-[12px]" style={field} value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <datalist id="bs-model-cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <button disabled={busy} onClick={() => file.current?.click()} className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-bold disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#0e7490)' }}><Upload className="h-4 w-4" />{busy ? 'Uploading…' : 'Upload .glb models'}</button>
        <input ref={file} type="file" multiple accept=".glb,model/gltf-binary" className="hidden" onChange={(e) => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = ''; }} />
      </div>

      <div className="flex flex-wrap gap-1 px-3 py-2">
        {['All', ...cats].map((c) => (
          <button key={c} className="rounded-md px-2 py-1 text-[11px] font-bold" style={{ background: cat === c ? '#7c3aed' : 'rgba(255,255,255,0.08)' }} onClick={() => setCat(c)}>
            {c} <span className="opacity-60">{c === 'All' ? models.length : models.filter((m) => m.category === c).length}</span>
          </button>
        ))}
      </div>
      <p className="px-3 pb-2 text-[11px]" style={{ color: '#94a3b8' }}>Drag a model onto a page, or press Add for the current page.</p>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-3 grid grid-cols-2 gap-3 content-start">
        {!list.length && <p className="col-span-2 text-[12px] py-6 text-center" style={{ color: '#94a3b8' }}>No models yet. Upload your first .glb above.</p>}
        {list.map((m) => (
          <div key={m.id} draggable={editId !== m.id} onDragStart={(e) => { e.dataTransfer.setData(MODEL_MIME, m.id); e.dataTransfer.effectAllowed = 'copy'; }}
            className="flex flex-col gap-1.5 cursor-grab active:cursor-grabbing">
            <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio: '1', background: 'radial-gradient(circle at 50% 40%, rgba(124,58,237,0.3), rgba(11,18,32,0.9))', border: '1px solid rgba(255,255,255,0.12)' }}>
              {React.createElement('model-viewer', { src: m.src, loading: 'lazy', 'interaction-prompt': 'none', 'disable-zoom': true, exposure: '1.1', style: { width: '100%', height: '100%', pointerEvents: 'none', background: 'transparent' } })}
              <GripVertical className="absolute right-1 top-1 h-3.5 w-3.5 opacity-60" />
            </div>
            {editId === m.id ? (
              <div className="flex flex-col gap-1">
                <input className="rounded-md p-1 text-[11px]" style={field} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} aria-label="Model name" />
                <input list="bs-model-cats" className="rounded-md p-1 text-[11px]" style={field} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} aria-label="Category" />
                <button className="flex items-center justify-center gap-1 rounded-md py-1 text-[10px] font-bold" style={{ background: '#7c3aed' }}
                  onClick={() => { persist(models.map((x) => (x.id === m.id ? { ...x, name: draft.name.trim() || x.name, category: draft.category.trim() || 'General' } : x))); setEditId(null); }}>
                  <Check className="h-3 w-3" />Save</button>
              </div>
            ) : (
              <>
                <span className="text-[11px] font-semibold leading-tight truncate" title={m.name}>{m.name}</span>
                <span className="text-[10px] -mt-1" style={{ color: '#94a3b8' }}>{m.category}</span>
                <div className="flex gap-1">
                  <button className="flex-1 rounded-md py-1 text-[10px] font-bold" style={{ background: 'linear-gradient(135deg,#7c3aed,#0e7490)' }} onClick={() => onAdd(m)}>Add</button>
                  <button className="rounded-md px-1.5" title="Rename or change category" aria-label="Rename or change category" style={{ background: 'rgba(255,255,255,0.08)' }} onClick={() => { setEditId(m.id); setDraft({ name: m.name, category: m.category }); }}><Pencil className="h-3 w-3" /></button>
                  <button className="rounded-md px-1.5" title="Remove from library" aria-label="Remove from library" style={{ background: 'rgba(255,255,255,0.08)' }}
                    onClick={() => { if (window.confirm(`Remove "${m.name}" from the library? Pages already using it keep it.`)) persist(models.filter((x) => x.id !== m.id)); }}><Trash2 className="h-3 w-3" /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
