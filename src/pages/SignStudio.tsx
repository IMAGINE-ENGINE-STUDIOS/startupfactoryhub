import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
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
import { AlignCenter, AlignLeft, ArrowLeft, Bold, Copy, Eye, FileSignature, Italic, LayoutTemplate, List, Loader2, Mail, MessageCircle, Send, Share2, Underline, Users } from "lucide-react";
import { LightPaperDocument } from "@/components/lightpaper/LightPaperDocument";
import { LightPaperProject } from "@/hooks/useLightPaperProjects";
import { ThemeToggle } from "@/components/ThemeToggle";
import TemplateGallery from "@/components/sign/TemplateGallery";

const ACCESS_OPTIONS = [
  {
    value: "view" as const,
    icon: Eye,
    title: "Solo lectura",
    help: "Pueden abrir y leer el documento. Sin ediciones ni firmas.",
  },
  {
    value: "sign" as const,
    icon: FileSignature,
    title: "Firmable",
    help: "Pueden leer y firmar. El texto queda bloqueado.",
  },
  {
    value: "edit" as const,
    icon: Users,
    title: "Documento vivo (editar + firmar)",
    help: "Todos editan el mismo documento en vivo y pueden firmarlo. Cada cambio queda en la bitácora con el nombre del autor.",
  },
];


