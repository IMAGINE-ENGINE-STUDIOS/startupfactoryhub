import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Gift, Link2, Copy, Check, Users, MousePointerClick, DollarSign, ArrowRight, TrendingUp, Plus, Clock, XCircle, Trash2, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { MEMBERSHIP_TIERS } from "@/lib/membership-tiers";
import MatrixBackground from "@/components/MatrixBackground";
import logo from "@/assets/logo.png";

export default function ReferralProgram() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [referralAccount, setReferralAccount] = useState<any>(null);
  const [referralLinks, setReferralLinks] = useState<any[]>([]);
  const [conversions, setConversions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [createLinkOpen, setCreateLinkOpen] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);

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
        const { data: links } = await supabase
          .from("referral_links")
          .select("*")
          .eq("account_id", data.id)
          .order("created_at", { ascending: true });
        setReferralLinks(links || []);

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

  const handleApply = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setJoining(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-referral-account", {
        body: { application_message: applicationMessage },
      });
      if (error) throw error;
      setReferralAccount(data);
      toast({ title: "Application Submitted!", description: "Your application is under review. We'll notify you once approved." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let code = "SFH-";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createNewLink = async () => {
    if (!newLinkLabel.trim() || !referralAccount) return;
    setCreatingLink(true);
    try {
      const code = generateCode();
      const { error } = await supabase
        .from("referral_links")
        .insert({
          account_id: referralAccount.id,
          referral_code: code,
          label: newLinkLabel.trim(),
        });
      if (error) throw error;
      toast({ title: "Link created!", description: `New referral link "${newLinkLabel}" is ready.` });
      setNewLinkLabel("");
      setCreateLinkOpen(false);
      fetchReferralData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreatingLink(false);
    }
  };

  const deleteLink = async (linkId: string) => {
    if (referralLinks.length <= 1) {
      toast({ title: "Cannot delete", description: "You must have at least one referral link.", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.from("referral_links").delete().eq("id", linkId);
      if (error) throw error;
      toast({ title: "Link deleted" });
      fetchReferralData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`https://startupfactoryhub.com/ref/${code}`);
    setCopied(code);
    toast({ title: "Link copied!", description: "Share it with your network." });
    setTimeout(() => setCopied(null), 2000);
  };

  const connectPayoutAccount = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("create-payout-account", {
        body: { account_type: "referral" },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const formatCents = (c: number) => `$${(c / 100).toFixed(2)}`;

  // Public landing / application view
  if (!user || !referralAccount) {
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

          <div className="container mx-auto px-4 py-16 sm:py-24 text-center max-w-4xl">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/30 text-sm px-4 py-1">
              <Gift className="h-4 w-4 mr-2" />
              Referral Partner Program
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Earn 20% Commission
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Apply to become a referral partner. Once approved, share your unique links, track conversions, 
              and earn a one-time 20% commission on the first month's subscription of every referred member.
            </p>

            {user ? (
              <Card className="tech-card border-0 max-w-lg mx-auto text-left">
                <CardHeader>
                  <CardTitle className="text-lg">Apply to Join</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tell us why you'd like to become a referral partner (optional)</p>
                    <Textarea
                      value={applicationMessage}
                      onChange={(e) => setApplicationMessage(e.target.value)}
                      placeholder="e.g. I run a startup community with 5,000+ members..."
                      rows={4}
                    />
                  </div>
                  <Button className="w-full hover-glow" onClick={handleApply} disabled={joining}>
                    {joining ? "Submitting..." : "Submit Application"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Applications are reviewed by our team. You'll be notified once approved.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Button size="lg" className="hover-glow text-lg px-8 py-6" onClick={() => navigate("/auth")}>
                Sign Up to Apply
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}

            {/* How it works */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              {[
                { icon: Link2, title: "Apply & Get Approved", desc: "Submit your application. Once approved by our team, you get access to create referral links." },
                { icon: Users, title: "Share & Refer", desc: "Create multiple tracking links for different campaigns. Share them with your network." },
                { icon: DollarSign, title: "Get Paid", desc: "Earn a one-time 20% commission on the first month's subscription only. Connect your bank to withdraw." },
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
                <p className="text-sm text-muted-foreground mt-1">
                  Members can subscribe monthly or yearly (saving 10%). Your commission is 20% of the first payment regardless of billing cycle.
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Monthly Price</TableHead>
                      <TableHead className="text-right">Yearly Price <span className="text-xs text-green-400">(Save 10%)</span></TableHead>
                      <TableHead className="text-right">Commission (Monthly)</TableHead>
                      <TableHead className="text-right">Commission (Yearly)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { plan: MEMBERSHIP_TIERS.community.name, price: MEMBERSHIP_TIERS.community.price * 100, yearlyPrice: MEMBERSHIP_TIERS.community.yearly_price * 100 },
                      { plan: MEMBERSHIP_TIERS.self_paced_office.name, price: MEMBERSHIP_TIERS.self_paced_office.price * 100, yearlyPrice: MEMBERSHIP_TIERS.self_paced_office.yearly_price * 100 },
                      { plan: MEMBERSHIP_TIERS.global_access.name, price: MEMBERSHIP_TIERS.global_access.price * 100, yearlyPrice: MEMBERSHIP_TIERS.global_access.yearly_price * 100 },
                      { plan: MEMBERSHIP_TIERS.corporate.name, price: MEMBERSHIP_TIERS.corporate.price * 100, yearlyPrice: MEMBERSHIP_TIERS.corporate.yearly_price * 100 },
                    ].map((tier) => (
                      <TableRow key={tier.plan}>
                        <TableCell className="font-medium">{tier.plan}</TableCell>
                        <TableCell className="text-right">{formatCents(tier.price)}</TableCell>
                        <TableCell className="text-right">
                          {formatCents(tier.yearlyPrice)}
                          <span className="text-xs text-muted-foreground">/yr</span>
                        </TableCell>
                        <TableCell className="text-right text-primary font-semibold">{formatCents(tier.price * 0.2)}</TableCell>
                        <TableCell className="text-right text-primary font-semibold">{formatCents(tier.yearlyPrice * 0.2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-4">
                  💡 <strong>Tip:</strong> Referred users who choose yearly billing save 10% — and you earn a higher one-time commission based on the full annual payment.
                </p>
                <div className="mt-3 p-3 rounded-lg border border-amber-400/20 bg-amber-400/5">
                  <p className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
                    ⭐ <strong>Official Mentors & Advisors</strong> earn <strong>25% commission</strong> instead of 20% on all referrals. <a href="/official-mentor-invite" className="underline hover:text-amber-300">Learn more</a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Pending status
  if (referralAccount.status === "pending") {
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
          <div className="container mx-auto px-4 py-16 text-center max-w-lg">
            <div className="tech-card p-8 rounded-2xl">
              <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Application Under Review</h1>
              <p className="text-muted-foreground mb-6">
                Your referral partner application has been submitted and is being reviewed by our team. 
                We'll notify you once a decision is made.
              </p>
              <Link to="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rejected status
  if (referralAccount.status === "rejected") {
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
          <div className="container mx-auto px-4 py-16 text-center max-w-lg">
            <div className="tech-card p-8 rounded-2xl">
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Application Not Approved</h1>
              <p className="text-muted-foreground mb-6">
                Unfortunately, your referral partner application was not approved at this time. 
                Please contact support if you have questions.
              </p>
              <Link to="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Approved partner dashboard
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
              Referral Partner Dashboard
            </h1>
            <div className="flex gap-2">
              <Link to="/dashboard">
                <Button variant="outline" size="sm">Back to Dashboard</Button>
              </Link>
            </div>
          </div>

          {/* Payout Connection Banner */}
          {referralAccount.payout_status !== "connected" && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-yellow-600">Connect your payout account</p>
                  <p className="text-sm text-muted-foreground">Link your bank account via Stripe to receive commission payouts.</p>
                </div>
                <Button onClick={connectPayoutAccount} size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Connect Account
                </Button>
              </CardContent>
            </Card>
          )}

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

          {/* Referral Links */}
          <Card className="tech-card border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Your Referral Links
              </CardTitle>
              <Dialog open={createLinkOpen} onOpenChange={setCreateLinkOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" /> New Link
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Referral Link</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Label (e.g. "Twitter Bio", "Newsletter", "YouTube")</p>
                      <Input
                        value={newLinkLabel}
                        onChange={(e) => setNewLinkLabel(e.target.value)}
                        placeholder="Enter a label for this link"
                      />
                    </div>
                    <Button className="w-full" onClick={createNewLink} disabled={creatingLink || !newLinkLabel.trim()}>
                      {creatingLink ? "Creating..." : "Create Link"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {referralLinks.map((link) => (
                  <div key={link.id} className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{link.label}</p>
                      <p className="text-xs font-mono text-muted-foreground truncate">
                        https://startupfactoryhub.com/ref/{link.referral_code}
                      </p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{link.total_clicks} clicks</span>
                        <span>{link.total_conversions} conversions</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => copyLink(link.referral_code)}>
                      {copied === link.referral_code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    {referralLinks.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => deleteLink(link.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conversions */}
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>Conversion History</CardTitle>
            </CardHeader>
            <CardContent>
              {conversions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No conversions yet. Share your links to start earning!</p>
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
