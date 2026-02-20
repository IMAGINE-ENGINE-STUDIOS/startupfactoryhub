import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VideoMeetingDialog from '@/components/VideoMeetingDialog';
import DistrictElectionPanel from '@/components/DistrictElectionPanel';
import DistrictGuideDialog from '@/components/DistrictGuideDialog';
import {
  Crown, Users, Vote, Trophy, Shield, ShieldCheck, Star, Play,
  ArrowLeft, BookOpen, Radio, Loader2, UserPlus, MapPin
} from 'lucide-react';

const DISTRICT_EMOJIS: Record<string, string> = {
  'The Plaza': '🏛️', 'The Commons': '🌿', 'The Agora': '⚡',
};

const DISTRICT_IMAGES: Record<string, string> = {
  'The Plaza': 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=80',
  'The Commons': 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80',
  'The Agora': 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=1200&q=80',
};

const STAFF_ROLES = ['moderator', 'curator', 'ambassador', 'archivist'] as const;
type StaffRole = typeof STAFF_ROLES[number];
const ROLE_ICONS: Record<StaffRole, typeof Shield> = { moderator: Shield, curator: Star, ambassador: ShieldCheck, archivist: Crown };
const ROLE_COLORS: Record<StaffRole, string> = { moderator: 'text-blue-500 bg-blue-500/10', curator: 'text-amber-500 bg-amber-500/10', ambassador: 'text-emerald-500 bg-emerald-500/10', archivist: 'text-violet-500 bg-violet-500/10' };

interface StaffMember { id: string; user_id: string; role: StaffRole; profile?: { full_name: string; avatar_url: string | null } }
interface Participant { user_id: string; full_name: string; avatar_url: string | null }

