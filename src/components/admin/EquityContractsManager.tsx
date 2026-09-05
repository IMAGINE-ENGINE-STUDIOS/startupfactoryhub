import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  FileSignature,
  Send,
  Copy,
  ExternalLink,
  Users,
  Mail,
  Eye,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  Pencil,
  X,
} from "lucide-react";
import {
  buildEquityContractHtml,
  DEFAULT_EQUITY_CONTRACT,
  EquityContractValues,
  PARTNERS_URL,
  SFH_FOUNDERS,
} from "@/lib/equityContractTemplate";

interface ProfileRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface ContractRow {
  id: string;
  title: string;
  status: string;
  share_token: string;
  created_at: string;
  recipient_name: string | null;
  recipient_email: string | null;
  content_html: string | null;
  signer_message: string | null;
  signatureCount: number;
}

const CONTRACT_SOURCE = "equity_contract";
const VALUES_MARKER = "SFH_CONTRACT_VALUES:";

const embedValues = (html: string, values: EquityContractValues) =>
  `${html}\n<!--${VALUES_MARKER}${encodeURIComponent(JSON.stringify(values))}-->`;

const extractValues = (html: string | null): EquityContractValues | null => {
  if (!html) return null;
  const m = html.match(new RegExp(`<!--${VALUES_MARKER}([^>]*)-->`));
  if (!m) return null;
  try {
    return { ...DEFAULT_EQUITY_CONTRACT, ...JSON.parse(decodeURIComponent(m[1])) };
  } catch {
    return null;
  }
};

