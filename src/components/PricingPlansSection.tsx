import { INVESTOR_BENEFITS } from "@/features/investor-plan/config/benefits";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GENIUS_PLANS } from "@/lib/genius-plans";
import { MEMBERSHIP_TIERS, type MembershipTier } from "@/lib/membership-tiers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PlanBrochureOverlay, { type PlanOverlayKind } from "@/components/PlanBrochureOverlay";
// Editorial imagery reused from the WTC brochure for the Investor Priority ad banner.
import investorBannerBg from "@/assets/wtc-institutional.jpg";

// Ultra-chromatic imagery, one per membership widget.
import imgPlanBasic from "@/assets/membership/plan-basic.jpg";
import imgPlanDesk from "@/assets/membership/plan-desk.jpg";
import imgPlanGlobal from "@/assets/membership/plan-global.jpg";
import imgPlanCorporate from "@/assets/membership/plan-corporate.jpg";
import imgAccInstitutional from "@/assets/membership/acc-institutional.jpg";
import imgAccCohorts from "@/assets/membership/acc-cohorts.jpg";
// Accelerator program imagery — venture studio floor for the MVP Program,
// institutional campus for the white-label Accelerator-as-a-Service track.
import imgProgramMvp from "@/assets/membership/venture-studio.jpg";
import imgProgramAaas from "@/assets/membership/campus-atrium.jpg";


const startupMemberships: {
  key: Exclude<MembershipTier, "free"> | "basic";
  image: string;
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
    image: imgPlanBasic,
    tagline: "Direct digital access into our global venture builder community, co-founder network, and startup ecosystem.",
    bestFor: "Early-stage founders, startup operators, advisors & builders joining the community",
    features: [
      "Venture builder community feed, investor access & resource map",
      "IP & technology access, tools and certified masterclasses",
      "Investor network introductions & mentor interaction",
      "Talent, internships, volunteering & partner perks",
    ],
  },

  {
    key: "self_paced_office",
    image: imgPlanDesk,
    tagline: "Hands-on venture building with dedicated workspace across Startup Factory Hub locations.",
    bestFor: "Active founders and core teams building their venture on-site with studio support",
    features: [
      "All Venture Network benefits included",
      "In-residence workspace & dedicated hub desks at all SFH locations",
      "Venture studio acceleration: sprints, pitch advisory & roadmap reviews",
      "Strategic Business Intelligence suite",
      "Priority eligibility for the Accelerated Tier and cohort funding",
    ],
    highlight: true,
  },
  {
    key: "global_access",
    image: imgPlanGlobal,
    tagline: "Global venture builder tier with worldwide private office presence and international investor access.",
    bestFor: "Scaling startups, cross-border founders, and venture partners",
    features: [
      "All Venture Resident features included",
      "Private office & global hub access in 130+ countries (5,800+ locations)",
      "Executive mentorship & priority investor access",
      "International soft landing & cross-border expansion support",
      "Priority demo day pitching & co-investment opportunities",
    ],
  },
  {
    key: "corporate",
    contactSales: true,
    image: imgPlanCorporate,
    tagline: "Complete venture building and intelligence infrastructure for enterprise innovation teams.",
    bestFor: "Scale-ups, corporate venture capital (CVC) units, and regional teams",
    features: [
      "Multi-seat team management dashboard",
      "Enterprise soft landing package ($5,000 credit) for global market entry",
      "Global executive workspace & facility deployment",
      "Strategic Business Intelligence & live security monitoring on the global map",
    ],
  },
];

/**
 * Accelerator section — one unified 4-card grid that mixes organization
 * memberships ($5,000/mo Institutional + quote-based Cohorts) with the two
 * accelerator programs (MVP Program, Accelerator-as-a-Service) so buyers see
 * every accelerator-facing offer side by side. Cards with `path` navigate;
 * the rest fall back to a sales email.
 */
