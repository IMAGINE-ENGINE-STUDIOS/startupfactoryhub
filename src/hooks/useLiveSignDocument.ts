import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SignAccessMode = "view" | "sign" | "edit";

export interface LiveSignDoc {
  id: string;
  title: string;
  source_type: string;
  file_url: string | null;
  content_html: string | null;
  signer_message: string | null;
  status: string;
  created_at: string;
  access_mode: SignAccessMode;
  updated_at: string;
}

export interface LiveSignature {
  id: string;
  signer_name: string;
  signature_data: string;
  note: string | null;
  signed_at: string;
}

export interface LedgerEntry {
  id: string;
  editor_name: string;
  action: string;
  summary: string | null;
  chars_delta: number | null;
  created_at: string;
}

/**
 * Keeps a shared signing document in sync for every person holding the link:
 * content updates, new signatures and the full activity ledger.
 */
export function useLiveSignDocument(token: string | undefined) {
  const [doc, setDoc] = useState<LiveSignDoc | null>(null);
  const [signatures, setSignatures] = useState<LiveSignature[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);

  const knownLedgerId = useRef<string | null>(null);
  const suspended = useRef(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const clientId = useRef(crypto.randomUUID());

  /** Pause remote sync while the local user is typing, to avoid clobbering. */
  const setSuspended = useCallback((value: boolean) => {
    suspended.current = value;
  }, []);

  const announce = useCallback((message: string) => {
    setLiveNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setLiveNotice(null), 6000);
  }, []);

  const refresh = useCallback(
    async (silent = true) => {
      if (!token) return;
      const [docRes, sigRes, logRes] = await Promise.all([
        supabase.rpc("get_sign_document_by_token", { _token: token }),
        supabase.rpc("get_sign_signatures_by_token", { _token: token }),
        supabase.rpc("get_sign_document_ledger", { _token: token }),
      ]);

      const row = Array.isArray(docRes.data) ? docRes.data[0] : docRes.data;
      if (row) setDoc(row as LiveSignDoc);
      setSignatures((sigRes.data as LiveSignature[]) ?? []);

      const entries = (logRes.data as LedgerEntry[]) ?? [];
      setLedger(entries);

      const latest = entries[0];
      if (latest) {
        if (knownLedgerId.current && latest.id !== knownLedgerId.current && silent) {
          announce(
            latest.action === "sign"
              ? `${latest.editor_name} just signed this document`
              : `${latest.editor_name} is updating this document`
          );
        }
        knownLedgerId.current = latest.id;
      }
      setLoading(false);
    },
    [token, announce]
  );

  const broadcastChange = useCallback(
    async (editorName: string, action: "edit" | "sign") => {
      await channelRef.current?.send({
        type: "broadcast",
        event: "document-change",
        payload: { clientId: clientId.current, editorName, action },
      });
    },
    []
  );

  useEffect(() => {
    if (!token) return;
    void refresh(false);

    const channel = supabase
      .channel(`sign-document:${token}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "document-change" }, ({ payload }) => {
        if (payload?.clientId === clientId.current || suspended.current) return;
        const editorName = typeof payload?.editorName === "string" ? payload.editorName : "Another participant";
        if (payload?.action === "draft" && typeof payload?.contentHtml === "string") {
          setDoc((current) =>
            current ? { ...current, content_html: payload.contentHtml } : current
          );
        } else {
          void refresh(false);
        }
        announce(
          payload?.action === "sign"
            ? `${editorName} just signed this document`
            : `${editorName} is updating this document`
        );
      })
      .subscribe();
    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, [token, refresh, announce]);

  const broadcastDraft = useCallback(async (contentHtml: string, editorName?: string) => {
    await channelRef.current?.send({
      type: "broadcast",
      event: "document-change",
      payload: {
        clientId: clientId.current,
        editorName: editorName?.trim() || "Another participant",
        action: "draft",
        contentHtml,
      },
    });
  }, []);

  return {
    doc,
    setDoc,
    signatures,
    ledger,
    loading,
    refresh,
    liveNotice,
    setSuspended,
    broadcastChange,
    broadcastDraft,
  };
}
