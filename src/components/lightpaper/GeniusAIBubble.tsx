import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, Loader2, ChevronDown, Plus, Save, Trash2, BookOpen, CheckCircle2, Square, Play } from "lucide-react";
import { addLightPaperMessage } from "./MessageCenter";
import { addGeniusTask, updateGeniusTask } from "./GeniusTaskRegistry";
import geniusAILogo from "@/assets/imaginaly-logo.png";

type Phase = "idle" | "greeting" | "input" | "conversation" | "loading" | "outline-review" | "generating-chapters" | "stopped" | "done";

interface GeniusAIBubbleProps {
  onInsertText: (html: string) => void;
  onStreamingChunk?: (html: string) => void;
  isDarkMode: boolean;
  triggerPosition: { x: number; y: number } | null;
  onDismiss: () => void;
}

interface Preset {
  id: string;
  name: string;
  icon: string;
  systemInstruction: string;
  formatTemplate: string;
  isCustom?: boolean;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChapterOutline {
  title: string;
  summary: string;
  estimatedPages: number;
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
    systemInstruction: "Write a formal academic research paper. Use formal academic tone, cite sources where relevant (use placeholder citations like [Author, Year]), and follow APA style. Be thorough and comprehensive. Write EXTENSIVELY with deep analysis.",
    formatTemplate: `# [Title]\n\n## Abstract\n[200-300 word summary]\n\n## 1. Introduction\n### 1.1 Background\n### 1.2 Problem Statement\n### 1.3 Research Objectives\n### 1.4 Significance of the Study\n\n## 2. Literature Review\n### 2.1 Theoretical Framework\n### 2.2 Previous Studies\n### 2.3 Research Gap\n\n## 3. Methodology\n### 3.1 Research Design\n### 3.2 Data Collection\n### 3.3 Data Analysis Methods\n### 3.4 Limitations\n\n## 4. Results\n### 4.1 Key Findings\n### 4.2 Statistical Analysis\n### 4.3 Data Visualization Descriptions\n\n## 5. Discussion\n### 5.1 Interpretation of Results\n### 5.2 Comparison with Previous Studies\n### 5.3 Implications\n\n## 6. Conclusion\n### 6.1 Summary\n### 6.2 Recommendations\n### 6.3 Future Research\n\n## References\n[List references in APA format]\n\n## Appendices`,
  },
  {
    id: "executive-summary",
    name: "Executive Summary",
    icon: "📊",
    systemInstruction: "Write a concise, high-impact executive summary. Start with the key finding or recommendation, then provide context, analysis highlights, and clear next steps. Use bullet points for key metrics. Professional business tone. Include data-driven insights.",
    formatTemplate: `# Executive Summary: [Title]\n\n## Key Recommendation\n[Bold opening statement with the primary recommendation]\n\n## Situation Overview\n[Context and background - 2-3 paragraphs]\n\n## Key Findings\n- **Finding 1**: [Description with metric]\n- **Finding 2**: [Description with metric]\n- **Finding 3**: [Description with metric]\n\n## Analysis Highlights\n### Market/Financial Impact\n### Risk Assessment\n### Opportunity Assessment\n\n## Recommended Actions\n1. **Immediate (0-30 days)**: [Action items]\n2. **Short-term (1-3 months)**: [Action items]\n3. **Long-term (3-12 months)**: [Action items]\n\n## Resource Requirements\n| Resource | Estimated Cost | Timeline |\n|----------|---------------|----------|\n| [Item]   | [Cost]        | [Time]   |\n\n## Next Steps\n[Clear, actionable next steps with owners and deadlines]`,
  },
  {
    id: "pitch",
    name: "Pitch Deck Script",
    icon: "🎯",
    systemInstruction: "Write a compelling startup pitch narrative. Use persuasive language, include data points and market statistics, and structure for a 10-15 minute presentation. Make it investor-ready with strong hooks and clear value proposition. Write speaker notes for each slide.",
    formatTemplate: "",
  },
  {
    id: "business-plan",
    name: "Business Plan",
    icon: "💼",
    systemInstruction: "Write a comprehensive, investor-ready business plan. Be detailed with market analysis, financial projections, and operational strategy. Use professional business language. Include realistic data and projections. This should be a thorough 20-40 page document.",
    formatTemplate: "",
  },
  {
    id: "book",
    name: "Book / Chapter",
    icon: "📖",
    systemInstruction: "Write a book chapter or complete book. Use engaging narrative style, proper chapter structure with sections, vivid descriptions, and compelling storytelling. Include opening hook, body sections, and closing. Write EXTENSIVELY — each chapter should be 3000-5000 words minimum. For image references, describe where illustrations, diagrams, or photos should be placed using [IMAGE: description].",
    formatTemplate: "",
  },
  {
    id: "novel",
    name: "Novel / Fiction",
    icon: "✍️",
    systemInstruction: "Write creative fiction with rich character development, vivid scene descriptions, natural dialogue, and compelling plot progression. Use literary techniques like foreshadowing, metaphor, and varied sentence structure. Show don't tell. Write EXTENSIVELY — each chapter should be 4000-6000 words. Use [IMAGE: description] for scene illustrations.",
    formatTemplate: "",
  },
  {
    id: "movie-script",
    name: "Movie Script",
    icon: "🎬",
    systemInstruction: "Write in proper screenplay format with scene headings (INT./EXT.), action lines, character names in caps before dialogue, parentheticals for delivery notes, and transitions (CUT TO:, FADE IN:, etc.). Follow industry-standard formatting. Write complete scenes with rich action descriptions.",
    formatTemplate: "",
  },
  {
    id: "legal",
    name: "Legal Document",
    icon: "⚖️",
    systemInstruction: "Write a formal legal document with proper legal terminology, numbered clauses and sub-clauses, definitions section, recitals, and standard legal formatting. Use precise language. Include relevant disclaimers, standard provisions, governing law clauses, and signature blocks.",
    formatTemplate: "",
  },
  {
    id: "blog",
    name: "Blog / Article",
    icon: "📝",
    systemInstruction: "Write an engaging blog post or article with a compelling headline, hook introduction, well-structured body with subheadings, practical examples, statistics, quotes, and a strong conclusion with call-to-action. SEO-friendly and reader-focused. Write at least 2000 words.",
    formatTemplate: "",
  },
  {
    id: "report",
    name: "Technical Report",
    icon: "📋",
    systemInstruction: "Write a detailed technical report with precise technical language, data tables, findings, and actionable recommendations. Include figures descriptions and appendices notes. Be thorough and data-driven. Write at minimum 15-20 pages of content.",
    formatTemplate: "",
  },
  {
    id: "letter",
    name: "Formal Letter",
    icon: "✉️",
    systemInstruction: "Write a formal letter with proper letterhead placement, date, recipient address, salutation, body paragraphs, closing, and signature block. Maintain professional tone appropriate to the context.",
    formatTemplate: "",
  },
  {
    id: "free",
    name: "Free Writing",
    icon: "🌟",
    systemInstruction: "Write freely based on the user's request. Adapt tone, style, and format to match what they need. Be creative, thorough, and extensive. Write as much content as needed to fully address the topic.",
    formatTemplate: "",
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

/** Parse option buttons from AI response like "A) Option B) Option" or "1. Option 2. Option" */
function parseOptions(text: string): { label: string; value: string }[] | null {
  // Match patterns like A) ..., B) ..., C) ... 
  const abcMatches = text.match(/\b([A-D])\)\s*([^\n\r]+?)(?=\s+[A-D]\)|$)/gi);
  if (abcMatches && abcMatches.length >= 2) {
    return abcMatches.map(m => {
      const match = m.match(/([A-D])\)\s*(.+)/i);
      if (match) return { label: match[2].trim(), value: match[1] };
      return null;
    }).filter(Boolean) as { label: string; value: string }[];
  }

  // Match patterns like 1) ..., 2) ...
  const numMatches = text.match(/\b(\d)\)\s*([^\n\r]+?)(?=\s+\d\)|$)/g);
  if (numMatches && numMatches.length >= 2) {
    return numMatches.map(m => {
      const match = m.match(/(\d)\)\s*(.+)/);
      if (match) return { label: match[2].trim(), value: match[1] };
      return null;
    }).filter(Boolean) as { label: string; value: string }[];
  }

  return null;
}

