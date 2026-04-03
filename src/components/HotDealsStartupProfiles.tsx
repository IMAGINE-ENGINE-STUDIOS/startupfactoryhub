import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";

interface Startup {
  id: string;
  company_name: string;
  pitch_title: string | null;
  description: string | null;
  logo_url: string | null;
  pitch_deck_url: string | null;
}

const HotDealsStartupProfiles = () => {
  const [startups, setStartups] = useState<Startup[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("hot_deals_invited_startups")
        .select("id, company_name, pitch_title, description, logo_url, pitch_deck_url")
        .eq("confirmed", true)
        .order("invited_at", { ascending: true });
      if (data) setStartups(data);
    };
    fetch();
  }, []);

  if (startups.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-orange-400 font-futuristic tracking-wider">
        🚀 PARTICIPATING STARTUPS
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {startups.map((s) => (
          <div key={s.id} className="tech-card rounded-xl p-4 space-y-3 border border-orange-400/10 hover:border-orange-400/30 transition-colors">
            <div className="flex items-center gap-3">
              {s.logo_url ? (
                <img src={s.logo_url} alt={s.company_name} className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-lg">
                  {s.company_name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{s.company_name}</p>
                {s.pitch_title && (
                  <p className="text-xs text-orange-400/80 truncate">{s.pitch_title}</p>
                )}
              </div>
            </div>
            {s.description && (
              <p className="text-xs text-muted-foreground line-clamp-3">{s.description}</p>
            )}
            {s.pitch_deck_url && (
              <a
                href={s.pitch_deck_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                View Pitch Deck
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HotDealsStartupProfiles;
