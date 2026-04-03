import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SPEAKER_IDS = [
  "8bf0a780-fc90-4e93-9b97-62b9accf5d14",
  "726968e7-19d2-48da-8254-ab31ae336c16",
];

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
      <div className="bg-card/60 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm">🔥</span>
          <span className="text-orange-400 text-xs font-futuristic font-bold tracking-wider">
            EVENT SPEAKERS
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {speakers.map((speaker) => (
            <div
              key={speaker.id}
              className="glass-morphism rounded-xl p-4 border border-orange-400/20 flex items-center gap-4"
            >
              <Avatar className="h-14 w-14 border-2 border-orange-400/40">
                <AvatarImage src={speaker.avatar_url || undefined} />
                <AvatarFallback className="bg-orange-400/20 text-orange-400 font-bold text-lg">
                  {(speaker.full_name || "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-foreground font-semibold text-sm truncate">
                  {speaker.full_name || "Speaker"}
                </p>
                {speaker.email && (
                  <p className="text-orange-400/70 text-xs truncate">{speaker.email}</p>
                )}
                {speaker.bio && (
                  <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{speaker.bio}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
