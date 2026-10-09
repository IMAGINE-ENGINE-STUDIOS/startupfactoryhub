import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Send, Loader2, Square, Trash2, FileText, Languages, Wand2, BookOpen, Briefcase, CornerDownLeft, Replace, FilePlus2, RefreshCw, Mic, MicOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getAIHeaders } from "@/lib/aiAuth";
import { getAppLanguage } from "@/lib/aiLanguage";
import { markdownToDocumentHtml } from "@/lib/documentFormatter";
import geniusAILogo from "@/assets/genius-ai-logo.png";

export type ApplyMode = "cursor" | "append" | "selection" | "replace";

interface Msg { role: "user" | "assistant"; content: string }

interface Props {
  docKey: string;
  getDocument: () => { title: string; text: string; selection: string };
  onApply: (html: string, mode: ApplyMode) => void;
}

const QUICK: { icon: any; label: string; prompt: string }[] = [
  { icon: Wand2, label: "Fix document", prompt: "Proofread and fix the entire document: grammar, spelling, clarity and consistent formatting. Return the full corrected document." },
  { icon: Languages, label: "Translate", prompt: "Translate the entire document to Spanish, keeping all headings, lists and tables intact. Return only the translated document." },
  { icon: Briefcase, label: "Business plan", prompt: "Write a complete investor-ready business plan: executive summary, problem, solution, market analysis, business model, go-to-market, operations, team, financial projections table, funding ask and milestones." },
  { icon: BookOpen, label: "Write a book", prompt: "Write a numbered outline of all chapters of a book based on the open document (or a startup-founder guide if it is empty), then write chapter 1 in full." },
  { icon: FileText, label: "Summarize", prompt: "Write a one-page executive summary of the open document." },
];

const memKey = (k: string) => `lp-ai-mem:${k}`;

