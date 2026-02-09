import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Send, X, Loader2, ChevronDown, Plus, Save, Trash2, BookOpen, CheckCircle2, Square, Play } from "lucide-react";
import { addLightPaperMessage } from "./MessageCenter";

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
    formatTemplate: `# [Title]

## Abstract
[200-300 word summary]

## 1. Introduction
### 1.1 Background
### 1.2 Problem Statement
### 1.3 Research Objectives
### 1.4 Significance of the Study

## 2. Literature Review
### 2.1 Theoretical Framework
### 2.2 Previous Studies
### 2.3 Research Gap

## 3. Methodology
### 3.1 Research Design
### 3.2 Data Collection
### 3.3 Data Analysis Methods
### 3.4 Limitations

## 4. Results
### 4.1 Key Findings
### 4.2 Statistical Analysis
### 4.3 Data Visualization Descriptions

## 5. Discussion
### 5.1 Interpretation of Results
### 5.2 Comparison with Previous Studies
### 5.3 Implications

## 6. Conclusion
### 6.1 Summary
### 6.2 Recommendations
### 6.3 Future Research

## References
[List references in APA format]

## Appendices`,
  },
  {
    id: "executive-summary",
    name: "Executive Summary",
    icon: "📊",
    systemInstruction: "Write a concise, high-impact executive summary. Start with the key finding or recommendation, then provide context, analysis highlights, and clear next steps. Use bullet points for key metrics. Professional business tone. Include data-driven insights.",
    formatTemplate: `# Executive Summary: [Title]

## Key Recommendation
[Bold opening statement with the primary recommendation]

## Situation Overview
[Context and background - 2-3 paragraphs]

## Key Findings
- **Finding 1**: [Description with metric]
- **Finding 2**: [Description with metric]
- **Finding 3**: [Description with metric]

## Analysis Highlights
### Market/Financial Impact
### Risk Assessment
### Opportunity Assessment

## Recommended Actions
1. **Immediate (0-30 days)**: [Action items]
2. **Short-term (1-3 months)**: [Action items]
3. **Long-term (3-12 months)**: [Action items]

## Resource Requirements
| Resource | Estimated Cost | Timeline |
|----------|---------------|----------|
| [Item]   | [Cost]        | [Time]   |

## Next Steps
[Clear, actionable next steps with owners and deadlines]`,
  },
  {
    id: "pitch",
    name: "Pitch Deck Script",
    icon: "🎯",
    systemInstruction: "Write a compelling startup pitch narrative. Use persuasive language, include data points and market statistics, and structure for a 10-15 minute presentation. Make it investor-ready with strong hooks and clear value proposition. Write speaker notes for each slide.",
    formatTemplate: `# [Company Name] - Pitch Deck

## Slide 1: Title
**[Company Name]** — [One-liner tagline]
*Speaker Notes: [Opening hook, personal story or shocking statistic]*

## Slide 2: The Problem
**[Problem Statement]**
- Pain point 1 with market data
- Pain point 2 with customer quote
- Current solutions and why they fail
*Speaker Notes: [Make the audience feel the pain]*

## Slide 3: The Solution
**[Product/Service Description]**
- Key feature 1 → Benefit
- Key feature 2 → Benefit
- Key feature 3 → Benefit
*[Include image reference: product screenshot or demo]*

## Slide 4: Market Size
- **TAM**: $[X]B — [Description]
- **SAM**: $[X]B — [Description]
- **SOM**: $[X]M — [Description]

## Slide 5: Business Model
**Revenue Streams:**
| Stream | Pricing | Target Customers |
|--------|---------|-----------------|

## Slide 6: Traction
- [Metric 1]: [Number] — [Growth %]
- [Metric 2]: [Number] — [Growth %]
- Key milestones achieved

## Slide 7: Competition
| Feature | Us | Competitor A | Competitor B |
|---------|-----|-------------|-------------|

## Slide 8: Team
- **[CEO]**: [Background]
- **[CTO]**: [Background]
- **[Key Hire]**: [Background]

## Slide 9: Financial Projections
| Year | Revenue | Users | Burn Rate |
|------|---------|-------|-----------|

## Slide 10: The Ask
**Raising: $[Amount]**
- [X]% → Product Development
- [X]% → Sales & Marketing
- [X]% → Operations
**Target milestones with this round**`,
  },
  {
    id: "business-plan",
    name: "Business Plan",
    icon: "💼",
    systemInstruction: "Write a comprehensive, investor-ready business plan. Be detailed with market analysis, financial projections, and operational strategy. Use professional business language. Include realistic data and projections. This should be a thorough 20-40 page document.",
    formatTemplate: `# Business Plan: [Company Name]

## Table of Contents

## 1. Executive Summary
### Company Overview
### Mission & Vision
### Products/Services
### Financial Highlights
### Funding Requirements

## 2. Company Description
### Legal Structure
### History & Background
### Location & Facilities
### Intellectual Property

## 3. Market Analysis
### Industry Overview
### Target Market Segmentation
### Market Size & Growth
### Market Trends
### Customer Personas

## 4. Competitive Analysis
### Direct Competitors
### Indirect Competitors
### Competitive Advantages
### SWOT Analysis

## 5. Organization & Management
### Organizational Structure
### Management Team
### Board of Directors/Advisors
### Hiring Plan

## 6. Products & Services
### Product/Service Description
### Development Roadmap
### Pricing Strategy
### Intellectual Property

## 7. Marketing & Sales Strategy
### Marketing Channels
### Sales Process
### Customer Acquisition Cost
### Retention Strategy

## 8. Operations Plan
### Production/Service Delivery
### Technology Infrastructure
### Supply Chain
### Quality Control

## 9. Financial Plan
### Revenue Model
### Financial Projections (3-5 years)
### Break-even Analysis
### Funding Requirements & Use of Funds
### Exit Strategy

## Appendices`,
  },
  {
    id: "book",
    name: "Book / Chapter",
    icon: "📖",
    systemInstruction: "Write a book chapter or complete book. Use engaging narrative style, proper chapter structure with sections, vivid descriptions, and compelling storytelling. Include opening hook, body sections, and closing. Write EXTENSIVELY — each chapter should be 3000-5000 words minimum. For image references, describe where illustrations, diagrams, or photos should be placed using [IMAGE: description].",
    formatTemplate: `# [Book Title]
## By [Author Name]

---

### Chapter [N]: [Chapter Title]

*[Opening epigraph or quote]*

[Opening hook paragraph — grab the reader immediately]

#### [Section 1 Title]
[Extended narrative content — 800-1500 words per section]
[IMAGE: Description of relevant illustration or photo]

#### [Section 2 Title]
[Extended narrative content]

#### [Section 3 Title]
[Extended narrative content]

---
*[Chapter closing — transition to next chapter]*`,
  },
  {
    id: "novel",
    name: "Novel / Fiction",
    icon: "✍️",
    systemInstruction: "Write creative fiction with rich character development, vivid scene descriptions, natural dialogue, and compelling plot progression. Use literary techniques like foreshadowing, metaphor, and varied sentence structure. Show don't tell. Write EXTENSIVELY — each chapter should be 4000-6000 words. Use [IMAGE: description] for scene illustrations.",
    formatTemplate: `# [Novel Title]
### [Genre] — By [Author]

---

## Part [N]: [Part Title]

### Chapter [N]: [Chapter Title]

[Atmospheric opening — set the scene with sensory details]

[Dialogue and character interaction]

[Action/tension building]

[Internal character reflection]

[Scene transition]

[Climactic moment or revelation]

[Chapter closing hook]

---`,
  },
  {
    id: "movie-script",
    name: "Movie Script",
    icon: "🎬",
    systemInstruction: "Write in proper screenplay format with scene headings (INT./EXT.), action lines, character names in caps before dialogue, parentheticals for delivery notes, and transitions (CUT TO:, FADE IN:, etc.). Follow industry-standard formatting. Write complete scenes with rich action descriptions.",
    formatTemplate: `FADE IN:

INT. [LOCATION] - [TIME OF DAY]

[Action description — what we see on screen]

                    CHARACTER NAME
              (parenthetical)
          Dialogue line here.

                    CHARACTER NAME 2
          Response dialogue.

[More action description]

                                          CUT TO:

EXT. [LOCATION] - [TIME OF DAY]

[Action description]

                    CHARACTER NAME
          Dialogue.

                                          FADE OUT.

THE END`,
  },
  {
    id: "legal",
    name: "Legal Document",
    icon: "⚖️",
    systemInstruction: "Write a formal legal document with proper legal terminology, numbered clauses and sub-clauses, definitions section, recitals, and standard legal formatting. Use precise language. Include relevant disclaimers, standard provisions, governing law clauses, and signature blocks.",
    formatTemplate: `# [DOCUMENT TYPE]

**Date:** [Date]
**Parties:** [Party A] and [Party B]

## RECITALS

WHEREAS, [background statement];
WHEREAS, [background statement];

NOW, THEREFORE, the parties agree as follows:

## ARTICLE I — DEFINITIONS

1.1 "[Term]" means [definition].
1.2 "[Term]" means [definition].

## ARTICLE II — [SUBJECT]

2.1 [Clause with sub-clauses]
  (a) [Sub-clause]
  (b) [Sub-clause]

## ARTICLE III — [SUBJECT]

## ARTICLE IV — REPRESENTATIONS AND WARRANTIES

## ARTICLE V — INDEMNIFICATION

## ARTICLE VI — TERM AND TERMINATION

## ARTICLE VII — GOVERNING LAW

## ARTICLE VIII — MISCELLANEOUS

**IN WITNESS WHEREOF**, the parties have executed this Agreement as of the date first written above.

___________________________
[Party A Name & Title]

___________________________
[Party B Name & Title]`,
  },
  {
    id: "blog",
    name: "Blog / Article",
    icon: "📝",
    systemInstruction: "Write an engaging blog post or article with a compelling headline, hook introduction, well-structured body with subheadings, practical examples, statistics, quotes, and a strong conclusion with call-to-action. SEO-friendly and reader-focused. Write at least 2000 words.",
    formatTemplate: `# [Compelling Headline with Keywords]

*[Author] | [Date] | [Reading time] min read*

**[Hook — opening paragraph that grabs attention with a story, question, or shocking statistic]**

---

## [Section 1: Context/Problem]
[2-3 detailed paragraphs with examples]

## [Section 2: Deep Dive]
[Detailed analysis with data points]
[IMAGE: Relevant infographic or chart]

### [Subsection]
[Practical tips or examples]

## [Section 3: Solution/How-To]
1. **Step 1**: [Detailed explanation]
2. **Step 2**: [Detailed explanation]
3. **Step 3**: [Detailed explanation]

## [Section 4: Case Study/Example]
> "[Expert quote]" — [Source]

## Key Takeaways
- [Takeaway 1]
- [Takeaway 2]
- [Takeaway 3]

## Conclusion
[Call to action]

---
*[Author bio]*`,
  },
  {
    id: "report",
    name: "Technical Report",
    icon: "📋",
    systemInstruction: "Write a detailed technical report with precise technical language, data tables, findings, and actionable recommendations. Include figures descriptions and appendices notes. Be thorough and data-driven. Write at minimum 15-20 pages of content.",
    formatTemplate: `# Technical Report: [Title]

**Prepared by:** [Author/Team]
**Date:** [Date]
**Document ID:** [ID]
**Classification:** [Level]

---

## Table of Contents

## 1. Introduction
### 1.1 Purpose
### 1.2 Scope
### 1.3 Definitions & Acronyms

## 2. Background
### 2.1 Context
### 2.2 Previous Work
### 2.3 Requirements

## 3. Technical Analysis
### 3.1 Methodology
### 3.2 Tools & Technologies
### 3.3 Test Environment
### 3.4 Data Collection

## 4. Findings
### 4.1 Results Summary
| Metric | Value | Benchmark | Status |
|--------|-------|-----------|--------|
### 4.2 Detailed Analysis
### 4.3 Performance Metrics
[IMAGE: Performance chart or graph]

## 5. Risk Assessment
### 5.1 Identified Risks
### 5.2 Mitigation Strategies

## 6. Recommendations

## 7. Implementation Plan

## 8. Conclusion

## Appendices
### A. Raw Data
### B. Test Configurations
### C. Glossary`,
  },
  {
    id: "letter",
    name: "Formal Letter",
    icon: "✉️",
    systemInstruction: "Write a formal letter with proper letterhead placement, date, recipient address, salutation, body paragraphs, closing, and signature block. Maintain professional tone appropriate to the context.",
    formatTemplate: `[Your Name]
[Your Title]
[Your Organization]
[Your Address]
[City, State ZIP]
[Email] | [Phone]

[Date]

[Recipient Name]
[Recipient Title]
[Organization]
[Address]
[City, State ZIP]

**Re: [Subject Line]**

Dear [Mr./Ms./Dr. Last Name],

[Opening paragraph — state the purpose]

[Body paragraph — details and supporting information]

[Body paragraph — additional context]

[Closing paragraph — next steps and call to action]

Sincerely,

___________________________
[Your Name]
[Your Title]

**Enclosures:** [List if applicable]
**CC:** [Names if applicable]`,
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

  /** Call the AI and return the full streamed text */
  const callAI = async (messages: { role: string; content: string }[], systemOverride: string): Promise<string> => {
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
          if (c) fullText += c;
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
        if (c) fullText += c;
      } catch {}
    }

    return fullText;
  };

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: ConversationMessage = { role: "user", content: text };
    const newConversation = [...conversation, userMsg];
    setConversation(newConversation);
    setInput("");

    // In stopped mode, send the message as context adjustment and stay in stopped phase
    if (phase === "stopped") {
      setIsStreaming(true);
      try {
        const systemContent = buildSystemPrompt(selectedPreset) + "\n\nThe user has PAUSED document generation. They want to adjust the upcoming chapters. Acknowledge their request briefly and confirm the adjustment will apply when they resume.";
        const messages = newConversation.map(m => ({ role: m.role, content: m.content }));
        const fullText = await callAI(messages, systemContent);
        setConversation(prev => [...prev, { role: "assistant", content: fullText }]);
        setPhase("stopped"); // stay in stopped
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
        // Check if it looks like an outline for a long document (10+ chapters/sections)
        const outlines = tryParseOutline(fullText);
        if (outlines && outlines.length >= 10) {
          setChapterOutlines(outlines);
          setTotalChapters(outlines.length);
          setConversation(prev => [...prev, { role: "assistant", content: `I've prepared an outline with ${outlines.length} chapters/sections. Please review the summary below and approve to start writing.` }]);
          setPhase("outline-review");
        } else {
          // Direct insert
          const html = markdownToHtml(fullText);
          onInsertText(html);
          addLightPaperMessage("success", "Document written by Genius AI");
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

    for (let i = startIndex; i < chapterOutlines.length; i++) {
      if (controller.signal.aborted) {
        setStoppedAtChapter(i);
        setPhase("stopped");
        setIsStreaming(false);
        addLightPaperMessage("info", `Stopped at chapter ${i}/${chapterOutlines.length}. You can resume or edit instructions.`);
        return;
      }

      setGeneratingChapter(i + 1);
      const chapter = chapterOutlines[i];

      try {
        const chapterPrompt = `Write Chapter ${i + 1}: "${chapter.title}" in full detail.

Summary to expand: ${chapter.summary}

IMPORTANT:
- Write at least 3000-5000 words for this chapter
- Use the format template provided
- Include [IMAGE: description] tags where illustrations would enhance the content
- Be thorough, detailed, and professional
- This is chapter ${i + 1} of ${chapterOutlines.length}
- Do NOT include other chapters, only this one`;

        const messages = [
          ...conversation.map(m => ({ role: m.role, content: m.content })),
          { role: "user" as const, content: chapterPrompt },
        ];

        const chapterText = await callAI(messages, systemContent);
        
        if (controller.signal.aborted) {
          setStoppedAtChapter(i + 1);
          setPhase("stopped");
          setIsStreaming(false);
          addLightPaperMessage("info", `Stopped after chapter ${i + 1}. You can resume or edit instructions.`);
          return;
        }

        const chapterHtml = markdownToHtml(chapterText);

        // Insert progressively
        onInsertText(chapterHtml);
        addLightPaperMessage("success", `Chapter ${i + 1}/${chapterOutlines.length} written`);
      } catch (err: any) {
        if (err.name === 'AbortError' || controller.signal.aborted) {
          setStoppedAtChapter(i);
          setPhase("stopped");
          setIsStreaming(false);
          addLightPaperMessage("info", `Stopped at chapter ${i + 1}. You can resume.`);
          return;
        }
        console.error(`Error generating chapter ${i + 1}:`, err);
        addLightPaperMessage("error", `Failed on chapter ${i + 1}. Stopping.`);
        break;
      }
    }

    setPhase("done");
    setIsStreaming(false);
    abortControllerRef.current = null;
    addLightPaperMessage("success", `✅ All ${chapterOutlines.length} chapters written!`);
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
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <span className={`text-xs font-semibold ${fg} opacity-70`}>Genius AI</span>
              {phase === "generating-chapters" && (
                <span className="text-[10px] text-emerald-500 font-mono">
                  Chapter {generatingChapter}/{totalChapters}
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

          {/* Conversation history */}
          {conversation.length > 0 && (
            <div ref={conversationRef} className="px-4 max-h-[200px] overflow-auto space-y-2 mb-2 flex-shrink-0">
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

          {/* Outline review panel */}
          {phase === "outline-review" && chapterOutlines.length > 0 && (
            <div className="px-4 mb-2 flex-1 overflow-auto">
              <div className={`rounded-lg p-3 ${isDarkMode ? "bg-white/5" : "bg-black/5"} space-y-2`}>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-emerald-500" />
                  <span className={`text-xs font-semibold ${fg}`}>
                    Chapter Outline ({chapterOutlines.length} chapters)
                  </span>
                </div>
                <div className="max-h-[250px] overflow-auto space-y-1.5">
                  {chapterOutlines.map((ch, i) => (
                    <div key={i} className={`text-[11px] ${fg} opacity-80 flex gap-2`}>
                      <span className="text-emerald-500 font-mono flex-shrink-0">{i + 1}.</span>
                      <div>
                        <span className="font-semibold">{ch.title}</span>
                        <span className="opacity-60 block">{ch.summary}</span>
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

          {/* Chapter generation progress */}
          {phase === "generating-chapters" && (
            <div className="px-4 mb-2">
              <div className={`rounded-lg p-3 ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-emerald-500 animate-spin" />
                    <span className={`text-xs font-semibold ${fg}`}>
                      Writing chapter {generatingChapter} of {totalChapters}...
                    </span>
                  </div>
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-500/20 text-red-500 text-[10px] font-semibold hover:bg-red-500/30 transition-colors"
                  >
                    <Square className="h-3 w-3" /> Stop
                  </button>
                </div>
                <div className="w-full h-2 rounded-full bg-emerald-500/20 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${(generatingChapter / totalChapters) * 100}%` }}
                  />
                </div>
                <div className="mt-2 space-y-0.5">
                  {chapterOutlines.map((ch, i) => (
                    <div key={i} className={`text-[10px] ${fg} flex items-center gap-1.5 ${i + 1 < generatingChapter ? "opacity-40" : i + 1 === generatingChapter ? "opacity-100" : "opacity-25"}`}>
                      {i + 1 < generatingChapter ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      ) : i + 1 === generatingChapter ? (
                        <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-current flex-shrink-0" />
                      )}
                      {ch.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stopped state - show resume button and allow editing */}
          {phase === "stopped" && (
            <div className="px-4 mb-2">
              <div className={`rounded-lg p-3 ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${fg}`}>
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

          {/* Input area — hidden during active generation & outline review */}
          {phase !== "outline-review" && phase !== "generating-chapters" && (
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
          )}
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
      `}</style>
    </div>
  );
}

// ---- Helpers ----

function buildSystemPrompt(preset: Preset | null): string {
  const base = `You are **Genius AI**, a writing assistant in LightPaper.

CRITICAL RULES:
1. If the user's request is vague, ask 2-3 SHORT clarifying questions (one line each). Offer multiple-choice options when possible (e.g., "A) Academic  B) Casual  C) Business"). Keep questions under 15 words each.
2. NEVER write the document until the user explicitly says "go", "write it", "proceed", "yes", etc.
3. When the user confirms, write the FULL document immediately — do NOT ask more questions.
4. WRITE EXTENSIVELY:
   - Short docs: 2000-4000 words
   - Medium docs: 5000-10000 words
   - Long docs (books): First provide OUTLINE, then write chapters on approval
5. Use Markdown: # ## ### headings, **bold**, *italic*, tables, bullet points, ---
6. Use [IMAGE: description] for image placeholders.
7. For 10+ sections: Provide outline first as:
   OUTLINE:
   1. Chapter Title | Summary
   2. Chapter Title | Summary
8. Your questions appear in a chat bubble — keep them SHORT and conversational, not formal paragraphs.
9. You can also: summarize, translate, proofread, brainstorm, analyze — based on user request.
10. DOCUMENT FORMATTING — ALWAYS include these elements:
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
  // If it's short and contains question marks, it's a clarification
  if (text.length > 2000) return false; // Long text = document, not questions
  if (text.includes("OUTLINE:")) return false;
  if (text.includes("# ") && text.length > 800) return false; // Has headings and is long = document
  
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
      // Try simpler format: "1. Chapter Title"
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
    // Image references
    .replace(/\[IMAGE:\s*(.+?)\]/g, '<div style="border:2px dashed #ccc;padding:20px;margin:16px 0;text-align:center;border-radius:8px;background:#f9f9f9;color:#666;font-style:italic;">📷 Image: $1</div>')
    // Tables
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split("|").filter(c => c.trim());
      if (cells.every(c => /^[\s\-:]+$/.test(c))) return ""; // separator row
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

  // Wrap tables
  html = html.replace(/(<tr>.*?<\/tr>)+/gs, (match) => `<table style="width:100%;border-collapse:collapse;margin:16px 0;" border="1" cellpadding="8">${match}</table>`);
  // Wrap lists
  html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);

  if (!html.startsWith("<h") && !html.startsWith("<ul") && !html.startsWith("<ol") && !html.startsWith("<hr") && !html.startsWith("<table") && !html.startsWith("<div") && !html.startsWith("<blockquote")) {
    html = `<p>${html}</p>`;
  }

  return html;
}
