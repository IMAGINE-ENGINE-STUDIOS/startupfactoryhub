import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Winner {
  id: string;
  startup_id: string;
  announced_at: string;
  startup?: {
    company_name: string;
    logo_url: string | null;
    pitch_title: string | null;
  };
}

const HotDealsWinner = () => {
  const [winner, setWinner] = useState<Winner | null>(null);
  const [avgRating, setAvgRating] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    fetchWinner();
    const channel = supabase
      .channel("hot-deals-winner-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "hot_deals_winner" }, () => {
        fetchWinner();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchWinner = async () => {
    const { data } = await supabase
      .from("hot_deals_winner")
      .select("id, startup_id, announced_at")
      .order("announced_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const { data: startup } = await supabase
        .from("hot_deals_invited_startups")
        .select("company_name, logo_url, pitch_title")
        .eq("id", data.startup_id)
        .maybeSingle();

      const { data: votes } = await supabase
        .from("hot_deals_votes")
        .select("rating")
        .eq("startup_id", data.startup_id);

      if (votes && votes.length > 0) {
        setTotalVotes(votes.length);
        setAvgRating(votes.reduce((sum, v) => sum + v.rating, 0) / votes.length);
      }

      setWinner({ ...data, startup: startup || undefined });
    }
  };

  if (!winner) return null;

  return (
    <div className="racing-card rounded-2xl p-1 border-2 border-yellow-400/50 shadow-[0_0_40px_rgba(234,179,8,0.2)]">
      <div className="bg-gradient-to-br from-red-500/20 via-orange-500/15 to-yellow-500/20 rounded-xl p-6 text-center space-y-4 relative overflow-hidden">
        {/* Checkered flag overlay */}
        <div className="absolute top-0 right-0 w-24 h-24 opacity-10" style={{
          backgroundImage: `linear-gradient(45deg, hsl(0 0% 100%) 25%, transparent 25%), linear-gradient(-45deg, hsl(0 0% 100%) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(0 0% 100%) 75%), linear-gradient(-45deg, transparent 75%, hsl(0 0% 100%) 75%)`,
          backgroundSize: "12px 12px",
          backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
        }} />
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400/40 to-orange-500/40 flex items-center justify-center text-3xl border-2 border-yellow-400/60 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
            🏆
          </div>
        </div>
        <div>
          <p className="text-xs text-yellow-400 font-futuristic tracking-[0.3em] mb-2">🏁 RACE WINNER 🏁</p>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500">{winner.startup?.company_name}</h2>
          {winner.startup?.pitch_title && (
            <p className="text-sm text-orange-400/80 mt-1">{winner.startup.pitch_title}</p>
          )}
        </div>
        <div className="flex items-center justify-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Rating: <span className="text-yellow-400 font-bold">{avgRating.toFixed(1)}</span>
          </span>
          <span className="text-muted-foreground">
            {totalVotes} votes
          </span>
        </div>
      </div>
    </div>
  );
};

export default HotDealsWinner;
