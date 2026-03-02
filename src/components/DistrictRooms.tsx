import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import VideoMeetingDialog from '@/components/VideoMeetingDialog';
import DistrictElectionPanel from '@/components/DistrictElectionPanel';
import DistrictDetailPanel from '@/components/DistrictDetailPanel';
import CreateDistrictDialog from '@/components/CreateDistrictDialog';
import DistrictGuideDialog from '@/components/DistrictGuideDialog';
import DistrictMarketplace from '@/components/DistrictMarketplace';
import { useDistrictPaymentVerification } from '@/hooks/useDistrictPaymentVerification';
import { Crown, Users, Vote, Trophy, Loader2, ShoppingBag, Plus, BookOpen, Store, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface DistrictRoom {
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

const DISTRICT_NAMES = ['The Plaza', 'The Commons', 'The Agora'];
const DISTRICT_EMOJIS: Record<string, string> = {
  'The Plaza': '🏛️',
  'The Commons': '🌿',
  'The Agora': '⚡',
};

export default function DistrictRooms() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { role } = useUserRole();
  const { toast } = useToast();
  const isAdmin = role === 'admin';
  const [rooms, setRooms] = useState<DistrictRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMeeting, setActiveMeeting] = useState<{ link: string; name: string; roomId: string } | null>(null);
  const [electionRoom, setElectionRoom] = useState<{ id: string; name: string } | null>(null);
  const [detailRoom, setDetailRoom] = useState<DistrictRoom | null>(null);
  const [createDistrictOpen, setCreateDistrictOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);

  const fetchDistrictRooms = useCallback(async () => {
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

      const enriched: DistrictRoom[] = roomsData.map(r => ({
        ...r,
        host: r.current_host_id ? profileMap.get(r.current_host_id) : undefined,
        participant_count: countMap.get(r.id) || 0,
        active_election: electionSet.has(r.id),
      }));

      setRooms(enriched);
    } catch (e) {
      console.error('Error fetching district rooms:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDistrictRooms(); }, [fetchDistrictRooms]);

  useEffect(() => {
    const ch = supabase
      .channel('district-rooms-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_rooms' }, fetchDistrictRooms)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_room_participants' }, fetchDistrictRooms)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'village_elections' }, fetchDistrictRooms)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchDistrictRooms]);

  useDistrictPaymentVerification(fetchDistrictRooms);

  const handleJoin = async (room: DistrictRoom) => {
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

  const handleAdminDeleteDistrict = async (roomId: string, roomName: string) => {
    try {
      const { error } = await supabase
        .from('live_rooms')
        .update({ is_active: false })
        .eq('id', roomId);
      if (error) throw error;
      setRooms(prev => prev.filter(r => r.id !== roomId));
      toast({ title: 'District removed', description: `"${roomName}" has been removed from the feed.` });
    } catch (e) {
      console.error('Error deleting district:', e);
      toast({ title: 'Error', description: 'Failed to delete district', variant: 'destructive' });
    }
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
            <h2 className="text-lg font-semibold text-foreground">Community Districts</h2>
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
          {/* Marketplace button hidden for now
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setMarketplaceOpen(true)}
          >
            <Store className="h-3.5 w-3.5" />
            Marketplace
          </Button>
          */}
          {user && (
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 border-0 text-white"
              onClick={() => setCreateDistrictOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Found a District
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory -mx-1 px-1">
        {rooms.map(room => (
          <Card
            key={room.id}
            className="tech-card border-0 relative overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 min-w-[280px] max-w-[320px] flex-shrink-0 snap-start"
            onClick={() => setDetailRoom(room)}
          >
            {/* Gradient top accent */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500" />

            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{DISTRICT_EMOJIS[room.name] || '🏘️'}</span>
                    <CardTitle className="text-sm font-semibold truncate">{room.name}</CardTitle>
                  </div>
                  {room.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{room.description}</p>
                  )}
                </div>
                <div className="flex items-start gap-1 shrink-0">
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={e => e.stopPropagation()}
                          title="Delete district"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={e => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete District</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove "{room.name}" from the feed? This will deactivate the district.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleAdminDeleteDistrict(room.id, room.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <div className="flex flex-col items-end gap-1">
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
              </div>
            </CardHeader>

            <CardContent className="pt-0 px-4 pb-3 space-y-3">
              {/* Host info */}
              {room.village_type === 'merchant_village' ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShoppingBag className="h-3 w-3 text-amber-500" />
                  <span>Merchant District — owner operated</span>
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
        <DistrictElectionPanel
          open={!!electionRoom}
          onOpenChange={(open) => { if (!open) setElectionRoom(null); }}
          roomId={electionRoom.id}
          roomName={electionRoom.name}
        />
      )}

      {/* District Detail Panel */}
      {detailRoom && (
        <DistrictDetailPanel
          open={!!detailRoom}
          onOpenChange={(open) => { if (!open) setDetailRoom(null); }}
          room={detailRoom}
          onJoin={() => handleJoin(detailRoom)}
        />
      )}

      {/* Create District Dialog */}
      <CreateDistrictDialog
        open={createDistrictOpen}
        onOpenChange={setCreateDistrictOpen}
      />

      {/* District Guide */}
      <DistrictGuideDialog
        open={guideOpen}
        onOpenChange={setGuideOpen}
      />

      {/* District Marketplace */}
      <DistrictMarketplace
        open={marketplaceOpen}
        onOpenChange={setMarketplaceOpen}
      />
    </>
  );
}