export default function EquityContractsManager() {
  const [values, setValues] = useState<EquityContractValues>(DEFAULT_EQUITY_CONTRACT);
  const [message, setMessage] = useState("");
  const [externalEmail, setExternalEmail] = useState("");
  const [externalName, setExternalName] = useState("");
  const [selectedMember, setSelectedMember] = useState<ProfileRow | null>(null);
  const [memberQuery, setMemberQuery] = useState("");
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const html = useMemo(() => buildEquityContractHtml(values), [values]);

  const clauses = values.customClauses || [];
  const setClause = (i: number, field: "title" | "body", v: string) =>
    setValues((prev) => {
      const next = [...(prev.customClauses || [])];
      next[i] = { ...next[i], [field]: v };
      return { ...prev, customClauses: next };
    });
  const addClause = () =>
    setValues((prev) => ({
      ...prev,
      customClauses: [...(prev.customClauses || []), { title: "", body: "" }],
    }));
  const removeClause = (i: number) =>
    setValues((prev) => ({
      ...prev,
      customClauses: (prev.customClauses || []).filter((_, idx) => idx !== i),
    }));


  const set = (k: keyof EquityContractValues) => (v: string) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    void loadProfiles();
    void loadContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .order("full_name", { ascending: true })
      .limit(1000);
    if (error) {
      toast.error("Could not load members");
      return;
    }
    setProfiles((data || []) as ProfileRow[]);
  };

  const loadContracts = async () => {
    setLoadingList(true);
    const { data, error } = await supabase
      .from("sign_documents")
      .select(
        "id, title, status, share_token, created_at, recipient_name, recipient_email, content_html, signer_message"
      )
      .eq("source_type", CONTRACT_SOURCE)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      setLoadingList(false);
      toast.error("Could not load contracts");
      return;
    }

    const rows = (data || []) as Omit<ContractRow, "signatureCount">[];
    let counts: Record<string, number> = {};
    if (rows.length) {
      const { data: sigs } = await supabase
        .from("sign_signatures")
        .select("document_id")
        .in(
          "document_id",
          rows.map((r) => r.id)
        );
      counts = (sigs || []).reduce<Record<string, number>>((acc, s: { document_id: string }) => {
        acc[s.document_id] = (acc[s.document_id] || 0) + 1;
        return acc;
      }, {});
    }

    setContracts(rows.map((r) => ({ ...r, signatureCount: counts[r.id] || 0 })));
    setLoadingList(false);
  };

  const filteredMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return [];
    return profiles
      .filter(
        (p) =>
          (p.full_name || "").toLowerCase().includes(q) ||
          (p.email || "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [memberQuery, profiles]);

  const recipient = selectedMember
    ? { name: selectedMember.full_name || selectedMember.email || "Member", email: selectedMember.email || "", userId: selectedMember.user_id }
    : { name: externalName.trim(), email: externalEmail.trim().toLowerCase(), userId: null };

  const shareUrl = (token: string) => `${window.location.origin}/sign/${token}`;

  const resetForm = () => {
    setValues(DEFAULT_EQUITY_CONTRACT);
    setMessage("");
    setSelectedMember(null);
    setMemberQuery("");
    setExternalEmail("");
    setExternalName("");
    setEditingId(null);
  };

  const startEditing = (row: ContractRow) => {
    const parsed = extractValues(row.content_html);
    if (!parsed) {
      toast.error("This contract was created before editing was available");
      return;
    }
    setValues(parsed);
    setMessage(row.signer_message || "");
    setSelectedMember(null);
    setMemberQuery("");
    setExternalName(row.recipient_name || "");
    setExternalEmail(row.recipient_email || "");
    setEditingId(row.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteContract = async (row: ContractRow) => {
    const { error } = await supabase.from("sign_documents").delete().eq("id", row.id);
    if (error) {
      toast.error("Could not delete the contract");
      return;
    }
    if (editingId === row.id) resetForm();
    toast.success("Draft deleted");
    void loadContracts();
  };

  const createAndSend = async (send: boolean) => {
    if (!values.companyName.trim()) {
      toast.error("Add the company name first");
      return;
    }
    if (send && !recipient.email) {
      toast.error("Choose a member or add an external email");
      return;
    }

    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const title = `Accelerator Agreement — ${values.companyName.trim()}`;
      const payload = {
        title,
        content_html: embedValues(html, values),
        signer_message:
          message.trim() ||
          "Please review and sign the Startup Factory Hub Accelerator Agreement.",
        access_mode: "sign",
        status: send ? "sent" : "draft",
        recipient_name: recipient.name || null,
        recipient_email: recipient.email || null,
        recipient_user_id: recipient.userId,
      };

      let record: { id: string; share_token: string };

      if (editingId) {
        const { data, error } = await supabase
          .from("sign_documents")
          .update(payload)
          .eq("id", editingId)
          .select("id, share_token")
          .single();
        if (error) throw error;
        record = data;
      } else {
        const { data, error } = await supabase
          .from("sign_documents")
          .insert({ ...payload, owner_id: auth.user?.id, source_type: CONTRACT_SOURCE })
          .select("id, share_token")
          .single();
        if (error) throw error;
        record = data;
      }

      if (send) {
        const { error: mailError } = await supabase.functions.invoke("send-equity-contract", {
          body: {
            to: recipient.email,
            recipientName: recipient.name,
            companyName: values.companyName.trim(),
            documentTitle: title,
            shareToken: record.share_token,
            message: message.trim() || undefined,
          },
        });
        if (mailError) throw mailError;
        toast.success(`Contract sent to ${recipient.email}`);
      } else {
        toast.success(editingId ? "Draft updated" : "Contract saved");
      }

      await loadContracts();
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the contract");
    } finally {
      setSaving(false);
    }
  };


  const resend = async (row: ContractRow) => {
    if (!row.recipient_email) {
      toast.error("This contract has no recipient email");
      return;
    }
    const { error } = await supabase.functions.invoke("send-equity-contract", {
      body: {
        to: row.recipient_email,
        recipientName: row.recipient_name || undefined,
        documentTitle: row.title,
        shareToken: row.share_token,
      },
    });
    if (error) toast.error("Could not resend the contract");
    else toast.success(`Resent to ${row.recipient_email}`);
  };

  return (
    <div className="space-y-6">
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Equity Contracts
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Prepare the Startup Factory Hub Accelerator Agreement, send it to platform members or
            external companies, and collect legally binding electronic signatures.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Effective date</Label>
              <Input
                type="date"
                value={values.effectiveDate}
                onChange={(e) => set("effectiveDate")(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Company name</Label>
              <Input
                value={values.companyName}
                onChange={(e) => set("companyName")(e.target.value)}
                placeholder="Acme Robotics Inc."
              />
            </div>
            <div className="space-y-2">
              <Label>Jurisdiction</Label>
              <Input
                value={values.jurisdiction}
                onChange={(e) => set("jurisdiction")(e.target.value)}
                placeholder="Delaware, USA"
              />
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label>Company address</Label>
              <Input
                value={values.companyAddress}
                onChange={(e) => set("companyAddress")(e.target.value)}
                placeholder="Street, city, state, country"
              />
            </div>
            <div className="space-y-2">
              <Label>Equity %</Label>
              <Input value={values.equityPercent} onChange={(e) => set("equityPercent")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Profit participation %</Label>
              <Input value={values.profitPercent} onChange={(e) => set("profitPercent")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Term (months)</Label>
              <Input value={values.termMonths} onChange={(e) => set("termMonths")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Company signer name</Label>
              <Input
                value={values.companySignerName}
                onChange={(e) => set("companySignerName")(e.target.value)}
                placeholder="Founder name"
              />
            </div>
            <div className="space-y-2">
              <Label>Company signer title</Label>
              <Input
                value={values.companySignerTitle}
                onChange={(e) => set("companySignerTitle")(e.target.value)}
                placeholder="CEO"
              />
            </div>
            <div className="space-y-2">
              <Label>Accelerator signer</Label>
              <Input
                value={values.acceleratorSignerName}
                onChange={(e) => set("acceleratorSignerName")(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Platform member
              </Label>
              <Input
                value={selectedMember ? `${recipient.name} · ${recipient.email}` : memberQuery}
                onChange={(e) => {
                  setSelectedMember(null);
                  setMemberQuery(e.target.value);
                }}
                placeholder="Search by name or email"
              />
              {filteredMembers.length > 0 && (
                <div className="rounded-lg border border-border/60 bg-background divide-y divide-border/40">
                  {filteredMembers.map((p) => (
                    <button
                      key={p.user_id}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted/60"
                      onClick={() => {
                        setSelectedMember(p);
                        setMemberQuery("");
                        setExternalEmail("");
                        setExternalName("");
                      }}
                    >
                      <span className="font-medium">{p.full_name || "Unnamed"}</span>
                      <span className="block text-xs text-muted-foreground">{p.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> External recipient
              </Label>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={externalName}
                  onChange={(e) => {
                    setExternalName(e.target.value);
                    setSelectedMember(null);
                  }}
                  placeholder="Full name"
                />
                <Input
                  type="email"
                  value={externalEmail}
                  onChange={(e) => {
                    setExternalEmail(e.target.value);
                    setSelectedMember(null);
                  }}
                  placeholder="name@company.com"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Message for the recipient</Label>
            <Textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Optional note included in the email and above the document."
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => createAndSend(true)} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send for signature
            </Button>
            <Button variant="outline" onClick={() => createAndSend(false)} disabled={saving}>
              Save as draft
            </Button>
            <Button variant="ghost" onClick={() => setShowPreview((v) => !v)}>
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? "Hide preview" : "Preview contract"}
            </Button>
            <Button variant="ghost" asChild>
              <a href={PARTNERS_URL} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Learn more about us
              </a>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Signed by {SFH_FOUNDERS.map((f) => f.name).join(" · ")} on behalf of Imagine Engine
            Studios Corp.
          </p>

          {showPreview && (
            <div
              className="max-h-[600px] overflow-auto rounded-xl bg-white p-8 text-black"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </CardContent>
      </Card>

      <Card className="tech-card border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Sent contracts</CardTitle>
          <Button variant="ghost" size="sm" onClick={loadContracts} disabled={loadingList}>
            <RefreshCw className={`h-4 w-4 ${loadingList ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingList && <p className="text-sm text-muted-foreground">Loading contracts…</p>}
          {!loadingList && contracts.length === 0 && (
            <p className="text-sm text-muted-foreground">No equity contracts yet.</p>
          )}
          {contracts.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 p-4"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{c.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {c.recipient_name || "No recipient"}
                  {c.recipient_email ? ` · ${c.recipient_email}` : ""} ·{" "}
                  {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={c.signatureCount > 0 ? "default" : "secondary"}>
                  {c.signatureCount > 0 ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {c.signatureCount} signature{c.signatureCount === 1 ? "" : "s"}
                    </span>
                  ) : (
                    c.status
                  )}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(shareUrl(c.share_token));
                    toast.success("Signing link copied");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href={shareUrl(c.share_token)} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" size="sm" onClick={() => resend(c)}>
                  <Send className="h-4 w-4 mr-1" /> Resend
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
