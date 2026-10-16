import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { openDeckUrl, normalizeDeckUrl } from '@/lib/deckUrl';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, FileText, Lock, Clock, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Status = {
  has_deck: boolean; visibility: 'public' | 'request' | 'private'; deck_url: string | null; pending: boolean;
  has_data_room?: boolean; data_room_url?: string | null; own_data_room_url?: string | null;
  own_deck_url?: string | null; requests?: { id: string; name: string; email: string | null; role: string | null; at: string }[];
};

const SFH_ROOM = 'https://startupfactoryhub.com/data-room';
const DataRoomContent = lazy(() => import('@/pages/InvestorDataRoom').then((m) => ({ default: m.DataRoomContent })));

/** In-profile Investor Data Room: the SFH room renders inline; other profiles show their external link. Credits: Imagine Engine Studios Corp. */
export function DataRoomViewerButton({ ownerId }: { ownerId: string }) {
  const { user } = useAuth();
  const [s, setS] = useState<Status | null>(null);
  useEffect(() => { call({ action: 'status', owner_id: ownerId }).then(setS).catch(() => setS(null)); }, [ownerId, user?.id]);
  if (!s?.has_data_room) return null;
  const external = s.own_data_room_url || (s.data_room_url !== SFH_ROOM ? s.data_room_url : null);
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2"><Lock className="h-4 w-4" />Investor Data Room</h4>
      {s.data_room_url === SFH_ROOM && (
        <Suspense fallback={<p className="text-xs text-muted-foreground">Loading data room…</p>}>
          <DataRoomContent embedded />
        </Suspense>
      )}
      {external ? (
        <Button onClick={() => openDeckUrl(external)} variant="outline" className="w-full gap-2">
          <ExternalLink className="h-4 w-4" /> Open external Data Room link
        </Button>
      ) : !s.data_room_url && (
        <Button disabled variant="outline" className="w-full gap-2"><Lock className="h-4 w-4" /> Available on approved deck access</Button>
      )}
    </div>
  );
}

const call = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('deck-access', { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

/** Viewer-side deck button shown in a profile. */
export function DeckViewerButton({ ownerId, label = 'Pitch Deck' }: { ownerId: string; label?: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [s, setS] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { call({ action: 'status', owner_id: ownerId }).then(setS).catch(() => setS(null)); }, [ownerId, user?.id]);
  if (!s?.has_deck) return null;
  if (s.visibility === 'private' && !s.deck_url) return null;
  const request = async () => {
    if (!user) { toast({ title: 'Sign in to request access' }); return; }
    setBusy(true);
    try { await call({ action: 'request', owner_id: ownerId }); setS({ ...s, pending: true }); toast({ title: 'Request sent', description: 'You will be notified when it is approved.' }); }
    catch (e) { toast({ title: 'Could not send request', description: (e as Error).message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><FileText className="h-4 w-4" />{label}</h4>
      {s.deck_url ? (
        <Button onClick={() => openDeckUrl(s.deck_url!)} variant="outline" className="w-full gap-2">
          <ExternalLink className="h-4 w-4" /> View {label}
        </Button>
      ) : s.pending ? (
        <Button disabled variant="outline" className="w-full gap-2"><Clock className="h-4 w-4" /> Request Pending</Button>
      ) : (
        <Button onClick={request} disabled={busy} variant="outline" className="w-full gap-2"><Lock className="h-4 w-4" /> Request Access</Button>
        )}
    </div>
  );
}

/** Owner-side settings: deck link, visibility and pending requests. */
export function DeckAccessSettings({ showLinkField = true }: { showLinkField?: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [s, setS] = useState<Status | null>(null);
  const [link, setLink] = useState('');
  const [room, setRoom] = useState('');
  const load = useCallback(() => {
    if (!user) return;
    call({ action: 'status', owner_id: user.id }).then((d) => { setS(d); setLink(d.own_deck_url || ''); setRoom(d.own_data_room_url || ''); }).catch(() => {});
  }, [user]);
  useEffect(load, [load]);
  if (!user) return null;
  const save = async (patch: Record<string, unknown>) => {
    try { await call({ action: 'settings', ...patch }); toast({ title: 'Deck settings saved' }); load(); }
    catch (e) { toast({ title: 'Save failed', description: (e as Error).message, variant: 'destructive' }); }
  };
  const respond = async (id: string, approve: boolean) => {
    try { await call({ action: 'respond', requester_id: id, approve }); load(); }
    catch (e) { toast({ title: 'Failed', description: (e as Error).message, variant: 'destructive' }); }
  };
  return (
    <Card className="tech-card border-0">
      <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Lock className="h-5 w-5 text-primary" />Deck Visibility</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {showLinkField && (
          <div className="flex gap-2">
            <Input placeholder="Deck link (PDF, Docsend, Drive...)" value={link} onChange={(e) => setLink(e.target.value)} />
            <Button variant="outline" onClick={() => save({ deck_url: link })}>Save</Button>
          </div>
        )}
        <div className="space-y-1">
          <p className="text-sm font-medium">Investor Data Room link</p>
          <div className="flex gap-2">
            <Input placeholder="Data room link (Docsend, Drive, Notion, Carta...)" value={room} onChange={(e) => setRoom(e.target.value)} />
            <Button variant="outline" onClick={() => save({ data_room_url: room })}>Save</Button>
          </div>
          <p className="text-xs text-muted-foreground">Shown on your profile with the same visibility as your deck.</p>
        </div>
        <Select value={s?.visibility || 'public'} onValueChange={(v) => save({ visibility: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent className="bg-background backdrop-blur-none">
            <SelectItem value="public">Public — anyone can open it</SelectItem>
            <SelectItem value="request">Under request — I approve each viewer</SelectItem>
            <SelectItem value="private">Hidden</SelectItem>
          </SelectContent>
        </Select>
        {!!s?.requests?.length && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Pending requests</p>
            {s.requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
                <div className="min-w-0"><p className="text-sm truncate">{r.name}</p><p className="text-xs text-muted-foreground truncate">{[r.role, r.email].filter(Boolean).join(' · ')}</p></div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" onClick={() => respond(r.id, true)}><Check className="h-4 w-4 mr-1" />Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => respond(r.id, false)}><X className="h-4 w-4 mr-1" />Decline</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Inline approve/decline for a pitch_deck_request notification. */
export function DeckRequestActions({ requesterId }: { requesterId: string }) {
  const [done, setDone] = useState<string | null>(null);
  if (done) return <span className="text-xs text-muted-foreground">{done}</span>;
  const go = async (approve: boolean) => { try { await call({ action: 'respond', requester_id: requesterId, approve }); setDone(approve ? 'Approved' : 'Declined'); } catch { setDone('Failed'); } };
  return (
    <div className="flex gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
      <Button size="sm" className="h-7" onClick={() => go(true)}>Approve</Button>
      <Button size="sm" variant="outline" className="h-7" onClick={() => go(false)}>Decline</Button>
    </div>
  );
}
