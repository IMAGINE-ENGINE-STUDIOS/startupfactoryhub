import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Crown, Users, Vote, Trophy, Shield, ShieldCheck, Star,
  Trash2, Edit3, UserMinus, RefreshCw, Gavel,
  Radio, Loader2, AlertTriangle, ShoppingBag, DollarSign, Zap
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface VillageRoom {
  id: string;
  name: string;
  description: string | null;
  meeting_link: string;
  current_host_id: string | null;
  host_elected_at: string | null;
  participant_count: number;
  village_type: 'democratic_republic' | 'merchant_village' | null;
  api_cost_multiplier: number;
  creator_id: string | null;
  host?: { full_name: string; avatar_url: string | null; user_id: string };
  purchase?: { payment_status: string; total_paid_cents: number | null; completed_at: string | null; creator_name?: string };
}

interface StaffMember {
  id: string;
  room_id: string;
  user_id: string;
  role: string;
  appointed_by: string;
  created_at: string;
  profile?: { full_name: string; avatar_url: string | null };
}

interface Election {
  id: string;
  room_id: string;
  status: string;
  created_at: string;
  concluded_at: string | null;
  winner_id: string | null;
  winner?: { full_name: string };
}

const ROLE_ICONS: Record<string, typeof Shield> = {
  moderator: Shield,
  curator: Star,
  ambassador: ShieldCheck,
  archivist: Crown,
};

const ROLE_COLORS: Record<string, string> = {
  moderator: 'text-blue-500 bg-blue-500/10',
  curator: 'text-amber-500 bg-amber-500/10',
  ambassador: 'text-emerald-500 bg-emerald-500/10',
  archivist: 'text-violet-500 bg-violet-500/10',
};

const VILLAGE_EMOJIS: Record<string, string> = {
  'The Plaza': '🏛️',
  'The Commons': '🌿',
  'The Agora': '⚡',
};