export default function DistrictDashboard() {
  const { districtId } = useParams<{ districtId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<{ link: string; name: string } | null>(null);
  const [electionOpen, setElectionOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const fetchRoom = useCallback(async () => {
    if (!districtId) return;
    const { data } = await supabase.from('live_rooms').select('*').eq('id', districtId).single();
    if (!data) { navigate('/dashboard'); return; }

    let host = undefined;
    if (data.current_host_id) {
      const { data: p } = await supabase.from('profiles').select('user_id, full_name, avatar_url').eq('user_id', data.current_host_id).single();
      host = p;
    }
    setRoom({ ...data, host });
    setLoading(false);
  }, [districtId, navigate]);

  const fetchParticipants = useCallback(async () => {
    if (!districtId) return;
    const { data: parts } = await supabase.from('live_room_participants').select('user_id').eq('room_id', districtId);
    if (!parts?.length) { setParticipants([]); return; }
    const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', parts.map(p => p.user_id));
    setParticipants((profiles as Participant[]) || []);
  }, [districtId]);

  const fetchStaff = useCallback(async () => {
    if (!districtId) return;
    const { data } = await supabase.from('village_staff').select('*').eq('room_id', districtId);
    if (!data?.length) { setStaff([]); return; }
    const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', data.map(s => s.user_id));
    const pMap = new Map((profiles || []).map(p => [p.user_id, p]));
    setStaff(data.map(s => ({ ...s, role: s.role as StaffRole, profile: pMap.get(s.user_id) as StaffMember['profile'] })));
  }, [districtId]);

  useEffect(() => { fetchRoom(); fetchParticipants(); fetchStaff(); }, [fetchRoom, fetchParticipants, fetchStaff]);

  useEffect(() => {
    if (!districtId) return;
    const ch = supabase.channel(`district-dash-${districtId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_rooms', filter: `id=eq.${districtId}` }, fetchRoom)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_room_participants', filter: `room_id=eq.${districtId}` }, fetchParticipants)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'village_staff', filter: `room_id=eq.${districtId}` }, fetchStaff)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [districtId, fetchRoom, fetchParticipants, fetchStaff]);

  const handleJoin = async () => {
    if (!user || !room) return;
    await supabase.from('live_room_participants').upsert({ room_id: room.id, user_id: user.id }, { onConflict: 'room_id,user_id' });
    setActiveMeeting({ link: room.meeting_link, name: room.name });
  };

  const handleLeave = async () => {
    if (!user || !districtId) return;
    await supabase.from('live_room_participants').delete().eq('room_id', districtId).eq('user_id', user.id);
    setActiveMeeting(null);
  };

  if (loading || !room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const emoji = DISTRICT_EMOJIS[room.name] || '🏘️';
  const heroImg = DISTRICT_IMAGES[room.name] || 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=80';
  const isMerchant = room.village_type === 'merchant_village';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-56 md:h-72 bg-black overflow-hidden">
        <img src={heroImg} alt={room.name} className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />
        <div className="absolute top-4 left-4">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1.5" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl">{emoji}</span>
                <h1 className="text-2xl md:text-3xl font-bold text-white">{room.name}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-500/80 text-white border-0 text-xs">District</Badge>
                {isMerchant ? (
                  <Badge className="bg-amber-500/80 text-white border-0 text-xs">Merchant</Badge>
                ) : (
                  <Badge className="bg-violet-500/80 text-white border-0 text-xs">Democratic Republic</Badge>
                )}
                <Badge className="bg-emerald-500/80 text-white border-0 text-xs flex items-center gap-1">
                  <Radio className="h-2 w-2 animate-pulse" /> Permanent
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/20 gap-1.5" onClick={() => setGuideOpen(true)}>
                <BookOpen className="h-4 w-4" /> Guide
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 border-0 gap-1.5" onClick={handleJoin}>
                <Play className="h-4 w-4" /> Join District
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="community" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="community" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Community</TabsTrigger>
            <TabsTrigger value="governance" className="gap-1.5"><Vote className="h-3.5 w-3.5" /> Governance</TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5"><Radio className="h-3.5 w-3.5" /> Activity</TabsTrigger>
          </TabsList>

          {/* Community Tab */}
          <TabsContent value="community" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Description */}
              <Card className="md:col-span-2 tech-card border-0">
                <CardHeader><CardTitle className="text-base">About this District</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{room.description || 'A permanent community district.'}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <strong className="text-foreground">{participants.length}</strong> members online
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <strong className="text-foreground">{staff.length}</strong> staff
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="tech-card border-0">
                <CardHeader><CardTitle className="text-base">District Stats</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Type</span><span className="font-medium">{isMerchant ? 'Merchant' : 'Democratic Republic'}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-xs">Active</Badge></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Members</span><span className="font-medium">{participants.length}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Staff</span><span className="font-medium">{staff.length}</span></div>
                </CardContent>
              </Card>
            </div>

            {/* Members List */}
            <Card className="tech-card border-0">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Members Online</CardTitle></CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No one is in the district right now.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {participants.map(p => (
                      <div key={p.user_id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={p.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{p.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.full_name}</p>
                          {room.current_host_id === p.user_id && <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[10px]">Host</Badge>}
                          {staff.find(s => s.user_id === p.user_id) && (
                            <Badge className="bg-indigo-500/10 text-indigo-600 border-0 text-[10px] capitalize ml-1">{staff.find(s => s.user_id === p.user_id)?.role}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Governance Tab */}
          <TabsContent value="governance" className="space-y-6">
            {/* Host */}
            <Card className="tech-card border-0">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" /> District Host</CardTitle></CardHeader>
              <CardContent>
                {isMerchant ? (
                  <p className="text-sm text-muted-foreground">Merchant Districts are owner-operated — no election system.</p>
                ) : room.host ? (
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12"><AvatarImage src={room.host.avatar_url || undefined} /><AvatarFallback>{room.host.full_name?.charAt(0)}</AvatarFallback></Avatar>
                    <div>
                      <p className="font-semibold">{room.host.full_name}</p>
                      <p className="text-xs text-muted-foreground">Elected Host</p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto gap-1.5" onClick={() => setElectionOpen(true)}>
                      <Vote className="h-4 w-4" /> New Election
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <Vote className="h-10 w-10 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">No host elected yet.</p>
                    <Button onClick={() => setElectionOpen(true)} className="gap-1.5"><Vote className="h-4 w-4" /> Call Election</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Staff */}
            <Card className="tech-card border-0">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Staff Committee</CardTitle></CardHeader>
              <CardContent>
                {staff.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No staff appointed yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {staff.map(s => {
                      const RoleIcon = ROLE_ICONS[s.role] || Shield;
                      return (
                        <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                          <Avatar className="h-9 w-9"><AvatarImage src={s.profile?.avatar_url || undefined} /><AvatarFallback className="text-xs">{s.profile?.full_name?.charAt(0)}</AvatarFallback></Avatar>
                          <div>
                            <p className="text-sm font-medium">{s.profile?.full_name || 'Unknown'}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${ROLE_COLORS[s.role]}`}>
                              <RoleIcon className="h-2.5 w-2.5" /> {s.role}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="tech-card border-0">
              <CardHeader><CardTitle className="text-base">District Activity</CardTitle></CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Radio className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">Activity feed coming soon.</p>
                  <p className="text-xs text-muted-foreground mt-1">District events, elections, and announcements will appear here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {activeMeeting && (
        <VideoMeetingDialog open={!!activeMeeting} onOpenChange={(o) => { if (!o) handleLeave(); }} meetingLink={activeMeeting.link} userId={user?.id} meetingTitle={activeMeeting.name} />
      )}
      {electionOpen && districtId && (
        <DistrictElectionPanel open={electionOpen} onOpenChange={setElectionOpen} roomId={districtId} roomName={room.name} />
      )}
      <DistrictGuideDialog open={guideOpen} onOpenChange={setGuideOpen} />
    </div>
  );
}
