import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface FlowSession {
  id: string;
  user_id: string;
  title: string;
  idea: string | null;
  domain: string | null;
  region: string | null;
  constraints: string | null;
  result: any;
  created_at: string;
  updated_at: string;
}

export interface FlowMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface FlowNote {
  id: string;
  session_id: string;
  content: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Manages persistent Flow investigation state for the active result.
 * - Auto-creates a session when a fresh result arrives.
 * - Loads message + note history for browsing.
 */
export function useFlowSession(args: {
  result: any;
  idea: string;
  domain: string;
  region: string;
  constraints: string;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<FlowSession[]>([]);
  const [messages, setMessages] = useState<FlowMessage[]>([]);
  const [notes, setNotes] = useState<FlowNote[]>([]);
  const [asking, setAsking] = useState(false);

  // Refresh all sessions list
  const refreshSessions = useCallback(async () => {
    if (!user) return;
    const { data, error } = await (supabase as any)
      .from("flow_sessions")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(100);
    if (!error && data) setSessions(data as FlowSession[]);
  }, [user]);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  // When a new result lands, create a session
  useEffect(() => {
    if (!user || !args.result) return;
    if (sessionId) return; // already attached

    (async () => {
      const title =
        (args.idea || "Untitled").trim().slice(0, 80) ||
        `Investigation ${new Date().toLocaleDateString()}`;

      const { data, error } = await (supabase as any)
        .from("flow_sessions")
        .insert({
          user_id: user.id,
          title,
          idea: args.idea,
          domain: args.domain,
          region: args.region,
          constraints: args.constraints,
          result: args.result,
        })
        .select()
        .single();

      if (error) {
        console.warn("[flow_sessions] insert failed:", error.message);
        return;
      }
      setSessionId(data.id);
      setMessages([]);
      setNotes([]);
      refreshSessions();
    })();
  }, [user, args.result, sessionId, args.idea, args.domain, args.region, args.constraints, refreshSessions]);

  // Reset when result is cleared (new analysis)
  useEffect(() => {
    if (!args.result) {
      setSessionId(null);
      setMessages([]);
      setNotes([]);
    }
  }, [args.result]);

  // Load messages + notes whenever session changes
  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const [m, n] = await Promise.all([
        (supabase as any)
          .from("flow_messages")
          .select("*")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true }),
        (supabase as any)
          .from("flow_notes")
          .select("*")
          .eq("session_id", sessionId)
          .order("updated_at", { ascending: false }),
      ]);
      if (!m.error && m.data) setMessages(m.data as FlowMessage[]);
      if (!n.error && n.data) setNotes(n.data as FlowNote[]);
    })();
  }, [sessionId]);

  const askQuestion = useCallback(
    async (question: string) => {
      if (!user || !sessionId || !question.trim()) return;
      setAsking(true);

      // Optimistic insert
      const userMsg: any = {
        session_id: sessionId,
        user_id: user.id,
        role: "user",
        content: question.trim(),
      };
      const { data: insertedUser, error: userErr } = await (supabase as any)
        .from("flow_messages")
        .insert(userMsg)
        .select()
        .single();
      if (userErr) {
        toast({ title: "Error", description: userErr.message, variant: "destructive" });
        setAsking(false);
        return;
      }
      setMessages((prev) => [...prev, insertedUser as FlowMessage]);

      try {
        const { data, error } = await supabase.functions.invoke("flow-investigate", {
          body: {
            question: question.trim(),
            context: {
              idea: args.idea,
              domain: args.domain,
              region: args.region,
              result: args.result,
            },
            history: messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        const answer = data?.answer || "(no response)";

        const { data: aMsg } = await (supabase as any)
          .from("flow_messages")
          .insert({
            session_id: sessionId,
            user_id: user.id,
            role: "assistant",
            content: answer,
          })
          .select()
          .single();
        if (aMsg) setMessages((prev) => [...prev, aMsg as FlowMessage]);
      } catch (e: any) {
        toast({
          title: "Investigation failed",
          description: e.message || "Could not get answer",
          variant: "destructive",
        });
      } finally {
        setAsking(false);
      }
    },
    [user, sessionId, messages, args, toast]
  );

  const addNote = useCallback(
    async (content: string) => {
      if (!user || !sessionId || !content.trim()) return;
      const { data, error } = await (supabase as any)
        .from("flow_notes")
        .insert({ session_id: sessionId, user_id: user.id, content: content.trim() })
        .select()
        .single();
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      setNotes((prev) => [data as FlowNote, ...prev]);
    },
    [user, sessionId, toast]
  );

  const updateNote = useCallback(
    async (id: string, content: string) => {
      const { data, error } = await (supabase as any)
        .from("flow_notes")
        .update({ content })
        .eq("id", id)
        .select()
        .single();
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      setNotes((prev) => prev.map((n) => (n.id === id ? (data as FlowNote) : n)));
    },
    [toast]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      const { error } = await (supabase as any).from("flow_notes").delete().eq("id", id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      setNotes((prev) => prev.filter((n) => n.id !== id));
    },
    [toast]
  );

  const togglePin = useCallback(
    async (id: string, pinned: boolean) => {
      const { data, error } = await (supabase as any)
        .from("flow_notes")
        .update({ pinned })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) {
        setNotes((prev) => prev.map((n) => (n.id === id ? (data as FlowNote) : n)));
      }
    },
    []
  );

  // Load a previous session into focus (read-only viewer mode)
  const loadSession = useCallback(async (id: string) => {
    setSessionId(id);
    const { data, error } = await (supabase as any)
      .from("flow_sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }

    return data as FlowSession;
  }, [toast]);

  const deleteSession = useCallback(
    async (id: string) => {
      const { error } = await (supabase as any).from("flow_sessions").delete().eq("id", id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (sessionId === id) setSessionId(null);
    },
    [sessionId, toast]
  );

  const renameSession = useCallback(
    async (id: string, title: string) => {
      const { error } = await (supabase as any)
        .from("flow_sessions")
        .update({ title })
        .eq("id", id);
      if (!error) refreshSessions();
    },
    [refreshSessions]
  );

  return {
    sessionId,
    sessions,
    messages,
    notes,
    asking,
    askQuestion,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    loadSession,
    deleteSession,
    renameSession,
    refreshSessions,
  };
}

export type FlowSessionApi = ReturnType<typeof useFlowSession>;
