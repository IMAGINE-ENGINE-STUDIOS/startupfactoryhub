import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import VideoMeetingDialog from '@/components/VideoMeetingDialog';
import VillageElectionPanel from '@/components/VillageElectionPanel';
import VillageDetailPanel from '@/components/VillageDetailPanel';
import CreateVillageDialog from '@/components/CreateVillageDialog';
import VillageGuideDialog from '@/components/VillageGuideDialog';
import VillageMarketplace from '@/components/VillageMarketplace';
import { useVillagePaymentVerification } from '@/hooks/useVillagePaymentVerification';
import { Crown, Users, Vote, Trophy, Loader2, ShoppingBag, Plus, BookOpen, Store } from 'lucide-react';

interface VillageRoom {
  id: string;
  name: string;
  description: string | null;
  meeting_link: string;
  current_host_id: string | null;
  host_elected_at: string | null;
  participant_count: number;
  village_type?: 'democratic_republic' | 'merchant_village' | null;
  is_private?: boolean;
  for_sale?: boolean;
  host?: {
    full_name: string;
    avatar_url: string | null;
  };
  active_election?: boolean;
}

const VILLAGE_NAMES = ['The Plaza', 'The Commons', 'The Agora'];
const VILLAGE_EMOJIS: Record<string, string> = {
  'The Plaza': '🏛️',
  'The Commons': '🌿',
  'The Agora': '⚡',
};

