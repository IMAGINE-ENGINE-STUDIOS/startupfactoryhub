import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Send, X, Loader2, ChevronDown, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface GeniusAIBubbleProps {
  onInsertText: (html: string) => void;
  isDarkMode: boolean;
  triggerPosition: { x: number; y: number } | null;
  onDismiss: () => void;
}

type Phase = "idle" | "greeting" | "input" | "conversation" | "loading" | "done";

interface Preset {
  id: string;
  name: string;
  icon: string;
  systemInstruction: string;
  isCustom?: boolean;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

const GREETINGS = [
  "How can I help you?",
  "What shall we write today?",
  "Need a hand with something?",
  "Ready when you are ✨",
  "Got an idea? Let's go!",
  "What's on your mind?",
  "Let's create something great!",
  "I'm here if you need me!",
  "Want me to draft something?",
  "Shall I write or edit?",
  "Let's get creative!",
  "What would you like to work on?",
  "I can help with that!",
  "Tell me what you need 📝",
  "Let's make it happen!",
];

const DEFAULT_PRESETS: Preset[] = [
  {
    id: "research",
    name: "Research Paper",
    icon: "🔬",
    systemInstruction: "Write a formal academic research paper with Abstract, Introduction, Literature Review, Methodology, Results, Discussion, and Conclusion sections. Use formal academic tone, cite sources where relevant, and follow APA/IEEE style. Include proper headings and subheadings.",
  },
  {
    id: "executive-summary",
    name: "Executive Summary",
    icon: "📊",
    systemInstruction: "Write a concise, high-impact executive summary. Start with the key finding or recommendation, then provide context, analysis highlights, and clear next steps. Use bullet points for key metrics. Keep it under 2 pages. Professional business tone.",
  },
  {
    id: "pitch",
    name: "Pitch Deck Script",
    icon: "🎯",
    systemInstruction: "Write a compelling startup pitch narrative covering: Problem, Solution, Market Size, Business Model, Traction, Team, and Ask. Use persuasive language, include data points, and structure for a 10-minute presentation. Make it investor-ready.",
  },
  {
    id: "business-plan",
    name: "Business Plan",
    icon: "💼",
    systemInstruction: "Write a comprehensive business plan with: Executive Summary, Company Description, Market Analysis, Organization & Management, Product/Service Line, Marketing & Sales Strategy, Financial Projections, and Funding Requirements. Professional and detailed.",
  },
  {
    id: "book",
    name: "Book / Chapter",
    icon: "📖",
    systemInstruction: "Write a book chapter or complete book section. Use engaging narrative style, proper chapter structure with sections, vivid descriptions, and compelling storytelling. Include chapter title, opening hook, body sections, and closing that leads to the next chapter.",
  },
  {
    id: "novel",
    name: "Novel / Fiction",
    icon: "✍️",
    systemInstruction: "Write creative fiction with rich character development, vivid scene descriptions, natural dialogue, and compelling plot progression. Use literary techniques like foreshadowing, metaphor, and varied sentence structure. Show don't tell.",
  },
  {
    id: "movie-script",
    name: "Movie Script",
    icon: "🎬",
    systemInstruction: "Write in proper screenplay format with scene headings (INT./EXT.), action lines, character names in caps before dialogue, parentheticals for delivery notes, and transitions. Follow industry-standard formatting.",
  },
  {
    id: "legal",
    name: "Legal Document",
    icon: "⚖️",
    systemInstruction: "Write a formal legal document with proper legal terminology, numbered clauses, definitions section, and standard legal formatting. Use precise language. Include relevant disclaimers and standard provisions.",
  },
  {
    id: "blog",
    name: "Blog / Article",
    icon: "📝",
    systemInstruction: "Write an engaging blog post or article with a compelling headline, hook introduction, well-structured body with subheadings, practical examples, and a strong conclusion with call-to-action. SEO-friendly and reader-focused.",
  },
  {
    id: "report",
    name: "Technical Report",
    icon: "📋",
    systemInstruction: "Write a detailed technical report with: Title Page info, Table of Contents outline, Introduction, Technical Analysis, Findings, Recommendations, and Appendices notes. Use precise technical language, include data tables and figures descriptions.",
  },
  {
    id: "letter",
    name: "Formal Letter",
    icon: "✉️",
    systemInstruction: "Write a formal letter with proper letterhead placement, date, recipient address, salutation, body paragraphs, closing, and signature block. Maintain professional tone appropriate to the context.",
  },
  {
    id: "free",
    name: "Free Writing",
    icon: "🌟",
    systemInstruction: "Write freely based on the user's request. Adapt tone, style, and format to match what they need. Be creative and thorough.",
  },
];

const CUSTOM_PRESETS_KEY = "lightpaper-genius-custom-presets";

const getRandomGreeting = () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

function loadCustomPresets(): Preset[] {
  try {
    const stored = localStorage.getItem(CUSTOM_PRESETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveCustomPresets(presets: Preset[]) {
  localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
}

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
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [showNewPreset, setShowNewPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetInstruction, setNewPresetInstruction] = useState("");
  const [customPresets, setCustomPresets] = useState<Preset[]>(loadCustomPresets);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const greetingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const allPresets = [...DEFAULT_PRESETS, ...customPresets];

  useEffect(() => {
    if (!triggerPosition) {
      setPhase("idle");
      setOpacity(0);
      setDisplayedGreeting("");
      setInput("");
      setConversation([]);
      setSelectedPreset(null);
      setShowPresets(false);
      setShowNewPreset(false);
      return;
    }

    const greeting = getRandomGreeting();
    setPhase("greeting");
    setOpacity(1);
    setDisplayedGreeting("");

    let i = 0;
    const type = () => {
      if (i < greeting.length) {
        setDisplayedGreeting(greeting.slice(0, i + 1));
        i++;
        greetingTimerRef.current = setTimeout(type, 50 + Math.random() * 30);
      } else {
        fadeTimerRef.current = setTimeout(() => {
          setPhase((prev) => {
            if (prev === "greeting") {
              setOpacity(0);
              setTimeout(onDismiss, 2000);
              return "idle";
            }
            return prev;
          });
        }, 8000);
      }
    };
    greetingTimerRef.current = setTimeout(type, 300);

    return () => {
      if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [triggerPosition, onDismiss]);

  // Auto-scroll conversation
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversation]);

  const handleBubbleClick = useCallback(() => {
    if (phase === "greeting") {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      setPhase("input");
      setOpacity(1);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [phase]);

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    // Determine if AI needs to clarify or should write directly
    const isDocumentRequest = selectedPreset || text.length > 30;
    const hasPreset = !!selectedPreset;

    // Add user message to conversation
    const userMsg: ConversationMessage = { role: "user", content: text };
    const newConversation = [...conversation, userMsg];
    setConversation(newConversation);
    setInput("");

    // Build messages for the AI
    const systemContent = buildSystemPrompt(hasPreset, selectedPreset);
    const messages = [
      ...newConversation.map(m => ({ role: m.role, content: m.content })),
    ];

    setPhase("loading");
    setIsStreaming(true);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lightpaper-genius`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages,
            systemOverride: systemContent,
            preset: selectedPreset?.id,
          }),
        }
      );

      if (resp.status === 429) {
        toast.error("Rate limit exceeded. Please wait a moment.");
        setPhase("conversation");
        setIsStreaming(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("AI credits exhausted.");
        setPhase("conversation");
        setIsStreaming(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullText = "";
      let streamDone = false;

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
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) fullText += content;
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
            if (content) fullText += content;
          } catch {}
        }
      }

      // Check if AI is asking clarifying questions (not writing document yet)
      const isQuestion = detectClarification(fullText);

      if (isQuestion) {
        // AI is asking questions — keep in conversation mode
        setConversation(prev => [...prev, { role: "assistant", content: fullText }]);
        setPhase("conversation");
      } else {
        // AI wrote a document — insert into canvas
        const html = markdownToHtml(fullText);
        onInsertText(html);
        toast.success("Document written by Genius AI");
        setConversation(prev => [...prev, { role: "assistant", content: "✅ Document written to canvas." }]);
        setPhase("done");
        setOpacity(0);
        setTimeout(onDismiss, 800);
      }
    } catch (err) {
      console.error("Genius AI Bubble error:", err);
      toast.error("Failed to get AI response.");
      setPhase("conversation");
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

  const handleSaveCustomPreset = () => {
    if (!newPresetName.trim() || !newPresetInstruction.trim()) {
      toast.error("Name and instructions are required");
      return;
    }
    const preset: Preset = {
      id: `custom_${Date.now()}`,
      name: newPresetName.trim(),
      icon: "📌",
      systemInstruction: newPresetInstruction.trim(),
      isCustom: true,
    };
    const updated = [...customPresets, preset];
    setCustomPresets(updated);
    saveCustomPresets(updated);
    setNewPresetName("");
    setNewPresetInstruction("");
    setShowNewPreset(false);
    setSelectedPreset(preset);
    toast.success(`Preset "${preset.name}" saved`);
  };

  const handleDeleteCustomPreset = (id: string) => {
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    saveCustomPresets(updated);
    if (selectedPreset?.id === id) setSelectedPreset(null);
    toast.success("Preset deleted");
  };

  if (!triggerPosition || phase === "idle") return null;

  const fg = isDarkMode ? "text-white" : "text-gray-900";
  const bg = isDarkMode ? "bg-black/70" : "bg-white/70";
  const border = isDarkMode ? "border-emerald-400/40" : "border-emerald-500/30";

  return (
    <div
      className="z-[100] no-print"
      style={{
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

      {/* Input / Conversation mode */}
      {(phase === "input" || phase === "loading" || phase === "conversation") && (
        <div
          className={`${bg} backdrop-blur-xl ${border} border rounded-2xl shadow-2xl shadow-emerald-500/10`}
          style={{
            animation: "geniusFadeIn 0.4s ease-out",
            width: "400px",
            maxWidth: "90vw",
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <span className={`text-xs font-semibold ${fg} opacity-70`}>Genius AI</span>
            </div>
            <button onClick={handleClose} className={`${fg} opacity-50 hover:opacity-100 transition-opacity`}>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Preset selector */}
          <div className="px-4 pt-1 pb-2">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs ${isDarkMode ? "bg-white/10 hover:bg-white/15" : "bg-black/5 hover:bg-black/10"} transition-colors ${fg}`}
            >
              <span>{selectedPreset ? `${selectedPreset.icon} ${selectedPreset.name}` : "📄 Select document type..."}</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showPresets ? "rotate-180" : ""}`} />
            </button>
            
            {showPresets && (
              <div className={`mt-1 rounded-lg ${isDarkMode ? "bg-black/80" : "bg-white/95"} border ${border} max-h-[200px] overflow-auto`}>
                {allPresets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => { setSelectedPreset(preset); setShowPresets(false); }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs ${fg} hover:bg-emerald-500/10 transition-colors ${selectedPreset?.id === preset.id ? "bg-emerald-500/20" : ""}`}
                  >
                    <span>{preset.icon} {preset.name}</span>
                    {preset.isCustom && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCustomPreset(preset.id); }}
                        className="opacity-40 hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </button>
                ))}
                <button
                  onClick={() => { setShowNewPreset(true); setShowPresets(false); }}
                  className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-xs ${fg} hover:bg-emerald-500/10 transition-colors border-t ${border}`}
                >
                  <Plus className="h-3 w-3" /> Create custom preset
                </button>
              </div>
            )}

            {/* New preset form */}
            {showNewPreset && (
              <div className={`mt-2 p-3 rounded-lg ${isDarkMode ? "bg-black/60" : "bg-white/90"} border ${border} space-y-2`}>
                <input
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Preset name..."
                  className={`w-full bg-transparent ${fg} text-xs outline-none border-b ${border} pb-1`}
                />
                <textarea
                  value={newPresetInstruction}
                  onChange={(e) => setNewPresetInstruction(e.target.value)}
                  placeholder="Instructions for the AI (tone, format, structure...)"
                  className={`w-full bg-transparent ${fg} text-xs outline-none resize-none`}
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNewPreset(false)}
                    className={`text-[10px] ${fg} opacity-50 hover:opacity-100`}
                  >Cancel</button>
                  <button
                    onClick={handleSaveCustomPreset}
                    className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1"
                  >
                    <Save className="h-3 w-3" /> Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Conversation history */}
          {conversation.length > 0 && (
            <div
              ref={conversationRef}
              className="px-4 max-h-[200px] overflow-auto space-y-2 mb-2"
            >
              {conversation.map((msg, i) => (
                <div key={i} className={`text-xs ${fg} ${msg.role === "assistant" ? "opacity-80 pl-2 border-l-2 border-emerald-500/40" : "opacity-60"}`}>
                  <span className="font-semibold">{msg.role === "user" ? "You" : "Genius"}:</span>{" "}
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                </div>
              ))}
              {phase === "loading" && (
                <div className={`text-xs ${fg} opacity-60 flex items-center gap-1`}>
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                </div>
              )}
            </div>
          )}

          {/* Input area */}
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
              placeholder={
                selectedPreset
                  ? `Describe your ${selectedPreset.name.toLowerCase()}...`
                  : "Ask a question or describe what to write..."
              }
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

/** Build system prompt based on preset and conversation state */
function buildSystemPrompt(hasPreset: boolean, preset: Preset | null): string {
  const base = `You are **Genius AI**, a powerful writing assistant built into the LightPaper workspace.

