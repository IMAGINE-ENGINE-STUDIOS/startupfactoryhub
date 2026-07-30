import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MailX, RefreshCw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UnsubscribeRow {
  email: string;
  source: string | null;
  reason: string | null;
  unsubscribed_at: string;
}

export const UnsubscribesPanel = () => {
  const [rows, setRows] = useState<UnsubscribeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_unsubscribes")
      .select("email, source, reason, unsubscribed_at")
      .order("unsubscribed_at", { ascending: false })
      .limit(500);
    if (error) console.error("Failed to load unsubscribes:", error.message);
    setRows((data as UnsubscribeRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.email.includes(q) || (r.source ?? "").toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <Card className="tech-card border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MailX className="h-4 w-4 text-destructive" />
              Unsubscribes
              <Badge variant="secondary">{rows.length}</Badge>
            </CardTitle>
            <CardDescription>
              Addresses removed from all outbound email. Opt-outs are honored immediately.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email or source"
            className="pl-9"
          />
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2">
          {filtered.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground py-6 text-center">No unsubscribes recorded.</p>
          )}
          {filtered.map((r) => (
            <div
              key={r.email}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/40 px-3 py-2 text-sm"
            >
              <span className="truncate font-medium">{r.email}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {r.source ? `${r.source.slice(0, 40)} · ` : ""}
                {new Date(r.unsubscribed_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnsubscribesPanel;
