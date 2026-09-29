import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Heart } from "lucide-react";
import { format } from "date-fns";

interface Donation {
  id: string;
  amount_cents: number;
  platform_fee_cents: number;
  net_amount_cents: number;
  created_at: string;
}

interface PayoutDonationEarningsProps {
  donations: Donation[];
}

export default function PayoutDonationEarnings({ donations }: PayoutDonationEarningsProps) {
  const formatCents = (c: number) => `$${(c / 100).toFixed(2)}`;

  return (
    <section className="px-6 py-5">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Hot Deals Donations</h3>
        {donations.length > 0 && (
          <span className="text-xs text-muted-foreground">· {donations.length}</span>
        )}
      </div>

      {donations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Donations from the Hot Deals portal will appear here.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right hidden md:table-cell">Amount</TableHead>
              <TableHead className="text-right hidden lg:table-cell">Fee</TableHead>
              <TableHead className="text-right">Net</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donations.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  {d.created_at ? format(new Date(d.created_at), "MMM d, yyyy") : "—"}
                </TableCell>
                <TableCell className="text-right hidden md:table-cell">{formatCents(d.amount_cents)}</TableCell>
                <TableCell className="text-right hidden lg:table-cell text-muted-foreground">{formatCents(d.platform_fee_cents)}</TableCell>
                <TableCell className="text-right font-medium">{formatCents(d.net_amount_cents)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
