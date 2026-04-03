import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Startup {
  id: string;
  company_name: string;
  pitch_title: string | null;
  description: string | null;
  logo_url: string | null;
  pitch_deck_url: string | null;
}

interface VoteTally {
  startup_id: string;
  avg_rating: number;
  total_votes: number;
}

const TOTAL_SLOTS = 5;

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
      .select("id, company_name, pitch_title, description, logo_url, pitch_deck_url")
      .eq("confirmed", true)
      .order("invited_at", { ascending: true });
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
    if (!nameSubmitted) return;
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
    toast({ title: "Vote submitted!", description: `Rated ${rating} fire(s)` });
  };

  // Build cards: real startups + empty placeholders up to 5
  const cards = [...startups];
  while (cards.length < TOTAL_SLOTS) {
    cards.push({
      id: `placeholder-${cards.length + 1}`,
      company_name: `Startup #${cards.length + 1}`,
      pitch_title: "Coming soon",
      description: null,
      logo_url: null,
      pitch_deck_url: null,
    });
  }

  return (
    <div className="space-y-4">
      {/* Name prompt bar */}
      {!nameSubmitted && (
        <div className="tech-card rounded-2xl p-4 text-center space-y-3 border border-orange-400/20">
          <h3 className="text-lg font-bold text-orange-400 font-futuristic tracking-wider">CAST YOUR VOTE</h3>
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
      )}

      {nameSubmitted && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🔥</span>
          <h3 className="text-lg font-bold text-orange-400 font-futuristic tracking-wider">STARTUPS & VOTING</h3>
          <span className="text-muted-foreground text-xs ml-auto">Voting as: {voterName}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((s) => {
          const isPlaceholder = s.id.startsWith("placeholder-");
          const tally = voteTallies[s.id];
          const hasVoted = votedStartups.has(s.id);
          const hovered = hoveredRating[s.id] || 0;

          return (
            <div key={s.id} className={`tech-card rounded-xl p-4 space-y-3 border ${isPlaceholder ? "border-orange-400/5 opacity-50" : "border-orange-400/10 hover:border-orange-400/30"} transition-colors`}>
              {/* Profile */}
              <div className="flex items-center gap-3">
                {s.logo_url ? (
                  <img src={s.logo_url} alt={s.company_name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-lg">
                    {isPlaceholder ? "?" : s.company_name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{s.company_name}</p>
                  {s.pitch_title && <p className="text-xs text-orange-400/80 truncate">{s.pitch_title}</p>}
                </div>
              </div>

              {s.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
              )}

              {s.pitch_deck_url && (
                <a
                  href={s.pitch_deck_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                >
                  🔥 View Pitch Deck
                </a>
              )}

              {/* Voting */}
              {!isPlaceholder && (
                <>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        key={r}
                        disabled={hasVoted || !nameSubmitted}
                        onClick={() => vote(s.id, r)}
                        onMouseEnter={() => setHoveredRating((p) => ({ ...p, [s.id]: r }))}
                        onMouseLeave={() => setHoveredRating((p) => ({ ...p, [s.id]: 0 }))}
                        className={`text-xl transition-all ${hasVoted || !nameSubmitted ? "opacity-50 cursor-not-allowed" : "hover:scale-125 cursor-pointer"} ${r <= hovered ? "drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" : ""}`}
                      >
                        🔥
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      Avg: <span className="text-orange-400 font-semibold">{tally ? tally.avg_rating.toFixed(1) : "—"}</span>
                    </span>
                    <span>{tally ? tally.total_votes : 0} votes</span>
                    {hasVoted && <span className="text-orange-400 ml-auto">Voted</span>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HotDealsVoting;
