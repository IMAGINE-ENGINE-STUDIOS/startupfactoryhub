import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MessageSquare, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

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

interface Speaker {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  bio: string | null;
}

export default function HotDealsSpeakers() {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSpeakers = async () => {
      try {
        const res = await supabase.functions.invoke("get-hot-deals-speakers");
        if (res.data?.speakers) {
          setSpeakers(res.data.speakers);
        }
      } catch (err) {
        console.error("Failed to load speakers:", err);
      }
    };
    fetchSpeakers();
  }, []);

  const handleContact = (speakerId: string) => {
    if (user) {
      navigate(`/messages?user=${speakerId}`);
    } else {
      navigate("/auth");
    }
  };

  if (speakers.length === 0) return null;

  return (
    <div className="racing-card rounded-2xl p-1">
      <div className="bg-card/60 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Mic className="w-4 h-4 text-orange-400" />
          <span className="text-orange-400 text-sm font-futuristic font-bold tracking-wider">
            RACE COMMENTATORS
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {speakers.map((speaker) => (
            <div
              key={speaker.id}
              className="rounded-xl p-3 flex flex-row items-center gap-3 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-transparent border border-orange-400/20 hover:border-orange-400/40 transition-all"
            >
              <Avatar className="h-14 w-14 border-2 border-orange-400/40 shrink-0 ring-2 ring-red-500/20">
                <AvatarImage src={speaker.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-red-500/20 to-orange-500/20 text-orange-400 font-bold text-xl">
                  {(speaker.full_name || "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 text-left flex-1">
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
              <Button
                onClick={() => handleContact(speaker.id)}
                size="sm"
                variant="ghost"
                className="shrink-0 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 border border-orange-400/20 text-[10px] gap-1 h-7 px-2"
              >
                {user ? (
                  <>
                    <MessageSquare className="w-3 h-3" />
                    Contact
                  </>
                ) : (
                  <>
                    <LogIn className="w-3 h-3" />
                    Sign in
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
