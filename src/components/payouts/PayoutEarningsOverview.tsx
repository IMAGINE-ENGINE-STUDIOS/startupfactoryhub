import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Percent, ArrowDownToLine } from "lucide-react";

interface PayoutEarningsOverviewProps {
  totalGross: number;
  totalFees: number;
  totalNet: number;
  totalWithdrawn: number;
  availableBalance: number;
}

export default function PayoutEarningsOverview({
  totalGross,
  totalFees,
  totalNet,
  totalWithdrawn,
  availableBalance,
}: PayoutEarningsOverviewProps) {
  const formatCents = (c: number) => `$${(c / 100).toFixed(2)}`;

  const stats = [
    { label: "Gross Revenue", value: formatCents(totalGross), icon: DollarSign, color: "text-green-500" },
    { label: "Platform Fees (10%)", value: formatCents(totalFees), icon: Percent, color: "text-orange-500" },
    { label: "Net Earnings", value: formatCents(totalNet), icon: TrendingUp, color: "text-primary" },
    { label: "Total Withdrawn", value: formatCents(totalWithdrawn), icon: ArrowDownToLine, color: "text-blue-500" },
  ];

  return (
    <div className="space-y-4">
      {/* Available Balance Hero */}
      <Card className="tech-card border-0 bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
            <p className="text-4xl font-bold text-primary">{formatCents(availableBalance)}</p>
            <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
          </div>
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="tech-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-lg font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
