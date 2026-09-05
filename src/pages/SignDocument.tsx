import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sanitizeHTML } from "@/utils/sanitize";
import SignaturePad from "@/components/sign/SignaturePad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CheckCircle2,
  Download,
  FileSignature,
  Loader2,
  Mail,
  Pencil,
  PenTool,
  Printer,
  Save,
  Send,
  ShieldCheck,
} from "lucide-react";
import DocumentLanguageBar from "@/components/sign/DocumentLanguageBar";
import {
  SIGN_FIELD_CLASS,
  fillSignatureField,
  markSignatureFields,
  signatureFieldFromEvent,
} from "@/lib/signatureFields";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildSignedPdf, pdfFileName, pdfToBase64, printPdf } from "@/lib/signedPdf";
import { useLiveSignDocument } from "@/hooks/useLiveSignDocument";
import {
  AccessBadge,
  ACCESS_LABEL,
  ActivityLedger,
  LiveNotice,
  SignatureStrip,
} from "@/components/sign/LiveCollaboration";
import PaperDocumentView from "@/components/sign/PaperDocumentView";


const SIGNER_KEY = "sfh_signer_identity_v1";

/** Restore a caret placed `offset` characters into the editor after a re-render. */
function restoreCaret(el: HTMLElement, offset: number) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let node: Node | null = walker.nextNode();
  while (node) {
    const len = node.textContent?.length ?? 0;
    if (remaining <= len) {
      const range = document.createRange();
      range.setStart(node, remaining);
      range.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      return;
    }
    remaining -= len;
    node = walker.nextNode();
  }
}

