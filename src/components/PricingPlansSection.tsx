import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Check, Rocket, Sparkles, Building2, GraduationCap, Zap, Crown, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GENIUS_PLANS } from "@/lib/genius-plans";
import { MEMBERSHIP_TIERS, type MembershipTier } from "@/lib/membership-tiers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const startupMemberships: {
  key: Exclude<MembershipTier, "free"> | "basic";
  icon: typeof Zap;
  tagline: string;
  bestFor: string;
  features: string[];
  highlight?: boolean;
  /** Renders a fixed-price card that deep-links to the Basic Plan brochure checkout. */
  basic?: boolean;
  /** Hides the price and routes the CTA to sales instead of checkout. */
  contactSales?: boolean;
}[] = [
  {
    key: "basic",
    basic: true,
    icon: Zap,
    tagline: "Full digital access, virtual events, community, and mentor interactions.",
    bestFor: "Remote-first teams or early MVP-stage founders",
    features: [
      "Post on the social feed & resource map",
      "Full resource library access",
      "Internships & volunteering roles",
      "Technology transfer & certified courses",
    ],
  },
  {
    key: "self_paced_office",
    icon: Building2,
    tagline: "Adds local Startup Factory HUB Desk coworking access all locations.",
    bestFor: "Founders needing flexible workspace + virtual resources",
    features: [
      "All community features",
      "Local Startup Factory HUB Desk coworking access all locations",
      "Earth Intelligence satellite data access",
      "Eligible for Accelerated Tier",
    ],
    highlight: true,
  },
  {
    key: "global_access",
    icon: Crown,
    tagline: "All platform features + unlimited global office access (130+ countries, 5,600+ sites).",
    bestFor: "Globally distributed teams, traveling founders",
    features: [
      "All features + Global office access across Startup Factory Hub network",
      "Mentor + event access",
      "Earth Intelligence satellite data access",
      "Eligible for Accelerated Tier",
    ],
  },
  {
    key: "corporate",
    contactSales: true,
    icon: Users,
    tagline: "For corporate innovation teams and growth-stage startups with regional teams.",
    bestFor: "Scale-ups or corporate venture units",
    features: [
      "All features + team dashboard",
      "Security — live CCTV surveillance feeds on the global map",
      "Global coworking access",
      "Soft Landing discount ($5,000) for global expansion",
    ],
  },
];


const acceleratorPlans = [
  {
    key: "mvp",
    name: "MVP Program",
    price: 5000,
    unit: "per startup · one-time payment",
    icon: Rocket,
    highlight: true,
    tagline: "From idea to market-ready product",
    features: [
      "Build your MVP with our studio team",
      "10 hours of 1:1 mentor sessions",
      "Advisory & pitch deck review",
      "Investor ecosystem access",
      "Open to startups worldwide",
    ],
    cta: "Apply now",
    path: "/auth",
  },
  {
    key: "aaas",
    name: "Accelerator-as-a-Service",
    price: null,
    unit: "custom",
    icon: Building2,
    highlight: false,
    tagline: "Launch your own accelerator",
    features: [
      "Full white-label accelerator infrastructure",
      "Cohort & application management",
      "Mentor network & investor access",
      "Events, demo days & pitch programming",
      "Dedicated partnership support",
    ],
    cta: "Talk to partnerships",
    path: "/forpartners",
  },
];

const PricingPlansSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [checkoutKey, setCheckoutKey] = useState<string | null>(null);

  const handleSubscribe = async (key: string, priceId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setCheckoutKey(key);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const { data, error } = await supabase.functions.invoke("create-membership-checkout", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Could not start checkout");
    } finally {
      setCheckoutKey(null);
    }
  };



  const shell =
    "group relative flex flex-col overflow-hidden rounded-3xl tech-card border-0 p-5 sm:p-6 transition-all duration-500 hover:-translate-y-1.5 sm:aspect-square";

  const Corners = () => (
    <>
      <span className="pointer-events-none absolute left-0 top-0 h-8 w-8 rounded-tl-3xl border-l border-t border-primary/40 opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-8 w-8 rounded-br-3xl border-b border-r border-primary/40 opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </>
  );

  const SectionTitle = ({
    icon: Icon,
    title,
    subtitle,
  }: {
    icon: typeof Bot;
    title: string;
    subtitle?: string;
  }) => (
    <div className="mb-7 sm:mb-9 flex flex-col items-center gap-3 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
          {title}
        </h3>
      </div>
      {subtitle && (
        <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );

  return (
    <section className="relative overflow-hidden py-12 sm:py-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[60%] w-[60%] bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.10)_0%,transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(hsl(var(--primary))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary))_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Plans & Programs
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Choose Your Path to Growth
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-lg">
            Genius AI plans to power your workflow, and accelerator programs to take your venture global.
          </p>
        </div>

        {/* Genius AI Plans */}
        <div className="mb-14 sm:mb-20">
          <SectionTitle icon={Bot} title="Genius AI Plans" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
            {Object.values(GENIUS_PLANS).map((plan) => {
              const isPro = plan.key === "pro";
              return (
                <div
                  key={plan.key}
                  className={`${shell} ${isPro ? "ring-1 ring-primary/60 shadow-[0_0_40px_-12px_hsl(var(--primary)/0.5)]" : ""}`}
                >
                  <Corners />
                  {isPro && (
                    <Badge className="absolute right-4 top-4 border border-primary/30 bg-primary/20 text-[10px] text-primary">
                      Popular
                    </Badge>
                  )}
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {plan.name}
                  </p>
                  <div className="mb-1 mt-2 flex items-end gap-1">
                    {plan.price === null ? (
                      <span className="text-2xl font-bold text-foreground">Custom</span>
                    ) : plan.price === 0 ? (
                      <span className="text-3xl font-bold text-foreground">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                        <span className="mb-1 text-xs text-muted-foreground">/mo</span>
                      </>
                    )}
                  </div>
                  <p className="mb-3 text-[11px] text-primary/80">{plan.allowance}</p>
                  <div className="mb-4 h-px w-full bg-gradient-to-r from-primary/30 to-transparent" />
                  <ul className="mb-4 flex-1 space-y-1.5 overflow-y-auto pr-1 text-xs">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-muted-foreground">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={isPro ? "hero" : "glass"}
                    className="w-full rounded-xl min-h-[44px] text-xs sm:text-sm"
                    onClick={() => navigate("/auth")}
                  >
                    {plan.price === null ? "Contact us" : plan.price === 0 ? "Start free" : "Get started"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Startup Memberships */}
        <div className="mb-14 sm:mb-20">
          <SectionTitle
            icon={Rocket}
            title="Startup Memberships"
            subtitle="Subscriptions for startups in the accelerator ecosystem — community, workspace and global office access."
          />

          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center rounded-full border border-border/50 bg-muted/40 p-1">
              {(["monthly", "yearly"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setBilling(mode)}
                  className={`rounded-full px-4 py-1.5 text-[11px] sm:text-xs font-medium transition-colors ${
                    billing === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {mode === "monthly" ? "Monthly" : "Yearly · save 10%"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
            {startupMemberships.map((plan) => {
              const tier = plan.basic ? null : MEMBERSHIP_TIERS[plan.key as Exclude<MembershipTier, "free">];
              const price = plan.basic
                ? billing === "monthly" ? 50 : 480
                : billing === "monthly" ? tier!.price : tier!.yearly_price;
              const priceId = tier ? (billing === "monthly" ? tier.price_id : tier.yearly_price_id) : null;
              const Icon = plan.icon;
              return (
                <div
                  key={plan.key}
                  className={`${shell} ${plan.highlight ? "ring-1 ring-primary/60 shadow-[0_0_40px_-12px_hsl(var(--primary)/0.5)]" : ""}`}
                >
                  <Corners />
                  {plan.highlight && (
                    <Badge className="absolute right-4 top-4 border border-primary/30 bg-primary/20 text-[10px] text-primary">
                      Popular
                    </Badge>
                  )}
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="text-sm font-semibold">{plan.basic ? "Basic Plan" : tier!.name}</h4>
                  <div className="mb-2 mt-1 flex items-end gap-1">
                    {plan.contactSales ? (
                      <span className="text-2xl sm:text-3xl font-bold text-foreground">Contact Sales</span>
                    ) : (
                      <>
                        <span className="text-2xl sm:text-3xl font-bold text-foreground">
                          ${price.toLocaleString()}
                        </span>
                        <span className="mb-1 text-xs text-muted-foreground">
                          {billing === "monthly" ? "/mo" : "/yr"}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mb-3 text-[11px] leading-snug text-primary/80">{plan.bestFor}</p>
                  <div className="mb-3 h-px w-full bg-gradient-to-r from-primary/30 to-transparent" />
                  <ul className="mb-4 flex-1 space-y-1.5 overflow-y-auto pr-1 text-xs">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-muted-foreground">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.highlight ? "hero" : "glass"}
                    className="w-full rounded-xl min-h-[44px] text-xs sm:text-sm"
                    disabled={checkoutKey === plan.key}
                    onClick={() => {
                      if (plan.basic) return navigate("/basic-plan");
                      if (plan.contactSales) {
                        window.location.href = "mailto:info@startupfactoryhub.com?subject=Corporate%20Plan%20Inquiry";
                        return;
                      }
                      if (priceId) handleSubscribe(plan.key, priceId);
                    }}
                  >
                    {checkoutKey === plan.key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : plan.basic ? (
                      "View Basic Plan"
                    ) : plan.contactSales ? (
                      "Contact Sales"
                    ) : user ? (
                      "Subscribe"
                    ) : (
                      "Sign in to subscribe"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Accelerator Programs */}
        <div>
          <SectionTitle icon={GraduationCap} title="Accelerator Programs" />

          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {acceleratorPlans.map((plan) => (
              <div
                key={plan.key}
                className={`${shell} ${plan.highlight ? "ring-1 ring-primary/60 shadow-[0_0_40px_-12px_hsl(var(--primary)/0.5)]" : ""}`}
              >
                <Corners />
                {plan.highlight && (
                  <Badge className="absolute right-4 top-4 border border-primary/30 bg-primary/20 text-[10px] text-primary">
                    Open
                  </Badge>
                )}
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                  <plan.icon className="h-5 w-5 text-primary" />
                </div>
                <h4 className="text-base font-semibold">{plan.name}</h4>
                <p className="mb-2 text-xs text-muted-foreground">{plan.tagline}</p>
                <div className="mb-3 flex items-end gap-1.5">
                  {plan.price === null ? (
                    <span className="text-2xl sm:text-3xl font-bold text-foreground">Custom</span>
                  ) : (
                    <>
                      <span className="text-2xl sm:text-3xl font-bold text-foreground">
                        ${plan.price.toLocaleString()}
                      </span>
                      <span className="mb-1 text-xs text-muted-foreground">{plan.unit}</span>
                    </>
                  )}
                </div>
                <div className="mb-3 h-px w-full bg-gradient-to-r from-primary/30 to-transparent" />
                <ul className="mb-4 flex-1 space-y-1.5 overflow-y-auto pr-1 text-xs">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlight ? "hero" : "glass"}
                  className="w-full rounded-xl min-h-[44px] text-xs sm:text-sm"
                  onClick={() => navigate(plan.path)}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingPlansSection;
