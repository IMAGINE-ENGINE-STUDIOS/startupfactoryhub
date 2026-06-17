import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, Send, Download, Mail, CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

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

export default function InternsManagement() {
  const [rows, setRows] = useState<Row[]>([]);
  const [importing, setImporting] = useState(false);
  const [sending, setSending] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "sent" | "activated">("all");
  const [loading, setLoading] = useState(true);

  const loadInvitations = async () => {
    const { data } = await supabase
      .from("intern_invitations")
      .select("id, email, full_name, program, status, sent_at, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    setInvitations((data as Invitation[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadInvitations(); }, []);

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

  const filtered = useMemo(() => {
    return invitations.filter((i) => {
      const matchesStatus = filter === "all" ? true : i.status === filter;
      const matchesSearch =
        !search.trim() ||
        i.email.toLowerCase().includes(search.toLowerCase()) ||
        (i.full_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (i.program?.toLowerCase() || "").includes(search.toLowerCase());
      const created = new Date(i.created_at);
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      if (to) to.setHours(23, 59, 59, 999);
      const matchesDate = (!from || created >= from) && (!to || created <= to);
      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [invitations, filter, search, dateFrom, dateTo]);

  const counts = {
    all: invitations.length,
    pending: invitations.filter((i) => i.status === "pending").length,
    sent: invitations.filter((i) => i.status === "sent").length,
    activated: invitations.filter((i) => i.status === "activated").length,
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> 1. Upload CSV</CardTitle>
          <CardDescription>Required column: <code>email</code>. Optional: <code>full_name</code>, <code>program</code>, <code>company</code>.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-center flex-wrap">
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
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="intern-search" className="mb-1.5 block text-xs text-muted-foreground">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="intern-search"
                    placeholder="Email, name, or program…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="date-from" className="mb-1.5 block text-xs text-muted-foreground">From</Label>
                <Input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="date-to" className="mb-1.5 block text-xs text-muted-foreground">To</Label>
                <Input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <Button size="sm" variant="ghost" className="mb-0.5" onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); }}>
                Clear
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["all", "pending", "sent", "activated"] as const).map((f) => (
                <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
                  {f} ({counts[f]})
                </Button>
              ))}
            </div>
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
