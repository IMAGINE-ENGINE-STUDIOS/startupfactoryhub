/**
 * Plaza admin tools: the people dropdown (kick, mute, mute all, grant admin)
 * and level elections that are saved permanently with the level.
 * All actions run through the plaza-admin function, which checks admin rights.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, MicOff, Mic, UserX, ShieldCheck, ShieldOff, Users, Vote, X, Plus, Loader2, Trophy } from 'lucide-react';

export async function plazaAdmin(action: string, extra: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('plaza-admin', { body: { action, room: 'plaza', level: 'plaza', ...extra } });
  if (error || data?.error) throw new Error(data?.error || error?.message || 'Action failed');
  return data;
}

export type PlazaPerson = { identity: string; name: string; me?: boolean };

export function PeopleMenu({ count, people, isAdmin, selfIdentity, admins, onChanged, onNotice }: {
  count: number; people: PlazaPerson[]; isAdmin: boolean; selfIdentity: string; admins: string[];
  onChanged: () => void; onNotice: (m: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const uid = (id: string) => id.replace(/-[a-z0-9]{6}$/, '');
  const run = async (action: string, ids?: string[]) => {
    setBusy(true);
    try { await plazaAdmin(action, { identities: ids, self: selfIdentity }); onNotice('Done'); onChanged(); setSel(new Set()); }
    catch (e) { onNotice((e as Error).message); }
    finally { setBusy(false); }
  };
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  if (!isAdmin) return <div className="rounded-full bg-background/80 backdrop-blur px-3 py-1.5 text-xs pointer-events-auto">{count} in the Plaza</div>;
  return (
    <div className="relative pointer-events-auto">
      <button onClick={() => setOpen(!open)} className="rounded-full bg-background/80 backdrop-blur px-3 py-1.5 text-xs flex items-center gap-1">
        <Users className="w-3.5 h-3.5" />{count} in the Plaza<ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-9 w-[min(340px,calc(100vw-24px))] max-h-[60vh] rounded-2xl bg-background border border-border flex flex-col overflow-hidden z-40 backdrop-blur-none">
          <div className="flex flex-wrap gap-1.5 p-2 border-b border-border">
            <button disabled={busy} onClick={() => run('muteAll')} className="rounded-full bg-muted px-2.5 py-1 text-xs flex items-center gap-1"><MicOff className="w-3.5 h-3.5" />Mute all</button>
            <button disabled={busy || !sel.size} onClick={() => run('mute', [...sel])} className="rounded-full bg-muted px-2.5 py-1 text-xs disabled:opacity-40">Mute selected ({sel.size})</button>
            <button disabled={busy || !sel.size} onClick={() => run('kick', [...sel])} className="rounded-full bg-destructive/15 text-destructive px-2.5 py-1 text-xs disabled:opacity-40">Kick selected</button>
            {busy && <Loader2 className="w-4 h-4 animate-spin self-center" />}
          </div>
          <div className="overflow-y-auto p-1">
            {people.map((p) => {
              const adm = admins.includes(uid(p.identity));
              return (
                <div key={p.identity} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50">
                  {!p.me && <input type="checkbox" checked={sel.has(p.identity)} onChange={() => toggle(p.identity)} aria-label={`Select ${p.name}`} />}
                  <span className="flex-1 text-sm truncate">{p.name}{p.me ? ' (you)' : ''}</span>
                  {adm && <span className="text-[10px] rounded-full bg-primary/15 text-primary px-1.5">Admin</span>}
                  {!p.me && (
                    <>
                      <button title="Mute" onClick={() => run('mute', [p.identity])}><MicOff className="w-4 h-4" /></button>
                      <button title="Allow to talk" onClick={() => run('unmute', [p.identity])}><Mic className="w-4 h-4" /></button>
                      <button title="Kick out" onClick={() => run('kick', [p.identity])}><UserX className="w-4 h-4 text-destructive" /></button>
                      {adm
                        ? <button title="Remove admin powers" onClick={() => run('revoke', [p.identity])}><ShieldOff className="w-4 h-4" /></button>
                        : <button title="Give admin powers" onClick={() => run('grant', [p.identity])}><ShieldCheck className="w-4 h-4" /></button>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type ElectionRow = { id: string; title: string; description: string; options: string[]; status: 'open' | 'closed'; createdAt: string; closedAt?: string; tally: number[]; voters: number };

export function LevelElectionsPanel({ isAdmin, onClose, onChanged, refreshKey }: { isAdmin: boolean; onClose: () => void; onChanged: () => void; refreshKey: number }) {
  const [list, setList] = useState<ElectionRow[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState(''); const [desc, setDesc] = useState(''); const [opts, setOpts] = useState(['', '']);
  const [msg, setMsg] = useState('');
  const [voted, setVoted] = useState<Record<string, boolean>>(() => { try { return JSON.parse(localStorage.getItem('sfh-plaza-voted') || '{}'); } catch { return {}; } });
  const load = () => plazaAdmin('elections').then((d) => setList(d.elections || [])).catch((e) => { setList([]); setMsg(e.message); });
  useEffect(() => { load(); }, [refreshKey]);

  const act = async (fn: () => Promise<unknown>) => { setMsg(''); try { await fn(); await load(); onChanged(); } catch (e) { setMsg((e as Error).message); } };
  const create = () => act(async () => { await plazaAdmin('createElection', { title, description: desc, options: opts }); setCreating(false); setTitle(''); setDesc(''); setOpts(['', '']); });
  const vote = (id: string, i: number) => act(async () => {
    await plazaAdmin('vote', { electionId: id, option: i });
    const n = { ...voted, [id]: true }; setVoted(n); localStorage.setItem('sfh-plaza-voted', JSON.stringify(n));
  });

  return (
    <div className="absolute right-3 top-14 bottom-24 w-[min(340px,calc(100vw-24px))] rounded-2xl bg-background/95 border border-border flex flex-col overflow-hidden z-20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="font-medium text-sm flex items-center gap-1.5"><Vote className="w-4 h-4" />Plaza elections</span>
        <button onClick={onClose} aria-label="Close"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {msg && <p className="text-xs text-destructive">{msg}</p>}
        {isAdmin && !creating && <button onClick={() => setCreating(true)} className="w-full rounded-lg border border-dashed border-border py-2 text-xs flex items-center justify-center gap-1"><Plus className="w-4 h-4" />Call an election</button>}
        {creating && (
          <div className="rounded-lg border border-border p-3 space-y-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is the vote for?" className="w-full rounded-md border bg-background px-2 py-1.5 text-sm" />
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Details (optional)" rows={2} className="w-full rounded-md border bg-background px-2 py-1.5 text-sm" />
            {opts.map((o, i) => (
              <input key={i} value={o} onChange={(e) => setOpts(opts.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Option ${i + 1}`} className="w-full rounded-md border bg-background px-2 py-1.5 text-sm" />
            ))}
            <div className="flex gap-2">
              <button onClick={() => setOpts([...opts, ''])} className="text-xs rounded-full bg-muted px-3 py-1">Add option</button>
              <button onClick={create} className="text-xs rounded-full bg-primary text-primary-foreground px-3 py-1 ml-auto">Start election</button>
              <button onClick={() => setCreating(false)} className="text-xs rounded-full px-2 py-1">Cancel</button>
            </div>
          </div>
        )}
        {list === null && <Loader2 className="w-4 h-4 animate-spin mx-auto" />}
        {list?.length === 0 && <p className="text-sm text-muted-foreground">No elections yet.</p>}
        {list?.map((e) => {
          const total = e.tally.reduce((a, b) => a + b, 0);
          const top = Math.max(...e.tally);
          return (
            <div key={e.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{e.title}</p>
                  {e.description && <p className="text-xs text-muted-foreground">{e.description}</p>}
                  <p className="text-[10px] text-muted-foreground">{new Date(e.createdAt).toLocaleString()} · {e.status === 'open' ? 'Open' : 'Closed'} · {e.voters} votes</p>
                </div>
                {isAdmin && e.status === 'open' && <button onClick={() => act(() => plazaAdmin('closeElection', { electionId: e.id }))} className="text-[11px] rounded-full bg-muted px-2 py-0.5 shrink-0">Close</button>}
              </div>
              {e.options.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 relative rounded-md bg-muted/40 overflow-hidden text-xs px-2 py-1.5">
                    <div className="absolute inset-y-0 left-0 bg-primary/20" style={{ width: total ? `${(e.tally[i] / total) * 100}%` : 0 }} />
                    <span className="relative flex items-center gap-1">{e.status === 'closed' && total > 0 && e.tally[i] === top && <Trophy className="w-3.5 h-3.5" />}{o} · {e.tally[i]}</span>
                  </div>
                  {e.status === 'open' && !voted[e.id] && <button onClick={() => vote(e.id, i)} className="text-[11px] rounded-full bg-primary text-primary-foreground px-2.5 py-1">Vote</button>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
