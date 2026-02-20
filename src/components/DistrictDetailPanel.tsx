import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DistrictElectionPanel from '@/components/DistrictElectionPanel';
import {
  Crown, Users, Vote, Trophy, Shield, ShieldCheck, UserPlus, X,
  ChevronLeft, ChevronRight, Play, Radio, Loader2, Star
} from 'lucide-react';


/* ─── Village media assets ──────────────────────────────────────────────────── */
const VILLAGE_MEDIA: Record<string, { images: string[]; video?: string }> = {
  'The Plaza': {
    // Grand civic squares, colonnade architecture, open public plazas
    images: [
      'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=80', // grand plaza with columns
      'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200&q=80', // classical architecture square
      'https://images.unsplash.com/photo-1520637836862-4d197d17c55a?w=1200&q=80', // open civic plaza
    ],
  },
  'The Commons': {
    // Lush communal green spaces, parks, shared gardens
    images: [
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80', // aerial green meadow
      'https://images.unsplash.com/photo-1585320806297-9794b3e4aaae?w=1200&q=80', // community garden
      'https://images.unsplash.com/photo-1444492417251-9c84a5fa18e0?w=1200&q=80', // lush park commons
    ],
  },
  'The Agora': {
    // Bustling ancient agora / modern marketplace, debate forums
    images: [
      'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=1200&q=80', // ancient greek ruins agora
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80', // vibrant open-air market crowd
      'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1200&q=80', // electric city night forum
    ],
  },
};

const VILLAGE_EMOJIS: Record<string, string> = {
  'The Plaza': '🏛️',
  'The Commons': '🌿',
  'The Agora': '⚡',
};

const STAFF_ROLES = ['moderator', 'curator', 'ambassador', 'archivist'] as const;
type StaffRole = typeof STAFF_ROLES[number];

const ROLE_ICONS: Record<StaffRole, typeof Shield> = {
  moderator: Shield,
  curator: Star,
  ambassador: ShieldCheck,
  archivist: Crown,
};

const ROLE_COLORS: Record<StaffRole, string> = {
  moderator: 'text-blue-500 bg-blue-500/10',
  curator: 'text-amber-500 bg-amber-500/10',
  ambassador: 'text-emerald-500 bg-emerald-500/10',
  archivist: 'text-violet-500 bg-violet-500/10',
};

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface StaffMember {
  id: string;
  room_id: string;
  user_id: string;
  appointed_by: string;
  role: StaffRole;
  created_at: string;
  profile?: { full_name: string; avatar_url: string | null };
}

interface VillageDetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: {
    id: string;
    name: string;
    description: string | null;
    meeting_link: string;
    current_host_id: string | null;
    participant_count: number;
    active_election?: boolean;
    host?: { full_name: string; avatar_url: string | null };
  };
  onJoin: () => void;
}

