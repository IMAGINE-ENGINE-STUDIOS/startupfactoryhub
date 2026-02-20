import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useVillageElections } from '@/hooks/useVillageElections';
import { useAuth } from '@/contexts/AuthContext';
import { Vote, Trophy, Loader2, RefreshCw } from 'lucide-react';

interface VillageElectionPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  roomName: string;
}

export default function VillageElectionPanel({ open, onOpenChange, roomId, roomName }: VillageElectionPanelProps) {
  const { user } = useAuth();
  const { election, votes, voteResults, participants, userVote, loading, allVoted, callElection, castVote } = useVillageElections(roomId);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleVote = async () => {
    if (!selectedCandidate) return;
    setSubmitting(true);
    await castVote(selectedCandidate);
    setSubmitting(false);
  };

  const totalParticipants = participants.length;
  const totalVotes = votes.length;
  const progressPct = totalParticipants > 0 ? Math.round((totalVotes / totalParticipants) * 100) : 0;
  const hasVoted = !!userVote;
  const showResults = allVoted || (election?.status === 'recalled');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5 text-indigo-500" />
            Village Election — {roomName}
          </DialogTitle>
          <DialogDescription>
            Vote for who should host this Village room. The winner needs more than 2 votes to be elected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* No active election */}
          {!election && (
            <div className="text-center py-6 space-y-4">
              <div className="h-16 w-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto">
                <Vote className="h-8 w-8 text-indigo-500" />
              </div>
              <div>
                <h3 className="font-semibold">No Active Election</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Anyone in the room can call an election to choose a host.
                </p>
              </div>
              <Button onClick={callElection} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Vote className="h-4 w-4" />}
                Call Election
              </Button>
            </div>
          )}

          {/* Active election */}
          {election && election.status === 'active' && (
            <>
              {/* Voting progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Votes received</span>
                  <span className="font-medium">{totalVotes} / {totalParticipants}</span>
                </div>
                <Progress value={progressPct} className="h-2" />
                {!allVoted && (
                  <p className="text-xs text-muted-foreground">
                    Waiting for all participants to vote before revealing results…
                  </p>
                )}
              </div>

              {/* Voting form — if user hasn't voted yet */}
              {!hasVoted && !showResults && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Choose your candidate:</p>
                  <RadioGroup value={selectedCandidate} onValueChange={setSelectedCandidate} className="space-y-2">
                    {participants.map(p => (
                      <div key={p.user_id} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer">
                        <RadioGroupItem value={p.user_id} id={`candidate-${p.user_id}`} />
                        <Label htmlFor={`candidate-${p.user_id}`} className="flex items-center gap-2.5 cursor-pointer flex-1">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={p.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">{p.full_name?.charAt(0) || '?'}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {p.full_name}
                            {p.user_id === user?.id && <span className="text-muted-foreground ml-1">(you)</span>}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Button
                    onClick={handleVote}
                    disabled={!selectedCandidate || submitting}
                    className="w-full"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Vote className="h-4 w-4 mr-2" />}
                    Submit Vote
                  </Button>
                </div>
              )}

              {/* Already voted, waiting */}
              {hasVoted && !showResults && (
                <div className="text-center py-4 space-y-2">
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-0">✅ Vote Submitted</Badge>
                  <p className="text-sm text-muted-foreground">
                    Waiting for other participants to vote…
                  </p>
                </div>
              )}

              {/* Show results when all voted */}
              {showResults && (
                <VoteResultsDisplay voteResults={voteResults} totalParticipants={totalParticipants} />
              )}
            </>
          )}

          {/* Recalled election */}
          {election && election.status === 'recalled' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-center space-y-2">
                <RefreshCw className="h-6 w-6 text-amber-500 mx-auto" />
                <p className="text-sm font-medium text-amber-600">No winner — Election Recalled</p>
                <p className="text-xs text-muted-foreground">
                  No candidate received more than 2 votes. A new election is being started…
                </p>
              </div>
              <VoteResultsDisplay voteResults={voteResults} totalParticipants={totalParticipants} />
            </div>
          )}

          {/* Concluded election */}
          {election && election.status === 'concluded' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4 text-center space-y-2">
                <Trophy className="h-6 w-6 text-yellow-500 mx-auto" />
                <p className="text-sm font-medium text-indigo-600">Host Elected!</p>
                {voteResults[0] && (
                  <div className="flex items-center justify-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={voteResults[0].candidate_avatar || undefined} />
                      <AvatarFallback>{voteResults[0].candidate_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold">{voteResults[0].candidate_name}</span>
                  </div>
                )}
              </div>
              <VoteResultsDisplay voteResults={voteResults} totalParticipants={totalParticipants} />
              <Button variant="outline" onClick={callElection} disabled={loading} className="w-full gap-2">
                <Vote className="h-4 w-4" />
                Call New Election
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VoteResultsDisplay({ voteResults, totalParticipants }: { voteResults: any[]; totalParticipants: number }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Vote Results</p>
      {voteResults.length === 0 ? (
        <p className="text-sm text-muted-foreground">No votes cast yet.</p>
      ) : (
        voteResults.map((r, i) => (
          <div key={r.candidate_id} className="flex items-center gap-3">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={r.candidate_avatar || undefined} />
              <AvatarFallback className="text-xs">{r.candidate_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate">{r.candidate_name}</span>
                <span className="text-muted-foreground shrink-0 ml-2">{r.vote_count} votes</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${i === 0 ? 'bg-indigo-500' : 'bg-muted-foreground/40'}`}
                  style={{ width: totalParticipants > 0 ? `${(r.vote_count / totalParticipants) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
