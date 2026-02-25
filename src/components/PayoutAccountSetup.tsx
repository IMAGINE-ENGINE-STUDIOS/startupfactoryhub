import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Banknote, CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react";
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
    // Refresh payout info after exiting
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
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Payout Account Status */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Payout Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payoutInfo?.has_payout_account && payoutInfo.account_status === "active" ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Stripe Connect</p>
                  <p className="text-sm text-muted-foreground">
                    Status: <Badge variant="default">Active</Badge>
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleStartOnboarding} disabled={connectLoading}>
                {connectLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Update Info
              </Button>
            </div>
          ) : payoutInfo?.has_payout_account ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium">Stripe Connect</p>
                    <p className="text-sm text-muted-foreground">
                      Status: <Badge variant="secondary">{payoutInfo.account_status}</Badge>
                    </p>
                  </div>
                </div>
                {!showOnboarding && (
                  <Button variant="outline" size="sm" onClick={handleStartOnboarding} disabled={connectLoading}>
                    {connectLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Complete Setup
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Banknote className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground mb-3">Connect a Stripe account to receive payouts from events, districts, and referrals.</p>
              {!showOnboarding && (
                <Button onClick={handleStartOnboarding} disabled={connectLoading}>
                  {connectLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Connect Stripe Account
                </Button>
              )}
            </div>
          )}

          {/* Embedded Onboarding */}
          {showOnboarding && stripeConnectInstance && (
            <div className="mt-4 border rounded-xl overflow-hidden bg-background">
              <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
                <ConnectAccountOnboarding
                  onExit={handleOnboardingExit}
                />
              </ConnectComponentsProvider>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Balance & Withdraw */}
      {payoutInfo && (
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Available Balance</span>
              <span className="text-2xl text-primary">{formatCents(payoutInfo.available_balance_cents)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Referral Earnings</p>
                <p className="font-semibold">{formatCents(payoutInfo.referral_earnings_cents)}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Event Earnings</p>
                <p className="font-semibold">{formatCents(payoutInfo.event_earnings_cents)}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Total Withdrawn</p>
                <p className="font-semibold">{formatCents(payoutInfo.total_withdrawn_cents)}</p>
              </div>
            </div>
            {payoutInfo.available_balance_cents > 0 && payoutInfo.account_status === "active" && (
              <Button
                className="w-full"
                onClick={handleWithdraw}
                disabled={withdrawing}
              >
                {withdrawing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Withdraw {formatCents(payoutInfo.available_balance_cents)}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
