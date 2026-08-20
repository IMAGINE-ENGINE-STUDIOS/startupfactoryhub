import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Check,
  Copy,
  FileSignature,
  FileText,
  Link as LinkIcon,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";

const CACHE_KEY = "sfh_sign_documents_cache_v1";

interface SignDoc {
  id: string;
  title: string;
  source_type: string;
  content_html: string | null;
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

  const [docs, setDocs] = useState<SignDoc[]>(readCache);
  const [signatures, setSignatures] = useState<SignatureRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [body, setBody] = useState("");
  const [projectId, setProjectId] = useState<string>("none");
  const [projects, setProjects] = useState<{ id: string; title: string; content: any }[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/sign");
  }, [authLoading, user, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: docData, error }, { data: sigData }] = await Promise.all([
      supabase
        .from("sign_documents")
        .select("*")
        .order("updated_at", { ascending: false }),
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
      .select("id, title, content")
      .eq("project_type", "document")
      .order("updated_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setProjects((data ?? []) as any));
  }, [user]);

  const signaturesByDoc = useMemo(() => {
    const map: Record<string, SignatureRow[]> = {};
    signatures.forEach((s) => {
      (map[s.document_id] ||= []).push(s);
    });
    return map;
  }, [signatures]);

  const shareUrl = (token: string) => `${window.location.origin}/sign/${token}`;

  const copyLink = async (doc: SignDoc) => {
    await navigator.clipboard.writeText(shareUrl(doc.share_token));
    setCopiedId(doc.id);
    toast.success("Signing link copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const createDoc = async () => {
    if (!user) return;
    if (!title.trim()) {
      toast.error("Add a title");
      return;
    }
    let html = body.trim();
    let source: string = "html";
    let linkedProject: string | null = null;

    if (projectId !== "none") {
      const project = projects.find((p) => p.id === projectId);
      const content = project?.content as any;
      html = (content?.html as string) || (content?.text as string) || html;
      source = "lightpaper";
      linkedProject = projectId;
    }

    if (!html) {
      toast.error("Add the document content or pick a LightPaper");
      return;
    }

    setCreating(true);
    const { data, error } = await supabase
      .from("sign_documents")
      .insert({
        owner_id: user.id,
        title: title.trim(),
        signer_message: message.trim() || null,
        content_html: html,
        source_type: source,
        project_id: linkedProject,
        status: "sent",
      })
      .select("*")
      .maybeSingle();
    setCreating(false);

    if (error || !data) {
      toast.error("Could not create the document");
      return;
    }
    const doc = data as SignDoc;
    const next = [doc, ...docs];
    setDocs(next);
    writeCache(next);
    setOpen(false);
    setTitle("");
    setMessage("");
    setBody("");
    setProjectId("none");
    await navigator.clipboard.writeText(shareUrl(doc.share_token)).catch(() => {});
    toast.success("Document ready — signing link copied");
  };

  const remove = async (doc: SignDoc) => {
    const { error } = await supabase.from("sign_documents").delete().eq("id", doc.id);
    if (error) {
      toast.error("Could not delete");
      return;
    }
    const next = docs.filter((d) => d.id !== doc.id);
    setDocs(next);
    writeCache(next);
    toast.success("Document deleted");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <FileSignature className="h-5 w-5" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase">
                Secure Signing
              </span>
            </div>
            <h1 className="text-3xl font-bold">Documents to Sign</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create a document, share the link, and collect legally traceable signatures.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={load} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1" /> New document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-background backdrop-blur-none max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>New signing document</DialogTitle>
                  <DialogDescription>
                    Use a LightPaper you already wrote, or paste the content directly.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Mutual NDA — Startup Factory Hub"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Message for the signer (optional)</Label>
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please review and sign before Friday."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>LightPaper source</Label>
                    <Select value={projectId} onValueChange={setProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="None — paste content" />
                      </SelectTrigger>
                      <SelectContent className="bg-background backdrop-blur-none">
                        <SelectItem value="none">None — paste content</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.title || "Untitled"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {projectId === "none" && (
                    <div className="space-y-1.5">
                      <Label>Document content</Label>
                      <Textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={8}
                        placeholder="Paste the clauses or text of the agreement..."
                      />
                    </div>
                  )}
                  <Button onClick={createDoc} disabled={creating} className="w-full">
                    {creating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <LinkIcon className="h-4 w-4 mr-2" />
                    )}
                    Create and copy link
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {docs.length === 0 && !loading ? (
          <div className="tech-card border-0 rounded-2xl p-12 text-center">
            <FileText className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-1">No documents yet</h2>
            <p className="text-muted-foreground text-sm">
              Create your first document and send the link to be signed.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {docs.map((doc) => {
              const sigs = signaturesByDoc[doc.id] ?? [];
              return (
                <div key={doc.id} className="tech-card border-0 rounded-2xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{doc.title}</h3>
                        <Badge variant={sigs.length ? "default" : "secondary"}>
                          {sigs.length ? `${sigs.length} signed` : "Awaiting signature"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 break-all">
                        {shareUrl(doc.share_token)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
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
                      <Button variant="ghost" size="icon" onClick={() => remove(doc)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {sigs.length > 0 && (
                    <div className="mt-4 border-t border-border/50 pt-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
