import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send } from "lucide-react";

interface ChatMessage {
  id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

const HotDealsLiveChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [voterName, setVoterName] = useState(() => sessionStorage.getItem("hot_deals_voter") || "");
  const [registered, setRegistered] = useState(() => !!sessionStorage.getItem("hot_deals_voter"));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel("hot-deals-chat-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "hot_deals_chat" }, (payload) => {
        const incoming = payload.new as ChatMessage;
        setMessages((prev) => {
          // Deduplicate: replace temp message or skip if already exists
          const tempIdx = prev.findIndex((m) => m.id.startsWith("temp-") && m.sender_name === incoming.sender_name && m.message === incoming.message);
          if (tempIdx > -1) {
            const updated = [...prev];
            updated[tempIdx] = incoming;
            return updated;
          }
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev.slice(-99), incoming];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("hot_deals_chat")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100);
    if (data) setMessages(data);
  };

  const register = () => {
    if (!voterName.trim()) return;
    sessionStorage.setItem("hot_deals_voter", voterName.trim());
    setRegistered(true);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !registered) return;
    const msgText = newMessage.trim();
    const senderName = voterName.trim();
    // Optimistic update: show message instantly
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender_name: senderName,
      message: msgText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev.slice(-99), tempMsg]);
    setNewMessage("");
    await supabase.from("hot_deals_chat").insert({
      sender_name: senderName,
      message: msgText,
    });
  };

  return (
    <div className="racing-card rounded-2xl p-1">
      <div className="bg-card/60 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-orange-400" />
          <span className="text-orange-400 text-xs font-futuristic font-bold tracking-wider">PIT STOP CHAT</span>
          <span className="text-muted-foreground text-[10px] ml-auto">{messages.length} messages</span>
        </div>

        <div ref={scrollRef} className="h-[300px] overflow-y-auto space-y-2 mb-3 pr-1 scrollbar-thin">
          {messages.length === 0 && (
            <p className="text-muted-foreground text-xs text-center py-8">No messages yet. Be the first!</p>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-2 items-start">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500/30 to-orange-500/30 flex items-center justify-center text-orange-400 text-[10px] font-bold shrink-0 border border-orange-400/20">
                {msg.sender_name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-orange-400 text-[10px] font-semibold">{msg.sender_name}</span>
                <p className="text-foreground text-xs break-words">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>

        {!registered ? (
          <div className="flex gap-2">
            <Input
              placeholder="Your name to chat..."
              value={voterName}
              onChange={(e) => setVoterName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && register()}
              className="text-xs border-orange-400/30 focus-visible:ring-orange-400"
            />
            <Button onClick={register} size="sm" className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white text-xs font-bold">
              Join
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              maxLength={500}
              className="text-xs border-orange-400/30 focus-visible:ring-orange-400"
            />
            <Button onClick={sendMessage} size="sm" className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white text-xs font-bold">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotDealsLiveChat;