import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface WithdrawalRequest {
  id: string;
  amount_cents: number;
  source: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export default function PayoutWithdrawalHistory() {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchWithdrawals();
  }, [user?.id]);

  const fetchWithdrawals = async () => {
    try {
      const { data } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setWithdrawals((data as WithdrawalRequest[]) || []);
    } catch (err) {
      console.error("Error fetching withdrawals:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCents = (c: number) => `$${(c / 100).toFixed(2)}`;

  const statusVariant = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "processing": return "secondary";
      case "pending": return "outline";
      case "failed": return "destructive";
      default: return "secondary";
    }
  };

  if (loading) {
    return (
      <Card className="tech-card border-0">
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="tech-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Withdrawal History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {withdrawals.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No withdrawals yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your withdrawal history will appear here
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="text-sm">
                    {format(new Date(w.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">
                      {w.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCents(w.amount_cents)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(w.status)} className="capitalize">
                      {w.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {w.completed_at
                      ? format(new Date(w.completed_at), "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