IMPORTANT RULES:
1. If the user's request is vague or unclear, ASK CLARIFYING QUESTIONS before writing. For example, ask about target audience, desired length, specific topics, key points to cover, etc.
2. When you ask questions, keep them concise and numbered.
3. When the user confirms they're ready (e.g., "go ahead", "write it", "proceed", "yes", "looks good"), THEN write the full document.
4. When writing the final document, use well-formatted Markdown with headings, bullet points, and emphasis.
5. Write complete, professional, ready-to-use content.
6. If the user asks a general question (not a document request), answer it conversationally.`;

  if (hasPreset && preset) {
    return `${base}\n\nDOCUMENT PRESET: ${preset.name}\n${preset.systemInstruction}`;
  }

  return base;
}

/** Detect if AI response is asking clarifying questions vs writing a document */
function detectClarification(text: string): boolean {
  // Short responses are likely questions/conversation
  if (text.length < 500) {
    const questionIndicators = ["?", "would you like", "could you", "can you tell", "what kind", "how long", "who is", "shall i", "do you want", "let me know", "please provide", "before i", "before writing"];
    const lowerText = text.toLowerCase();
    const hasQuestions = questionIndicators.some(q => lowerText.includes(q));
    // If it has question marks and is short, it's likely clarification
    if (hasQuestions && (text.match(/\?/g) || []).length >= 1) return true;
  }
  // Long responses with headers are likely documents
  if (text.length > 800 && (text.includes("# ") || text.includes("## "))) return false;
  return false;
}

/** Simple markdown → HTML converter for AI output */
function markdownToHtml(md: string): string {
  let html = md
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^[\-\*] (.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/^---$/gm, "<hr/>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");

  html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);

  if (!html.startsWith("<h") && !html.startsWith("<ul") && !html.startsWith("<ol") && !html.startsWith("<hr")) {
    html = `<p>${html}</p>`;
  }

  return html;
}
