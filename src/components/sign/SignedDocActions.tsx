import { useRef, useState } from "react";
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
import { Download, Loader2, Mail, Printer, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeHTML } from "@/utils/sanitize";
import {
  buildSignedPdf,
  pdfFileName,
  pdfToBase64,
  printPdf,
  type SignedPdfSigner,
} from "@/lib/signedPdf";

interface Props {
  title: string;
  shareToken: string;
  contentHtml: string | null;
  fileUrl: string | null;
  signers: SignedPdfSigner[];
}

export default function SignedDocActions({
  title,
  shareToken,
  contentHtml,
  fileUrl,
  signers,
}: Props) {
  const printableRef = useRef<HTMLDivElement | null>(null);
  const pdfRef = useRef<import("jspdf").default | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [recipients, setRecipients] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const build = async () => {
    if (!printableRef.current) return null;
    if (pdfRef.current) return pdfRef.current;
    setBusy(true);
    try {
      const pdf = await buildSignedPdf(printableRef.current, title, signers);
      pdfRef.current = pdf;
      return pdf;
    } catch (e) {
      console.error(e);
      toast.error("Could not generate the PDF");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    const pdf = await build();
    pdf?.save(pdfFileName(title));
  };

  const print = async () => {
    const pdf = await build();
    if (pdf) printPdf(pdf);
  };

  const send = async () => {
    const list = recipients
      .split(/[,\s;]+/)
      .map((r) => r.trim())
      .filter(Boolean);
    if (!list.length) return toast.error("Add at least one email");
    if (list.some((r) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r)))
      return toast.error("Check the email addresses");

    setSending(true);
    const pdf = await build();
    const { error } = await supabase.functions.invoke("send-signed-document", {
      body: {
        token: shareToken,
        to: list,
        message: message.trim() || undefined,
        pdfBase64: pdf ? pdfToBase64(pdf) : undefined,
        fileName: pdfFileName(title),
      },
    });
    setSending(false);
    if (error) return toast.error("Could not send the document");
    setOpen(false);
    setRecipients("");
    setMessage("");
    toast.success("Signed document sent");
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={download} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
        Signed PDF
      </Button>
      <Button variant="outline" size="sm" onClick={print} disabled={busy}>
        <Printer className="h-4 w-4 mr-1" /> Print
      </Button>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Mail className="h-4 w-4 mr-1" /> Send
      </Button>

      {/* Off-screen printable rendition */}
      <div
        ref={printableRef}
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
        <h1 style={{ fontSize: 26, margin: "10px 0 6px" }}>{title}</h1>
        <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "18px 0" }} />
        {fileUrl ? (
          <p style={{ fontSize: 13, lineHeight: 1.7 }}>
            Original file attached to this agreement:
            <br />
            <span style={{ wordBreak: "break-all", color: "#0ea270" }}>{fileUrl}</span>
          </p>
        ) : (
          <div
            style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" }}
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(contentHtml || "") }}
          />
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-background backdrop-blur-none">
          <DialogHeader>
            <DialogTitle>Send the signed document</DialogTitle>
            <DialogDescription>
              Delivered through the Startup Factory Hub email system with the signed PDF attached.
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
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
            </div>
            <Button onClick={send} disabled={sending} className="w-full">
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
    </>
  );
}
