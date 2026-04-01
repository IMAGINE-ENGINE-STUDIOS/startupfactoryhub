import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import artemisLogo from "@/assets/artemis-ii-logo.png";
import GuestPrompt from "@/components/GuestPrompt";

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

const ArtemisLiveChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch initial messages
  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("artemis_watch_party_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(50);

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((m) => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(
          (profiles || []).map((p) => [p.user_id, p])
        );

        setMessages(
          data.map((m) => ({
            ...m,
            profile: profileMap.get(m.user_id) || null,
          }))
        );
      }
    };

    fetchMessages();
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("artemis-chat-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "artemis_watch_party_messages",
        },
        async (payload) => {
          const msg = payload.new as any;
          // Fetch profile for new message
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, full_name, avatar_url")
            .eq("user_id", msg.user_id)
            .single();

          const newMsg: ChatMessage = {
            ...msg,
            profile: profile || null,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    await supabase.from("artemis_watch_party_messages").insert({
      user_id: user.id,
      content,
    });

    setSending(false);
  };

  if (!user) {
    return (
      <div className="tech-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <img src={artemisLogo} alt="Artemis II" className="h-6 w-auto object-contain" />
          <span className="text-primary text-xs font-futuristic font-bold tracking-wider">
            MISSION LIVE CHAT
          </span>
        </div>
        <GuestPrompt feature="Live Chat" description="Sign in to chat with other viewers during the Artemis II launch." />
      </div>
    );
  }

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="tech-card rounded-2xl p-1 hover:shadow-glow transition-shadow duration-500">
      <div className="bg-card/60 rounded-xl p-3 flex flex-col" style={{ height: "380px" }}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-2 shrink-0">
          <img src={artemisLogo} alt="Artemis II" className="h-6 w-auto object-contain" />
          <span className="text-primary text-xs font-futuristic font-bold tracking-wider">
            MISSION LIVE CHAT
          </span>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-muted-foreground text-[10px] font-mono">LIVE</span>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1 mb-2 scrollbar-thin">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground/50 text-xs font-mono text-center">
                No messages yet.<br />Be the first to say something! 🚀
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.user_id === user.id ? "flex-row-reverse" : ""}`}
            >
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={msg.profile?.avatar_url || ""} />
                <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                  {getInitials(msg.profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div
                className={`max-w-[75%] rounded-lg px-2.5 py-1.5 ${
                  msg.user_id === user.id
                    ? "bg-primary/20 border border-primary/30"
                    : "glass-morphism border border-border/30"
                }`}
              >
                <div className="flex items-baseline gap-1.5 mb-0.5">
                  <span className="text-[10px] font-semibold text-primary/80 truncate">
                    {msg.profile?.full_name || "Viewer"}
                  </span>
                  <span className="text-[9px] text-muted-foreground/50 font-mono shrink-0">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <p className="text-xs text-foreground/90 break-words">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2 shrink-0">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 h-8 text-xs bg-secondary/30 border-border/30"
            maxLength={500}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="glass-morphism border border-primary/30 text-primary hover:bg-primary/20 p-1.5 rounded-lg transition-all disabled:opacity-30"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtemisLiveChat;
