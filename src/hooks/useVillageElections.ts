import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface VillageElection {
  id: string;
  room_id: string;
  status: 'active' | 'concluded' | 'recalled';
  started_at: string;
  concluded_at: string | null;
  winner_id: string | null;
  created_at: string;
}

export interface VillageVote {
  id: string;
  election_id: string;
  voter_id: string;
  candidate_id: string;
  created_at: string;
}

export interface VoteResult {
  candidate_id: string;
  candidate_name: string;
  candidate_avatar: string | null;
  vote_count: number;
}

export const useVillageElections = (roomId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [election, setElection] = useState<VillageElection | null>(null);
  const [votes, setVotes] = useState<VillageVote[]>([]);
  const [voteResults, setVoteResults] = useState<VoteResult[]>([]);
  const [participants, setParticipants] = useState<Array<{ user_id: string; full_name: string; avatar_url: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [userVote, setUserVote] = useState<string | null>(null);

  const fetchElection = useCallback(async () => {
    if (!roomId) return;
    const { data } = await supabase
      .from('village_elections')
      .select('*')
      .eq('room_id', roomId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setElection(data as VillageElection | null);
  }, [roomId]);

  const fetchVotes = useCallback(async () => {
    if (!election) return;
    const { data } = await supabase
      .from('village_votes')
      .select('*')
      .eq('election_id', election.id);
    setVotes((data as VillageVote[]) || []);
    if (user) {
      const myVote = data?.find((v: any) => v.voter_id === user.id);
      setUserVote(myVote?.candidate_id || null);
    }
  }, [election, user]);

  const fetchParticipants = useCallback(async () => {
    if (!roomId) return;
    const { data: partData } = await supabase
      .from('live_room_participants')
      .select('user_id')
      .eq('room_id', roomId);
    if (!partData || partData.length === 0) {
      setParticipants([]);
      return;
    }
    const ids = partData.map((p: any) => p.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', ids);
    setParticipants((profiles as any[]) || []);
  }, [roomId]);

  const buildVoteResults = useCallback(() => {
    const map = new Map<string, number>();
    votes.forEach(v => {
      map.set(v.candidate_id, (map.get(v.candidate_id) || 0) + 1);
    });
    const results: VoteResult[] = Array.from(map.entries()).map(([candidateId, count]) => {
      const profile = participants.find(p => p.user_id === candidateId);
      return {
        candidate_id: candidateId,
        candidate_name: profile?.full_name || 'Unknown',
        candidate_avatar: profile?.avatar_url || null,
        vote_count: count,
      };
    }).sort((a, b) => b.vote_count - a.vote_count);
    setVoteResults(results);
  }, [votes, participants]);

  useEffect(() => { fetchElection(); }, [fetchElection]);
  useEffect(() => { fetchVotes(); }, [fetchVotes]);
  useEffect(() => { fetchParticipants(); }, [fetchParticipants]);
  useEffect(() => { buildVoteResults(); }, [buildVoteResults]);

  // Real-time
  useEffect(() => {
    const channel = supabase
      .channel(`village-elections-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'village_elections', filter: `room_id=eq.${roomId}` }, fetchElection)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'village_votes' }, fetchVotes)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_room_participants', filter: `room_id=eq.${roomId}` }, fetchParticipants)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, fetchElection, fetchVotes, fetchParticipants]);

  const callElection = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Close any existing active election first
      if (election) {
        await supabase
          .from('village_elections')
          .update({ status: 'recalled', concluded_at: new Date().toISOString() })
          .eq('id', election.id);
      }
      const { error } = await supabase
        .from('village_elections')
        .insert({ room_id: roomId, status: 'active' });
      if (error) throw error;
      toast({ title: '🗳️ Election Called!', description: 'All participants can now vote for a Village host.' });
      await fetchElection();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Could not start election', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const castVote = async (candidateId: string) => {
    if (!user || !election) return;
    try {
      const { error } = await supabase
        .from('village_votes')
        .insert({ election_id: election.id, voter_id: user.id, candidate_id: candidateId });
      if (error) throw error;
      setUserVote(candidateId);
      toast({ title: '✅ Vote Cast!', description: 'Your vote has been recorded.' });
      await fetchVotes();
      // Check if all participants have voted
      await checkAndFinalizeElection(election.id);
    } catch (e: any) {
      if (e?.code === '23505') {
        toast({ title: 'Already Voted', description: 'You have already cast your vote.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Could not cast vote', variant: 'destructive' });
      }
    }
  };

  const checkAndFinalizeElection = async (electionId: string) => {
    const { data: allVotes } = await supabase
      .from('village_votes')
      .select('*')
      .eq('election_id', electionId);

    const { data: parts } = await supabase
      .from('live_room_participants')
      .select('user_id')
      .eq('room_id', roomId);

    const totalParticipants = parts?.length || 0;
    const totalVotes = allVotes?.length || 0;

    if (totalVotes < totalParticipants) return; // Not everyone voted yet

    // Tally votes
    const tally = new Map<string, number>();
    allVotes?.forEach((v: any) => {
      tally.set(v.candidate_id, (tally.get(v.candidate_id) || 0) + 1);
    });

    let winner: string | null = null;
    let maxVotes = 0;
    tally.forEach((count, candidateId) => {
      if (count > maxVotes) { maxVotes = count; winner = candidateId; }
    });

    if (winner && maxVotes > 2) {
      // Winner! Update room host and conclude election
      await supabase.from('live_rooms').update({
        current_host_id: winner,
        host_elected_at: new Date().toISOString(),
      }).eq('id', roomId);

      await supabase.from('village_elections').update({
        status: 'concluded',
        winner_id: winner,
        concluded_at: new Date().toISOString(),
      }).eq('id', electionId);

      toast({ title: '🏆 Host Elected!', description: 'A host has been elected by democratic vote.' });
    } else {
      // No clear winner — recall and restart
      await supabase.from('village_elections').update({
        status: 'recalled',
        concluded_at: new Date().toISOString(),
      }).eq('id', electionId);

      toast({
        title: '🔁 No Winner — Recalling Election',
        description: 'No candidate received more than 2 votes. A new election will begin.',
      });

      // Auto-restart election after brief delay
      setTimeout(async () => {
        await supabase.from('village_elections').insert({ room_id: roomId, status: 'active' });
        await fetchElection();
      }, 3000);
    }
    await fetchElection();
  };

  const allVoted = participants.length > 0 && votes.length >= participants.length;

  return {
    election,
    votes,
    voteResults,
    participants,
    userVote,
    loading,
    allVoted,
    callElection,
    castVote,
    refetch: fetchElection,
  };
};
