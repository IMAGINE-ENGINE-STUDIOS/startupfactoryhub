import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Search, Users, Lock, Globe, MessageCircle, CalendarDays, UserPlus, Send, Loader2,
  ImagePlus, LogOut, Trash2, Check, X, MapPin, Video, Crown,
} from 'lucide-react';

const db = supabase as any;
const CATEGORIES = ['General', 'Founders', 'Investors', 'Mentorship', 'AI & Tech', 'Industry', 'Regional', 'Events'];

interface Group {
  id: string; name: string; description: string | null; category: string;
  avatar_url: string | null; banner_url: string | null; is_public: boolean; created_by: string;
  member_count?: number;
}
interface Person { user_id: string; full_name: string | null; avatar_url: string | null }

const initials = (n?: string | null) =>
  (n || 'G').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

async function uploadImage(userId: string, file: File) {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/groups/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: false });
  if (error) throw error;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

async function fetchPeople(ids: string[]): Promise<Map<string, Person>> {
  const map = new Map<string, Person>();
  const uniq = [...new Set(ids)];
  for (let i = 0; i < uniq.length; i += 200) {
    const { data } = await supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', uniq.slice(i, i + 200));
    (data || []).forEach((p: any) => map.set(p.user_id, p));
  }
  return map;
}

