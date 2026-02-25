import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Check, X, Eye, DollarSign, Link2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ReferralAccount {
  id: string;
  user_id: string;
  referral_code: string;
  status: string;
  application_message: string | null;
  total_clicks: number;
  total_referrals: number;
  total_earned_cents: number;
  payout_status: string;
  stripe_connect_account_id: string | null;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  profile?: { full_name: string | null; email: string | null; avatar_url: string | null };
}

export default function ReferralPartnersManagement() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<ReferralAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selectedAccount, setSelectedAccount] = useState<ReferralAccount | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [links, setLinks] = useState<any[]>([]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("referral_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each account
      const userIds = (data || []).map((a: any) => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const enriched = (data || []).map((a: any) => ({
        ...a,
        profile: profileMap.get(a.user_id) || null,
      }));

      setAccounts(enriched);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (accountId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("referral_accounts")
        .update({ 
          status, 
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq("id", accountId);

      if (error) throw error;
      toast({ title: `Partner ${status}`, description: `Referral partner has been ${status}.` });
      setDetailOpen(false);
      fetchAccounts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const viewDetails = async (account: ReferralAccount) => {
    setSelectedAccount(account);
    setAdminNotes(account.admin_notes || "");

    const { data } = await supabase
      .from("referral_links")
      .select("*")
      .eq("account_id", account.id)
      .order("created_at", { ascending: true });
    setLinks(data || []);
    setDetailOpen(true);
  };

  const filtered = accounts.filter((a) => {
    const matchesFilter = filter === "all" || a.status === filter;
    const matchesSearch =
      !search ||
      a.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.referral_code.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      approved: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const formatCents = (c: number) => `$${(c / 100).toFixed(2)}`;

  const pendingCount = accounts.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Referral Partners
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingCount} pending</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">Manage referral partner applications and accounts</p>
        </div>
        <Button variant="outline" onClick={fetchAccounts}>Refresh</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {["all", "pending", "approved", "rejected"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
            {f !== "all" && ` (${accounts.filter((a) => a.status === f).length})`}
          </Button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Partners", value: accounts.length, icon: Users },
          { label: "Active Partners", value: accounts.filter((a) => a.status === "approved").length, icon: Check },
          { label: "Pending Applications", value: pendingCount, icon: Eye },
          { label: "Total Commissions", value: formatCents(accounts.reduce((sum, a) => sum + (a.total_earned_cents || 0), 0)), icon: DollarSign },
        ].map((stat, i) => (
          <Card key={i} className="tech-card border-0">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className="h-6 w-6 text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="tech-card border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Referrals</TableHead>
                <TableHead className="text-right">Earned</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No referral partners found</TableCell>
                </TableRow>
              ) : (
                filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{a.profile?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{a.profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{a.referral_code}</TableCell>
                    <TableCell>{statusBadge(a.status)}</TableCell>
                    <TableCell className="text-right">{a.total_clicks}</TableCell>
                    <TableCell className="text-right">{a.total_referrals}</TableCell>
                    <TableCell className="text-right font-medium">{formatCents(a.total_earned_cents)}</TableCell>
                    <TableCell>
                      <Badge variant={a.payout_status === "connected" ? "default" : "secondary"} className="text-xs">
                        {a.payout_status || "not_connected"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(a.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => viewDetails(a)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Referral Partner Details</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedAccount.profile?.full_name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedAccount.profile?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {statusBadge(selectedAccount.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payout Status</p>
                  <Badge variant={selectedAccount.payout_status === "connected" ? "default" : "secondary"}>
                    {selectedAccount.payout_status || "not_connected"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="font-bold text-primary">{formatCents(selectedAccount.total_earned_cents)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stripe Connect ID</p>
                  <p className="font-mono text-xs">{selectedAccount.stripe_connect_account_id || "—"}</p>
                </div>
              </div>

              {selectedAccount.application_message && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Application Message</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedAccount.application_message}</p>
                </div>
              )}

              {/* Referral Links */}
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Link2 className="h-4 w-4" /> Referral Links ({links.length})
                </p>
                {links.length > 0 ? (
                  <div className="space-y-2">
                    {links.map((link: any) => (
                      <div key={link.id} className="flex items-center justify-between bg-muted/30 p-2 rounded text-sm">
                        <div>
                          <span className="font-medium">{link.label}</span>
                          <span className="ml-2 font-mono text-xs text-muted-foreground">{link.referral_code}</span>
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>{link.total_clicks} clicks</span>
                          <span>{link.total_conversions} conversions</span>
                          <Badge variant={link.is_active ? "default" : "secondary"} className="text-xs">
                            {link.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No links created yet</p>
                )}
              </div>

              {/* Admin Notes */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Admin Notes</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-2">
                {selectedAccount.status === "pending" && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => updateStatus(selectedAccount.id, "rejected")}
                    >
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                    <Button onClick={() => updateStatus(selectedAccount.id, "approved")}>
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  </>
                )}
                {selectedAccount.status === "approved" && (
                  <Button
                    variant="destructive"
                    onClick={() => updateStatus(selectedAccount.id, "rejected")}
                  >
                    Revoke Access
                  </Button>
                )}
                {selectedAccount.status === "rejected" && (
                  <Button onClick={() => updateStatus(selectedAccount.id, "approved")}>
                    Re-approve
                  </Button>
                )}
                <Button variant="outline" onClick={() => {
                  // Save notes only
                  supabase.from("referral_accounts").update({ admin_notes: adminNotes }).eq("id", selectedAccount.id)
                    .then(() => {
                      toast({ title: "Notes saved" });
                      fetchAccounts();
                    });
                }}>
                  Save Notes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
