import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SPEAKERS_META: Record<string, { title: string; organization: string }> = {
  "8bf0a780-fc90-4e93-9b97-62b9accf5d14": {
    title: "Director of WIN (World Innovation Network)",
    organization: "NASA Technology Transfer Program Collaborator",
  },
  "726968e7-19d2-48da-8254-ab31ae336c16": {
    title: "Technology Transfer Specialist",
    organization: "NASA Technology Transfer Program",
  },
};

const SPEAKER_IDS = Object.keys(SPEAKERS_META);

interface Speaker {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  bio: string | null;
}

export default function HotDealsSpeakers() {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, email, bio")
      .in("id", SPEAKER_IDS)
      .then(({ data }) => {
        if (data) setSpeakers(data);
      });
  }, []);

  if (speakers.length === 0) return null;

  return (
    <div className="tech-card rounded-2xl p-1 border border-orange-400/10">
      <div className="bg-card/60 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-lg">🔥</span>
          <span className="text-orange-400 text-sm font-futuristic font-bold tracking-wider">
            EVENT SPEAKERS
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {speakers.map((speaker) => (
            <div
              key={speaker.id}
              className="glass-morphism rounded-xl p-3 border border-orange-400/20 flex flex-row items-center gap-3"
            >
              <Avatar className="h-14 w-14 border-2 border-orange-400/40 shrink-0">
                <AvatarImage src={speaker.avatar_url || undefined} />
                <AvatarFallback className="bg-orange-400/20 text-orange-400 font-bold text-xl">
                  {(speaker.full_name || "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 text-left">
                <p className="text-foreground font-bold text-sm truncate">
                  {speaker.full_name || "Speaker"}
                </p>
                {SPEAKERS_META[speaker.id] && (
                  <>
                    <p className="text-orange-400 text-[11px] font-semibold truncate">
                      {SPEAKERS_META[speaker.id].title}
                    </p>
                    <p className="text-muted-foreground text-[10px] truncate">
                      {SPEAKERS_META[speaker.id].organization}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