export default function VillageRooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<VillageRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMeeting, setActiveMeeting] = useState<{ link: string; name: string; roomId: string } | null>(null);
  const [electionRoom, setElectionRoom] = useState<{ id: string; name: string } | null>(null);
  const [detailRoom, setDetailRoom] = useState<VillageRoom | null>(null);
  const [createVillageOpen, setCreateVillageOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);

  const fetchVillageRooms = useCallback(async () => {
    try {
      const { data: roomsData, error } = await supabase
        .from('live_rooms')
        .select('*')
        .eq('room_category', 'village')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!roomsData || roomsData.length === 0) { setRooms([]); setLoading(false); return; }

      // Fetch host profiles
      const hostIds = roomsData.filter(r => r.current_host_id).map(r => r.current_host_id!);
      const profileMap = new Map<string, { full_name: string; avatar_url: string | null }>();
      if (hostIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', hostIds);
        profiles?.forEach(p => profileMap.set(p.user_id, p));
      }

      // Fetch participant counts
      const { data: partData } = await supabase
        .from('live_room_participants')
        .select('room_id');
      const countMap = new Map<string, number>();
      partData?.forEach(p => countMap.set(p.room_id, (countMap.get(p.room_id) || 0) + 1));

      // Fetch active elections
      const roomIds = roomsData.map(r => r.id);
      const { data: elections } = await supabase
        .from('village_elections')
        .select('room_id, status')
        .in('room_id', roomIds)
        .eq('status', 'active');
      const electionSet = new Set(elections?.map(e => e.room_id) || []);

      const enriched: VillageRoom[] = roomsData.map(r => ({
        ...r,
        host: r.current_host_id ? profileMap.get(r.current_host_id) : undefined,
        participant_count: countMap.get(r.id) || 0,
        active_election: electionSet.has(r.id),
      }));

      setRooms(enriched);
    } catch (e) {
      console.error('Error fetching village rooms:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVillageRooms(); }, [fetchVillageRooms]);

  useEffect(() => {
    const ch = supabase
      .channel('village-rooms-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_rooms' }, fetchVillageRooms)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_room_participants' }, fetchVillageRooms)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'village_elections' }, fetchVillageRooms)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchVillageRooms]);

  useVillagePaymentVerification(fetchVillageRooms);

  const handleJoin = async (room: VillageRoom) => {
    if (!user) return;
    await supabase.from('live_room_participants').upsert(
      { room_id: room.id, user_id: user.id },
      { onConflict: 'room_id,user_id' }
    );
    setActiveMeeting({ link: room.meeting_link, name: room.name, roomId: room.id });
  };

  const handleLeave = async () => {
    if (!activeMeeting || !user) return;
    await supabase.from('live_room_participants').delete()
      .eq('room_id', activeMeeting.roomId)
      .eq('user_id', user.id);
    setActiveMeeting(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Section header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Crown className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Community Villages</h2>
            <p className="text-xs text-muted-foreground">Permanent open rooms — join or found your own</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setGuideOpen(true)}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Guide
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setMarketplaceOpen(true)}
          >
            <Store className="h-3.5 w-3.5" />
            Marketplace
          </Button>
          {user && (
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 border-0 text-white"
              onClick={() => setCreateVillageOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Found a Village
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {rooms.map(room => (
          <Card
            key={room.id}
            className="tech-card border-0 relative overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5"
            onClick={() => setDetailRoom(room)}
          >
            {/* Gradient top accent */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500" />

            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{VILLAGE_EMOJIS[room.name] || '🏘️'}</span>
                    <CardTitle className="text-sm font-semibold truncate">{room.name}</CardTitle>
                  </div>
                  {room.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{room.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {room.village_type === 'merchant_village' ? (
                    <Badge className="text-[10px] px-1.5 py-0 h-5 bg-amber-500/10 text-amber-600 border-0 flex items-center gap-0.5">
                      <ShoppingBag className="h-2.5 w-2.5" />
                      Merchant
                    </Badge>
                  ) : (
                    <Badge className="text-[10px] px-1.5 py-0 h-5 bg-indigo-500/10 text-indigo-600 border-0 flex items-center gap-0.5">
                      <Crown className="h-2.5 w-2.5" />
                      Democratic
                    </Badge>
                  )}
                  {room.for_sale && (
                    <Badge className="text-[10px] px-1.5 py-0 h-5 bg-emerald-500/10 text-emerald-600 border-0 flex items-center gap-0.5">
                      <Store className="h-2.5 w-2.5" />
                      For Sale
                    </Badge>
                  )}
                  {room.active_election && (
                    <Badge className="text-[10px] px-1.5 py-0 h-5 bg-amber-500/10 text-amber-600 border-0 flex items-center gap-0.5 animate-pulse">
                      <Vote className="h-2.5 w-2.5" />
                      Election Live
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 px-4 pb-3 space-y-3">
              {/* Host info */}
              {room.village_type === 'merchant_village' ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShoppingBag className="h-3 w-3 text-amber-500" />
                  <span>Merchant Village — owner operated</span>
                </div>
              ) : room.host ? (
                <div className="flex items-center gap-1.5 text-xs">
                  <Trophy className="h-3 w-3 text-yellow-500" />
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={room.host.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px]">{room.host.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground truncate max-w-[100px]">
                    Host: <span className="text-foreground font-medium">{room.host.full_name}</span>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Vote className="h-3 w-3" />
                  <span>No host yet — click to explore</span>
                </div>
              )}

              {/* Footer row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                  <Users className="h-2.5 w-2.5" />
                  <span>{room.participant_count} in room</span>
                </div>
                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  {/* Guide button on each card */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setGuideOpen(true)}
                  >
                    <BookOpen className="h-3 w-3" />
                  </Button>
                  {room.village_type !== 'merchant_village' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2 gap-1 border-indigo-500/30 text-indigo-600 hover:bg-indigo-500/10"
                      onClick={() => setElectionRoom({ id: room.id, name: room.name })}
                    >
                      <Vote className="h-3 w-3" />
                      {room.active_election ? 'Vote' : 'Election'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="h-7 text-xs px-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 border-0"
                    onClick={() => handleJoin(room)}
                  >
                    Join
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Video Dialog */}
      {activeMeeting && (
        <VideoMeetingDialog
          open={!!activeMeeting}
          onOpenChange={(open) => { if (!open) handleLeave(); }}
          meetingLink={activeMeeting.link}
          userId={user?.id}
          meetingTitle={activeMeeting.name}
        />
      )}

      {/* Election Dialog */}
      {electionRoom && (
        <VillageElectionPanel
          open={!!electionRoom}
          onOpenChange={(open) => { if (!open) setElectionRoom(null); }}
          roomId={electionRoom.id}
          roomName={electionRoom.name}
        />
      )}

      {/* Village Detail Panel */}
      {detailRoom && (
        <VillageDetailPanel
          open={!!detailRoom}
          onOpenChange={(open) => { if (!open) setDetailRoom(null); }}
          room={detailRoom}
          onJoin={() => handleJoin(detailRoom)}
        />
      )}

      {/* Create Village Dialog */}
      <CreateVillageDialog
        open={createVillageOpen}
        onOpenChange={setCreateVillageOpen}
      />

      {/* Village Guide */}
      <VillageGuideDialog
        open={guideOpen}
        onOpenChange={setGuideOpen}
      />

      {/* Village Marketplace */}
      <VillageMarketplace
        open={marketplaceOpen}
        onOpenChange={setMarketplaceOpen}
      />
    </>
  );
}
