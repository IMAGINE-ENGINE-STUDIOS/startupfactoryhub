import { useState, useEffect } from "react";
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

  return (
    <section className="px-6 py-5">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Withdrawal History</h3>
        {withdrawals.length > 0 && (
          <span className="text-xs text-muted-foreground">· {withdrawals.length}</span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : withdrawals.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Your withdrawal history will appear here.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="hidden md:table-cell">Source</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Completed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="text-sm">
                  {format(new Date(w.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="hidden md:table-cell">
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
                <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                  {w.completed_at
                    ? format(new Date(w.completed_at), "MMM d, yyyy")
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