export default function SignStudio({ embedded = false }: { embedded?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();


  const [project, setProject] = useState<LightPaperProject | null>(null);
  const [uploadedContent, setUploadedContent] = useState<{ content: string; title: string } | null>(
    null
  );
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [pendingHtml, setPendingHtml] = useState("");
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [accessMode, setAccessMode] = useState<"view" | "sign" | "edit">("sign");


  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/sign/studio");
  }, [authLoading, user, navigate]);

  // Load the requested LightPaper, or the most recent one
  useEffect(() => {
    if (!user) return;
    const requested = params.get("project");
    const run = async () => {
      let query = supabase
        .from("lightpaper_projects")
        .select("*")
        .eq("project_type", "document");
      if (requested) query = query.eq("id", requested);
      const { data } = await query.order("updated_at", { ascending: false }).limit(1);
      const found = (data ?? [])[0] as LightPaperProject | undefined;
      if (found) {
        setProject(found);
        setTitle(found.title || "");
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Prefilled content coming from a template (sessionStorage handoff)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("sfh_sign_studio_prefill");
      if (raw) {
        const parsed = JSON.parse(raw);
        sessionStorage.removeItem("sfh_sign_studio_prefill");
        if (parsed?.content) {
          setProject(null);
          setUploadedContent({ content: parsed.content, title: parsed.title || "Documento" });
          setTitle(parsed.title || "Documento");
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

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
      }, 1200);
    });
  }, []);

  const openPrepare = async () => {
    const detail = await requestContent();
    const html = (detail?.html || "").trim();
    if (!html || html.replace(/<[^>]*>/g, "").trim().length === 0) {
      toast.error("El documento está vacío — escribe o carga contenido primero");
      return;
    }
    setPendingHtml(html);
    if (!title.trim()) setTitle(detail?.title || project?.title || "Documento");
    setShareLink(null);
    setOpen(true);
  };

  const createSignDoc = async () => {
    if (!user) return;
    if (!title.trim()) return toast.error("Agrega un título");
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("sign_documents")
        .insert({
          owner_id: user.id,
          title: title.trim(),
          signer_message: message.trim() || null,
          content_html: pendingHtml,
          file_url: null,
          source_type: "lightpaper",
          access_mode: accessMode,
          project_id: project?.id ?? null,
          status: "sent",
        })
        .select("*")
        .maybeSingle();

      if (error || !data) {
        toast.error("No se pudo crear el documento");
        return;
      }
      const url = `${window.location.origin}/sign/${(data as any).share_token}`;
      setShareLink(url);
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Documento listo — enlace de firma copiado");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={`${embedded ? "h-full" : "h-screen"} flex flex-col bg-background overflow-hidden`}>
      <div className="border-b tech-card border-0 flex-shrink-0">
        <div className="px-3 sm:px-5 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {!embedded && (
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate("/sign")}>
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Sign</span>
              </Button>
            )}
            <div className="flex items-center gap-2 min-w-0">
              <FileSignature className="h-5 w-5 text-primary shrink-0" />
              <h1 className="text-sm sm:text-lg font-bold truncate bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Sign Studio · LightPaper
              </h1>
            </div>
          </div>

          {/* Text editing tools */}
          <div className="flex items-center gap-0.5 mr-1">
            {[
              { icon: Bold, cmd: "bold", label: "Bold", mobile: true },
              { icon: Italic, cmd: "italic", label: "Italic", mobile: true },
              { icon: Underline, cmd: "underline", label: "Underline", mobile: false },
              { icon: AlignLeft, cmd: "justifyLeft", label: "Align left", mobile: false },
              { icon: AlignCenter, cmd: "justifyCenter", label: "Align center", mobile: false },
              { icon: List, cmd: "insertUnorderedList", label: "Bullet list", mobile: false },
            ].map((t) => (
              <Button
                key={t.cmd}
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${t.mobile ? "" : "hidden sm:inline-flex"}`}
                title={t.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => document.execCommand(t.cmd, false)}
              >
                <t.icon className="h-4 w-4" />
              </Button>
            ))}

          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              title="Document templates"
              onClick={() => setShowTemplates(true)}
            >
              <LayoutTemplate className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 px-2.5 sm:px-3 font-semibold shadow-lg shadow-primary/20"
              title="Send this document for signature"
              onClick={openPrepare}
            >
              <FileSignature className="h-4 w-4" />
              <span className="hidden sm:inline">Send for signature</span>
              <span className="sm:hidden">Firmar</span>
            </Button>
            <LanguageSelector />
            <ThemeToggle />
          </div>

        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <LightPaperDocument
          selectedProject={project}
          uploadedContent={uploadedContent}
          onContentLoaded={() => setUploadedContent(null)}
          onPrepareSign={openPrepare}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-background backdrop-blur-none">
          <DialogHeader>
            <DialogTitle>Preparar documento para firma</DialogTitle>
            <DialogDescription>
              Se usará exactamente la versión actual del documento en el editor.
            </DialogDescription>
          </DialogHeader>

          {shareLink ? (
            <div className="space-y-3">
              <Label>Enlace de firma</Label>
              <div className="flex gap-2">
                <Input readOnly value={shareLink} />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    toast.success("Enlace copiado");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() =>
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(`${title} — firma aquí: ${shareLink}`)}`,
                      "_blank",
                      "noopener"
                    )
                  }
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    window.location.href = `mailto:?subject=${encodeURIComponent(
                      `Firma requerida: ${title}`
                    )}&body=${encodeURIComponent(
                      `${message || "Por favor revisa y firma este documento."}\n\n${shareLink}`
                    )}`;
                  }}
                >
                  <Mail className="h-4 w-4" /> Email
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({ title, text: `Firma: ${title}`, url: shareLink });
                        return;
                      } catch {
                        /* cancelled */
                      }
                    }
                    navigator.clipboard.writeText(shareLink);
                    toast.success("Enlace copiado");
                  }}
                >
                  <Share2 className="h-4 w-4" /> Compartir
                </Button>
              </div>
              <Button className="w-full" onClick={() => navigate("/sign")}>
                Ver mis documentos
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Permisos del enlace</Label>
                <div className="grid gap-2">
                  {ACCESS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAccessMode(opt.value)}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                        accessMode === opt.value
                          ? "border-primary bg-primary/10"
                          : "border-border/60 hover:border-primary/50"
                      }`}
                    >
                      <opt.icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{opt.title}</span>
                        <span className="block text-xs text-muted-foreground">{opt.help}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Mensaje para quien firma (opcional)</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Por favor revisa y firma este documento."
                />
              </div>
              <Button className="w-full" onClick={createSignDoc} disabled={creating}>
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileSignature className="h-4 w-4 mr-2" />
                )}
                Crear enlace de firma
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <TemplateGallery
        open={showTemplates}
        onOpenChange={setShowTemplates}
        onUse={({ html, title: t }) => {
          setProject(null);
          setUploadedContent({ content: html, title: t });
          setTitle(t);
          toast.success("Template loaded — edit and send for signature");
        }}
      />

    </div>
  );
}
