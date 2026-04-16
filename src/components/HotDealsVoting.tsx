import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Flag, Flame, DollarSign, FileText, Globe, MapPin, Trophy, Medal, Award, Play } from "lucide-react";
import HotDealsSupportModal from "@/components/HotDealsSupportModal";

interface Startup {
  id: string;
  company_name: string;
  pitch_title: string | null;
  description: string | null;
  logo_url: string | null;
  pitch_deck_url: string | null;
  user_id: string | null;
  contact_email: string | null;
  stripe_connect_account_id: string | null;
  industry?: string | null;
  location?: string | null;
  website?: string | null;
}

interface VoteTally {
  startup_id: string;
  total_votes: number;
}

interface DonationTally {
  startup_id: string;
  total_raised_cents: number;
}

const STARTUP_FALLBACKS: Record<string, { logo: string; name: string; website: string; industry: string }> = {
  "nuview": {
    logo: "/images/nuview-logo.jpg",
    name: "NuView",
    website: "https://nuview.space",
    industry: "Space / LiDAR",
  },
  "arachnid": {
    logo: "/images/arachnid-logo.png",
    name: "Arachnid System",
    website: "https://arachnidsys.com",
    industry: "Space Robotics",
  },
  "fibonacci": {
    logo: "/images/fibonacci-logo.jpg",
    name: "Fibonacci Cellars",
    website: "https://thespacebrokerage.com",
    industry: "Space Brokerage",
  },
};

const getFallback = (companyName: string) => {
  const lower = companyName.toLowerCase();
  for (const [key, val] of Object.entries(STARTUP_FALLBACKS)) {
    if (lower.includes(key)) return val;
  }
  return null;
};

const TOTAL_SLOTS = 5;

const RANK_STYLES = [
  "bg-gradient-to-br from-yellow-500/40 to-orange-500/40 text-yellow-300 border-2 border-yellow-400/60 shadow-[0_0_20px_rgba(234,179,8,0.4)]",
  "bg-gradient-to-br from-gray-300/30 to-gray-400/30 text-gray-300 border-2 border-gray-300/50",
  "bg-gradient-to-br from-amber-700/30 to-orange-700/30 text-amber-500 border-2 border-amber-600/40",
  "bg-orange-500/15 text-orange-400/70 border border-orange-400/20",
  "bg-orange-500/10 text-orange-400/50 border border-orange-400/10",
];

