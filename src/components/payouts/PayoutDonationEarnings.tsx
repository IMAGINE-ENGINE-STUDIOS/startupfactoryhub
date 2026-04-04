import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Heart, DollarSign } from "lucide-react";
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

  const totalGross = donations.reduce((sum, d) => sum + d.amount_cents, 0);
  const totalFees = donations.reduce((sum, d) => sum + d.platform_fee_cents, 0);
  const totalNet = donations.reduce((sum, d) => sum + d.net_amount_cents, 0);

  return (
    <Card className="tech-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          Hot Deals Donations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {donations.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No donations received yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Donations from the Hot Deals portal will appear here
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Fee (10%)</TableHead>
                <TableHead className="text-right">Net Payout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    {d.created_at ? format(new Date(d.created_at), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-right">{formatCents(d.amount_cents)}</TableCell>
                  <TableCell className="text-right text-orange-500">{formatCents(d.platform_fee_cents)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCents(d.net_amount_cents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-bold">Total ({donations.length} donations)</TableCell>
                <TableCell className="text-right font-bold">{formatCents(totalGross)}</TableCell>
                <TableCell className="text-right font-bold text-orange-500">{formatCents(totalFees)}</TableCell>
                <TableCell className="text-right font-bold">{formatCents(totalNet)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