export default function GeniusAIBubble({
  onInsertText,
  onStreamingChunk,
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
  const [newPresetFormat, setNewPresetFormat] = useState("");
  const [customPresets, setCustomPresets] = useState<Preset[]>(loadCustomPresets);
  const [chapterOutlines, setChapterOutlines] = useState<ChapterOutline[]>([]);
  const [generatingChapter, setGeneratingChapter] = useState(0);
  const [totalChapters, setTotalChapters] = useState(0);
  const [stoppedAtChapter, setStoppedAtChapter] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const greetingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const allPresets = [...DEFAULT_PRESETS, ...customPresets];

  // Reset on trigger change
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
      setChapterOutlines([]);
      setGeneratingChapter(0);
      setTotalChapters(0);
      setStoppedAtChapter(0);
      setCurrentTaskId(null);
      abortControllerRef.current?.abort();
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
    conversationRef.current?.scrollTo({ top: conversationRef.current.scrollHeight, behavior: "smooth" });
  }, [conversation]);

  const handleBubbleClick = useCallback(() => {
    if (phase === "greeting") {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      setPhase("input");
      setOpacity(1);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [phase]);

  /** Call the AI and return the full streamed text. Optionally streams tokens via onChunk callback. */
  const callAI = async (
    messages: { role: string; content: string }[],
    systemOverride: string,
    onChunk?: (token: string) => void
  ): Promise<string> => {
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lightpaper-genius`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages, systemOverride }),
      }
    );

    if (resp.status === 429) { addLightPaperMessage("error", "Rate limit exceeded. Please wait."); throw new Error("rate-limit"); }
    if (resp.status === 402) { addLightPaperMessage("error", "AI credits exhausted."); throw new Error("credits"); }
    if (!resp.ok || !resp.body) throw new Error("Stream failed");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let fullText = "";

    while (true) {
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
        if (jsonStr === "[DONE]") return fullText;
        try {
          const parsed = JSON.parse(jsonStr);
          const c = parsed.choices?.[0]?.delta?.content;
          if (c) {
            fullText += c;
            onChunk?.(c);
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Flush
    for (const raw of textBuffer.split("\n")) {
      if (!raw || raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const c = JSON.parse(jsonStr).choices?.[0]?.delta?.content;
        if (c) {
          fullText += c;
          onChunk?.(c);
        }
      } catch {}
    }

    return fullText;
  };

  /** Send option selection as user reply */
  const handleOptionClick = (value: string) => {
    setInput(value);
    setTimeout(() => {
      setInput("");
      const userMsg: ConversationMessage = { role: "user", content: value };
      setConversation(prev => [...prev, userMsg]);
      // Trigger submit logic inline
      submitWithMessage(value);
    }, 50);
  };

  const submitWithMessage = async (text: string) => {
    const userMsg: ConversationMessage = { role: "user", content: text };
    const newConversation = [...conversation, userMsg];

    setPhase("loading");
    setIsStreaming(true);

    try {
      const systemContent = buildSystemPrompt(selectedPreset);
      const messages = newConversation.map(m => ({ role: m.role, content: m.content }));
      const fullText = await callAI(messages, systemContent);
      const isQuestion = detectClarification(fullText);

      if (isQuestion) {
        setConversation(prev => [...prev, { role: "assistant", content: fullText }]);
        setPhase("conversation");
      } else {
        const outlines = tryParseOutline(fullText);
        if (outlines && outlines.length >= 10) {
          setChapterOutlines(outlines);
          setTotalChapters(outlines.length);
          setConversation(prev => [...prev, { role: "assistant", content: `I've prepared an outline with ${outlines.length} chapters/sections. Please review the summary below and approve to start writing.` }]);
          setPhase("outline-review");
        } else {
          // Direct insert with streaming
          const html = markdownToHtml(fullText);
          onInsertText(html);

          // Register task
          const taskId = `task_${Date.now()}`;
          const totalPages = Math.max(1, Math.ceil(fullText.length / 2000));
          addGeniusTask({
            id: taskId,
            title: text.slice(0, 60),
            preset: selectedPreset?.name || "Free Writing",
            status: "done",
            progress: { current: 1, total: 1 },
            targetPages: totalPages,
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            content: html,
          });

          // Notifications
          addLightPaperMessage("success", "📄 Document written by Genius AI");
          window.dispatchEvent(new CustomEvent("genius-document-ready", { detail: { title: text.slice(0, 60) } }));

          setPhase("done");
          setOpacity(0);
          setTimeout(onDismiss, 800);
        }
      }
    } catch (err: any) {
      if (err.message !== "rate-limit" && err.message !== "credits") {
        console.error("Genius AI error:", err);
        addLightPaperMessage("error", "Failed to get AI response.");
      }
      setPhase("conversation");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: ConversationMessage = { role: "user", content: text };
    const newConversation = [...conversation, userMsg];
    setConversation(newConversation);
    setInput("");

    // In stopped mode, send the message as context adjustment
    if (phase === "stopped") {
      setIsStreaming(true);
      try {
        const systemContent = buildSystemPrompt(selectedPreset) + "\n\nThe user has PAUSED document generation. They want to adjust the upcoming chapters. Acknowledge their request briefly and confirm the adjustment will apply when they resume.";
        const messages = newConversation.map(m => ({ role: m.role, content: m.content }));
        const fullText = await callAI(messages, systemContent);
        setConversation(prev => [...prev, { role: "assistant", content: fullText }]);
        setPhase("stopped");
      } catch (err: any) {
        if (err.message !== "rate-limit" && err.message !== "credits") {
          addLightPaperMessage("error", "Failed to get AI response.");
        }
      } finally {
        setIsStreaming(false);
      }
      return;
    }

    setPhase("loading");
    setIsStreaming(true);

    try {
      const systemContent = buildSystemPrompt(selectedPreset);
      const messages = newConversation.map(m => ({ role: m.role, content: m.content }));
      const fullText = await callAI(messages, systemContent);
      const isQuestion = detectClarification(fullText);

      if (isQuestion) {
        setConversation(prev => [...prev, { role: "assistant", content: fullText }]);
        setPhase("conversation");
      } else {
        const outlines = tryParseOutline(fullText);
        if (outlines && outlines.length >= 10) {
          setChapterOutlines(outlines);
          setTotalChapters(outlines.length);
          setConversation(prev => [...prev, { role: "assistant", content: `I've prepared an outline with ${outlines.length} chapters/sections. Please review the summary below and approve to start writing.` }]);
          setPhase("outline-review");
        } else {
          const html = markdownToHtml(fullText);
          onInsertText(html);

          const taskId = `task_${Date.now()}`;
          const totalPages = Math.max(1, Math.ceil(fullText.length / 2000));
          addGeniusTask({
            id: taskId,
            title: text.slice(0, 60),
            preset: selectedPreset?.name || "Free Writing",
            status: "done",
            progress: { current: 1, total: 1 },
            targetPages: totalPages,
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            content: html,
          });

          addLightPaperMessage("success", "📄 Document written by Genius AI");
          window.dispatchEvent(new CustomEvent("genius-document-ready", { detail: { title: text.slice(0, 60) } }));

          setPhase("done");
          setOpacity(0);
          setTimeout(onDismiss, 800);
        }
      }
    } catch (err: any) {
      if (err.message !== "rate-limit" && err.message !== "credits") {
        console.error("Genius AI error:", err);
        addLightPaperMessage("error", "Failed to get AI response.");
      }
      setPhase("conversation");
    } finally {
      setIsStreaming(false);
    }
  };

  /** Generate chapters one by one after outline approval */
  const generateChaptersFrom = async (startIndex: number) => {
    setPhase("generating-chapters");
    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const systemContent = buildSystemPrompt(selectedPreset);

    // Calculate total target pages
    const totalTargetPages = chapterOutlines.reduce((sum, ch) => sum + ch.estimatedPages, 0);

    // Create/update task registry
    const taskId = currentTaskId || `task_${Date.now()}`;
    if (!currentTaskId) {
      setCurrentTaskId(taskId);
      addGeniusTask({
        id: taskId,
        title: conversation.find(m => m.role === "user")?.content.slice(0, 60) || "Multi-chapter document",
        preset: selectedPreset?.name || "Free Writing",
        status: "in-progress",
        progress: { current: startIndex, total: chapterOutlines.length },
        targetPages: totalTargetPages,
        createdAt: new Date().toISOString(),
      });
    }

    let allContent = "";

    for (let i = startIndex; i < chapterOutlines.length; i++) {
      if (controller.signal.aborted) {
        setStoppedAtChapter(i);
        setPhase("stopped");
        setIsStreaming(false);
        updateGeniusTask(taskId, { progress: { current: i, total: chapterOutlines.length } });
        addLightPaperMessage("info", `Stopped at chapter ${i}/${chapterOutlines.length}. You can resume or edit instructions.`);
        return;
      }

      setGeneratingChapter(i + 1);
      updateGeniusTask(taskId, { progress: { current: i + 1, total: chapterOutlines.length } });

      const chapter = chapterOutlines[i];

      try {
        const chapterPrompt = `Write Chapter ${i + 1}: "${chapter.title}" in full detail.

Summary to expand: ${chapter.summary}

IMPORTANT:
- Write at least 3000-5000 words for this chapter
- Use the format template provided
- Do NOT include [IMAGE: description] tags unless the user explicitly asked for images
- Be thorough, detailed, and professional
- This is chapter ${i + 1} of ${chapterOutlines.length}
- Do NOT include other chapters, only this one`;

        const messages = [
          ...conversation.map(m => ({ role: m.role, content: m.content })),
          { role: "user" as const, content: chapterPrompt },
        ];

        // Stream chunks to document in real-time
        let chapterMd = "";
        const chapterText = await callAI(messages, systemContent, (token) => {
          chapterMd += token;
          // Stream word-by-word to document
          if (onStreamingChunk) {
            // Convert just the token to simple HTML for real-time display
            const safeToken = token.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            onStreamingChunk(safeToken);
          }
        });
        
        if (controller.signal.aborted) {
          setStoppedAtChapter(i + 1);
          setPhase("stopped");
          setIsStreaming(false);
          updateGeniusTask(taskId, { progress: { current: i + 1, total: chapterOutlines.length } });
          addLightPaperMessage("info", `Stopped after chapter ${i + 1}. You can resume or edit instructions.`);
          return;
        }

        const chapterHtml = markdownToHtml(chapterText);
        allContent += chapterHtml;

        // Final insert for state consistency
        onInsertText(chapterHtml);
        addLightPaperMessage("success", `Chapter ${i + 1}/${chapterOutlines.length} written`);
      } catch (err: any) {
        if (err.name === 'AbortError' || controller.signal.aborted) {
          setStoppedAtChapter(i);
          setPhase("stopped");
          setIsStreaming(false);
          updateGeniusTask(taskId, { status: "in-progress", progress: { current: i, total: chapterOutlines.length } });
          addLightPaperMessage("info", `Stopped at chapter ${i + 1}. You can resume.`);
          return;
        }
        console.error(`Error generating chapter ${i + 1}:`, err);
        updateGeniusTask(taskId, { status: "failed" });
        addLightPaperMessage("error", `Failed on chapter ${i + 1}. Stopping.`);
        break;
      }
    }

    setPhase("done");
    setIsStreaming(false);
    abortControllerRef.current = null;

    // Finalize task
    updateGeniusTask(taskId, {
      status: "done",
      completedAt: new Date().toISOString(),
      progress: { current: chapterOutlines.length, total: chapterOutlines.length },
      content: allContent,
    });

    addLightPaperMessage("success", `✅ All ${chapterOutlines.length} chapters written!`);
    window.dispatchEvent(new CustomEvent("genius-document-ready", {
      detail: { title: conversation.find(m => m.role === "user")?.content.slice(0, 60) || "Document" }
    }));

    setOpacity(0);
    setTimeout(onDismiss, 1500);
  };

  const handleApproveOutline = async () => {
    await generateChaptersFrom(0);
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
  };

  const handleResume = () => {
    generateChaptersFrom(stoppedAtChapter);
  };

  const handleClose = () => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current);
    setOpacity(0);
    setTimeout(onDismiss, 400);
  };

  const handleSaveCustomPreset = () => {
    if (!newPresetName.trim() || !newPresetInstruction.trim()) {
      addLightPaperMessage("error", "Name and instructions are required");
      return;
    }
    const preset: Preset = {
      id: `custom_${Date.now()}`,
      name: newPresetName.trim(),
      icon: "📌",
      systemInstruction: newPresetInstruction.trim(),
      formatTemplate: newPresetFormat.trim(),
      isCustom: true,
    };
    const updated = [...customPresets, preset];
    setCustomPresets(updated);
    saveCustomPresets(updated);
    setNewPresetName("");
    setNewPresetInstruction("");
    setNewPresetFormat("");
    setShowNewPreset(false);
    setSelectedPreset(preset);
    addLightPaperMessage("success", `Preset "${preset.name}" saved`);
  };

  const handleDeleteCustomPreset = (id: string) => {
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    saveCustomPresets(updated);
    if (selectedPreset?.id === id) setSelectedPreset(null);
    addLightPaperMessage("success", "Preset deleted");
  };

  if (!triggerPosition || phase === "idle") return null;

  const fg = isDarkMode ? "text-white" : "text-gray-900";
  const bg = isDarkMode ? "bg-black/70" : "bg-white/70";
  const border = isDarkMode ? "border-emerald-400/40" : "border-emerald-500/30";

  /** Render a conversation message, with clickable option buttons for assistant questions */
  const renderMessage = (msg: ConversationMessage, i: number) => {
    if (msg.role === "assistant") {
      const options = parseOptions(msg.content);
      // Split content: question text vs options
      let questionText = msg.content;
      if (options) {
        // Remove the option patterns from displayed text
        questionText = msg.content
          .replace(/\b[A-D]\)\s*[^\n\r]+/gi, "")
          .replace(/\b\d\)\s*[^\n\r]+/g, "")
          .trim();
      }

      return (
        <div key={i} className="pl-2 border-l-2 border-emerald-500/40 space-y-2">
          <div className={`text-sm ${fg} opacity-90 leading-relaxed`}>
            <span className="font-semibold text-emerald-500 text-xs">Genius:</span>
            <p className="mt-1 whitespace-pre-wrap">{questionText}</p>
          </div>
          {options && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {options.map((opt, j) => (
                <button
                  key={j}
                  onClick={() => handleOptionClick(opt.value + ") " + opt.label)}
                  disabled={isStreaming}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 
                    ${isDarkMode
                      ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 border border-emerald-500/30"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    } hover:scale-[1.03] active:scale-95 disabled:opacity-40`}
                >
                  <span className="font-bold mr-1">{opt.value})</span> {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={i} className={`text-sm ${fg} opacity-60`}>
        <span className="font-semibold">You:</span> {msg.content}
      </div>
    );
  };

  // Calculate total target pages for progress display
  const totalTargetPages = chapterOutlines.reduce((sum, ch) => sum + ch.estimatedPages, 0);

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
            <img src={geniusAILogo} alt="Genius AI" className="h-7 w-7 rounded-full flex-shrink-0 object-cover" />
            <span className={`text-sm font-medium ${fg}`}>
              {displayedGreeting}
              <span className="inline-block w-[2px] h-4 bg-emerald-500 ml-0.5 align-middle" style={{ animation: "geniusBlink 0.8s step-end infinite" }} />
            </span>
          </div>
        </div>
      )}

      {/* Main interactive panel */}
      {(phase === "input" || phase === "loading" || phase === "conversation" || phase === "outline-review" || phase === "generating-chapters" || phase === "stopped") && (
        <div
          className={`${bg} backdrop-blur-xl ${border} border rounded-2xl shadow-2xl shadow-emerald-500/10`}
          style={{
            animation: "geniusFadeIn 0.4s ease-out",
            width: "420px",
            maxWidth: "92vw",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
            <div className="flex items-center gap-2">
              <img src={geniusAILogo} alt="Genius AI" className="h-6 w-6 rounded-full object-cover" />
              <span className={`text-xs font-semibold ${fg} opacity-70`}>Genius AI</span>
              {phase === "generating-chapters" && (
                <span className="text-[10px] text-emerald-500 font-mono">
                  Ch. {generatingChapter}/{totalChapters} • ~{totalTargetPages} pages
                </span>
              )}
            </div>
            <button onClick={handleClose} className={`${fg} opacity-50 hover:opacity-100 transition-opacity`}>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Preset selector */}
          <div className="px-4 pt-1 pb-2 flex-shrink-0">
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
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteCustomPreset(preset.id); }} className="opacity-40 hover:opacity-100">
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
                  placeholder="Preset name (e.g., Thesis, Proposal)..."
                  className={`w-full bg-transparent ${fg} text-xs outline-none border-b ${border} pb-1`}
                />
                <textarea
                  value={newPresetInstruction}
                  onChange={(e) => setNewPresetInstruction(e.target.value)}
                  placeholder="AI instructions (tone, style, rules, length requirements...)"
                  className={`w-full bg-transparent ${fg} text-xs outline-none resize-none`}
                  rows={3}
                />
                <textarea
                  value={newPresetFormat}
                  onChange={(e) => setNewPresetFormat(e.target.value)}
                  placeholder="Format template (optional — headings, sections structure in Markdown)..."
                  className={`w-full bg-transparent ${fg} text-[10px] outline-none resize-none font-mono`}
                  rows={4}
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowNewPreset(false)} className={`text-[10px] ${fg} opacity-50 hover:opacity-100`}>Cancel</button>
                  <button onClick={handleSaveCustomPreset} className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                    <Save className="h-3 w-3" /> Save Preset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Conversation history — with clickable option buttons */}
          {conversation.length > 0 && (
            <div ref={conversationRef} className="px-4 max-h-[220px] overflow-auto space-y-3 mb-2 flex-shrink-0">
              {conversation.map((msg, i) => renderMessage(msg, i))}
              {phase === "loading" && (
                <div className={`text-sm ${fg} opacity-60 flex items-center gap-1.5`}>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" /> Thinking...
                </div>
              )}
            </div>
          )}

          {/* Outline review panel */}
          {phase === "outline-review" && chapterOutlines.length > 0 && (
            <div className="px-4 mb-2 flex-1 overflow-auto">
              <div className={`rounded-lg p-3 ${isDarkMode ? "bg-white/5" : "bg-black/5"} space-y-2`}>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-emerald-500" />
                  <span className={`text-xs font-semibold ${fg}`}>
                    Chapter Outline ({chapterOutlines.length} chapters • ~{totalTargetPages} pages)
                  </span>
                </div>
                <div className="max-h-[250px] overflow-auto space-y-1.5">
                  {chapterOutlines.map((ch, i) => (
                    <div key={i} className={`text-[11px] ${fg} opacity-80 flex gap-2`}>
                      <span className="text-emerald-500 font-mono flex-shrink-0">{i + 1}.</span>
                      <div>
                        <span className="font-semibold">{ch.title}</span>
                        <span className="opacity-60 block">{ch.summary}</span>
                        <span className="text-[9px] text-emerald-500/70">~{ch.estimatedPages} pages</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2 border-t border-emerald-500/20">
                  <button
                    onClick={handleApproveOutline}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Write All Chapters
                  </button>
                  <button
                    onClick={() => { setPhase("conversation"); setChapterOutlines([]); }}
                    className={`px-3 py-2 rounded-lg text-xs ${fg} opacity-60 hover:opacity-100`}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chapter generation progress — ANIMATED */}
          {phase === "generating-chapters" && (
            <div className="px-4 mb-2">
              <div className={`rounded-xl p-4 ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-emerald-500 animate-spin" />
                    <span className={`text-sm font-semibold ${fg}`}>
                      Writing chapter {generatingChapter} of {totalChapters}
                    </span>
                  </div>
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-500/20 text-red-500 text-[10px] font-semibold hover:bg-red-500/30 transition-colors"
                  >
                    <Square className="h-3 w-3" /> Stop
                  </button>
                </div>

                {/* Animated shimmer progress bar */}
                <div className="w-full h-3 rounded-full overflow-hidden bg-emerald-500/10 mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                    style={{
                      width: `${(generatingChapter / totalChapters) * 100}%`,
                      background: "linear-gradient(90deg, #10b981, #06b6d4, #10b981)",
                      backgroundSize: "200% 100%",
                      animation: "shimmerGradient 2s linear infinite",
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                        animation: "shimmer 1.2s infinite",
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-[10px] text-muted-foreground mb-3">
                  <span>~{totalTargetPages} pages targeted</span>
                  <span>{Math.round((generatingChapter / totalChapters) * 100)}%</span>
                </div>

                <div className="space-y-1">
                  {chapterOutlines.map((ch, i) => (
                    <div key={i} className={`text-[11px] ${fg} flex items-center gap-1.5 ${i + 1 < generatingChapter ? "opacity-40" : i + 1 === generatingChapter ? "opacity-100" : "opacity-25"}`}>
                      {i + 1 < generatingChapter ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      ) : i + 1 === generatingChapter ? (
                        <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-current flex-shrink-0" />
                      )}
                      <span className={i + 1 === generatingChapter ? "font-medium" : ""}>{ch.title}</span>
                      <span className="text-[9px] text-muted-foreground ml-auto">~{ch.estimatedPages}p</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stopped state */}
          {phase === "stopped" && (
            <div className="px-4 mb-2">
              <div className={`rounded-lg p-3 ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${fg}`}>
                    ⏸ Paused at chapter {stoppedAtChapter}/{totalChapters}
                  </span>
                  <button
                    onClick={handleResume}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-500 text-[10px] font-semibold hover:bg-emerald-500/30 transition-colors"
                  >
                    <Play className="h-3 w-3" /> Resume
                  </button>
                </div>
                <div className="w-full h-2 rounded-full bg-emerald-500/20 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                    style={{ width: `${(stoppedAtChapter / totalChapters) * 100}%` }}
                  />
                </div>
                <div className="mt-2 space-y-0.5">
                  {chapterOutlines.map((ch, i) => (
                    <div key={i} className={`text-[10px] ${fg} flex items-center gap-1.5 ${i < stoppedAtChapter ? "opacity-40" : i === stoppedAtChapter ? "opacity-100 font-semibold" : "opacity-25"}`}>
                      {i < stoppedAtChapter ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      ) : i === stoppedAtChapter ? (
                        <Square className="h-3 w-3 text-yellow-500" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-current flex-shrink-0" />
                      )}
                      {ch.title}
                    </div>
                  ))}
                </div>
                <p className={`text-[10px] ${fg} opacity-50 mt-2`}>
                  💡 Use the input below to adjust upcoming chapters before resuming.
                </p>
              </div>
            </div>
          )}

          {/* Input area — hidden when last assistant message has selectable options */}
          {phase !== "outline-review" && phase !== "generating-chapters" && (() => {
            // Check if the last assistant message has clickable options — if so, hide text input
            const lastAssistant = [...conversation].reverse().find(m => m.role === "assistant");
            const hasOptions = lastAssistant ? !!parseOptions(lastAssistant.content) : false;
            const showTextInput = !hasOptions || phase === "stopped" || phase === "input";

            // If options are present and phase is conversation, only show a hint
            if (hasOptions && phase === "conversation") {
              return (
                <div className="px-4 pb-3 pt-1 flex-shrink-0">
                  <p className={`text-xs ${fg} opacity-40 text-center`}>
                    👆 Select an option above to continue
                  </p>
                </div>
              );
            }

            return (
              <div className="px-4 pb-3 pt-1 flex-shrink-0">
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
                    phase === "stopped"
                      ? "Adjust instructions for remaining chapters, then Resume..."
                      : selectedPreset
                      ? `Describe your ${selectedPreset.name.toLowerCase()}... (mention page count for long docs)`
                      : "Ask anything, or describe a document to write..."
                  }
                  disabled={phase === "loading"}
                  className={`w-full bg-transparent ${fg} text-sm placeholder:opacity-40 resize-none outline-none border-none`}
                  rows={3}
                  style={{ caretColor: "#10b981" }}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] ${fg} opacity-30`}>
                    {phase === "stopped" ? "⏸ Stopped — edit or resume" : selectedPreset ? `${selectedPreset.icon} ${selectedPreset.name}` : "Shift+Enter for new line"}
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
            );
          })()}
        </div>
      )}

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
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shimmerGradient {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

// ---- Helpers ----

function buildSystemPrompt(preset: Preset | null): string {
  const base = `You are **Genius AI**, a writing assistant in LightPaper.

CRITICAL RULES:
1. If the user's request is vague, ask 2-3 SHORT clarifying questions (one line each). ALWAYS use multiple-choice options (e.g., "A) Academic  B) Casual  C) Business"). NEVER ask open-ended or free-text questions — every question MUST have selectable A/B/C/D options. Keep questions under 15 words each.
2. NEVER write the document until the user explicitly says "go", "write it", "proceed", "yes", etc.
3. When the user confirms, write the FULL document immediately — do NOT ask more questions.
4. STRICT COMPLIANCE — Follow user instructions EXACTLY:
   - If user says "1 paragraph" → write EXACTLY 1 paragraph, no more, no less.
   - If user says "200 words" → write EXACTLY 200 words. Count them. Not 199, not 201.
   - If user says "3 pages" → write exactly 3 pages worth of content.
   - Word counts, paragraph counts, and page counts are HARD constraints. Never approximate.
5. WRITE EXTENSIVELY only when NO specific length is given:
   - Short docs: 2000-4000 words
   - Medium docs: 5000-10000 words
   - Long docs (books): First provide OUTLINE, then write chapters on approval
6. Use Markdown: # ## ### headings, **bold**, *italic*, tables, bullet points, ---
7. Do NOT include [IMAGE: description] tags or any image placeholders UNLESS the user explicitly asks for images.
8. For 10+ sections: Provide outline first as:
   OUTLINE:
   1. Chapter Title | Summary
   2. Chapter Title | Summary
9. Your questions appear in a chat bubble — keep them SHORT and conversational, not formal paragraphs.
10. You can also: summarize, translate, proofread, brainstorm, analyze — based on user request.
11. DOCUMENT FORMATTING — ALWAYS include these elements:
    - **Header**: Start EVERY document with the document title as H1, followed by the date and author/organization placeholder on a separate line (e.g., "*Date: January 15, 2026 | Author: [Your Name]*")
    - **Introduction**: Begin with a clear introduction paragraph stating the purpose and scope of the document
    - **Conclusion**: End EVERY document with a proper "## Conclusion" section that summarizes key points, provides final thoughts, and includes next steps or recommendations
    - **Professional closing**: Add appropriate closing elements based on document type (signature block, references list, appendices, acknowledgments, disclaimers, or contact information)
    - NEVER leave a document without a conclusive ending — every document must feel complete and professionally finished`;

  if (preset) {
    let prompt = `${base}\n\n## PRESET: ${preset.name}\n${preset.systemInstruction}`;
    if (preset.formatTemplate) {
      prompt += `\n\n## FORMAT:\n\`\`\`\n${preset.formatTemplate}\n\`\`\``;
    }
    return prompt;
  }

  return base;
}

function detectClarification(text: string): boolean {
  if (text.length > 2000) return false;
  if (text.includes("OUTLINE:")) return false;
  if (text.includes("# ") && text.length > 800) return false;
  
  const questionCount = (text.match(/\?/g) || []).length;
  if (questionCount >= 1 && text.length < 1000) return true;
  
  const indicators = ["?", "would you like", "could you", "can you tell", "what kind", "how long", "shall i", "do you want", "let me know", "please provide", "before i", "which", "what topic", "how many", "A)", "B)", "C)"];
  const lower = text.toLowerCase();
  if (indicators.some(q => lower.includes(q)) && questionCount >= 1) return true;
  
  return false;
}

function tryParseOutline(text: string): ChapterOutline[] | null {
  if (!text.includes("OUTLINE:")) return null;
  const outlineSection = text.split("OUTLINE:")[1]?.trim();
  if (!outlineSection) return null;

  const lines = outlineSection.split("\n").filter(l => l.trim());
  const chapters: ChapterOutline[] = [];

  for (const line of lines) {
    const match = line.match(/^\d+\.\s*(.+?)\s*\|\s*(.+)$/);
    if (match) {
      chapters.push({
        title: match[1].trim(),
        summary: match[2].trim(),
        estimatedPages: 3,
      });
    } else {
      const simpleMatch = line.match(/^\d+\.\s*(.+)$/);
      if (simpleMatch) {
        chapters.push({
          title: simpleMatch[1].trim(),
          summary: "",
          estimatedPages: 3,
        });
      }
    }
  }

  return chapters.length >= 3 ? chapters : null;
}

function markdownToHtml(md: string): string {
  let html = md
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[IMAGE:\s*(.+?)\]/g, '<div style="border:2px dashed #ccc;padding:20px;margin:16px 0;text-align:center;border-radius:8px;background:#f9f9f9;color:#666;font-style:italic;">📷 Image: $1</div>')
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split("|").filter(c => c.trim());
      if (cells.every(c => /^[\s\-:]+$/.test(c))) return "";
      const isHeader = cells.some(c => c.includes("---"));
      if (isHeader) return "";
      const tag = "td";
      return `<tr>${cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join("")}</tr>`;
    })
    .replace(/^[\-\*] (.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/^---$/gm, "<hr/>")
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #ccc;padding-left:12px;margin:12px 0;font-style:italic;color:#666;">$1</blockquote>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");

  html = html.replace(/(<tr>.*?<\/tr>)+/gs, (match) => `<table style="width:100%;border-collapse:collapse;margin:16px 0;" border="1" cellpadding="8">${match}</table>`);
  html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);

  if (!html.startsWith("<h") && !html.startsWith("<ul") && !html.startsWith("<ol") && !html.startsWith("<hr") && !html.startsWith("<table") && !html.startsWith("<div") && !html.startsWith("<blockquote")) {
    html = `<p>${html}</p>`;
  }

  return html;
}
