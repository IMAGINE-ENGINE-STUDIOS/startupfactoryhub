import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFollow } from '@/hooks/useFollow';
import { useConnection } from '@/hooks/useConnection';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, MapPin, Globe, Linkedin, MessageCircle, UserPlus, UserCheck, Plus, Loader2, Pencil, Trash2,
  ShoppingBag, Image as ImageIcon, CalendarDays, Briefcase, FileText, Newspaper, Eye, EyeOff, Upload, Play, Clock,
} from 'lucide-react';

const db = supabase as any;
const SECTION_KINDS: Record<string, string> = {
  pitch: 'Pitch', mandate: 'Mandate', business_plan: 'Business plan', about: 'About', custom: 'Custom',
};
const money = (c: number, cur = 'usd') => (c / 100).toLocaleString(undefined, { style: 'currency', currency: cur.toUpperCase() });
const initials = (n?: string | null) => (n || 'U').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
const isVideo = (u: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);
const safeUrl = (u?: string | null) => (u && /^https?:\/\//i.test(u) ? u : undefined);

async function upload(userId: string, file: File, folder: string) {
  if (file.size > 50 * 1024 * 1024) throw new Error('Files must be under 50 MB');
  const ext = file.name.split('.').pop() || 'bin';
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, file);
  if (error) throw error;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

export default function PublicUserPage() {
  const { userId = '' } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const isOwner = user?.id === userId;
  const { isFollowing, followersCount, followingCount, followUser, unfollowUser } = useFollow(userId);
  const { status: connStatus, sendConnectionRequest } = useConnection(userId);

  const [profile, setProfile] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionEdit, setSectionEdit] = useState<any | null>(null);
  const [listingEdit, setListingEdit] = useState<any | null>(null);

  const loadOwned = async () => {
    const [s, l, m] = await Promise.all([
      db.from('profile_sections').select('*').eq('user_id', userId).order('position'),
      db.from('profile_listings').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      db.from('profile_media').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);
    setSections(s.data || []); setListings(l.data || []); setMedia(m.data || []);
  };

  useEffect(() => {
    if (!/^[0-9a-f-]{36}$/i.test(userId)) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: r }, { data: fp }, { data: ev }, { data: comps }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, avatar_url, bio, location, website, linkedin_url, industry, is_official_mentor').eq('user_id', userId).maybeSingle(),
        supabase.rpc('get_user_role', { _user_id: userId }),
        supabase.from('feed_posts').select('id, content, media_urls, created_at, likes_count, comments_count').eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
        supabase.from('events').select('id, title, start_date, location, is_virtual, banner_url').or(`organizer_id.eq.${userId},host_id.eq.${userId}`).order('start_date', { ascending: false }).limit(30),
        supabase.from('companies').select('id').eq('user_id', userId),
      ]);
      setProfile(p); setRole((r as any) || null); setPosts(fp || []); setEvents(ev || []);
      const ids = (comps || []).map((c: any) => c.id);
      if (ids.length) {
        const { data: j } = await supabase.from('jobs').select('id, title, location, job_type, status, created_at').in('company_id', ids).order('created_at', { ascending: false }).limit(30);
        setJobs((j || []).filter((x: any) => x.status !== 'closed'));
      }
      await loadOwned();
      setLoading(false);
    })();
  }, [userId]);

  // Confirm a purchase after returning from Stripe
  useEffect(() => {
    const sid = params.get('session_id');
    if (params.get('sale') === 'success' && sid) {
      supabase.functions.invoke('profile-checkout', { body: { action: 'verify', session_id: sid } }).then(({ data }) => {
        if (data?.paid) toast.success(`Purchase complete: ${data.title}`);
        params.delete('sale'); params.delete('session_id'); setParams(params, { replace: true });
      });
    } else if (params.get('sale') === 'cancel') {
      toast('Checkout cancelled'); params.delete('sale'); setParams(params, { replace: true });
    }
  }, []);

  const buy = async (listing: any) => {
    const { data, error } = await supabase.functions.invoke('profile-checkout', {
      body: { listing_id: listing.id, qty: 1, returnUrl: `${window.location.origin}/u/${userId}?tab=shop` },
    });
    if (error || !data?.url) return toast.error(data?.error || error?.message || 'Checkout failed');
    window.location.href = data.url;
  };

  const removeSection = async (id: string) => { await db.from('profile_sections').delete().eq('id', id); loadOwned(); };
  const toggleSection = async (s: any) => { await db.from('profile_sections').update({ visible: !s.visible }).eq('id', s.id); loadOwned(); };
  const removeListing = async (id: string) => { if (confirm('Delete this item?')) { await db.from('profile_listings').delete().eq('id', id); loadOwned(); } };
  const removeMedia = async (id: string) => { await db.from('profile_media').delete().eq('id', id); loadOwned(); };
  const addMedia = async (files: FileList | null) => {
    if (!files || !user) return;
    try {
      for (const f of Array.from(files).slice(0, 10)) {
        const url = await upload(user.id, f, 'profile-media');
        await db.from('profile_media').insert({ user_id: user.id, url, media_type: f.type.startsWith('video') ? 'video' : 'image' });
      }
      toast.success('Added to gallery'); loadOwned();
    } catch (e: any) { toast.error(e.message); }
  };

  const products = listings.filter(l => l.kind === 'product');
  const services = listings.filter(l => l.kind === 'service');
  const tabs = useMemo(() => {
    const t: { value: string; label: string; icon: any }[] = [{ value: 'about', label: 'About', icon: FileText }];
    sections.filter(s => s.visible || isOwner).forEach(s => t.push({ value: `s-${s.id}`, label: s.title, icon: FileText }));
    if (listings.length || isOwner) t.push({ value: 'shop', label: 'Products & services', icon: ShoppingBag });
    if (media.length || isOwner) t.push({ value: 'media', label: 'Media', icon: ImageIcon });
    t.push({ value: 'posts', label: 'Posts', icon: Newspaper });
    if (events.length) t.push({ value: 'events', label: 'Events', icon: CalendarDays });
    if (jobs.length) t.push({ value: 'jobs', label: 'Jobs', icon: Briefcase });
    return t;
  }, [sections, listings, media, events, jobs, isOwner]);

  const tab = params.get('tab') && tabs.some(t => t.value === params.get('tab')) ? params.get('tab')! : 'about';

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!profile) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <p className="text-muted-foreground">This profile doesn't exist.</p>
      <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
    </div>
  );

  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Member';

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-40 w-full bg-gradient-to-br from-primary/30 via-primary/10 to-muted sm:h-56">
        <Button variant="ghost" size="sm" className="absolute left-3 top-3 bg-background/70 backdrop-blur" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="-mt-16 flex flex-col gap-4 sm:-mt-20 sm:flex-row sm:items-end">
          <Avatar className="h-32 w-32 ring-4 ring-background sm:h-40 sm:w-40">
            <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-4xl font-semibold text-primary">{initials(profile.full_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 sm:pb-2">
            <h1 className="truncate text-2xl font-bold sm:text-3xl">{profile.full_name || 'Member'}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="font-medium uppercase tracking-[0.12em] text-primary text-xs">{roleLabel}</span>
              {profile.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>}
              {safeUrl(profile.website) && <a href={safeUrl(profile.website)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground"><Globe className="h-3.5 w-3.5" />Website</a>}
              {safeUrl(profile.linkedin_url) && <a href={safeUrl(profile.linkedin_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground"><Linkedin className="h-3.5 w-3.5" />LinkedIn</a>}
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span><b className="text-foreground">{followersCount}</b> followers</span>
              <span><b className="text-foreground">{followingCount}</b> following</span>
            </div>
          </div>
          {!isOwner && user && (
            <div className="flex flex-wrap gap-2 sm:pb-2">
              <Button variant={isFollowing ? 'outline' : 'default'} size="sm" onClick={() => (isFollowing ? unfollowUser() : followUser())}>
                {isFollowing ? <><UserCheck className="mr-1 h-4 w-4" />Following</> : <><UserPlus className="mr-1 h-4 w-4" />Follow</>}
              </Button>
              {connStatus === 'none' ? (
                <Button variant="outline" size="sm" onClick={async () => { try { await sendConnectionRequest(); toast.success('Connection request sent'); } catch { toast.error('Could not send request'); } }}>
                  <UserPlus className="mr-1 h-4 w-4" />Connect
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => window.dispatchEvent(new CustomEvent('openFloatingChat', { detail: { userId } }))}>
                  <MessageCircle className="mr-1 h-4 w-4" />Message
                </Button>
              )}
            </div>
          )}
          {isOwner && (
            <div className="flex flex-wrap gap-2 sm:pb-2">
              <Button size="sm" variant="outline" onClick={() => setSectionEdit({ kind: 'pitch', title: 'Pitch', body: '', visible: true })}><Plus className="mr-1 h-4 w-4" />Add tab</Button>
              <Button size="sm" onClick={() => setListingEdit({ kind: 'product', title: '', description: '', price: '', images: [], video_url: '', active: true })}><Plus className="mr-1 h-4 w-4" />Add product or service</Button>
            </div>
          )}
        </div>

        <Tabs value={tab} onValueChange={v => { params.set('tab', v); setParams(params, { replace: true }); }} className="mt-6">
          <div className="overflow-x-auto">
            <TabsList className="h-auto w-max gap-1 p-1">
              {tabs.map(t => <TabsTrigger key={t.value} value={t.value} className="gap-1.5 px-3 py-2"><t.icon className="h-4 w-4" />{t.label}</TabsTrigger>)}
            </TabsList>
          </div>

          <TabsContent value="about" className="mt-4">
            <div className="tech-card border-0 p-5">
              <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{profile.bio || 'No bio yet.'}</p>
              {profile.industry && <p className="mt-3 text-xs"><span className="text-muted-foreground">Industry: </span>{profile.industry}</p>}
            </div>
          </TabsContent>

          {sections.filter(s => s.visible || isOwner).map(s => (
            <TabsContent key={s.id} value={`s-${s.id}`} className="mt-4">
              <div className="tech-card border-0 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{SECTION_KINDS[s.kind] || 'Custom'}</span>
                  {isOwner && (
                    <div className="ml-auto flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" title={s.visible ? 'Hide' : 'Show'} onClick={() => toggleSection(s)}>{s.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit" onClick={() => setSectionEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Delete" onClick={() => removeSection(s.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>
                <h2 className="mb-2 text-lg font-semibold">{s.title}</h2>
                {s.body && <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{s.body}</p>}
                {safeUrl(s.file_url) && (
                  /\.pdf(\?|$)/i.test(s.file_url)
                    ? <iframe src={s.file_url} title={s.title} className="mt-4 h-[70vh] w-full rounded-lg border border-border" />
                    : isVideo(s.file_url) ? <video src={s.file_url} controls className="mt-4 w-full rounded-lg" />
                    : <a href={s.file_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"><FileText className="h-4 w-4" />Open attached file</a>
                )}
              </div>
            </TabsContent>
          ))}

          <TabsContent value="shop" className="mt-4 space-y-6">
            {[['Products', products], ['Services', services]].map(([label, items]: any) => items.length > 0 && (
              <div key={label}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((l: any) => (
                    <div key={l.id} className={`tech-card border-0 flex flex-col overflow-hidden p-0 ${!l.active ? 'opacity-60' : ''}`}>
                      <div className="aspect-[4/3] w-full bg-muted">
                        {l.images?.[0] ? <img src={l.images[0]} alt={l.title} className="h-full w-full object-cover" loading="lazy" />
                          : safeUrl(l.video_url) ? <video src={l.video_url} className="h-full w-full object-cover" muted />
                          : <div className="flex h-full items-center justify-center"><ShoppingBag className="h-8 w-8 text-muted-foreground" /></div>}
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="font-semibold">{l.title}</h3>
                        <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{l.description}</p>
                        {l.images?.length > 1 && (
                          <div className="mt-2 flex gap-1">{l.images.slice(1, 5).map((u: string) => <img key={u} src={u} alt="" className="h-10 w-10 rounded object-cover" />)}</div>
                        )}
                        {safeUrl(l.video_url) && l.images?.[0] && <a href={l.video_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary"><Play className="h-3 w-3" />Watch video</a>}
                        <div className="mt-auto flex items-center gap-2 pt-4">
                          <span className="text-lg font-semibold">{l.price_cents > 0 ? money(l.price_cents, l.currency) : 'Contact'}</span>
                          <div className="ml-auto flex gap-1">
                            {isOwner ? (
                              <>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setListingEdit({ ...l, price: (l.price_cents / 100).toString() })}><Pencil className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeListing(l.id)}><Trash2 className="h-4 w-4" /></Button>
                              </>
                            ) : l.price_cents >= 50 ? (
                              <Button size="sm" onClick={() => buy(l)}>{l.kind === 'service' ? 'Book' : 'Buy'}</Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => window.dispatchEvent(new CustomEvent('openFloatingChat', { detail: { userId } }))}>Ask</Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {listings.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No products or services yet.</p>}
          </TabsContent>

          <TabsContent value="media" className="mt-4">
            {isOwner && (
              <label className="mb-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                <Upload className="h-4 w-4" /> Upload photos or videos
                <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => addMedia(e.target.files)} />
              </label>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {media.map(m => (
                <div key={m.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                  {m.media_type === 'video' ? <video src={m.url} controls className="h-full w-full object-cover" /> : <img src={m.url} alt={m.caption || ''} className="h-full w-full object-cover" loading="lazy" />}
                  {isOwner && <Button size="icon" variant="secondary" className="absolute right-1 top-1 h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => removeMedia(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                </div>
              ))}
            </div>
            {media.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No media yet.</p>}
          </TabsContent>

          <TabsContent value="posts" className="mt-4 space-y-3">
            {posts.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No posts yet.</p>}
            {posts.map(p => (
              <div key={p.id} className="tech-card border-0 p-4">
                <p className="text-[11px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{p.content}</p>
                {Array.isArray(p.media_urls) && p.media_urls.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {p.media_urls.slice(0, 4).map((u: string) => isVideo(u) ? <video key={u} src={u} controls className="w-full rounded-md" /> : <img key={u} src={u} alt="" className="w-full rounded-md object-cover" loading="lazy" />)}
                  </div>
                )}
                <p className="mt-2 text-[11px] text-muted-foreground">{p.likes_count || 0} likes · {p.comments_count || 0} comments</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="events" className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {events.map(e => (
              <button key={e.id} onClick={() => navigate(`/events/${e.id}/register`)} className="tech-card border-0 flex gap-3 p-3 text-left">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">{e.banner_url && <img src={e.banner_url} alt="" className="h-full w-full object-cover" />}</div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground"><Clock className="mr-1 inline h-3 w-3" />{new Date(e.start_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.is_virtual ? 'Virtual' : e.location}</p>
                </div>
              </button>
            ))}
          </TabsContent>

          <TabsContent value="jobs" className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {jobs.map(j => (
              <div key={j.id} className="tech-card border-0 p-4">
                <p className="font-medium">{j.title}</p>
                <p className="text-xs text-muted-foreground">{[j.job_type, j.location].filter(Boolean).join(' · ')}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {sectionEdit && <SectionDialog value={sectionEdit} count={sections.length} onClose={() => setSectionEdit(null)} onSaved={loadOwned} />}
      {listingEdit && <ListingDialog value={listingEdit} onClose={() => setListingEdit(null)} onSaved={loadOwned} />}
    </div>
  );
}

function SectionDialog({ value, count, onClose, onSaved }: { value: any; count: number; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [v, setV] = useState(value);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!user || !v.title?.trim()) return toast.error('Add a tab name');
    setBusy(true);
    const row = { kind: v.kind, title: v.title.trim(), body: v.body || null, file_url: v.file_url || null, visible: v.visible };
    const res = v.id ? await db.from('profile_sections').update(row).eq('id', v.id)
      : await db.from('profile_sections').insert({ ...row, user_id: user.id, position: count });
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    onSaved(); onClose();
  };
  const pick = async (f?: File) => {
    if (!f || !user) return;
    try { setV({ ...v, file_url: await upload(user.id, f, 'profile-files') }); toast.success('File attached'); } catch (e: any) { toast.error(e.message); }
  };
  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg bg-background backdrop-blur-none">
        <DialogHeader><DialogTitle>{v.id ? 'Edit tab' : 'Add a tab'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Select value={v.kind} onValueChange={k => setV({ ...v, kind: k, title: v.id || (v.title && v.title !== SECTION_KINDS[v.kind]) ? v.title : SECTION_KINDS[k] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="bg-background backdrop-blur-none">{Object.entries(SECTION_KINDS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={v.title} onChange={e => setV({ ...v, title: e.target.value })} placeholder="Tab name" maxLength={40} />
          <Textarea value={v.body || ''} onChange={e => setV({ ...v, body: e.target.value })} placeholder="Write the content of this tab" rows={8} maxLength={20000} />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Upload className="h-4 w-4" />{v.file_url ? 'Replace attached file' : 'Attach a file (PDF deck, plan, video)'}
            <input type="file" className="hidden" accept=".pdf,image/*,video/*,.doc,.docx,.ppt,.pptx" onChange={e => pick(e.target.files?.[0])} />
          </label>
          <div className="flex items-center gap-2"><Switch id="sec-vis" checked={v.visible} onCheckedChange={c => setV({ ...v, visible: c })} /><Label htmlFor="sec-vis">Visible to everyone</Label></div>
          <Button className="w-full" onClick={save} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ListingDialog({ value, onClose, onSaved }: { value: any; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [v, setV] = useState(value);
  const [busy, setBusy] = useState(false);
  const addFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    try {
      const imgs = [...(v.images || [])];
      let video = v.video_url;
      for (const f of Array.from(files).slice(0, 8)) {
        const url = await upload(user.id, f, 'listings');
        if (f.type.startsWith('video')) video = url; else imgs.push(url);
      }
      setV({ ...v, images: imgs.slice(0, 8), video_url: video });
    } catch (e: any) { toast.error(e.message); }
  };
  const save = async () => {
    if (!user || !v.title?.trim()) return toast.error('Add a title');
    const price = Math.round(parseFloat(v.price || '0') * 100);
    if (price !== 0 && (price < 50 || price > 10000000)) return toast.error('Price must be 0 (contact) or between $0.50 and $100,000');
    setBusy(true);
    const row = { kind: v.kind, title: v.title.trim(), description: v.description || null, price_cents: price, images: v.images || [], video_url: v.video_url || null, active: v.active };
    const res = v.id ? await db.from('profile_listings').update(row).eq('id', v.id) : await db.from('profile_listings').insert({ ...row, user_id: user.id });
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    toast.success('Saved'); onSaved(); onClose();
  };
  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg bg-background backdrop-blur-none">
        <DialogHeader><DialogTitle>{v.id ? 'Edit item' : 'Add a product or service'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['product', 'service'] as const).map(k => (
              <Button key={k} type="button" size="sm" variant={v.kind === k ? 'default' : 'outline'} onClick={() => setV({ ...v, kind: k })}>{k === 'product' ? 'Product' : 'Service'}</Button>
            ))}
          </div>
          <Input value={v.title} onChange={e => setV({ ...v, title: e.target.value })} placeholder="Title" maxLength={120} />
          <Textarea value={v.description || ''} onChange={e => setV({ ...v, description: e.target.value })} placeholder="Description" rows={4} maxLength={4000} />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <Input type="number" min="0" step="0.01" value={v.price} onChange={e => setV({ ...v, price: e.target.value })} placeholder="Price in USD (0 = contact me)" className="pl-7" />
          </div>
          <p className="text-[11px] text-muted-foreground">Paid securely by card. A 10% platform fee is deducted from your payout.</p>
          <div className="flex flex-wrap gap-2">
            {(v.images || []).map((u: string) => (
              <div key={u} className="relative h-16 w-16 overflow-hidden rounded-md">
                <img src={u} alt="" className="h-full w-full object-cover" />
                <button className="absolute right-0 top-0 bg-background/80 p-0.5" onClick={() => setV({ ...v, images: v.images.filter((x: string) => x !== u) })} aria-label="Remove"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
            <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground">
              <Upload className="h-4 w-4" />
              <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
            </label>
          </div>
          {v.video_url && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Play className="h-3 w-3" />Video attached <button className="text-primary" onClick={() => setV({ ...v, video_url: '' })}>remove</button></p>}
          <div className="flex items-center gap-2"><Switch id="lst-act" checked={v.active} onCheckedChange={c => setV({ ...v, active: c })} /><Label htmlFor="lst-act">Available for sale</Label></div>
          <Button className="w-full" onClick={save} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
