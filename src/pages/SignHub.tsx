import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Check,
  Copy,
  FileSignature,
  FileText,
  Link as LinkIcon,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  Users,
  Zap,
} from "lucide-react";
import SignedDocActions from "@/components/sign/SignedDocActions";
import TemplateComposer from "@/components/sign/TemplateComposer";

const CACHE_KEY = "sfh_sign_documents_cache_v1";
const YEAR_SECONDS = 60 * 60 * 24 * 365;

interface SignDoc {
  id: string;
  title: string;
  source_type: string;
  content_html: string | null;
  file_url: string | null;
  signer_message: string | null;
  status: string;
  share_token: string;
  created_at: string;
  updated_at: string;
}

interface SignatureRow {
  id: string;
  document_id: string;
  signer_name: string;
  signer_email: string;
  signature_data: string;
  signed_at: string;
}

const readCache = (): SignDoc[] => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as SignDoc[]) : [];
  } catch {
    return [];
  }
};

const writeCache = (docs: SignDoc[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(docs));
  } catch {
    /* quota — ignore */
  }
};

export default function SignHub() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [docs, setDocs] = useState<SignDoc[]>(readCache);
  const [signatures, setSignatures] = useState<SignatureRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"template" | "lightpaper" | "upload" | "write">("template");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [body, setBody] = useState("");
  const [projectId, setProjectId] = useState<string>("none");
  const [projects, setProjects] = useState<{ id: string; title: string; content: any; updated_at: string }[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [templateHtml, setTemplateHtml] = useState<string>("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/sign");
  }, [authLoading, user, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: docData, error }, { data: sigData }] = await Promise.all([
      supabase.from("sign_documents").select("*").order("updated_at", { ascending: false }),
      supabase.from("sign_signatures").select("*").order("signed_at", { ascending: false }),
    ]);
    setLoading(false);
    if (error) {
      toast.error("Could not load your documents");
      return;
    }
    const list = (docData ?? []) as SignDoc[];
    setDocs(list);
    writeCache(list);
    setSignatures((sigData ?? []) as SignatureRow[]);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("lightpaper_projects")
      .select("id, title, content, updated_at")
      .eq("project_type", "document")
      .order("updated_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        const list = (data ?? []) as any[];
        setProjects(list);
        const requested = params.get("project");
        const preset = requested && list.some((p) => p.id === requested) ? requested : null;
        if (preset) {
          setProjectId(preset);
          setTitle(list.find((p) => p.id === preset)?.title || "");
          setMode("lightpaper");
          setOpen(true);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const signaturesByDoc = useMemo(() => {
    const map: Record<string, SignatureRow[]> = {};
    signatures.forEach((s) => {
      (map[s.document_id] ||= []).push(s);
    });
    return map;
  }, [signatures]);

  const stats = useMemo(() => {
    const signed = docs.filter((d) => (signaturesByDoc[d.id] ?? []).length > 0).length;
    return {
      total: docs.length,
      signatures: signatures.length,
      pending: docs.length - signed,
      rate: docs.length ? Math.round((signed / docs.length) * 100) : 0,
    };
  }, [docs, signatures, signaturesByDoc]);

  const shareUrl = (token: string) => `${window.location.origin}/sign/${token}`;

  const copyLink = async (doc: SignDoc) => {
    await navigator.clipboard.writeText(shareUrl(doc.share_token));
    setCopiedId(doc.id);
    toast.success("Signing link copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setBody("");
    setProjectId("none");
    setFile(null);
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!file || !user) return null;
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${user.id}/${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from("sign-documents").upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) {
      toast.error("Upload failed");
      return null;
    }
    const { data } = await supabase.storage
      .from("sign-documents")
      .createSignedUrl(path, YEAR_SECONDS);
    return data?.signedUrl ?? null;
  };

  const createDoc = async () => {
    if (!user) return;
    if (!title.trim()) return toast.error("Add a title");

    let html: string | null = null;
    let fileUrl: string | null = null;
    let source = "html";
    let linkedProject: string | null = null;

    setCreating(true);
    try {
      if (mode === "template") {
        html = templateHtml.trim() || null;
        if (!html) {
          setCreating(false);
          return toast.error("Completa la plantilla antes de crear el documento");
        }
        source = "template";
      } else if (mode === "lightpaper") {
        if (projectId === "none") {
          setCreating(false);
          return toast.error("Pick a LightPaper document");
        }
        const project = projects.find((p) => p.id === projectId);
        const content = project?.content as any;
        html = (content?.html as string) || (content?.text as string) || null;
        if (!html) {
          setCreating(false);
          return toast.error("That LightPaper has no readable content yet");
        }
        source = "lightpaper";
        linkedProject = projectId;
      } else if (mode === "upload") {
        if (!file) {
          setCreating(false);
          return toast.error("Choose a file to upload");
        }
        fileUrl = await uploadFile();
        if (!fileUrl) {
          setCreating(false);
          return;
        }
        source = "upload";
      } else {
        html = body.trim() || null;
        if (!html) {
          setCreating(false);
          return toast.error("Write the content of the agreement");
        }
      }

      const { data, error } = await supabase
        .from("sign_documents")
        .insert({
          owner_id: user.id,
          title: title.trim(),
          signer_message: message.trim() || null,
          content_html: html,
          file_url: fileUrl,
          source_type: source,
          project_id: linkedProject,
          status: "sent",
        })
        .select("*")
        .maybeSingle();

      if (error || !data) {
        toast.error("Could not create the document");
        return;
      }
      const doc = data as SignDoc;
      const next = [doc, ...docs];
      setDocs(next);
      writeCache(next);
      setOpen(false);
      resetForm();
      await navigator.clipboard.writeText(shareUrl(doc.share_token)).catch(() => {});
      toast.success("Document ready — signing link copied");
    } finally {
      setCreating(false);
    }
  };

  const remove = async (doc: SignDoc) => {
    const { error } = await supabase.from("sign_documents").delete().eq("id", doc.id);
    if (error) return toast.error("Could not delete");
    const next = docs.filter((d) => d.id !== doc.id);
    setDocs(next);
    writeCache(next);
    toast.success("Document deleted");
  };

  const openNew = (m: typeof mode) => {
    setMode(m);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Ambient luxury backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute top-40 -right-32 h-[26rem] w-[26rem] rounded-full bg-accent/20 blur-[120px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
        <div className="flex items-center justify-between gap-3 mb-8">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link to="/lightpaper">
              <ArrowLeft className="h-4 w-4" /> LightPaper
            </Link>
          </Button>
          <Button variant="outline" size="icon" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>

        {/* Hero */}
        <header className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-5">
            <FileSignature className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-primary">
              Signature Suite
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05] mb-4">
            Sign anything,
            <span className="block bg-gradient-to-r from-primary via-primary/70 to-accent bg-clip-text text-transparent">
              beautifully and securely
            </span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            Bring your latest LightPaper, upload a contract or write it here. Share one link and
            collect traceable signatures — no accounts required for your signers.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
            <Button size="lg" className="rounded-full px-6" onClick={() => openNew("template")}>
              <Sparkles className="h-4 w-4 mr-2" /> Crear desde plantilla
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-6"
              onClick={() => navigate("/sign/studio")}
            >
              <FileText className="h-4 w-4 mr-2" /> Abrir LightPaper completo
            </Button>
            <Button


              size="lg"
              variant="outline"
              className="rounded-full px-6"
              onClick={() => openNew("upload")}
            >
              <UploadCloud className="h-4 w-4 mr-2" /> Upload a document
            </Button>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-12">
          {[
            { label: "Documents", value: stats.total, icon: FileText },
            { label: "Signatures", value: stats.signatures, icon: Users },
            { label: "Awaiting", value: stats.pending, icon: Send },
            { label: "Completion", value: `${stats.rate}%`, icon: Zap },
          ].map((s) => (
            <div key={s.label} className="tech-card border-0 rounded-2xl p-4 sm:p-5">
              <s.icon className="h-4 w-4 text-primary mb-3" />
              <p className="text-2xl sm:text-3xl font-bold tabular-nums">{s.value}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section className="grid md:grid-cols-3 gap-4 mb-12">
          {[
            {
              step: "01",
              title: "Bring the document",
              desc: "Pull the latest version of any LightPaper, upload a PDF or image, or write the agreement inline.",
              icon: FileText,
            },
            {
              step: "02",
              title: "Share one link",
              desc: "Every document gets a private link. Send it to as many participants as you need.",
              icon: LinkIcon,
            },
            {
              step: "03",
              title: "Collect signatures",
              desc: "Signers add their name, email and hand-drawn signature. Everything lands in your dashboard.",
              icon: ShieldCheck,
            },
          ].map((s) => (
            <div
              key={s.step}
              className="tech-card border-0 rounded-2xl p-6 group hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <s.icon className="h-5 w-5 text-primary" />
                <span className="text-xs font-mono text-muted-foreground/60">{s.step}</span>
              </div>
              <h3 className="font-semibold mb-1.5">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </section>

        {/* Documents */}
        <section>
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-semibold">Your documents</h2>
            <Button size="sm" onClick={() => openNew("lightpaper")}>
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </div>

          {docs.length === 0 && !loading ? (
            <div className="tech-card border-0 rounded-3xl p-12 text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <FileSignature className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Nothing to sign yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Create your first document and share the link — signatures appear here in real time.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {docs.map((doc) => {
                const sigs = signaturesByDoc[doc.id] ?? [];
                return (
                  <article
                    key={doc.id}
                    className="tech-card border-0 rounded-2xl p-5 flex flex-col gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold truncate">{doc.title}</h3>
                          <Badge variant={sigs.length ? "default" : "secondary"} className="shrink-0">
                            {sigs.length ? `${sigs.length} signed` : "Awaiting"}
                          </Badge>
                        </div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          {doc.source_type === "upload"
                            ? "Uploaded file"
                            : doc.source_type === "lightpaper"
                              ? "LightPaper"
                              : "Written here"}{" "}
                          · {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => remove(doc)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <Progress value={sigs.length ? 100 : 15} className="h-1.5" />

                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyLink(doc)}>
                        {copiedId === doc.id ? (
                          <Check className="h-4 w-4 mr-1" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        Copy link
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/sign/${doc.share_token}`} target="_blank">
                          Open
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Send by WhatsApp"
                        onClick={() =>
                          window.open(
                            `https://wa.me/?text=${encodeURIComponent(
                              `${doc.title} — firma aquí: ${shareUrl(doc.share_token)}`
                            )}`,
                            "_blank",
                            "noopener"
                          )
                        }
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Send by email"
                        onClick={() => {
                          window.location.href = `mailto:?subject=${encodeURIComponent(
                            `Firma requerida: ${doc.title}`
                          )}&body=${encodeURIComponent(
                            `${doc.signer_message || "Por favor revisa y firma este documento."}\n\n${shareUrl(doc.share_token)}`
                          )}`;
                        }}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Share"
                        onClick={async () => {
                          const url = shareUrl(doc.share_token);
                          if (navigator.share) {
                            try {
                              await navigator.share({ title: doc.title, url });
                              return;
                            } catch {
                              /* cancelled */
                            }
                          }
                          await navigator.clipboard.writeText(url);
                          toast.success("Signing link copied");
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      {sigs.length > 0 && (
                        <SignedDocActions
                          title={doc.title}
                          shareToken={doc.share_token}
                          contentHtml={doc.content_html}
                          fileUrl={doc.file_url}
                          signers={sigs}
                        />
                      )}
                    </div>

                    {sigs.length > 0 && (
                      <div className="border-t border-border/50 pt-4">
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
                          <Users className="h-3.5 w-3.5" /> Signatures
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {sigs.map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center gap-3 rounded-xl bg-muted/40 p-3"
                            >
                              <img
                                src={s.signature_data}
                                alt={`Signature of ${s.signer_name}`}
                                className="h-12 w-24 object-contain bg-white rounded"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{s.signer_name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {s.signer_email}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {new Date(s.signed_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-12">
          <Lock className="h-3.5 w-3.5" /> Documents are stored privately and shared only through
          your signed link.
        </p>
      </div>

      {/* Create dialog */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <DialogContent className="max-w-lg bg-background backdrop-blur-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New signing document</DialogTitle>
            <DialogDescription>
              Choose the source, share the link, collect signatures.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="template">Plantillas</TabsTrigger>
              <TabsTrigger value="lightpaper">LightPaper</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="write">Write</TabsTrigger>
            </TabsList>


            <div className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Mutual NDA — Startup Factory Hub"
                />
              </div>

              <TabsContent value="template" className="m-0">
                <TemplateComposer
                  onHtmlChange={setTemplateHtml}
                  onTitleSuggest={(t) => setTitle((cur) => cur.trim() || t)}
                />
              </TabsContent>

              <TabsContent value="lightpaper" className="m-0 space-y-1.5">

                <Label>Latest LightPaper versions</Label>
                <Select
                  value={projectId}
                  onValueChange={(v) => {
                    setProjectId(v);
                    if (!title.trim()) setTitle(projects.find((p) => p.id === v)?.title || "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a document" />
                  </SelectTrigger>
                  <SelectContent className="bg-background backdrop-blur-none">
                    <SelectItem value="none">Select a document</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title || "Untitled"} · {new Date(p.updated_at).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Always pulls the most recently saved version of that LightPaper.
                </p>
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() =>
                    navigate(projectId !== "none" ? `/sign/studio?project=${projectId}` : "/sign/studio")
                  }
                >
                  <FileText className="h-4 w-4 mr-2" /> Editar en LightPaper completo
                </Button>
              </TabsContent>

              <TabsContent value="upload" className="m-0 space-y-2">
                <Label>Document file</Label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) {
                      setFile(f);
                      if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ""));
                    }
                  }}
                  onClick={() => fileRef.current?.click()}
                  className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                    dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <UploadCloud className="h-7 w-7 mx-auto mb-3 text-primary" />
                  <p className="text-sm font-medium">
                    {file ? file.name : "Drop your PDF or image here"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, PNG, JPG · up to 20MB
                  </p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFile(f);
                      if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ""));
                    }
                  }}
                />
              </TabsContent>

              <TabsContent value="write" className="m-0 space-y-1.5">
                <Label>Document content</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  placeholder="Paste the clauses or text of the agreement..."
                />
              </TabsContent>

              <div className="space-y-1.5">
                <Label>Message for the signer (optional)</Label>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please review and sign before Friday."
                />
              </div>

              <Button onClick={createDoc} disabled={creating} className="w-full">
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LinkIcon className="h-4 w-4 mr-2" />
                )}
                Create and copy link
              </Button>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
