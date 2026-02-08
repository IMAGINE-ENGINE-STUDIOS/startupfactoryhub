import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bot,
  Send,
  Loader2,
  X,
  Sparkles,
  FileText,
  Languages,
  CheckCircle,
  BookOpen,
  FileType,
  Eraser,
  Copy,
  ClipboardPaste,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface GeniusAIChatProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertText?: (text: string) => void;
}

const QUICK_ACTIONS = [
  { icon: BookOpen, label: "Write a document", prompt: "Write a professional document about: " },
  { icon: CheckCircle, label: "Grammar check", prompt: "Check and correct the grammar of the following text:\n\n" },
  { icon: Languages, label: "Translate", prompt: "Translate the following text to " },
  { icon: FileType, label: "Convert format", prompt: "Convert the following content into " },
  { icon: FileText, label: "Summarize", prompt: "Summarize the following text concisely:\n\n" },
  { icon: Sparkles, label: "Improve writing", prompt: "Improve the writing style and clarity of:\n\n" },
];

export default function GeniusAIChat({ isOpen, onClose, onInsertText }: GeniusAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    setInput("");
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setIsStreaming(true);

    let assistantSoFar = "";

    try {
      const allMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lightpaper-genius`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: allMessages }),
        }
      );

      if (resp.status === 429) {
        toast.error("Rate limit exceeded. Please wait a moment.");
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      if (resp.status === 402) {
        toast.error("AI credits exhausted. Please add credits to your workspace.");
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        const snapshot = assistantSoFar;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: snapshot } : m
            );
          }
          return [...prev, { role: "assistant", content: snapshot }];
        });
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
            if (content) upsert(content);
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
            if (content) upsert(content);
          } catch {}
        }
      }
    } catch (err: any) {
      console.error("Genius AI error:", err);
      toast.error("Failed to get AI response. Please try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleInsert = (text: string) => {
    onInsertText?.(text);
    toast.success("Inserted into document");
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Chat cleared");
  };

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col border-l bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Genius AI</h3>
            <p className="text-[10px] text-muted-foreground">Write · Check · Translate · Convert</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearChat} title="Clear chat">
            <Eraser className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-emerald-500/70" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">How can I help?</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-[250px]">
              I can write documents, check grammar, translate, convert files, and more.
            </p>
            <div className="grid grid-cols-2 gap-1.5 w-full max-w-[300px]">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="h-auto py-2 px-2.5 text-[11px] justify-start gap-1.5 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                  onClick={() => setInput(action.prompt)}
                >
                  <action.icon className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_pre]:text-xs [&_code]:text-xs">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  )}
                  {msg.role === "assistant" && !isStreaming && (
                    <div className="flex gap-1 mt-2 pt-1.5 border-t border-border/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy(msg.content)}
                      >
                        <Copy className="h-2.5 w-2.5" />
                        Copy
                      </Button>
                      {onInsertText && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-emerald-500"
                          onClick={() => handleInsert(msg.content)}
                        >
                          <ClipboardPaste className="h-2.5 w-2.5" />
                          Insert
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Genius AI anything..."
            disabled={isLoading}
            className="text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
