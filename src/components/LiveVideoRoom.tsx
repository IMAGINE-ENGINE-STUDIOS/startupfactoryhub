import { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface LiveVideoRoomProps {
  room?: string;
  onLeave?: () => void;
}

export default function LiveVideoRoom({ room = "main", onLeave }: LiveVideoRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setToken(null);
    supabase.functions
      .invoke("livekit-token", { body: { room } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.token) {
          setError(error?.message || "Could not get a room token.");
          return;
        }
        setToken(data.token);
        setServerUrl(data.url || data.serverUrl || import.meta.env.VITE_LIVEKIT_URL || null);
      })
      .catch((e) => !cancelled && setError(e?.message || "Could not get a room token."));
    return () => {
      cancelled = true;
    };
  }, [room, attempt]);

  if (error || (token && !serverUrl)) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 bg-background text-foreground">
        <VideoOff className="h-10 w-10 text-destructive" />
        <p className="text-sm text-muted-foreground">{error || "Video server address is missing."}</p>
        <Button onClick={() => setAttempt((a) => a + 1)}>Try again</Button>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-5 bg-background text-foreground">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <span className="absolute inset-2 rounded-full border border-primary/40" />
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold">Connecting to the room</p>
          <p className="text-xs text-muted-foreground">Securing your connection...</p>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      video
      audio
      data-lk-theme="default"
      onDisconnected={onLeave}
      style={{ height: "100%", minHeight: "100vh" }}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
