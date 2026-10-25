/**
 * Office floor admin tab — the Plaza's moderation pattern, per floor.
 * People: mute / unmute / kick / ban / grant & revoke floor admin.
 * Level access: Public, Passcode, or Private (invitation link only).
 * Everything runs through the plaza-admin function with this floor's own
 * room name; bans and access are enforced by livekit-token at the door.
 * Non-admins just see the headcount pill.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, MicOff, Mic, UserX, ShieldCheck, ShieldOff, Users, Loader2, Ban, Lock, Globe, KeyRound, MailPlus, Copy, RefreshCw } from 'lucide-react';

export async function officeAdmin(room: string, action: string, extra: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('plaza-admin', { body: { action, room, level: room, ...extra } });
  if (error) {
    let message = error.message;
    try { const parsed = await (error as any).context?.json?.(); if (parsed?.error) message = parsed.error; } catch { /* keep default */ }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export type OfficePerson = { identity: string; name: string; me?: boolean };
type AccessMode = 'public' | 'passcode' | 'private';
type BanRec = { id: string; name?: string; at: string };

export function OfficeAdminTab({ room, floorLabel, floorPath, people, selfIdentity }: {
  room: string;
  floorLabel: string;
  floorPath: string;
  people: OfficePerson[];
  selfIdentity: string;
}) {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [admins, setAdmins] = useState<string[]>([]);
  const [mode, setMode] = useState<AccessMode>('public');
  const [invite, setInvite] = useState<string | null>(null);
  const [hasPasscode, setHasPasscode] = useState(false);
  const [bans, setBans] = useState<BanRec[]>([]);
  const [passDraft, setPassDraft] = useState('');
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');

  const uid = (id: string) => id.replace(/-[a-z0-9]{6}$/, '');
  const inviteUrl = invite ? `${window.location.origin}${floorPath}${floorPath.includes('?') ? '&' : '?'}invite=${invite}` : '';

  const refreshAccess = async () => {
    try {
      const a = await officeAdmin(room, 'getAccess');
      setMode((a.mode as AccessMode) || 'public');
      setInvite(a.invite ?? null);
      setHasPasscode(!!a.hasPasscode);
    } catch { /* function not deployed yet or signed out — keep defaults */ }
    try {
      const b = await officeAdmin(room, 'bans');
      setBans(b.bans || []);
    } catch { /* admins only */ }
  };

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const w = await officeAdmin(room, 'whoami');
        if (!live) return;
        setIsAdmin(!!w.isAdmin);
        setAdmins(w.admins || []);
        if (w.isAdmin) await refreshAccess();
      } catch { if (live) setIsAdmin(false); }
    })();
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  const run = async (label: string, fn: () => Promise<unknown>, done?: string) => {
    setBusy(label); setNote('');
    try { await fn(); if (done) setNote(done); }
    catch (e) { setNote((e as Error).message); }
    finally { setBusy(''); }
  };

  if (!isAdmin) {
    return <div className="rounded-full bg-background/90 border border-border px-3 py-1.5 text-xs shadow pointer-events-auto">{people.length} on this floor</div>;
  }

  return (
    <div className="relative pointer-events-auto">
      <button onClick={() => setOpen((o) => !o)} className="rounded-full bg-background/90 border border-border px-3 py-1.5 text-xs shadow flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" />{people.length} on this floor · Admin<ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-9 w-[min(350px,calc(100vw-24px))] max-h-[62vh] overflow-y-auto overscroll-contain touch-pan-y rounded-2xl bg-background border border-border shadow-2xl z-40">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold flex-1">People on {floorLabel}</span>
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              <button disabled={!!busy} onClick={() => run('muteAll', () => officeAdmin(room, 'muteAll', { self: selfIdentity }), 'Everyone muted.')} className="rounded-full bg-muted px-2.5 py-1 text-xs flex items-center gap-1 disabled:opacity-40"><MicOff className="w-3.5 h-3.5" />Mute all</button>
            </div>
            <div className="mt-1">
              {people.map((p) => {
                const adm = admins.includes(uid(p.identity));
                return (
                  <div key={p.identity} className="flex items-center gap-1.5 px-1.5 py-1.5 rounded-lg hover:bg-muted/50">
                    <span className="flex-1 text-sm truncate">{p.name}{p.me ? ' (you)' : ''}</span>
                    {adm && <span className="text-[10px] rounded-full bg-primary/15 text-primary px-1.5">Admin</span>}
                    {!p.me && (
                      <>
                        <button title="Mute" disabled={!!busy} onClick={() => run('mute', () => officeAdmin(room, 'mute', { identities: [p.identity] }))}><MicOff className="w-4 h-4" /></button>
                        <button title="Allow to talk" disabled={!!busy} onClick={() => run('unmute', () => officeAdmin(room, 'unmute', { identities: [p.identity] }))}><Mic className="w-4 h-4" /></button>
                        <button title="Kick out" disabled={!!busy} onClick={() => run('kick', () => officeAdmin(room, 'kick', { identities: [p.identity] }), `${p.name} was kicked.}`)}><UserX className="w-4 h-4 text-destructive" /></button>
                        <button title="Ban — kick and block re-entry" disabled={!!busy} onClick={() => run('ban', async () => { const r = await officeAdmin(room, 'ban', { identities: [p.identity], names: { [p.identity]: p.name } }); setBans(r.bans || []); }, `${p.name} was banned from ${floorLabel}.`)}><Ban className="w-4 h-4 text-destructive" /></button>
                        {adm
                          ? <button title="Remove admin powers" disabled={!!busy} onClick={() => run('revoke', async () => { const r = await officeAdmin(room, 'revoke', { identities: [p.identity] }); setAdmins(r.admins || []); })}><ShieldOff className="w-4 h-4" /></button>
                          : <button title="Give admin powers" disabled={!!busy} onClick={() => run('grant', async () => { const r = await officeAdmin(room, 'grant', { identities: [p.identity] }); setAdmins(r.admins || []); }, `${p.name} is now an admin of ${floorLabel}.`)}><ShieldCheck className="w-4 h-4" /></button>}
                      </>
                    )}
                  </div>
                );
              })}
              {people.length <= 1 && <p className="px-1.5 py-1 text-xs text-muted-foreground">Nobody else is here right now.</p>}
            </div>
          </div>

          <div className="p-3 border-b border-border">
            <div className="text-xs font-semibold flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" />Who can enter {floorLabel}</div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <button disabled={!!busy} onClick={() => run('pub', async () => { await officeAdmin(room, 'setAccess', { mode: 'public' }); setMode('public'); }, 'This floor is public.')} className={`rounded-lg border px-2 py-1.5 text-xs flex items-center justify-center gap-1 ${mode === 'public' ? 'bg-emerald-500 text-emerald-950 font-semibold border-transparent' : 'border-border hover:bg-muted'}`}><Globe className="w-3.5 h-3.5" />Public</button>
              <button disabled={!!busy} onClick={() => { if (hasPasscode) run('pc', async () => { await officeAdmin(room, 'setAccess', { mode: 'passcode' }); setMode('passcode'); }, 'Passcode is on for this floor.'); else setNote('Type a passcode below, then tap Set passcode.'); }} className={`rounded-lg border px-2 py-1.5 text-xs flex items-center justify-center gap-1 ${mode === 'passcode' ? 'bg-emerald-500 text-emerald-950 font-semibold border-transparent' : 'border-border hover:bg-muted'}`}><KeyRound className="w-3.5 h-3.5" />Passcode</button>
              <button disabled={!!busy} onClick={() => run('pv', async () => { const r = await officeAdmin(room, 'setAccess', { mode: 'private' }); setMode('private'); setInvite(r.invite ?? null); }, 'This floor is private — invitation link only.')} className={`rounded-lg border px-2 py-1.5 text-xs flex items-center justify-center gap-1 ${mode === 'private' ? 'bg-emerald-500 text-emerald-950 font-semibold border-transparent' : 'border-border hover:bg-muted'}`}><MailPlus className="w-3.5 h-3.5" />Private</button>
            </div>
            <div className="mt-2 flex gap-1.5">
              <input type="password" value={passDraft} onChange={(e) => setPassDraft(e.target.value)} placeholder={hasPasscode ? 'New passcode…' : 'Set a passcode…'} className="flex-1 min-w-0 rounded-lg border border-border bg-background px-2.5 py-1.5 text-base" />
              <button disabled={!!busy || !passDraft.trim()} onClick={() => run('setpass', async () => { await officeAdmin(room, 'setAccess', { mode: 'passcode', passcode: passDraft.trim() }); setMode('passcode'); setHasPasscode(true); setPassDraft(''); }, 'Passcode set — visitors must enter it to come in.')} className="rounded-full bg-muted px-3 py-1.5 text-xs disabled:opacity-40">Set passcode</button>
            </div>
            {mode === 'private' && invite && (
              <div className="mt-2">
                <div className="text-[11px] text-muted-foreground">Invitation link — anyone with it can enter:</div>
                <div className="mt-1 flex gap-1.5">
                  <input readOnly value={inviteUrl} onFocus={(e) => e.target.select()} className="flex-1 min-w-0 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs" />
                  <button onClick={() => { void navigator.clipboard?.writeText(inviteUrl); setNote('Invitation link copied.'); }} className="rounded-full bg-muted px-2.5 py-1.5 text-xs flex items-center gap-1"><Copy className="w-3.5 h-3.5" />Copy</button>
                  <button disabled={!!busy} onClick={() => run('rot', async () => { const r = await officeAdmin(room, 'setAccess', { mode: 'private', rotateInvite: true }); setInvite(r.invite ?? null); }, 'New invitation link — the old one no longer works.')} className="rounded-full bg-muted px-2.5 py-1.5 text-xs flex items-center gap-1 disabled:opacity-40"><RefreshCw className="w-3.5 h-3.5" />New link</button>
                </div>
              </div>
            )}
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">Access is checked at the door when someone joins. Bans bind signed-in accounts; guests without an account can be kicked but not banned. Admins always get in.</p>
          </div>

          <div className="p-3">
            <div className="text-xs font-semibold flex items-center gap-1.5"><Ban className="w-3.5 h-3.5" />Banned from {floorLabel}</div>
            {bans.length === 0 && <p className="mt-1 text-xs text-muted-foreground">No bans.</p>}
            {bans.map((b) => (
              <div key={b.id} className="mt-1 flex items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-muted/50">
                <span className="flex-1 text-sm truncate">{b.name || b.id}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(b.at).toLocaleDateString()}</span>
                <button disabled={!!busy} onClick={() => run('unban', async () => { await officeAdmin(room, 'unban', { identities: [b.id] }); setBans((cur) => cur.filter((x) => x.id !== b.id)); }, 'Ban lifted.')} className="rounded-full bg-muted px-2.5 py-1 text-xs disabled:opacity-40">Unban</button>
              </div>
            ))}
            {note && <p className="mt-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs">{note}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
