import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, DollarSign } from "lucide-react";
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
    <Card className="tech-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Event Earnings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {earnings.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No paid events yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a paid event to start earning revenue
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead className="text-right">Ticket Price</TableHead>
                <TableHead className="text-right">Sold</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Fee (10%)</TableHead>
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
                  <TableCell className="text-right">{formatCents(e.ticketPriceCents)}</TableCell>
                  <TableCell className="text-right">{e.ticketsSold}</TableCell>
                  <TableCell className="text-right">{formatCents(e.grossRevenue)}</TableCell>
                  <TableCell className="text-right text-orange-500">{formatCents(e.platformFee)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCents(e.netPayout)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
