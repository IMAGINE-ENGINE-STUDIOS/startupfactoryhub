import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Send, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GeniusAIBubbleProps {
  onInsertText: (html: string) => void;
  isDarkMode: boolean;
  /** x,y position (percentage of container) where user clicked */
  triggerPosition: { x: number; y: number } | null;
  onDismiss: () => void;
}

type Phase = "idle" | "greeting" | "input" | "loading" | "done";

const GREETING = "How can I help you?";

export default function GeniusAIBubble({
  onInsertText,
  isDarkMode,
  triggerPosition,
  onDismiss,
}: GeniusAIBubbleProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [displayedGreeting, setDisplayedGreeting] = useState("");
  const [opacity, setOpacity] = useState(0);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const greetingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // When trigger position changes (user clicked canvas), start greeting
  useEffect(() => {
    if (!triggerPosition) {
      setPhase("idle");
      setOpacity(0);
      setDisplayedGreeting("");
      setInput("");
      return;
    }

    // Reset and start greeting
    setPhase("greeting");
    setOpacity(1);
    setDisplayedGreeting("");

    // Typing animation for greeting
    let i = 0;
    const type = () => {
      if (i < GREETING.length) {
        setDisplayedGreeting(GREETING.slice(0, i + 1));
        i++;
        greetingTimerRef.current = setTimeout(type, 50 + Math.random() * 30);
      } else {
        // After greeting finishes, wait then start fading
        fadeTimerRef.current = setTimeout(() => {
          // Only fade out if still in greeting phase (user didn't click)
          setPhase((prev) => {
            if (prev === "greeting") {
              // Start slow fade
              setOpacity(0);
              setTimeout(onDismiss, 1500);
              return "idle";
            }
            return prev;
          });
        }, 4000);
      }
    };
    greetingTimerRef.current = setTimeout(type, 300);

    return () => {
      if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [triggerPosition, onDismiss]);

  const handleBubbleClick = useCallback(() => {
    if (phase === "greeting") {
      // Cancel fade timer, expand to input
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      setPhase("input");
      setOpacity(1);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [phase]);

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setPhase("loading");
    setIsStreaming(true);

    try {
      const messages = [
        {
          role: "user",
          content: text,
        },
      ];

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lightpaper-genius`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages }),
        }
      );

      if (resp.status === 429) {
        toast.error("Rate limit exceeded. Please wait a moment.");
        setPhase("input");
        setIsStreaming(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("AI credits exhausted.");
        setPhase("input");
        setIsStreaming(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullText = "";
      let streamDone = false;

      const processContent = (content: string) => {
        fullText += content;
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) processContent(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) processContent(content);
          } catch {}
        }
      }

      // Convert markdown to basic HTML and insert into document
      const html = markdownToHtml(fullText);
      onInsertText(html);
      toast.success("Document written by Genius AI");

      // Clean up bubble
      setPhase("done");
      setOpacity(0);
      setTimeout(onDismiss, 800);
    } catch (err) {
      console.error("Genius AI Bubble error:", err);
      toast.error("Failed to get AI response.");
      setPhase("input");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClose = () => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current);
    setOpacity(0);
    setTimeout(onDismiss, 400);
  };

  if (!triggerPosition || phase === "idle") return null;

  const fg = isDarkMode ? "text-white" : "text-gray-900";
  const bg = isDarkMode ? "bg-black/70" : "bg-white/70";
  const border = isDarkMode ? "border-emerald-400/40" : "border-emerald-500/30";

  return (
    <div
      className="absolute z-[100] no-print"
      style={{
        left: `${triggerPosition.x}%`,
        top: `${triggerPosition.y}%`,
        transform: "translate(-50%, -50%)",
        opacity,
        transition: "opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: opacity === 0 ? "none" : "auto",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Greeting bubble */}
      {phase === "greeting" && (
        <div
          className={`${bg} backdrop-blur-xl ${border} border rounded-2xl px-5 py-3 cursor-pointer shadow-lg shadow-emerald-500/10`}
          onClick={handleBubbleClick}
          style={{
            animation: "geniusWobble 2s ease-in-out infinite, geniusFadeIn 0.6s ease-out",
            minWidth: "180px",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className={`text-sm font-medium ${fg}`}>
              {displayedGreeting}
              <span className="inline-block w-[2px] h-4 bg-emerald-500 ml-0.5 align-middle" style={{ animation: "geniusBlink 0.8s step-end infinite" }} />
            </span>
          </div>
        </div>
      )}

      {/* Input mode */}
      {(phase === "input" || phase === "loading") && (
        <div
          className={`${bg} backdrop-blur-xl ${border} border rounded-2xl shadow-2xl shadow-emerald-500/10`}
          style={{
            animation: "geniusFadeIn 0.4s ease-out",
            width: "340px",
            maxWidth: "90vw",
          }}
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <span className={`text-xs font-semibold ${fg} opacity-70`}>Genius AI</span>
            </div>
            <button
              onClick={handleClose}
              className={`${fg} opacity-50 hover:opacity-100 transition-opacity`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 pb-3 pt-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Write a business plan, research paper, book chapter..."
              disabled={phase === "loading"}
              className={`w-full bg-transparent ${fg} text-sm placeholder:opacity-40 resize-none outline-none border-none`}
              rows={3}
              style={{ caretColor: "#10b981" }}
            />

            <div className="flex items-center justify-between mt-2">
              <span className={`text-[10px] ${fg} opacity-30`}>
                Shift+Enter for new line
              </span>
              <button
                onClick={handleSubmit}
                disabled={phase === "loading" || !input.trim()}
                className="h-8 w-8 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 flex items-center justify-center disabled:opacity-40 transition-all"
              >
                {phase === "loading" ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes geniusWobble {
          0%, 100% { transform: rotate(0deg) scale(1); }
          15% { transform: rotate(-2deg) scale(1.02); }
          30% { transform: rotate(1.5deg) scale(0.99); }
          45% { transform: rotate(-1deg) scale(1.01); }
          60% { transform: rotate(0.5deg) scale(1); }
        }
        @keyframes geniusFadeIn {
          from { opacity: 0; transform: scale(0.85) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes geniusBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/** Simple markdown → HTML converter for AI output */
function markdownToHtml(md: string): string {
  let html = md
    // Headers
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Unordered lists
    .replace(/^[\-\*] (.+)$/gm, "<li>$1</li>")
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // Horizontal rule
    .replace(/^---$/gm, "<hr/>")
    // Line breaks -> paragraphs
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");

  // Wrap loose <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);

  // Wrap in paragraph if not starting with a block element
  if (!html.startsWith("<h") && !html.startsWith("<ul") && !html.startsWith("<ol") && !html.startsWith("<hr")) {
    html = `<p>${html}</p>`;
  }

  return html;
}