export default function SignDocument() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  // Owner detection: RLS only returns the row to its owner.
  const [isOwner, setIsOwner] = useState(false);

  // Live editing state
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [dirty, setDirty] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [askName, setAskName] = useState(false);
  const draftBroadcastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Merge an incoming remote draft into the live editor without stealing the
   * caret, so two people can type at the same time.
   */
  const applyRemoteDraft = useCallback((incoming: string) => {
    const el = editorRef.current;
    if (!el) return;
    const clean = sanitizeHTML(incoming);
    if (el.innerHTML === clean) return;

    const sel = window.getSelection();
    let offset: number | null = null;
    if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
      const live = sel.getRangeAt(0);
      const measure = document.createRange();
      measure.selectNodeContents(el);
      measure.setEnd(live.endContainer, live.endOffset);
      offset = measure.toString().length;
    }

    el.innerHTML = clean;
    if (offset !== null) restoreCaret(el, offset);
  }, []);

  const {
    doc,
    signatures,
    ledger,
    loading,
    loadError,
    refresh,
    liveNotice,
    setSuspended,
    broadcastChange,
    broadcastDraft,
  } = useLiveSignDocument(token, applyRemoteDraft);

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  const [signature, setSignature] = useState<string | null>(null);

  const docRef = useRef<HTMLElement | null>(null);
  const viewRef = useRef<HTMLDivElement | null>(null);
  const pendingFieldRef = useRef<HTMLElement | null>(null);
  const pendingFieldIndexRef = useRef<number | null>(null);
  const pdfRef = useRef<import("jspdf").default | null>(null);
  const [generating, setGenerating] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [recipients, setRecipients] = useState("");
  const [emailNote, setEmailNote] = useState("");
  const [sending, setSending] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  /** Owners can erase any signature already collected on the document. */
  const deleteSignature = async (signatureId: string) => {
    const { error } = await supabase.from("sign_signatures").delete().eq("id", signatureId);
    if (error) {
      toast.error("Could not erase that signature");
      return;
    }
    toast.success("Signature erased");
    await refresh();
  };


  const canEdit = doc?.access_mode === "edit" && !doc?.file_url;
  const canSign = doc?.access_mode !== "view";


  // Remembered signer identity (cache) + logged-in user fallback
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(SIGNER_KEY) || "null");
      if (cached?.name) setName(cached.name);
      if (cached?.email) setEmail(cached.email);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
    if (user?.user_metadata?.full_name && !name) setName(user.user_metadata.full_name as string);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const originalHtml = useMemo(
    () => (doc?.content_html ? sanitizeHTML(doc.content_html) : ""),
    [doc?.content_html]
  );
  const [translatedHtml, setTranslatedHtml] = useState<string | null>(null);
  const html = translatedHtml ? sanitizeHTML(translatedHtml) : originalHtml;

  // Only the owner can open the full file editor (RLS returns the row to owners only)
  useEffect(() => {
    if (!user || !token) {
      setIsOwner(false);
      return;
    }
    let active = true;
    supabase
      .from("sign_documents")
      .select("id")
      .eq("share_token", token)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setIsOwner(!!data);
      });
    return () => {
      active = false;
    };
  }, [user, token]);

  // Push remote content into the live editor when the local user is not typing
  useEffect(() => {
    if (!canEdit || dirty) return;
    const el = editorRef.current;
    if (el && el.innerHTML !== html) el.innerHTML = html;
  }, [html, canEdit, dirty]);

  useEffect(
    () => () => {
      if (draftBroadcastTimerRef.current) clearTimeout(draftBroadcastTimerRef.current);
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    },
    []
  );

  // Auto signature lines: mark the original document, then deterministically
  // render stored signatures into those fields without replacing the document.
  useEffect(() => {
    if (doc?.file_url || !canSign) return;
    const timer = window.setTimeout(() => {
      const target = canEdit ? editorRef.current : viewRef.current;
      if (document.activeElement !== target) {
        markSignatureFields(target);
        const fields = Array.from(target?.querySelectorAll(`.${SIGN_FIELD_CLASS}`) ?? []);
        signatures.forEach((storedSignature, index) => {
          const field = fields[index] as HTMLElement | undefined;
          if (field && !field.classList.contains("sfh-sign-field--signed")) {
            fillSignatureField(field, {
              type: "draw",
              data: storedSignature.signature_data,
              name: storedSignature.signer_name,
            });
          }
        });
      }
      markSignatureFields(docRef.current as HTMLElement | null);
      const printFields = Array.from(
        docRef.current?.querySelectorAll(`.${SIGN_FIELD_CLASS}`) ?? []
      );
      signatures.forEach((storedSignature, index) => {
        const field = printFields[index] as HTMLElement | undefined;
        if (field && !field.classList.contains("sfh-sign-field--signed")) {
          fillSignatureField(field, {
            type: "draw",
            data: storedSignature.signature_data,
            name: storedSignature.signer_name,
          });
        }
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [html, canEdit, canSign, doc?.file_url, done, signatures]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!canSign) return;
      const field = signatureFieldFromEvent(e);
      if (!field) return;
      e.preventDefault();
      e.stopPropagation();
      pendingFieldRef.current = field;
      const root = canEdit ? editorRef.current : viewRef.current;
      pendingFieldIndexRef.current = Array.from(
        root?.querySelectorAll(`.${SIGN_FIELD_CLASS}`) ?? []
      ).indexOf(field);
      setOpen(true);
      toast.info("Sign here — your signature drops straight onto this line");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [canSign]);

  /** Drop the confirmed signature into the clicked line (view + PDF rendition). */
  const dropSignatureIntoField = (dataUrl: string, signerName: string) => {
    const root = canEdit ? editorRef.current : viewRef.current;
    const fields = Array.from(root?.querySelectorAll(`.${SIGN_FIELD_CLASS}`) ?? []);
    const index = pendingFieldIndexRef.current ?? -1;
    const field = (pendingFieldRef.current?.isConnected
      ? pendingFieldRef.current
      : fields[index]) as HTMLElement | undefined;
    if (!field || index < 0) return false;
    fillSignatureField(field, { type: "draw", data: dataUrl, name: signerName });
    if (index >= 0 && docRef.current) {
      const mirror = docRef.current.querySelectorAll(`.${SIGN_FIELD_CLASS}`)[index] as
        | HTMLElement
        | undefined;
      if (mirror) fillSignatureField(mirror, { type: "draw", data: dataUrl, name: signerName });
    }
    pendingFieldRef.current = null;
    pendingFieldIndexRef.current = null;
    pdfRef.current = null;
    return true;
  };

  const saveLiveEdit = async () => {
    if (!token || !editorRef.current) return;
    if (name.trim().length < 2) {
      setAskName(true);
      return toast.error("Add your name so the change is logged");
    }
    setSavingEdit(true);
    const { error } = await supabase.rpc("save_sign_document_by_token", {
      _token: token,
      _content_html: editorRef.current.innerHTML,
      _editor_name: name.trim(),
      _editor_email: email.trim() || null,
      _summary: null,
    });
    setSavingEdit(false);
    if (error) {
      toast.error("Could not save your changes");
      return;
    }
    try {
      localStorage.setItem(SIGNER_KEY, JSON.stringify({ name: name.trim(), email: email.trim() }));
    } catch {
      /* ignore */
    }
    setDirty(false);
    setSuspended(false);
    pdfRef.current = null;
    await refresh(false);
    await broadcastChange(name.trim(), "edit");
    toast.success("Saved — logged in the activity ledger");
  };

  /**
   * Silent autosave so live text survives a reload even if nobody presses
   * "Save changes". Only one ledger entry per burst of typing.
   */
  const autosaveLiveEdit = useCallback(async () => {
    if (!token || !editorRef.current) return;
    const editorName = name.trim().length >= 2 ? name.trim() : "Guest";
    const { error } = await supabase.rpc("save_sign_document_by_token", {
      _token: token,
      _content_html: editorRef.current.innerHTML,
      _editor_name: editorName,
      _editor_email: email.trim() || null,
      _summary: "autosave",
    });
    if (!error) {
      setDirty(false);
      setSuspended(false);
      pdfRef.current = null;
      await broadcastChange(editorName, "edit");
    }
  }, [token, name, email, setSuspended, broadcastChange]);


  const submit = async () => {
    if (!token) return;
    if (name.trim().length < 2) return toast.error("Enter your full name");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast.error("Enter a valid email");
    if (!signature) return toast.error("Draw your signature");

    setSubmitting(true);
    const { error } = await supabase.rpc("submit_sign_signature", {
      _token: token,
      _signer_name: name.trim(),
      _signer_email: email.trim(),
      _signature_data: signature,
      _note: null,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Could not register the signature");
      return;
    }
    try {
      localStorage.setItem(SIGNER_KEY, JSON.stringify({ name: name.trim(), email: email.trim() }));
    } catch {
      /* ignore */
    }
    const placed = dropSignatureIntoField(signature, name.trim());
    setOpen(false);
    setDone(true);
    toast.success(placed ? "Signature placed on the line" : "Signature registered");
    await refresh(false);
    await broadcastChange(name.trim(), "sign");
    // Auto-download the signed PDF, DocuSign style
    await generatePdf(true);
  };

  const generatePdf = async (download = false) => {
    if (!doc || !docRef.current) return null;
    setGenerating(true);
    try {
      const pdf =
        pdfRef.current ??
        (await buildSignedPdf(
          docRef.current,
          doc.title,
          signatures.length > 0
            ? signatures.map((s) => ({
                signer_name: s.signer_name,
                signer_email: "",
                signature_data: s.signature_data,
                signed_at: s.signed_at,
              }))
            : [
                {
                  signer_name: name.trim(),
                  signer_email: email.trim(),
                  signature_data: signature || "",
                  signed_at: new Date().toISOString(),
                },
              ]
        ));
      pdfRef.current = pdf;
      if (download) pdf.save(pdfFileName(doc.title));
      return pdf;
    } catch (e) {
      console.error(e);
      toast.error("Could not generate the PDF");
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = async () => {
    const pdf = await generatePdf(false);
    if (pdf) printPdf(pdf);
  };

  const sendByEmail = async () => {
    if (!token) return;
    const list = recipients
      .split(/[,\s;]+/)
      .map((r) => r.trim())
      .filter(Boolean);
    if (list.length === 0) return toast.error("Add at least one email");
    if (list.some((r) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r)))
      return toast.error("Check the email addresses");

    setSending(true);
    const pdf = await generatePdf(false);
    const { error } = await supabase.functions.invoke("send-signed-document", {
      body: {
        token,
        to: list,
        senderName: name.trim() || undefined,
        message: emailNote.trim() || undefined,
        pdfBase64: pdf ? pdfToBase64(pdf) : undefined,
        fileName: doc ? pdfFileName(doc.title) : undefined,
      },
    });
    setSending(false);
    if (error) {
      toast.error("Could not send the document");
      return;
    }
    setEmailOpen(false);
    setRecipients("");
    setEmailNote("");
    toast.success("Signed document sent");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!doc) {
    const offline = loadError === "connection";
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="tech-card border-0 rounded-2xl p-10 text-center max-w-md">
          <FileSignature className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-semibold mb-2">
            {offline ? "Connection problem" : "Document not available"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {offline
              ? "We could not reach the signing service. Your link is fine — try again in a moment."
              : "This signing link is invalid, expired or was removed by its owner."}
          </p>
          {offline && (
            <Button className="mt-5" onClick={() => void refresh(false)}>
              Try again
            </Button>
          )}
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background/80 relative z-10 pb-28">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-3xl w-full">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase">
              {t("sign.view.secure")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => navigate(`/sign/${token}/edit`)}
              >
                <Pencil className="h-4 w-4" />
                Edit file
              </Button>
            )}
            <LanguageSelector />
          </div>

        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">{doc.title}</h1>
        {doc.signer_message && (
          <p className="text-muted-foreground mb-3">{doc.signer_message}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <AccessBadge mode={doc.access_mode} />
          <p className="text-xs text-muted-foreground">{ACCESS_LABEL[doc.access_mode].help}</p>
        </div>

        {liveNotice && <LiveNotice message={liveNotice} />}

        {!doc.file_url && originalHtml && !canEdit && (
          <DocumentLanguageBar
            html={originalHtml}
            translated={!!translatedHtml}
            onTranslated={setTranslatedHtml}
            className="mb-4"
          />
        )}

        {canEdit && (
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 rounded-xl border border-border/50 bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">
              {dirty
                ? "You have unsaved changes — save to publish them to everyone."
                : "Live document — type anywhere to edit."}
            </span>
            <Button size="sm" onClick={saveLiveEdit} disabled={!dirty || savingEdit}>
              {savingEdit ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save changes
            </Button>
          </div>
        )}

        <article className="tech-card border-0 rounded-2xl p-2 sm:p-4 overflow-hidden max-w-full">
          {doc.file_url ? (
            <iframe
              src={doc.file_url}
              title={doc.title}
              className="w-full h-[60vh] sm:h-[70vh] rounded-xl border border-border/50"
            />
          ) : (
            <div className="sign-doc-view overflow-x-auto max-w-full rounded-xl p-4 sm:p-10 shadow-lg">
              <style>{`
                /* The document always renders as real paper: white sheet, ink-dark text,
                   independent of the app theme, so every word stays readable. */
                .sign-doc-view { background: #ffffff; color: #111827; }
                .sign-doc-view *, .sign-doc-view p, .sign-doc-view span, .sign-doc-view div,
                .sign-doc-view li, .sign-doc-view td, .sign-doc-view th, .sign-doc-view strong,
                .sign-doc-view em, .sign-doc-view h1, .sign-doc-view h2, .sign-doc-view h3,
                .sign-doc-view h4, .sign-doc-view h5, .sign-doc-view h6 { color: #111827 !important; }
                .sign-doc-view a { color: #1d4ed8 !important; }
                .sign-doc-view .sfh-sign-field, .sign-doc-view .sfh-sign-field::after { color: #1d4ed8 !important; }
                .sign-doc-view * { max-width: 100% !important; box-sizing: border-box; }
                .sign-doc-view img, .sign-doc-view svg, .sign-doc-view video { height: auto !important; }
                .sign-doc-view table { display: block; width: 100% !important; overflow-x: auto; }
                .sign-doc-view [style*="width"] { width: auto !important; }
                .sign-doc-view p, .sign-doc-view h1, .sign-doc-view h2, .sign-doc-view h3, .sign-doc-view li, .sign-doc-view span, .sign-doc-view div { overflow-wrap: anywhere; word-break: break-word; }
              `}</style>
              {canEdit ? (
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={() => {
                    if (!dirty) setDirty(true);
                    setSuspended(true);
                    if (draftBroadcastTimerRef.current) clearTimeout(draftBroadcastTimerRef.current);
                    draftBroadcastTimerRef.current = setTimeout(() => {
                      const contentHtml = editorRef.current?.innerHTML;
                      if (contentHtml) void broadcastDraft(contentHtml, name);
                    }, 180);
                    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
                    autosaveTimerRef.current = setTimeout(() => {
                      void autosaveLiveEdit();
                    }, 2500);
                  }}
                  className="prose prose-sm sm:prose-base max-w-none whitespace-pre-wrap break-words outline-none focus:ring-2 focus:ring-primary/30 rounded-lg"
                />
              ) : (
                <PaperDocumentView
                  html={html}
                  contentRef={(el) => {
                    (viewRef as any).current = el;
                  }}
                />
              )}

            </div>
          )}
        </article>

        <SignatureStrip signatures={signatures} />
        <ActivityLedger entries={ledger} />

        {/* Off-screen printable rendition used to build the signed PDF */}
        <article
          ref={docRef as any}
          aria-hidden="true"
          style={{
            position: "fixed",
            left: "-10000px",
            top: 0,
            width: "760px",
            padding: "48px",
            background: "#ffffff",
            color: "#111827",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          <p style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#0ea270", margin: 0 }}>
            Startup Factory Hub · Signature Suite
          </p>
          <h1 style={{ fontSize: 26, margin: "10px 0 6px" }}>{doc.title}</h1>
          {doc.signer_message && (
            <p style={{ color: "#4b5563", fontSize: 13, margin: "0 0 18px" }}>{doc.signer_message}</p>
          )}
          <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "18px 0" }} />
          {doc.file_url ? (
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
              Original file attached to this agreement:
              <br />
              <span style={{ wordBreak: "break-all", color: "#0ea270" }}>{doc.file_url}</span>
            </p>
          ) : (
            <div
              style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </article>

        {done && (
          <div className="tech-card border-0 rounded-2xl p-6 mt-6">
            <div className="flex items-center gap-3 mb-5">
              <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
              <div>
                <p className="font-semibold">Signature registered</p>
                <p className="text-sm text-muted-foreground">
                  Your signed PDF was downloaded automatically. You can print it or send it from
                  here.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => generatePdf(true)} disabled={generating}>
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download PDF
              </Button>
              <Button variant="outline" onClick={handlePrint} disabled={generating}>
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
              <Button variant="outline" onClick={() => setEmailOpen(true)}>
                <Mail className="h-4 w-4 mr-2" /> Send by email
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Signature action always at hand */}
      {!done && canSign && (
        <div className="fixed bottom-5 right-5 z-50">
          <Button
            size="lg"
            className="rounded-full h-14 px-6 shadow-xl"
            onClick={() => {
              pendingFieldRef.current = null;
              pendingFieldIndexRef.current = null;
              setOpen(true);
            }}
          >
            <PenTool className="h-5 w-5 mr-2" />
            Sign document
          </Button>
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen && !submitting) {
            pendingFieldRef.current = null;
            pendingFieldIndexRef.current = null;
          }
        }}
      >
        <DialogContent className="max-w-lg bg-background backdrop-blur-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sign "{doc.title}"</DialogTitle>
            <DialogDescription>
              Your name, email and signature will be attached to this document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Signature</Label>
              <SignaturePad onChange={setSignature} />
            </div>
            <Button onClick={submit} disabled={submitting || !signature} className="w-full">
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PenTool className="h-4 w-4 mr-2" />
              )}
              Confirm signature
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Identify the editor before their first live save */}
      <Dialog open={askName} onOpenChange={setAskName}>
        <DialogContent className="max-w-sm bg-background backdrop-blur-none">
          <DialogHeader>
            <DialogTitle>Who is editing?</DialogTitle>
            <DialogDescription>
              Your name is recorded in the activity ledger next to every change.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label>Email (optional)</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (name.trim().length < 2) return toast.error("Enter your name");
                setAskName(false);
                void saveLiveEdit();
              }}
            >
              <Save className="h-4 w-4 mr-2" /> Save changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-md bg-background backdrop-blur-none">
          <DialogHeader>
            <DialogTitle>Send the signed document</DialogTitle>
            <DialogDescription>
              Sent through the Startup Factory Hub email system with the signed PDF attached.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Recipients</Label>
              <Input
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="legal@company.com, ceo@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Message (optional)</Label>
              <Textarea
                value={emailNote}
                onChange={(e) => setEmailNote(e.target.value)}
                rows={3}
                placeholder="Attached is the fully signed copy."
              />
            </div>
            <Button onClick={sendByEmail} disabled={sending} className="w-full">
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
