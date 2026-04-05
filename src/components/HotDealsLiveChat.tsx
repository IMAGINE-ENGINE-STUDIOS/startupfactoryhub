import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Smile, Rotate3D, X } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";

interface ChatMessage {
  id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

const SPACE_MODELS = [
  { key: "apollo", label: "Apollo Lunar Module" },
  { key: "astronaut", label: "NASA Astronaut" },
  { key: "perseverance", label: "Perseverance Rover" },
  { key: "webb", label: "James Webb Telescope" },
];

const ThreeDModelCard = ({ modelName }: { modelName: string }) => (
  <div className="flex items-center gap-2 rounded-lg border border-orange-400/30 bg-gradient-to-r from-red-500/10 to-orange-500/10 px-3 py-2 my-1">
    <Rotate3D className="w-4 h-4 text-orange-400 shrink-0" />
    <span className="text-orange-400 text-xs font-bold truncate">{modelName}</span>
    <a
      href="#3d-viewer"
      onClick={(e) => {
        e.preventDefault();
        document.getElementById("3d-viewer")?.scrollIntoView({ behavior: "smooth" });
      }}
      className="ml-auto text-[10px] text-orange-300 hover:text-orange-200 underline shrink-0"
    >
      View 3D
    </a>
  </div>
);

const HotDealsLiveChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [voterName, setVoterName] = useState(() => sessionStorage.getItem("hot_deals_voter") || "");
  const [registered, setRegistered] = useState(() => !!sessionStorage.getItem("hot_deals_voter"));
  const [showEmoji, setShowEmoji] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel("hot-deals-chat-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "hot_deals_chat" }, (payload) => {
        const incoming = payload.new as ChatMessage;
        setMessages((prev) => {
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

  const sendMessage = async (overrideMsg?: string) => {
    const msgText = (overrideMsg || newMessage).trim();
    if (!msgText || !registered) return;
    const senderName = voterName.trim();
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender_name: senderName,
      message: msgText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev.slice(-99), tempMsg]);
    if (!overrideMsg) setNewMessage("");
    await supabase.from("hot_deals_chat").insert({
      sender_name: senderName,
      message: msgText,
    });
  };

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const handleModelSelect = (model: typeof SPACE_MODELS[0]) => {
    setShowModels(false);
    sendMessage(`[3D:${model.label}]`);
  };

  const renderMessageContent = (msg: ChatMessage) => {
    const match = msg.message.match(/^\[3D:(.*?)\]$/);
    if (match) {
      return <ThreeDModelCard modelName={match[1]} />;
    }
    return <p className="text-foreground text-xs break-words">{msg.message}</p>;
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
                {renderMessageContent(msg)}
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
          <div className="relative">
            {showEmoji && (
              <div className="absolute bottom-12 left-0 z-50">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme={Theme.DARK}
                  width={280}
                  height={350}
                  searchDisabled
                  skinTonesDisabled
                  previewConfig={{ showPreview: false }}
                />
              </div>
            )}
            {showModels && (
              <div className="absolute bottom-12 left-8 z-50 bg-card border border-orange-400/30 rounded-lg p-2 shadow-lg min-w-[200px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-orange-400 text-[10px] font-bold">Share 3D Model</span>
                  <button onClick={() => setShowModels(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {SPACE_MODELS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => handleModelSelect(m)}
                    className="w-full text-left px-2 py-1.5 text-xs text-foreground hover:bg-orange-500/10 rounded flex items-center gap-2"
                  >
                    <Rotate3D className="w-3 h-3 text-orange-400" />
                    {m.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-1.5 items-center">
              <button
                onClick={() => { setShowEmoji(!showEmoji); setShowModels(false); }}
                className="p-1.5 rounded-md hover:bg-orange-500/10 text-orange-400 transition-colors"
                title="Emoji"
              >
                <Smile className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setShowModels(!showModels); setShowEmoji(false); }}
                className="p-1.5 rounded-md hover:bg-orange-500/10 text-orange-400 transition-colors"
                title="Share 3D Model"
              >
                <Rotate3D className="w-4 h-4" />
              </button>
              <Input
                ref={inputRef}
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                onFocus={() => { setShowEmoji(false); setShowModels(false); }}
                maxLength={500}
                className="flex-1 text-xs border-orange-400/30 focus-visible:ring-orange-400"
              />
              <Button onClick={() => sendMessage()} size="sm" className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white text-xs font-bold">
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotDealsLiveChat;