/* ─── Component ─────────────────────────────────────────────────────────────── */
export default function VillageDetailPanel({ open, onOpenChange, room, onJoin }: VillageDetailPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  /* Gallery state */
  const media = VILLAGE_MEDIA[room.name] || { images: [] };
  const [slide, setSlide] = useState(0);
  const totalSlides = media.images.length;

  /* Staff state */
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [participants, setParticipants] = useState<Array<{ user_id: string; full_name: string; avatar_url: string | null }>>([]);
  const [addingStaff, setAddingStaff] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<StaffRole>('moderator');

  /* Election dialog */
  const [electionOpen, setElectionOpen] = useState(false);

  /* Derived */
  const isHost = user?.id === room.current_host_id;
  const currentStaff = staff.find(s => s.user_id === user?.id);
  const isStaff = !!currentStaff;
  const hostAbsent = !participants.find(p => p.user_id === room.current_host_id);
  const hasAuthority = isHost || (isStaff && hostAbsent);

  /* ── Fetch staff ── */
  const fetchStaff = useCallback(async () => {
    setStaffLoading(true);
    try {
      const { data } = await supabase
        .from('village_staff')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at');

      if (!data) { setStaff([]); return; }

      const ids = data.map(s => s.user_id);
      const { data: profiles } = ids.length
        ? await supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', ids)
        : { data: [] as Array<{ user_id: string; full_name: string; avatar_url: string | null }> };

      const pMap = new Map((profiles || []).map(p => [p.user_id, p] as [string, typeof p]));
      setStaff(data.map(s => ({
        ...s,
        role: s.role as StaffRole,
        profile: pMap.get(s.user_id) as StaffMember['profile'],
      })));
    } finally {
      setStaffLoading(false);
    }
  }, [room.id]);


  /* ── Fetch participants (for staff appointment picker + host-absent logic) ── */
  const fetchParticipants = useCallback(async () => {
    const { data: partData } = await supabase
      .from('live_room_participants')
      .select('user_id')
      .eq('room_id', room.id);

    if (!partData?.length) { setParticipants([]); return; }
    const ids = partData.map(p => p.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', ids);
    setParticipants((profiles as any[]) || []);
  }, [room.id]);

  useEffect(() => {
    if (open) { fetchStaff(); fetchParticipants(); }
  }, [open, fetchStaff, fetchParticipants]);

  /* ── Real-time ── */
  useEffect(() => {
    if (!open) return;
    const ch = supabase
      .channel(`village-detail-${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'village_staff', filter: `room_id=eq.${room.id}` }, fetchStaff)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_room_participants', filter: `room_id=eq.${room.id}` }, fetchParticipants)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [open, room.id, fetchStaff, fetchParticipants]);

  /* ── Appoint staff ── */
  const appointStaff = async () => {
    if (!selectedUserId || !user) return;
    setAddingStaff(true);
    try {
      const { error } = await supabase.from('village_staff').upsert({
        room_id: room.id,
        user_id: selectedUserId,
        appointed_by: user.id,
        role: selectedRole,
      }, { onConflict: 'room_id,user_id' });
      if (error) throw error;
      toast({ title: '✅ Staff Appointed', description: `New ${selectedRole} added to the committee.` });
      setSelectedUserId('');
      await fetchStaff();
    } catch {
      toast({ title: 'Error', description: 'Could not appoint staff', variant: 'destructive' });
    } finally {
      setAddingStaff(false);
    }
  };

  /* ── Remove staff ── */
  const removeStaff = async (staffId: string) => {
    const { error } = await supabase.from('village_staff').delete().eq('id', staffId);
    if (!error) { toast({ title: 'Staff removed' }); await fetchStaff(); }
  };

  /* ── Gallery helpers ── */
  const prev = () => setSlide(s => (s - 1 + totalSlides) % totalSlides);
  const next = () => setSlide(s => (s + 1) % totalSlides);

  /* ── Participants not yet on staff (for picker) ── */
  const staffIds = new Set(staff.map(s => s.user_id));
  const eligible = participants.filter(p => p.user_id !== room.current_host_id && !staffIds.has(p.user_id));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden rounded-2xl gap-0">
          <div className="flex flex-col h-[90vh] max-h-[820px]">

            {/* ── Gallery ───────────────────────────────────────────────── */}
            <div className="relative flex-shrink-0 h-64 bg-black">
              {media.images.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={`${room.name} gallery ${i + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === slide ? 'opacity-100' : 'opacity-0'}`}
                />
              ))}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

              {/* Top-left: title */}
              <div className="absolute top-4 left-5 flex items-center gap-2">
                <span className="text-2xl">{VILLAGE_EMOJIS[room.name] || '🏘️'}</span>
                <div>
                  <h2 className="text-white text-xl font-bold leading-tight">{room.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className="bg-indigo-500/80 text-white border-0 text-[10px] px-2 py-0 h-4">
                      Village
                    </Badge>
                    <Badge className="bg-emerald-500/80 text-white border-0 text-[10px] px-2 py-0 h-4 flex items-center gap-1">
                      <Radio className="h-2 w-2 animate-pulse" />
                      Permanent
                    </Badge>
                  </div>
                </div>
              </div>



              {/* Gallery nav */}
              {totalSlides > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1">
                    {media.images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSlide(i)}
                        className={`h-1.5 rounded-full transition-all ${i === slide ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Thumbnail strip */}
              <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
                {media.images.map((src, i) => (
                  <button key={i} onClick={() => setSlide(i)}
                    className={`h-10 w-14 rounded overflow-hidden border-2 transition-all ${i === slide ? 'border-white' : 'border-white/30'}`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* ── Body ──────────────────────────────────────────────────── */}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">

                {/* Description + quick stats */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {room.description || 'A permanent community village room.'}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span><strong className="text-foreground">{room.participant_count}</strong> in room</span>
                      </div>
                      {room.active_election && (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center gap-1 animate-pulse text-xs">
                          <Vote className="h-3 w-3" />
                          Election in progress
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-indigo-600 border-indigo-500/30 hover:bg-indigo-500/10"
                      onClick={() => setElectionOpen(true)}
                    >
                      <Vote className="h-4 w-4" />
                      {room.active_election ? 'Vote Now' : 'Call Election'}
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 border-0"
                      onClick={() => { onJoin(); onOpenChange(false); }}
                    >
                      <Play className="h-4 w-4" />
                      Join Village
                    </Button>
                  </div>
                </div>

                {/* ── Village Committee Board ───────────────────────────── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Village Committee</h3>
                      <p className="text-xs text-muted-foreground">Democratically elected leadership</p>
                    </div>
                  </div>

                  {/* HOST card */}
                  <div className={`rounded-xl border p-4 ${room.host ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-muted/30'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={room.host?.avatar_url || undefined} />
                            <AvatarFallback className="text-sm">
                              {room.host?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          {room.host && (
                            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
                              <Crown className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {room.host?.full_name || 'No Host Elected'}
                            </span>
                            <Badge className="bg-amber-500/15 text-amber-600 border-0 text-[10px] px-1.5 py-0 h-4">
                              HOST
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {room.host
                              ? hostAbsent
                                ? '⚠️ Currently absent — staff has authority'
                                : '✅ Present and active'
                              : 'Call an election to elect a Village Host'}
                          </p>
                        </div>
                      </div>
                      {isHost && (
                        <Badge className="bg-indigo-500/10 text-indigo-600 border-0 text-xs">
                          That's you
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* STAFF list */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Staff Members
                      </p>
                      {staffLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                    </div>

                    {staff.length === 0 && !staffLoading ? (
                      <div className="rounded-lg border border-dashed border-border p-4 text-center">
                        <Shield className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">
                          {room.host ? 'The host has not appointed any staff yet.' : 'No staff appointed. Elect a host first.'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {staff.map(member => {
                          const RoleIcon = ROLE_ICONS[member.role] || Shield;
                          return (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={member.profile?.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {member.profile?.full_name?.charAt(0) || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">
                                    {member.profile?.full_name || 'Unknown'}
                                    {member.user_id === user?.id && (
                                      <span className="text-muted-foreground text-xs ml-1">(you)</span>
                                    )}
                                  </p>
                                  <div className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[member.role]}`}>
                                    <RoleIcon className="h-2.5 w-2.5" />
                                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                    {hostAbsent && <span className="ml-1 opacity-70">· Acting authority</span>}
                                  </div>
                                </div>
                              </div>
                              {isHost && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeStaff(member.id)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── Appoint staff (host only) ── */}
                  {isHost && eligible.length > 0 && (
                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-indigo-500" />
                        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                          Appoint a Staff Member
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger className="flex-1 h-8 text-xs">
                            <SelectValue placeholder="Select participant…" />
                          </SelectTrigger>
                          <SelectContent>
                            {eligible.map(p => (
                              <SelectItem key={p.user_id} value={p.user_id} className="text-xs">
                                {p.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={selectedRole} onValueChange={v => setSelectedRole(v as StaffRole)}>
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STAFF_ROLES.map(r => (
                              <SelectItem key={r} value={r} className="text-xs capitalize">{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="h-8 text-xs px-3 shrink-0"
                          onClick={appointStaff}
                          disabled={!selectedUserId || addingStaff}
                        >
                          {addingStaff ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Appoint'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Authority notice for staff when host absent */}
                  {isStaff && hostAbsent && !isHost && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2">
                      <ShieldCheck className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        The host is currently absent. As a <strong>{currentStaff?.role}</strong>, you have moderation authority in this village.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Election sub-dialog */}
      <DistrictElectionPanel
        open={electionOpen}
        onOpenChange={setElectionOpen}
        roomId={room.id}
        roomName={room.name}
      />
    </>
  );
}