const acceleratorMemberships: {
  key: string;
  name: string;
  /** null renders "Contact Sales" / the `priceLabel` instead of a number. */
  price: number | null;
  /** Suffix shown next to the price (e.g. "/mo" or "per startup · one-time"). */
  priceUnit: string;
  /** Exact price label when the card must not show "Contact Sales". */
  priceLabel?: string;
  image: string;
  bestFor: string;
  features: string[];
  highlight?: boolean;
  cta: string;
  /** When set, the CTA navigates instead of opening a sales email. */
  path?: string;
}[] = [
  {
    key: "acc_institutional",
    name: "Institutional",
    price: 5000,
    priceUnit: "/mo",
    image: imgAccInstitutional,
    bestFor: "Institutional programs and corporate venture units",
    features: [
      "Full accelerator infrastructure",
      "Dedicated partnership manager",
      "Strategic Business Intelligence suite access",
      "Global office & coworking network access",
    ],
    highlight: true,
    cta: "Talk to us",
  },
  {
    key: "mvp",
    name: "MVP Program",
    price: 5000,
    priceUnit: "per startup · one-time payment",
    image: imgProgramMvp,
    bestFor: "From idea to market-ready product in 4 weeks",
    features: [
      "Build your MVP with our studio team",
      "10 hours of 1:1 mentor sessions",
      "Advisory & pitch deck review",
      "Investor ecosystem access",
    ],
    cta: "Apply now",
    path: "/auth",
  },
  {
    key: "aaas",
    name: "Accelerator-as-a-Service",
    price: null,
    priceUnit: "custom",
    priceLabel: "Custom",
    image: imgProgramAaas,
    bestFor: "Launch your own accelerator on our infrastructure",
    features: [
      "White-label accelerator infrastructure",
      "Cohort & application management",
      "Mentor network & investor access",
      "Events, demo days & pitch programming",
    ],
    cta: "Talk to partnerships",
    path: "/forpartners",
  },
  {
    key: "acc_cohorts",
    name: "Cohorts",
    price: null,
    priceUnit: "",
    image: imgAccCohorts,
    bestFor: "Extending platform benefits to all your cohort startups",
    features: [
      "Seats for every startup in your batch",
      "Full member benefits & perks for cohort founders",
      "Shared cohort dashboard & progress tracking",
      "Custom volume agreement",
    ],
    cta: "Contact Sales",
  },
];

type PlanTabKey = "featured" | "ai" | "startup" | "accelerator" | "investor";
const PLAN_TABS: { key: PlanTabKey; label: string }[] = [
  { key: "featured", label: "Get Started" },
  { key: "ai", label: "Genius AI Plans" },
  { key: "startup", label: "Startup, Student & Advisor" },
  { key: "accelerator", label: "Accelerators & Programs" },
  { key: "investor", label: "Investors & Funds" },
];

const PricingPlansSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [checkoutKey, setCheckoutKey] = useState<string | null>(null);
  /** Which plan brochure flipbook is open as a popup over this page. */
  const [planTab, setPlanTab] = useState<PlanTabKey>("featured");
  const [planOverlay, setPlanOverlay] = useState<PlanOverlayKind | null>(null);

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
    "group relative flex flex-col overflow-hidden rounded-3xl tech-card border-0 p-5 sm:p-6 transition-all duration-500 hover:-translate-y-1.5 sm:min-h-[27rem]";

  const Corners = () => (
    <>
      <span className="pointer-events-none absolute left-0 top-0 h-8 w-8 rounded-tl-3xl border-l border-t border-primary/40 opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-8 w-8 rounded-br-3xl border-b border-r border-primary/40 opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </>
  );

  const SectionTitle = ({
    title,
    subtitle,
  }: {
    title: string;
    subtitle?: string;
  }) => (
    <div className="mb-7 sm:mb-9 flex flex-col items-center gap-3 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5">
        <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
          {title}
        </h3>
      </div>
      {subtitle && (
        <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );

  /**
   * Banner-style media header used by every membership widget. Mirrors the
   * Investor Priority banner: ultra-chromatic imagery, animated zoom + sheen.
   */
  const PlanMedia = ({ src, alt }: { src: string; alt: string }) => (
    <div className="relative -mx-5 -mt-5 mb-4 h-28 overflow-hidden sm:-mx-6 sm:-mt-6 sm:h-32">
      <img
        src={src}
        alt={alt}
        width={1024}
        height={640}
        loading="lazy"
        className="h-full w-full object-cover saturate-150 transition-transform duration-[1200ms] ease-out group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent" />
      <div className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 bg-[linear-gradient(115deg,transparent_35%,hsl(var(--primary)/0.35)_50%,transparent_65%)]" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
    </div>
  );


  const renderAi = (plan: (typeof GENIUS_PLANS)[keyof typeof GENIUS_PLANS]) => {
              const isPro = plan.key === "pro";
                  return (
                <div
                  key={plan.key}
                  className={`${shell} ${isPro ? "ring-1 ring-primary/60 shadow-[0_0_40px_-12px_hsl(var(--primary)/0.5)]" : ""}`}
                >
                  <Corners />
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
  };

  const renderStartup = (plan: (typeof startupMemberships)[number]) => {
              const tier = plan.basic ? null : MEMBERSHIP_TIERS[plan.key as Exclude<MembershipTier, "free">];
              const price = plan.basic
                ? billing === "monthly" ? 50 : 480
                : billing === "monthly" ? tier!.price : tier!.yearly_price;
              const priceId = tier ? (billing === "monthly" ? tier.price_id : tier.yearly_price_id) : null;
                  return (
                <div
                  key={plan.key}
                  className={`${shell} ${plan.highlight ? "ring-1 ring-primary/60 shadow-[0_0_40px_-12px_hsl(var(--primary)/0.5)]" : ""}`}
                >
                  <Corners />
                  {plan.highlight && (
                    <Badge className="absolute right-4 top-4 z-10 border border-primary/30 bg-primary/20 text-[10px] text-primary">
                      Popular
                    </Badge>
                  )}
                  <PlanMedia src={plan.image} alt={plan.basic ? "Venture Network" : tier!.name} />
                  <h4 className="text-sm font-semibold">{plan.basic ? "Venture Network" : tier!.name}</h4>
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
                      if (plan.basic) return setPlanOverlay("basic");
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
                      "View Venture Network"
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
  };

  const renderAcc = (plan: (typeof acceleratorMemberships)[number]) => (
                <div
                  key={plan.key}
                  className={`${shell} ${plan.highlight ? "ring-1 ring-primary/60 shadow-[0_0_40px_-12px_hsl(var(--primary)/0.5)]" : ""}`}
                >
                  <Corners />
                  {plan.highlight && (
                    <Badge className="absolute right-4 top-4 z-10 border border-primary/30 bg-primary/20 text-[10px] text-primary">
                      Popular
                    </Badge>
                  )}
                  <PlanMedia src={plan.image} alt={plan.name} />
                  <h4 className="text-sm font-semibold">{plan.name}</h4>
                  <div className="mb-2 mt-1 flex items-end gap-1">
                    {plan.price === null ? (
                      <span className="text-2xl sm:text-3xl font-bold text-foreground">
                        {plan.priceLabel ?? "Contact Sales"}
                      </span>
                    ) : (
                      <>
                        <span className="text-2xl sm:text-3xl font-bold text-foreground">
                          ${plan.price.toLocaleString()}
                        </span>
                        {plan.priceUnit && (
                          <span className="mb-1 text-xs text-muted-foreground">{plan.priceUnit}</span>
                        )}
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
                    onClick={() => {
                      if (plan.path) return navigate(plan.path);
                      window.location.href = `mailto:info@startupfactoryhub.com?subject=${encodeURIComponent(
                        `Accelerator Membership — ${plan.name}`,
                      )}`;
                    }}
                  >
                    {plan.cta}
                  </Button>
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

        {/* Unified plans widget with tabs */}
        <div className="mb-14 sm:mb-20">
          <div className="mb-6 flex justify-center">
            <div className="inline-flex flex-wrap justify-center gap-1 rounded-full border border-border/50 bg-muted/40 p-1">
              {PLAN_TABS.map((tb) => (
                <button
                  key={tb.key}
                  onClick={() => setPlanTab(tb.key)}
                  className={`rounded-full px-4 py-1.5 text-[11px] sm:text-xs font-medium transition-colors ${
                    planTab === tb.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tb.label}
                </button>
              ))}
            </div>
          </div>

          {(planTab === "featured" || planTab === "startup") && (
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
          )}

          {planTab === "startup" && (
            <p className="mx-auto mb-6 max-w-2xl text-center text-xs sm:text-sm text-muted-foreground">
              Subscriptions for startups, students and advisors in the ecosystem — community, workspace and global office access. Advisors join Venture Network at $250/mo.
            </p>
          )}
          {planTab === "accelerator" && (
            <p className="mx-auto mb-6 max-w-2xl text-center text-xs sm:text-sm text-muted-foreground">
              For accelerators, incubators and innovation programs — memberships plus the MVP Program and Accelerator-as-a-Service.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
            {planTab === "featured" && (
              <>
                {renderAi(GENIUS_PLANS.free)}
                {renderAi(GENIUS_PLANS.starter)}
                {startupMemberships.filter((p) => p.key === "basic" || p.key === "self_paced_office").map(renderStartup)}
              </>
            )}
            {planTab === "ai" && Object.values(GENIUS_PLANS).map(renderAi)}
            {planTab === "startup" && startupMemberships.map(renderStartup)}
            {planTab === "accelerator" && acceleratorMemberships.map(renderAcc)}
          </div>
          {planTab === "investor" && (
            <div className="tech-card border-0 mx-auto max-w-3xl rounded-2xl p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold mb-1">Investor Priority</h3>
              <p className="text-sm text-muted-foreground mb-4">Priority membership for angels, funds and syndicates.</p>
              <ul className="grid gap-2 sm:grid-cols-2 mb-6">
                {INVESTOR_BENEFITS.map((b) => (
                  <li key={b.key} className="flex gap-2 text-sm"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span><span className="font-medium">{b.label}</span> — <span className="text-muted-foreground">{b.description}</span></span></li>
                ))}
              </ul>
              <button onClick={() => navigate("/investor-plan")} className="w-full sm:w-auto rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">View Investor Plan</button>
            </div>
          )}
        </div>



      </div>

      {/* Investor Priority — full-bleed advertising banner opening the flipbook brochure */}
      <div className="relative z-10 mt-14 sm:mt-20">
        <button
          type="button"
          onClick={() => setPlanOverlay("investor")}
          className="group relative block w-full overflow-hidden border-y border-primary/20 text-left"
        >
          {/* Imagery layer */}
          <div className="absolute inset-0">
            <img
              src={investorBannerBg}
              alt="Institutional investor network"
              className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
          </div>

          {/* Full-bleed animated glassmorphic overlay — spans the entire banner, not a boxed square */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Slow-spinning transparent conic sheen */}
            <div className="absolute -inset-1/2 animate-[spin_26s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,hsl(var(--primary)/0.10)_100deg,transparent_200deg,hsl(var(--primary)/0.06)_280deg,transparent_360deg)] opacity-70" />
            {/* Soft radial glows */}
            <div className="absolute right-0 top-0 h-full w-3/4 bg-[radial-gradient(circle_at_75%_25%,hsl(var(--primary)/0.18)_0%,transparent_55%)]" />
            <div className="absolute left-0 bottom-0 h-3/4 w-1/2 bg-[radial-gradient(circle_at_20%_80%,hsl(var(--primary)/0.10)_0%,transparent_50%)]" />
            {/* Fine grid */}
            <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(hsl(var(--primary))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary))_1px,transparent_1px)] [background-size:44px_44px]" />
            {/* Floating glass orbs */}
            <div className="absolute right-[12%] top-[18%] h-28 w-28 rounded-full bg-primary/[0.10] blur-3xl animate-pulse" />
            <div className="absolute right-[28%] bottom-[22%] h-36 w-36 rounded-full bg-primary/[0.08] blur-3xl animate-pulse [animation-delay:1s]" />
            <div className="absolute right-[6%] bottom-[12%] h-20 w-20 rounded-full bg-primary/[0.12] blur-2xl animate-pulse [animation-delay:2s]" />
            {/* Orbit rings */}
            <div className="absolute right-[20%] top-1/2 h-48 w-48 -translate-y-1/2 rounded-full border border-primary/10" />
            <div className="absolute right-[16%] top-1/2 h-64 w-64 -translate-y-1/2 rounded-full border border-primary/5" />
            {/* Rising bars along the right edge */}
            <div className="absolute inset-x-4 bottom-0 flex items-end justify-end gap-1.5 sm:inset-x-10">
              {[28, 46, 34, 62, 50, 78, 68, 92, 58, 84].map((h, i) => (
                <span
                  key={i}
                  className="w-2 sm:w-3 rounded-t-sm bg-gradient-to-t from-primary/50 to-primary/20 opacity-50 transition-all duration-700 group-hover:opacity-90"
                  style={{ height: `${h * 0.55}px`, animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
            {/* Sweep sheen on hover */}
            <div className="absolute inset-0 -translate-x-full bg-[linear-gradient(115deg,transparent_35%,hsl(var(--primary)/0.14)_50%,transparent_65%)] transition-transform duration-1000 group-hover:translate-x-full" />
          </div>

          <div className="relative z-10 mx-auto flex max-w-7xl flex-col px-6 py-8 sm:px-10 sm:py-12">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-primary">
                Invitation only
              </p>
              <h4 className="mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                  Investor Priority
                </span>
              </h4>
              <p className="mt-3 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Unique dealflow before it goes public, early-stage allocations, shared-risk syndicates
                and a seat inside every cohort we run.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Exclusive dealflow", "Early allocations", "Shared-risk syndicates", "Cohort access"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-primary"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10 border-t border-primary/15 bg-background/50 backdrop-blur-sm">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary sm:text-sm">
                Open the Investor Priority brochure
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
            </div>
          </div>
        </button>
      </div>


      <PlanBrochureOverlay plan={planOverlay} onClose={() => setPlanOverlay(null)} />
    </section>
  );
};

export default PricingPlansSection;