export default function LightPaperAISidebar({ docKey, getDocument, onApply }: Props) {
  const [open, setOpen] = useState(() => localStorage.getItem("lp-ai-open") !== "0");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // "Replace selection" flow: asks what to write instead (typed or dictated).
  const [replaceFor, setReplaceFor] = useState<string | null>(null);
  const [replaceText, setReplaceText] = useState("");
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  const stopDictation = () => { try { recRef.current?.stop(); } catch { /* noop */ } recRef.current = null; setListening(false); };
  const startDictation = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError("Voice dictation isn't supported in this browser. Type your text instead (Chrome, Edge or Safari support dictation)."); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = navigator.language || "en-US";
    const base = replaceText ? replaceText.trimEnd() + " " : "";
    rec.onresult = (e: any) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setReplaceText(base + t.trim());
    };
    rec.onerror = (e: any) => { if (e?.error === "not-allowed") setError("Microphone access was blocked."); stopDictation(); };
    rec.onend = () => setListening(false);
    try { rec.start(); recRef.current = rec; setListening(true); } catch { setListening(false); }
  };
  const openReplace = () => {
    const sel = getDocument().selection?.trim();
    if (!sel) { setError("Select the text you want to replace in the document first."); return; }
    setError(""); setReplaceText(""); setReplaceFor(sel);
  };
  const closeReplace = () => { stopDictation(); setReplaceFor(null); setReplaceText(""); };
  const confirmReplace = () => {
    const t = replaceText.trim();
    if (!t) return;
    onApply(markdownToDocumentHtml(t), "selection");
    closeReplace();
  };
  useEffect(() => () => stopDictation(), []);

  useEffect(() => {
    try { setMessages(JSON.parse(localStorage.getItem(memKey(docKey)) || "[]")); } catch { setMessages([]); }
  }, [docKey]);

  const persist = (m: Msg[]) => {
    setMessages(m);
    try { localStorage.setItem(memKey(docKey), JSON.stringify(m.slice(-40))); } catch { /* quota */ }
  };

  useEffect(() => { localStorage.setItem("lp-ai-open", open ? "1" : "0"); }, [open]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages, loading]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const send = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || loading) return;
    setError("");
    const doc = getDocument();
    const history: Msg[] = [...messages, { role: "user", content: prompt }];
    persist([...history, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let full = "";
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lightpaper-genius`, {
        method: "POST",
        headers: await getAIHeaders(),
        signal: ctrl.signal,
        body: JSON.stringify({
          messages: history.slice(-20),
          language: getAppLanguage(),
          document: { title: doc.title, text: doc.text, selection: doc.selection, words: doc.text.split(/\s+/).filter(Boolean).length },
        }),
      });
      if (resp.status === 401) throw new Error("Please sign in to use Genius AI.");
      if (resp.status === 429) throw new Error("Too many requests right now. Please wait a moment.");
      if (!resp.ok || !resp.body) throw new Error("Genius AI is unavailable right now. Please try again.");
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, i).replace(/\r$/, "");
          buf = buf.slice(i + 1);
          if (!line.startsWith("data: ")) continue;
          const j = line.slice(6).trim();
          if (j === "[DONE]") continue;
          try {
            const c = JSON.parse(j).choices?.[0]?.delta?.content;
            if (c) { full += c; persist([...history, { role: "assistant", content: full }]); }
          } catch { /* partial */ }
        }
      }
      if (!full.trim()) throw new Error("Genius AI returned an empty answer.");
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setError(e?.message || "Something went wrong.");
        if (!full) persist(history);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="no-print fixed left-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 rounded-r-lg border border-l-0 bg-background px-1.5 py-3 shadow-md hover:bg-muted"
        aria-label="Open Genius AI"
        title="Genius AI (Ctrl+J)"
      >
        <img src={geniusAILogo} alt="" className="h-5 w-5" />
        <ChevronRight className="h-4 w-4" />
      </button>
    );
  }

  return (
    <aside className="no-print flex h-full w-full max-md:fixed max-md:inset-0 max-md:z-50 md:w-[340px] shrink-0 flex-col border-r bg-background overflow-x-hidden">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <img src={geniusAILogo} alt="" className="h-5 w-5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">Genius AI</p>
            <p className="truncate text-[11px] text-muted-foreground">Knows your open document</p>
          </div>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Clear memory" onClick={() => persist([])}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Collapse (Ctrl+J)" onClick={() => setOpen(false)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-3 break-words [overflow-wrap:anywhere]">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Ask about this document, edit a selection, translate, or write full documents.</p>
            {QUICK.map((q) => (
              <button key={q.label} onClick={() => send(q.prompt)} className="flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs hover:bg-muted">
                <q.icon className="h-3.5 w-3.5 text-primary" /> {q.label}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, idx) => (
          m.role === "user" ? (
            <div key={idx} className="ml-6 rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground whitespace-pre-wrap">{m.content}</div>
          ) : (
            <div key={idx} className="space-y-1.5">
              <div
                className="lp-ai-answer max-w-full overflow-x-hidden rounded-lg border bg-card px-3 py-2 text-xs text-card-foreground break-words [overflow-wrap:anywhere] [&_*]:!max-w-full [&_*]:!whitespace-normal [&_img]:h-auto [&_pre]:overflow-x-auto [&_h1]:text-sm [&_h1]:font-bold [&_h2]:text-[13px] [&_h2]:font-semibold [&_h3]:font-semibold [&_*]:!text-xs [&_*]:!m-0 [&_*]:!mb-1.5 [&_table]:w-full [&_table]:table-fixed"
                dangerouslySetInnerHTML={{ __html: m.content ? markdownToDocumentHtml(m.content) : "" }}
              />
              {!m.content && loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {m.content && !(loading && idx === messages.length - 1) && (
                <div className="flex flex-wrap gap-1">
                  {([
                    ["cursor", CornerDownLeft, "Insert"],
                    ["selection", Replace, "Replace selection"],
                    ["append", FilePlus2, "Append"],
                    ["replace", RefreshCw, "Replace document"],
                  ] as [ApplyMode, any, string][]).map(([mode, Icon, label]) => (
                    <Button key={mode} variant="outline" size="sm" className="h-6 px-2 text-[10px] gap-1" onClick={() => mode === "selection" ? openReplace() : onApply(markdownToDocumentHtml(m.content), mode)}>
                      <Icon className="h-3 w-3" /> {label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )
        ))}
        {error && <p className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">{error}</p>}
      </div>

      {replaceFor !== null && (
        <div className="border-t p-2 space-y-2 bg-muted/40">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold">What would you like to write instead?</p>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={closeReplace} title="Cancel"><X className="h-3.5 w-3.5" /></Button>
          </div>
          <p className="line-clamp-2 text-[11px] text-muted-foreground">Replacing: "{replaceFor}"</p>
          <Textarea
            autoFocus
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); confirmReplace(); } }}
            placeholder="Type or press the mic and speak..."
            className="min-h-[60px] resize-none text-xs"
          />
          <div className="flex gap-1.5">
            <Button size="sm" variant={listening ? "destructive" : "outline"} className="h-7 gap-1 text-[11px]" onClick={listening ? stopDictation : startDictation}>
              {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />} {listening ? "Stop" : "Dictate"}
            </Button>
            <Button size="sm" className="h-7 flex-1 gap-1 text-[11px]" disabled={!replaceText.trim()} onClick={confirmReplace}>
              <Replace className="h-3.5 w-3.5" /> Replace selection
            </Button>
          </div>
        </div>
      )}

      <div className="border-t p-2">
        <div className="relative">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Ask Genius to write, fix or translate..."
            className="min-h-[70px] resize-none pr-10 text-xs"
          />
          {loading ? (
            <Button size="icon" variant="secondary" className="absolute bottom-2 right-2 h-7 w-7" onClick={() => abortRef.current?.abort()} title="Stop">
              <Square className="h-3 w-3" />
            </Button>
          ) : (
            <Button size="icon" className="absolute bottom-2 right-2 h-7 w-7" onClick={() => send(input)} disabled={!input.trim()} title="Send">
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
