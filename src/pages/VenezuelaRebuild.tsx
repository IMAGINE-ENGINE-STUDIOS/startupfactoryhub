import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart, Globe, MapPin, Users, Briefcase, Building2, Loader2, ExternalLink, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  location: string | null;
  logo_url: string | null;
  website: string | null;
  team_size: number | null;
  user_id: string;
  funding_amount: number | null;
}

interface DonationAgg {
  company_id: string;
  total_cents: number;
  donors: number;
}

const DEFAULT_GOAL_CENTS = 5_000_000; // $50,000 default goal per startup
const PRESETS = [25, 50, 100, 250, 500];

const VenezuelaRebuild = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [donations, setDonations] = useState<Record<string, DonationAgg>>({});
  const [loading, setLoading] = useState(true);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);

  // Donation form state
  const [amount, setAmount] = useState<number>(50);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    document.title = "Venezuela Rebuild Initiative · Startup Factory Hub";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Support Venezuelan startups rebuilding their country through technology. 100% direct donations via Stripe Connect.");
  }, []);

  useEffect(() => {
    const status = searchParams.get("donation");
    const sid = searchParams.get("session_id");
    if (status === "success" && sid) {
      supabase.functions.invoke("verify-venezuela-donation", { body: { session_id: sid } });
      toast.success("Thank you for your donation! Funds are on their way to the startup.");
      setSearchParams({});
    } else if (status === "cancelled") {
      toast.info("Donation cancelled.");
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const fetchData = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("venezuela_rebuild", true);
    const userIds = (profiles ?? []).map((p) => p.user_id);
    if (userIds.length === 0) {
      setCompanies([]);
      setLoading(false);
      return;
    }
    const { data: comps } = await supabase
      .from("companies")
      .select("id, name, description, industry, location, logo_url, website, team_size, user_id, funding_amount")
      .in("user_id", userIds)
      .order("created_at", { ascending: false });

    setCompanies(comps ?? []);

    const { data: dons } = await supabase
      .from("venezuela_rebuild_donations")
      .select("company_id, amount_cents")
      .eq("status", "completed");
    const agg: Record<string, DonationAgg> = {};
    (dons ?? []).forEach((d) => {
      if (!agg[d.company_id]) agg[d.company_id] = { company_id: d.company_id, total_cents: 0, donors: 0 };
      agg[d.company_id].total_cents += d.amount_cents;
      agg[d.company_id].donors += 1;
    });
    setDonations(agg);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totals = useMemo(() => {
    const total = Object.values(donations).reduce((s, d) => s + d.total_cents, 0);
    const donors = Object.values(donations).reduce((s, d) => s + d.donors, 0);
    return { totalUsd: total / 100, donors };
  }, [donations]);

  const openDonate = (c: Company) => {
    setActiveCompany(c);
    setAmount(50);
    setMessage("");
  };

  const handleDonate = async () => {
    if (!activeCompany) return;
    if (!donorName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (amount < 1) {
      toast.error("Minimum donation is $1");
      return;
    }
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-venezuela-donation", {
        body: {
          company_id: activeCompany.id,
          amount_cents: Math.round(amount * 100),
          donor_name: donorName.trim(),
          donor_email: donorEmail.trim() || undefined,
          message: message.trim() || undefined,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (e: any) {
      toast.error(e?.message || "Donation failed to start");
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-amber-50/20 dark:to-amber-950/10">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(45_90%_55%/0.18),transparent_60%),radial-gradient(circle_at_70%_80%,hsl(0_75%_55%/0.18),transparent_55%)]" />
        <div className="container relative mx-auto px-4 py-14 sm:py-20">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3 h-3 mr-1" /> Venezuela Rebuild Initiative
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight mb-4">
              Rebuilding Venezuela,<br />
              <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                one startup at a time.
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              100% transparent. Donations go directly to each startup's Stripe account through Stripe Connect.
              Help Venezuelan founders rebuild communities, infrastructure, and hope through technology.
            </p>

            <div className="grid grid-cols-3 gap-4 mt-8 max-w-lg">
              <StatCard label="Raised" value={`$${totals.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
              <StatCard label="Startups" value={String(companies.length)} />
              <StatCard label="Donors" value={String(totals.donors)} />
            </div>
          </div>
        </div>
      </header>

      {/* Startups grid */}
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold">Startups in the Initiative</h2>
          <span className="text-sm text-muted-foreground">{companies.length} active</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : companies.length === 0 ? (
          <Card className="tech-card border-0">
            <CardContent className="py-16 text-center text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
              No startups have joined the Venezuela Rebuild Initiative yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {companies.map((c) => {
              const raised = donations[c.id]?.total_cents ?? 0;
              const donors = donations[c.id]?.donors ?? 0;
              const pct = Math.min(100, (raised / DEFAULT_GOAL_CENTS) * 100);
              return (
                <Card key={c.id} className="tech-card border-0 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                  <div className="h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar className="h-14 w-14 border border-border">
                        <AvatarImage src={c.logo_url ?? undefined} alt={c.name} />
                        <AvatarFallback className="bg-amber-500/10 text-amber-700 font-semibold">
                          {c.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg leading-tight truncate">{c.name}</h3>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {c.industry && (
                            <Badge variant="secondary" className="text-[10px]">{c.industry}</Badge>
                          )}
                          <Badge className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border-0">
                            🇻🇪 Rebuild
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[3.6rem]">
                      {c.description || "Venezuelan startup contributing to the rebuild initiative through technology and innovation."}
                    </p>

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                      {c.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location}</span>}
                      {c.team_size != null && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.team_size} team</span>}
                      {c.website && (
                        <a href={c.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                          <Globe className="w-3 h-3" /> Site <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="mt-auto space-y-3">
                      <div>
                        <div className="flex items-baseline justify-between text-xs mb-1.5">
                          <span className="font-semibold text-foreground">
                            ${(raised / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-muted-foreground">
                            of ${(DEFAULT_GOAL_CENTS / 100).toLocaleString()} · {donors} {donors === 1 ? "donor" : "donors"}
                          </span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>

                      <Button
                        onClick={() => openDonate(c)}
                        className="w-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white border-0"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Donate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Donate dialog */}
      <Dialog open={!!activeCompany} onOpenChange={(o) => !o && setActiveCompany(null)}>
        <DialogContent className="bg-background backdrop-blur-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              Support {activeCompany?.name}
            </DialogTitle>
            <DialogDescription>
              Donations are processed via Stripe Connect and go directly to the startup. A 20% platform fee supports the program.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Amount (USD)</label>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {PRESETS.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    size="sm"
                    variant={amount === p ? "default" : "outline"}
                    onClick={() => setAmount(p)}
                    className={amount === p ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
                  >
                    ${p}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Custom amount"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Your name *</label>
              <Input value={donorName} onChange={(e) => setDonorName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email (optional, for receipt)</label>
              <Input type="email" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Message (optional)</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Leave a message of support..."
                rows={2}
              />
            </div>

            <Button
              onClick={handleDonate}
              disabled={processing}
              className="w-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white border-0"
            >
              {processing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting…</>
              ) : (
                <><Heart className="w-4 h-4 mr-2" /> Donate ${amount}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="tech-card border-0 rounded-xl p-4 bg-background/60 backdrop-blur-sm border border-border/40">
    <div className="text-2xl font-bold tracking-tight">{value}</div>
    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
  </div>
);

export default VenezuelaRebuild;
