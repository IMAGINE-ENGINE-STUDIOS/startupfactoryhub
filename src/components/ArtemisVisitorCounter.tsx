import { useEffect, useState, useRef } from "react";
import { Users, Eye, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "artemis-visitor-session";

const getSessionId = () => {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

const ArtemisVisitorCounter = () => {
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [liveVisitors, setLiveVisitors] = useState(0);
  const [todayVisitors, setTodayVisitors] = useState(0);
  const registered = useRef(false);

  useEffect(() => {
    const sessionId = getSessionId();

    const register = async () => {
      if (registered.current) return;
      registered.current = true;

      // Upsert this session
      const { data: existing } = await supabase
        .from("artemis_visitor_log")
        .select("id")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("artemis_visitor_log")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("session_id", sessionId);
      } else {
        await supabase
          .from("artemis_visitor_log")
          .insert({ session_id: sessionId });
      }
    };

    const fetchCounts = async () => {
      // Total unique visitors
      const { count: total } = await supabase
        .from("artemis_visitor_log")
        .select("*", { count: "exact", head: true });

      // Live = last_seen_at within last 2 minutes
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { count: live } = await supabase
        .from("artemis_visitor_log")
        .select("*", { count: "exact", head: true })
        .gte("last_seen_at", twoMinAgo);

      // Today's visitors
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: today } = await supabase
        .from("artemis_visitor_log")
        .select("*", { count: "exact", head: true })
        .gte("entered_at", todayStart.toISOString());

      setTotalVisitors(total || 0);
      setLiveVisitors(live || 0);
      setTodayVisitors(today || 0);
    };

    register().then(fetchCounts);

    // Heartbeat every 30s
    const heartbeat = setInterval(async () => {
      await supabase
        .from("artemis_visitor_log")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("session_id", sessionId);
      fetchCounts();
    }, 30000);

    return () => clearInterval(heartbeat);
  }, []);

  return (
    <div className="tech-card rounded-2xl p-4">
      <span className="text-primary text-xs font-futuristic font-bold tracking-wider block mb-3">
        MISSION ATTENDANCE
      </span>
      <div className="grid grid-cols-3 gap-3">
        {/* Total Visitors */}
        <div className="glass-morphism rounded-xl p-3 text-center">
          <Users className="w-5 h-5 text-primary mx-auto mb-1.5" />
          <span className="text-2xl font-bold text-foreground font-futuristic block">
            {totalVisitors.toLocaleString()}
          </span>
          <span className="text-muted-foreground text-[10px] font-mono tracking-wider">
            TOTAL
          </span>
        </div>

        {/* Today */}
        <div className="glass-morphism rounded-xl p-3 text-center">
          <CalendarDays className="w-5 h-5 text-primary mx-auto mb-1.5" />
          <span className="text-2xl font-bold text-foreground font-futuristic block">
            {todayVisitors.toLocaleString()}
          </span>
          <span className="text-muted-foreground text-[10px] font-mono tracking-wider">
            TODAY
          </span>
        </div>

        {/* Live Now */}
        <div className="glass-morphism rounded-xl p-3 text-center relative overflow-hidden">
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <Eye className="w-5 h-5 text-primary mx-auto mb-1.5" />
          <span className="text-2xl font-bold text-foreground font-futuristic block">
            {liveVisitors.toLocaleString()}
          </span>
          <span className="text-muted-foreground text-[10px] font-mono tracking-wider">
            LIVE
          </span>
        </div>
      </div>
    </div>
  );
};

export default ArtemisVisitorCounter;
