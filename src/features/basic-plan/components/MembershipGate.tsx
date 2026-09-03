// Wrap any restricted feature with <MembershipGate> to require a membership.
// Access: admins, admin-granted users, and any paid membership (Basic+).
// Free users see an upgrade card that opens the subscribe pop-up.
import { ReactNode, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMembershipAccess } from "../hooks/useMembershipAccess";
import MembershipUpgradeDialog from "./MembershipUpgradeDialog";

interface Props {
  /** Entitlement key / human name of the gated feature. */
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
  const [open, setOpen] = useState(false);

  if (loading || isMember) return <>{children}</>;
  if (silent) return null;

  return (
    <>
      <Card className="tech-card border-0 p-5 sm:p-6 text-center space-y-3">
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
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Sparkles className="h-4 w-4" />
          Unlock with membership
        </Button>
      </Card>
      <MembershipUpgradeDialog open={open} onOpenChange={setOpen} feature={feature} />
    </>
  );
}

/**
 * Imperative variant: call `requireMembership()` before running a gated action.
 * Renders the pop-up itself, so drop `{dialog}` into the component tree.
 */
export function useMembershipPrompt(feature?: string) {
  const { isMember, loading } = useMembershipAccess();
  const [open, setOpen] = useState(false);

  const requireMembership = () => {
    if (isMember || loading) return true;
    setOpen(true);
    return false;
  };

  const dialog = (
    <MembershipUpgradeDialog open={open} onOpenChange={setOpen} feature={feature} />
  );

  return { isMember, loading, requireMembership, dialog };
}
