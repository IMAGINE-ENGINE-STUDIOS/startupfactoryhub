import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Eye,
  FileSignature,
  Loader2,
  Save,
  ShieldAlert,
} from "lucide-react";
import { LightPaperDocument } from "@/components/lightpaper/LightPaperDocument";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";

type AccessMode = "view" | "sign" | "edit";

interface SignFileRow {
  id: string;
  title: string;
  content_html: string | null;
  file_url: string | null;
  access_mode: AccessMode;
  share_token: string;
}

/**
 * Owner-only full editor for a shared signing file.
 * Opens the exact document behind /sign/:token inside LightPaper so the owner
 * can rewrite it, rename it and change link permissions, then push the update
 * to everyone holding the link.
 */
export default function SignFileEditor() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [row, setRow] = useState<SignFileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [title, setTitle] = useState("");
  const [accessMode, setAccessMode] = useState<AccessMode>("sign");
  const [saving, setSaving] = useState(false);
  const [seed, setSeed] = useState<{ content: string; title: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate(`/auth?redirect=/sign/${token}/edit`);
  }, [authLoading, user, token, navigate]);

  useEffect(() => {
    if (!user || !token) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("sign_documents")
        .select("id,title,content_html,file_url,access_mode,share_token")
        .eq("share_token", token)
        .maybeSingle();
      if (!active) return;
      if (error || !data) {
        setDenied(true);
        setLoading(false);
        return;
      }
      const doc = data as SignFileRow;
      setRow(doc);
      setTitle(doc.title || "Document");
      setAccessMode((doc.access_mode as AccessMode) || "sign");
      setSeed({ content: doc.content_html || "", title: doc.title || "Document" });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user, token]);

  /** Pull the current HTML out of the LightPaper editor. */
  const requestContent = useCallback(() => {
    return new Promise<{ title: string; html: string }>((resolve) => {
      const handler = (e: Event) => {
        window.removeEventListener("lightpaper-content-response", handler);
        resolve((e as CustomEvent).detail);
      };
      window.addEventListener("lightpaper-content-response", handler);
      window.dispatchEvent(new Event("lightpaper-request-content"));
      setTimeout(() => {
        window.removeEventListener("lightpaper-content-response", handler);
        resolve({ title: "", html: "" });
      }, 1500);
    });
  }, []);

  const save = async () => {
    if (!token || !row) return;
    setSaving(true);
    try {
      const detail = await requestContent();
      const html = (detail?.html || "").trim();
      if (!html || html.replace(/<[^>]*>/g, "").trim().length === 0) {
        toast.error("The document is empty — write something before saving");
        return;
      }

      const { error } = await supabase
        .from("sign_documents")
        .update({
          title: title.trim() || "Document",
          content_html: html,
          access_mode: accessMode,
        })
        .eq("id", row.id);

      if (error) {
        toast.error("Could not save the document");
        return;
      }

      // Log the change in the activity ledger and notify everyone on the link.
      await supabase.rpc("save_sign_document_by_token", {
        _token: token,
        _content_html: html,
        _editor_name: user?.email?.split("@")[0] || "Owner",
        _editor_email: user?.email || null,
        _summary: "owner edit",
      });
      const channel = supabase.channel(`sign-document:${token}`);
      await channel.subscribe();
      await channel.send({
        type: "broadcast",
        event: "document-change",
        payload: { clientId: "owner-editor", editorName: "The owner", action: "edit" },
      });
      void supabase.removeChannel(channel);

      toast.success("Saved — everyone with the link sees the new version");
    } finally {
      setSaving(false);
    }
  };

  const shareLink = typeof window !== "undefined" ? `${window.location.origin}/sign/${token}` : "";

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (denied || !row) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="tech-card border-0 rounded-2xl p-10 text-center max-w-md">
          <ShieldAlert className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-semibold mb-2">Editing not available</h1>
          <p className="text-sm text-muted-foreground mb-5">
            Only the owner of this file can open it in the full editor.
          </p>
          <Button variant="outline" onClick={() => navigate(`/sign/${token}`)}>
            Open the signing view
          </Button>
        </div>
      </div>
    );
  }

  if (row.file_url) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="tech-card border-0 rounded-2xl p-10 text-center max-w-md">
          <FileSignature className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-semibold mb-2">Uploaded file</h1>
          <p className="text-sm text-muted-foreground mb-5">
            This link points to an uploaded file, so it cannot be edited as text. Create a new
            document in Sign Studio to get a fully editable version.
          </p>
          <Button onClick={() => navigate("/sign/studio")}>Open Sign Studio</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="border-b tech-card border-0 flex-shrink-0">
        <div className="px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => navigate(`/sign/${token}`)}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <FileSignature className="h-5 w-5 text-primary shrink-0" />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 w-[150px] sm:w-[260px] text-sm font-semibold"
              aria-label="Document title"
            />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Link</Label>
              <Select value={accessMode} onValueChange={(v) => setAccessMode(v as AccessMode)}>
                <SelectTrigger className="h-8 w-[150px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background backdrop-blur-none">
                  <SelectItem value="view">View only</SelectItem>
                  <SelectItem value="sign">Signable</SelectItem>
                  <SelectItem value="edit">Live document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                toast.success("Signing link copied");
              }}
            >
              <Copy className="h-4 w-4" />
              <span className="hidden lg:inline">Copy link</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => window.open(shareLink, "_blank", "noopener")}
            >
              <Eye className="h-4 w-4" />
              <span className="hidden lg:inline">Preview</span>
            </Button>
            <Button size="sm" className="h-8 gap-1.5 font-semibold" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline">Save changes</span>
            </Button>
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <LightPaperDocument
          uploadedContent={seed}
          onContentLoaded={() => setSeed(null)}
          onPrepareSign={save}
        />
      </div>
    </div>
  );
}
