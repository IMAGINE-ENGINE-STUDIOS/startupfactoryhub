import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface EventEarning {
  eventId: string;
  title: string;
  startDate: string;
  ticketPriceCents: number;
  ticketsSold: number;
  grossRevenue: number;
  platformFee: number;
  netPayout: number;
}

interface PayoutEventEarningsProps {
  earnings: EventEarning[];
}

export default function PayoutEventEarnings({ earnings }: PayoutEventEarningsProps) {
  const formatCents = (c: number) => `$${(c / 100).toFixed(2)}`;

  return (
    <section className="px-6 py-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Event Earnings</h3>
        {earnings.length > 0 && (
          <span className="text-xs text-muted-foreground">· {earnings.length}</span>
        )}
      </div>

      {earnings.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No paid events yet — create a paid event to start earning revenue.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead className="text-right">Sold</TableHead>
              <TableHead className="text-right hidden md:table-cell">Gross</TableHead>
              <TableHead className="text-right hidden lg:table-cell">Fee</TableHead>
              <TableHead className="text-right">Net Payout</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {earnings.map((e) => (
              <TableRow key={e.eventId}>
                <TableCell>
                  <div>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.startDate ? format(new Date(e.startDate), "MMM d, yyyy") : "TBD"}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-right">{e.ticketsSold}</TableCell>
                <TableCell className="text-right hidden md:table-cell">{formatCents(e.grossRevenue)}</TableCell>
                <TableCell className="text-right hidden lg:table-cell text-muted-foreground">{formatCents(e.platformFee)}</TableCell>
                <TableCell className="text-right font-medium">{formatCents(e.netPayout)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