export default function NetGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myIds, setMyIds] = useState<Set<string>>(new Set());
  const [invites, setInvites] = useState<{ id: string; group: Group }[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'discover' | 'mine'>('discover');
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<Group | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: g }, { data: mine }, { data: inv }] = await Promise.all([
      db.from('net_groups').select('*').order('created_at', { ascending: false }),
      db.from('net_group_members').select('group_id').eq('user_id', user.id),
      db.from('net_group_invites').select('id, group_id').eq('invited_user_id', user.id).eq('status', 'pending'),
    ]);
    const list: Group[] = g || [];
    const ids = list.map(x => x.id);
    if (ids.length) {
      const { data: members } = await db.from('net_group_members').select('group_id').in('group_id', ids);
      const counts: Record<string, number> = {};
      (members || []).forEach((m: any) => { counts[m.group_id] = (counts[m.group_id] || 0) + 1; });
      list.forEach(x => { x.member_count = counts[x.id] || 0; });
    }
    setGroups(list);
    setMyIds(new Set((mine || []).map((m: any) => m.group_id)));
    setInvites((inv || []).map((i: any) => ({ id: i.id, group: list.find(x => x.id === i.group_id) })).filter((i: any) => i.group));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const join = async (g: Group) => {
    if (!user) return;
    const { error } = await db.from('net_group_members').insert({ group_id: g.id, user_id: user.id });
    if (error) return toast.error(error.message);
    await db.from('net_group_invites').update({ status: 'accepted' }).eq('group_id', g.id).eq('invited_user_id', user.id);
    toast.success(`Joined ${g.name}`);
    load();
  };

  const decline = async (inviteId: string) => {
    await db.from('net_group_invites').update({ status: 'declined' }).eq('id', inviteId);
    load();
  };

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return groups
      .filter(g => (view === 'mine' ? myIds.has(g.id) : true))
      .filter(g => !term || g.name.toLowerCase().includes(term) || (g.description || '').toLowerCase().includes(term) || g.category.toLowerCase().includes(term));
  }, [groups, myIds, view, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-lg border border-border/50 bg-muted/20 p-1">
          {(['discover', 'mine'] as const).map(v => (
            <Button key={v} size="sm" variant="ghost" onClick={() => setView(v)}
              className={view === v ? 'bg-background text-foreground shadow-sm hover:bg-background' : 'text-muted-foreground'}>
              {v === 'discover' ? 'Discover' : `My groups (${myIds.size})`}
            </Button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search groups" className="pl-9" />
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="mr-1 h-4 w-4" /> Create group</Button>
      </div>

      {invites.length > 0 && (
        <div className="tech-card border-0 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-primary">Invitations</p>
          <div className="space-y-2">
            {invites.map(i => (
              <div key={i.id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9"><AvatarImage src={i.group.avatar_url || undefined} /><AvatarFallback>{initials(i.group.name)}</AvatarFallback></Avatar>
                <span className="flex-1 truncate text-sm font-medium">{i.group.name}</span>
                <Button size="sm" className="h-8" onClick={() => join(i.group)}><Check className="mr-1 h-3.5 w-3.5" /> Join</Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => decline(i.id)} aria-label="Decline"><X className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : shown.length === 0 ? (
        <div className="tech-card border-0 py-16 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">{view === 'mine' ? "You haven't joined any groups yet." : 'No groups yet. Start the first one.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shown.map(g => {
            const member = myIds.has(g.id);
            return (
              <div key={g.id} className="tech-card border-0 flex flex-col overflow-hidden p-0">
                <button type="button" onClick={() => setOpenGroup(g)} className="text-left">
                  <div className="h-20 w-full bg-gradient-to-br from-primary/30 via-primary/10 to-muted bg-cover bg-center"
                    style={g.banner_url ? { backgroundImage: `url(${g.banner_url})` } : undefined} />
                  <div className="-mt-6 flex items-end gap-3 px-4">
                    <Avatar className="h-12 w-12 ring-4 ring-background">
                      <AvatarImage src={g.avatar_url || undefined} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials(g.name)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="px-4 pt-2">
                    <h4 className="truncate text-sm font-semibold">{g.name}</h4>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-medium uppercase tracking-[0.12em] text-primary">{g.category}</span>
                      <span className="inline-flex items-center gap-0.5">{g.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}{g.is_public ? 'Public' : 'Private'}</span>
                      <span className="inline-flex items-center gap-0.5"><Users className="h-3 w-3" />{g.member_count || 0}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-muted-foreground">{g.description || '\u00A0'}</p>
                  </div>
                </button>
                <div className="mt-auto flex items-center gap-2 px-4 pb-4 pt-3">
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setOpenGroup(g)}>Open</Button>
                  <div className="ml-auto">
                    {member ? (
                      <Button size="sm" variant="secondary" className="h-8" onClick={() => setOpenGroup(g)}><MessageCircle className="mr-1 h-3.5 w-3.5" /> Chat</Button>
                    ) : g.is_public ? (
                      <Button size="sm" className="h-8" onClick={() => join(g)}><UserPlus className="mr-1 h-3.5 w-3.5" /> Join</Button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Invite only</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <GroupFormDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={(g) => { load(); setOpenGroup(g); }} />
      {openGroup && (
        <GroupDialog
          group={openGroup}
          isMember={myIds.has(openGroup.id)}
          onClose={() => setOpenGroup(null)}
          onChanged={load}
          onJoin={() => join(openGroup)}
        />
      )}
    </div>
  );
}

function GroupFormDialog({ open, onOpenChange, onSaved, group }: {
  open: boolean; onOpenChange: (o: boolean) => void; onSaved: (g: Group) => void; group?: Group;
}) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [isPublic, setIsPublic] = useState(true);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(group?.name || ''); setDescription(group?.description || ''); setCategory(group?.category || 'General');
    setIsPublic(group?.is_public ?? true); setAvatar(group?.avatar_url || null); setBanner(group?.banner_url || null);
  }, [open, group]);

  const pick = async (file: File | undefined, set: (u: string) => void) => {
    if (!file || !user) return;
    try { set(await uploadImage(user.id, file)); } catch (e: any) { toast.error(e.message || 'Upload failed'); }
  };

  const save = async () => {
    if (!user || !name.trim()) return toast.error('Give your group a name');
    setBusy(true);
    const payload = { name: name.trim(), description: description.trim() || null, category, is_public: isPublic, avatar_url: avatar, banner_url: banner };
    const res = group
      ? await db.from('net_groups').update(payload).eq('id', group.id).select().single()
      : await db.from('net_groups').insert({ ...payload, created_by: user.id }).select().single();
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(group ? 'Group updated' : 'Group created');
    onOpenChange(false);
    onSaved(res.data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-background backdrop-blur-none">
        <DialogHeader><DialogTitle>{group ? 'Edit group' : 'Create a group'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <label className="block h-24 cursor-pointer overflow-hidden rounded-lg bg-gradient-to-br from-primary/30 via-primary/10 to-muted bg-cover bg-center"
            style={banner ? { backgroundImage: `url(${banner})` } : undefined}>
            <input type="file" accept="image/*" className="hidden" onChange={e => pick(e.target.files?.[0], setBanner)} />
            {!banner && <span className="flex h-full items-center justify-center gap-1 text-xs text-muted-foreground"><ImagePlus className="h-4 w-4" /> Cover image</span>}
          </label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={e => pick(e.target.files?.[0], setAvatar)} />
              <Avatar className="h-14 w-14 ring-1 ring-border">
                <AvatarImage src={avatar || undefined} className="object-cover" />
                <AvatarFallback><ImagePlus className="h-4 w-4 text-muted-foreground" /></AvatarFallback>
              </Avatar>
            </label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Group name" maxLength={80} />
          </div>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this group about?" rows={3} maxLength={600} />
          <div className="flex items-center gap-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-background backdrop-blur-none">{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch id="grp-public" checked={isPublic} onCheckedChange={setIsPublic} />
              <Label htmlFor="grp-public" className="text-sm">{isPublic ? 'Public' : 'Private'}</Label>
            </div>
          </div>
          <Button className="w-full" onClick={save} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{group ? 'Save' : 'Create group'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GroupDialog({ group, isMember, onClose, onChanged, onJoin }: {
  group: Group; isMember: boolean; onClose: () => void; onChanged: () => void; onJoin: () => void;
}) {
  const { user } = useAuth();
  const [g, setG] = useState(group);
  const [members, setMembers] = useState<{ user_id: string; role: string }[]>([]);
  const [people, setPeople] = useState<Map<string, Person>>(new Map());
  const [editOpen, setEditOpen] = useState(false);
  const myRole = members.find(m => m.user_id === user?.id)?.role;
  const isAdmin = myRole === 'owner' || myRole === 'admin';
  const member = isMember || !!myRole;

  const loadMembers = async () => {
    const { data } = await db.from('net_group_members').select('user_id, role').eq('group_id', g.id);
    setMembers(data || []);
    const p = await fetchPeople((data || []).map((m: any) => m.user_id));
    setPeople(prev => new Map([...prev, ...p]));
  };
  useEffect(() => { loadMembers(); }, [g.id, isMember]);

  const leave = async () => {
    if (!user) return;
    if (myRole === 'owner') return toast.error('Owners can delete the group instead of leaving');
    await db.from('net_group_members').delete().eq('group_id', g.id).eq('user_id', user.id);
    toast.success('You left the group'); onChanged(); onClose();
  };
  const remove = async () => {
    if (!confirm(`Delete ${g.name}? This removes its chat and events.`)) return;
    const { error } = await db.from('net_groups').delete().eq('id', g.id);
    if (error) return toast.error(error.message);
    toast.success('Group deleted'); onChanged(); onClose();
  };

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden bg-background p-0 backdrop-blur-none">
        <div className="h-28 w-full shrink-0 bg-gradient-to-br from-primary/30 via-primary/10 to-muted bg-cover bg-center"
          style={g.banner_url ? { backgroundImage: `url(${g.banner_url})` } : undefined} />
        <div className="-mt-8 flex items-end gap-4 px-5">
          <Avatar className="h-16 w-16 ring-4 ring-background">
            <AvatarImage src={g.avatar_url || undefined} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">{initials(g.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 pb-1">
            <DialogTitle className="truncate text-lg">{g.name}</DialogTitle>
            <p className="text-[11px] text-muted-foreground">
              <span className="font-medium uppercase tracking-[0.12em] text-primary">{g.category}</span>
              {' · '}{g.is_public ? 'Public' : 'Private'}{' · '}{members.length} members
            </p>
          </div>
          <div className="flex gap-1 pb-1">
            {isAdmin && <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>Edit</Button>}
            {!member && g.is_public && <Button size="sm" onClick={async () => { await onJoin(); loadMembers(); }}>Join</Button>}
          </div>
        </div>

        <Tabs defaultValue={member ? 'chat' : 'about'} className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-3">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="chat" disabled={!member}><MessageCircle className="mr-1 h-3.5 w-3.5" />Chat</TabsTrigger>
            <TabsTrigger value="events"><CalendarDays className="mr-1 h-3.5 w-3.5" />Events</TabsTrigger>
            {member && <TabsTrigger value="invite"><UserPlus className="mr-1 h-3.5 w-3.5" />Invite</TabsTrigger>}
          </TabsList>

          <TabsContent value="about" className="min-h-0 flex-1 overflow-y-auto">
            {g.description && <p className="mb-4 whitespace-pre-wrap text-sm text-muted-foreground">{g.description}</p>}
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Members</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {members.map(m => {
                const p = people.get(m.user_id);
                return (
                  <div key={m.user_id} className="flex items-center gap-2 rounded-md bg-muted/30 p-2">
                    <Avatar className="h-8 w-8"><AvatarImage src={p?.avatar_url || undefined} /><AvatarFallback className="text-[10px]">{initials(p?.full_name)}</AvatarFallback></Avatar>
                    <span className="flex-1 truncate text-sm">{p?.full_name || 'Member'}</span>
                    {m.role !== 'member' && <Crown className="h-3.5 w-3.5 text-primary" aria-label={m.role} />}
                  </div>
                );
              })}
            </div>
            {member && (
              <div className="mt-6 flex gap-2">
                {myRole !== 'owner' && <Button size="sm" variant="ghost" onClick={leave}><LogOut className="mr-1 h-3.5 w-3.5" /> Leave group</Button>}
                {myRole === 'owner' && <Button size="sm" variant="ghost" className="text-destructive" onClick={remove}><Trash2 className="mr-1 h-3.5 w-3.5" /> Delete group</Button>}
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat" className="min-h-0 flex-1">
            {member && <GroupChat groupId={g.id} people={people} setPeople={setPeople} />}
          </TabsContent>

          <TabsContent value="events" className="min-h-0 flex-1 overflow-y-auto">
            <GroupEvents groupId={g.id} canCreate={member} canManage={isAdmin} />
          </TabsContent>

          {member && (
            <TabsContent value="invite" className="min-h-0 flex-1 overflow-y-auto">
              <GroupInvite groupId={g.id} memberIds={new Set(members.map(m => m.user_id))} />
            </TabsContent>
          )}
        </Tabs>

        <GroupFormDialog open={editOpen} onOpenChange={setEditOpen} group={g} onSaved={(ng) => { setG(ng); onChanged(); }} />
      </DialogContent>
    </Dialog>
  );
}

function GroupChat({ groupId, people, setPeople }: {
  groupId: string; people: Map<string, Person>; setPeople: (fn: (p: Map<string, Person>) => Map<string, Person>) => void;
}) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const ensurePeople = async (ids: string[]) => {
    const missing = ids.filter(id => !people.has(id));
    if (!missing.length) return;
    const p = await fetchPeople(missing);
    setPeople(prev => new Map([...prev, ...p]));
  };

  useEffect(() => {
    db.from('net_group_messages').select('*').eq('group_id', groupId).order('created_at', { ascending: true }).limit(300)
      .then(({ data }: any) => { setMsgs(data || []); ensurePeople((data || []).map((m: any) => m.user_id)); });
    const ch = supabase.channel(`net-group-${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'net_group_messages', filter: `group_id=eq.${groupId}` }, (payload: any) => {
        setMsgs(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
        ensurePeople([payload.new.user_id]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [groupId]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]);

  const send = async () => {
    const content = text.trim();
    if (!content || !user) return;
    setText('');
    const { data, error } = await db.from('net_group_messages').insert({ group_id: groupId, user_id: user.id, content }).select().single();
    if (error) { toast.error(error.message); setText(content); return; }
    setMsgs(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data]);
  };

  return (
    <div className="flex h-[45vh] flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto py-2 pr-1">
        {msgs.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No messages yet. Say hello.</p>}
        {msgs.map(m => {
          const mine = m.user_id === user?.id;
          const p = people.get(m.user_id);
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
              <Avatar className="h-7 w-7"><AvatarImage src={p?.avatar_url || undefined} /><AvatarFallback className="text-[10px]">{initials(p?.full_name)}</AvatarFallback></Avatar>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                {!mine && <p className="mb-0.5 text-[10px] font-semibold opacity-70">{p?.full_name || 'Member'}</p>}
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className="mt-0.5 text-[9px] opacity-60">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form className="flex gap-2 pt-2" onSubmit={e => { e.preventDefault(); send(); }}>
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="Message the group" maxLength={2000} />
        <Button type="submit" size="icon" disabled={!text.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}

function GroupEvents({ groupId, canCreate, canManage }: { groupId: string; canCreate: boolean; canManage: boolean }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [form, setForm] = useState(false);
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState('');
  const [location, setLocation] = useState('');
  const [link, setLink] = useState('');
  const [desc, setDesc] = useState('');

  const load = () => db.from('net_group_events').select('*').eq('group_id', groupId).order('starts_at', { ascending: true })
    .then(({ data }: any) => setEvents(data || []));
  useEffect(() => { load(); }, [groupId]);

  const create = async () => {
    if (!user || !title.trim() || !when) return toast.error('Add a name and a date');
    const { error } = await db.from('net_group_events').insert({
      group_id: groupId, created_by: user.id, title: title.trim(), description: desc.trim() || null,
      starts_at: new Date(when).toISOString(), location: location.trim() || null, meeting_url: link.trim() || null,
    });
    if (error) return toast.error(error.message);
    toast.success('Event created');
    setForm(false); setTitle(''); setWhen(''); setLocation(''); setLink(''); setDesc('');
    load();
  };

  const del = async (id: string) => {
    await db.from('net_group_events').delete().eq('id', id);
    load();
  };

  const now = Date.now();
  return (
    <div className="space-y-3">
      {canCreate && !form && <Button size="sm" variant="outline" onClick={() => setForm(true)}><Plus className="mr-1 h-3.5 w-3.5" /> New event</Button>}
      {form && (
        <div className="space-y-2 rounded-lg bg-muted/30 p-3">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event name" maxLength={120} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} />
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (optional)" />
          </div>
          <Input value={link} onChange={e => setLink(e.target.value)} placeholder="Meeting link (optional)" />
          <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Details (optional)" rows={2} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setForm(false)}>Cancel</Button>
            <Button size="sm" onClick={create}>Create</Button>
          </div>
        </div>
      )}
      {events.length === 0 && !form && <p className="py-8 text-center text-sm text-muted-foreground">No events scheduled.</p>}
      {events.map(ev => {
        const d = new Date(ev.starts_at);
        const past = d.getTime() < now;
        return (
          <div key={ev.id} className={`flex gap-3 rounded-lg bg-muted/30 p-3 ${past ? 'opacity-60' : ''}`}>
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-primary/10 text-primary">
              <span className="text-[10px] font-semibold uppercase">{d.toLocaleString([], { month: 'short' })}</span>
              <span className="text-base font-bold leading-none">{d.getDate()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{ev.title}</p>
              <p className="text-[11px] text-muted-foreground">{d.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              {ev.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{ev.description}</p>}
              <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                {ev.location && <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" />{ev.location}</span>}
                {ev.meeting_url && /^https?:\/\//i.test(ev.meeting_url) && (
                  <a href={ev.meeting_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline"><Video className="h-3 w-3" />Join link</a>
                )}
              </div>
            </div>
            {(canManage || ev.created_by === user?.id) && (
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => del(ev.id)} aria-label="Delete event"><Trash2 className="h-4 w-4" /></Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GroupInvite({ groupId, memberIds }: { groupId: string; memberIds: Set<string> }) {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Person[]>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    db.from('net_group_invites').select('invited_user_id').eq('group_id', groupId)
      .then(({ data }: any) => setSent(new Set((data || []).map((d: any) => d.invited_user_id))));
  }, [groupId]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('user_id, full_name, avatar_url')
        .ilike('full_name', `%${term.replace(/[%_]/g, '')}%`).limit(20);
      setResults((data || []).filter((p: any) => p.user_id !== user?.id));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const invite = async (p: Person) => {
    if (!user) return;
    const { error } = await db.from('net_group_invites').insert({ group_id: groupId, invited_user_id: p.user_id, invited_by: user.id });
    if (error && !String(error.message).includes('duplicate')) return toast.error(error.message);
    setSent(prev => new Set(prev).add(p.user_id));
    toast.success(`Invited ${p.full_name || 'member'}`);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search members by name" className="pl-9" />
      </div>
      {results.map(p => {
        const inGroup = memberIds.has(p.user_id);
        const invited = sent.has(p.user_id);
        return (
          <div key={p.user_id} className="flex items-center gap-3">
            <Avatar className="h-8 w-8"><AvatarImage src={p.avatar_url || undefined} /><AvatarFallback className="text-[10px]">{initials(p.full_name)}</AvatarFallback></Avatar>
            <span className="flex-1 truncate text-sm">{p.full_name || 'Member'}</span>
            {inGroup ? <span className="text-[11px] text-muted-foreground">Member</span>
              : invited ? <span className="text-[11px] text-muted-foreground">Invited</span>
              : <Button size="sm" className="h-8" onClick={() => invite(p)}><UserPlus className="mr-1 h-3.5 w-3.5" /> Invite</Button>}
          </div>
        );
      })}
      {q.trim().length >= 2 && results.length === 0 && <p className="text-center text-sm text-muted-foreground">No members found.</p>}
    </div>
  );
}
