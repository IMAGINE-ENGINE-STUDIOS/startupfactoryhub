// Single entitlement tile. Renders locked (free viewer) or unlocked
// (basic member) so the simulation shows both states side by side.
import {
  ArrowLeftRight,
  BadgeCheck,
  CalendarDays,
  Code2,
  GraduationCap,
  HandCoins,
  HeartHandshake,
  Lock,
  MapPin,
  MessageSquare,
  Percent,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Entitlement } from "../types";

/** Icon registry: entitlement.icon names map to Lucide components. */
const ICONS: Record<string, LucideIcon> = {
  MessageSquare,
  MapPin,
  Code2,
  Rocket,
  Percent,
  CalendarDays,
  HandCoins,
  GraduationCap,
  HeartHandshake,
  ArrowLeftRight,
  BadgeCheck,
};

interface Props {
  entitlement: Entitlement;
  unlocked: boolean;
}

export default function EntitlementTile({ entitlement, unlocked }: Props) {
  const Icon = ICONS[entitlement.icon] ?? BadgeCheck;

  return (
    <Card
      className={cn(
        "tech-card border-0 p-5 flex flex-col gap-3 transition-opacity",
        !unlocked && "opacity-80"
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "p-2.5 rounded-lg",
            unlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <Badge variant={unlocked ? "default" : "outline"} className="text-xs">
          {unlocked ? "Included" : "Requires Basic"}
        </Badge>
      </div>
      <div>
        <h3 className="font-semibold text-sm">{entitlement.label}</h3>
        <p className="text-xs text-muted-foreground mt-1">{entitlement.description}</p>
      </div>
      <div className="mt-auto">
        {unlocked ? (
          <Button variant="outline" size="sm" className="w-full">
            {entitlement.actionLabel}
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Upgrade to unlock this service
          </div>
        )}
      </div>
    </Card>
  );
}