const RANK_ICONS = [
  <Trophy key="1" className="w-5 h-5" />,
  <Medal key="2" className="w-5 h-5" />,
  <Award key="3" className="w-5 h-5" />,
  null,
  null,
];

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

    const params = new URLSearchParams(window.location.search);
    const donationStatus = params.get("donation");
    const sessionId = params.get("session_id");
    if (donationStatus === "success" && sessionId) {
      verifyDonation(sessionId);
      window.history.replaceState({}, "", window.location.pathname);
    }

    const channel = supabase
      .channel("hot-deals-votes-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "hot_deals_votes" }, (payload: any) => {
        fetchVotes();
        const sid = payload.new?.startup_id;
        if (sid) {
          setPulsingCards((prev) => new Set(prev).add(sid));
          setTimeout(
            () =>
              setPulsingCards((prev) => {
                const n = new Set(prev);
                n.delete(sid);
                return n;
              }),
            1500,
          );
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "hot_deals_donations" }, () => {
        fetchDonations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStartups = async () => {
    const { data } = await supabase
      .from("hot_deals_invited_startups")
      .select(
        "id, company_name, pitch_title, description, logo_url, pitch_deck_url, user_id, contact_email, stripe_connect_account_id",
      )
      .eq("confirmed", true)
      .order("invited_at", { ascending: true });
    if (data) {
      const enriched = await Promise.all(
        data.map(async (s: any) => {
          if (s.user_id) {
            const { data: company } = await supabase
              .from("companies")
              .select("industry, location, website")
              .eq("user_id", s.user_id)
              .order("created_at", { ascending: true })
              .limit(1)
              .maybeSingle();
            return { ...s, industry: company?.industry, location: company?.location, website: company?.website };
          }
          return s;
        }),
      );
      setStartups(enriched);
    }
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
      const { data } = await supabase.functions.invoke("verify-hot-deals-donation", {
        body: { session_id: sessionId },
      });
      if (data?.verified) {
        toast({ title: "Donation confirmed!", description: "Thank you for supporting this startup!" });
        fetchDonations();
      }
    } catch (e) {
      console.error("Donation verification error:", e);
    }
  };

  const checkExistingVote = async () => {
    const name = sessionStorage.getItem("hot_deals_voter");
    if (!name) return;
    const { data } = await supabase
      .from("hot_deals_votes")
      .select("startup_id, vote_code")
      .eq("voter_name", name.trim())
      .limit(1);
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
    const { data, error } = await supabase
      .from("hot_deals_votes")
      .insert({
        startup_id: startupId,
        voter_name: voterName.trim(),
        rating: 1,
      })
      .select("vote_code");
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
    toast({ title: "Vote cast!", description: `Your vote code: ${code}` });
  };

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
      user_id: null,
      contact_email: null,
      stripe_connect_account_id: null,
    });
  }

  const maxVotes = Math.max(1, ...Object.values(voteTallies).map((t) => t.total_votes));

  return (
    <div className="space-y-3 sm:space-y-4">
      {!nameSubmitted && (
        <div className="racing-card rounded-2xl p-4 sm:p-5 text-center space-y-3">
          <h3 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 font-futuristic tracking-wider flex items-center justify-center gap-2">
            <Flag className="w-4 h-4 text-orange-400" /> CAST YOUR VOTE <Flag className="w-4 h-4 text-orange-400" />
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Enter your name to vote for your favorite startup racer
          </p>
          <div className="flex gap-2 max-w-sm mx-auto">
            <Input
              placeholder="Your name"
              value={voterName}
              onChange={(e) => setVoterName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitName()}
              className="border-orange-400/30 focus-visible:ring-orange-400"
            />
            <Button
              onClick={submitName}
              className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-bold flex items-center gap-1.5"
            >
              <Play className="w-4 h-4" /> GO!
            </Button>
          </div>
        </div>
      )}

      {nameSubmitted && (
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Flag className="w-4 h-4 text-orange-400" />
          <h3 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 font-futuristic tracking-wider">
            STARTUP RACE BOARD
          </h3>
          <span className="text-muted-foreground text-xs ml-auto">
            Racer: <span className="text-orange-400 font-semibold">{voterName}</span>
            {votedFor && <span className="text-red-400 ml-1">(voted)</span>}
          </span>
        </div>
      )}

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
              className={`racing-card rounded-2xl transition-all duration-700 ${
                isPlaceholder
                  ? "opacity-40"
                  : isPulsing
                    ? "shadow-[0_0_40px_rgba(251,146,60,0.4)] scale-[1.01]"
                    : isVotedFor
                      ? "shadow-[0_0_25px_rgba(251,146,60,0.2)] ring-2 ring-orange-400/40"
                      : ""
              }`}
              style={{ transition: "all 0.7s cubic-bezier(0.4, 0, 0.2, 1)" }}
            >
              <div className="p-3 sm:p-5 flex flex-col sm:flex-row gap-3 sm:gap-5">
                {rank && (
                  <div className="shrink-0 flex sm:flex-col items-center justify-center gap-1">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-black text-lg sm:text-xl ${RANK_STYLES[Math.min(rank - 1, 4)]}`}
                    >
                      {RANK_ICONS[Math.min(rank - 1, 4)] || `#${rank}`}
                    </div>
                  </div>
                )}

                <div className="shrink-0">
                  {s.logo_url ? (
                    <img
                      src={s.logo_url}
                      alt={s.company_name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-orange-400/20"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center text-orange-400 font-black text-xl sm:text-2xl border-2 border-orange-400/20">
                      {isPlaceholder ? "?" : s.company_name[0]}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-foreground">{s.company_name}</h4>
                    {s.pitch_title && <p className="text-xs sm:text-sm text-orange-400/80 italic">{s.pitch_title}</p>}
                  </div>
                  {(s.industry || s.location) && (
                    <div className="flex items-center gap-2 flex-wrap text-[10px] sm:text-xs text-muted-foreground">
                      {s.industry && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400/80 border border-red-400/20 font-semibold">
                          {s.industry}
                        </span>
                      )}
                      {s.location && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" /> {s.location}
                        </span>
                      )}
                    </div>
                  )}
                  {s.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-none">
                      {s.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    {s.pitch_deck_url && (
                      <a
                        href={s.pitch_deck_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs sm:text-sm text-orange-400 hover:text-orange-300 transition-colors font-semibold"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Pitch Deck
                      </a>
                    )}
                    {s.website && (
                      <a
                        href={s.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-orange-400 transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" /> Website
                      </a>
                    )}
                    {totalRaised > 0 && (
                      <span className="text-xs text-green-400/80 font-semibold flex items-center gap-0.5">
                        <DollarSign className="w-3.5 h-3.5" /> ${(totalRaised / 100).toLocaleString()} raised
                      </span>
                    )}
                  </div>
                </div>

                {!isPlaceholder && (
                  <div className="shrink-0 flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-2 sm:min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <button
                        disabled={!nameSubmitted || !!votedFor}
                        onClick={() => vote(s.id)}
                        className={`transition-all duration-300 ${
                          !nameSubmitted || !!votedFor
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:scale-125 cursor-pointer hover:drop-shadow-[0_0_15px_rgba(251,146,60,0.8)]"
                        } ${isPulsing ? "animate-bounce" : ""}`}
                      >
                        <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />
                      </button>
                      <button
                        onClick={() => setSupportStartup(s)}
                        className="transition-all duration-300 hover:scale-125 cursor-pointer hover:drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]"
                        title={`Support ${s.company_name}`}
                      >
                        <DollarSign className="w-7 h-7 sm:w-8 sm:h-8 text-green-500" />
                      </button>
                    </div>
                    <div className="text-center">
                      <p className="text-orange-400 font-black text-xl sm:text-2xl">{votes}</p>
                      <p className="text-muted-foreground text-[10px] font-futuristic tracking-wider">VOTES</p>
                    </div>
                    {isVotedFor && (
                      <div className="text-center">
                        <span className="text-red-400 text-[10px] sm:text-xs font-bold font-futuristic">YOUR PICK</span>
                        {voteCode && <p className="text-orange-400/60 text-[8px] font-mono">{voteCode}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isPlaceholder && votes > 0 && (
                <div className="px-3 sm:px-5 pb-3">
                  <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 transition-all duration-1000 shadow-[0_0_10px_rgba(251,146,60,0.5)]"
                      style={{ width: `${(votes / maxVotes) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {supportStartup && <HotDealsSupportModal startup={supportStartup} onClose={() => setSupportStartup(null)} />}
    </div>
  );
};

export default HotDealsVoting;