export default function VillagesManagement() {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<VillageRoom[]>([]);
  const [staffMap, setStaffMap] = useState<Record<string, StaffMember[]>>({});
  const [electionsMap, setElectionsMap] = useState<Record<string, Election[]>>({});
  const [loading, setLoading] = useState(true);
  const [editRoom, setEditRoom] = useState<VillageRoom | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', meeting_link: '' });
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState<string | null>(null); // roomId to reset host

  /* ── Fetch all village data ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: roomsData } = await supabase
        .from('live_rooms')
        .select('*')
        .eq('room_category', 'village')
        .order('created_at', { ascending: true });

      if (!roomsData) { setRooms([]); return; }

      // Host profiles
      const hostIds = roomsData.filter(r => r.current_host_id).map(r => r.current_host_id!);
      const profileMap = new Map<string, { full_name: string; avatar_url: string | null; user_id: string }>();
      if (hostIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', hostIds);
        profiles?.forEach(p => profileMap.set(p.user_id, p));
      }

      // Creator profiles
      const creatorIds = [...new Set(roomsData.filter(r => r.creator_id).map(r => r.creator_id!))];
      const creatorMap = new Map<string, string>();
      if (creatorIds.length) {
        const { data: creatorProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', creatorIds);
        creatorProfiles?.forEach(p => creatorMap.set(p.user_id, p.full_name));
      }

      // Participant counts
      const { data: partData } = await supabase
        .from('live_room_participants')
        .select('room_id');
      const countMap = new Map<string, number>();
      partData?.forEach(p => countMap.set(p.room_id, (countMap.get(p.room_id) || 0) + 1));

      // Purchase data
      const roomIds = roomsData.map(r => r.id);
      const { data: purchases } = await supabase
        .from('village_purchases')
        .select('room_id, payment_status, total_paid_cents, completed_at, user_id')
        .in('room_id', roomIds);
      const purchaseMap = new Map<string, any>();
      purchases?.forEach(p => purchaseMap.set(p.room_id, {
        ...p,
        creator_name: creatorMap.get(p.user_id) || 'Unknown',
      }));

      const enriched: VillageRoom[] = roomsData.map(r => ({
        ...r,
        village_type: r.village_type as 'democratic_republic' | 'merchant_village' | null,
        api_cost_multiplier: r.api_cost_multiplier ?? 1.0,
        creator_id: r.creator_id,
        host: r.current_host_id ? profileMap.get(r.current_host_id) : undefined,
        participant_count: countMap.get(r.id) || 0,
        purchase: purchaseMap.get(r.id),
      }));
      setRooms(enriched);

      // Staff per room
      const roomIdsForStaff = roomsData.map(r => r.id);
      const { data: staffData } = await supabase
        .from('village_staff')
        .select('*')
        .in('room_id', roomIdsForStaff);

      if (staffData?.length) {
        const staffUserIds = staffData.map(s => s.user_id);
        const { data: staffProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', staffUserIds);
        const spMap = new Map((staffProfiles || []).map(p => [p.user_id, p]));
        const grouped: Record<string, StaffMember[]> = {};
        staffData.forEach(s => {
          if (!grouped[s.room_id]) grouped[s.room_id] = [];
          grouped[s.room_id].push({ ...s, profile: spMap.get(s.user_id) as StaffMember['profile'] });
        });
        setStaffMap(grouped);
      }

      // Elections per room
      const { data: electionData } = await supabase
        .from('village_elections')
        .select('*')
        .in('room_id', roomIdsForStaff)
        .order('created_at', { ascending: false });

      if (electionData?.length) {
        const winnerIds = electionData.filter(e => e.winner_id).map(e => e.winner_id!);
        let winnerMap = new Map<string, { full_name: string }>();
        if (winnerIds.length) {
          const { data: wp } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', winnerIds);
          wp?.forEach(p => winnerMap.set(p.user_id, p));
        }
        const grouped: Record<string, Election[]> = {};
        electionData.forEach(e => {
          if (!grouped[e.room_id]) grouped[e.room_id] = [];
          grouped[e.room_id].push({ ...e, winner: e.winner_id ? winnerMap.get(e.winner_id) : undefined });
        });
        setElectionsMap(grouped);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Edit room info ── */
  const openEdit = (room: VillageRoom) => {
    setEditRoom(room);
    setEditForm({ name: room.name, description: room.description || '', meeting_link: room.meeting_link });
  };

  const saveEdit = async () => {
    if (!editRoom) return;
    setSaving(true);
    const { error } = await supabase
      .from('live_rooms')
      .update({ name: editForm.name, description: editForm.description, meeting_link: editForm.meeting_link })
      .eq('id', editRoom.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ District updated' });
      setEditRoom(null);
      fetchAll();
    }
  };

  /* ── Reset (remove) current host ── */
  const resetHost = async (roomId: string) => {
    const { error } = await supabase
      .from('live_rooms')
      .update({ current_host_id: null, host_elected_at: null })
      .eq('id', roomId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ Host removed', description: 'District is now host-less until next election.' });
      setConfirmReset(null);
      fetchAll();
    }
  };

  /* ── Remove staff ── */
  const removeStaff = async (staffId: string) => {
    const { error } = await supabase.from('village_staff').delete().eq('id', staffId);
    if (!error) { toast({ title: 'Staff removed' }); fetchAll(); }
  };

  /* ── Cancel active election ── */
  const cancelElection = async (electionId: string) => {
    const { error } = await supabase
      .from('village_elections')
      .update({ status: 'cancelled', concluded_at: new Date().toISOString() })
      .eq('id', electionId);
    if (!error) { toast({ title: '✅ Election cancelled' }); fetchAll(); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Crown className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">District Rooms</h2>
            <p className="text-sm text-muted-foreground">Full administrative control over community districts</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} className="gap-2 tech-card border-0">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Village cards */}
      {rooms.map(room => {
        const staff = staffMap[room.id] || [];
        const elections = electionsMap[room.id] || [];
        const activeElection = elections.find(e => e.status === 'active');

        return (
          <Card key={room.id} className="tech-card border-0 overflow-hidden">
            {/* Top accent */}
            <div className={`h-1 bg-gradient-to-r ${room.village_type === 'merchant_village' ? 'from-amber-500 to-orange-500' : 'from-indigo-500 to-violet-500'}`} />

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{VILLAGE_EMOJIS[room.name] || '🏘️'}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      {room.village_type === 'merchant_village' ? (
                        <Badge className="bg-amber-500/10 text-amber-600 border-0 flex items-center gap-1 text-[10px]">
                          <ShoppingBag className="h-2.5 w-2.5" />
                          Merchant
                        </Badge>
                      ) : (
                        <Badge className="bg-indigo-500/10 text-indigo-600 border-0 flex items-center gap-1 text-[10px]">
                          <Vote className="h-2.5 w-2.5" />
                          Democratic
                        </Badge>
                      )}
                      <Badge className="bg-muted text-muted-foreground border-0 text-[10px] flex items-center gap-0.5">
                        <Zap className="h-2.5 w-2.5" />
                        {room.api_cost_multiplier ?? 1}× API
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {room.description || 'No description set.'}
                    </p>
                    {room.purchase && (
                      <div className="flex items-center gap-2 mt-1">
                        <DollarSign className="h-3 w-3 text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-medium">
                          ${((room.purchase.total_paid_cents || 0) / 100).toFixed(2)} paid
                        </span>
                        <span className="text-xs text-muted-foreground">by {room.purchase.creator_name}</span>
                        {room.purchase.completed_at && (
                          <span className="text-[10px] text-muted-foreground">
                            · {new Date(room.purchase.completed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-indigo-500/10 text-indigo-600 border-0 flex items-center gap-1 text-xs">
                    <Users className="h-3 w-3" />
                    {room.participant_count} online
                  </Badge>
                  {activeElection && (
                    <Badge className="bg-amber-500/10 text-amber-600 border-0 flex items-center gap-1 animate-pulse text-xs">
                      <Radio className="h-3 w-3" />
                      Election Live
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => openEdit(room)}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* ── Host Section — only for democratic villages ── */}
              {room.village_type !== 'merchant_village' ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-semibold">Current Host</span>
                    </div>
                    {room.host && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmReset(room.id)}
                      >
                        <UserMinus className="h-3 w-3" />
                        Remove Host
                      </Button>
                    )}
                  </div>
                  {room.host ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={room.host.avatar_url || undefined} />
                        <AvatarFallback>{room.host.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{room.host.full_name}</p>
                        {room.host_elected_at && (
                          <p className="text-xs text-muted-foreground">
                            Elected {new Date(room.host_elected_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge className="bg-amber-500/15 text-amber-600 border-0 text-[10px] ml-auto">HOST</Badge>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No host elected — district awaiting election.</p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-amber-700">Merchant District — no election or host system</span>
                </div>
              )}

              {/* ── Staff Section ── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Staff Committee</span>
                  <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">{staff.length} members</Badge>
                </div>
                {staff.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No staff appointed yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {staff.map(s => {
                      const RoleIcon = ROLE_ICONS[s.role] || Shield;
                      return (
                        <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={s.profile?.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px]">{s.profile?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-xs font-medium leading-tight">{s.profile?.full_name || 'Unknown'}</p>
                              <span className={`text-[10px] px-1.5 py-0 rounded-full inline-flex items-center gap-0.5 ${ROLE_COLORS[s.role] || 'text-muted-foreground bg-muted'}`}>
                                <RoleIcon className="h-2.5 w-2.5" />
                                {s.role}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                            onClick={() => removeStaff(s.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Elections Section — democratic only ── */}
              {room.village_type !== 'merchant_village' && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Gavel className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Election History</span>
                  </div>
                  {elections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No elections held yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {elections.slice(0, 5).map(e => (
                        <div key={e.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`text-[10px] border-0 ${
                                e.status === 'active' ? 'bg-amber-500/15 text-amber-600 animate-pulse' :
                                e.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                                'bg-muted text-muted-foreground'
                              }`}
                            >
                              {e.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(e.created_at).toLocaleDateString()}
                            </span>
                            {e.winner && (
                              <span className="text-xs">
                                → <span className="font-medium">{e.winner.full_name}</span> won
                              </span>
                            )}
                          </div>
                          {e.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                              onClick={() => cancelElection(e.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Meeting link */}
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 font-mono truncate">
                🔗 {room.meeting_link}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editRoom} onOpenChange={o => { if (!o) setEditRoom(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Edit {editRoom?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>District Name</Label>
              <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Meeting Link</Label>
              <Input value={editForm.meeting_link} onChange={e => setEditForm(f => ({ ...f, meeting_link: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoom(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm host reset ── */}
      <Dialog open={!!confirmReset} onOpenChange={o => { if (!o) setConfirmReset(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Remove Host?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This will remove the current host from the district. The district will be host-less until a new election is held.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReset(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmReset && resetHost(confirmReset)}>
              Remove Host
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
