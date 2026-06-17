import { useEffect, useState } from "react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, Send, Download, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

type Row = { email: string; full_name?: string; program?: string; company?: string; _status?: "new" | "duplicate" | "invalid" };
type Invitation = {
  id: string;
  email: string;
  full_name: string | null;
  program: string | null;
  status: string;
  sent_at: string | null;
  created_at: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InternMigration() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [importing, setImporting] = useState(false);
  const [sending, setSending] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "sent" | "activated">("all");

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);

  const loadInvitations = async () => {
    const { data } = await supabase
      .from("intern_invitations")
      .select("id, email, full_name, program, status, sent_at, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    setInvitations((data as Invitation[]) || []);
  };

  useEffect(() => { if (isAdmin) loadInvitations(); }, [isAdmin]);

  if (authLoading || isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const handleFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
      complete: (results) => {
        const existingEmails = new Set(invitations.map((i) => i.email.toLowerCase()));
        const parsed: Row[] = (results.data as any[]).map((r) => {
          const email = String(r.email || "").trim().toLowerCase();
          let status: Row["_status"] = "new";
          if (!email || !emailRegex.test(email)) status = "invalid";
          else if (existingEmails.has(email)) status = "duplicate";
          return {
            email,
            full_name: r.full_name || r.name || "",
            program: r.program || "",
            company: r.company || "",
            _status: status,
          };
        });
        setRows(parsed);
        toast.success(`Parsed ${parsed.length} rows`);
      },
      error: (e) => toast.error("CSV parse error: " + e.message),
    });
  };

  const handleImport = async () => {
    const validRows = rows.filter((r) => r._status === "new");
    if (validRows.length === 0) { toast.error("No new rows to import."); return; }
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-interns", {
        body: { rows: validRows },
      });
      if (error) throw error;
      toast.success(`Imported ${data.created} interns. Skipped: ${data.skipped}. Errors: ${data.errors?.length || 0}`);
      setRows([]);
      await loadInvitations();
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const sendInvites = async (opts: { ids?: string[]; all?: boolean }) => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-intern-invite", {
        body: opts.all ? { sendAllPending: true } : { invitationIds: opts.ids },
      });
      if (error) throw error;
      toast.success(`Sent ${data.sent} of ${data.total} emails.`);
      if (data.failures?.length) toast.error(`${data.failures.length} failures — check logs.`);
      await loadInvitations();
    } catch (e: any) {
      toast.error(e.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const downloadSample = () => {
    const csv = "email,full_name,program,company\njane@example.com,Jane Doe,Summer 2026,Acme\njohn@example.com,John Smith,Fall 2026,";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "interns-sample.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = invitations.filter((i) => filter === "all" ? true : i.status === filter);
  const counts = {
    all: invitations.length,
    pending: invitations.filter((i) => i.status === "pending").length,
    sent: invitations.filter((i) => i.status === "sent").length,
    activated: invitations.filter((i) => i.status === "activated").length,
  };

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Intern Migration</h1>
        <p className="text-muted-foreground">Import interns from a CSV and send branded activation invitations.</p>
      </div>

      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> 1. Upload CSV</CardTitle>
          <CardDescription>Required column: <code>email</code>. Optional: <code>full_name</code>, <code>program</code>, <code>company</code>.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-center">
            <Input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="max-w-md" />
            <Button variant="outline" onClick={downloadSample}><Download className="h-4 w-4 mr-2" /> Sample CSV</Button>
          </div>

          {rows.length > 0 && (
            <>
              <div className="border rounded-lg max-h-80 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Email</TableHead><TableHead>Name</TableHead><TableHead>Program</TableHead><TableHead>Status</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 100).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.email}</TableCell>
                        <TableCell>{r.full_name}</TableCell>
                        <TableCell>{r.program}</TableCell>
                        <TableCell>
                          <Badge variant={r._status === "new" ? "default" : r._status === "duplicate" ? "secondary" : "destructive"}>
                            {r._status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                Import {rows.filter((r) => r._status === "new").length} new interns
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="tech-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> 2. Invitations</CardTitle>
              <CardDescription>Send activation emails to imported interns.</CardDescription>
            </div>
            <Button onClick={() => sendInvites({ all: true })} disabled={sending || counts.pending === 0}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send all pending ({counts.pending})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(["all", "pending", "sent", "activated"] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
                {f} ({counts[f]})
              </Button>
            ))}
          </div>

          <div className="border rounded-lg max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Email</TableHead><TableHead>Name</TableHead><TableHead>Program</TableHead><TableHead>Status</TableHead><TableHead>Sent</TableHead><TableHead></TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.email}</TableCell>
                    <TableCell>{inv.full_name || "—"}</TableCell>
                    <TableCell>{inv.program || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === "activated" ? "default" : inv.status === "sent" ? "secondary" : "outline"}>
                        {inv.status === "activated" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{inv.sent_at ? new Date(inv.sent_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      {inv.status !== "activated" && (
                        <Button size="sm" variant="ghost" disabled={sending} onClick={() => sendInvites({ ids: [inv.id] })}>
                          {inv.status === "sent" ? "Resend" : "Send"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No invitations</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
