import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import HotDealsSupportModal from "@/components/HotDealsSupportModal";

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

interface DonationTally {
  startup_id: string;
  total_raised_cents: number;
}

const TOTAL_SLOTS = 5;

const HotDealsVoting = () => {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [voteTallies, setVoteTallies] = useState<Record<string, VoteTally>>({});
  const [donationTallies, setDonationTallies] = useState<Record<string, DonationTally>>({});
  const [voterName, setVoterName] = useState(() => sessionStorage.getItem("hot_deals_voter") || "");
  const [nameSubmitted, setNameSubmitted] = useState(() => !!sessionStorage.getItem("hot_deals_voter"));
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [voteCode, setVoteCode] = useState<string | null>(null);
  const [pulsingCards, setPulsingCards] = useState<Set<string>>(new Set());
  const [supportStartup, setSupportStartup] = useState<Startup | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStartups();
    fetchVotes();
    fetchDonations();
    checkExistingVote();

    // Verify donation on return from Stripe
    const params = new URLSearchParams(window.location.search);
    const donationStatus = params.get("donation");
    const sessionId = params.get("session_id");
    if (donationStatus === "success" && sessionId) {
      verifyDonation(sessionId);
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }

    const channel = supabase
      .channel("hot-deals-votes-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "hot_deals_votes" }, (payload: any) => {
        fetchVotes();
        const sid = payload.new?.startup_id;
        if (sid) {
          setPulsingCards((prev) => new Set(prev).add(sid));
          setTimeout(() => setPulsingCards((prev) => { const n = new Set(prev); n.delete(sid); return n; }), 1500);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "hot_deals_donations" }, () => {
        fetchDonations();
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

  const fetchDonations = async () => {
    const { data } = await supabase
      .from("hot_deals_donations")
      .select("startup_id, amount_cents")
      .eq("status", "completed");
    if (data) {
      const tallies: Record<string, DonationTally> = {};
      data.forEach((d) => {
        if (!tallies[d.startup_id]) tallies[d.startup_id] = { startup_id: d.startup_id, total_raised_cents: 0 };
        tallies[d.startup_id].total_raised_cents += d.amount_cents;
      });
      setDonationTallies(tallies);
    }
  };

  const verifyDonation = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-hot-deals-donation", {
        body: { session_id: sessionId },
      });
      if (data?.verified) {
        toast({ title: "🔥 Donation confirmed!", description: "Thank you for supporting this startup!" });
        fetchDonations();
      }
    } catch (e) {
      console.error("Donation verification error:", e);
    }
  };

  const checkExistingVote = async () => {
    const name = sessionStorage.getItem("hot_deals_voter");
    if (!name) return;
    const { data } = await supabase.from("hot_deals_votes").select("startup_id, vote_code").eq("voter_name", name.trim()).limit(1);
    if (data && data.length > 0) {
      setVotedFor(data[0].startup_id);
      setVoteCode((data[0] as any).vote_code || null);
    }
  };

  const submitName = () => {
    if (!voterName.trim()) return;
    sessionStorage.setItem("hot_deals_voter", voterName.trim());
    setNameSubmitted(true);
    checkExistingVote();
  };

  const vote = async (startupId: string) => {
    if (!nameSubmitted || votedFor) return;
    const { data, error } = await supabase.from("hot_deals_votes").insert({
      startup_id: startupId,
      voter_name: voterName.trim(),
      rating: 1,
    }).select("vote_code");
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already voted", description: "You can only vote once.", variant: "destructive" });
        checkExistingVote();
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      return;
    }
    setVotedFor(startupId);
    const code = (data?.[0] as any)?.vote_code || null;
    setVoteCode(code);
    fetchVotes();
    toast({ title: "🔥 Vote cast!", description: `Your vote code: ${code}` });
  };

  // Sort real startups by vote count (descending), then add placeholders
  const sortedStartups = [...startups].sort((a, b) => {
    const votesA = voteTallies[a.id]?.total_votes || 0;
    const votesB = voteTallies[b.id]?.total_votes || 0;
    return votesB - votesA;
  });

  const cards: Startup[] = [...sortedStartups];
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

  const maxVotes = Math.max(1, ...Object.values(voteTallies).map((t) => t.total_votes));

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Name prompt */}
      {!nameSubmitted && (
        <div className="tech-card rounded-2xl p-4 sm:p-5 text-center space-y-3 border border-orange-400/20">
          <h3 className="text-base sm:text-lg font-bold text-orange-400 font-futuristic tracking-wider">CAST YOUR VOTE</h3>
          <p className="text-muted-foreground text-xs sm:text-sm">Enter your name to vote for your favorite startup</p>
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
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-lg">🔥</span>
          <h3 className="text-base sm:text-lg font-bold text-orange-400 font-futuristic tracking-wider">STARTUPS & VOTING</h3>
          <span className="text-muted-foreground text-xs ml-auto">
            Voting as: <span className="text-orange-400 font-semibold">{voterName}</span>
            {votedFor && <span className="text-orange-400 ml-1">(voted)</span>}
          </span>
        </div>
      )}

      {/* Startup cards sorted by votes */}
      <div className="space-y-3 sm:space-y-4">
        {cards.map((s, index) => {
          const isPlaceholder = s.id.startsWith("placeholder-");
          const tally = voteTallies[s.id];
          const votes = tally?.total_votes || 0;
          const isPulsing = pulsingCards.has(s.id);
          const isVotedFor = votedFor === s.id;
          const rank = isPlaceholder ? null : index + 1;
          const totalRaised = donationTallies[s.id]?.total_raised_cents || 0;

          return (
            <div
              key={s.id}
              className={`tech-card rounded-2xl border transition-all duration-700 ${
                isPlaceholder
                  ? "border-orange-400/5 opacity-40"
                  : isPulsing
                  ? "border-orange-400/60 shadow-[0_0_30px_rgba(251,146,60,0.3)] scale-[1.01]"
                  : isVotedFor
                  ? "border-orange-400/40 shadow-[0_0_20px_rgba(251,146,60,0.15)]"
                  : "border-orange-400/10 hover:border-orange-400/30"
              }`}
              style={{ transition: "all 0.7s cubic-bezier(0.4, 0, 0.2, 1)" }}
            >
              <div className="p-3 sm:p-5 flex flex-col sm:flex-row gap-3 sm:gap-5">
                {/* Rank badge */}
                {rank && (
                  <div className="shrink-0 flex sm:flex-col items-center justify-center gap-1">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-lg sm:text-xl ${
                      rank === 1 ? "bg-orange-500/30 text-orange-300 border border-orange-400/40" :
                      rank === 2 ? "bg-orange-500/20 text-orange-400/80 border border-orange-400/20" :
                      "bg-orange-500/10 text-orange-400/60 border border-orange-400/10"
                    }`}>
                      #{rank}
                    </div>
                  </div>
                )}

                {/* Logo */}
                <div className="shrink-0">
                  {s.logo_url ? (
                    <img src={s.logo_url} alt={s.company_name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover" />
                  ) : (
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-xl sm:text-2xl`}>
                      {isPlaceholder ? "?" : s.company_name[0]}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-foreground">{s.company_name}</h4>
                    {s.pitch_title && <p className="text-xs sm:text-sm text-orange-400/80">{s.pitch_title}</p>}
                  </div>
                  {s.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-none">{s.description}</p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    {s.pitch_deck_url && (
                      <a
                        href={s.pitch_deck_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs sm:text-sm text-orange-400 hover:text-orange-300 transition-colors font-semibold"
                      >
                        🔥 View Pitch Deck
                      </a>
                    )}
                    {totalRaised > 0 && (
                      <span className="text-xs text-orange-400/70 font-semibold">
                        💲 ${(totalRaised / 100).toLocaleString()} raised
                      </span>
                    )}
                  </div>
                </div>

                {/* Vote + Support section */}
                {!isPlaceholder && (
                  <div className="shrink-0 flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-2 sm:min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <button
                        disabled={!nameSubmitted || !!votedFor}
                        onClick={() => vote(s.id)}
                        className={`text-3xl sm:text-4xl transition-all duration-300 ${
                          !nameSubmitted || !!votedFor
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:scale-125 cursor-pointer hover:drop-shadow-[0_0_15px_rgba(251,146,60,0.8)]"
                        } ${isPulsing ? "animate-bounce" : ""}`}
                      >
                        🔥
                      </button>
                      <button
                        onClick={() => setSupportStartup(s)}
                        className="text-2xl sm:text-3xl transition-all duration-300 hover:scale-125 cursor-pointer hover:drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]"
                        title={`Support ${s.company_name}`}
                      >
                        💲
                      </button>
                    </div>
                    <div className="text-center">
                      <p className="text-orange-400 font-bold text-lg sm:text-xl">{votes}</p>
                      <p className="text-muted-foreground text-[10px]">votes</p>
                    </div>
                    {isVotedFor && (
                      <div className="text-center">
                        <span className="text-orange-400 text-[10px] sm:text-xs font-semibold">YOUR VOTE</span>
                        {voteCode && <p className="text-orange-400/60 text-[8px] font-mono">{voteCode}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Vote bar */}
              {!isPlaceholder && votes > 0 && (
                <div className="px-3 sm:px-5 pb-3">
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

      {/* Support Modal */}
      {supportStartup && (
        <HotDealsSupportModal
          startup={supportStartup}
          onClose={() => setSupportStartup(null)}
        />
      )}
    </div>
  );
};

export default HotDealsVoting;
