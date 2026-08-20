import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
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
  PenTool,
  Printer,
  Send,
  ShieldCheck,
} from "lucide-react";
import { buildSignedPdf, pdfFileName, pdfToBase64, printPdf } from "@/lib/signedPdf";

const SIGNER_KEY = "sfh_signer_identity_v1";

interface SharedDoc {
  id: string;
  title: string;
  source_type: string;
  file_url: string | null;
  content_html: string | null;
  signer_message: string | null;
  status: string;
  created_at: string;
}

export default function SignDocument() {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();

  const [doc, setDoc] = useState<SharedDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [signature, setSignature] = useState<string | null>(null);

  const docRef = useRef<HTMLElement | null>(null);
  const pdfRef = useRef<import("jspdf").default | null>(null);
  const [generating, setGenerating] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [recipients, setRecipients] = useState("");
  const [emailNote, setEmailNote] = useState("");
  const [sending, setSending] = useState(false);

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

  useEffect(() => {
    if (!token) return;
    let active = true;
    supabase
      .rpc("get_sign_document_by_token", { _token: token })
      .then(({ data, error }) => {
        if (!active) return;
        setLoading(false);
        if (error) {
          toast.error("This link is not valid");
          return;
        }
        const row = Array.isArray(data) ? data[0] : data;
        setDoc((row as SharedDoc) ?? null);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const html = useMemo(
    () => (doc?.content_html ? sanitizeHTML(doc.content_html) : ""),
    [doc?.content_html]
  );

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
      _note: note.trim() || null,
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
    setOpen(false);
    setDone(true);
    toast.success("Signature registered");
    // Auto-download the signed PDF, DocuSign style
    await generatePdf(true);
  };

  const generatePdf = async (download = false) => {
    if (!doc || !docRef.current) return null;
    setGenerating(true);
    try {
      const pdf =
        pdfRef.current ??
        (await buildSignedPdf(docRef.current, doc.title, [
          {
            signer_name: name.trim(),
            signer_email: email.trim(),
            signature_data: signature || "",
            signed_at: new Date().toISOString(),
          },
        ]));
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
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="tech-card border-0 rounded-2xl p-10 text-center max-w-md">
          <FileSignature className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-semibold mb-2">Document not available</h1>
          <p className="text-sm text-muted-foreground">
            This signing link is invalid, expired or was removed by its owner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-2 text-primary mb-2">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-semibold tracking-[0.2em] uppercase">
            Startup Factory Hub · Secure Signing
          </span>
        </div>
        <h1 className="text-3xl font-bold mb-2">{doc.title}</h1>
        {doc.signer_message && (
          <p className="text-muted-foreground mb-6">{doc.signer_message}</p>
        )}

        <article className="tech-card border-0 rounded-2xl p-6 sm:p-10 bg-card">
          {doc.file_url ? (
            <iframe
              src={doc.file_url}
              title={doc.title}
              className="w-full h-[70vh] rounded-xl border border-border/50"
            />
          ) : (
            <div
              className="prose prose-sm sm:prose-base dark:prose-invert max-w-none whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </article>

        {done && (
          <div className="tech-card border-0 rounded-2xl p-6 mt-6 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="font-semibold">Signature registered</p>
              <p className="text-sm text-muted-foreground">
                The document owner has been notified in their dashboard.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Signature action always at hand */}
      {!done && (
        <div className="fixed bottom-5 right-5 z-50">
          <Button
            size="lg"
            className="rounded-full h-14 px-6 shadow-xl"
            onClick={() => setOpen(true)}
          >
            <PenTool className="h-5 w-5 mr-2" />
            Sign document
          </Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
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
            <div className="space-y-1.5">
              <Label>Note (optional)</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
            </div>
            <Button onClick={submit} disabled={submitting} className="w-full">
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
    </div>
  );
}
