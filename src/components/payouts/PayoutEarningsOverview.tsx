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
}: PayoutEarningsOverviewProps) {
  const formatCents = (c: number) => `$${(c / 100).toFixed(2)}`;

  const stats = [
    { label: "Gross Revenue", value: formatCents(totalGross), icon: DollarSign },
    { label: "Platform Fees", value: formatCents(totalFees), icon: Percent },
    { label: "Net Earnings", value: formatCents(totalNet), icon: TrendingUp },
    { label: "Total Withdrawn", value: formatCents(totalWithdrawn), icon: ArrowDownToLine },
  ];

  return (
    <Card className="tech-card border-0 overflow-hidden">
      <CardContent className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
          {stats.map((stat) => (
            <div key={stat.label} className="p-5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <stat.icon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium uppercase tracking-wide">{stat.label}</span>
              </div>
              <p className="text-xl font-semibold mt-1.5">{stat.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
