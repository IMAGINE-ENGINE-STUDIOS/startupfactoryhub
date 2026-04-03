import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

interface Startup {
  id: string;
  company_name: string;
  pitch_title: string | null;
  description: string | null;
  logo_url: string | null;
}

interface VoteTally {
  startup_id: string;
  avg_rating: number;
  total_votes: number;
}

const HotDealsVoting = () => {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [voteTallies, setVoteTallies] = useState<Record<string, VoteTally>>({});
  const [voterName, setVoterName] = useState(() => sessionStorage.getItem("hot_deals_voter") || "");
  const [nameSubmitted, setNameSubmitted] = useState(() => !!sessionStorage.getItem("hot_deals_voter"));
  const [votedStartups, setVotedStartups] = useState<Set<string>>(new Set());
  const [hoveredRating, setHoveredRating] = useState<Record<string, number>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchStartups();
    fetchVotes();

    const channel = supabase
      .channel("hot-deals-votes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "hot_deals_votes" }, () => {
        fetchVotes();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchStartups = async () => {
    const { data } = await supabase
      .from("hot_deals_invited_startups")
      .select("id, company_name, pitch_title, description, logo_url")
      .eq("confirmed", true);
    if (data) setStartups(data);
  };

  const fetchVotes = async () => {
    const { data } = await supabase.from("hot_deals_votes").select("startup_id, rating");
    if (data) {
      const tallies: Record<string, VoteTally> = {};
      data.forEach((v) => {
        if (!tallies[v.startup_id]) tallies[v.startup_id] = { startup_id: v.startup_id, avg_rating: 0, total_votes: 0 };
        tallies[v.startup_id].total_votes++;
        tallies[v.startup_id].avg_rating += v.rating;
      });
      Object.values(tallies).forEach((t) => { t.avg_rating = t.avg_rating / t.total_votes; });
      setVoteTallies(tallies);
    }
  };

  const submitName = () => {
    if (!voterName.trim()) return;
    sessionStorage.setItem("hot_deals_voter", voterName.trim());
    setNameSubmitted(true);
  };

  const vote = async (startupId: string, rating: number) => {
    const { error } = await supabase.from("hot_deals_votes").insert({
      startup_id: startupId,
      voter_name: voterName.trim(),
      rating,
    });
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already voted", description: "You've already voted for this startup.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      return;
    }
    setVotedStartups((prev) => new Set(prev).add(startupId));
    toast({ title: "🔥 Vote submitted!", description: `Rated ${rating} fire(s)` });
  };

  if (!nameSubmitted) {
    return (
      <div className="tech-card rounded-2xl p-6 text-center space-y-4">
        <h3 className="text-lg font-bold text-orange-400 font-futuristic tracking-wider">🔥 CAST YOUR VOTE</h3>
        <p className="text-muted-foreground text-sm">Enter your name to start voting</p>
        <div className="flex gap-2 max-w-sm mx-auto">
          <Input
            placeholder="Your name"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitName()}
            className="border-orange-400/30 focus-visible:ring-orange-400"
          />
          <Button onClick={submitName} className="bg-orange-500 hover:bg-orange-600 text-white">
            Start
          </Button>
        </div>
      </div>
    );
  }

  if (startups.length === 0) {
    return (
      <div className="tech-card rounded-2xl p-6 text-center">
        <p className="text-muted-foreground text-sm">No startups registered yet. Stay tuned!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Flame className="w-5 h-5 text-orange-400" />
        <h3 className="text-lg font-bold text-orange-400 font-futuristic tracking-wider">LIVE VOTING</h3>
        <span className="text-muted-foreground text-xs ml-auto">Voting as: {voterName}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {startups.map((s) => {
          const tally = voteTallies[s.id];
          const hasVoted = votedStartups.has(s.id);
          const hovered = hoveredRating[s.id] || 0;

          return (
            <div key={s.id} className="tech-card rounded-xl p-4 space-y-3 border border-orange-400/10">
              <div className="flex items-center gap-3">
                {s.logo_url ? (
                  <img src={s.logo_url} alt={s.company_name} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">
                    {s.company_name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{s.company_name}</p>
                  {s.pitch_title && <p className="text-xs text-muted-foreground truncate">{s.pitch_title}</p>}
                </div>
              </div>

              {/* Fire rating */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    disabled={hasVoted}
                    onClick={() => vote(s.id, r)}
                    onMouseEnter={() => setHoveredRating((p) => ({ ...p, [s.id]: r }))}
                    onMouseLeave={() => setHoveredRating((p) => ({ ...p, [s.id]: 0 }))}
                    className={`text-2xl transition-all ${hasVoted ? "opacity-50 cursor-not-allowed" : "hover:scale-125 cursor-pointer"} ${r <= hovered ? "drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" : ""}`}
                  >
                    🔥
                  </button>
                ))}
              </div>

              {/* Tally */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  Avg: <span className="text-orange-400 font-semibold">{tally ? tally.avg_rating.toFixed(1) : "—"}</span> 🔥
                </span>
                <span>{tally ? tally.total_votes : 0} votes</span>
                {hasVoted && <span className="text-green-400 ml-auto">✓ Voted</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HotDealsVoting;
