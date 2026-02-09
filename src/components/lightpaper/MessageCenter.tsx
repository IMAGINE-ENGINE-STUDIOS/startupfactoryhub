import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle, X, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface LightPaperMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  content: string;
  timestamp: Date;
  read: boolean;
}

// Global message store
let globalMessages: LightPaperMessage[] = [];
let listeners: Array<() => void> = [];

function notifyListeners() {
  listeners.forEach((l) => l());
}

export function addLightPaperMessage(type: LightPaperMessage["type"], content: string) {
  const msg: LightPaperMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    content,
    timestamp: new Date(),
    read: false,
  };
  globalMessages = [msg, ...globalMessages].slice(0, 100); // keep last 100
  notifyListeners();
}

export function useMessages() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const markAllRead = useCallback(() => {
    globalMessages = globalMessages.map((m) => ({ ...m, read: true }));
    notifyListeners();
  }, []);

  const clearAll = useCallback(() => {
    globalMessages = [];
    notifyListeners();
  }, []);

  const unreadCount = globalMessages.filter((m) => !m.read).length;

  return { messages: globalMessages, unreadCount, markAllRead, clearAll };
}

const typeConfig = {
  success: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  error: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  info: { icon: Info, color: "text-primary", bg: "bg-primary/10" },
  warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10" },
};

export function MessageCenterButton() {
  const { messages, unreadCount, markAllRead, clearAll } = useMessages();

  return (
    <Sheet onOpenChange={(open) => { if (open) markAllRead(); }}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 h-8 sm:h-9 text-xs sm:text-sm relative">
          <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Messages</span>
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1.5 -right-1.5 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[10px] rounded-full"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[340px] sm:w-[400px] p-0">
        <SheetHeader className="p-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">Messages</SheetTitle>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs gap-1 text-muted-foreground">
                <Trash2 className="h-3 w-3" />
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No messages yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {messages.map((msg) => {
                const cfg = typeConfig[msg.type];
                const Icon = cfg.icon;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 px-4 py-3 ${!msg.read ? cfg.bg : ""} transition-colors`}
                  >
                    <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">{msg.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
