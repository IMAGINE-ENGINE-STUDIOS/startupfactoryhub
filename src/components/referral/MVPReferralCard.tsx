import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { REFERRAL_PROGRAMS, MVP_COHORT_ID } from "@/lib/referral-programs";

const MVP = REFERRAL_PROGRAMS.find((p) => p.id === "mvp_program")!;

/**
 * Compact MVP Program referral CTA for mentor / advisor dashboards.
 * Shows the partner's unique tracked link when they have an approved
 * referral account, otherwise invites them to join the program.
 */
export default function MVPReferralCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("referral_accounts")
        .select("referral_code, status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      setCode(data?.referral_code ?? null);
      setStatus(data?.status ?? null);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const approved = status === "approved" && !!code;
  const url = approved
    ? MVP.buildUrl(code!)
    : `https://startupfactoryhub.com/cohorts/${MVP_COHORT_ID}/apply`;

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "MVP referral link copied" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="tech-card border-0 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">Refer a startup to the MVP Program</p>
                <Badge variant="secondary" className="text-[11px]">{MVP.commissionLabel}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {approved
                  ? "Share your tracked link. Every application through it is credited to you."
                  : "Join the referral partner program to unlock your tracked link and earn commissions."}
              </p>
              <p className="truncate font-mono text-xs text-muted-foreground break-all">{url}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:shrink-0 gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={copy} className="gap-1.5 w-full sm:w-auto">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy link
            </Button>
            <Button size="sm" asChild className="gap-1.5 w-full sm:w-auto">
              <Link to="/referral">
                {approved ? "Referral dashboard" : "Join program"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
