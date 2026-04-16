import { useEffect, useMemo, useState } from "react";
import { Star, MessageCircle, Users, Download, Filter, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Category = "overall" | "pitches" | "production" | "community";

interface FeedbackRow {
  id: string;
  rating: number;
  comment: string | null;
  category: string;
  session_token: string | null;
  created_at: string;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "overall", label: "Overall" },
  { value: "pitches", label: "Pitches" },
  { value: "production", label: "Production" },
  { value: "community", label: "Community" },
];

const HotDealsFeedbackManagement = () => {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [minStars, setMinStars] = useState<string>("0");
  const [commentsOnly, setCommentsOnly] = useState(false);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("hot_deals_event_feedback")
      .select("id, rating, comment, category, session_token, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (data) setRows(data as FeedbackRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("admin_hot_deals_feedback")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "hot_deals_event_feedback" },
        (payload) => {
          setRows((prev) => [payload.new as FeedbackRow, ...prev].slice(0, 1000));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (Number(minStars) > 0 && r.rating < Number(minStars)) return false;
      if (commentsOnly && (!r.comment || !r.comment.trim())) return false;
      if (fromDate && new Date(r.created_at) < new Date(fromDate)) return false;
      if (toDate) {
        const end = new Date(toDate);
        end.setDate(end.getDate() + 1);
        if (new Date(r.created_at) > end) return false;
      }
      return true;
    });
  }, [rows, categoryFilter, minStars, commentsOnly, fromDate, toDate]);

  const totalResponses = rows.length;
  const overallAvg =
    totalResponses > 0 ? rows.reduce((s, r) => s + r.rating, 0) / totalResponses : 0;

  const perCategory = useMemo(() => {
    return CATEGORIES.map((c) => {
      const subset = rows.filter((r) => r.category === c.value);
      const count = subset.length;
      const avg = count > 0 ? subset.reduce((s, r) => s + r.rating, 0) / count : 0;
      const distribution = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: subset.filter((r) => r.rating === star).length,
      }));
      return { ...c, count, avg, distribution };
    });
  }, [rows]);

  const exportCSV = () => {
    const header = ["created_at", "category", "rating", "comment", "session_token"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [
      header.join(","),
      ...filtered.map((r) =>
        [
          r.created_at,
          r.category,
          String(r.rating),
          r.comment ?? "",
          r.session_token ?? "",
        ]
          .map(escape)
          .join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hot-deals-feedback-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-orange-400" />
            Hot Deals Event Feedback
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Anonymous ratings and comments collected from the Hot Deals portal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading} className="tech-card border-0">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> TOTAL RESPONSES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalResponses}</div>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" /> OVERALL AVERAGE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-baseline gap-2">
              {overallAvg.toFixed(2)}
              <span className="text-sm text-muted-foreground font-normal">/ 5</span>
            </div>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" /> WITH COMMENTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {rows.filter((r) => r.comment && r.comment.trim()).length}
            </div>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> UNIQUE SESSIONS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Set(rows.map((r) => r.session_token).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-category breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {perCategory.map((c) => (
          <Card key={c.value} className="tech-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="uppercase tracking-wider">{c.label}</span>
                <Badge variant="outline" className="font-normal">
                  {c.count} {c.count === 1 ? "response" : "responses"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {c.count === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No responses yet.</p>
              ) : (
                <>
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-3xl font-bold text-orange-400">{c.avg.toFixed(2)}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`w-4 h-4 ${
                            n <= Math.round(c.avg)
                              ? "fill-orange-400 text-orange-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {c.distribution.map((d) => {
                      const pct = c.count > 0 ? (d.count / c.count) * 100 : 0;
                      return (
                        <div key={d.star} className="flex items-center gap-2 text-xs">
                          <span className="w-3 text-muted-foreground font-mono">{d.star}</span>
                          <Star className="w-3 h-3 text-orange-400/60" />
                          <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-orange-400 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-muted-foreground font-mono">
                            {d.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + table */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            All Responses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Minimum stars</Label>
              <Select value={minStars} onValueChange={setMinStars}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                  <SelectItem value="5">5 only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">From</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Switch
                id="comments-only"
                checked={commentsOnly}
                onCheckedChange={setCommentsOnly}
              />
              <Label htmlFor="comments-only" className="text-xs cursor-pointer">
                Comments only
              </Label>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Showing {filtered.length} of {rows.length} responses
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">When</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="min-w-[300px]">Comment</TableHead>
                  <TableHead className="whitespace-nowrap">Session</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No responses match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {r.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`w-3.5 h-3.5 ${
                                n <= r.rating
                                  ? "fill-orange-400 text-orange-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                          <span className="ml-1.5 text-xs font-mono">{r.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.comment ? (
                          <span className="text-foreground/90">{r.comment}</span>
                        ) : (
                          <span className="text-muted-foreground/50 italic text-xs">No comment</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {r.session_token ? `${r.session_token.slice(0, 12)}…` : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HotDealsFeedbackManagement;
