import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "website-visitor-session";

const getSessionId = () => {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

export const useWebsiteVisitorTracking = () => {
  const registered = useRef(false);

  useEffect(() => {
    const sessionId = getSessionId();

    const register = async () => {
      if (registered.current) return;
      registered.current = true;

      const { data: existing } = await (supabase as any)
        .from("website_visitor_log")
        .select("id")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (existing) {
        await (supabase as any)
          .from("website_visitor_log")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("session_id", sessionId);
      } else {
        await (supabase as any)
          .from("website_visitor_log")
          .insert({ session_id: sessionId });
      }
    };

    register();

    const heartbeat = setInterval(async () => {
      await (supabase as any)
        .from("website_visitor_log")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("session_id", sessionId);
    }, 30000);

    return () => clearInterval(heartbeat);
  }, []);
};
