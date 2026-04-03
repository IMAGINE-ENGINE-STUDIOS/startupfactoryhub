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
  total_votes: number;
}

const TOTAL_SLOTS = 5;

const HotDealsVoting = () => {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [voteTallies, setVoteTallies] = useState<Record<string, VoteTally>>({});
  const [voterName, setVoterName] = useState(() => sessionStorage.getItem("hot_deals_voter") || "");
  const [nameSubmitted, setNameSubmitted] = useState(() => !!sessionStorage.getItem("hot_deals_voter"));
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [pulsingCards, setPulsingCards] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchStartups();
    fetchVotes();
    checkExistingVote();

    const channel = supabase
      .channel("hot-deals-votes-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "hot_deals_votes" }, (payload: any) => {
        fetchVotes();
        // Pulse animation on the card that got voted
        const sid = payload.new?.startup_id;
        if (sid) {
          setPulsingCards((prev) => new Set(prev).add(sid));
          setTimeout(() => setPulsingCards((prev) => { const n = new Set(prev); n.delete(sid); return n; }), 1500);
        }
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
    const { data } = await supabase.from("hot_deals_votes").select("startup_id");
    if (data) {
      const tallies: Record<string, VoteTally> = {};
      data.forEach((v) => {
        if (!tallies[v.startup_id]) tallies[v.startup_id] = { startup_id: v.startup_id, total_votes: 0 };
        tallies[v.startup_id].total_votes++;
      });
      setVoteTallies(tallies);
    }
  };

  const checkExistingVote = async () => {
    const name = sessionStorage.getItem("hot_deals_voter");
    if (!name) return;
    const { data } = await supabase.from("hot_deals_votes").select("startup_id").eq("voter_name", name.trim()).limit(1);
    if (data && data.length > 0) setVotedFor(data[0].startup_id);
  };

  const submitName = () => {
    if (!voterName.trim()) return;
    sessionStorage.setItem("hot_deals_voter", voterName.trim());
    setNameSubmitted(true);
    checkExistingVote();
  };

  const vote = async (startupId: string) => {
    if (!nameSubmitted || votedFor) return;
    const { error } = await supabase.from("hot_deals_votes").insert({
      startup_id: startupId,
      voter_name: voterName.trim(),
      rating: 1,
    });
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already voted", description: "You can only vote once.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      return;
    }
    setVotedFor(startupId);
    toast({ title: "🔥 Vote cast!", description: `You voted for this startup!` });
  };

  // Build cards: real startups + empty placeholders
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

  // Find max votes for bar width
  const maxVotes = Math.max(1, ...Object.values(voteTallies).map((t) => t.total_votes));

  return (
    <div className="space-y-4">
      {/* Name prompt */}
      {!nameSubmitted && (
        <div className="tech-card rounded-2xl p-5 text-center space-y-3 border border-orange-400/20">
          <h3 className="text-lg font-bold text-orange-400 font-futuristic tracking-wider">CAST YOUR VOTE</h3>
          <p className="text-muted-foreground text-sm">Enter your name to vote for your favorite startup</p>
          <div className="flex gap-2 max-w-sm mx-auto">
            <Input
              placeholder="Your name"
              value={voterName}
              onChange={(e) => setVoterName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitName()}
              className="border-orange-400/30 focus-visible:ring-orange-400"
            />
            <Button onClick={submitName} className="bg-orange-500 hover:bg-orange-600 text-white">Start</Button>
          </div>
        </div>
      )}

      {nameSubmitted && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🔥</span>
          <h3 className="text-lg font-bold text-orange-400 font-futuristic tracking-wider">STARTUPS & VOTING</h3>
          <span className="text-muted-foreground text-xs ml-auto">
            Voting as: {voterName} {votedFor && <span className="text-orange-400 ml-1">(voted)</span>}
          </span>
        </div>
      )}

      {/* Credit card style startup cards */}
      <div className="space-y-4">
        {cards.map((s) => {
          const isPlaceholder = s.id.startsWith("placeholder-");
          const tally = voteTallies[s.id];
          const votes = tally?.total_votes || 0;
          const isPulsing = pulsingCards.has(s.id);
          const isVotedFor = votedFor === s.id;

          return (
            <div
              key={s.id}
              className={`tech-card rounded-2xl border transition-all duration-500 ${
                isPlaceholder
                  ? "border-orange-400/5 opacity-40"
                  : isPulsing
                  ? "border-orange-400/60 shadow-[0_0_30px_rgba(251,146,60,0.3)]"
                  : isVotedFor
                  ? "border-orange-400/40 shadow-[0_0_20px_rgba(251,146,60,0.15)]"
                  : "border-orange-400/10 hover:border-orange-400/30"
              }`}
            >
              <div className="p-5 flex flex-col sm:flex-row gap-5">
                {/* Logo */}
                <div className="shrink-0">
                  {s.logo_url ? (
                    <img src={s.logo_url} alt={s.company_name} className="w-20 h-20 rounded-xl object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-2xl">
                      {isPlaceholder ? "?" : s.company_name[0]}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <h4 className="text-lg font-bold text-foreground">{s.company_name}</h4>
                    {s.pitch_title && <p className="text-sm text-orange-400/80">{s.pitch_title}</p>}
                  </div>
                  {s.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                  )}
                  {s.pitch_deck_url && (
                    <a
                      href={s.pitch_deck_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300 transition-colors font-semibold"
                    >
                      🔥 View Pitch Deck
                    </a>
                  )}
                </div>

                {/* Vote section */}
                {!isPlaceholder && (
                  <div className="shrink-0 flex flex-col items-center justify-center gap-2 min-w-[100px]">
                    <button
                      disabled={!nameSubmitted || !!votedFor}
                      onClick={() => vote(s.id)}
                      className={`text-4xl transition-all duration-300 ${
                        !nameSubmitted || !!votedFor
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:scale-125 cursor-pointer hover:drop-shadow-[0_0_15px_rgba(251,146,60,0.8)]"
                      } ${isPulsing ? "animate-bounce" : ""}`}
                    >
                      🔥
                    </button>
                    <div className="text-center">
                      <p className="text-orange-400 font-bold text-lg">{votes}</p>
                      <p className="text-muted-foreground text-[10px]">votes</p>
                    </div>
                    {isVotedFor && <span className="text-orange-400 text-xs font-semibold">YOUR VOTE</span>}
                  </div>
                )}
              </div>

              {/* Vote bar */}
              {!isPlaceholder && votes > 0 && (
                <div className="px-5 pb-3">
                  <div className="h-1.5 rounded-full bg-orange-400/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-1000"
                      style={{ width: `${(votes / maxVotes) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HotDealsVoting;
