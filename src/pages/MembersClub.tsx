// Members Club home: the paid-member destination after Stripe checkout.
// On `?checkout=success` it re-verifies the subscription with Stripe (via
// check-membership, which also writes the user_subscriptions record) until
// access is confirmed, then shows the digital member card and club perks.
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BadgeCheck, Coffee, Loader2, MapPin, ArrowLeft, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMembershipAccess, MembershipGate } from "@/features/basic-plan";
import { useQueryClient } from "@tanstack/react-query";
import foxtailLogo from "@/assets/foxtail-coffee-logo.png.asset.json";

export default function MembersClub() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const access = useMembershipAccess();
  const justPaid = params.get("checkout") === "success";
  const [verifying, setVerifying] = useState(justPaid);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/members-club");
  }, [authLoading, user, navigate]);

  // Stripe may take a few seconds to mark the subscription active.
  useEffect(() => {
    if (!justPaid || !user) return;
    let tries = 0;
    let stop = false;
    const tick = async () => {
      if (stop) return;
      await qc.invalidateQueries({ queryKey: ["membership-status"] });
      await access.refetch();
      tries++;
      if (tries < 10 && !stop) setTimeout(tick, 3000);
      else setVerifying(false);
    };
    tick();
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justPaid, user]);

  useEffect(() => {
    if (justPaid && access.isMember && !access.loading) {
      setVerifying(false);
      setParams((p) => { const n = new URLSearchParams(p); n.delete("checkout"); return n; }, { replace: true });
    }
  }, [justPaid, access.isMember, access.loading, setParams]);

  if (authLoading || !user || verifying || access.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm">{verifying ? "Confirming your membership…" : "Loading…"}</p>
      </div>
    );
  }

  const name = (user.user_metadata?.full_name as string) || user.email;
  const memberNo = user.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  // Free coffee requires an active paid Stripe membership ($50/mo or higher). Complimentary grants do not qualify.
  const canRedeemCoffee = access.isPaid || access.isAdmin;
  const validUntil = access.subscriptionEnd
    ? new Date(access.subscriptionEnd).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : access.isAdmin ? "Admin access" : access.isGranted ? "Complimentary" : "Active";

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <MembershipGate
          feature="Members Club"
          title="Members Club"
          description="Become a member to unlock the Innovation Coffee Table and your member card."
        >
          <div className="space-y-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-primary">Startup Factory Hub</p>
              <h1 className="text-3xl font-bold">Members Club</h1>
            </div>

            <Card className="tech-card border-0 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  <BadgeCheck className="h-4 w-4" /> Verified member
                </span>
                <span className="text-xs font-mono text-muted-foreground">No. {memberNo}</span>
              </div>
              <div>
                <p className="text-xl font-bold break-words">{name}</p>
                <p className="text-sm text-muted-foreground">Valid until: {validUntil}</p>
              </div>
            </Card>

            <Card className="tech-card border-0 p-6 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-primary" /> Innovation Coffee Table
                </h2>
                <img src={foxtailLogo.url} alt="Foxtail Coffee Co." className="h-8 w-auto object-contain" />
              </div>
              {canRedeemCoffee ? (
                <p className="text-sm text-muted-foreground">
                  Exclusive Central Florida meeting point. Two coffees included from Foxtail Belle Isle — show this card at the counter.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  Coffee is included only for paying members (Venture Network $50/mo or higher). Your account is not eligible for free coffee.
                </p>
              )}
              <p className="text-sm flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                7813 S Orange Ave Suite 132, Orlando, FL 32809
              </p>
            </Card>

            <Button variant="outline" onClick={() => navigate("/dashboard")}>Go to your dashboard</Button>
          </div>
        </MembershipGate>
      </div>
    </div>
  );
}
