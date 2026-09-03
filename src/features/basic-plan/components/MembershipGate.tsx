// Wrap any restricted feature with <MembershipGate> to require an active
// paid membership. Free users see an upgrade card pointing to /basic-plan.
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMembershipAccess } from "../hooks/useMembershipAccess";

interface Props {
  /** Entitlement key from DEFAULT_ENTITLEMENTS (informational for now). */
  feature?: string;
  title?: string;
  description?: string;
  /** Render nothing instead of the upgrade card when locked. */
  silent?: boolean;
  children: ReactNode;
}

export default function MembershipGate({
  feature,
  title = "Members only",
  description = "This feature is included with the Startup Factory Hub membership.",
  silent = false,
  children,
}: Props) {
  const { isMember, loading } = useMembershipAccess();

  if (loading || isMember) return <>{children}</>;
  if (silent) return null;

  return (
    <Card className="tech-card border-0 p-6 text-center space-y-3">
      <div className="mx-auto w-11 h-11 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
        <Lock className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        {feature ? (
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/70 mt-1">
            {feature}
          </p>
        ) : null}
      </div>
      <Button asChild className="gap-2">
        <Link to="/basic-plan">
          <Sparkles className="h-4 w-4" />
          View membership
        </Link>
      </Button>
    </Card>
  );
}
