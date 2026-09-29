import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Banknote, Loader2, RefreshCw } from "lucide-react";
import { loadConnectAndInitialize } from "@stripe/connect-js";
import {
  ConnectComponentsProvider,
  ConnectAccountOnboarding,
} from "@stripe/react-connect-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const STRIPE_PUBLISHABLE_KEY = "pk_live_51T3QFRK5N1RcUVuYCFbUOosd9Iifkie3l7u9obIM42uDZsuq9p08i1E5wVOV4TAlBXVAtDZO24wJUq3Z4HioJDTM00h0emHQSl";

interface PayoutInfo {
  has_payout_account: boolean;
  account_status: string | null;
  available_balance_cents: number;
  referral_earnings_cents: number;
  event_earnings_cents: number;
  total_withdrawn_cents: number;
}

export default function PayoutAccountSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stripeConnectInstance, setStripeConnectInstance] = useState<any>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (user) fetchPayoutInfo();
  }, [user]);

  const fetchPayoutInfo = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-payout-account");
      if (error) throw error;
      setPayoutInfo(data);
    } catch (err) {
      console.error("Error fetching payout info:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientSecret = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("create-account-session", {
      body: { country: "US" },
    });
    if (error || !data?.client_secret) {
      throw new Error(error?.message || "Failed to create account session");
    }
    return data.client_secret;
  }, []);

  const handleStartOnboarding = async () => {
    setConnectLoading(true);
    try {
      const instance = loadConnectAndInitialize({
        publishableKey: STRIPE_PUBLISHABLE_KEY,
        fetchClientSecret,
        appearance: {
          overlays: "dialog",
          variables: {
            colorPrimary: "#6366f1",
            borderRadius: "12px",
          },
        },
      });
      setStripeConnectInstance(instance);
      setShowOnboarding(true);
    } catch (err: any) {
      console.error("Error initializing Stripe Connect:", err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setConnectLoading(false);
    }
  };

  const handleOnboardingExit = () => {
    setShowOnboarding(false);
    setStripeConnectInstance(null);
    setLoading(true);
    fetchPayoutInfo();
    toast({ title: "Onboarding updated", description: "Your payout account status has been refreshed." });
  };

  const handleWithdraw = async () => {
    if (!payoutInfo || payoutInfo.available_balance_cents <= 0) return;
    setWithdrawing(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-withdrawal", {
        body: { amount_cents: payoutInfo.available_balance_cents, source: "all" },
      });
      if (error) throw error;
      toast({ title: "Withdrawal successful!", description: `$${(payoutInfo.available_balance_cents / 100).toFixed(2)} has been transferred to your account.` });
      fetchPayoutInfo();
    } catch (err: any) {
      toast({ title: "Withdrawal failed", description: err.message, variant: "destructive" });
    } finally {
      setWithdrawing(false);
    }
  };

  const formatCents = (c: number) => `$${(c / 100).toFixed(2)}`;

  if (loading) {
    return (
      <Card className="tech-card border-0">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isActive = payoutInfo?.has_payout_account && payoutInfo.account_status === "active";
  const isPending = payoutInfo?.has_payout_account && payoutInfo.account_status !== "active";

  return (
    <Card className="tech-card border-0">
      <CardContent className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Payout Account</h3>
          </div>
          {payoutInfo?.has_payout_account && (
            <Badge variant={isActive ? "default" : "secondary"} className="capitalize">
              {payoutInfo.account_status || "pending"}
            </Badge>
          )}
        </div>

        {/* Connect CTA when no account */}
        {!payoutInfo?.has_payout_account && !showOnboarding && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground sm:max-w-md">
              Connect a Stripe account to receive payouts from events, donations, and referrals.
            </p>
            <Button size="sm" onClick={handleStartOnboarding} disabled={connectLoading}>
              {connectLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Connect Stripe
            </Button>
          </div>
        )}

        {/* Pending account */}
        {isPending && !showOnboarding && (
          <div className="flex items-center justify-between rounded-xl bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              Your Stripe account needs a few more details before payouts can be sent.
            </p>
            <Button size="sm" variant="outline" onClick={handleStartOnboarding} disabled={connectLoading}>
              Complete Setup
            </Button>
          </div>
        )}

        {/* Active account */}
        {isActive && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Stripe Connect is linked and active.</p>
            <Button size="sm" variant="ghost" onClick={handleStartOnboarding} disabled={connectLoading}>
              {connectLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Update Info
            </Button>
          </div>
        )}

        {/* Balance */}
        {payoutInfo && (
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Available Balance</p>
                <p className="text-3xl font-bold mt-1">{formatCents(payoutInfo.available_balance_cents)}</p>
              </div>
              {isActive && payoutInfo.available_balance_cents > 0 && (
                <Button onClick={handleWithdraw} disabled={withdrawing}>
                  {withdrawing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Withdraw {formatCents(payoutInfo.available_balance_cents)}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Referral {formatCents(payoutInfo.referral_earnings_cents)}
              {" · "}Events {formatCents(payoutInfo.event_earnings_cents)}
              {" · "}Withdrawn {formatCents(payoutInfo.total_withdrawn_cents)}
            </p>
          </div>
        )}

        {/* Embedded Onboarding */}
        {showOnboarding && stripeConnectInstance && (
          <div className="border rounded-xl overflow-hidden bg-background">
            <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
              <ConnectAccountOnboarding
                onExit={handleOnboardingExit}
              />
            </ConnectComponentsProvider>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
