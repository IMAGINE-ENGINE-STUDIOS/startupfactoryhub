// Simulation controls: flip the viewer between "Free user" and
// "Basic member" to preview gated states without touching real data.
import { FlaskConical, User, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SimulatedRole } from "../types";

interface Props {
  role: SimulatedRole;
  onRoleChange: (role: SimulatedRole) => void;
  realIsSubscribed: boolean;
  realTier: string;
}

export default function SimulationControls({
  role,
  onRoleChange,
  realIsSubscribed,
  realTier,
}: Props) {
  const option = (value: SimulatedRole, label: string, Icon: typeof User) => (
    <Button
      key={value}
      variant={role === value ? "default" : "outline"}
      size="sm"
      onClick={() => onRoleChange(value)}
      className={cn("gap-2", role !== value && "text-muted-foreground")}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );

  return (
    <Card className="tech-card border-0 p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <FlaskConical className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-medium">Simulated user</p>
          <p className="text-xs text-muted-foreground">
            Preview only — real account data is never modified.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {option("free", "Free user", User)}
        {option("basic", "Basic member", Crown)}
        <Badge variant="outline" className="ml-2 text-xs">
          Real status: {realIsSubscribed ? realTier : "free"}
        </Badge>
      </div>
    </Card>
  );
}
