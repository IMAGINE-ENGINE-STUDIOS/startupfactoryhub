import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gift, Link2, Copy, Check, Users, MousePointerClick, DollarSign, ArrowRight, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import MatrixBackground from "@/components/MatrixBackground";
import logo from "@/assets/logo.png";

export default function ReferralProgram() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [referralAccount, setReferralAccount] = useState<any>(null);
  const [conversions, setConversions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) fetchReferralData();
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("referral_accounts")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      setReferralAccount(data);

      if (data) {
        const { data: convs } = await supabase
          .from("referral_conversions")
          .select("*")
          .eq("referrer_id", data.id)
          .order("created_at", { ascending: false });
        setConversions(convs || []);
      }
    } catch (err) {
      console.error("Error fetching referral data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinProgram = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setJoining(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-referral-account");
      if (error) throw error;
      setReferralAccount({
        referral_code: data.referral_code,
        total_clicks: data.total_clicks,
        total_referrals: data.total_referrals,
        total_earned_cents: data.total_earned_cents,
      });
      toast({ title: "Welcome to the Referral Program!", description: "Your unique referral link is ready." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  const copyLink = () => {
    const link = `https://startupfactoryhub.com/ref/${referralAccount.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: "Link copied!", description: "Share it with your network." });
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCents = (c: number) => `$${(c / 100).toFixed(2)}`;

  // Public landing view
  if (!user || !referralAccount) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <MatrixBackground />
        <div className="relative z-10">
          {/* Header */}
          <div className="container mx-auto px-4 py-6">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="SFH" className="w-8 h-8 glow-effect" />
              <span className="font-bold bg-gradient-primary bg-clip-text text-transparent">STARTUP FACTORY HUB</span>
            </Link>
          </div>

          {/* Hero */}
          <div className="container mx-auto px-4 py-16 sm:py-24 text-center max-w-4xl">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/30 text-sm px-4 py-1">
              <Gift className="h-4 w-4 mr-2" />
              Referral Program
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Earn 20% Commission
            </h1>
             <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Refer new members to Startup Factory Hub and earn a one-time 20% commission on their first month's subscription only. 
              Share your unique link, track conversions, and withdraw your earnings anytime.
            </p>

            <Button 
              size="lg" 
              className="hover-glow text-lg px-8 py-6" 
              onClick={handleJoinProgram}
              disabled={joining}
            >
              {joining ? "Setting up..." : user ? "Join the Referral Program" : "Sign Up to Start Earning"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            {/* How it works */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              {[
                { icon: Link2, title: "Get Your Link", desc: "Join the program and get a unique referral link to share with your network." },
                { icon: Users, title: "Refer Members", desc: "When someone signs up and subscribes through your link, you earn a commission." },
                { icon: DollarSign, title: "Get Paid", desc: "Earn a one-time 20% commission on the first month's subscription only. Withdraw to your bank anytime." },
              ].map((step, i) => (
                <Card key={i} className="tech-card border-0 text-left">
                  <CardContent className="pt-6">
                    <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-4">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Commission Table */}
            <Card className="tech-card border-0 mt-12 text-left">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Commission Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Monthly Price</TableHead>
                      <TableHead className="text-right">One-Time Commission (20%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { plan: "Community", price: 30000 },
                      { plan: "Self-Paced + Office", price: 50000 },
                      { plan: "Global Access", price: 95000 },
                      { plan: "Corporate", price: 150000 },
                    ].map((tier) => (
                      <TableRow key={tier.plan}>
                        <TableCell className="font-medium">{tier.plan}</TableCell>
                        <TableCell className="text-right">{formatCents(tier.price)}</TableCell>
                        <TableCell className="text-right text-primary font-semibold">{formatCents(tier.price * 0.2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard view for enrolled users
  return (
    <div className="min-h-screen relative overflow-hidden">
      <MatrixBackground />
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-6">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="SFH" className="w-8 h-8 glow-effect" />
            <span className="font-bold bg-gradient-primary bg-clip-text text-transparent">STARTUP FACTORY HUB</span>
          </Link>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              Referral Dashboard
            </h1>
            <Link to="/dashboard">
              <Button variant="outline" size="sm">Back to Dashboard</Button>
            </Link>
          </div>

          {/* Referral Link */}
          <Card className="tech-card border-0">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Your unique referral link</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`https://startupfactoryhub.com/ref/${referralAccount.referral_code}`}
                  className="font-mono text-sm"
                />
                <Button onClick={copyLink} variant="outline" className="shrink-0">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="tech-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Clicks</p>
                    <p className="text-2xl font-bold">{referralAccount.total_clicks || 0}</p>
                  </div>
                  <MousePointerClick className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="tech-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Referrals</p>
                    <p className="text-2xl font-bold">{referralAccount.total_referrals || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
            <Card className="tech-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                    <p className="text-2xl font-bold text-primary">{formatCents(referralAccount.total_earned_cents || 0)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversions */}
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>Conversion History</CardTitle>
            </CardHeader>
            <CardContent>
              {conversions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No conversions yet. Share your link to start earning!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversions.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell className="capitalize">{c.subscription_tier || "—"}</TableCell>
                        <TableCell className="text-right font-medium">{formatCents(c.commission_cents)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={c.status === "paid" ? "default" : "secondary"}>
                            {c.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
